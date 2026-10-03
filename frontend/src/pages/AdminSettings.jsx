import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminSettings, updateAdminSettings } from "../services/api";

const AdminSettings = () => {
  const navigate = useNavigate();

  const [appName, setAppName] = useState("MathVox");
  const [description, setDescription] = useState(
    "AI-powered mathematics learning platform."
  );

  const [aiEnabled, setAiEnabled] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [allowVoice, setAllowVoice] = useState(true);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newUserNotifications, setNewUserNotifications] = useState(true);

  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getAdminSettings();

        setAppName(data.appName ?? "MathVox");
        setDescription(
          data.description ??
            "AI-powered mathematics learning platform."
        );

        setAiEnabled(Boolean(data.aiEnabled));
        setShowSteps(Boolean(data.showSteps));
        setAllowVoice(Boolean(data.allowVoice));

        setEmailNotifications(
          Boolean(data.emailNotifications)
        );
        setNewUserNotifications(
          Boolean(data.newUserNotifications)
        );

        setSessionTimeout(
          String(data.sessionTimeout ?? 30)
        );

        setMaintenanceMode(
          Boolean(data.maintenanceMode)
        );
      } catch (error) {
        console.error("Could not load admin settings:", error);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      const updated = await updateAdminSettings({
        appName,
        description,
        aiEnabled,
        showSteps,
        allowVoice,
        emailNotifications,
        newUserNotifications,
        sessionTimeout: Number(sessionTimeout),
        maintenanceMode,
      });

      // Keep UI in sync with the values returned by the backend
      setAppName(updated.appName ?? appName);
      setDescription(updated.description ?? description);
      setAiEnabled(Boolean(updated.aiEnabled));
      setShowSteps(Boolean(updated.showSteps));
      setAllowVoice(Boolean(updated.allowVoice));
      setEmailNotifications(Boolean(updated.emailNotifications));
      setNewUserNotifications(Boolean(updated.newUserNotifications));
      setSessionTimeout(String(updated.sessionTimeout ?? sessionTimeout));
      setMaintenanceMode(Boolean(updated.maintenanceMode));

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Could not save admin settings:", error);
      alert(error.message || "Could not save settings");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">

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
            Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage MathVox application and administrator settings.
          </p>

        </div>


        {/* ================= SUCCESS MESSAGE ================= */}

        {saved && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 px-4 py-3">

            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                Settings saved successfully
              </p>

              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                Your changes have been saved.
              </p>
            </div>

          </div>
        )}


        <div className="space-y-6">

          {/* ================= GENERAL SETTINGS ================= */}

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm">

            <div className="p-5 border-b border-gray-200 dark:border-slate-700">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                  ⚙️
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    General Settings
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Basic information about the MathVox application.
                  </p>
                </div>

              </div>

            </div>


            <div className="p-5 space-y-5">

              {/* App Name */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Application Name
                </label>

                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                />

              </div>


              {/* Description */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Application Description
                </label>

                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                />

              </div>

            </div>

          </div>


          {/* ================= AI SETTINGS ================= */}

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm">

            <div className="p-5 border-b border-gray-200 dark:border-slate-700">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
                  🤖
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    AI Settings
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Configure how the MathVox AI tutor behaves.
                  </p>
                </div>

              </div>

            </div>


            <div className="p-5 divide-y divide-gray-100 dark:divide-slate-800">

              {/* AI Enabled */}

              <SettingToggle
                title="AI Tutor"
                description="Allow users to interact with the MathVox AI tutor."
                enabled={aiEnabled}
                setEnabled={setAiEnabled}
              />


              {/* Step by Step */}

              <SettingToggle
                title="Step-by-Step Solutions"
                description="Provide detailed step-by-step explanations for math problems."
                enabled={showSteps}
                setEnabled={setShowSteps}
              />


              {/* Voice */}

              <SettingToggle
                title="Voice Support"
                description="Allow users to use voice-based interaction with the AI tutor."
                enabled={allowVoice}
                setEnabled={setAllowVoice}
              />

            </div>

          </div>


          {/* ================= NOTIFICATION SETTINGS ================= */}

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm">

            <div className="p-5 border-b border-gray-200 dark:border-slate-700">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                  🔔
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Manage administrator notification preferences.
                  </p>
                </div>

              </div>

            </div>


            <div className="p-5 divide-y divide-gray-100 dark:divide-slate-800">

              <SettingToggle
                title="Email Notifications"
                description="Receive important system notifications through email."
                enabled={emailNotifications}
                setEnabled={setEmailNotifications}
              />


              <SettingToggle
                title="New User Notifications"
                description="Notify administrators when a new user registers."
                enabled={newUserNotifications}
                setEnabled={setNewUserNotifications}
              />


            </div>

          </div>


          {/* ================= SECURITY SETTINGS ================= */}

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm">

            <div className="p-5 border-b border-gray-200 dark:border-slate-700">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                  🔐
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Security Settings
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Manage application security and access settings.
                  </p>
                </div>

              </div>

            </div>


            <div className="p-5 space-y-5">

              {/* Session Timeout */}

              <div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Session Timeout
                </label>

                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300 outline-none"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="120">2 Hours</option>
                </select>

                <p className="text-xs text-gray-400 mt-2">
                  Automatically sign out inactive administrators.
                </p>

              </div>


              {/* Maintenance */}

              <div className="pt-5 border-t border-gray-100 dark:border-slate-800">

                <SettingToggle
                  title="Maintenance Mode"
                  description="Temporarily restrict access while system maintenance is in progress."
                  enabled={maintenanceMode}
                  setEnabled={setMaintenanceMode}
                />

              </div>

            </div>

          </div>


          {/* ================= SAVE BUTTON ================= */}

          <div className="flex items-center justify-end gap-3">

            <button
              onClick={() => navigate("/admin")}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
            >
              Save Changes
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};


/* =========================================================
   TOGGLE COMPONENT
========================================================= */

const SettingToggle = ({
  title,
  description,
  enabled,
  setEnabled,
}) => {
  return (
    <div className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-5">

      <div>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
          {description}
        </p>

      </div>


      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
          enabled
            ? "bg-indigo-600"
            : "bg-gray-300 dark:bg-slate-700"
        }`}
        aria-label={`Toggle ${title}`}
      >

        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            enabled
              ? "translate-x-6"
              : "translate-x-1"
          }`}
        />

      </button>

    </div>
  );
};

export default AdminSettings;