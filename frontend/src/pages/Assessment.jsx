import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/CurriculumLayout";
import BackToMain from "../components/BackToMain";
import {
  getActiveSubtopicQuiz,
  getCurriculumDashboard,
  saveSubtopicQuizProgress,
  startSubtopicQuiz,
  submitSubtopicQuiz,
} from "../services/api";

const LEVEL_NAMES = {
  beginner: "Beginner",
  developing: "Proficiency",
  proficiency: "Advanced",
};

const restoreSavedProgress = (assessment) => {
  if (!assessment?.quiz_id) return assessment;
  const key = `mathvox-assessment-${localStorage.getItem("user_id")}-${assessment.quiz_id}`;
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    localStorage.removeItem(key);
  }
  return {
    ...assessment,
    answers: cached?.answers || assessment.answers || {},
    current_index: Math.min(
      Math.max(
        Number.isInteger(cached?.currentIndex)
          ? cached.currentIndex
          : assessment.current_index || 0,
        0
      ),
      Math.max((assessment.questions || []).length - 1, 0)
    ),
  };
};

export default function Assessment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(() =>
    restoreSavedProgress(location.state?.assessment || null)
  );
  const [answers, setAnswers] = useState(() => assessment?.answers || {});
  const [questionIndex, setQuestionIndex] = useState(
    assessment?.current_index || 0
  );
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startingRetry, setStartingRetry] = useState(false);
  const [startingNext, setStartingNext] = useState(false);
  const [loadingAssessment, setLoadingAssessment] = useState(!location.state?.assessment);
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedMilliseconds = useRef(0);
  const flushElapsedRef = useRef(null);
  const saveTimer = useRef(null);
  const saveRequestRef = useRef(Promise.resolve());
  const isSubmittingRef = useRef(false);

  const questions = assessment?.questions || [];
  const currentQuestion = questions[questionIndex];
  const hasCurrentAnswer =
    currentQuestion &&
    currentQuestion.options.includes(answers[String(currentQuestion.id)]);
  const isAnswered = (question) =>
    question.options.includes(answers[String(question.id)]);
  const answeredCount = questions.filter(isAnswered).length;
  const unansweredQuestionIndex = questions.findIndex(
    (question) => !isAnswered(question)
  );

  useEffect(() => {
    if (!assessment || result || submitting) return undefined;
    const cacheKey = `mathvox-assessment-${localStorage.getItem("user_id")}-${assessment.quiz_id}`;
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ answers, currentIndex: questionIndex })
    );
    clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveRequestRef.current = saveSubtopicQuizProgress({
        quizId: assessment.quiz_id,
        answers,
        currentIndex: Math.min(questionIndex, Math.max(questions.length - 1, 0)),
      }).catch((err) => {
        if (!isSubmittingRef.current) {
          setError(err.message || "Could not save assessment progress.");
        }
      });
    }, 200);
    return () => clearTimeout(saveTimer.current);
  }, [assessment, answers, questionIndex, questions.length, result, submitting]);

  useEffect(() => {
    if (assessment) return undefined;
    let active = true;
    getActiveSubtopicQuiz()
      .then((activeAssessment) => {
        if (!active || !activeAssessment) return;
        const restored = restoreSavedProgress(activeAssessment);
        setAssessment(restored);
        setAnswers(restored.answers || {});
        setQuestionIndex(restored.current_index || 0);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load your active assessment.");
      })
      .finally(() => {
        if (active) setLoadingAssessment(false);
      });
    return () => {
      active = false;
    };
  }, [assessment]);

  useEffect(() => {
    if (!assessment || result || submitting) return undefined;
    const storageKey = `mathvox-assessment-time-${localStorage.getItem("user_id")}-${assessment.quiz_id}`;
    let savedElapsed = 0;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      savedElapsed = Math.max(0, Number(saved?.elapsedMilliseconds) || 0);
    } catch {
      localStorage.removeItem(storageKey);
    }
    elapsedMilliseconds.current = savedElapsed;
    setElapsedSeconds(Math.floor(savedElapsed / 1000));

    let runningSince =
      document.visibilityState === "visible" ? performance.now() : null;
    const saveElapsed = (updateDisplay = true) => {
      if (runningSince !== null) {
        elapsedMilliseconds.current += performance.now() - runningSince;
        runningSince = performance.now();
      }
      localStorage.setItem(
        storageKey,
        JSON.stringify({ elapsedMilliseconds: elapsedMilliseconds.current })
      );
      if (updateDisplay) {
        setElapsedSeconds(Math.floor(elapsedMilliseconds.current / 1000));
      }
      return Math.floor(elapsedMilliseconds.current / 1000);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveElapsed();
        runningSince = null;
      } else if (runningSince === null) {
        runningSince = performance.now();
      }
    };
    flushElapsedRef.current = () => {
      const elapsed = saveElapsed();
      runningSince = null;
      return elapsed;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const timer = window.setInterval(() => saveElapsed(), 1000);

    return () => {
      saveElapsed(false);
      runningSince = null;
      flushElapsedRef.current = null;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [assessment, result, submitting]);

  const formatElapsed = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  const submit = async () => {
    if (questionIndex !== questions.length - 1) {
      return;
    }
    if (unansweredQuestionIndex !== -1) {
      setError(
        `Question ${unansweredQuestionIndex + 1} is unanswered. Please answer all five questions before submitting.`
      );
      setQuestionIndex(unansweredQuestionIndex);
      return;
    }

    setSubmitting(true);
    isSubmittingRef.current = true;
    setError("");
    const timeTakenSeconds = flushElapsedRef.current?.() ?? elapsedSeconds;
    try {
      clearTimeout(saveTimer.current);
      await saveRequestRef.current;
      const response = await submitSubtopicQuiz({
        quizId: assessment.quiz_id,
        userAnswers: answers,
      });
      setResult({
        ...response.results,
        time_taken_seconds: timeTakenSeconds,
      });
      localStorage.removeItem(
        `mathvox-assessment-${localStorage.getItem("user_id")}-${assessment.quiz_id}`
      );
    } catch (err) {
      setError(err.message || "Could not submit your assessment.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const retry = async () => {
    if (!assessment) return;
    setStartingRetry(true);
    setError("");
    try {
      const nextAssessment = await startSubtopicQuiz({
        level: assessment.level,
        skill: assessment.skill,
        subtopic: assessment.subtopic,
      });
      const restored = restoreSavedProgress(nextAssessment);
      setAssessment(restored);
      setAnswers(restored.answers || {});
      setQuestionIndex(restored.current_index || 0);
      setResult(null);
      elapsedMilliseconds.current = 0;
      setElapsedSeconds(0);
    } catch (err) {
      setError(err.message || "Could not start a new attempt.");
    } finally {
      setStartingRetry(false);
    }
  };

  const continueToNextAssessment = async () => {
    setStartingNext(true);
    setError("");
    try {
      const dashboard = await getCurriculumDashboard();
      const next = dashboard.summary?.next_step;
      if (!next?.skill_id || !next.level || !next.subtopic_id) {
        navigate("/skills");
        return;
      }
      const nextAssessment = await startSubtopicQuiz({
        level: next.level,
        skill: next.skill_id,
        subtopic: next.subtopic_id,
      });
      navigate("/assessment", { state: { assessment: nextAssessment } });
    } catch (err) {
      setError(err.message || "Could not start the next assessment.");
    } finally {
      setStartingNext(false);
    }
  };

  if (!assessment) {
    return (
      <main className="min-h-[calc(100dvh-57px)] px-4 py-8 text-gray-900 dark:text-white sm:px-6">
        <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <BackToMain />
          <h1 className="text-xl font-bold">
            {loadingAssessment ? "Resuming your assessment…" : "No assessment selected"}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {loadingAssessment
              ? "Loading your saved question and answers."
              : "Choose an unlocked subtopic from Skills to start an assessment."}
          </p>
          {!loadingAssessment && <button
            type="button"
            onClick={() => navigate("/skills")}
            className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Go to Skills
          </button>}
        </section>
      </main>
    );
  }

  return (
    <main className="h-[calc(100dvh-57px)] overflow-y-auto px-4 py-5 text-gray-900 dark:text-white sm:px-6 md:px-8">
      <div className="mx-auto max-w-3xl pb-8">
        <BackToMain />
        <header className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
            {LEVEL_NAMES[assessment.level] || assessment.level} · {assessment.skill_name}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {assessment.subtopic_name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {assessment.question_count} questions · {assessment.marks_per_question} marks each ·{" "}
            {assessment.passing_marks}/{assessment.total_marks} to pass
          </p>
          {!result && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                Time elapsed: {formatElapsed(elapsedSeconds)}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {answeredCount} of {questions.length} answered
              </p>
            </div>
          )}
        </header>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          >
            {error}
          </p>
        )}

        {result ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Assessment result</p>
                <h2 className="mt-1 text-3xl font-bold">
                  {result.score}/{result.total_marks}
                  <span className="ml-2 text-xl text-gray-500 dark:text-slate-400">
                    ({result.percentage}%)
                  </span>
                </h2>
              </div>
              <StatusBadge status={result.passed ? "passed" : "needs_improvement"} />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Time taken: {formatElapsed(result.time_taken_seconds)}
            </p>
            <p
              className={`mt-3 text-sm font-semibold ${
                result.performance === "excellent"
                  ? "text-violet-700 dark:text-violet-300"
                  : result.passed
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {result.cycle_completed
                ? `Excellent achievement! You completed all six skills through Advanced with ${result.cycle_percentage}% overall. Learning cycle ${result.cycle_number} is saved in History, and a fresh Beginner cycle has started.`
                : result.performance === "excellent"
                  ? "Excellent! Full marks on this assessment."
                  : result.passed
                    ? "Good work! You passed this topic."
                    : "Keep practicing this topic to reach the 40/50 pass mark."}
            </p>
            <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">
              {result.passed
                ? result.skill_mastered
                  ? result.next_level
                    ? `${assessment.skill_name} is mastered at ${LEVEL_NAMES[assessment.level] || assessment.level}. ${result.next_level} is now unlocked for this skill.`
                    : `${assessment.skill_name} is mastered at every curriculum level.`
                  : "Subtopic passed. Complete the remaining subtopics to master this skill level."
                : result.can_retry
                  ? `You scored ${result.score}/50. You need 40/50 to pass. Review ${assessment.subtopic_name} and try again; ${result.attempts_remaining} of ${result.attempt_limit} retry attempts remain.`
                  : `You scored ${result.score}/50, below the 40/50 pass mark. You have used your first assessment and all ${result.attempt_limit} retries. Practice ${assessment.subtopic_name}; one more retry will be available after ${new Date(result.retry_available_at).toLocaleString()}.`}
            </p>

            <ol className="mt-5 space-y-3">
              {result.breakdown.map((item, index) => (
                <li
                  key={item.question_id}
                  className="rounded-xl border border-gray-100 p-3 dark:border-slate-800"
                >
                  <p className="text-sm font-medium">
                    {index + 1}. {item.question}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      item.is_correct
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {item.is_correct ? "Correct" : "Incorrect"} · {item.marks}/{assessment.marks_per_question} marks
                  </p>
                  <p
                    className={`mt-1 text-xs font-medium ${
                      item.is_correct
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    Your answer: {item.user_answer || "No answer"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Correct answer: {item.correct_answer}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={startingRetry || !result.can_retry || result.passed}
                onClick={retry}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
              >
                {startingRetry
                  ? "Starting…"
                  : result.passed
                      ? "Subtopic passed"
                      : result.can_retry
                      ? "Subtopic passed"
                      : `Retry available after ${new Date(result.retry_available_at).toLocaleString()}`}
              </button>
              {result.passed && (
                <button
                  type="button"
                  disabled={startingNext}
                  onClick={continueToNextAssessment}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {startingNext ? "Loading next topic…" : "Continue to next assessment"}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  navigate("/skills", {
                    state: {
                      skill: assessment.skill,
                      level: assessment.level,
                      subtopic: assessment.subtopic,
                    },
                  })
                }
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200"
              >
                Back to Skills
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate("/progress", {
                    state: {
                      skill: assessment.skill,
                      level: assessment.level,
                      subtopic: assessment.subtopic,
                    },
                  })
                }
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200"
              >
                View Progress
              </button>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {currentQuestion && (
              <fieldset
                key={currentQuestion.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
              >
                <legend className="w-full text-sm font-semibold">
                  <span className="mr-2 text-indigo-600 dark:text-indigo-300">
                    Question {questionIndex + 1} of {questions.length}
                  </span>
                  {currentQuestion.question}
                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-slate-400">
                    ({currentQuestion.marks} marks)
                  </span>
                </legend>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{
                      width: `${((questionIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {currentQuestion.options.map((option, optionIndex) => (
                    <label
                      key={`${currentQuestion.id}-${optionIndex}`}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${
                        answers[String(currentQuestion.id)] === option
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                          : "border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[String(currentQuestion.id)] === option}
                        onChange={() => {
                          setError("");
                          setAnswers((current) => {
                            const next = {
                              ...current,
                              [String(currentQuestion.id)]: option,
                            };
                            localStorage.setItem(
                              `mathvox-assessment-${localStorage.getItem("user_id")}-${assessment.quiz_id}`,
                              JSON.stringify({ answers: next, currentIndex: questionIndex })
                            );
                            return next;
                          });
                        }}
                        className="accent-indigo-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={questionIndex === 0}
                onClick={() => {
                  setError("");
                  setQuestionIndex((index) => Math.max(0, index - 1));
                }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {answeredCount} of {questions.length} answered
              </p>
              {questionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  disabled={!hasCurrentAnswer}
                  onClick={() => {
                    setError("");
                    setQuestionIndex((index) =>
                      Math.min(questions.length - 1, index + 1)
                    );
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next question
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting || questions.length === 0}
                  onClick={submit}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Marking…" : "Submit assessment"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
