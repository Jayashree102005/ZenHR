
import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";

const API_URL = "https://zenhr-backend.onrender.com/api";

function PasswordField({
  label,
  value,
  onChange,
  visible,
  toggle,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <Lock
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}

function EmployeeChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    const token = localStorage.getItem("zenhr-employee-token");

    if (!token) {
      window.location.href = "/employee-login";
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/employees/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password change failed.");
      }

      const savedEmployee = localStorage.getItem("zenhr-employee");

      if (savedEmployee) {
        const employee = JSON.parse(savedEmployee);

        localStorage.setItem(
          "zenhr-employee",
          JSON.stringify({
            ...employee,
            mustChangePassword: false,
          })
        );
      }

      setSuccess("Password changed successfully!");

      setTimeout(() => {
        window.location.href = "/employee-dashboard";
      }, 1000);
    } catch (error) {
      console.error("Change Password Error:", error);
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <ShieldCheck size={30} className="text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Change Your Password
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please create a new password to continue to your employee portal.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">

          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            visible={showCurrent}
            toggle={() => setShowCurrent(!showCurrent)}
            placeholder="Enter temporary password"
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            visible={showNew}
            toggle={() => setShowNew(!showNew)}
            placeholder="Enter new password"
          />

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            visible={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
            placeholder="Confirm new password"
          />

          <p className="text-xs text-gray-500">
            Password must contain at least 8 characters.
          </p>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default EmployeeChangePassword;
