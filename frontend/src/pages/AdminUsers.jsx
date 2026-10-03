import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminUsers } from "../services/api";

const AdminUsers = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);

  // Users from database
  const [users, setUsers] = useState([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load users from backend/database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminUsers();

        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Could not load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Search + status filter
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const username = (user.username || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const searchValue = search.toLowerCase();

      const matchesSearch =
        name.includes(searchValue) ||
        username.includes(searchValue) ||
        email.includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  // Summary counts
  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const newThisMonth = users.filter((user) => {
    if (!user.joined) return false;

    const joinedDate = new Date(user.joined);
    const now = new Date();

    return (
      joinedDate.getMonth() === now.getMonth() &&
      joinedDate.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ================= PAGE HEADER ================= */}
        <div className="mb-6">

          {/* Back to Dashboard */}
          <button
            onClick={() => navigate("/admin")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="text-xl leading-none">←</span>
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and monitor registered MathVox users.
          </p>

        </div>


        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          {/* Total Users */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Users
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {loading ? "..." : totalUsers}
            </h2>
          </div>


          {/* Active Users */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Active Users
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {loading ? "..." : activeUsers}
            </h2>
          </div>


          {/* New This Month */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              New This Month
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {loading ? "..." : newThisMonth}
            </h2>
          </div>

        </div>


        {/* ================= USERS TABLE CARD ================= */}
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
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                />

              </div>


              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300 outline-none"
              >
                <option value="All">All Users</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

            </div>

          </div>


          {/* ================= LOADING ================= */}
          {loading && (
            <div className="py-16 text-center">

              <div className="text-3xl mb-3">
                ⏳
              </div>

              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Loading users...
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Fetching users from database.
              </p>

            </div>
          )}


          {/* ================= ERROR ================= */}
          {!loading && error && (
            <div className="py-16 text-center">

              <div className="text-3xl mb-3">
                ⚠️
              </div>

              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Could not load users
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {error}
              </p>

            </div>
          )}


          {/* ================= TABLE ================= */}
          {!loading && !error && (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-gray-50 dark:bg-slate-800/60">

                  <tr>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      User
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Email
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Joined
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Activity
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 text-right">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">

                  {filteredUsers.map((user) => (

                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                    >

                      {/* ================= USER ================= */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold">
                            {(user.name || user.username || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {user.name || "Unnamed User"}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username || "user"}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* ================= EMAIL ================= */}
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {user.email || "—"}
                      </td>


                      {/* ================= STATUS ================= */}
                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400"
                          }`}
                        >

                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === "Active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />

                          {user.status || "Inactive"}

                        </span>

                      </td>


                      {/* ================= JOINED ================= */}
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {user.joined
                          ? new Date(user.joined).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>


                      {/* ================= ACTIVITY ================= */}
                      <td className="px-5 py-4">

                        <div className="text-xs text-gray-500 dark:text-gray-400">

                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {user.conversations ?? 0}
                          </span>{" "}
                          chats

                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">

                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {user.problemsSolved ?? 0}
                          </span>{" "}
                          solved

                        </div>

                      </td>


                      {/* ================= ACTION ================= */}
                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>


              {/* ================= NO RESULTS ================= */}
              {filteredUsers.length === 0 && (

                <div className="py-12 text-center">

                  <div className="text-3xl mb-2">
                    🔍
                  </div>

                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    No users found
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Try another name, username, email or status.
                  </p>

                </div>

              )}

            </div>
          )}


          {/* ================= FOOTER ================= */}
          {!loading && !error && (
            <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredUsers.length} of {users.length} users
              </p>

              <div className="text-xs text-gray-400">
                Page 1
              </div>

            </div>
          )}

        </div>

      </div>


      {/* ================= USER DETAILS MODAL ================= */}
      {selectedUser && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setSelectedUser(null)}
        >

          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Details
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Account information
                </p>

              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
              >
                ✕
              </button>

            </div>


            {/* Modal Body */}
            <div className="p-5">

              {/* User Avatar + Name */}
              <div className="flex items-center gap-4 mb-6">

                <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300">
                  {(selectedUser.name ||
                    selectedUser.username ||
                    "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedUser.name || "Unnamed User"}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{selectedUser.username || "user"}
                  </p>

                </div>

              </div>


              {/* User Information */}
              <div className="space-y-4">

                {/* Email */}
                <div>

                  <p className="text-xs text-gray-400 uppercase">
                    Email
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {selectedUser.email || "—"}
                  </p>

                </div>


                {/* Status */}
                <div>

                  <p className="text-xs text-gray-400 uppercase">
                    Status
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {selectedUser.status || "Inactive"}
                  </p>

                </div>


                {/* Joined */}
                <div>

                  <p className="text-xs text-gray-400 uppercase">
                    Joined
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">

                    {selectedUser.joined
                      ? new Date(
                          selectedUser.joined
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}

                  </p>

                </div>


                {/* Activity */}
                <div className="grid grid-cols-2 gap-3">

                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">

                    <p className="text-xs text-gray-400">
                      Conversations
                    </p>

                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {selectedUser.conversations ?? 0}
                    </p>

                  </div>


                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">

                    <p className="text-xs text-gray-400">
                      Problems Solved
                    </p>

                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {selectedUser.problemsSolved ?? 0}
                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">

              <button
                onClick={() => setSelectedUser(null)}
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

export default AdminUsers;