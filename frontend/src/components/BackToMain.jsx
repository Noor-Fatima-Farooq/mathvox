import { Link } from "react-router-dom";

export default function BackToMain() {
  return (
    <Link
      to="/chat"
      className="mb-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true">←</span>
      Back to main
    </Link>
  );
}
