# app/routes/skills.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.curriculum_config import CURRICULUM_CONFIG
from app.models.user_skill import UserSubtopicProgress, UserSkillLevel
from app.services.assessment_engine import (
    get_recent_sessions,
    get_test_history,
    topic_detail,
    build_curriculum_dashboard,
)
from app.services.skill_profile import build_skill_profile

router = APIRouter(prefix="/skills", tags=["skills"])

# ==========================================
# 1. NEW CURRICULUM & PROGRESSION ENDPOINTS
# ==========================================

@router.get("/curriculum")
def get_curriculum():
    """
    Returns the full 48-subtopic curriculum hierarchy.
    """
    return {"status": "success", "curriculum": CURRICULUM_CONFIG}


@router.get("/dashboard")
def skills_dashboard(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Skills, levels, and progress tree for the logged-in student."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")
    return build_curriculum_dashboard(db, user_id)


@router.get("/levels")
def skills_levels(user_id: int = Query(...), db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")
    data = build_curriculum_dashboard(db, user_id)
    return {"status": "success", "levels": data["levels"], "summary": data["summary"]}


@router.get("/progress/{user_id}")
def get_user_curriculum_progress(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieves all subtopic scores and independent skill-level unlocks for a user.
    """
    subtopic_records = db.query(UserSubtopicProgress).filter_by(user_id=user_id).all()
    level_records = db.query(UserSkillLevel).filter_by(user_id=user_id).all()

    subtopic_progress = [
        {
            "level": r.level,
            "skill_id": r.skill_id,
            "subtopic_id": r.subtopic_id,
            "best_score": r.best_score,
            "passed": r.passed,
            "attempts": r.attempts,
            "status": r.status
        }
        for r in subtopic_records
    ]

    level_unlocks = [
        {
            "skill_id": r.skill_id,
            "level": r.level,
            "is_unlocked": r.is_unlocked,
            "is_completed": r.is_completed
        }
        for r in level_records
    ]

    return {
        "status": "success",
        "subtopic_progress": subtopic_progress,
        "level_unlocks": level_unlocks
    }


# ==========================================
# 2. EXISTING SKILLS & PROFILE ENDPOINTS
# ==========================================

@router.get("/profile")
def skills_profile(user_id: int = Query(...), db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")
    try:
        profile = build_skill_profile(db, user_id)
        profile["recent_assessments"] = get_recent_sessions(db, user_id)
        profile["test_history"] = get_test_history(db, user_id, limit=30)
        return profile
    except Exception:
        db.rollback()
        profile = build_skill_profile(db, user_id)
        profile["recent_assessments"] = []
        profile["test_history"] = []
        return profile


@router.get("/topic/{topic}")
def skills_topic_detail(
    topic: str, user_id: int = Query(...), db: Session = Depends(get_db)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required")
    return topic_detail(db, user_id, topic)