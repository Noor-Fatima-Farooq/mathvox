from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field
from typing import Optional

# 🔹 Signup / auth
class SignupRequest(BaseModel):
    username: str
    name: Optional[str] = None
    email: str
    password: str
    confirm_password: str
    class_grade: Literal["Class 1", "Class 2", "Class 3"]
    age: int = Field(ge=7, le=10)


class GoogleAuthRequest(BaseModel):
    credential: str


class LoginRequest(BaseModel):
    email: str
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


class UpdateProfileRequest(BaseModel):
    user_id: int
    name: Optional[str] = None
    username: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str
    confirm_password: str


# 🔹 Solve
class SolveRequest(BaseModel):
    question: str
    user_id: Optional[int] = None   # 👈 optional


class ReplyStyle(str, Enum):
    en = "en"
    ur_roman = "ur_roman"  # default — Roman Urdu (Urdu in Latin script)


class ExplainRequest(BaseModel):
    question: str
    answer: Optional[str] = None
    reply_style: ReplyStyle = ReplyStyle.ur_roman


class ChatTurn(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = []
    reply_style: ReplyStyle = ReplyStyle.ur_roman