import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import AdminStatCard from "../components/AdminStatCard";
import { getAdminAnalytics } from "../services/api";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminAnalytics();

        setAnalytics(data);
      } catch (err) {
        console.error("Could not load admin analytics:", err);
        setError(
          err.message || "Could not load dashboard analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AdminSidebar />

        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <AdminHeader />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Overview
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Loading MathVox analytics...
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 animate-pulse"
                  />
                ))}
              </div>

            </div>
          </main>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error || !analytics) {
    return (
      <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AdminSidebar />

        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <AdminHeader />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">

              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Overview
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  MathVox administrator dashboard
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-5">

                <div className="flex items-start gap-3">

                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                    ⚠️
                  </div>

                  <div>
                    <h2 className="font-semibold text-red-700 dark:text-red-400">
                      Could not load dashboard analytics
                    </h2>

                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {error ||
                        "No analytics data was returned by the backend."}
                    </p>

                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </main>
        </div>
      </div>
    );
  }

  // ============================================================
  // BACKEND DATA
  // ============================================================

  const totalUsers = analytics.total_users ?? 0;
  const activeUsers = analytics.active_users ?? 0;
  const conversations = analytics.conversations ?? 0;
  const problemsSolved = analytics.problems_solved ?? 0;

  const userGrowth = Array.isArray(analytics.user_growth)
    ? analytics.user_growth
    : [];

  const activityOverview = analytics.activity_overview ?? {};

  const dailyActivity = Array.isArray(analytics.daily_activity)
    ? analytics.daily_activity
    : [];

  const quickStats = analytics.quick_stats ?? {};

  // ============================================================
  // STATS CARDS
  // ============================================================

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      change: "",
      icon: "👥",
    },
    {
      title: "Active Users",
      value: activeUsers.toLocaleString(),
      change: "",
      icon: "🟢",
    },
    {
      title: "Total Conversations",
      value: conversations.toLocaleString(),
      change: "",
      icon: "💬",
    },
    {
      title: "Problems Solved",
      value: problemsSolved.toLocaleString(),
      change: "",
      icon: "🧮",
    },
  ];

  // ============================================================
  // USER GROWTH
  // ============================================================

  const maxGrowth = Math.max(
    ...userGrowth.map((item) => Number(item.value) || 0),
    1
  );

  // ============================================================
  // ACTIVITY OVERVIEW
  // ============================================================

  const chatActivity = Number(
    activityOverview.chat_activity ?? 0
  );

  const problemSolving = Number(
    activityOverview.problem_solving ?? 0
  );

  const assessmentActivity = Number(
    activityOverview.assessment_activity ?? 0
  );

  const verifiedAccounts = Number(
    activityOverview.verified_accounts ?? 0
  );

  // ============================================================
  // DAILY ACTIVITY
  // ============================================================

  const maxDailyActivity = Math.max(
    ...dailyActivity.map((item) => Number(item.value) || 0),
    1
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ======================================================
          ADMIN SIDEBAR
      ====================================================== */}

      <AdminSidebar />

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">

        {/* Header */}
        <AdminHeader />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">

          <div className="max-w-7xl mx-auto">

            {/* ==================================================
                WELCOME
            ================================================== */}

            <div className="mb-6">

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Overview
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Here's what's happening with MathVox today.
              </p>

            </div>

            {/* ==================================================
                STAT CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

              {stats.map((stat) => (
                <AdminStatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  icon={stat.icon}
                />
              ))}

            </div>

            {/* ==================================================
                USER GROWTH + ACTIVITY OVERVIEW
            ================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">

              {/* =================================================
                  USER GROWTH
              ================================================= */}

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

                <div className="flex items-center justify-between mb-5">

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      User Growth
                    </h2>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      New users registered each month
                    </p>
                  </div>

                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Last 6 Months
                  </div>

                </div>

                {/* Chart */}

                <div className="h-64 flex items-end gap-2">

                  {userGrowth.map((item, index) => {

                    const value = Number(item.value) || 0;

                    const height =
                      (value / maxGrowth) * 100;

                    return (
                      <div
                        key={`${item.month}-${index}`}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >

                        {/* Value */}

                        <div className="mb-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {value}
                        </div>

                        {/* Professional Blue Bar */}

                        <div
                          className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-md hover:bg-blue-500 dark:hover:bg-blue-500 transition-all duration-200"
                          style={{
                            height: `${Math.max(
                              height,
                              value > 0 ? 5 : 1
                            )}%`,
                          }}
                          title={`${item.month}: ${value} users`}
                        />

                      </div>
                    );
                  })}

                </div>

                {/* Months */}

                <div className="flex justify-between mt-3 text-[11px] text-slate-400 dark:text-slate-500">

                  {userGrowth.map((item, index) => (
                    <span
                      key={`${item.month}-label-${index}`}
                      className="flex-1 text-center"
                    >
                      {item.month}
                    </span>
                  ))}

                </div>

              </div>

              {/* =================================================
                  ACTIVITY OVERVIEW
              ================================================= */}

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

                <div className="mb-5">

                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Activity Overview
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Percentage of users interacting with MathVox features
                  </p>

                </div>

                <div className="space-y-5">

                  {/* Chat Activity */}

                  <div>

                    <div className="flex items-center justify-between mb-2">

                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />

                        Chat Activity

                      </span>

                      <span className="font-medium text-gray-900 dark:text-white">
                        {chatActivity}%
                      </span>

                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">

                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            chatActivity,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* Problem Solving */}

                  <div>

                    <div className="flex items-center justify-between mb-2">

                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />

                        Problem Solving

                      </span>

                      <span className="font-medium text-gray-900 dark:text-white">
                        {problemSolving}%
                      </span>

                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">

                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            problemSolving,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* Assessment Activity */}

                  <div>

                    <div className="flex items-center justify-between mb-2">

                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />

                        Assessment Activity

                      </span>

                      <span className="font-medium text-gray-900 dark:text-white">
                        {assessmentActivity}%
                      </span>

                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">

                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            assessmentActivity,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* Verified Accounts */}

                  <div>

                    <div className="flex items-center justify-between mb-2">

                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />

                        Verified Accounts

                      </span>

                      <span className="font-medium text-gray-900 dark:text-white">
                        {verifiedAccounts}%
                      </span>

                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">

                      <div
                        className="h-full bg-slate-600 dark:bg-slate-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            verifiedAccounts,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                QUICK STATS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

              {/* Daily Active Users */}

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    👤
                  </div>

                  <div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Daily Active Users
                    </p>

                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {Number(
                        quickStats.daily_active_users ?? 0
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

              {/* Success Rate */}

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    ✓
                  </div>

                  <div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Assessment Success Rate
                    </p>

                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {Number(
                        quickStats.success_rate ?? 0
                      )}%
                    </p>

                  </div>

                </div>

              </div>

              {/* Average Problems */}

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                    🧮
                  </div>

                  <div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Avg Problems / User
                    </p>

                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {Number(
                        quickStats.avg_problems_per_user ?? 0
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                DAILY ACTIVITY
            ================================================== */}

            <div className="mt-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

              <div className="mb-5">

                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Daily Activity
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Chat message activity by day of the week
                </p>

              </div>

              <div className="grid grid-cols-7 gap-3">

                {dailyActivity.map((item) => {

                  const value = Number(item.value) || 0;
                  const messages = Number(item.messages) || 0;

                  const height =
                    (value / maxDailyActivity) * 100;

                  return (
                    <div
                      key={item.day}
                      className="flex flex-col items-center"
                    >

                      {/* Value */}

                      <div className="h-8 flex items-end mb-2">

                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {messages}
                        </span>

                      </div>

                      {/* Bar */}

                      <div className="w-full h-32 flex items-end">

                        <div
                          className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-md hover:bg-blue-500 dark:hover:bg-blue-500 transition-all duration-200"
                          style={{
                            height: `${Math.max(
                              height,
                              messages > 0 ? 5 : 1
                            )}%`,
                          }}
                          title={`${item.day}: ${messages} messages`}
                        />

                      </div>

                      {/* Day */}

                      <span className="mt-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center">
                        {item.day.slice(0, 3)}
                      </span>

                    </div>
                  );
                })}

              </div>

            </div>

            {/* ==================================================
                DASHBOARD SUMMARY
            ================================================== */}

            <div className="mt-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm">

              <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">

                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Dashboard Summary
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current MathVox platform statistics
                </p>

              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800">

                {/* Users */}

                <div className="px-5 py-4 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                      👥
                    </div>

                    <div>

                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Registered users
                      </p>

                      <p className="text-xs text-gray-500">
                        Total accounts registered on MathVox
                      </p>

                    </div>

                  </div>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {totalUsers.toLocaleString()}
                  </span>

                </div>

                {/* Conversations */}

                <div className="px-5 py-4 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                      💬
                    </div>

                    <div>

                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Conversations
                      </p>

                      <p className="text-xs text-gray-500">
                        Total chat conversations created
                      </p>

                    </div>

                  </div>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {conversations.toLocaleString()}
                  </span>

                </div>

                {/* Problems */}

                <div className="px-5 py-4 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                      🧮
                    </div>

                    <div>

                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Problems solved
                      </p>

                      <p className="text-xs text-gray-500">
                        Total mathematics problems solved
                      </p>

                    </div>

                  </div>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {problemsSolved.toLocaleString()}
                  </span>

                </div>

                {/* Messages */}

                <div className="px-5 py-4 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      ✉️
                    </div>

                    <div>

                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Chat messages
                      </p>

                      <p className="text-xs text-gray-500">
                        Total messages recorded by the system
                      </p>

                    </div>

                  </div>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Number(
                      analytics.messages ?? 0
                    ).toLocaleString()}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
};

export default AdminDashboard;