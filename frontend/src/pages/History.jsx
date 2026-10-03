import { useEffect, useState } from "react";
import BackToMain from "../components/BackToMain";
import { getAssessmentHistory } from "../services/api";

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function History() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAssessmentHistory()
      .then((data) => {
        if (active) setHistory(data.cycles || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load assessment history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="h-[calc(100dvh-57px)] overflow-y-auto px-4 py-5 text-gray-900 dark:text-white sm:px-6 md:px-8">
      <div className="mx-auto max-w-5xl pb-8">
        <BackToMain />
        <header className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
            Your learning
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Assessment history
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            A fresh Beginner cycle starts every Monday. Weekly totals count each subtopic’s latest passing score toward all 48 Beginner, Proficiency, and Advanced subtopics. Failed attempts remain in the history but don’t add marks to the total.
          </p>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading your assessment history…
          </div>
        ) : error ? (
          <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </p>
        ) : history.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-semibold">No submitted assessments yet</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Submitted test results will appear here, grouped by week.
            </p>
          </section>
        ) : (
          <div className="space-y-5">
            {history.map((cycle) => (
              <section
                key={cycle.cycle_id}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Learning cycle {cycle.cycle_number}
                      {cycle.is_current && (
                        <span className="ml-2 rounded-full bg-indigo-100 px-2 py-1 align-middle text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Current
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      Started {formatDate(cycle.started_at)}
                      {cycle.completed_at && ` · Completed ${formatDate(cycle.completed_at)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {cycle.attempts === 0
                        ? "No assessments submitted yet"
                        : `${cycle.passed_attempts}/${cycle.attempts} assessments passed`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {cycle.weeks.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-slate-800/70 dark:text-slate-400">
                      No submitted assessments in this cycle yet.
                    </p>
                  ) : (
                    cycle.weeks.map((week) => (
                      <details
                        key={week.week_start}
                        className="rounded-xl border border-gray-100 p-3 dark:border-slate-800"
                      >
                        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold">
                              Week of {formatDate(week.week_start || cycle.started_at)}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                              {week.attempts} tests · {week.passed} passed · {week.earned_marks}/{week.curriculum_total_marks} marks
                            </p>
                          </div>
                          <span className="text-sm font-bold tabular-nums">
                            {week.percentage ?? 0}%
                          </span>
                        </summary>
                        <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                          {week.assessments.map((assessment) => (
                            <li
                              key={`${assessment.submitted_at}-${assessment.skill}-${assessment.subtopic}`}
                              className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            >
                              <div>
                                <p className="font-medium">
                                  {assessment.skill_name} · {assessment.subtopic_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                  {assessment.level_name} ·{" "}
                                  {formatDate(
                                    assessment.submitted_at ||
                                      week.week_start ||
                                      cycle.started_at
                                  )}
                                </p>
                              </div>
                              <p
                                className={`font-semibold tabular-nums ${
                                  assessment.passed === true
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : assessment.passed === false
                                      ? "text-rose-700 dark:text-rose-300"
                                      : "text-gray-500 dark:text-slate-400"
                                }`}
                              >
                                {assessment.score === null
                                  ? "Score unavailable"
                                  : `${assessment.score}/${assessment.total_marks} · ${assessment.percentage}%`}
                                {assessment.performance === "excellent"
                                  ? " · Excellent"
                                  : assessment.performance === "good"
                                    ? " · Good"
                                    : assessment.performance === "needs_improvement" &&
                                        assessment.score !== null
                                      ? " · Needs improvement"
                                      : ""}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
