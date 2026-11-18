
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import Employees from "./Employees";
import Attendance from "./Attendance";
import HRMyAttendanceActions from "./HRMyAttendanceActions";
import Leave from "./Leave";
import Tasks from "./Tasks";

const API_URL = "https://zenhr-backend.onrender.com/api";

const hrMenu = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Employees", icon: Users },
  { name: "Attendance", icon: CalendarCheck },
  { name: "My Attendance", icon: CalendarDays },
  { name: "Leave Management", icon: CalendarDays },
  { name: "Tasks", icon: ClipboardList },
  { name: "Settings", icon: Settings },
];

function HRDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [hr, setHr] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    openTasks: 0,
    todayLeaves: [],
    highPriorityTasks: [],
  });

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  // Fetch logged-in HR profile
  useEffect(() => {
    const fetchHRProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const token = localStorage.getItem("zenhr-hr-token");

        const response = await fetch(`${API_URL}/hr/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch HR profile");
        }

        const profile = data.hr || {};

        setHr(profile);
        localStorage.setItem("zenhr-hr", JSON.stringify(profile));
      } catch (error) {
        setProfileError(error.message);

        try {
          const savedHR =
            JSON.parse(localStorage.getItem("zenhr-hr")) || {};

          setHr(savedHR);
        } catch {
          setHr({});
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchHRProfile();
  }, []);

  // Fetch employee data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("zenhr-hr-token");

        const response = await fetch(`${API_URL}/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch employees");
        }

        if (Array.isArray(data)) {
          const regularEmployees = data.filter((employee) => {
            const role = employee.role?.toLowerCase();

            return role !== "hr" && role !== "admin";
          });

          setEmployees(regularEmployees);
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Unable to fetch employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("zenhr-hr-token");

        const response = await fetch(`${API_URL}/hr-dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to fetch dashboard data"
          );
        }

        setDashboardData({
          totalEmployees: result.data?.totalEmployees ?? 0,
          presentToday: result.data?.presentToday ?? 0,
          pendingLeaves: result.data?.pendingLeaves ?? 0,
          openTasks: result.data?.openTasks ?? 0,
          todayLeaves: result.data?.todayLeaves ?? [],
          highPriorityTasks: result.data?.highPriorityTasks ?? [],
        });
      } catch (error) {
        console.error("Unable to fetch dashboard data:", error);
        setDashboardError(error.message);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboardData();
  }, []);

  // HR display name
  const displayName =
    hr.name ||
    [hr.firstName, hr.lastName].filter(Boolean).join(" ") ||
    hr.firstName ||
    "HR";

  // Format joining date
  const formatJoiningDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Format monthly salary
  const formatSalary = (salary) => {
    if (salary === undefined || salary === null || salary === "") {
      return "Not available";
    }

    return Number(salary).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  // Dashboard cards
  const dashboardCards = [
    {
      title: "Total Employees",
      value: loadingDashboard ? "..." : dashboardData.totalEmployees,
      description: "Regular employees in the organization",
      icon: Users,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      title: "Present Today",
      value: loadingDashboard ? "..." : dashboardData.presentToday,
      description: "Employees marked present today",
      icon: CalendarCheck,
      iconStyle: "bg-green-50 text-green-600",
    },
    {
      title: "Pending Leaves",
      value: loadingDashboard ? "..." : dashboardData.pendingLeaves,
      description: "Leave requests to review",
      icon: CalendarDays,
      iconStyle: "bg-orange-50 text-orange-600",
    },
    {
      title: "Open Tasks",
      value: loadingDashboard ? "..." : dashboardData.openTasks,
      description: "Tasks not yet completed",
      icon: ClipboardList,
      iconStyle: "bg-purple-50 text-purple-600",
    },
  ];

  // HR Settings page
  const renderSettings = () => {
    const profileFields = [
      { label: "Full Name", value: displayName },
      { label: "Email Address", value: hr.email || "Not available" },
      { label: "Phone Number", value: hr.phone || "Not available" },
      {
        label: "Department",
        value: hr.department || "Human Resources",
      },
      {
        label: "Designation",
        value: hr.designation || hr.position || "HR Manager",
      },
      {
        label: "Joining Date",
        value: formatJoiningDate(hr.joiningDate),
      },
      {
        label: "Monthly Salary",
        value: formatSalary(hr.salary),
      },
      {
        label: "Account Status",
        value: hr.status || "Not available",
      },
    ];

    return (
      <div>
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-800">
            My Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your HR profile details.
          </p>
        </div>

        <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* HR Profile */}
          <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {displayName}
              </h2>

              <p className="text-sm text-slate-500">
                {hr.designation || "HR Manager"}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${hr.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {hr.status || "Status unavailable"}
              </span>
            </div>
          </div>

          {profileLoading && (
            <p className="mb-5 text-sm text-blue-600">
              Loading your profile...
            </p>
          )}

          {profileError && (
            <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {profileError}
            </div>
          )}

          {/* HR Details */}
          <div>
            <h3 className="mb-5 font-semibold text-slate-800">
              Personal & Employment Details
            </h3>

            <div className="grid gap-5 sm:grid-cols-2">
              {profileFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-lg bg-slate-50 p-4"
                >
                  <p className="text-sm text-slate-500">
                    {field.label}
                  </p>

                  <p className="mt-2 break-words font-medium text-slate-800">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Today's Leave Section
  const renderTodayLeaves = () => {
    if (loadingDashboard) {
      return (
        <p className="py-6 text-center text-sm text-slate-400">
          Loading leave details...
        </p>
      );
    }

    if (dashboardData.todayLeaves.length === 0) {
      return (
        <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
          No employees on leave today.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {dashboardData.todayLeaves.map((leave) => (
          <div
            key={leave._id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">
                {leave.employee
                  ? `${leave.employee.firstName} ${leave.employee.lastName || ""}`
                  : "Employee"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {leave.leaveType}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {leave.startDate
                  ? new Date(leave.startDate).toLocaleDateString()
                  : ""}
                {" - "}
                {leave.endDate
                  ? new Date(leave.endDate).toLocaleDateString()
                  : ""}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
              Approved
            </span>
          </div>
        ))}
      </div>
    );
  };

  // High Priority Tasks Section
  const renderHighPriorityTasks = () => {
    if (loadingDashboard) {
      return (
        <p className="py-6 text-center text-sm text-slate-400">
          Loading task details...
        </p>
      );
    }

    if (dashboardData.highPriorityTasks.length === 0) {
      return (
        <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
          No high priority tasks.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {dashboardData.highPriorityTasks.map((task) => (
          <div
            key={task._id}
            className="rounded-lg border border-slate-100 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">
                  {task.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Assigned to:{" "}
                  {task.assignedTo
                    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName || ""}`
                    : "Employee"}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                High
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Due date:{" "}
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "Not specified"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Status: {task.status}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Render selected page
  const renderPage = () => {
    switch (activePage) {
      case "Employees":
        return <Employees excludeHRAccounts={true} />;

      case "Attendance":
        return <Attendance />;

      case "My Attendance":
        return <HRMyAttendanceActions />;

      case "Leave Management":
        return <Leave />;

      case "Tasks":
        return <Tasks />;

      case "Settings":
        return renderSettings();

      default:
        return (
          <div>
            {/* Dashboard Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-800">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Welcome back, {displayName}. Here's your HR overview.
              </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {item.title}
                      </p>

                      <div className={`rounded-lg p-2 ${item.iconStyle}`}>
                        <Icon size={20} />
                      </div>
                    </div>

                    <h2 className="mt-4 text-3xl font-bold text-slate-800">
                      {item.value}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Dashboard Error */}
            {dashboardError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {dashboardError}
              </div>
            )}

            {/* Today's Leave and High Priority Tasks */}
            <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Today's Leave */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Today's Leave
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Employees on approved leave today
                  </p>
                </div>

                {renderTodayLeaves()}
              </div>

              {/* High Priority Tasks */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-800">
                    High Priority Tasks
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Important tasks that are not completed
                  </p>
                </div>

                {renderHighPriorityTasks()}
              </div>
            </div>

            {/* Welcome Section */}
            <div className="mt-7 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">
                HR Workspace
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage employee information, attendance, leave requests,
                and tasks from your HR workspace.
              </p>

              <button
                onClick={() => setActivePage("Employees")}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                View Employees
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">ZenHR</h1>

            <p className="mt-0.5 text-xs text-slate-400">
              HR Workspace
            </p>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            HR Menu
          </p>

          <nav className="space-y-1.5">
            {hrMenu.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActivePage(item.name);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* HR Profile and Logout */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>

              <p className="text-xs text-slate-500">
                {hr.designation || "HR Manager"}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-h-screen lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {activePage}
              </h2>

              <p className="hidden text-xs text-slate-400 sm:block">
                ZenHR / {activePage}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default HRDashboard;
