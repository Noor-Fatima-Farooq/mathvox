import { useEffect, useState } from "react";
import { getUserProfile } from "../services/chatStorage";
import {
  getCurriculumDashboard,
  syncUserProfileFromServer,
} from "../services/api";

export default function Profile() {
  const [profile, setProfile] = useState(() => getUserProfile());
  const [currentLevel, setCurrentLevel] = useState("");
  const [levelError, setLevelError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([syncUserProfileFromServer(), getCurriculumDashboard()]).then(
      ([profileResult, curriculumResult]) => {
        if (!active) return;
        if (profileResult.status === "fulfilled" && profileResult.value) {
          setProfile(profileResult.value);
        }
        if (curriculumResult.status === "fulfilled") {
          setCurrentLevel(curriculumResult.value.summary?.current_level || "");
        } else {
          setLevelError(
            curriculumResult.reason?.message ||
              "Could not load your curriculum level."
          );
        }
      }
    );
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

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#121422]">
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
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
            Current level
          </p>
          {levelError ? (
            <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
              {levelError}
            </p>
          ) : (
            <p className="text-lg font-semibold">{currentLevel || "Loading…"}</p>
          )}
        </div>
      </div>
    </div>
  );
}
