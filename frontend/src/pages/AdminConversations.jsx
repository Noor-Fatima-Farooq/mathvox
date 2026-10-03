import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AdminConversations = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // User selected from Header search
  const selectedUserId = new URLSearchParams(
    location.search
  ).get("user_id");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedConversation, setSelectedConversation] = useState(null);

  // ============================================================
  // BACKEND DATA
  // ============================================================

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // GET ALL CONVERSATIONS FROM BACKEND
  // ============================================================

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError("");

        const API_BASE =
          import.meta.env.VITE_API_URL ||
          "http://127.0.0.1:8000";

        const response = await fetch(
          `${API_BASE}/admin/conversations`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load conversations (${response.status})`
          );
        }

        const data = await response.json();

        setConversations(
          Array.isArray(data.conversations)
            ? data.conversations
            : []
        );
      } catch (err) {
        console.error(
          "Error loading conversations:",
          err
        );

        setError(
          "Unable to load conversations from the server."
        );

        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // ============================================================
  // FILTER CONVERSATIONS
  // ============================================================

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const searchText = search
        .toLowerCase()
        .trim();

      const user = (
        conversation.user || ""
      ).toLowerCase();

      const username = (
        conversation.username || ""
      ).toLowerCase();

      const topic = (
        conversation.topic || ""
      ).toLowerCase();

      const email = (
        conversation.email || ""
      ).toLowerCase();

      const lastMessage = (
        conversation.lastMessage || ""
      ).toLowerCase();

      const matchesSearch =
        user.includes(searchText) ||
        username.includes(searchText) ||
        topic.includes(searchText) ||
        email.includes(searchText) ||
        lastMessage.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        conversation.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    conversations,
    search,
    statusFilter,
  ]);

  // ============================================================
  // TODAY'S CONVERSATIONS
  // ============================================================

  const todayConversations = useMemo(() => {
    const today = new Date();

    const todayString =
      today.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );

    return conversations.filter(
      (conversation) =>
        conversation.date === todayString
    ).length;
  }, [conversations]);

  // ============================================================
  // ACTIVE CONVERSATIONS
  // ============================================================

  const activeConversations = useMemo(() => {
    return conversations.filter(
      (conversation) =>
        conversation.status === "Active"
    ).length;
  }, [conversations]);

  // ============================================================
  // TOTAL MESSAGES
  // ============================================================

  const totalMessages = useMemo(() => {
    return conversations.reduce(
      (total, conversation) =>
        total +
        Number(conversation.messages || 0),
      0
    );
  }, [conversations]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}

        <div className="mb-6">

          <button
            onClick={() => navigate("/admin")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="text-xl leading-none">
              ←
            </span>

            <span>
              Back to Dashboard
            </span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Conversations
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and review conversations between users and MathVox AI.
          </p>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* ================= SUMMARY CARDS ================= */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          {/* Total */}

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Conversations
              </p>

              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                💬
              </div>

            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {loading
                ? "..."
                : conversations.length}
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Real conversations from database
            </p>

          </div>

          {/* Today */}

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Today's Conversations
              </p>

              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                📅
              </div>

            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {loading
                ? "..."
                : todayConversations}
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Conversations created today
            </p>

          </div>

          {/* Active */}

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Conversations
              </p>

              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center text-green-600 dark:text-green-400">
                ●
              </div>

            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {loading
                ? "..."
                : activeConversations}
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Currently in progress
            </p>

          </div>

        </div>

        {/* ================= TABLE CARD ================= */}

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">

          {/* Search + Filter */}

          <div className="p-5 border-b border-gray-200 dark:border-slate-700">

            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">

              {/* Search */}

              <div className="relative w-full md:max-w-md">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                />

              </div>

              {/* Status */}

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300 outline-none"
              >
                <option value="All">
                  All Conversations
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Completed">
                  Completed
                </option>

              </select>

            </div>

          </div>

          {/* ================= TABLE ================= */}

          <div className="overflow-x-auto">

            {loading ? (

              <div className="py-16 text-center">

                <div className="text-3xl mb-3">
                  ⏳
                </div>

                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loading conversations...
                </p>

              </div>

            ) : (

              <table className="w-full text-left">

                <thead className="bg-gray-50 dark:bg-slate-800/60">

                  <tr>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      User
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Topic
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Date
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Messages
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">

                  {filteredConversations.map(
                    (conversation) => (

                      <tr
                        key={conversation.id}
                        className={`transition-colors ${
                          selectedUserId &&
                          Number(conversation.user_id) ===
                            Number(selectedUserId)
                            ? "bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-inset ring-indigo-400"
                            : "hover:bg-gray-50 dark:hover:bg-slate-800/40"
                        }`}
                      >

                        {/* User */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold">
                              {(
                                conversation.user ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {conversation.user ||
                                  "Unknown User"}
                              </p>

                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {conversation.username
                                  ? `@${conversation.username}`
                                  : conversation.email ||
                                    "No username"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* Topic */}

                        <td className="px-5 py-4">

                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {conversation.topic ||
                              "New chat"}
                          </span>

                        </td>

                        {/* Date */}

                        <td className="px-5 py-4">

                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {conversation.date ||
                              ""}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {conversation.time ||
                              ""}
                          </p>

                        </td>

                        {/* Messages */}

                        <td className="px-5 py-4">

                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {conversation.messages ||
                              0}
                          </span>

                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              conversation.status ===
                              "Active"
                                ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"
                            }`}
                          >

                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                conversation.status ===
                                "Active"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {conversation.status ||
                              "Completed"}

                          </span>

                        </td>

                        {/* Action */}

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              setSelectedConversation(
                                conversation
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

            {/* No Results */}

            {!loading &&
              filteredConversations.length ===
                0 && (

                <div className="py-12 text-center">

                  <div className="text-3xl mb-2">
                    🔍
                  </div>

                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    No conversations found
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Try another user, topic or status.
                  </p>

                </div>
              )}

          </div>

          {/* Footer */}

          <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing{" "}
              {filteredConversations.length}{" "}
              of{" "}
              {conversations.length}{" "}
              conversations
            </p>

            <div className="text-xs text-gray-400">
              Total messages: {totalMessages}
            </div>

          </div>

        </div>

      </div>

      {/* ================= CONVERSATION MODAL ================= */}

      {selectedConversation && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() =>
            setSelectedConversation(null)
          }
        >

          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Conversation Details
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  User conversation information
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedConversation(null)
                }
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
              >
                ✕
              </button>

            </div>

            {/* Modal Body */}

            <div className="p-5">

              <div className="flex items-center gap-4 mb-6">

                <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300">
                  {(
                    selectedConversation.user ||
                    "?"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedConversation.user ||
                      "Unknown User"}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedConversation.username
                      ? `@${selectedConversation.username}`
                      : selectedConversation.email ||
                        "No username"}
                  </p>

                </div>

              </div>

              <div className="space-y-4">

                {/* Email */}

                <div>

                  <p className="text-xs text-gray-400 uppercase">
                    Email
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {selectedConversation.email ||
                      "Not available"}
                  </p>

                </div>

                {/* Topic */}

                <div>

                  <p className="text-xs text-gray-400 uppercase">
                    Topic
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {selectedConversation.topic ||
                      "New chat"}
                  </p>

                </div>

                {/* Last Message */}

                <div>

                  <p className="text-xs text-gray-400 uppercase">
                    Last Message
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {selectedConversation.lastMessage ||
                      "No messages in this conversation."}
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">

                    <p className="text-xs text-gray-400">
                      Messages
                    </p>

                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {selectedConversation.messages ||
                        0}
                    </p>

                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">

                    <p className="text-xs text-gray-400">
                      Status
                    </p>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                      {selectedConversation.status ||
                        "Completed"}
                    </p>

                  </div>

                </div>

                {/* Date */}

                <div>

                  <p className="text-xs text-gray-400 uppercase">
                    Date & Time
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {selectedConversation.date ||
                      ""}
                    {" at "}
                    {selectedConversation.time ||
                      ""}
                  </p>

                </div>

              </div>

            </div>

            {/* Modal Footer */}

            <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">

              <button
                onClick={() =>
                  setSelectedConversation(null)
                }
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default AdminConversations;