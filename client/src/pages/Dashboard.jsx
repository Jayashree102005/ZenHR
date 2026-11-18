
import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  Clock,
  BriefcaseBusiness,
  ArrowUpRight,
  UserPlus,
  ChevronRight,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

function Dashboard({ onPageChange }) {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Get the admin token from localStorage
        const token = localStorage.getItem("zenhr-token");

        // Send the token with API requests
        const authHeaders = {
          Authorization: `Bearer ${token}`,
        };

        const [employeeResponse, attendanceResponse] = await Promise.all([
          fetch(`${API_URL}/employees`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/attendance`, {
            headers: authHeaders,
          }),
        ]);

        // Check whether API requests were successful
        if (!employeeResponse.ok || !attendanceResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const employeeData = await employeeResponse.json();
        const attendanceData = await attendanceResponse.json();

        setEmployees(Array.isArray(employeeData) ? employeeData : []);
        setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
      } catch (error) {
        console.error("Dashboard data error:", error);
      }
    }

    fetchDashboardData();
  }, []);

  const today = new Date();

  const todayAttendance = attendance.filter((record) => {
    return (
      record.date &&
      new Date(record.date).toDateString() === today.toDateString()
    );
  });

  const presentToday = todayAttendance.filter(
    (record) => record.checkIn
  ).length;

  const currentlyWorking = todayAttendance.filter(
    (record) => record.checkIn && !record.checkOut
  ).length;

  const onLeave = employees.filter(
    (employee) => employee.status === "On Leave"
  ).length;

  const stats = [
    {
      title: "Total Employees",
      value: employees.length,
      description: "Employees in your organization",
      icon: Users,
      color:
        "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      title: "Present Today",
      value: presentToday,
      description: "Employees checked in today",
      icon: CalendarCheck,
      color:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      title: "Currently Working",
      value: currentlyWorking,
      description: "Not checked out yet",
      icon: Clock,
      color:
        "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      title: "On Leave",
      value: onLeave,
      description: "Employees currently on leave",
      icon: BriefcaseBusiness,
      color:
        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
  ];

  const recentEmployees = [...employees]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.joiningDate || 0) -
        new Date(a.createdAt || a.joiningDate || 0)
    )
    .slice(0, 5);

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function getInitials(employee) {
    return `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();
  }

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold tracking-wider text-blue-600">
            OVERVIEW
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-3xl">
            Welcome back, Admin
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Here's what's happening with your workforce today.
          </p>
        </div>

        <div className={`${cardClass} px-4 py-3`}>
          <p className="text-xs text-slate-400">Today</p>
          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {formattedDate}
          </p>
        </div>
      </header>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className={`${cardClass} p-5 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-800 dark:text-white">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.color}`}
                >
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Attendance and Quick Actions */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Attendance Overview */}
        <div className={`${cardClass} p-5 sm:p-6 xl:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white">
                Attendance Overview
              </h2>

              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                Today's attendance summary
              </p>
            </div>

            <button
              type="button"
              onClick={() => onPageChange?.("Attendance")}
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View attendance
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex justify-between text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Attendance rate
              </span>

              <span className="font-bold text-slate-800 dark:text-white">
                {employees.length > 0
                  ? Math.min(
                      Math.round((presentToday / employees.length) * 100),
                      100
                    )
                  : 0}
                %
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${
                    employees.length > 0
                      ? Math.min((presentToday / employees.length) * 100, 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/50">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  Present
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-200">
                  {presentToday}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-950/50">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-300">
                  Working
                </p>
                <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-200">
                  {currentlyWorking}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/50">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-300">
                  On Leave
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-200">
                  {onLeave}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${cardClass} p-5 sm:p-6`}>
          <h2 className="font-bold text-slate-800 dark:text-white">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Common tasks
          </p>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => onPageChange?.("Employees")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-900 dark:hover:bg-slate-800 sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <UserPlus size={19} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Manage Employees
                </span>

                <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
                  View employee directory
                </span>
              </span>

              <ChevronRight size={17} className="shrink-0 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => onPageChange?.("Attendance")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:hover:border-emerald-900 dark:hover:bg-slate-800 sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Clock size={19} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Attendance
                </span>

                <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
                  View attendance records
                </span>
              </span>

              <ChevronRight size={17} className="shrink-0 text-slate-400" />
            </button>
          </div>
        </div>
      </section>

      {/* Recent Employees */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white">
              Recent Employees
            </h2>

            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Latest employees in your organization
            </p>
          </div>

          <button
            type="button"
            onClick={() => onPageChange?.("Employees")}
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="px-5 py-4 font-semibold">Employee</th>
                <th className="px-5 py-4 font-semibold">Department</th>
                <th className="px-5 py-4 font-semibold">Designation</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentEmployees.map((employee) => (
                <tr
                  key={employee._id}
                  className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {getInitials(employee)}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {employee.firstName} {employee.lastName}
                        </p>

                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {employee.email || "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {employee.department || "-"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {employee.designation || "-"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        employee.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : employee.status === "On Leave"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {employee.status || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}

              {recentEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
