
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/settings";

const getAuthHeaders = () => {
  const token = localStorage.getItem("zenhr-token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

function Settings() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("admin@zenhr.com");

  const [companyName, setCompanyName] = useState("ZenHR");
  const [companyEmail, setCompanyEmail] = useState("contact@zenhr.com");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leaveNotifications, setLeaveNotifications] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from MongoDB
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

        setAdminName(data.adminName || "Admin");
        setAdminEmail(data.adminEmail || "admin@zenhr.com");

        setCompanyName(data.companyName || "ZenHR");
        setCompanyEmail(data.companyEmail || "contact@zenhr.com");

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

  // Save Settings and Change Password
  const handleSave = async (e) => {
    e.preventDefault();

    const passwordFieldsFilled =
      currentPassword || newPassword || confirmPassword;

    // Validate password fields
    if (passwordFieldsFilled) {
      if (!currentPassword || !newPassword || !confirmPassword) {
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
      // First: Save account and company settings
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
        }),
      });

      const settingsData = await settingsResponse.json();

      if (!settingsResponse.ok) {
        throw new Error(
          settingsData.message || "Failed to save settings"
        );
      }

      // Second: Change password only if password fields are filled
      if (passwordFieldsFilled) {
        const passwordResponse = await fetch(`${API_URL}/password`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });

        const passwordData = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(
            passwordData.message || "Failed to change password"
          );
        }
      }

      // Update UI with saved settings
      const savedSettings = settingsData.settings;

      setAdminName(savedSettings.adminName);
      setAdminEmail(savedSettings.adminEmail);

      setCompanyName(savedSettings.companyName);
      setCompanyEmail(savedSettings.companyEmail);

      setEmailNotifications(savedSettings.emailNotifications);
      setLeaveNotifications(savedSettings.leaveNotifications);

      // Clear password fields
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

          {/* Change Password */}
          <section className={sectionClass}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Change Password
            </h2>

            <p className="mb-5 text-sm text-gray-500">
              Enter your current password and choose a new password.
              Minimum 8 characters required.
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
