
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const HRChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from temporary password.");
      return;
    }

    const token = localStorage.getItem("zenhr-hr-token");

    if (!token) {
      window.location.href = "/hr-login";
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://zenhr-backend.onrender.com/api/hr/change-password",
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
        setError(data.message || "Unable to change password.");
        return;
      }

      setSuccess("Password changed successfully!");

      const savedHR = localStorage.getItem("zenhr-hr");

      if (savedHR) {
        const hrData = JSON.parse(savedHR);
        hrData.mustChangePassword = false;
        localStorage.setItem("zenhr-hr", JSON.stringify(hrData));
      }

      setTimeout(() => {
        window.location.href = "/hr-dashboard";
      }, 1200);

    } catch (error) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Reusable password input
  const passwordField = (
    label,
    value,
    setValue,
    visible,
    setVisible,
    placeholder,
    minLength
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          minLength={minLength}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-500"
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            🔐
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Change Your Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            For security, please change your temporary password before continuing.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5">

          {passwordField(
            "Current Password",
            currentPassword,
            setCurrentPassword,
            showCurrent,
            setShowCurrent,
            "Enter temporary password"
          )}

          {passwordField(
            "New Password",
            newPassword,
            setNewPassword,
            showNew,
            setShowNew,
            "Enter new password",
            8
          )}

          <p className="-mt-3 text-xs text-slate-400">
            New password must contain at least 8 characters.
          </p>

          {passwordField(
            "Confirm New Password",
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            setShowConfirm,
            "Confirm your new password",
            8
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Changing Password..." : "Change Password"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          ZenHR · Secure HR Portal
        </p>

      </div>
    </div>
  );
};

export default HRChangePassword;
