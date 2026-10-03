import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/CurriculumLayout";
import CurriculumSnapshot from "../components/CurriculumSnapshot";
import BackToMain from "../components/BackToMain";
import { getCurriculumDashboard, startSubtopicQuiz } from "../services/api";

export default function Progress() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingNext, setStartingNext] = useState(false);
  const [startingSubtopic, setStartingSubtopic] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    getCurriculumDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Could not load curriculum progress.");
        }
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
        `progress-${location.state.skill}-${location.state.level}-${location.state.subtopic}`
      )
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [location.state, dashboard]);

  const startNextStep = async () => {
    const active = dashboard?.active_assessment;
    const next = dashboard?.summary?.next_step;
    if (active) {
      navigate("/assessment", { state: { assessment: active } });
      return;
    }
    if (!next?.skill_id || !next.level || !next.subtopic_id) return;
    setStartingNext(true);
    setError("");
    try {
      const assessment = await startSubtopicQuiz({
        level: next.level,
        skill: next.skill_id,
        subtopic: next.subtopic_id,
      });
      navigate("/assessment", { state: { assessment } });
    } catch (err) {
      setError(err.message || "Could not start your next assessment.");
    } finally {
      setStartingNext(false);
    }
  };

  const startSubtopic = async (skill, level, subtopic) => {
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

  const summary = dashboard?.summary;
  const skills = dashboard?.skills || [];
  const levels = dashboard?.levels || [];
  const nextStep = summary?.next_step;
  const activeAssessment = dashboard?.active_assessment;

  return (
    <main className="h-[calc(100dvh-57px)] overflow-y-auto px-4 py-5 text-gray-900 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl pb-8">
        <BackToMain />
        <header className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
            Your learning
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Progress</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Track every skill and level independently, and see what to work on next.
          </p>
        </header>

        <CurriculumSnapshot summary={summary} activeAssessment={activeAssessment} />

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading your curriculum progress…
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
        ) : dashboard ? (
          <>
            {(nextStep || activeAssessment) && (
              <section className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <h2 className="font-semibold">
                  {activeAssessment ? "Continue your assessment" : "Next step"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {activeAssessment
                    ? `${activeAssessment.skill_name} · ${activeAssessment.subtopic_name}`
                    : nextStep?.text || "Continue your saved assessment."}
                </p>
                {(activeAssessment || nextStep?.skill_id) && (
                  <button
                    type="button"
                    disabled={startingNext}
                    onClick={startNextStep}
                    className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                  >
                    {startingNext
                      ? "Starting…"
                      : activeAssessment
                        ? `Resume question ${(activeAssessment.current_index || 0) + 1}`
                        : nextStep.action === "retry"
                          ? "Retry this subtopic"
                          : "Start next assessment"}
                  </button>
                )}
              </section>
            )}

            <section className="mt-5">
              <div className="mb-3">
                <h2 className="text-lg font-semibold">Progress by skill and level</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Scores are shown topic by topic. Each level percentage is marks earned out of all marks available in that skill level.
                </p>
                <Link
                  to="/history"
                  className="mt-2 inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-gray-50 dark:border-slate-700 dark:text-indigo-300 dark:hover:bg-slate-800"
                >
                  View weekly assessment history
                </Link>
              </div>
              <div className="hidden w-full overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 xl:block">
                <table className="w-full table-fixed text-left text-xs">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-800/70 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="w-[12%] px-2 py-3 font-semibold sm:px-3">Skill</th>
                      {levels.map((level) => (
                        <th key={level.id} scope="col" className="w-[29.33%] border-l border-gray-100 px-2 py-3 font-semibold dark:border-slate-800 sm:px-3">
                          {level.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {skills.map((skill) => (
                      <tr key={skill.id}>
                        <th scope="row" className="break-words align-top px-2 py-3 font-semibold sm:px-3 sm:py-4">
                          {skill.name}
                        </th>
                        {levels.map((level) => {
                          const levelProgress = skill.levels[level.id];
                          return (
                            <td key={level.id} className="min-w-0 align-top border-l border-gray-100 px-1.5 py-2.5 dark:border-slate-800 sm:px-2 sm:py-3">
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <div className="min-w-0 break-words">
                                  <p className="font-semibold tabular-nums">
                                    {levelProgress.earned_marks}/{levelProgress.possible_marks} marks
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                                    {levelProgress.percentage}% · {levelProgress.passed_count}/{levelProgress.required_count} passed
                                  </p>
                                </div>
                                {!levelProgress.is_unlocked && <StatusBadge status="locked" />}
                              </div>
                              <ul className="space-y-2">
                                {levelProgress.subtopics.map((subtopic) => {
                                  const id = `${skill.id}:${level.id}:${subtopic.id}`;
                                  const busy = startingSubtopic === id;
                                  return (
                                    <li
                                      key={subtopic.id}
                                      id={`progress-${skill.id}-${level.id}-${subtopic.id}`}
                                      className="min-w-0 rounded-lg border border-gray-100 p-1.5 dark:border-slate-800 sm:p-2"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="min-w-0 flex-1 break-words text-xs font-medium leading-4">
                                          {subtopic.name}
                                        </p>
                                        <span className="shrink-0 whitespace-nowrap text-[10px] font-semibold tabular-nums sm:text-xs">
                                          {Math.round(subtopic.current_score)}/{subtopic.total_marks}
                                          {levelProgress.is_unlocked && ` · ${subtopic.percentage}%`}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                                        <p className="break-words text-[10px] leading-4 text-gray-500 dark:text-slate-400 sm:text-[11px]">
                                          {subtopic.is_started
                                            ? "In progress · marks count after submit"
                                            : subtopic.passed
                                              ? `Passed · ${subtopic.attempts} ${subtopic.attempts === 1 ? "attempt" : "attempts"}`
                                              : subtopic.attempts > 0
                                                  ? subtopic.retry_cooldown_active
                                                    ? `${Math.min(Math.max(subtopic.attempts - 1, 0), subtopic.attempt_limit)}/${subtopic.attempt_limit} retries used · available ${new Date(subtopic.retry_available_at).toLocaleString()}`
                                                    : subtopic.retry_after_cooldown_available
                                                      ? `${subtopic.attempt_limit}/${subtopic.attempt_limit} initial retries used · one retry available now`
                                                      : `${Math.min(Math.max(subtopic.attempts - 1, 0), subtopic.attempt_limit)}/${subtopic.attempt_limit} retries used · ${subtopic.attempts_remaining ?? 0} ${subtopic.attempts_remaining === 1 ? "retry" : "retries"} left`
                                                  : "Not started"}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={!levelProgress.is_unlocked || !subtopic.can_start || busy}
                                        onClick={() => startSubtopic(skill, level, subtopic)}
                                        className="mt-2 w-full break-words rounded-lg bg-indigo-600 px-1.5 py-1.5 text-[10px] font-semibold leading-4 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 sm:px-2 sm:text-xs"
                                      >
                                        {busy
                                          ? "Starting…"
                                          : !levelProgress.is_unlocked
                                            ? "Locked"
                                            : subtopic.is_started
                                              ? `Resume question ${(subtopic.current_index || 0) + 1}`
                                              : subtopic.passed
                                                ? "Passed"
                                              : !subtopic.can_start
                                                ? "Retry unavailable"
                                                : subtopic.attempts
                                                  ? "Retry assessment"
                                                  : "Start assessment"}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 xl:hidden">
                {skills.map((skill) => (
                  <section
                    key={skill.id}
                    className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4"
                  >
                    <h3 className="font-semibold">{skill.name}</h3>
                    <div className="mt-3 space-y-3">
                      {levels.map((level) => {
                        const levelProgress = skill.levels[level.id];
                        return (
                          <section
                            key={level.id}
                            className="rounded-xl border border-gray-100 p-3 dark:border-slate-800"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-semibold">{level.name}</h4>
                              {!levelProgress.is_unlocked && (
                                <StatusBadge status="locked" />
                              )}
                              <p className="text-xs tabular-nums text-gray-500 dark:text-slate-400">
                                {levelProgress.earned_marks}/{levelProgress.possible_marks} marks ·{" "}
                                {levelProgress.percentage}% · {levelProgress.passed_count}/{levelProgress.required_count} passed
                              </p>
                            </div>
                            <ul className="mt-2 space-y-2">
                              {levelProgress.subtopics.map((subtopic) => {
                                const id = `${skill.id}:${level.id}:${subtopic.id}`;
                                const busy = startingSubtopic === id;
                                return (
                                  <li
                                    key={subtopic.id}
                                    id={`progress-mobile-${skill.id}-${level.id}-${subtopic.id}`}
                                    className="rounded-lg border border-gray-100 p-2.5 dark:border-slate-800"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <p className="min-w-0 flex-1 text-sm font-medium">
                                        {subtopic.name}
                                      </p>
                                      <span className="shrink-0 text-xs font-semibold tabular-nums">
                                        {Math.round(subtopic.current_score)}/{subtopic.total_marks}
                                        {levelProgress.is_unlocked && ` · ${subtopic.percentage}%`}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                                      <p className="text-xs text-gray-500 dark:text-slate-400">
                                        {subtopic.is_started
                                          ? "In progress · marks count after submit"
                                          : subtopic.passed
                                            ? `Passed · ${subtopic.attempts} ${subtopic.attempts === 1 ? "attempt" : "attempts"}`
                                            : subtopic.attempts > 0
                                              ? subtopic.retry_cooldown_active
                                                ? `${Math.min(Math.max(subtopic.attempts - 1, 0), subtopic.attempt_limit)}/${subtopic.attempt_limit} retries used · available ${new Date(subtopic.retry_available_at).toLocaleString()}`
                                                : subtopic.retry_after_cooldown_available
                                                  ? `${subtopic.attempt_limit}/${subtopic.attempt_limit} initial retries used · one retry available now`
                                                  : `${Math.min(Math.max(subtopic.attempts - 1, 0), subtopic.attempt_limit)}/${subtopic.attempt_limit} retries used · ${subtopic.attempts_remaining ?? 0} ${subtopic.attempts_remaining === 1 ? "retry" : "retries"} left`
                                              : "Not started"}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={!levelProgress.is_unlocked || !subtopic.can_start || busy}
                                      onClick={() => startSubtopic(skill, level, subtopic)}
                                      className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                                    >
                                      {busy
                                        ? "Starting…"
                                        : !levelProgress.is_unlocked
                                          ? "Locked"
                                          : subtopic.is_started
                                            ? `Resume question ${(subtopic.current_index || 0) + 1}`
                                            : subtopic.passed
                                              ? "Passed"
                                              : !subtopic.can_start
                                                ? "Retry unavailable"
                                                : subtopic.attempts
                                                  ? "Retry assessment"
                                                  : "Start assessment"}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </section>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>

          </>
        ) : null}
      </div>
    </main>
  );
}
