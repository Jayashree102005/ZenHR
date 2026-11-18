
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  UserRound,
  LogOut,
  Clock,
  BriefcaseBusiness,
  Bell,
  CheckCircle2,
  Menu,
  X,
  Timer,
  RefreshCw,
  AlertCircle,
  Send,
  FileText,
} from "lucide-react";

const API_URL = "https://zenhr-backend.onrender.com/api";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusStyle(status) {
  switch (status) {
    case "Present": return "bg-green-100 text-green-700";
    case "Late": return "bg-orange-100 text-orange-700";
    case "Absent": return "bg-red-100 text-red-700";
    case "Half Day": return "bg-yellow-100 text-yellow-700";
    case "On Leave": return "bg-purple-100 text-purple-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getLeaveStatusStyle(status) {
  switch (status) {
    case "Approved": return "bg-green-100 text-green-700";
    case "Rejected": return "bg-red-100 text-red-700";
    case "Pending": return "bg-yellow-100 text-yellow-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthValue) {
  if (!monthValue) return "";

  const [year, month] = monthValue.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

// ==========================================
// EMPLOYEE DASHBOARD
// ==========================================

function EmployeeDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // EMPLOYEE DETAILS
  const token = localStorage.getItem("zenhr-employee-token");
  const savedEmployee = localStorage.getItem("zenhr-employee");

  let employee = {};
  try {
    employee = savedEmployee ? JSON.parse(savedEmployee) : {};
  } catch {
    employee = {};
  }

  const firstName = employee.firstName || "Employee";
  const fullName =
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
    "Employee";

  // ATTENDANCE STATES
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceRefresh, setAttendanceRefresh] = useState(0);

  // ATTENDANCE MONTH FILTER
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(
    getCurrentMonthValue()
  );

  // TASK STATES
  const [myTasks, setMyTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [taskUpdatingId, setTaskUpdatingId] = useState(null);
  const [taskRefresh, setTaskRefresh] = useState(0);

  // LEAVE STATES
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");
  const [leaveRefresh, setLeaveRefresh] = useState(0);

  // LEAVE POPUP VISIBILITY
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // PROFILE STATES
  const [myProfile, setMyProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileRefresh, setProfileRefresh] = useState(0);

  // SIDEBAR MENU
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Attendance", icon: CalendarCheck },
    { name: "My Leaves", icon: CalendarDays },
    { name: "My Tasks", icon: ClipboardList },
    { name: "My Profile", icon: UserRound },
  ];

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("zenhr-employee-token");
    localStorage.removeItem("zenhr-employee");
    window.location.href = "/employee-login";
  };

  // CHANGE PAGE
  const handlePageChange = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setShowApplyLeaveModal(false);

    setAttendanceMessage("");
    setAttendanceError("");
    setTaskMessage("");
    setTaskError("");
    setLeaveMessage("");
    setLeaveError("");
    setProfileError("");
  };

  // LOAD EMPLOYEE ATTENDANCE
  useEffect(() => {
    if (activePage !== "My Attendance") return;

    const loadAttendance = async () => {
      if (!token) {
        setAttendanceError("Please login again to view attendance.");
        return;
      }

      setAttendanceLoading(true);
      setAttendanceError("");

      try {
        const [year, month] = selectedAttendanceMonth
          .split("-")
          .map(Number);

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [todayResponse, historyResponse] = await Promise.all([
          fetch(`${API_URL}/attendance/employee/my/today`, { headers }),
          fetch(
            `${API_URL}/attendance/employee/my?year=${year}&month=${month}`,
            { headers }
          ),
        ]);

        const todayData = await todayResponse.json();
        const historyData = await historyResponse.json();

        if (!todayResponse.ok) {
          throw new Error(
            todayData.message || "Unable to load today's attendance."
          );
        }

        if (!historyResponse.ok) {
          throw new Error(
            historyData.message || "Unable to load attendance history."
          );
        }

        setTodayAttendance(todayData);
        setAttendanceHistory(
          Array.isArray(historyData) ? historyData : []
        );
      } catch (error) {
        setAttendanceError(error.message || "Something went wrong.");
      } finally {
        setAttendanceLoading(false);
      }
    };

    loadAttendance();
  }, [
    activePage,
    attendanceRefresh,
    selectedAttendanceMonth,
    token,
  ]);

  // EMPLOYEE CHECK IN
  const handleCheckIn = async () => {
    if (!token) {
      setAttendanceError("Please login again.");
      return;
    }

    setAttendanceActionLoading(true);
    setAttendanceError("");
    setAttendanceMessage("");

    try {
      const response = await fetch(
        `${API_URL}/attendance/employee/my/check-in`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Check-in failed.");

      setAttendanceMessage(data.message || "Check-in successful.");
      setAttendanceRefresh((previous) => previous + 1);
    } catch (error) {
      setAttendanceError(error.message);
    } finally {
      setAttendanceActionLoading(false);
    }
  };

  // EMPLOYEE CHECK OUT
  const handleCheckOut = async () => {
    if (!todayAttendance?._id) {
      setAttendanceError("Today's attendance record was not found.");
      return;
    }

    setAttendanceActionLoading(true);
    setAttendanceError("");
    setAttendanceMessage("");

    try {
      const response = await fetch(
        `${API_URL}/attendance/employee/my/check-out/${todayAttendance._id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Check-out failed.");

      setAttendanceMessage(data.message || "Check-out successful.");
      setAttendanceRefresh((previous) => previous + 1);
    } catch (error) {
      setAttendanceError(error.message);
    } finally {
      setAttendanceActionLoading(false);
    }
  };

  // LOAD EMPLOYEE TASKS
  useEffect(() => {
    if (activePage !== "My Tasks") return;

    const loadMyTasks = async () => {
      if (!token) {
        setTaskError("Please login again to view your tasks.");
        return;
      }

      setTaskLoading(true);
      setTaskError("");

      try {
        const response = await fetch(`${API_URL}/tasks/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load tasks.");

        setMyTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        setTaskError(error.message || "Something went wrong.");
      } finally {
        setTaskLoading(false);
      }
    };

    loadMyTasks();
  }, [activePage, taskRefresh, token]);

  // UPDATE EMPLOYEE TASK STATUS
  const handleTaskStatusChange = async (taskId, status) => {
    if (!token) {
      setTaskError("Please login again.");
      return;
    }

    setTaskUpdatingId(taskId);
    setTaskError("");
    setTaskMessage("");

    try {
      const response = await fetch(`${API_URL}/tasks/my/${taskId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to update task status.");
      }

      setMyTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === taskId
            ? { ...task, status: data.task.status }
            : task
        )
      );

      setTaskMessage("Task status updated successfully.");
    } catch (error) {
      setTaskError(error.message || "Something went wrong.");
    } finally {
      setTaskUpdatingId(null);
    }
  };

  // LOAD EMPLOYEE LEAVE HISTORY
  useEffect(() => {
    if (activePage !== "My Leaves") return;

    const loadMyLeaves = async () => {
      if (!token) {
        setLeaveError("Please login again to view your leave history.");
        return;
      }

      setLeaveLoading(true);
      setLeaveError("");

      try {
        const response = await fetch(`${API_URL}/leaves/employee/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load your leave history.");
        }

        setMyLeaves(Array.isArray(data) ? data : []);
      } catch (error) {
        setLeaveError(error.message || "Something went wrong.");
      } finally {
        setLeaveLoading(false);
      }
    };

    loadMyLeaves();
  }, [activePage, leaveRefresh, token]);

  // HANDLE LEAVE FORM INPUTS
  const handleLeaveInputChange = (event) => {
    const { name, value } = event.target;
    setLeaveForm((previous) => ({ ...previous, [name]: value }));
  };

  // APPLY FOR LEAVE
  const handleApplyLeave = async (event) => {
    event.preventDefault();

    if (!token) {
      setLeaveError("Please login again to apply for leave.");
      return;
    }

    if (
      !leaveForm.leaveType ||
      !leaveForm.startDate ||
      !leaveForm.endDate ||
      !leaveForm.reason.trim()
    ) {
      setLeaveError("Please fill in all leave details.");
      return;
    }

    if (leaveForm.endDate < leaveForm.startDate) {
      setLeaveError("End date cannot be before start date.");
      return;
    }

    setLeaveSubmitting(true);
    setLeaveError("");
    setLeaveMessage("");

    try {
      const response = await fetch(`${API_URL}/leaves/employee/my`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to apply for leave.");
      }

      setLeaveMessage(
        data.message || "Leave applied successfully. Waiting for approval."
      );

      setLeaveForm({
        leaveType: "Casual Leave",
        startDate: "",
        endDate: "",
        reason: "",
      });

      setShowApplyLeaveModal(false);
      setLeaveRefresh((previous) => previous + 1);
    } catch (error) {
      setLeaveError(error.message || "Something went wrong.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // LOAD EMPLOYEE PROFILE
  useEffect(() => {
    if (activePage !== "My Profile") return;

    const loadMyProfile = async () => {
      if (!token) {
        setProfileError("Please login again to view your profile.");
        return;
      }

      setProfileLoading(true);
      setProfileError("");

      try {
        const response = await fetch(`${API_URL}/employees/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load your profile.");
        }

        setMyProfile(data.employee);
        localStorage.setItem("zenhr-employee", JSON.stringify(data.employee));
      } catch (error) {
        setProfileError(error.message || "Something went wrong.");
      } finally {
        setProfileLoading(false);
      }
    };

    loadMyProfile();
  }, [activePage, profileRefresh, token]);

  // ATTENDANCE SUMMARY
  const presentDays = attendanceHistory.filter(
    (item) => item.status === "Present"
  ).length;

  const lateDays = attendanceHistory.filter(
    (item) => item.status === "Late"
  ).length;

  const totalDays = attendanceHistory.length;
  const checkedIn = Boolean(todayAttendance?.checkIn);
  const checkedOut = Boolean(todayAttendance?.checkOut);

  // TASK SUMMARY
  const totalTasks = myTasks.length;
  const inProgressTasks = myTasks.filter(
    (task) => task.status === "In Progress"
  ).length;
  const completedTasks = myTasks.filter(
    (task) => task.status === "Completed"
  ).length;

  // LEAVE SUMMARY
  const totalLeaves = myLeaves.length;
  const pendingLeaves = myLeaves.filter(
    (leave) => leave.status === "Pending"
  ).length;
  const approvedLeaves = myLeaves.filter(
    (leave) => leave.status === "Approved"
  ).length;
  const rejectedLeaves = myLeaves.filter(
    (leave) => leave.status === "Rejected"
  ).length;

  // TASK PRIORITY COLORS
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700";
      case "Medium": return "bg-yellow-100 text-yellow-700";
      case "Low": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  // TASK STATUS COLORS
  const getTaskStatusStyle = (status) => {
    switch (status) {
      case "To Do": return "bg-slate-100 text-slate-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      case "Completed": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  // ==========================================
  // MAIN JSX
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white text-slate-800 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-slate-800">
              Zen<span className="text-blue-600">HR</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">Employee Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-500 transition hover:text-slate-800 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handlePageChange(item.name)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${activePage === item.name
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-h-screen lg:ml-64">
        {/* HEADER */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                {activePage}
              </h2>
              <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                Welcome to your employee portal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-2 py-2 sm:gap-3 sm:px-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{fullName}</p>
                <p className="text-xs text-slate-500">
                  {employee.designation || "Employee"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-4 sm:p-8">
          {/* DASHBOARD */}
          {activePage === "Dashboard" && (
            <>
              <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
                <p className="text-sm text-blue-100">Employee Dashboard</p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Hello, {firstName}! 👋
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                  Welcome to ZenHR. Manage your attendance, leaves, tasks and
                  personal information from one place.
                </p>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">Department</p>
                    <BriefcaseBusiness className="text-blue-500" size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {employee.department || "Not available"}
                  </h3>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">Designation</p>
                    <UserRound className="text-purple-500" size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {employee.designation || "Not available"}
                  </h3>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">Account Status</p>
                    <CheckCircle2 className="text-green-500" size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-green-600">
                    {employee.status || "Active"}
                  </h3>
                </div>
              </div>

              <h3 className="mb-4 text-lg font-bold text-slate-800">
                Quick Access
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <button
                  onClick={() => handlePageChange("My Attendance")}
                  className="rounded-xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <CalendarCheck className="mb-4 text-blue-600" size={28} />
                  <h4 className="font-bold text-slate-800">My Attendance</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Check in, check out and view your attendance records.
                  </p>
                </button>

                <button
                  onClick={() => handlePageChange("My Leaves")}
                  className="rounded-xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <CalendarDays className="mb-4 text-purple-600" size={28} />
                  <h4 className="font-bold text-slate-800">My Leaves</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Apply for leave and track your requests.
                  </p>
                </button>

                <button
                  onClick={() => handlePageChange("My Tasks")}
                  className="rounded-xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <ClipboardList className="mb-4 text-orange-500" size={28} />
                  <h4 className="font-bold text-slate-800">My Tasks</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Check your assigned tasks and progress.
                  </p>
                </button>
              </div>

              <div className="mt-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-bold text-slate-800">
                  My Information
                </h3>
                <div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-slate-500">Full Name</p>
                    <p className="mt-1 font-semibold text-slate-800">{fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email Address</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {employee.email || "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {employee.phone || "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Joining Date</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(employee.joiningDate)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MY ATTENDANCE */}
          {activePage === "My Attendance" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Attendance Overview
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your daily attendance and view your records.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label
                      htmlFor="attendanceMonth"
                      className="text-sm font-medium text-slate-600"
                    >
                      Select Month
                    </label>
                    <input
                      id="attendanceMonth"
                      type="month"
                      value={selectedAttendanceMonth}
                      max={getCurrentMonthValue()}
                      onChange={(event) =>
                        setSelectedAttendanceMonth(event.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    onClick={() => setAttendanceRefresh((previous) => previous + 1)}
                    disabled={attendanceLoading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>

              {attendanceError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                  {attendanceError}
                </div>
              )}

              {attendanceMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {attendanceMessage}
                </div>
              )}

              {attendanceLoading ? (
                <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-100 bg-white">
                  <div className="text-center">
                    <RefreshCw className="mx-auto mb-3 animate-spin text-blue-600" size={28} />
                    <p className="text-sm text-slate-500">Loading attendance...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* TODAY'S ATTENDANCE */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Today's Attendance
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-800">
                          {new Date().toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                      </div>

                      {todayAttendance && (
                        <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(todayAttendance.status)}`}>
                          {todayAttendance.status}
                        </span>
                      )}
                    </div>

                    <div className="my-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-5">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Timer size={18} className="text-green-600" />
                          Check-in Time
                        </div>
                        <p className="mt-3 text-2xl font-bold text-slate-800">
                          {formatTime(todayAttendance?.checkIn)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-5">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock size={18} className="text-orange-500" />
                          Check-out Time
                        </div>
                        <p className="mt-3 text-2xl font-bold text-slate-800">
                          {formatTime(todayAttendance?.checkOut)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={handleCheckIn}
                        disabled={attendanceActionLoading || checkedIn || Boolean(todayAttendance)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <CalendarCheck size={19} />
                        {attendanceActionLoading
                          ? "Please wait..."
                          : checkedIn
                            ? "Already Checked In"
                            : "Check In"}
                      </button>

                      <button
                        onClick={handleCheckOut}
                        disabled={attendanceActionLoading || !checkedIn || checkedOut}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <LogOut size={19} />
                        {attendanceActionLoading
                          ? "Please wait..."
                          : checkedOut
                            ? "Already Checked Out"
                            : "Check Out"}
                      </button>
                    </div>

                    {!todayAttendance && (
                      <p className="mt-4 text-center text-xs text-slate-500">
                        You have not checked in today.
                      </p>
                    )}

                    {checkedIn && !checkedOut && (
                      <p className="mt-4 text-center text-xs text-green-600">
                        You are checked in. Remember to check out before leaving.
                      </p>
                    )}

                    {checkedOut && (
                      <p className="mt-4 text-center text-xs text-blue-600">
                        Your attendance for today is completed.
                      </p>
                    )}
                  </div>

                  {/* SELECTED MONTH SUMMARY */}
                  <div>
                    <h3 className="mb-4 text-lg font-bold text-slate-800">
                      {formatMonthLabel(selectedAttendanceMonth)} Summary
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Total Records</p>
                        <p className="mt-2 text-3xl font-bold text-slate-800">
                          {totalDays}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Present Days</p>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                          {presentDays}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Late Days</p>
                        <p className="mt-2 text-3xl font-bold text-orange-500">
                          {lateDays}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ATTENDANCE HISTORY */}
                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                      <h3 className="text-lg font-bold text-slate-800">
                        Attendance History
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Your attendance records for {formatMonthLabel(selectedAttendanceMonth)}.
                      </p>
                    </div>

                    {attendanceHistory.length === 0 ? (
                      <div className="p-10 text-center">
                        <CalendarCheck className="mx-auto mb-3 text-slate-300" size={38} />
                        <p className="font-semibold text-slate-700">
                          No attendance records found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          No records found for {formatMonthLabel(selectedAttendanceMonth)}.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-5 py-4 font-semibold">Date</th>
                              <th className="px-5 py-4 font-semibold">Check In</th>
                              <th className="px-5 py-4 font-semibold">Check Out</th>
                              <th className="px-5 py-4 font-semibold">Status</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {attendanceHistory.map((record) => (
                              <tr key={record._id} className="hover:bg-slate-50">
                                <td className="px-5 py-4 font-medium text-slate-800">
                                  {formatDate(record.date)}
                                </td>
                                <td className="px-5 py-4 text-slate-600">
                                  {formatTime(record.checkIn)}
                                </td>
                                <td className="px-5 py-4 text-slate-600">
                                  {formatTime(record.checkOut)}
                                </td>
                                <td className="px-5 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(record.status)}`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* MY LEAVES */}
          {activePage === "My Leaves" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Leave Management</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Apply for leave and track the status of your applications.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => {
                      setLeaveError("");
                      setLeaveMessage("");
                      setShowApplyLeaveModal(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <CalendarDays size={17} />
                    Apply Leave
                  </button>

                  <button
                    onClick={() => setLeaveRefresh((previous) => previous + 1)}
                    disabled={leaveLoading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
              </div>

              {leaveError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                  {leaveError}
                </div>
              )}

              {leaveMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {leaveMessage}
                </div>
              )}

              {/* LEAVE SUMMARY */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Total Requests</p>
                    <FileText className="text-blue-500" size={22} />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-800">{totalLeaves}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Pending</p>
                    <Clock className="text-yellow-500" size={22} />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-yellow-600">{pendingLeaves}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Approved</p>
                    <CheckCircle2 className="text-green-500" size={22} />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-green-600">{approvedLeaves}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Rejected</p>
                    <AlertCircle className="text-red-500" size={22} />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-red-600">{rejectedLeaves}</p>
                </div>
              </div>

              {/* APPLY LEAVE POPUP */}
              {showApplyLeaveModal && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
                  onClick={(event) => {
                    if (event.target === event.currentTarget && !leaveSubmitting) {
                      setShowApplyLeaveModal(false);
                    }
                  }}
                >
                  <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <CalendarDays size={23} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">Apply for Leave</h3>
                          <p className="mt-1 text-sm text-slate-500">Submit your leave request</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowApplyLeaveModal(false)}
                        disabled={leaveSubmitting}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        aria-label="Close leave form"
                      >
                        <X size={22} />
                      </button>
                    </div>

                    <form onSubmit={handleApplyLeave}>
                      <div className="space-y-5 p-6">
                        {leaveError && (
                          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            {leaveError}
                          </div>
                        )}

                        <div>
                          <label htmlFor="leaveType" className="mb-2 block text-sm font-semibold text-slate-700">
                            Leave Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="leaveType"
                            name="leaveType"
                            value={leaveForm.leaveType}
                            onChange={handleLeaveInputChange}
                            required
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Annual Leave">Annual Leave</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <div>
                            <label htmlFor="startDate" className="mb-2 block text-sm font-semibold text-slate-700">
                              Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="startDate"
                              name="startDate"
                              type="date"
                              min={getTodayDate()}
                              value={leaveForm.startDate}
                              onChange={handleLeaveInputChange}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label htmlFor="endDate" className="mb-2 block text-sm font-semibold text-slate-700">
                              End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="endDate"
                              name="endDate"
                              type="date"
                              min={leaveForm.startDate || getTodayDate()}
                              value={leaveForm.endDate}
                              onChange={handleLeaveInputChange}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="reason" className="mb-2 block text-sm font-semibold text-slate-700">
                            Reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="reason"
                            name="reason"
                            rows="4"
                            value={leaveForm.reason}
                            onChange={handleLeaveInputChange}
                            placeholder="Enter your leave reason..."
                            required
                            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => setShowApplyLeaveModal(false)}
                          disabled={leaveSubmitting}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={leaveSubmitting}
                          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          <Send size={17} />
                          {leaveSubmitting ? "Submitting..." : "Apply Leave"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* LEAVE HISTORY */}
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">My Leave History</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      View all your submitted leave applications.
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {totalLeaves} request{totalLeaves === 1 ? "" : "s"}
                  </span>
                </div>

                {leaveLoading ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="mx-auto mb-3 animate-spin text-blue-600" size={28} />
                      <p className="text-sm text-slate-500">Loading your leave history...</p>
                    </div>
                  </div>
                ) : myLeaves.length === 0 ? (
                  <div className="p-10 text-center">
                    <CalendarDays className="mx-auto mb-3 text-slate-300" size={42} />
                    <h4 className="font-bold text-slate-800">No Leave Applications Yet</h4>
                    <p className="mt-2 text-sm text-slate-500">
                      Your leave requests will appear here after you apply.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Leave Type</th>
                          <th className="px-5 py-4 font-semibold">Start Date</th>
                          <th className="px-5 py-4 font-semibold">End Date</th>
                          <th className="px-5 py-4 font-semibold">Reason</th>
                          <th className="px-5 py-4 font-semibold">Applied On</th>
                          <th className="px-5 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myLeaves.map((leave) => (
                          <tr key={leave._id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4 font-semibold text-slate-800">{leave.leaveType}</td>
                            <td className="px-5 py-4 text-slate-600">{formatDate(leave.startDate)}</td>
                            <td className="px-5 py-4 text-slate-600">{formatDate(leave.endDate)}</td>
                            <td className="max-w-[220px] px-5 py-4 text-slate-600">
                              <p className="truncate" title={leave.reason}>{leave.reason}</p>
                            </td>
                            <td className="px-5 py-4 text-slate-600">{formatDate(leave.appliedAt)}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getLeaveStatusStyle(leave.status)}`}>
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
            </div>
          )}

          {/* MY TASKS */}
          {activePage === "My Tasks" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">My Assigned Tasks</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    View your assigned tasks and update your progress.
                  </p>
                </div>
                <button
                  onClick={() => setTaskRefresh((previous) => previous + 1)}
                  disabled={taskLoading}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {taskError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                  {taskError}
                </div>
              )}

              {taskMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {taskMessage}
                </div>
              )}

              {taskLoading ? (
                <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-100 bg-white">
                  <div className="text-center">
                    <RefreshCw className="mx-auto mb-3 animate-spin text-blue-600" size={28} />
                    <p className="text-sm text-slate-500">Loading your tasks...</p>
                  </div>
                </div>
              ) : myTasks.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                  <ClipboardList className="mx-auto mb-4 text-slate-300" size={42} />
                  <h3 className="font-bold text-slate-800">No Tasks Assigned</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Tasks assigned to you by Admin or HR will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">Total Tasks</p>
                      <p className="mt-2 text-3xl font-bold text-slate-800">{totalTasks}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">In Progress</p>
                      <p className="mt-2 text-3xl font-bold text-blue-600">{inProgressTasks}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">Completed</p>
                      <p className="mt-2 text-3xl font-bold text-green-600">{completedTasks}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {myTasks.map((task) => {
                      const isOverdue =
                        task.status !== "Completed" &&
                        task.dueDate &&
                        new Date(task.dueDate).setHours(0, 0, 0, 0) <
                        new Date().setHours(0, 0, 0, 0);

                      return (
                        <div key={task._id} className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="break-words text-lg font-bold text-slate-800">{task.title}</h3>
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                                {task.description || "No description provided."}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(task.priority)}`}>
                              {task.priority || "Medium"} Priority
                            </span>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <div>
                              <p className="text-xs text-slate-500">Due Date</p>
                              <p className={`mt-1 text-sm font-semibold ${isOverdue ? "text-red-600" : "text-slate-700"}`}>
                                {formatDate(task.dueDate)}{isOverdue ? " (Overdue)" : ""}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTaskStatusStyle(task.status)}`}>
                              {task.status}
                            </span>
                          </div>

                          <div className="mt-5">
                            <label htmlFor={`task-status-${task._id}`} className="mb-2 block text-sm font-semibold text-slate-700">
                              Update Task Status
                            </label>
                            <select
                              id={`task-status-${task._id}`}
                              value={task.status}
                              disabled={taskUpdatingId === task._id}
                              onChange={(event) => handleTaskStatusChange(task._id, event.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                            {taskUpdatingId === task._id && (
                              <p className="mt-2 text-xs text-blue-600">Updating task status...</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* MY PROFILE */}
          {activePage === "My Profile" && (
            <div className="space-y-6">

              {/* PROFILE PAGE HEADER */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Personal Profile
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    View your personal and employment information.
                  </p>
                </div>

                <button
                  onClick={() => setProfileRefresh((previous) => previous + 1)}
                  disabled={profileLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={profileLoading ? "animate-spin" : ""}
                  />
                  Refresh Profile
                </button>
              </div>

              {/* PROFILE ERROR */}
              {profileError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                  {profileError}
                </div>
              )}

              {/* PROFILE LOADING */}
              {profileLoading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-100 bg-white">
                  <div className="text-center">
                    <RefreshCw
                      className="mx-auto mb-3 animate-spin text-blue-600"
                      size={30}
                    />
                    <p className="text-sm text-slate-500">
                      Loading your profile...
                    </p>
                  </div>
                </div>
              ) : myProfile ? (
                <>
                  {/* PROFILE CARD */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* TOP BANNER */}
                    <div className="relative h-36 overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 sm:h-40">
                      <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" />
                      <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full border-[25px] border-white/10" />

                      <div className="relative z-10 px-6 pt-6 sm:px-8">
                        <p className="text-sm font-medium text-blue-100">
                          EMPLOYEE PROFILE
                        </p>
                        <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                          Your Personal Space
                        </h2>
                      </div>
                    </div>

                    {/* PROFILE DETAILS */}
                    <div className="px-5 pb-6 sm:px-8">

                      {/* AVATAR + NAME + STATUS */}
                      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        {/* AVATAR AND NAME */}
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-blue-50 text-3xl font-bold uppercase text-blue-700 shadow-md">
                            {myProfile.firstName?.charAt(0) || "E"}
                          </div>

                          <div className="min-w-0 pb-1">
                            <h2 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                              {myProfile.firstName || ""} {myProfile.lastName || ""}
                            </h2>

                            <p className="mt-1 text-sm font-medium text-slate-500">
                              {myProfile.designation || "Employee"}
                            </p>

                            <p className="mt-2 text-xs font-medium text-slate-400">
                              {myProfile.department || "Department not assigned"}
                            </p>
                          </div>
                        </div>

                        {/* STATUS */}
                        <div className="sm:pb-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${myProfile.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                              }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${myProfile.status === "Active"
                                ? "bg-green-500"
                                : "bg-red-500"
                                }`}
                            />
                            {myProfile.status || "Active"}
                          </span>
                        </div>
                      </div>

                      {/* EMAIL */}
                      <div className="mt-7 border-t border-slate-100 pt-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <UserRound size={19} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Email Address
                            </p>
                            <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                              {myProfile.email || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PERSONAL INFORMATION */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound size={22} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          Personal Information
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Your basic personal details
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-10 gap-y-7 p-6 sm:grid-cols-2">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          First Name
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                          {myProfile.firstName || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Last Name
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                          {myProfile.lastName || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Email Address
                        </p>
                        <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                          {myProfile.email || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Phone Number
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {myProfile.phone || "Not provided"}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* EMPLOYMENT INFORMATION */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <BriefcaseBusiness size={22} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          Employment Information
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Your job and company details
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-10 gap-y-7 p-6 sm:grid-cols-2">

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Employee ID
                        </p>
                        <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                          {myProfile._id || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Department
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {myProfile.department || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Designation
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {myProfile.designation || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Joining Date
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {formatDate(myProfile.joiningDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Account Role
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {myProfile.role || "Employee"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Employment Status
                        </p>
                        <p className={`mt-2 text-sm font-semibold ${myProfile.status === "Active"
                          ? "text-green-600"
                          : "text-red-600"
                          }`}>
                          {myProfile.status || "Active"}
                        </p>
                      </div>

                    </div>
                  </div>
                </>
              ) : (
                !profileError && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <UserRound className="mx-auto mb-3 text-slate-300" size={42} />
                    <h3 className="font-bold text-slate-800">
                      Profile Not Found
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Unable to find your employee profile.
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
