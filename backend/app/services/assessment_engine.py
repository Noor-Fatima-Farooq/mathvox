# app/services/assessment_engine.py

import json
import os
import re
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from groq import Groq

from app.services.curriculum_config import (
    ASSESSMENT_CONFIG,
    CURRICULUM_CONFIG,
    LEVEL_LABELS,
    LEVEL_ORDER,
    NEXT_LEVEL_MAP,
    SKILL_LABELS,
    SKILL_ORDER,
    SUBTOPIC_COUNTS,
    get_subtopic_entry,
    list_subtopic_ids,
)
from app.models.user_skill import (
    CurriculumCycle,
    SubtopicQuiz,
    UserSubtopicProgress,
    UserSkillLevel,
)
from app.services.test_streak import record_daily_test_completed, streak_status

MAX_RETRY_ATTEMPTS = 3
MAX_FAILED_ATTEMPTS = MAX_RETRY_ATTEMPTS + 1
RETRY_COOLDOWN = timedelta(hours=24)


def _retry_state(
    attempts: int,
    passed: bool,
    updated_at: datetime | None,
    now: datetime | None = None,
) -> dict:
    now = now or datetime.utcnow()
    retries_used = max(0, attempts - 1)
    state = {
        "attempt_limit": MAX_RETRY_ATTEMPTS,
        "retries_used": retries_used,
        "attempts_remaining": None if passed else MAX_RETRY_ATTEMPTS,
        "retry_available_at": None,
        "retry_cooldown_active": False,
        "retry_after_cooldown_available": False,
    }
    if passed:
        return state

    if attempts < MAX_FAILED_ATTEMPTS:
        state["attempts_remaining"] = MAX_RETRY_ATTEMPTS - retries_used
        return state

    available_at = (updated_at or datetime.utcnow()) + RETRY_COOLDOWN
    if now < available_at:
        state["attempts_remaining"] = 0
        state["retry_available_at"] = available_at.isoformat() + "Z"
        state["retry_cooldown_active"] = True
    else:
        state["attempts_remaining"] = 1
        state["retry_after_cooldown_available"] = True
    return state


class QuestionGenerationError(RuntimeError):
    pass


def get_current_curriculum_cycle(db: Session, user_id: int) -> CurriculumCycle:
    local_now = datetime.now().astimezone()
    local_timezone = local_now.tzinfo
    current_week = local_now.date().isocalendar()[:2]
    cycle = db.query(CurriculumCycle).filter_by(
        user_id=user_id, completed_at=None
    ).order_by(CurriculumCycle.cycle_number.desc()).first()
    if cycle:
        started_at = cycle.started_at
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)
        cycle_week = started_at.astimezone(local_timezone).date().isocalendar()[:2]
        if cycle_week == current_week:
            return cycle

        progress_rows = db.query(UserSubtopicProgress).filter_by(
            user_id=user_id, cycle_id=cycle.id
        ).all()
        earned_marks = sum(row.current_score or 0 for row in progress_rows)
        total_marks = sum(
            len(skill_data["subtopics"]) * ASSESSMENT_CONFIG["total_marks"]
            for level_data in CURRICULUM_CONFIG.values()
            for skill_data in level_data.values()
        )
        cycle.final_percentage = (
            round(earned_marks / total_marks * 100, 1) if total_marks else 0
        )
        cycle.completed_at = datetime.utcnow()
        db.commit()

    latest = db.query(CurriculumCycle).filter_by(user_id=user_id).order_by(
        CurriculumCycle.cycle_number.desc()
    ).first()
    legacy_data_exists = latest is None
    cycle = CurriculumCycle(
        user_id=user_id,
        cycle_number=(latest.cycle_number + 1) if latest else 1,
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    if legacy_data_exists:
        db.query(UserSubtopicProgress).filter_by(user_id=user_id).update(
            {"cycle_id": cycle.id}, synchronize_session=False
        )
        db.query(UserSkillLevel).filter_by(user_id=user_id).update(
            {"cycle_id": cycle.id}, synchronize_session=False
        )
        db.query(SubtopicQuiz).filter_by(user_id=user_id).update(
            {"cycle_id": cycle.id}, synchronize_session=False
        )
        db.commit()
    return cycle


def _normalize_questions(raw, question_count: int) -> list:
    items = raw if isinstance(raw, list) else raw.get("questions", [])
    cleaned = []
    for i, q in enumerate(items[:question_count]):
        options = [str(o) for o in (q.get("options") or [])][:4]
        if len(options) < 4:
            continue
        correct = str(q.get("correct_answer") or options[0])
        if correct not in options:
            correct = options[0]
        cleaned.append({
            "id": i + 1,
            "question": str(q.get("question") or f"Question {i + 1}"),
            "options": options,
            "correct_answer": correct,
        })
    return cleaned


def generate_subtopic_questions(
    level: str, skill: str, subtopic: str, previous_questions: list[str] | None = None
) -> list:
    """Generate five multiple-choice questions with the configured Groq model."""
    subtopic_data = get_subtopic_entry(level, skill, subtopic)

    if not subtopic_data:
        raise ValueError(f"Invalid subtopic '{subtopic}' for level '{level}' and skill '{skill}'")

    concepts = subtopic_data.get("concepts", [])
    question_count = ASSESSMENT_CONFIG["question_count"]
    marks_per_question = ASSESSMENT_CONFIG["marks_per_question"]
    previous_examples = "\n".join(f"- {question}" for question in (previous_questions or [])[-40:])

    prompt = f"""
        You are an expert math tutor creating a dynamic assessment for MathVox.
        
        Target Student Level: {level.upper()}
        Skill Domain: {skill.replace('_', ' ').title()}
        Subtopic Name: {subtopic_data.get('name')}
        Learning Concepts to Evaluate: {', '.join(concepts)}
        
        Requirements:
        1. Generate exactly {question_count} distinct multiple-choice questions.
        2. Each question must evaluate one or more of the specified learning concepts.
        3. Each question is worth {marks_per_question} marks.
        4. Provide exactly 4 options per question with 1 correct answer.
        5. correct_answer must match one option string exactly.
        6. Do not repeat or closely paraphrase any question from previous weeks:
        {previous_examples or "No previous questions for this topic."}
        Keep evaluating the same concepts, but use fresh values, examples, and wording.
        
        Return STRICTLY valid JSON with no markdown block formatting.
        Follow this exact JSON structure:
        [
          {{
            "id": 1,
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A"
          }}
        ]
        """

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise QuestionGenerationError(
            "Groq is not configured. Set GROQ_API_KEY in the backend environment and try again."
        )

    try:
        client = Groq(api_key=groq_api_key)
        model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        previous_normalized = {
            re.sub(r"\s+", " ", question.casefold()).strip()
            for question in (previous_questions or [])
        }
        for attempt in range(2):
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a precise educational question generator that returns raw valid JSON array only."},
                    {
                        "role": "user",
                        "content": prompt + (
                            "\nDo not reuse any previously submitted question, even with different punctuation."
                            if attempt
                            else ""
                        ),
                    },
                ],
                temperature=0.5 + attempt * 0.2,
            )
            content = completion.choices[0].message.content or "[]"
            cleaned = re.sub(r"^```(?:json)?\s*", "", content.strip())
            cleaned = re.sub(r"\s*```$", "", cleaned)
            questions = _normalize_questions(json.loads(cleaned), question_count)
            if len(questions) == question_count and not any(
                re.sub(r"\s+", " ", question["question"].casefold()).strip()
                in previous_normalized
                for question in questions
            ):
                return questions
        print("[MathVox Engine] Groq returned an incomplete or repeated assessment.")
    except Exception as e:
        print(f"[MathVox Engine] Groq question generation error: {e}")

    raise QuestionGenerationError(
        "Groq could not generate a valid assessment. Check the GROQ_MODEL setting and Groq service, then try again."
    )


def public_questions(questions: list) -> list:
    return [
        {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "marks": ASSESSMENT_CONFIG["marks_per_question"],
        }
        for q in questions
    ]


def ensure_beginner_unlocked(db: Session, user_id: int) -> None:
    """Every skill starts unlocked at Beginner (PDF: independent per-skill path)."""
    cycle = get_current_curriculum_cycle(db, user_id)
    changed = False
    for skill in SKILL_ORDER:
        row = db.query(UserSkillLevel).filter_by(
            user_id=user_id, skill_id=skill, level="beginner",
            cycle_id=cycle.id,
        ).first()
        if not row:
            db.add(
                UserSkillLevel(
                    user_id=user_id,
                    cycle_id=cycle.id,
                    skill_id=skill,
                    level="beginner",
                    is_unlocked=True,
                    is_completed=False,
                )
            )
            changed = True
        elif not row.is_unlocked:
            row.is_unlocked = True
            changed = True
    if changed:
        db.commit()


def is_skill_level_unlocked(db: Session, user_id: int, skill: str, level: str) -> bool:
    if level == "beginner":
        return True
    cycle = get_current_curriculum_cycle(db, user_id)
    row = db.query(UserSkillLevel).filter_by(
        user_id=user_id, cycle_id=cycle.id, skill_id=skill, level=level
    ).first()
    return bool(row and row.is_unlocked)


def start_subtopic_quiz(db: Session, user_id: int, level: str, skill: str, subtopic: str) -> dict:
    if skill not in SKILL_ORDER or level not in LEVEL_ORDER:
        raise ValueError("Invalid skill or level")
    if not get_subtopic_entry(level, skill, subtopic):
        raise ValueError(f"Invalid subtopic '{subtopic}' for {level}/{skill}")

    ensure_beginner_unlocked(db, user_id)
    if not is_skill_level_unlocked(db, user_id, skill, level):
        raise PermissionError(
            f"{LEVEL_LABELS[level]} {SKILL_LABELS[skill]} is locked. "
            "Master the previous level of this skill first."
        )

    cycle = get_current_curriculum_cycle(db, user_id)
    progress = db.query(UserSubtopicProgress).filter_by(
        user_id=user_id,
        cycle_id=cycle.id,
        skill_id=skill,
        subtopic_id=subtopic,
        level=level,
    ).first()
    if progress and progress.passed:
        raise PermissionError("This subtopic is already passed and cannot be retaken.")

    active_quiz = db.query(SubtopicQuiz).filter_by(
        user_id=user_id,
        cycle_id=cycle.id,
        level=level,
        skill_id=skill,
        subtopic_id=subtopic,
        status="active",
    ).order_by(SubtopicQuiz.created_at.desc()).first()
    if active_quiz:
        questions = json.loads(active_quiz.questions_json)
        return _serialize_subtopic_quiz(active_quiz, questions)

    if progress and not progress.passed:
        retry_state = _retry_state(progress.attempts, False, progress.updated_at)
        if retry_state["retry_cooldown_active"]:
            retry_available_at = datetime.fromisoformat(
                retry_state["retry_available_at"].removesuffix("Z")
            )
            remaining = retry_available_at - datetime.utcnow()
            hours = max(1, int((remaining.total_seconds() + 3599) // 3600))
            raise PermissionError(
                f"You have used your first assessment and all {MAX_RETRY_ATTEMPTS} retries. Practice and try again in {hours} hours."
            )

    previous_question_rows = db.query(SubtopicQuiz).filter_by(
        user_id=user_id,
        skill_id=skill,
        subtopic_id=subtopic,
        level=level,
        status="submitted",
    ).order_by(SubtopicQuiz.submitted_at.desc()).limit(40).all()
    previous_questions = [
        question.get("question", "")
        for previous in previous_question_rows
        for question in json.loads(previous.questions_json)
        if question.get("question")
    ]
    questions = generate_subtopic_questions(
        level, skill, subtopic, previous_questions=previous_questions
    )

    db.query(SubtopicQuiz).filter_by(
        user_id=user_id,
        level=level,
        skill_id=skill,
        subtopic_id=subtopic,
        status="active",
    ).update({"status": "expired"})

    quiz = SubtopicQuiz(
        user_id=user_id,
        level=level,
        skill_id=skill,
        subtopic_id=subtopic,
        questions_json=json.dumps(questions),
        answers_json="{}",
        current_index=0,
        status="active",
        cycle_id=cycle.id,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return _serialize_subtopic_quiz(quiz, questions)


def _serialize_subtopic_quiz(quiz: SubtopicQuiz, questions: list) -> dict:
    return {
        "quiz_id": quiz.id,
        "level": quiz.level,
        "skill": quiz.skill_id,
        "skill_name": SKILL_LABELS.get(quiz.skill_id, quiz.skill_id),
        "subtopic": quiz.subtopic_id,
        "subtopic_name": get_subtopic_entry(
            quiz.level, quiz.skill_id, quiz.subtopic_id
        ).get("name", quiz.subtopic_id),
        "total_marks": ASSESSMENT_CONFIG["total_marks"],
        "passing_marks": ASSESSMENT_CONFIG["passing_marks"],
        "question_count": ASSESSMENT_CONFIG["question_count"],
        "marks_per_question": ASSESSMENT_CONFIG["marks_per_question"],
        "questions": public_questions(questions),
        "answers": json.loads(quiz.answers_json or "{}"),
        "current_index": quiz.current_index or 0,
        "created_at": (quiz.created_at or datetime.utcnow()).isoformat() + "Z",
        "cycle_id": quiz.cycle_id,
    }


def get_active_subtopic_quiz(db: Session, user_id: int) -> dict | None:
    cycle = get_current_curriculum_cycle(db, user_id)
    quiz = db.query(SubtopicQuiz).filter_by(
        user_id=user_id, cycle_id=cycle.id, status="active"
    ).order_by(SubtopicQuiz.created_at.desc()).first()
    if not quiz:
        return None
    return _serialize_subtopic_quiz(quiz, json.loads(quiz.questions_json))


def save_subtopic_quiz_progress(
    db: Session, user_id: int, quiz_id: int, answers: dict, current_index: int
) -> dict:
    quiz = db.query(SubtopicQuiz).filter_by(
        id=quiz_id, user_id=user_id
    ).first()
    if not quiz:
        raise ValueError("Active assessment not found")
    if quiz.status == "submitted":
        return {
            "status": "success",
            "already_submitted": True,
            "current_index": quiz.current_index,
        }
    if quiz.status != "active":
        raise ValueError("Assessment is not active")

    questions = json.loads(quiz.questions_json)
    valid_ids = {str(question["id"]) for question in questions}
    cleaned_answers = {
        str(question_id): str(answer)
        for question_id, answer in answers.items()
        if str(question_id) in valid_ids
    }
    if not 0 <= current_index < max(len(questions), 1):
        raise ValueError("Invalid current question")
    quiz.answers_json = json.dumps(cleaned_answers)
    quiz.current_index = current_index
    db.commit()
    return {"status": "success", "current_index": quiz.current_index}


def _serialize_submitted_quiz_result(db: Session, quiz: SubtopicQuiz) -> dict:
    questions = json.loads(quiz.questions_json)
    answers = json.loads(quiz.answers_json or "{}")
    breakdown = []
    calculated_score = 0
    for question in questions:
        user_answer = answers.get(str(question["id"]))
        is_correct = (
            str(user_answer or "").strip()
            == str(question["correct_answer"]).strip()
        )
        marks = (
            ASSESSMENT_CONFIG["marks_per_question"] if is_correct else 0
        )
        calculated_score += marks
        breakdown.append({
            "question_id": question["id"],
            "question": question["question"],
            "user_answer": user_answer,
            "correct_answer": question["correct_answer"],
            "is_correct": is_correct,
            "marks": marks,
        })

    score = quiz.score if quiz.score is not None else calculated_score
    passed = (
        quiz.passed
        if quiz.passed is not None
        else score >= ASSESSMENT_CONFIG["passing_marks"]
    )
    progress = db.query(UserSubtopicProgress).filter_by(
        user_id=quiz.user_id,
        cycle_id=quiz.cycle_id,
        level=quiz.level,
        skill_id=quiz.skill_id,
        subtopic_id=quiz.subtopic_id,
    ).first()
    attempts = progress.attempts if progress else 1
    retry_state = _retry_state(
        attempts, bool(progress and progress.passed),
        progress.updated_at if progress else quiz.submitted_at,
    )
    required_ids = list_subtopic_ids(quiz.level, quiz.skill_id)
    passed_ids = {
        row.subtopic_id
        for row in db.query(UserSubtopicProgress).filter_by(
            user_id=quiz.user_id,
            cycle_id=quiz.cycle_id,
            skill_id=quiz.skill_id,
            level=quiz.level,
            passed=True,
        ).all()
    }
    skill_mastered = bool(required_ids) and set(required_ids).issubset(passed_ids)
    next_level = NEXT_LEVEL_MAP.get(quiz.level) if skill_mastered else None
    next_level_record = (
        db.query(UserSkillLevel).filter_by(
            user_id=quiz.user_id,
            cycle_id=quiz.cycle_id,
            skill_id=quiz.skill_id,
            level=next_level,
        ).first()
        if next_level
        else None
    )
    cycle = db.query(CurriculumCycle).filter_by(id=quiz.cycle_id).first()

    return {
        "score": score,
        "total_marks": ASSESSMENT_CONFIG["total_marks"],
        "percentage": round(
            score / ASSESSMENT_CONFIG["total_marks"] * 100, 1
        ),
        "passed": passed,
        "status": "passed" if passed else "needs_improvement",
        "can_retry": not passed and retry_state["attempts_remaining"] != 0,
        "attempts": attempts,
        **retry_state,
        "performance": (
            "excellent"
            if score == ASSESSMENT_CONFIG["total_marks"]
            else "good"
            if passed
            else "needs_improvement"
        ),
        "cycle_completed": False,
        "cycle_percentage": None,
        "next_cycle_number": None,
        "cycle_number": cycle.cycle_number if cycle else None,
        "retry_wait_hours": (
            24 if retry_state["retry_cooldown_active"] else 0
        ),
        "skill_mastered": skill_mastered,
        "next_level_unlocked": bool(next_level_record and next_level_record.is_unlocked),
        "next_level": (
            LEVEL_LABELS.get(next_level, next_level)
            if next_level_record and next_level_record.is_unlocked
            else None
        ),
        "level": quiz.level,
        "skill": quiz.skill_id,
        "skill_name": SKILL_LABELS.get(quiz.skill_id, quiz.skill_id),
        "subtopic": quiz.subtopic_id,
        "subtopic_name": get_subtopic_entry(
            quiz.level, quiz.skill_id, quiz.subtopic_id
        ).get("name", quiz.subtopic_id),
        "breakdown": breakdown,
    }


def process_subtopic_submission(
    db: Session,
    user_id: int,
    level: str,
    skill: str,
    subtopic: str,
    user_answers: dict,
    questions: list = None,
    quiz_id: int = None,
):
    """
    Mark out of 50 (10 per question), pass at 40/50 (80%).
    Latest passing score becomes current_score. Retry is always allowed.
    Passing all subtopics of a skill at this level unlocks the next level of the same skill.
    """
    if quiz_id is not None:
        quiz = db.query(SubtopicQuiz).filter_by(id=quiz_id, user_id=user_id).first()
        if not quiz:
            raise ValueError("Quiz not found")
        if quiz.status == "submitted":
            return _serialize_submitted_quiz_result(db, quiz)
        if quiz.status != "active":
            raise ValueError("This assessment was already submitted. Start a retry for a new paper.")
        questions = json.loads(quiz.questions_json)
        level, skill, subtopic = quiz.level, quiz.skill_id, quiz.subtopic_id
        cycle = get_current_curriculum_cycle(db, user_id)
        if quiz.cycle_id != cycle.id:
            raise ValueError("This assessment belongs to a completed curriculum cycle.")
    else:
        cycle = get_current_curriculum_cycle(db, user_id)

    if not questions:
        raise ValueError("No questions to mark")

    missing_answers = [
        str(question["id"])
        for question in questions
        if not str(
            user_answers.get(str(question["id"]))
            or user_answers.get(question["id"])
            or ""
        ).strip()
    ]
    if missing_answers:
        raise ValueError("Please answer every question before submitting.")

    marks_per_q = ASSESSMENT_CONFIG["marks_per_question"]
    passing_threshold = ASSESSMENT_CONFIG["passing_marks"]

    total_score = 0
    results_breakdown = []
    submitted_answers = {}

    for q in questions:
        q_id = str(q["id"])
        submitted_ans = user_answers.get(q_id) or user_answers.get(q["id"])
        submitted_answers[q_id] = str(submitted_ans).strip()
        is_correct = str(submitted_ans or "").strip() == str(q["correct_answer"]).strip()
        score_for_q = marks_per_q if is_correct else 0
        total_score += score_for_q
        results_breakdown.append({
            "question_id": q["id"],
            "question": q["question"],
            "user_answer": submitted_ans,
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "marks": score_for_q,
        })

    is_passed = total_score >= passing_threshold
    status_text = "passed" if is_passed else "needs_improvement"

    progress = db.query(UserSubtopicProgress).filter_by(
        user_id=user_id,
        cycle_id=cycle.id,
        skill_id=skill,
        subtopic_id=subtopic,
        level=level,
    ).first()

    if not progress:
        progress = UserSubtopicProgress(
            user_id=user_id,
            cycle_id=cycle.id,
            level=level,
            skill_id=skill,
            subtopic_id=subtopic,
            attempts=1,
            best_score=total_score,
            current_score=total_score,
            passed=is_passed,
            status=status_text,
        )
        db.add(progress)
    else:
        progress.attempts += 1
        progress.best_score = max(progress.best_score or 0, total_score)
        if is_passed:
            progress.current_score = total_score
        elif not progress.passed:
            progress.current_score = total_score
        progress.passed = progress.passed or is_passed
        progress.status = "passed" if progress.passed else "needs_improvement"

    if quiz_id is not None:
        quiz = db.query(SubtopicQuiz).filter_by(id=quiz_id).first()
        if quiz:
            quiz.status = "submitted"
            quiz.answers_json = json.dumps(submitted_answers)
            quiz.score = total_score
            quiz.passed = is_passed
            quiz.submitted_at = datetime.utcnow()

    if is_passed:
        record_daily_test_completed(db, user_id)
    db.commit()

    required_ids = list_subtopic_ids(level, skill)
    passed_ids = {
        r.subtopic_id
        for r in db.query(UserSubtopicProgress).filter_by(
            user_id=user_id,
            cycle_id=cycle.id,
            skill_id=skill,
            level=level,
            passed=True,
        ).all()
    }
    skill_mastered = bool(required_ids) and set(required_ids).issubset(passed_ids)

    next_level_unlocked = False
    next_level_name = None
    if skill_mastered:
        current_lvl = db.query(UserSkillLevel).filter_by(
            user_id=user_id, cycle_id=cycle.id, skill_id=skill, level=level
        ).first()
        if not current_lvl:
            current_lvl = UserSkillLevel(
                user_id=user_id,
                cycle_id=cycle.id,
                skill_id=skill,
                level=level,
                is_unlocked=True,
                is_completed=True,
            )
            db.add(current_lvl)
        else:
            current_lvl.is_completed = True
            current_lvl.is_unlocked = True

        next_level = NEXT_LEVEL_MAP.get(level)
        if next_level:
            next_lvl_record = db.query(UserSkillLevel).filter_by(
                user_id=user_id,
                cycle_id=cycle.id,
                skill_id=skill,
                level=next_level,
            ).first()
            if not next_lvl_record:
                db.add(
                    UserSkillLevel(
                        user_id=user_id,
                        cycle_id=cycle.id,
                        skill_id=skill,
                        level=next_level,
                        is_unlocked=True,
                        is_completed=False,
                    )
                )
            else:
                next_lvl_record.is_unlocked = True
            next_level_unlocked = True
            next_level_name = LEVEL_LABELS.get(next_level, next_level)

        db.commit()

    attempt_count = progress.attempts
    retry_state = _retry_state(
        attempt_count, bool(progress.passed), progress.updated_at
    )

    cycle_completed = False
    cycle_percentage = None
    if level == "proficiency":
        advanced_progress = db.query(UserSubtopicProgress).filter_by(
            user_id=user_id,
            cycle_id=cycle.id,
            level="proficiency",
            passed=True,
        ).all()
        advanced_passed: dict[str, set[str]] = {}
        for row in advanced_progress:
            advanced_passed.setdefault(row.skill_id, set()).add(row.subtopic_id)
        all_advanced_mastered = all(
            set(list_subtopic_ids("proficiency", skill_id)).issubset(
                advanced_passed.get(skill_id, set())
            )
            for skill_id in SKILL_ORDER
        )
        if all_advanced_mastered:
            current_cycle = db.query(CurriculumCycle).filter_by(
                id=cycle.id, user_id=user_id
            ).first()
            all_cycle_progress = db.query(UserSubtopicProgress).filter_by(
                user_id=user_id, cycle_id=cycle.id
            ).all()
            max_cycle_marks = sum(
                len(skill_data["subtopics"]) * ASSESSMENT_CONFIG["total_marks"]
                for level_data in CURRICULUM_CONFIG.values()
                for skill_data in level_data.values()
            )
            earned_cycle_marks = sum(row.current_score or 0 for row in all_cycle_progress)
            cycle_percentage = round(
                earned_cycle_marks / max_cycle_marks * 100, 1
            ) if max_cycle_marks else 0
            current_cycle.completed_at = datetime.utcnow()
            current_cycle.final_percentage = cycle_percentage
            db.commit()
            get_current_curriculum_cycle(db, user_id)
            ensure_beginner_unlocked(db, user_id)
            cycle_completed = True

    return {
        "score": total_score,
        "total_marks": ASSESSMENT_CONFIG["total_marks"],
        "percentage": round((total_score / ASSESSMENT_CONFIG["total_marks"]) * 100, 1),
        "passed": is_passed,
        "status": status_text,
        "can_retry": is_passed or retry_state["attempts_remaining"] != 0,
        "attempts": attempt_count,
        **retry_state,
        "performance": (
            "excellent" if total_score == ASSESSMENT_CONFIG["total_marks"]
            else "good" if is_passed
            else "needs_improvement"
        ),
        "cycle_completed": cycle_completed,
        "cycle_percentage": cycle_percentage,
        "next_cycle_number": (cycle.cycle_number + 1) if cycle_completed else None,
        "cycle_number": cycle.cycle_number,
        "retry_wait_hours": 24 if retry_state["retry_cooldown_active"] else 0,
        "skill_mastered": skill_mastered,
        "next_level_unlocked": next_level_unlocked,
        "next_level": next_level_name,
        "level": level,
        "skill": skill,
        "skill_name": SKILL_LABELS.get(skill, skill),
        "subtopic": subtopic,
        "subtopic_name": get_subtopic_entry(level, skill, subtopic).get("name", subtopic),
        "breakdown": results_breakdown,
    }


def _level_display_status(is_unlocked, is_completed, subtopics):
    if not is_unlocked:
        return "locked"
    if is_completed or (subtopics and all(s["passed"] for s in subtopics)):
        return "mastered"
    if any(s["status"] == "needs_improvement" for s in subtopics):
        return "needs_improvement"
    if any(s["status"] == "in_progress" or s["attempts"] > 0 for s in subtopics):
        return "in_progress"
    return "unlocked"


def _next_step(skills):
    failed = [
        (skill, level_id, subtopic)
        for skill in skills
        for level_id in LEVEL_ORDER
        for subtopic in skill["levels"][level_id]["subtopics"]
        if (
            skill["levels"][level_id]["is_unlocked"]
            and subtopic["status"] == "needs_improvement"
            and subtopic["can_start"]
        )
    ]
    if failed:
        skill, level_id, weakest = max(
            failed,
            key=lambda item: item[2].get("updated_at") or "",
        )
        return {
            "text": (
                f"You scored {int(weakest['current_score'])}/50 on {weakest['name']}. "
                f"You need at least 40/50 to pass. Review this topic and retry to move on."
            ),
            "skill_id": skill["id"],
            "skill_name": skill["name"],
            "topic_name": weakest["name"],
            "current_topic": f"{skill['name']} · {weakest['name']}",
            "level": level_id,
            "subtopic_id": weakest["id"],
            "action": "retry",
        }

    for skill in skills:
        for level_id in LEVEL_ORDER:
            lvl = skill["levels"][level_id]
            if not lvl["is_unlocked"] or lvl["status"] == "mastered":
                continue
            target = next(
                (
                    st
                    for st in lvl["subtopics"]
                    if not st["passed"] and st["can_start"]
                ),
                None,
            )
            if target:
                return {
                    "text": (
                        f"You are working on {target['name']} in {skill['name']}. "
                        "Pass with at least 40/50 to move to the next topic."
                    ),
                    "skill_id": skill["id"],
                    "skill_name": skill["name"],
                    "topic_name": target["name"],
                    "current_topic": f"{skill['name']} · {target['name']}",
                    "level": level_id,
                    "subtopic_id": target["id"],
                    "action": "start",
                }
    for skill in skills:
        for level_id in LEVEL_ORDER:
            lvl = skill["levels"][level_id]
            cooling_down = next(
                (
                    st
                    for st in lvl["subtopics"]
                    if lvl["is_unlocked"] and st["retry_available_at"]
                ),
                None,
            )
            if cooling_down:
                return {
                    "text": (
                        f"Practice {cooling_down['name']} and return after "
                        f"{cooling_down['retry_available_at']} for one more attempt."
                    ),
                    "skill_id": None,
                    "skill_name": skill["name"],
                    "topic_name": cooling_down["name"],
                    "current_topic": f"{skill['name']} · {cooling_down['name']}",
                    "level": level_id,
                    "subtopic_id": cooling_down["id"],
                    "action": "cooldown",
                }
    return {
        "text": "All currently unlocked subtopics are mastered. Great work!",
        "skill_id": None,
        "skill_name": None,
        "topic_name": None,
        "current_topic": None,
        "level": None,
        "subtopic_id": None,
        "action": "complete",
    }


def build_curriculum_dashboard(db: Session, user_id: int) -> dict:
    """Full Skills / Levels / Progress payload matching the PDF rules."""
    cycle = get_current_curriculum_cycle(db, user_id)
    ensure_beginner_unlocked(db, user_id)

    progress_rows = db.query(UserSubtopicProgress).filter_by(
        user_id=user_id, cycle_id=cycle.id
    ).all()
    level_rows = db.query(UserSkillLevel).filter_by(
        user_id=user_id, cycle_id=cycle.id
    ).all()
    active_quizzes = db.query(SubtopicQuiz).filter_by(
        user_id=user_id, cycle_id=cycle.id, status="active"
    ).order_by(SubtopicQuiz.created_at.desc()).all()
    progress_map = {(r.skill_id, r.level, r.subtopic_id): r for r in progress_rows}
    level_map = {(r.skill_id, r.level): r for r in level_rows}
    active_quiz_map = {
        (quiz.skill_id, quiz.level, quiz.subtopic_id): quiz
        for quiz in active_quizzes
    }

    skills = []
    needs_improvement_skills = 0
    beginner_mastered = 0
    completed_skill_levels = 0
    total_skill_levels = len(SKILL_ORDER) * len(LEVEL_ORDER)

    for skill_id in SKILL_ORDER:
        levels_out = {}
        for level_id in LEVEL_ORDER:
            lvl_row = level_map.get((skill_id, level_id))
            is_unlocked = True if level_id == "beginner" else bool(lvl_row and lvl_row.is_unlocked)
            subtopics = []
            for st_id, st_data in (
                CURRICULUM_CONFIG.get(level_id, {}).get(skill_id, {}).get("subtopics", {}).items()
            ):
                rec = progress_map.get((skill_id, level_id, st_id))
                active_quiz = active_quiz_map.get((skill_id, level_id, st_id))
                score = float(rec.current_score if rec else 0)
                total = ASSESSMENT_CONFIG["total_marks"]
                retry_state = _retry_state(
                    rec.attempts, bool(rec.passed), rec.updated_at
                ) if rec else _retry_state(0, False, None)
                can_start = bool(
                    is_unlocked
                    and not (rec and rec.passed)
                    and (
                        active_quiz
                        or not rec
                        or (
                            not rec.passed
                            and (
                                rec.attempts < MAX_FAILED_ATTEMPTS
                                or not rec.updated_at
                                or datetime.utcnow()
                                >= rec.updated_at + RETRY_COOLDOWN
                            )
                        )
                    )
                )
                subtopics.append({
                    "id": st_id,
                    "name": st_data.get("name", st_id),
                    "best_score": float(rec.best_score if rec else 0),
                    "current_score": score,
                    "total_marks": total,
                    "percentage": round((score / total) * 100, 1) if rec else 0,
                    "passed": bool(rec.passed) if rec else False,
                    "attempts": rec.attempts if rec else 0,
                    "is_started": bool(active_quiz),
                    "quiz_id": active_quiz.id if active_quiz else None,
                    "current_index": active_quiz.current_index if active_quiz else None,
                    "status": (
                        "in_progress"
                        if active_quiz and not (rec and rec.passed)
                        else rec.status if rec else "not_started"
                    ),
                    "updated_at": (
                        rec.updated_at.isoformat() + "Z"
                        if rec and rec.updated_at
                        else None
                    ),
                    "can_start": can_start,
                    **retry_state,
                })

            earned_marks = sum(subtopic["current_score"] for subtopic in subtopics)
            possible_marks = len(subtopics) * ASSESSMENT_CONFIG["total_marks"]
            is_completed = bool(lvl_row and lvl_row.is_completed) or (
                bool(subtopics) and all(s["passed"] for s in subtopics)
            )
            status = _level_display_status(is_unlocked, is_completed, subtopics)
            levels_out[level_id] = {
                "id": level_id,
                "name": LEVEL_LABELS[level_id],
                "is_unlocked": is_unlocked,
                "is_completed": is_completed,
                "status": status,
                "passed_count": sum(1 for s in subtopics if s["passed"]),
                "required_count": len(subtopics),
                "earned_marks": earned_marks,
                "possible_marks": possible_marks,
                "percentage": round(earned_marks / possible_marks * 100, 1)
                if possible_marks
                else 0,
                "subtopics": subtopics,
            }
            if is_completed:
                completed_skill_levels += 1

        current_level = "beginner"
        for level_id in LEVEL_ORDER:
            if levels_out[level_id]["is_unlocked"] and levels_out[level_id]["status"] != "mastered":
                current_level = level_id
                break
            if levels_out[level_id]["status"] == "mastered":
                current_level = level_id

        current = levels_out[current_level]
        scores = [s["percentage"] for s in current["subtopics"] if s["attempts"] > 0]
        skill_score = round(sum(scores) / len(scores), 1) if scores else 0
        unresolved = [s for s in current["subtopics"] if not s["passed"]]
        attempted_unresolved = [s for s in unresolved if s["attempts"] > 0]
        weak = (
            min(attempted_unresolved, key=lambda s: s["current_score"])
            if attempted_unresolved
            else (unresolved[0] if unresolved else None)
        )

        if current["status"] == "needs_improvement":
            needs_improvement_skills += 1
        if levels_out["beginner"]["status"] == "mastered":
            beginner_mastered += 1

        skills.append({
            "id": skill_id,
            "name": SKILL_LABELS[skill_id],
            "current_level": current_level,
            "current_level_name": LEVEL_LABELS[current_level],
            "status": current["status"],
            "score": skill_score,
            "weakest": (
                f"{weak['name']} — {int(weak['current_score'])}/50"
                if weak
                else None
            ),
            "weakest_subtopic_id": weak["id"] if weak else None,
            "levels": levels_out,
        })

    next_step = _next_step(skills)
    active_quiz = active_quizzes[0] if active_quizzes else None
    active_assessment = (
        _serialize_subtopic_quiz(active_quiz, json.loads(active_quiz.questions_json))
        if active_quiz
        else None
    )
    total_subtopics = sum(
        len(skill["subtopics"])
        for level in CURRICULUM_CONFIG.values()
        for skill in level.values()
    )
    passed_subtopics = sum(1 for row in progress_rows if row.passed)
    total_possible_marks = total_subtopics * ASSESSMENT_CONFIG["total_marks"]
    earned_marks = sum(row.current_score or 0 for row in progress_rows)
    overall = round(earned_marks / total_possible_marks * 100, 1) if total_possible_marks else 0

    from app.models.progress import Progress

    prog = db.query(Progress).filter(Progress.user_id == user_id).first()
    streak_days = int(streak_status(db, user_id)["test_streak"])
    attempted_progress = [row for row in progress_rows if row.attempts > 0]
    assessment_marks = int(sum(row.current_score or 0 for row in attempted_progress))
    assessment_possible_marks = (
        len(attempted_progress) * ASSESSMENT_CONFIG["total_marks"]
    )

    return {
        "status": "success",
        "assessment": {
            **ASSESSMENT_CONFIG,
            "passing_percent": 80,
        },
        "skills": skills,
        "active_assessment": active_assessment,
        "levels": [
            {
                "id": level_id,
                "name": LEVEL_LABELS[level_id],
                "skills": [
                    {
                        "id": s["id"],
                        "name": s["name"],
                        "status": s["levels"][level_id]["status"],
                        "is_unlocked": s["levels"][level_id]["is_unlocked"],
                        "passed_count": s["levels"][level_id]["passed_count"],
                        "required_count": s["levels"][level_id]["required_count"],
                        "earned_marks": s["levels"][level_id]["earned_marks"],
                        "possible_marks": s["levels"][level_id]["possible_marks"],
                        "percentage": s["levels"][level_id]["percentage"],
                        "subtopics": s["levels"][level_id]["subtopics"],
                    }
                    for s in skills
                ],
            }
            for level_id in LEVEL_ORDER
        ],
        "summary": {
            "cycle_number": cycle.cycle_number,
            "current_level": next(
                (LEVEL_LABELS[lid] for lid in reversed(LEVEL_ORDER)
                 if any(s["levels"][lid]["is_unlocked"] for s in skills)),
                "Beginner",
            ),
            "skills_mastered": f"{beginner_mastered}/{len(SKILL_ORDER)}",
            "beginner_mastered": beginner_mastered,
            "skill_count": len(SKILL_ORDER),
            "overall_progress": overall,
            "needs_improvement_count": needs_improvement_skills,
            "completed_skill_levels": completed_skill_levels,
            "total_skill_levels": total_skill_levels,
            "passed_subtopics": passed_subtopics,
            "total_subtopics": total_subtopics,
            "next_step": next_step,
            "streak_days": streak_days,
            "total_points": int(prog.total_points or 0) if prog else 0,
            "solved_questions": int(prog.solved_questions or 0) if prog else 0,
            "assessment_marks": assessment_marks,
            "assessment_possible_marks": assessment_possible_marks,
        },
    }


def get_recent_sessions(db: Session, user_id: int):
    return []


def get_test_history(db: Session, user_id: int, limit: int = 30):
    return []


def build_assessment_history(db: Session, user_id: int) -> dict:
    get_current_curriculum_cycle(db, user_id)
    cycles = db.query(CurriculumCycle).filter_by(user_id=user_id).order_by(
        CurriculumCycle.cycle_number.desc()
    ).all()
    quizzes = db.query(SubtopicQuiz).filter_by(
        user_id=user_id, status="submitted"
    ).order_by(SubtopicQuiz.submitted_at.desc()).all()
    cycle_quizzes: dict[int, list[SubtopicQuiz]] = {}
    for quiz in quizzes:
        cycle_quizzes.setdefault(quiz.cycle_id, []).append(quiz)

    curriculum_total_marks = sum(
        len(skill_data["subtopics"]) * ASSESSMENT_CONFIG["total_marks"]
        for level_data in CURRICULUM_CONFIG.values()
        for skill_data in level_data.values()
    )
    output = []
    for cycle in cycles:
        attempts = cycle_quizzes.get(cycle.id, [])
        progress_by_topic = {
            (row.level, row.skill_id, row.subtopic_id): row
            for row in db.query(UserSubtopicProgress).filter_by(
                user_id=user_id, cycle_id=cycle.id
            ).all()
        }
        topic_attempt_counts: dict[tuple[str, str, str], int] = {}
        for quiz in attempts:
            topic_key = (quiz.level, quiz.skill_id, quiz.subtopic_id)
            topic_attempt_counts[topic_key] = topic_attempt_counts.get(topic_key, 0) + 1

        outcomes = {}
        for quiz in attempts:
            topic_key = (quiz.level, quiz.skill_id, quiz.subtopic_id)
            score = quiz.score
            if score is None:
                questions = json.loads(quiz.questions_json)
                answers = json.loads(quiz.answers_json or "{}")
                if answers:
                    score = sum(
                        ASSESSMENT_CONFIG["marks_per_question"]
                        for question in questions
                        if str(answers.get(str(question["id"]), "")).strip()
                        == str(question["correct_answer"]).strip()
                    )
                elif topic_attempt_counts[topic_key] == 1:
                    old_progress = progress_by_topic.get(topic_key)
                    score = old_progress.current_score if old_progress else None
            passed = quiz.passed
            if passed is None:
                old_progress = progress_by_topic.get(topic_key)
                passed = (
                    score >= ASSESSMENT_CONFIG["passing_marks"]
                    if score is not None
                    else old_progress.passed
                    if old_progress and topic_attempt_counts[topic_key] == 1
                    else None
                )
            outcomes[quiz.id] = (score, passed)

        recorded_at_by_quiz = {}
        weeks: dict[str, list[SubtopicQuiz]] = {}
        for quiz in attempts:
            topic_key = (quiz.level, quiz.skill_id, quiz.subtopic_id)
            recorded_at = (
                quiz.submitted_at
                or quiz.created_at
                or (
                    progress_by_topic[topic_key].updated_at
                    if topic_key in progress_by_topic
                    else None
                )
                or cycle.started_at
                or datetime.utcnow()
            )
            recorded_at_by_quiz[quiz.id] = recorded_at
            week_start = (
                recorded_at.date() - timedelta(days=recorded_at.weekday())
            ).isoformat()
            weeks.setdefault(week_start, []).append(quiz)

        weekly_history = []
        for week_start, week_attempts in sorted(weeks.items(), reverse=True):
            week_attempts.sort(
                key=lambda quiz: (recorded_at_by_quiz[quiz.id], quiz.id),
                reverse=True,
            )
            scored_attempts = [
                (quiz, *outcomes[quiz.id])
                for quiz in week_attempts
                if outcomes[quiz.id][0] is not None
            ]
            latest_pass_by_topic = {}
            for quiz in week_attempts:
                score, passed = outcomes[quiz.id]
                topic_key = (quiz.level, quiz.skill_id, quiz.subtopic_id)
                if (
                    score is not None
                    and passed is True
                    and topic_key not in latest_pass_by_topic
                ):
                    latest_pass_by_topic[topic_key] = quiz.id
            contributing_quiz_ids = set(latest_pass_by_topic.values())
            earned = sum(
                outcomes[quiz_id][0] for quiz_id in contributing_quiz_ids
            )
            weekly_history.append({
                "week_start": week_start,
                "attempts": len(week_attempts),
                "scored_attempts": len(scored_attempts),
                "passed": len(contributing_quiz_ids),
                "earned_marks": earned,
                "curriculum_total_marks": curriculum_total_marks,
                "percentage": round(
                    earned / curriculum_total_marks * 100, 1
                ) if curriculum_total_marks else None,
                "assessments": [
                    {
                        "submitted_at": recorded_at_by_quiz[quiz.id].isoformat() + "Z",
                        "level": quiz.level,
                        "level_name": LEVEL_LABELS.get(quiz.level, quiz.level),
                        "skill": quiz.skill_id,
                        "skill_name": SKILL_LABELS.get(quiz.skill_id, quiz.skill_id),
                        "subtopic": quiz.subtopic_id,
                        "subtopic_name": get_subtopic_entry(
                            quiz.level, quiz.skill_id, quiz.subtopic_id
                        ).get("name", quiz.subtopic_id),
                        "score": outcomes[quiz.id][0],
                        "total_marks": ASSESSMENT_CONFIG["total_marks"],
                        "percentage": round(
                            outcomes[quiz.id][0]
                            / ASSESSMENT_CONFIG["total_marks"] * 100,
                            1,
                        ) if outcomes[quiz.id][0] is not None else None,
                        "passed": outcomes[quiz.id][1],
                        "counts_toward_total": quiz.id in contributing_quiz_ids,
                        "performance": (
                            "excellent"
                            if outcomes[quiz.id][0] == ASSESSMENT_CONFIG["total_marks"]
                            else "good"
                            if outcomes[quiz.id][1] is True
                            else "needs_improvement"
                            if outcomes[quiz.id][1] is False
                            else "unavailable"
                        ),
                    }
                    for quiz in week_attempts
                ],
            })

        cycle_progress = list(progress_by_topic.values())
        passed_cycle_progress = [row for row in cycle_progress if row.passed]
        earned_cycle_marks = sum(
            row.current_score or 0 for row in passed_cycle_progress
        )
        output.append({
            "cycle_id": cycle.id,
            "cycle_number": cycle.cycle_number,
            "started_at": cycle.started_at.isoformat() + "Z",
            "completed_at": cycle.completed_at.isoformat() + "Z"
            if cycle.completed_at
            else None,
            "is_current": cycle.completed_at is None,
            "final_percentage": (
                cycle.final_percentage
                if cycle.completed_at
                else round(earned_cycle_marks / curriculum_total_marks * 100, 1)
                if curriculum_total_marks and passed_cycle_progress
                else None
            ),
            "earned_marks": earned_cycle_marks,
            "curriculum_total_marks": curriculum_total_marks,
            "attempts": len(attempts),
            "passed_attempts": sum(
                1 for quiz in attempts if outcomes[quiz.id][1] is True
            ),
            "weeks": weekly_history,
        })

    return {"cycles": output}


def topic_detail(db: Session, user_id: int, topic: str):
    return {
        "status": "success",
        "topic": topic,
        "details": f"Details for {topic}",
    }