
import { useEffect, useState } from "react";

const API_URL = "https://zenhr-backend.onrender.com/api/settings";

const DEFAULT_WORKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const ALL_WORKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getAuthHeaders = () => {
  const token = localStorage.getItem("zenhr-token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

function Settings() {
  // Admin Profile
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("admin@zenhr.com");

  // Company Information
  const [companyName, setCompanyName] = useState("ZenHR");
  const [companyEmail, setCompanyEmail] = useState("contact@zenhr.com");

  // Office Timing Settings
  const [officeStartTime, setOfficeStartTime] = useState("09:00");
  const [officeEndTime, setOfficeEndTime] = useState("18:00");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [workingDays, setWorkingDays] = useState(DEFAULT_WORKING_DAYS);

  // Change Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leaveNotifications, setLeaveNotifications] = useState(true);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load Settings from MongoDB
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(API_URL, {
          headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load settings");
        }

        // Admin Profile
        setAdminName(data.adminName || "Admin");
        setAdminEmail(data.adminEmail || "admin@zenhr.com");

        // Company Information
        setCompanyName(data.companyName || "ZenHR");
        setCompanyEmail(data.companyEmail || "contact@zenhr.com");

        // Office Timing Settings
        setOfficeStartTime(data.officeStartTime || "09:00");
        setOfficeEndTime(data.officeEndTime || "18:00");
        setGracePeriodMinutes(data.gracePeriodMinutes ?? 15);
        setWorkingDays(data.workingDays || DEFAULT_WORKING_DAYS);

        // Notifications
        setEmailNotifications(data.emailNotifications ?? true);
        setLeaveNotifications(data.leaveNotifications ?? true);
      } catch (error) {
        console.error("Settings loading error:", error);
        alert("Unable to load settings. Please check your backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Toggle Working Days
  const handleWorkingDayChange = (day, checked) => {
    setWorkingDays((previousDays) => {
      if (checked) {
        return previousDays.includes(day)
          ? previousDays
          : [...previousDays, day];
      }

      return previousDays.filter((item) => item !== day);
    });
  };

  // Save Settings and Change Password
  const handleSave = async (e) => {
    e.preventDefault();

    // Validate Office Timings
    if (officeEndTime <= officeStartTime) {
      alert("Office end time must be later than office start time!");
      return;
    }

    // Validate Grace Period
    const gracePeriod = Number(gracePeriodMinutes);

    if (
      !Number.isInteger(gracePeriod) ||
      gracePeriod < 0 ||
      gracePeriod > 180
    ) {
      alert("Grace period must be between 0 and 180 minutes!");
      return;
    }

    // Validate Working Days
    if (workingDays.length === 0) {
      alert("Please select at least one working day!");
      return;
    }

    // Check whether user wants to change password
    const passwordValues = [
      currentPassword,
      newPassword,
      confirmPassword,
    ];

    const passwordFieldsFilled = passwordValues.some(
      (value) => value.trim() !== ""
    );

    // Validate Password Fields Only When Password Change Is Requested
    if (passwordFieldsFilled) {
      if (
        !currentPassword.trim() ||
        !newPassword.trim() ||
        !confirmPassword.trim()
      ) {
        alert("Please fill all password fields!");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match!");
        return;
      }

      if (newPassword.length < 8) {
        alert("New password must be at least 8 characters!");
        return;
      }
    }

    setSaving(true);

    try {
      // STEP 1: Save Account, Company, Office and Notification Settings
      const settingsResponse = await fetch(API_URL, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          adminName,
          adminEmail,
          companyName,
          companyEmail,

          emailNotifications,
          leaveNotifications,

          officeStartTime,
          officeEndTime,
          gracePeriodMinutes: gracePeriod,
          workingDays,
        }),
      });

      const settingsData = await settingsResponse.json();

      if (!settingsResponse.ok) {
        throw new Error(
          settingsData.message || "Failed to save settings"
        );
      }

      // STEP 2: Change Password Only If User Entered Password
      if (passwordFieldsFilled) {
        const passwordResponse = await fetch(`${API_URL}/password`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
          }),
        });

        const passwordData = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(
            passwordData.message || "Failed to change password"
          );
        }
      }

      // STEP 3: Update UI With Saved Settings
      const savedSettings = settingsData.settings || settingsData;

      setAdminName(savedSettings.adminName || "Admin");
      setAdminEmail(savedSettings.adminEmail || "admin@zenhr.com");

      setCompanyName(savedSettings.companyName || "ZenHR");
      setCompanyEmail(savedSettings.companyEmail || "contact@zenhr.com");

      setOfficeStartTime(savedSettings.officeStartTime || "09:00");
      setOfficeEndTime(savedSettings.officeEndTime || "18:00");

      setGracePeriodMinutes(
        savedSettings.gracePeriodMinutes ?? 15
      );

      setWorkingDays(
        savedSettings.workingDays || DEFAULT_WORKING_DAYS
      );

      setEmailNotifications(
        savedSettings.emailNotifications ?? true
      );

      setLeaveNotifications(
        savedSettings.leaveNotifications ?? true
      );

      // STEP 4: Clear Password Fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (passwordFieldsFilled) {
        alert("Settings saved and password changed successfully!");
      } else {
        alert("Settings saved successfully!");
      }
    } catch (error) {
      console.error("Settings saving error:", error);
      alert(error.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const sectionClass =
    "rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-700";

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your account and application preferences
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Admin Profile */}
          <section className={sectionClass}>
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Admin Profile
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Admin Name
                </label>

                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Admin Email
                </label>

                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          {/* Company Information */}
          <section className={sectionClass}>
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Company Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Company Name
                </label>

                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Company Email
                </label>

                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          {/* Office Timing Settings */}
          <section className={sectionClass}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Office Timing Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Configure your company's office hours, grace period and working days.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* Office Start Time */}
              <div>
                <label className={labelClass}>
                  Office Start Time
                </label>

                <input
                  type="time"
                  value={officeStartTime}
                  onChange={(e) => setOfficeStartTime(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              {/* Office End Time */}
              <div>
                <label className={labelClass}>
                  Office End Time
                </label>

                <input
                  type="time"
                  value={officeEndTime}
                  onChange={(e) => setOfficeEndTime(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              {/* Grace Period */}
              <div>
                <label className={labelClass}>
                  Grace Period (Minutes)
                </label>

                <input
                  type="number"
                  min="0"
                  max="180"
                  step="1"
                  value={gracePeriodMinutes}
                  onChange={(e) =>
                    setGracePeriodMinutes(e.target.value)
                  }
                  className={inputClass}
                  required
                />

                <p className="mt-1 text-xs text-gray-500">
                  Extra time allowed after office start time.
                </p>
              </div>
            </div>

            {/* Working Days */}
            <div className="mt-7">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Working Days
              </h3>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
                {ALL_WORKING_DAYS.map((day) => (
                  <label
                    key={day}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm transition ${
                      workingDays.includes(day)
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={workingDays.includes(day)}
                      onChange={(e) =>
                        handleWorkingDayChange(day, e.target.checked)
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="font-medium">
                      {day.slice(0, 3)}
                    </span>
                  </label>
                ))}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Select the days your company operates.
              </p>
            </div>

            {/* Office Timing Summary */}
            <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">
                Office Schedule Summary
              </h3>

              <div className="grid grid-cols-1 gap-2 text-sm text-blue-800 sm:grid-cols-3">
                <p>
                  <span className="font-medium">Office Hours:</span>{" "}
                  {officeStartTime} - {officeEndTime}
                </p>

                <p>
                  <span className="font-medium">Grace Period:</span>{" "}
                  {gracePeriodMinutes} minutes
                </p>

                <p>
                  <span className="font-medium">Working Days:</span>{" "}
                  {workingDays.length} days
                </p>
              </div>
            </div>
          </section>

          {/* Change Password */}
          <section className={sectionClass}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Change Password
            </h2>

            <p className="mb-5 text-sm text-gray-500">
              Enter your current password and choose a new password.
              Minimum 8 characters required. Leave all fields empty
              if you don't want to change your password.
            </p>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className={labelClass}>
                  Current Password
                </label>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className={labelClass}>
                  New Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className={sectionClass}>
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Notifications
            </h2>

            <div className="space-y-5">

              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-800">
                    Email Notifications
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Receive updates through email
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) =>
                    setEmailNotifications(e.target.checked)
                  }
                  className="h-5 w-5 shrink-0 accent-blue-600"
                />
              </label>

              <div className="border-t border-gray-100" />

              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-800">
                    Leave Notifications
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Receive notifications for leave requests
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={leaveNotifications}
                  onChange={(e) =>
                    setLeaveNotifications(e.target.checked)
                  }
                  className="h-5 w-5 shrink-0 accent-blue-600"
                />
              </label>

            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Settings;
