import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Timer,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

const API_URL = "https://zenhr-backend.onrender.com/api";

const formatTime = (value) => {
  if (!value) return "--";

  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (value) => {
  if (!value) return "--";

  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getWorkingHours = (checkIn, checkOut) => {
  if (!checkIn) return "--";

  const end = checkOut ? new Date(checkOut) : null;

  if (!end) return "In progress";

  const totalMinutes = Math.max(
    0,
    Math.floor((end - new Date(checkIn)) / 60000)
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
};

function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

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

  const token = localStorage.getItem("zenhr-hr-token");
  const hr = JSON.parse(localStorage.getItem("zenhr-hr") || "{}");
  const hrId = hr._id || hr.id;

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/attendance?year=${selectedYear}&month=${selectedMonth + 1}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load attendance");
      }

      if (!Array.isArray(data)) {
        throw new Error("Attendance response is not valid");
      }

      // HR records only — do not show employee records
      const myRecords = data.filter((record) => {
        const recordHRId = record.hr?._id || record.hr;

        return (
          record.hr &&
          !record.employee &&
          String(recordHRId) === String(hrId)
        );
      });

      setRecords(myRecords);
    } catch (error) {
      console.error("My attendance error:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, selectedYear]);

  const changeMonth = (direction) => {
    let month = selectedMonth + direction;
    let year = selectedYear;

    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }

    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const monthName = `${months[selectedMonth]} ${selectedYear}`;

  const todayRecord = records.find((record) => {
    if (!record.date) return false;

    const recordDate = new Date(record.date);
    const now = new Date();

    const recordISTDate = recordDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const todayISTDate = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    return recordISTDate === todayISTDate;
  });

  const totalCompletedDays = records.filter(
    (record) => record.checkIn && record.checkOut
  ).length;

  const totalHours = records.reduce((total, record) => {
    if (!record.checkIn || !record.checkOut) return total;

    return (
      total +
      (new Date(record.checkOut) - new Date(record.checkIn)) /
      (1000 * 60 * 60)
    );
  }, 0);

  return (
    <div className="space-y-6">
      {!showDetails ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                My Attendance
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your personal attendance record.
              </p>
            </div>

            <button
              onClick={fetchAttendance}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <CalendarDays size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Today's Attendance
                </p>

                <h2 className="font-semibold text-slate-800 dark:text-white">
                  {todayRecord
                    ? todayRecord.checkOut
                      ? "Attendance Completed"
                      : "Checked In"
                    : "Not Checked In"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Check In: {formatTime(todayRecord?.checkIn)}{" "}
                  <span className="mx-2">|</span>
                  Check Out: {formatTime(todayRecord?.checkOut)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Days Completed</p>
                <CalendarDays className="text-green-600" size={20} />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-white">
                {totalCompletedDays}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                {monthName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Total Working Hours</p>
                <Timer className="text-purple-600" size={20} />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-white">
                {Math.floor(totalHours)}h{" "}
                {Math.round((totalHours % 1) * 60)}m
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Completed shifts in {monthName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Current Status</p>
                <Clock className="text-blue-600" size={20} />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-white">
                {todayRecord?.checkIn
                  ? todayRecord?.checkOut
                    ? "Completed"
                    : "Working"
                  : "Not Started"}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Today's attendance status
              </p>
            </div>
          </div>

          {message && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setShowDetails(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <CalendarDays size={18} />
              Attendance Details
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <button
                onClick={() => setShowDetails(false)}
                className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft size={17} />
                Back to My Attendance
              </button>

              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Attendance Details
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your attendance history for {monthName}.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => changeMonth(-1)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="min-w-36 text-center text-sm font-semibold text-slate-800 dark:text-white">
                {monthName}
              </span>

              <button
                onClick={() => changeMonth(1)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {message}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading attendance records...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {[
                        "Date",
                        "Check In",
                        "Check Out",
                        "Working Hours",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-xs font-semibold uppercase text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {records.length > 0 ? (
                      records.map((record) => (
                        <tr key={record._id}>
                          <td className="px-5 py-4 text-sm font-medium text-slate-800 dark:text-white">
                            {formatDate(record.date)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {formatTime(record.checkIn)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {formatTime(record.checkOut)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {getWorkingHours(
                              record.checkIn,
                              record.checkOut
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-950 dark:text-green-300">
                              {record.status || "Present"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          No attendance records found for {monthName}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MyAttendance;