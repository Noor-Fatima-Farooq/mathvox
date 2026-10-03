# app/routes/assessment.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Optional

from app.database import get_db
from app.services.assessment_engine import (
    QuestionGenerationError,
    get_active_subtopic_quiz,
    save_subtopic_quiz_progress,
    start_subtopic_quiz,
    process_subtopic_submission,
    build_curriculum_dashboard,
    build_assessment_history,
)
from app.services.curriculum_config import ASSESSMENT_CONFIG

router = APIRouter(prefix="/api/assessment", tags=["Assessment"])


class QuestionRequest(BaseModel):
    user_id: int
    level: str
    skill: str
    subtopic: str


class SubmissionRequest(BaseModel):
    user_id: int
    quiz_id: Optional[int] = None
    level: Optional[str] = None
    skill: Optional[str] = None
    subtopic: Optional[str] = None
    user_answers: Dict[str, str]


class QuizProgressRequest(BaseModel):
    user_id: int
    answers: Dict[str, str]
    current_index: int


@router.get("/rules")
def assessment_rules():
    return {"status": "success", **ASSESSMENT_CONFIG, "passing_percent": 80}


@router.post("/generate-questions")
def get_assessment_questions(payload: QuestionRequest, db: Session = Depends(get_db)):
    """Start a 5-question subtopic paper. Correct answers stay on the server."""
    try:
        data = start_subtopic_quiz(
            db=db,
            user_id=payload.user_id,
            level=payload.level.lower().strip(),
            skill=payload.skill.lower().strip(),
            subtopic=payload.subtopic.lower().strip(),
        )
        return {"status": "success", **data}
    except PermissionError as err:
        raise HTTPException(status_code=403, detail=str(err))
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except QuestionGenerationError as err:
        raise HTTPException(status_code=503, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(err)}")


@router.get("/active")
def active_assessment(user_id: int = Query(...), db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")
    return {"assessment": get_active_subtopic_quiz(db, user_id)}


@router.put("/{quiz_id}/progress")
def save_assessment_progress(
    quiz_id: int, payload: QuizProgressRequest, db: Session = Depends(get_db)
):
    if not payload.user_id:
        raise HTTPException(status_code=401, detail="Login required")
    try:
        return save_subtopic_quiz_progress(
            db, payload.user_id, quiz_id, payload.answers, payload.current_index
        )
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to save assessment: {str(err)}")


@router.post("/submit")
def submit_assessment(payload: SubmissionRequest, db: Session = Depends(get_db)):
    """Mark a paper out of 50 and apply per-skill unlocks."""
    if not payload.user_id:
        raise HTTPException(status_code=401, detail="Login required")
    if not payload.quiz_id and not (payload.level and payload.skill and payload.subtopic):
        raise HTTPException(status_code=400, detail="quiz_id is required")

    try:
        results = process_subtopic_submission(
            db=db,
            user_id=payload.user_id,
            level=(payload.level or "").lower(),
            skill=(payload.skill or "").lower(),
            subtopic=(payload.subtopic or "").lower(),
            user_answers=payload.user_answers or {},
            quiz_id=payload.quiz_id,
        )
        return {"status": "success", "results": results}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to process submission: {str(err)}")


@router.get("/dashboard")
def curriculum_dashboard(user_id: int = Query(...), db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")
    return build_curriculum_dashboard(db, user_id)


@router.get("/history")
def assessment_history(user_id: int = Query(...), db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")
    return build_assessment_history(db, user_id)
