import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAdminUsers,
  getAdminConversations,
  syncUserProfileFromServer,
} from "../services/api";

import {
  getUserProfile,
  onLogout,
} from "../services/chatStorage";

const AdminHeader = () => {
  const navigate = useNavigate();

  // ============================================================
  // PROFILE
  // ============================================================

  const [profile, setProfile] = useState(() =>
    getUserProfile()
  );

  // ============================================================
  // SEARCH
  // ============================================================

  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);

  const [searchLoading, setSearchLoading] = useState(false);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const [showNotifications, setShowNotifications] =
    useState(false);

  // ============================================================
  // PROFILE DROPDOWN
  // ============================================================

  const [showProfile, setShowProfile] = useState(false);

  // ============================================================
  // LOAD PROFILE FROM BACKEND
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await syncUserProfileFromServer();

        if (data) {
          setProfile(data);
        } else {
          setProfile(getUserProfile());
        }
      } catch (error) {
        console.error(
          "Could not load admin profile:",
          error
        );

        setProfile(getUserProfile());
      }
    };

    loadProfile();
  }, []);

  // ============================================================
  // PROFILE UPDATED EVENT
  // ============================================================

  useEffect(() => {
    const updateProfile = () => {
      setProfile(getUserProfile());
    };

    window.addEventListener(
      "mathvox:profile-updated",
      updateProfile
    );

    return () => {
      window.removeEventListener(
        "mathvox:profile-updated",
        updateProfile
      );
    };
  }, []);

  // ============================================================
  // LOAD SEARCH DATA
  // ============================================================

  useEffect(() => {
    const loadSearchData = async () => {
      try {
        setSearchLoading(true);

        const [
          usersData,
          conversationsData,
        ] = await Promise.all([
          getAdminUsers(),
          getAdminConversations(),
        ]);

        setUsers(
          Array.isArray(usersData)
            ? usersData
            : []
        );

        setConversations(
          Array.isArray(
            conversationsData?.conversations
          )
            ? conversationsData.conversations
            : []
        );
      } catch (error) {
        console.error(
          "Could not load header search data:",
          error
        );
      } finally {
        setSearchLoading(false);
      }
    };

    loadSearchData();
  }, []);

  // ============================================================
  // SEARCH RESULTS
  // ============================================================

  const searchResults = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return {
        users: [],
        conversations: [],
      };
    }

    // ----------------------------------------------------------
    // USERS
    // ----------------------------------------------------------

    const matchedUsers = users
      .filter((user) => {
        const name =
          (user.name || "").toLowerCase();

        const username =
          (user.username || "").toLowerCase();

        const email =
          (user.email || "").toLowerCase();

        return (
          name.includes(query) ||
          username.includes(query) ||
          email.includes(query)
        );
      })
      .slice(0, 5);

    // ----------------------------------------------------------
    // CONVERSATIONS
    // ----------------------------------------------------------

    const matchedConversations =
      conversations
        .filter((conversation) => {
          const user =
            (conversation.user || "").toLowerCase();

          const username =
            (conversation.username || "").toLowerCase();

          const email =
            (conversation.email || "").toLowerCase();

          const topic =
            (conversation.topic || "").toLowerCase();

          const lastMessage =
            (conversation.lastMessage || "").toLowerCase();

          return (
            user.includes(query) ||
            username.includes(query) ||
            email.includes(query) ||
            topic.includes(query) ||
            lastMessage.includes(query)
          );
        })
        .slice(0, 5);

    return {
      users: matchedUsers,
      conversations: matchedConversations,
    };
  }, [
    search,
    users,
    conversations,
  ]);

  const hasSearchResults =
    searchResults.users.length > 0 ||
    searchResults.conversations.length > 0;

  // ============================================================
  // NOTIFICATIONS
  //
  // Generated from existing backend data.
  // ============================================================

  const notifications = useMemo(() => {
    const items = [];

    // ----------------------------------------------------------
    // RECENT USERS
    // ----------------------------------------------------------

    users.slice(0, 3).forEach((user) => {
      items.push({
        id: `user-${user.id}`,
        type: "user",
        userId: user.id,
        title: "New user registered",
        text:
          user.name ||
          user.username ||
          user.email ||
          "New user",
        date: user.joined
          ? new Date(user.joined)
          : new Date(0),
      });
    });

    // ----------------------------------------------------------
    // RECENT CONVERSATIONS
    // ----------------------------------------------------------

    conversations
      .slice(0, 3)
      .forEach((conversation) => {
        const dateText =
          conversation.date &&
          conversation.time
            ? `${conversation.date} ${conversation.time}`
            : "";

        items.push({
          id: `conversation-${conversation.id}`,
          type: "conversation",
          conversationId: conversation.id,
          userId: conversation.user_id,
          title: "Conversation activity",
          text:
            conversation.user ||
            conversation.topic ||
            "New conversation",
          date: dateText
            ? new Date(dateText)
            : new Date(0),
        });
      });

    return items
      .sort(
        (a, b) =>
          b.date.getTime() -
          a.date.getTime()
      )
      .slice(0, 5);
  }, [users, conversations]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    // Existing MathVox logout cleanup
    onLogout();

    // Remove authentication information
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");

    // Close dropdown
    setShowProfile(false);

    // Go to login
    navigate("/login", {
      replace: true,
    });
  };

  // ============================================================
  // DISPLAY NAME
  // ============================================================

  const displayName =
    profile?.name?.trim() ||
    profile?.username?.trim() ||
    "Admin";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  // ============================================================
  // CLOSE ALL DROPDOWNS
  // ============================================================

  const closeMenus = () => {
    setShowNotifications(false);
    setShowProfile(false);
  };

  // ============================================================
  // GO TO USER CONVERSATIONS
  // ============================================================

  const openUserConversations = (userId) => {
    if (!userId) return;

    setSearch("");
    closeMenus();

    navigate(
      `/admin/conversations?user_id=${encodeURIComponent(
        String(userId)
      )}`
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0">

      {/* ======================================================
          PAGE TITLE
      ====================================================== */}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Admin Dashboard
        </h2>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Manage and monitor MathVox
        </p>
      </div>

      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="flex items-center gap-4">

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <div className="relative hidden md:block">

          <div className="flex items-center w-64 h-10 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3">

            <span className="text-gray-400 mr-2">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search..."
              className="w-full bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
            />

          </div>

          {/* ==================================================
              SEARCH DROPDOWN
          ================================================== */}

          {search.trim() && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">

              {searchLoading ? (

                <div className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Searching...
                </div>

              ) : !hasSearchResults ? (

                <div className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No results found
                </div>

              ) : (

                <div className="max-h-96 overflow-y-auto">

                  {/* ==================================================
                      USERS
                  ================================================== */}

                  {searchResults.users.length > 0 && (
                    <div>

                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50 dark:bg-slate-800">
                        Users
                      </div>

                      {searchResults.users.map(
                        (user) => (

                          <button
                            key={`user-${user.id}`}
                            type="button"
                            onClick={() =>
                              openUserConversations(
                                user.id
                              )
                            }
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                          >

                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name ||
                                user.username ||
                                "Unnamed user"}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email ||
                                user.username ||
                                "User"}
                            </p>

                          </button>

                        )
                      )}

                    </div>
                  )}

                  {/* ==================================================
                      CONVERSATIONS
                  ================================================== */}

                  {searchResults.conversations.length > 0 && (
                    <div>

                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50 dark:bg-slate-800">
                        Conversations
                      </div>

                      {searchResults.conversations.map(
                        (conversation) => (

                          <button
                            key={`conversation-${conversation.id}`}
                            type="button"
                            onClick={() =>
                              openUserConversations(
                                conversation.user_id
                              )
                            }
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                          >

                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {conversation.topic ||
                                "New conversation"}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {conversation.user ||
                                conversation.email ||
                                conversation.lastMessage ||
                                ""}
                            </p>

                          </button>

                        )
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <div className="relative">

          <button
            type="button"
            onClick={() => {
              setShowNotifications(
                !showNotifications
              );
              setShowProfile(false);
            }}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >

            🔔

            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
            )}

          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">

              <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">

                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Recent MathVox activity
                </p>

              </div>

              {notifications.length === 0 ? (

                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </div>

              ) : (

                <div className="max-h-80 overflow-y-auto">

                  {notifications.map(
                    (notification) => (

                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {

                          setShowNotifications(
                            false
                          );

                          if (
                            notification.userId
                          ) {
                            navigate(
                              `/admin/conversations?user_id=${encodeURIComponent(
                                String(
                                  notification.userId
                                )
                              )}`
                            );
                          }

                        }}
                        className="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >

                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {notification.text}
                        </p>

                      </button>

                    )
                  )}

                </div>

              )}

            </div>
          )}

        </div>

        {/* ====================================================
            PROFILE
        ==================================================== */}

        <div className="relative">

          <button
            type="button"
            onClick={() => {
              setShowProfile(
                !showProfile
              );
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >

            {/* Avatar */}

            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              {initial}
            </div>

            {/* Name + Role */}

            <div className="hidden sm:block text-left">

              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {displayName}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Administrator
              </p>

            </div>

            <span className="text-xs text-gray-400">
              ▾
            </span>

          </button>

          {/* ==================================================
              PROFILE DROPDOWN
          ================================================== */}

          {showProfile && (

            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">

              <div className="px-4 py-4 border-b border-gray-200 dark:border-slate-700">

                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {profile?.email || ""}
                </p>

                {profile?.username && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    @{profile.username}
                  </p>
                )}

              </div>

              {/* Settings */}

              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  navigate("/admin/settings");
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                ⚙️ Account Settings
              </button>

              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-gray-100 dark:border-slate-800"
              >
                🚪 Log out
              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
};

export default AdminHeader;