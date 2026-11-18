
import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";

import AdminLogin from "./pages/AdminLogin";
import HRLogin from "./pages/HRLogin";
import HRChangePassword from "./pages/HRChangePassword";

import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeChangePassword from "./pages/EmployeeChangePassword";
import EmployeeDashboard from "./pages/EmployeeDashboard";

import RoleSelection from "./pages/RoleSelection";
import HRDashboard from "./pages/HRDashboard";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import HRManagement from "./pages/HRManagement";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Activities from "./pages/Activities";
import Payslips from "./pages/Payslips";

function App() {
  const currentPath = window.location.pathname;

  const [selectedPage, setSelectedPage] = useState("Dashboard");

  // ========================================
  // ADMIN AUTHENTICATION
  // ========================================
  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem("zenhr-admin");
    const savedToken = localStorage.getItem("zenhr-token");

    if (savedAdmin && savedToken) {
      try {
        return JSON.parse(savedAdmin);
      } catch {
        localStorage.removeItem("zenhr-admin");
        localStorage.removeItem("zenhr-token");
      }
    }

    return null;
  });

  // ========================================
  // HR AUTHENTICATION
  // ========================================
  const [hr, setHr] = useState(() => {
    const savedHR = localStorage.getItem("zenhr-hr");
    const savedHRToken = localStorage.getItem("zenhr-hr-token");

    if (savedHR && savedHRToken) {
      try {
        return JSON.parse(savedHR);
      } catch {
        localStorage.removeItem("zenhr-hr");
        localStorage.removeItem("zenhr-hr-token");
      }
    }

    return null;
  });

  // ========================================
  // THEME SETTINGS
  // ========================================
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("zenhr-theme") || "Light";
  });

  useEffect(() => {
    if (theme === "Dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("zenhr-theme", theme);
  }, [theme]);

  // ========================================
  // HR FIRST-TIME PASSWORD REDIRECT
  // ========================================
  useEffect(() => {
    if (
      currentPath === "/hr-dashboard" &&
      hr &&
      hr.mustChangePassword === true
    ) {
      window.location.replace("/hr-change-password");
    }
  }, [currentPath, hr]);

  // ========================================
  // ADMIN LOGIN
  // ========================================
  const handleAdminLogin = (adminData) => {
    setAdmin(adminData);
    window.location.href = "/dashboard";
  };

  // ========================================
  // ADMIN LOGOUT
  // ========================================
  const handleAdminLogout = () => {
    localStorage.removeItem("zenhr-token");
    localStorage.removeItem("zenhr-admin");

    setAdmin(null);
    setSelectedPage("Dashboard");

    window.location.href = "/";
  };

  // ========================================
  // HR LOGOUT
  // ========================================
  const handleHRLogout = () => {
    localStorage.removeItem("zenhr-hr-token");
    localStorage.removeItem("zenhr-hr");

    setHr(null);

    window.location.href = "/";
  };

  // ========================================
  // ROLE SELECTION
  // ========================================
  if (currentPath === "/") {
    return <RoleSelection />;
  }

  // ========================================
  // ADMIN LOGIN
  // ========================================
  if (currentPath === "/admin-login") {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  // ========================================
  // HR LOGIN
  // ========================================
  if (currentPath === "/hr-login") {
    return <HRLogin />;
  }

  // ========================================
  // HR CHANGE PASSWORD
  // ========================================
  if (currentPath === "/hr-change-password") {
    if (!hr) {
      return <RoleSelection />;
    }

    if (hr.mustChangePassword === false) {
      return <HRDashboard onLogout={handleHRLogout} />;
    }

    return <HRChangePassword />;
  }

  // ========================================
  // HR DASHBOARD
  // ========================================
  if (currentPath === "/hr-dashboard") {
    if (!hr) {
      return <RoleSelection />;
    }

    if (hr.mustChangePassword === true) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">
            Redirecting to password change...
          </p>
        </div>
      );
    }

    return <HRDashboard onLogout={handleHRLogout} />;
  }

  // ========================================
  // EMPLOYEE LOGIN
  // ========================================
  if (currentPath === "/employee-login") {
    return <EmployeeLogin />;
  }

  // ========================================
  // EMPLOYEE CHANGE PASSWORD
  // ========================================
  if (currentPath === "/employee-change-password") {
    const employeeToken = localStorage.getItem(
      "zenhr-employee-token"
    );

    if (!employeeToken) {
      return <EmployeeLogin />;
    }

    return <EmployeeChangePassword />;
  }

  // ========================================
  // EMPLOYEE DASHBOARD
  // ========================================
  if (currentPath === "/employee-dashboard") {
    const employeeToken = localStorage.getItem(
      "zenhr-employee-token"
    );

    const savedEmployee = localStorage.getItem(
      "zenhr-employee"
    );

    if (!employeeToken || !savedEmployee) {
      return <EmployeeLogin />;
    }

    let employee = {};

    try {
      employee = JSON.parse(savedEmployee);
    } catch {
      return <EmployeeLogin />;
    }

    if (employee.mustChangePassword === true) {
      return <EmployeeChangePassword />;
    }

    return <EmployeeDashboard />;
  }

  // ========================================
  // ADMIN DASHBOARD ACCESS PROTECTION
  // ========================================
  if (currentPath === "/dashboard") {
    if (!admin) {
      return <RoleSelection />;
    }
  }

  // ========================================
  // UNKNOWN PATH
  // ========================================
  if (currentPath !== "/dashboard") {
    return <RoleSelection />;
  }

  // ========================================
  // ADMIN DASHBOARD
  // ========================================
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 transition-colors dark:bg-slate-950 dark:text-white">

      <div className="flex min-h-screen">

        <Sidebar
          activePage={selectedPage}
          onPageChange={setSelectedPage}
          theme={theme}
          onLogout={handleAdminLogout}
          admin={admin}
        />

        <main className="ml-64 min-w-0 flex-1 p-4 sm:p-6">

          {selectedPage === "Dashboard" && (
            <Dashboard onPageChange={setSelectedPage} />
          )}

          {selectedPage === "Employees" && <Employees />}

          {selectedPage === "HR Management" && <HRManagement />}

          {selectedPage === "Payslips" && <Payslips />}

          {selectedPage === "Attendance" && <Attendance />}

          {selectedPage === "Leave Management" && <Leave />}

          {selectedPage === "Tasks" && <Tasks />}

          {selectedPage === "Projects" && <Projects />}

          {selectedPage === "Settings" && (
            <Settings
            />
          )}

          {selectedPage === "Clients" && <Clients />}

          {selectedPage === "Leads" && <Leads />}

          {selectedPage === "Deals" && <Deals />}

          {selectedPage === "Activities" && <Activities />}

        </main>
      </div>
    </div>
  );
}

export default App;
