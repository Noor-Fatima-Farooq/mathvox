/** User reply language: Roman Urdu (default) or English */

export const REPLY_STYLE_KEY = "mathvox_reply_style";
export const REPLY_STYLE_EVENT = "mathvox:reply-style-changed";

const URDU_SCRIPT = /[\u0600-\u06ff]/;
const ROMAN_URDU_WORDS =
  /\b(kya|kia|kyun|kaise|kaisay|kese|kesay|hai|hain|ho|mujhe|mujhy|mjhe|mjhy|samjhao|smjhao|samjha|smjha|batao|btayo|kitna|kitne|kitni|mera|meri|mere|hamara|hamari|mein|main|mai|ka|ki|ke|ko|se|karo|kro|karna|karein|iska|iski|isko|yeh|ye|jawab|jawaab|hal|nikalo|nikalna)\b/i;
const ENGLISH_WORDS =
  /\b(what|why|how|explain|solve|calculate|find|show|steps|please|give|tell|answer|result|work|can|could|would|the|this|that|is|are|me|you|your)\b/i;

export function normalizeReplyStyle(style) {
  return style === "en" ? "en" : "ur_roman";
}

export function getReplyStylePreference() {
  const stored = localStorage.getItem(REPLY_STYLE_KEY);
  return normalizeReplyStyle(stored || "ur_roman");
}

export function setReplyStylePreference(style) {
  const next = normalizeReplyStyle(style);
  localStorage.setItem(REPLY_STYLE_KEY, next);
  window.dispatchEvent(
    new CustomEvent(REPLY_STYLE_EVENT, { detail: { style: next } })
  );
  return next;
}

/** The language toggle is authoritative; individual wording never changes it. */
export function resolveReplyStyleForMessage() {
  return getReplyStylePreference();
}

export function getLanguageSwitchMessage(message, style) {
  const text = (message || "").trim();
  let messageLanguage = null;
  if (URDU_SCRIPT.test(text) || ROMAN_URDU_WORDS.test(text)) {
    messageLanguage = "ur_roman";
  } else if (ENGLISH_WORDS.test(text)) {
    messageLanguage = "en";
  }

  if (!messageLanguage || messageLanguage === normalizeReplyStyle(style)) {
    return null;
  }
  return style === "ur_roman"
    ? "Aap ka sawal English mein lag raha hai. Barah-e-karam upar EN tab select karke apna sawal dobara bhejein."
    : "It looks like your question is in Urdu. Please select the Urdu tab above, then send your question again.";
}

export function applyPreferenceUpdate(preferenceUpdate) {
  if (preferenceUpdate === "en" || preferenceUpdate === "ur_roman") {
    setReplyStylePreference(preferenceUpdate);
  }
}

/** Guest /solve formatting — mirrors backend format_solve_reply */
export function formatSolveForStyle(data, style = "ur_roman") {
  if (data?.error) {
    const err = typeof data.error === "string" ? data.error : "Could not solve";
    return style === "en" ? `Could not solve: ${err}` : `Hal nahi mil saka: ${err}`;
  }
  if (data?.results?.length) {
    return data.results
      .map((row, i) => {
        const n = i + 1;
        if (row.error) {
          return style === "en"
            ? `${n}. ${row.question} → ${row.error}`
            : `${n}. ${row.question} → masla: ${row.error}`;
        }
        return style === "en"
          ? `${n}. ${row.question} = ${row.answer}`
          : `${n}. ${row.question} ka jawab = ${row.answer}`;
      })
      .join("\n");
  }
  if (data?.answer) {
    const q = data.question || "";
    if (style === "en") return q ? `${q} = ${data.answer}` : String(data.answer);
    return q ? `${q} ka jawab = ${data.answer}` : `Jawab: ${data.answer}`;
  }
  return style === "en" ? "No solution returned." : "Koi jawab nahi mila.";
}
