
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/hr";
const ATTENDANCE_URL = "http://localhost:5000/api/attendance";

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  department: "HR",
  designation: "HR Manager",
  joiningDate: "",
  salary: "",
  status: "Active",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Format date for HTML date input
const formatDateForInput = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function HRManagement() {
  const [hrs, setHrs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHR, setEditingHR] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState(initialFormData);

  // Selected HR attendance details
  const [selectedHR, setSelectedHR] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    String(currentDate.getMonth() + 1)
  );

  const [selectedYear, setSelectedYear] = useState(
    String(currentDate.getFullYear())
  );

  const token = localStorage.getItem("zenhr-token");

  const cardClass =
    "rounded-xl border border-gray-200 bg-white shadow-sm";

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // ==========================================
  // FETCH HR ACCOUNTS
  // ==========================================
  const fetchHRs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch HR accounts");
      }

      setHrs(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRs();
  }, []);

  // ==========================================
  // FETCH SELECTED HR ATTENDANCE
  // ==========================================
  const fetchHRAttendance = async (hr = selectedHR) => {
    if (!hr?._id) return;

    try {
      setAttendanceLoading(true);
      setError("");

      const url =
        `${ATTENDANCE_URL}?year=${selectedYear}&month=${selectedMonth}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch HR attendance"
        );
      }

      const records = Array.isArray(data) ? data : [];

      // Filter records belonging only to the selected HR
      const hrRecords = records.filter((record) => {
        const recordHRId = record.hr?._id || record.hr;

        return (
          String(recordHRId) === String(hr._id) &&
          !record.employee
        );
      });

      setAttendance(hrRecords);
    } catch (error) {
      setError(error.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHR) {
      fetchHRAttendance(selectedHR);
    }
  }, [selectedMonth, selectedYear, selectedHR]);

  // ==========================================
  // INPUT CHANGES
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // OPEN ADD HR FORM
  // ==========================================
  const handleOpenAddForm = () => {
    setEditingHR(null);
    setFormData(initialFormData);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // OPEN EDIT HR FORM
  // ==========================================
  const handleEditHR = (hr) => {
    setEditingHR(hr);

    setFormData({
      firstName: hr.firstName || "",
      lastName: hr.lastName || "",
      email: hr.email || "",
      password: "",
      phone: hr.phone || "",
      department: hr.department || "HR",
      designation: hr.designation || "HR Manager",
      joiningDate: formatDateForInput(hr.joiningDate),
      salary: hr.salary ?? "",
      status: hr.status || "Active",
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHR(null);
    setFormData(initialFormData);
    setError("");
  };

  // ==========================================
  // CREATE OR UPDATE HR
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingHR);

      const url = isEditing
        ? `${API_URL}/${editingHR._id}`
        : `${API_URL}/create`;

      const method = isEditing ? "PUT" : "POST";

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,
        designation: formData.designation.trim(),
        joiningDate: formData.joiningDate,
        salary: Number(formData.salary),
        status: formData.status,
      };

      if (!isEditing) {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Failed to update HR details"
              : "Failed to create HR account")
        );
      }

      setSuccess(
        isEditing
          ? "HR details updated successfully!"
          : "HR account created successfully!"
      );

      setShowForm(false);
      setEditingHR(null);
      setFormData(initialFormData);

      await fetchHRs();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CHANGE HR STATUS
  // ==========================================
  const handleStatusChange = async (id, currentStatus) => {
    const newStatus =
      currentStatus === "Active" ? "Inactive" : "Active";

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setSuccess(`HR account is now ${newStatus}.`);

      await fetchHRs();
    } catch (error) {
      setError(error.message);
    }
  };

  // ==========================================
  // DELETE HR ACCOUNT
  // ==========================================
  const handleDeleteHR = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this HR account?"
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete HR");
      }

      setSuccess("HR account deleted successfully.");

      if (selectedHR?._id === id) {
        setSelectedHR(null);
        setAttendance([]);
      }

      await fetchHRs();
    } catch (error) {
      setError(error.message);
    }
  };

  // ==========================================
  // FORMAT DATE AND TIME
  // ==========================================
  const formatTime = (time) => {
    if (!time) return "--";

    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWorkingHours = (record) => {
    if (!record.checkIn || !record.checkOut) return "--";

    const milliseconds =
      new Date(record.checkOut) - new Date(record.checkIn);

    if (milliseconds < 0) return "--";

    return `${(milliseconds / (1000 * 60 * 60)).toFixed(2)} hrs`;
  };

  // ==========================================
  // ATTENDANCE SUMMARY
  // ==========================================
  const presentCount = attendance.filter(
    (record) => record.status === "Present"
  ).length;

  const lateCount = attendance.filter(
    (record) => record.status === "Late"
  ).length;

  const absentCount = attendance.filter(
    (record) => record.status === "Absent"
  ).length;

  const halfDayCount = attendance.filter(
    (record) => record.status === "Half Day"
  ).length;

  // ==========================================
  // ATTENDANCE DETAILS VIEW
  // ==========================================
  if (selectedHR) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium tracking-wider text-indigo-600">
              HR MANAGEMENT / ATTENDANCE
            </p>

            <h1 className="text-2xl font-bold text-gray-800">
              {selectedHR.firstName} {selectedHR.lastName}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {selectedHR.designation || "HR Manager"} ·{" "}
              {selectedHR.department || "HR"} · {selectedHR.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedHR(null);
                setAttendance([]);
                setError("");
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              Back to HR Management
            </button>

            <button
              type="button"
              onClick={() => fetchHRAttendance(selectedHR)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Month and Year Filter */}
        <section className={`${cardClass} flex flex-wrap gap-3 p-5`}>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <CalendarDays size={18} className="text-indigo-600" />
            Attendance Period
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            {[
              currentDate.getFullYear() - 1,
              currentDate.getFullYear(),
              currentDate.getFullYear() + 1,
            ].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Present",
              count: presentCount,
              color: "text-emerald-600",
            },
            {
              label: "Late",
              count: lateCount,
              color: "text-orange-600",
            },
            {
              label: "Absent",
              count: absentCount,
              color: "text-red-600",
            },
            {
              label: "Half Day",
              count: halfDayCount,
              color: "text-blue-600",
            },
          ].map((item) => (
            <div key={item.label} className={`${cardClass} p-5`}>
              <p className="text-sm font-medium text-gray-500">
                {item.label} Days
              </p>

              <h2 className={`mt-3 text-3xl font-bold ${item.color}`}>
                {item.count}
              </h2>
            </div>
          ))}
        </section>

        {/* Attendance Table */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-gray-200 px-5 py-5">
            <h2 className="text-lg font-bold text-gray-800">
              Monthly Attendance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Daily check-in, check-out, working hours, and attendance status.
            </p>
          </div>

          {attendanceLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading HR attendance...
            </div>
          ) : attendance.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No attendance records found for this month.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Check In</th>
                    <th className="px-5 py-4">Check Out</th>
                    <th className="px-5 py-4">Working Hours</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(record.date)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-700">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-700">
                        {formatTime(record.checkOut)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {getWorkingHours(record)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            record.status === "Late"
                              ? "bg-orange-100 text-orange-700"
                              : record.status === "Absent"
                              ? "bg-red-100 text-red-700"
                              : record.status === "Half Day"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {record.status || "Present"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ==========================================
  // HR MANAGEMENT MAIN PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            HR Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage HR accounts and view their attendance.
          </p>
        </div>

        <button
          type="button"
          onClick={showForm ? handleCloseForm : handleOpenAddForm}
          className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          {showForm ? "Close Form" : "+ Add HR"}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add / Edit HR Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingHR ? "Edit HR Details" : "Create New HR Account"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {editingHR
                ? "Update the HR account information."
                : "Enter the details to create a new HR account."}
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  First Name
                </label>

                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                  className={inputClass}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Last Name
                </label>

                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                  className={inputClass}
                />
              </div>

              {/* Password */}
              {!editingHR && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    placeholder="Create HR password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className={inputClass}
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 8 characters.
                  </p>
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              {/* Department */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Department
                </label>

                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="HR">HR</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                  <option value="Development">Development</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Designation */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Designation
                </label>

                <input
                  type="text"
                  name="designation"
                  placeholder="Enter designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Joining Date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Joining Date *
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Monthly Salary */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Monthly Salary (₹) *
                </label>

                <input
                  type="number"
                  name="salary"
                  placeholder="Enter monthly salary"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className={inputClass}
                />
              </div>

              {/* Status */}
              {editingHR && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Account Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {/* Form Buttons */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingHR
                    ? "Saving Changes..."
                    : "Creating..."
                  : editingHR
                  ? "Save Changes"
                  : "Create HR Account"}
              </button>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HR List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading HR accounts...
          </div>
        ) : hrs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No HR accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-gray-100 text-sm text-gray-600">
                <tr>
                  <th className="px-5 py-4">HR Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Designation</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Attendance</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {hrs.map((hr) => (
                  <tr key={hr._id} className="hover:bg-gray-50">
                    {/* HR Name */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {hr.firstName} {hr.lastName}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {hr.email}
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {hr.department || "HR"}
                    </td>

                    {/* Designation */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {hr.designation || "HR Manager"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          hr.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {hr.status}
                      </span>
                    </td>

                    {/* Attendance Details Button */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHR(hr);
                          setSelectedMonth(
                            String(currentDate.getMonth() + 1)
                          );
                          setSelectedYear(
                            String(currentDate.getFullYear())
                          );
                          setAttendance([]);
                          setError("");
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <Eye size={15} />
                        Attendance Details
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditHR(hr)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(hr._id, hr.status)
                          }
                          className="text-sm font-medium text-amber-600 hover:text-amber-800"
                        >
                          {hr.status === "Active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteHR(hr._id)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HRManagement;
