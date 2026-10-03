export default function CurriculumSnapshot({ summary, activeAssessment }) {
  const metrics = [
    { label: "Current level", value: summary?.current_level || "Beginner" },
    {
      label: "Current topic",
      value:
        (activeAssessment
          ? `${activeAssessment.skill_name} · ${activeAssessment.subtopic_name}`
          : null) ||
        summary?.next_step?.current_topic ||
        (summary?.next_step?.action === "complete"
          ? "All unlocked topics mastered"
          : "Start a Beginner topic"),
    },
    { label: "Daily streak", value: `${summary?.streak_days ?? 0} days` },
    {
      label: "Curriculum progress",
      value: `${summary?.overall_progress ?? 0}%`,
    },
  ];

  return (
    <section
      aria-label="Your learning summary"
      className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Your learning summary</h2>
      </div>
      {summary ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-slate-800/70"
              >
                <p className="text-xs text-gray-500 dark:text-slate-400">{metric.label}</p>
                <p className="mt-0.5 text-sm font-bold">{metric.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">
            {activeAssessment
              ? `Continue ${activeAssessment.subtopic_name} at question ${activeAssessment.current_index + 1}. Your saved answers are ready.`
              : summary.next_step?.text ||
                `You have passed ${summary.passed_subtopics ?? 0} of ${summary.total_subtopics ?? 48} subtopics. Choose your next topic in Skills.`}
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
          Learning summary appears when curriculum data is available.
        </p>
      )}
    </section>
  );
}
