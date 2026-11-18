
import { useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  ArrowLeft,
  Eye,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    String(currentDate.getMonth() + 1)
  );

  const [selectedYear, setSelectedYear] = useState(
    String(currentDate.getFullYear())
  );

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

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

  // GET USER ROLE AND TOKEN
  const getUserInfo = () => {
    const storedRole =
      localStorage.getItem("zenhr-role") ||
      localStorage.getItem("role");

    const hrToken = localStorage.getItem("zenhr-hr-token");
    const adminToken = localStorage.getItem("zenhr-token");

    const isHR =
      storedRole?.toLowerCase() === "hr" ||
      (!storedRole && Boolean(hrToken));

    return {
      isHR,
      token: isHR ? hrToken : adminToken,
    };
  };

  // AUTH HEADERS
  const getAuthHeaders = () => {
    const { token } = getUserInfo();

    if (!token || token === "undefined" || token === "null") {
      return {
        "Content-Type": "application/json",
      };
    }

    return {
      Authorization: `Bearer ${token.trim()}`,
      "Content-Type": "application/json",
    };
  };

  // FETCH EMPLOYEES AND ATTENDANCE
  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage("");

      const headers = getAuthHeaders();

      const selectedAttendanceUrl =
        `${API_URL}/attendance?year=${selectedYear}&month=${selectedMonth}`;

      const currentMonth = String(currentDate.getMonth() + 1);
      const currentYear = String(currentDate.getFullYear());

      const currentAttendanceUrl =
        `${API_URL}/attendance?year=${currentYear}&month=${currentMonth}`;

      const requests = [
        fetch(`${API_URL}/employees`, { headers }),
        fetch(selectedAttendanceUrl, { headers }),
      ];

      if (
        selectedMonth !== currentMonth ||
        selectedYear !== currentYear
      ) {
        requests.push(fetch(currentAttendanceUrl, { headers }));
      }

      const responses = await Promise.all(requests);

      const employeeData = await responses[0].json();
      const selectedAttendanceData = await responses[1].json();

      const currentAttendanceData =
        responses.length === 3
          ? await responses[2].json()
          : selectedAttendanceData;

      if (!responses[0].ok) {
        throw new Error(
          employeeData.message || "Failed to load employees"
        );
      }

      if (!responses[1].ok) {
        throw new Error(
          selectedAttendanceData.message ||
            "Failed to load attendance"
        );
      }

      if (responses[2] && !responses[2].ok) {
        throw new Error(
          currentAttendanceData.message ||
            "Failed to load today's attendance"
        );
      }

      // ONLY EMPLOYEE RECORDS
      const employeeOnlyData = Array.isArray(employeeData)
        ? employeeData.filter(
            (employee) =>
              employee.role?.toLowerCase() === "employee"
          )
        : [];

      setEmployees(employeeOnlyData);

      // COMBINE SELECTED MONTH AND CURRENT MONTH
      const combinedRecords = [
        ...(Array.isArray(selectedAttendanceData)
          ? selectedAttendanceData
          : []),
        ...(Array.isArray(currentAttendanceData)
          ? currentAttendanceData
          : []),
      ];

      // REMOVE DUPLICATE RECORDS
      const uniqueRecords = Array.from(
        new Map(
          combinedRecords.map((record) => [
            record._id,
            record,
          ])
        ).values()
      );

      setAttendance(uniqueRecords);
    } catch (error) {
      console.error("Attendance fetch error:", error);

      setMessage(
        error.message || "Unable to load attendance data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // EMPLOYEE ATTENDANCE
  const employeeAttendance = attendance.filter(
    (record) => record.employee && !record.hr
  );

  // SELECTED MONTH EMPLOYEE ATTENDANCE
  const selectedMonthEmployeeAttendance =
    employeeAttendance.filter((record) => {
      if (!record.date) return false;

      const recordDate = new Date(record.date);

      return (
        recordDate.getMonth() + 1 === Number(selectedMonth) &&
        recordDate.getFullYear() === Number(selectedYear)
      );
    });

  // TODAY'S EMPLOYEE ATTENDANCE
  const today = new Date().toDateString();

  const todayEmployeeAttendance =
    employeeAttendance.filter(
      (record) =>
        record.date &&
        new Date(record.date).toDateString() === today
    );

  const presentCount = todayEmployeeAttendance.filter(
    (record) =>
      record.status === "Present" ||
      record.status === "Late"
  ).length;

  const checkedOutCount = todayEmployeeAttendance.filter(
    (record) => record.checkOut
  ).length;

  // FORMAT TIME
  const formatTime = (time) => {
    if (!time) return "--";

    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // GET EMPLOYEE NAME
  const getEmployeeName = (record) => {
    const employee = record.employee;

    if (!employee) return "Unknown";

    if (typeof employee === "string") {
      const matchedEmployee = employees.find(
        (item) => item._id === employee
      );

      if (!matchedEmployee) return "Unknown";

      return `${matchedEmployee.firstName || ""} ${
        matchedEmployee.lastName || ""
      }`.trim();
    }

    return `${employee.firstName || ""} ${
      employee.lastName || ""
    }`.trim();
  };

  // EMPLOYEE SEARCH
  const filteredEmployees = employees.filter((employee) => {
    const name = `${employee.firstName || ""} ${
      employee.lastName || ""
    }`.toLowerCase();

    const department = (
      employee.department || ""
    ).toLowerCase();

    const search = searchTerm.toLowerCase();

    return (
      name.includes(search) ||
      department.includes(search)
    );
  });

  // SELECTED EMPLOYEE MONTHLY ATTENDANCE
  const selectedEmployeeAttendance = selectedEmployeeId
    ? employeeAttendance.filter((record) => {
        const recordEmployeeId =
          record.employee?._id || record.employee;

        if (!record.date) return false;

        const recordDate = new Date(record.date);

        return (
          String(recordEmployeeId) ===
            String(selectedEmployeeId) &&
          recordDate.getMonth() + 1 ===
            Number(selectedMonth) &&
          recordDate.getFullYear() ===
            Number(selectedYear)
        );
      })
    : [];

  const selectedEmployeePresent =
    selectedEmployeeAttendance.filter(
      (record) => record.status === "Present"
    ).length;

  const selectedEmployeeLate =
    selectedEmployeeAttendance.filter(
      (record) => record.status === "Late"
    ).length;

  const selectedEmployeeAbsent =
    selectedEmployeeAttendance.filter(
      (record) => record.status === "Absent"
    ).length;

  const selectedEmployeeLeave =
    selectedEmployeeAttendance.filter(
      (record) => record.status === "Leave"
    ).length;

  // ATTENDANCE TABLE
  const AttendanceTable = ({ records }) => {
    if (records.length === 0) {
      return (
        <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No attendance records found for this month.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/70">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Check In</th>
              <th className="px-6 py-4">Check Out</th>
              <th className="px-6 py-4">Working Hours</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((record) => {
              const name = getEmployeeName(record);

              const workingHours =
                record.checkIn && record.checkOut
                  ? (
                      (new Date(record.checkOut) -
                        new Date(record.checkIn)) /
                      (1000 * 60 * 60)
                    ).toFixed(2)
                  : "--";

              const employee =
                typeof record.employee === "object"
                  ? record.employee
                  : employees.find(
                      (item) => item._id === record.employee
                    );

              return (
                <tr
                  key={record._id}
                  className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                        {name.charAt(0) || "?"}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Employee
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {employee?.department || "--"}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                    {formatDate(record.date)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                    {formatTime(record.checkIn)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                    {formatTime(record.checkOut)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">
                    {workingHours === "--"
                      ? "--"
                      : `${workingHours} hrs`}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        record.status === "Late"
                          ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                          : record.status === "Absent"
                          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : record.status === "Leave"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {record.status || "Present"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // PAGE UI
  return (
    <div className="w-full space-y-6 pb-8">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium tracking-wider text-blue-600">
            HR MANAGEMENT / ATTENDANCE
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-3xl">
            {selectedEmployeeId
              ? "Employee Attendance Details"
              : "Attendance Overview"}
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {selectedEmployeeId
              ? "Monthly attendance details for the selected employee."
              : "View employee attendance records and employee details."}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </header>

      {/* MESSAGE */}
      {message && (
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {message}
        </div>
      )}

      {/* EMPLOYEE DETAILS VIEW */}
      {selectedEmployeeId ? (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => {
              setSelectedEmployeeId("");
              setSelectedEmployeeData(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <ArrowLeft size={16} />
            Back to Attendance
          </button>

          <section className={`${cardClass} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {selectedEmployeeData?.firstName}{" "}
                  {selectedEmployeeData?.lastName}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedEmployeeData?.designation ||
                    "Employee"}{" "}
                  ·{" "}
                  {selectedEmployeeData?.department ||
                    "Department"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(event) =>
                    setSelectedYear(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
              </div>
            </div>
          </section>

          {/* MONTHLY OVERVIEW */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Present",
                count: selectedEmployeePresent,
                color: "text-emerald-600",
              },
              {
                label: "Late",
                count: selectedEmployeeLate,
                color: "text-orange-600",
              },
              {
                label: "Absent",
                count: selectedEmployeeAbsent,
                color: "text-red-600",
              },
              {
                label: "Leave",
                count: selectedEmployeeLeave,
                color: "text-blue-600",
              },
            ].map((item) => (
              <div key={item.label} className={`${cardClass} p-5`}>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {item.label} Days
                </p>

                <h2
                  className={`mt-3 text-3xl font-bold ${item.color}`}
                >
                  {item.count}
                </h2>
              </div>
            ))}
          </section>

          {/* MONTHLY ATTENDANCE TABLE */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Monthly Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Daily check-in, check-out, working hours, and status.
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading attendance...
              </div>
            ) : (
              <AttendanceTable
                records={selectedEmployeeAttendance}
              />
            )}
          </section>
        </div>
      ) : (
        <>
          {/* MONTH FILTER */}
          <section className={`${cardClass} flex flex-wrap gap-3 p-5`}>
            <select
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

          {/* SUMMARY CARDS */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Present Today
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-800 dark:text-white">
                {presentCount}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Employees checked in today
              </p>
            </div>

            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Checked Out
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-800 dark:text-white">
                {checkedOutCount}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Employees completed today
              </p>
            </div>

            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Employees
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-800 dark:text-white">
                {employees.length}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Registered employees
              </p>
            </div>
          </section>

          {/* TODAY ATTENDANCE */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="border-b border-slate-200 px-5 py-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Today Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Employees who checked in today.
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading today's attendance...
              </div>
            ) : (
              <AttendanceTable
                records={todayEmployeeAttendance}
              />
            )}
          </section>

          {/* EMPLOYEE LIST */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Employees
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Select an employee to view their monthly attendance.
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search employee..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading employees...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No employees found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/70">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Designation</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee._id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                              {employee.firstName?.charAt(0) || "?"}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {employee.firstName}{" "}
                                {employee.lastName}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {employee.department || "--"}
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {employee.designation || "--"}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployeeData(employee);
                              setSelectedEmployeeId(employee._id);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                          >
                            <Eye size={15} />
                            Attendance Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Attendance;
