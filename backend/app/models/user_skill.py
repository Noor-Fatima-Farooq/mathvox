# app/models/user_skill.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class CurriculumCycle(Base):
    __tablename__ = "curriculum_cycles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    cycle_number = Column(Integer, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    final_percentage = Column(Float, nullable=True)


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cycle_id = Column(Integer, nullable=False, default=1)
    skill_id = Column(String, nullable=False)  # e.g., "number_sense"
    level = Column(String, default="beginner")
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSubtopicProgress(Base):
    __tablename__ = "user_subtopic_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cycle_id = Column(Integer, nullable=False, default=1)
    level = Column(String, nullable=False)        # "beginner", "developing", "proficiency"
    skill_id = Column(String, nullable=False)     # e.g., "number_sense"
    subtopic_id = Column(String, nullable=False)  # e.g., "place_value"
    attempts = Column(Integer, default=0)
    best_score = Column(Float, default=0.0)       # Highest score out of 50
    current_score = Column(Float, default=0.0)    # Latest passing score, else last attempt
    passed = Column(Boolean, default=False)       # True if any attempt >= 40
    status = Column(String, default="not_started") # "passed", "needs_improvement", "not_started"
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SubtopicQuiz(Base):
    """Server-side quiz so correct answers are not sent to the browser."""

    __tablename__ = "subtopic_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    level = Column(String, nullable=False)
    skill_id = Column(String, nullable=False)
    subtopic_id = Column(String, nullable=False)
    questions_json = Column(String, nullable=False)
    answers_json = Column(String, nullable=False, default="{}")
    current_index = Column(Integer, nullable=False, default=0)
    status = Column(String, default="active")  # active | submitted
    cycle_id = Column(Integer, nullable=False, default=1)
    score = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSkillLevel(Base):
    __tablename__ = "user_skill_levels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cycle_id = Column(Integer, nullable=False, default=1)
    skill_id = Column(String, nullable=False)     # e.g., "number_sense"
    level = Column(String, nullable=False)        # "beginner", "developing", "proficiency"
    is_unlocked = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)