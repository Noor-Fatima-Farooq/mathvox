import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const AdminAnalytics = () => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/admin/analytics`
        );

        if (!response.ok) {
          throw new Error(
            `Analytics API failed: ${response.status}`
          );
        }

        const data = await response.json();

        setAnalytics(data);
      } catch (err) {
        console.error("Analytics error:", err);
        setError(
          "Analytics data load nahi ho saka. Backend check karein."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600 dark:text-gray-300">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">

          <button
            onClick={() => navigate("/admin")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <span className="text-xl">←</span>
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <p className="text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>

        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const {
    total_users = 0,
    active_users = 0,
    conversations = 0,
    messages = 0,
    problems_solved = 0,
    user_growth = [],
    activity_overview = {},
    daily_activity = [],
    quick_stats = {},
  } = analytics;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}

        <div className="mb-6">

          <button
            onClick={() => navigate("/admin")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="text-xl leading-none">←</span>
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor MathVox performance and user activity.
          </p>

        </div>


        {/* ================= OVERVIEW CARDS ================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          {/* Total Users */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Users
              </p>

              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                👥
              </div>

            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {total_users}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Registered users
            </p>

          </div>


          {/* Active Users */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Users
              </p>

              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center text-green-600 dark:text-green-400">
                ✓
              </div>

            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {active_users}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Users with conversations
            </p>

          </div>


          {/* Conversations */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conversations
              </p>

              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                💬
              </div>

            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {conversations}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Total chat threads
            </p>

          </div>


          {/* Problems Solved */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Problems Solved
              </p>

              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                ✓
              </div>

            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {problems_solved}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Total solved problems
            </p>

          </div>

        </div>


        {/* ================= MAIN ANALYTICS ================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* User Growth */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Growth
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  New users over the last 6 months
                </p>
              </div>

            </div>


            <div className="flex items-end justify-between h-56 gap-3">

              {user_growth.map((item) => {

                const maxValue = Math.max(
                  ...user_growth.map((x) => x.value || 0),
                  1
                );

                const height =
                  ((item.value || 0) / maxValue) * 100;

                return (
                  <div
                    key={item.month}
                    className="flex-1 h-full flex flex-col items-center justify-end"
                  >

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {item.value}
                    </div>

                    <div
                      className="w-full max-w-10 bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(height, 2)}%`,
                      }}
                    />

                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {item.month}
                    </div>

                  </div>
                );
              })}

            </div>

          </div>


          {/* Activity Overview */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Activity Overview
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                User activity across MathVox
              </p>

            </div>


            <div className="space-y-6">

              {/* Chat Activity */}
              <div>

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Chat Activity
                  </span>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activity_overview.chat_activity || 0}%
                  </span>

                </div>

                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${activity_overview.chat_activity || 0}%`,
                    }}
                  />

                </div>

              </div>


              {/* Problems */}
              <div>

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Problem Solving
                  </span>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activity_overview.problem_solving || 0}%
                  </span>

                </div>

                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${activity_overview.problem_solving || 0}%`,
                    }}
                  />

                </div>

              </div>


              {/* Assessment */}
              <div>

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Assessment Activity
                  </span>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activity_overview.assessment_activity || 0}%
                  </span>

                </div>

                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${activity_overview.assessment_activity || 0}%`,
                    }}
                  />

                </div>

              </div>


              {/* Verified */}
              <div>

                <div className="flex items-center justify-between mb-2">

                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Verified Accounts
                  </span>

                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activity_overview.verified_accounts || 0}%
                  </span>

                </div>

                <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${activity_overview.verified_accounts || 0}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ================= SECOND ROW ================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Daily Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">

            <div className="mb-5">

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daily Activity
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Activity based on actual messages
              </p>

            </div>


            <div className="space-y-4">

              {daily_activity.map((item) => (

                <div key={item.day}>

                  <div className="flex items-center justify-between mb-1">

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.day}
                    </span>

                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.messages} messages
                    </span>

                  </div>

                  <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${item.value || 0}%`,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>


          {/* Quick Stats */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              Quick Stats
            </h2>

            <div className="space-y-5">

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Messages
                </p>

                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {messages}
                </p>
              </div>


              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Daily Active Users
                </p>

                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {quick_stats.daily_active_users || 0}
                </p>
              </div>


              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Success Rate
                </p>

                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {quick_stats.success_rate || 0}%
                </p>
              </div>


              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avg. Problems/User
                </p>

                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {quick_stats.avg_problems_per_user || 0}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;