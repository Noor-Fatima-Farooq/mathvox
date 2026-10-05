"""Reply language: Roman Urdu (default) or English."""

import re

VALID_STYLES = ("en", "ur_roman")

URDU_SCRIPT = re.compile(r"[\u0600-\u06ff]")
ROMAN_URDU_WORDS = re.compile(
    r"\b("
    r"kya|kia|kyun|kaise|kaisay|kese|kesay|hai|hain|ho|"
    r"mujhe|mujhy|mjhe|mjhy|samjhao|smjhao|samjha|smjha|"
    r"batao|btayo|bataiye|kitna|kitne|kitni|"
    r"mera|meri|mere|hamara|hamari|"
    r"mein|main|mai|ka|ki|ke|ko|se|"
    r"karo|kro|karna|karein|iska|iski|isko|yeh|ye|"
    r"jawab|jawaab|hal|nikalo|nikalna"
    r")\b",
    re.IGNORECASE,
)
ENGLISH_WORDS = re.compile(
    r"\b("
    r"what|why|how|explain|solve|calculate|find|show|steps|"
    r"please|give|tell|answer|result|work|can|could|would|"
    r"the|this|that|is|are|me|you|your"
    r")\b",
    re.IGNORECASE,
)


def normalize_style(style: str | None) -> str:
    s = (style or "ur_roman").strip().lower()
    return s if s in VALID_STYLES else "ur_roman"


def resolve_reply_style(
    message: str, preference: str = "ur_roman"
) -> tuple[str, str | None]:
    """Use the selected chat toggle as the reply language for every turn."""
    return normalize_style(preference), None


def detect_message_language(message: str) -> str | None:
    """Detect clear Urdu or English input; leave equations and ambiguous text neutral."""
    text = (message or "").strip()
    if URDU_SCRIPT.search(text):
        return "ur_roman"
    if ROMAN_URDU_WORDS.search(text):
        return "ur_roman"
    if ENGLISH_WORDS.search(text):
        return "en"
    return None


def language_switch_message(style: str) -> str:
    if normalize_style(style) == "ur_roman":
        return (
            "Aap ka sawal English mein lag raha hai. "
            "Barah-e-karam upar EN tab select karke apna sawal dobara bhejein."
        )
    return (
        "It looks like your question is in Urdu. "
        "Please select the Urdu tab above, then send your question again."
    )


def language_instruction(style: str) -> str:
    if normalize_style(style) == "ur_roman":
        return (
            "Reply entirely in Roman Urdu (Urdu written with Latin letters). "
            "Do not use Urdu script or English prose. Use simple, natural wording "
            "that a young student can understand. Math symbols and numbers stay as-is."
        )
    return "Reply entirely in clear, simple English. Do not use Urdu or Roman Urdu."


def off_topic_message(style: str) -> str:
    if normalize_style(style) == "ur_roman":
        return (
            "Main MathVox hoon — sirf math mein madad karta hoon. "
            "Koi sawal poochho, worksheet upload karo, ya jo masla pehle solve kiya uske baare mein poochho."
        )
    return (
        "I'm MathVox — I only help with math. "
        "Ask a math question, upload a worksheet, or refer to a problem we discussed."
    )


def no_problem_message(style: str) -> str:
    if normalize_style(style) == "ur_roman":
        return (
            "Kaun sa math masla solve karna hai? "
            "Equation likho ya is chat mein jo pehle solve hua uski taraf ishara karo."
        )
    return (
        "Which math problem should I work on? "
        "Type an equation or point to something from this chat."
    )


def format_solve_reply(result: dict, style: str) -> str:
    """Format SymPy solve output in the chosen language."""
    if normalize_style(style) == "en":
        if result.get("error"):
            return f"Could not solve: {result['error']}"
        if result.get("results"):
            lines = []
            for i, row in enumerate(result["results"], start=1):
                if row.get("error"):
                    lines.append(f"{i}. {row['question']} → {row['error']}")
                else:
                    lines.append(f"{i}. {row['question']} = {row['answer']}")
            return "\n".join(lines)
        if result.get("answer"):
            q = result.get("question", "")
            return f"{q} = {result['answer']}" if q else str(result["answer"])
        return "No solution returned."

    if result.get("error"):
        return f"Hal nahi mil saka: {result['error']}"
    if result.get("results"):
        lines = []
        for i, row in enumerate(result["results"], start=1):
            if row.get("error"):
                lines.append(f"{i}. {row['question']} → masla: {row['error']}")
            else:
                lines.append(f"{i}. {row['question']} ka jawab = {row['answer']}")
        return "\n".join(lines)
    if result.get("answer"):
        q = result.get("question", "")
        ans = result["answer"]
        return f"{q} ka jawab = {ans}" if q else f"Jawab: {ans}"
    return "Koi jawab nahi mila."


def explain_footer(style: str, answer: str) -> str:
    if normalize_style(style) == "ur_roman":
        return f"Aakhri jawab: {answer}"
    return f"Final answer: {answer}"
