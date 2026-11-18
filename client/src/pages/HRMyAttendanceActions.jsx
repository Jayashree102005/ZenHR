
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  CalendarDays,
  Send,
  RefreshCw,
} from "lucide-react";

const API_URL = "https://zenhr-backend.onrender.com/api";

const currentDate = new Date();

const formatTime = (value) => {
  if (!value) return "--:--";

  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatFullDate = (value) =>
  value.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const getWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "--";

  const difference =
    new Date(checkOut).getTime() - new Date(checkIn).getTime();

  if (difference <= 0) return "--";

  const totalMinutes = Math.floor(difference / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
};

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "present":
      return "bg-green-100 text-green-700";
    case "late":
      return "bg-orange-100 text-orange-700";
    case "absent":
      return "bg-red-100 text-red-700";
    case "leave":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

function HRMyAttendanceActions() {
  const token = localStorage.getItem("zenhr-hr-token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [now, setNow] = useState(new Date());

  // Today's attendance
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  // HR profile
  const [hrProfile, setHrProfile] = useState(null);
  const [hrId, setHrId] = useState("");

  // Monthly attendance
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    String(currentDate.getMonth() + 1).padStart(2, "0")
  );

  const [selectedYear, setSelectedYear] = useState(
    String(currentDate.getFullYear())
  );

  // Leave states
  const [leaves, setLeaves] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState("");
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Fetch HR profile
  const fetchHRProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/hr/profile`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load HR profile");
      }

      const profile = data.hr || data.profile || data;

      setHrProfile(profile);
      setHrId(profile._id || profile.id || "");
    } catch (error) {
      console.error("HR profile error:", error);

      try {
        const savedHR = JSON.parse(
          localStorage.getItem("zenhr-hr") || "null"
        );

        if (savedHR) {
          const profile = savedHR.hr || savedHR;

          setHrProfile(profile);
          setHrId(profile._id || profile.id || "");
        }
      } catch {
        console.error("Could not read saved HR profile");
      }
    }
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch(
        `${API_URL}/attendance/my/today`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load attendance");
      }

      const record = data.attendance || data.record || data;

      setAttendance(record);

      const recordHrId =
        typeof record?.hr === "object"
          ? record.hr?._id
          : record?.hr;

      if (recordHrId && !hrId) {
        setHrId(recordHrId);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly attendance history
  const fetchAttendanceHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await fetch(
        `${API_URL}/attendance?year=${selectedYear}&month=${selectedMonth}`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load attendance history"
        );
      }

      const records = Array.isArray(data)
        ? data
        : data.attendance || data.records || [];

      const myRecords = records.filter((record) => {
        const recordHrId =
          typeof record.hr === "object"
            ? record.hr?._id
            : record.hr;

        return (
          recordHrId &&
          hrId &&
          String(recordHrId) === String(hrId)
        );
      });

      setAttendanceHistory(myRecords);
    } catch (error) {
      console.error("Attendance history error:", error);
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch leave history
  const fetchMyLeaves = async () => {
    try {
      const response = await fetch(`${API_URL}/leaves/my`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load leave history");
      }

      setLeaves(Array.isArray(data) ? data : data.leaves || []);
    } catch (error) {
      setLeaveMessage(error.message);
    } finally {
      setLeaveLoading(false);
    }
  };

  useEffect(() => {
    fetchHRProfile();
    fetchTodayAttendance();
    fetchMyLeaves();

    const clockInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (hrId) {
      fetchAttendanceHistory();
    }
  }, [hrId, selectedMonth, selectedYear]);

  // Check in
  const handleCheckIn = async () => {
    try {
      setProcessing(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/attendance/my/check-in`,
        {
          method: "POST",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Check-in failed");
      }

      setAttendance(data.attendance || data);
      setMessage("Check-in successful!");

      await fetchTodayAttendance();
      await fetchAttendanceHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Check out
  const handleCheckOut = async () => {
    if (!attendance?._id) return;

    try {
      setProcessing(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/attendance/my/check-out/${attendance._id}`,
        {
          method: "PUT",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Check-out failed");
      }

      setAttendance(data.attendance || data);
      setMessage("Check-out successful!");

      await fetchTodayAttendance();
      await fetchAttendanceHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Leave form changes
  const handleLeaveChange = (event) => {
    const { name, value } = event.target;

    setLeaveForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Apply for leave
  const handleLeaveSubmit = async (event) => {
    event.preventDefault();

    try {
      setLeaveSubmitting(true);
      setLeaveMessage("");

      if (leaveForm.endDate < leaveForm.startDate) {
        setLeaveMessage("End date cannot be before start date");
        return;
      }

      const response = await fetch(`${API_URL}/leaves`, {
        method: "POST",
        headers,
        body: JSON.stringify(leaveForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Leave application failed");
      }

      setLeaveMessage("Leave applied successfully!");

      setLeaveForm({
        leaveType: "Casual Leave",
        startDate: "",
        endDate: "",
        reason: "",
      });

      setShowLeaveForm(false);

      await fetchMyLeaves();
    } catch (error) {
      setLeaveMessage(error.message);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // Monthly summary
  const summary = useMemo(() => {
    const presentDays = attendanceHistory.filter(
      (record) => record.status?.toLowerCase() === "present"
    ).length;

    const lateDays = attendanceHistory.filter(
      (record) => record.status?.toLowerCase() === "late"
    ).length;

    const absentDays = attendanceHistory.filter(
      (record) => record.status?.toLowerCase() === "absent"
    ).length;

    const leaveDays = leaves.filter((leave) => {
      if (leave.status?.toLowerCase() !== "approved") return false;

      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      const monthStart = new Date(
        Number(selectedYear),
        Number(selectedMonth) - 1,
        1
      );

      const monthEnd = new Date(
        Number(selectedYear),
        Number(selectedMonth),
        0
      );

      return start <= monthEnd && end >= monthStart;
    }).length;

    return {
      presentDays,
      lateDays,
      absentDays,
      leaveDays,
    };
  }, [attendanceHistory, leaves, selectedMonth, selectedYear]);

  const isCheckedIn = Boolean(attendance?.checkIn);
  const isCheckedOut = Boolean(attendance?.checkOut);

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

  const years = Array.from(
    { length: 5 },
    (_, index) => currentDate.getFullYear() - index
  );

  return (
    <div className="space-y-7">

      {/* Today's Attendance */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <Clock size={17} />
              Indian Standard Time (IST)
            </div>

            <h2 className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
              {now.toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {formatFullDate(now)}
            </p>

            <div className="mt-4 flex flex-wrap gap-5 text-sm">
              <p className="text-slate-600 dark:text-slate-300">
                Check In:{" "}
                <span className="font-semibold text-slate-800 dark:text-white">
                  {formatTime(attendance?.checkIn)}
                </span>
              </p>

              <p className="text-slate-600 dark:text-slate-300">
                Check Out:{" "}
                <span className="font-semibold text-slate-800 dark:text-white">
                  {formatTime(attendance?.checkOut)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!isCheckedIn && !loading && (
              <button
                onClick={handleCheckIn}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                <LogIn size={18} />
                {processing ? "Processing..." : "Check In"}
              </button>
            )}

            {isCheckedIn && !isCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
              >
                <LogOut size={18} />
                {processing ? "Processing..." : "Check Out"}
              </button>
            )}

            {isCheckedOut && (
              <span className="inline-flex items-center justify-center rounded-xl bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
                Attendance Completed
              </span>
            )}
          </div>

        </div>

        {loading && (
          <p className="mt-3 text-sm text-slate-400">
            Loading today's attendance...
          </p>
        )}

        {message && (
          <p className="mt-3 text-sm text-blue-600">
            {message}
          </p>
        )}
      </section>

      {/* Monthly Attendance Details */}
      <section className="space-y-5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              My Attendance Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monthly attendance details for your HR account.
            </p>
          </div>

          <button
            onClick={() => {
              fetchTodayAttendance();
              if (hrId) fetchAttendanceHistory();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>

        </div>

        {/* HR Profile and Filters */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">

          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {hrProfile
                ? `${hrProfile.firstName || ""} ${hrProfile.lastName || ""}`.trim()
                : "My Attendance"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {hrProfile?.designation || "HR Manager"}
              {hrProfile?.department
                ? ` · ${hrProfile.department}`
                : ""}
            </p>
          </div>

          <div className="flex gap-3">

            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {months.map((month, index) => (
                <option
                  key={month}
                  value={String(index + 1).padStart(2, "0")}
                >
                  {month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Present Days</p>
            <h3 className="mt-3 text-3xl font-bold text-green-600">
              {summary.presentDays}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Late Days</p>
            <h3 className="mt-3 text-3xl font-bold text-orange-600">
              {summary.lateDays}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Absent Days</p>
            <h3 className="mt-3 text-3xl font-bold text-red-600">
              {summary.absentDays}
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500">Leave Days</p>
            <h3 className="mt-3 text-3xl font-bold text-blue-600">
              {summary.leaveDays}
            </h3>
          </div>

        </div>

        {/* Attendance Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

          <div className="border-b border-slate-200 p-5 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Monthly Attendance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Daily check-in, check-out, working hours, and status.
            </p>
          </div>

          {historyLoading ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Loading attendance history...
            </p>
          ) : historyError ? (
            <p className="p-8 text-center text-sm text-red-500">
              {historyError}
            </p>
          ) : attendanceHistory.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays
                size={35}
                className="mx-auto mb-3 text-slate-400"
              />

              <p className="font-medium text-slate-700 dark:text-white">
                No attendance records found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No records available for the selected month.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">

                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800">
                  <tr>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">Check In</th>
                    <th className="px-5 py-4 font-medium">Check Out</th>
                    <th className="px-5 py-4 font-medium">Working Hours</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceHistory.map((record) => (
                    <tr
                      key={record._id}
                      className="border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                    >
                      <td className="px-5 py-4">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {formatTime(record.checkOut)}
                      </td>

                      <td className="px-5 py-4">
                        {getWorkingHours(
                          record.checkIn,
                          record.checkOut
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            record.status
                          )}`}
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

        </div>
      </section>

      {/* Leave Management */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
              <CalendarDays size={18} />
              Leave Management
            </div>

            <h2 className="mt-2 text-xl font-bold text-slate-800 dark:text-white">
              My Leave Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Apply for leave and track your request status.
            </p>
          </div>

          <button
            onClick={() => {
              setLeaveMessage("");
              setShowLeaveForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Send size={17} />
            Apply for Leave
          </button>

        </div>

        {leaveMessage && (
          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            {leaveMessage}
          </p>
        )}

        {/* Leave History */}
        <div className="mt-6">

          <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-white">
            Leave History
          </h3>

          {leaveLoading ? (
            <p className="text-sm text-slate-400">
              Loading leave history...
            </p>
          ) : leaves.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <CalendarDays
                size={30}
                className="mx-auto mb-2 text-slate-400"
              />

              <p className="text-sm text-slate-500">
                You haven't applied for any leave yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[600px] text-left text-sm">

                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                    <th className="px-3 py-3 font-medium">Leave Type</th>
                    <th className="px-3 py-3 font-medium">From</th>
                    <th className="px-3 py-3 font-medium">To</th>
                    <th className="px-3 py-3 font-medium">Reason</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr
                      key={leave._id}
                      className="border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                    >
                      <td className="px-3 py-3">
                        {leave.leaveType}
                      </td>

                      <td className="px-3 py-3">
                        {formatDate(leave.startDate)}
                      </td>

                      <td className="px-3 py-3">
                        {formatDate(leave.endDate)}
                      </td>

                      <td className="max-w-[180px] truncate px-3 py-3">
                        {leave.reason}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${leave.status?.toLowerCase() === "approved"
                              ? "bg-green-100 text-green-700"
                              : leave.status?.toLowerCase() === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </div>
      </section>

      {/* APPLY LEAVE POPUP */}
      {showLeaveForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowLeaveForm(false);
            }
          }}
        >

          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

            {/* Popup Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarDays size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Apply for Leave
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Submit your leave request
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => setShowLeaveForm(false)}
                className="text-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            {/* Popup Form */}
            <form onSubmit={handleLeaveSubmit}>

              <div className="space-y-5 px-6 py-6">

                {/* Leave Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Leave Type *
                  </label>

                  <select
                    name="leaveType"
                    value={leaveForm.leaveType}
                    onChange={handleLeaveChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Start Date *
                    </label>

                    <input
                      type="date"
                      name="startDate"
                      value={leaveForm.startDate}
                      onChange={handleLeaveChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      End Date *
                    </label>

                    <input
                      type="date"
                      name="endDate"
                      value={leaveForm.endDate}
                      onChange={handleLeaveChange}
                      min={leaveForm.startDate || undefined}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                </div>

                {/* Reason */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Reason *
                  </label>

                  <textarea
                    name="reason"
                    value={leaveForm.reason}
                    onChange={handleLeaveChange}
                    required
                    rows={4}
                    placeholder="Enter your leave reason..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

              </div>

              {/* Popup Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">

                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {leaveSubmitting ? "Submitting..." : "Apply Leave"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default HRMyAttendanceActions;
