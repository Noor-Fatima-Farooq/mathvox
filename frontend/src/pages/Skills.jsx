import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/CurriculumLayout";
import BackToMain from "../components/BackToMain";
import { getCurriculumDashboard, startSubtopicQuiz } from "../services/api";

const LEVELS = [
  { id: "beginner", name: "Beginner" },
  { id: "developing", name: "Proficiency" },
  { id: "proficiency", name: "Advanced" },
];

const getLevelProgress = (level) => ({
  earned: level.earned_marks ?? 0,
  possible: level.possible_marks ?? level.required_count * 50,
  percentage: level.percentage ?? 0,
});

const getAttemptMessage = (subtopic) => {
  if (subtopic.is_started) return "Assessment in progress · marks count after submission";
  if (subtopic.passed) return `Passed · ${subtopic.attempts} ${subtopic.attempts === 1 ? "attempt" : "attempts"}`;
  if (subtopic.attempts > 0) {
    const remaining = subtopic.attempts_remaining ?? 0;
    const retriesUsed = Math.min(
      Math.max(subtopic.attempts - 1, 0),
      subtopic.attempt_limit
    );
    if (subtopic.retry_cooldown_active) {
      return `${retriesUsed}/${subtopic.attempt_limit} retries used · available ${new Date(subtopic.retry_available_at).toLocaleString()}`;
    }
    if (subtopic.retry_after_cooldown_available) {
      return `${subtopic.attempt_limit}/${subtopic.attempt_limit} initial retries used · one retry available now`;
    }
    return `${retriesUsed}/${subtopic.attempt_limit} retries used · ${remaining} ${remaining === 1 ? "retry" : "retries"} left`;
  }
  return null;
};

export default function Skills() {
  const location = useLocation();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(
    location.state?.level || "beginner"
  );
  const [openSkill, setOpenSkill] = useState(location.state?.skill || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingSubtopic, setStartingSubtopic] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    getCurriculumDashboard()
      .then((data) => {
        if (active) {
          setSkills(data.skills || []);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load your skills.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  useEffect(() => {
    if (!location.state?.skill || !location.state?.subtopic) return;
    document
      .getElementById(
        `subtopic-${location.state.skill}-${location.state.level}-${location.state.subtopic}`
      )
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [location.state, skills, selectedLevel]);

  useEffect(() => {
    if (location.state?.skill) {
      setOpenSkill(location.state.skill);
    }
  }, [location.state]);

  const startAssessment = async (skill, level, subtopic) => {
    const key = `${skill.id}:${level.id}:${subtopic.id}`;
    setStartingSubtopic(key);
    setError("");
    try {
      const assessment = await startSubtopicQuiz({
        level: level.id,
        skill: skill.id,
        subtopic: subtopic.id,
      });
      navigate("/assessment", { state: { assessment } });
    } catch (err) {
      setError(err.message || "Could not start this assessment.");
    } finally {
      setStartingSubtopic(null);
    }
  };

  const selectedLevelInfo = LEVELS.find((level) => level.id === selectedLevel);

  return (
    <main className="h-[calc(100dvh-57px)] overflow-y-auto px-4 py-5 text-gray-900 dark:text-white sm:px-6 md:px-8">
      <div className="mx-auto max-w-5xl pb-8">
        <BackToMain />
        <header className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
            Your learning
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Skills</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Master every subtopic in a skill to unlock that same skill at the next level.
          </p>
        </header>

        <div
          aria-label="Select curriculum level"
          className="mb-4 flex flex-wrap gap-2"
          role="group"
        >
          {LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-pressed={selectedLevel === level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedLevel === level.id
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {level.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading your curriculum…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/30"
          >
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setReload((current) => current + 1);
              }}
              className="mt-3 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
            >
              Try again
            </button>
          </div>
        ) : skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-semibold">No curriculum data available</h2>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setReload((current) => current + 1);
              }}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-500 dark:text-slate-400">
              {selectedLevelInfo.name} · {skills.length} skills ·{" "}
              {skills[0]?.levels?.[selectedLevel]?.required_count || 0} assessments per skill
            </p>
            <section aria-label={`${selectedLevelInfo.name} skills`} className="grid items-start gap-3 sm:grid-cols-2">
              {skills.map((skill) => {
                const level = skill.levels?.[selectedLevel];
                if (!level) return null;
                const progress = getLevelProgress(level);

                return (
                  <details
                    key={skill.id}
                    open={openSkill === skill.id}
                    className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
                  >
                    <summary
                      onClick={(event) => {
                        event.preventDefault();
                        setOpenSkill((current) =>
                          current === skill.id ? null : skill.id
                        );
                      }}
                      className="flex cursor-pointer list-none items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold">{skill.name}</h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                          {level.passed_count} of {level.required_count} subtopics passed
                        </p>
                        <div
                          role="progressbar"
                          aria-label={`${skill.name} ${selectedLevelInfo.name} completion`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress.percentage}
                          className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
                        >
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {level.is_unlocked ? (
                          <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                            {progress.percentage}%
                          </span>
                        ) : (
                          <StatusBadge status="locked" />
                        )}
                        <span
                          aria-hidden="true"
                          className="text-lg text-gray-500 transition-transform group-open:rotate-180 dark:text-slate-400"
                        >
                          ⌄
                        </span>
                      </div>
                    </summary>

                    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-slate-800">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          Score earned
                        </span>
                        <span className="text-base font-bold tabular-nums">
                          {progress.earned}/{progress.possible} marks
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${skill.name} ${selectedLevelInfo.name} completed score`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress.percentage}
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
                      >
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>

                      {!level.is_unlocked && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                          Pass every{" "}
                          {LEVELS[LEVELS.findIndex((item) => item.id === selectedLevel) - 1]?.name}{" "}
                          {skill.name} subtopic to unlock these assessments.
                        </p>
                      )}
                      <ul className="mt-3 space-y-1.5">
                        {level.subtopics.map((subtopic) => {
                          const key = `${skill.id}:${level.id}:${subtopic.id}`;
                          const busy = startingSubtopic === key;
                          return (
                            <li
                              key={subtopic.id}
                              id={`subtopic-${skill.id}-${level.id}-${subtopic.id}`}
                              className="rounded-xl border border-gray-100 px-3 py-2.5 dark:border-slate-800"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">{subtopic.name}</p>
                                  {getAttemptMessage(subtopic) && (
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                                      {getAttemptMessage(subtopic)}
                                    </p>
                                  )}
                                  {subtopic.retry_available_at && (
                                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                                      Practice and return{" "}
                                      {new Date(subtopic.retry_available_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {subtopic.attempts > 0 && (
                                    <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-slate-200">
                                      {Math.round(subtopic.current_score)}/{subtopic.total_marks}
                                    </span>
                                  )}
                                  <StatusBadge
                                    status={level.is_unlocked ? subtopic.status : "locked"}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={!level.is_unlocked || !subtopic.can_start || busy}
                                onClick={() => startAssessment(skill, level, subtopic)}
                                className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                              >
                                {!level.is_unlocked
                                  ? "Locked — pass previous level"
                                  : busy
                                    ? "Starting…"
                                    : subtopic.is_started
                                      ? `Resume question ${(subtopic.current_index || 0) + 1}`
                                      : subtopic.passed
                                        ? "Passed"
                                        : !subtopic.can_start
                                          ? "Practice while retry is locked"
                                          : subtopic.attempts
                                            ? "Retry assessment"
                                            : "Start assessment"}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </details>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
