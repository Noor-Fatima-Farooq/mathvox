import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/CurriculumLayout";
import CurriculumSnapshot from "../components/CurriculumSnapshot";
import BackToMain from "../components/BackToMain";
import { getCurriculumDashboard, startSubtopicQuiz } from "../services/api";

const levelNames = ["Beginner", "Proficiency", "Advanced"];

export default function Levels() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingSubtopic, setStartingSubtopic] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    getCurriculumDashboard()
      .then((data) => {
        if (active) {
          setLevels(data.levels || []);
          setSummary(data.summary || null);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load your levels.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

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

  return (
    <main className="h-[calc(100dvh-57px)] overflow-y-auto px-4 py-5 text-gray-900 dark:text-white sm:px-6 md:px-8">
      <div className="mx-auto max-w-5xl pb-8">
        <BackToMain />
        <header className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
            Your learning path
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Levels</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Beginner assessments are all open. Master every subtopic in a skill to unlock that skill at the next level.
          </p>
        </header>

        <CurriculumSnapshot summary={summary} />

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading your learning path…
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
        ) : levels.length === 0 ? (
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
          <section aria-label="Skill progression by level" className="space-y-4">
            {levels.map((level, levelIndex) => {
              const unlockedSkills = level.skills.filter((skill) => skill.is_unlocked).length;
              const masteredSkills = level.skills.filter(
                (skill) => skill.status === "mastered"
              ).length;
              const needsImprovement = level.skills.some(
                (skill) => skill.status === "needs_improvement"
              );
              const inProgress = level.skills.some(
                (skill) => skill.status === "in_progress"
              );

              return (
                <article
                  key={level.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Level {levelIndex + 1}
                      </p>
                      <h2 className="mt-0.5 text-lg font-semibold">{level.name}</h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        {masteredSkills} of {level.skills.length} skills mastered · {unlockedSkills}{" "}
                        {unlockedSkills === 1 ? "skill" : "skills"} unlocked
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        unlockedSkills === 0
                          ? "locked"
                          : masteredSkills === level.skills.length
                            ? "mastered"
                            : needsImprovement
                              ? "needs_improvement"
                              : inProgress
                              ? "in_progress"
                              : "unlocked"
                      }
                    />
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${level.name} skills mastered`}
                    aria-valuemin={0}
                    aria-valuemax={level.skills.length}
                    aria-valuenow={masteredSkills}
                    className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
                  >
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{
                        width: `${level.skills.length ? (masteredSkills / level.skills.length) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {level.skills.map((skill) => (
                      <details
                        key={skill.id}
                        open
                        className="rounded-xl border border-gray-100 p-3 dark:border-slate-800"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                          <span className="font-medium">{skill.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {skill.passed_count}/{skill.required_count}
                            </span>
                            <StatusBadge status={skill.status} />
                          </span>
                        </summary>
                        <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                          {skill.subtopics.map((subtopic) => {
                            const key = `${skill.id}:${level.id}:${subtopic.id}`;
                            const busy = startingSubtopic === key;
                            return (
                              <li
                                key={subtopic.id}
                                className="flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm">{subtopic.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {subtopic.attempts
                                      ? `${Math.round(subtopic.current_score)}/${subtopic.total_marks} marks`
                                      : "Not attempted"}
                                  </p>
                                  {subtopic.retry_available_at && (
                                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                      Practice now; retry{" "}
                                      {new Date(subtopic.retry_available_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                {skill.is_unlocked && subtopic.can_start ? (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => startAssessment(skill, level, subtopic)}
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                                  >
                                    {busy
                                      ? "Starting…"
                                      : subtopic.attempts
                                        ? subtopic.passed
                                          ? "Practice"
                                          : "Retry"
                                        : "Start"}
                                  </button>
                                ) : skill.is_unlocked ? (
                                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                    Practice while retry is locked
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-gray-400 dark:text-slate-500">
                                    Locked
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        {!skill.is_unlocked && levelIndex > 0 && (
                          <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
                            Pass all {levelNames[levelIndex - 1]}{" "}
                            {skill.name} assessments to unlock this skill.
                          </p>
                        )}
                      </details>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
