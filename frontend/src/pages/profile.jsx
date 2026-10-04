import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileNameModal from "../components/ProfileNameModal";
import { clearDeletedUserData, getUserProfile } from "../services/chatStorage";
import {
  deleteUserAccount,
  syncUserProfileFromServer,
} from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getUserProfile());
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;
    syncUserProfileFromServer().then((serverProfile) => {
      if (active && serverProfile) setProfile(serverProfile);
    }).catch((error) => {
      if (active) {
        setProfileError(error.message || "Could not load your profile.");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6 text-gray-900 dark:text-white">
      <h1 className="mb-1 text-2xl font-bold">Profile</h1>
      <p className="mb-6 text-slate-500 dark:text-slate-400">
        Your account details.
      </p>
      {profileError && (
        <p role="alert" className="mb-4 text-sm text-rose-600 dark:text-rose-400">
          {profileError}
        </p>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121422]">
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={deleting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Edit name and username
          </button>
        </div>
        <div>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Name</p>
          <p className="text-lg font-semibold">{profile.name || "Not set"}</p>
        </div>
        <div>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Username</p>
          <p className="text-lg font-semibold">
            {profile.username ? `@${profile.username}` : "Not set"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Email</p>
          <p className="text-lg font-semibold">{profile.email || "Not set"}</p>
        </div>
        <div>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Class</p>
          <p className="text-lg font-semibold">{profile.class_grade || "Not set"}</p>
        </div>
        <div>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Age</p>
          <p className="text-lg font-semibold">{profile.age ?? "Not set"}</p>
        </div>
        <div>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
            Current level
          </p>
          <p className="text-lg font-semibold">
            {profile.current_level || "Not set"}
          </p>
        </div>
        {deleteError && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {deleteError}
          </p>
        )}
        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
          <h2 className="mb-2 font-semibold text-rose-700 dark:text-rose-400">
            Delete account
          </h2>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            This permanently deletes your account and learning data.
          </p>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              const confirmed = window.confirm(
                "Permanently delete your account and learning data? This cannot be undone."
              );
              if (!confirmed) return;

              setDeleteError("");
              setDeleting(true);
              try {
                const userId = localStorage.getItem("user_id");
                await deleteUserAccount();
                clearDeletedUserData(userId);
                localStorage.removeItem("user_id");
                localStorage.removeItem("role");
                navigate("/login", { replace: true });
              } catch (error) {
                setDeleteError(error.message || "Could not delete account.");
                setDeleting(false);
              }
            }}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            {deleting ? "Deleting account…" : "Delete account"}
          </button>
        </div>
      </div>
      {editing && (
        <ProfileNameModal
          currentName={profile.name}
          currentUsername={profile.username}
          onClose={() => setEditing(false)}
          onSaved={(updated) =>
            setProfile((current) => ({ ...current, ...updated }))
          }
        />
      )}
    </div>
  );
}
