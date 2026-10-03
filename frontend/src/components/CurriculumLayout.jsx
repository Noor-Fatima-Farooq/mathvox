import React, { useCallback, useEffect, useState } from "react";
import ChatSidebar from "./ChatSidebar";
import SidebarToggle from "./SidebarToggle";
import {
  isLoggedIn,
  isSidebarCollapsed,
  setSidebarCollapsed,
} from "../services/chatStorage";

export default function CurriculumLayout({ title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(isSidebarCollapsed);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen((open) => !open);
      return;
    }
    setSidebarCollapsedState((collapsed) => {
      const next = !collapsed;
      setSidebarCollapsed(next);
      if (next) setSidebarOpen(false);
      return next;
    });
  }, []);

  const loggedIn = isLoggedIn();
  const sidebarVisible = loggedIn && (isMobile ? sidebarOpen : !sidebarCollapsed);

  return (
    <div
      className={`flex overflow-hidden bg-slate-50 dark:bg-slate-900 ${
        loggedIn ? "fixed inset-0 z-30 h-dvh w-full" : "min-h-screen"
      }`}
    >
      {loggedIn && (
        <ChatSidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          collapsed={sidebarCollapsed}
        />
      )}

      <div
        className={`relative flex flex-col flex-1 min-w-0 min-h-0 h-full overflow-hidden transition-[margin] duration-200 ${
          !isMobile && sidebarVisible ? "md:ml-[260px]" : ""
        }`}
      >
        <header className="flex items-center h-14 px-2 shrink-0 border-b border-gray-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur">
          {loggedIn && (
            <SidebarToggle
              sidebarOpen={sidebarVisible}
              onClick={handleSidebarToggle}
              className="flex shrink-0"
            />
          )}
          <div className="min-w-0 px-2">
            <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-4xl mx-auto pb-16">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    mastered: {
      label: "Mastered",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/50",
    },
    passed: {
      label: "Passed",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/50",
    },
    needs_improvement: {
      label: "Needs improvement",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-300 dark:border-amber-800/50",
    },
    in_progress: {
      label: "In progress",
      className:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/50",
    },
    unlocked: {
      label: "Unlocked",
      className:
        "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-300 dark:border-violet-800/50",
    },
    not_started: {
      label: "Not started",
      className:
        "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border-gray-300 dark:border-slate-700",
    },
    locked: {
      label: "Locked",
      className:
        "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-500 border-gray-300 dark:border-slate-700",
    },
  };
  const item = map[status] || map.not_started;
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border ${item.className}`}
    >
      {item.label}
    </span>
  );
}
