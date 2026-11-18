import { useEffect, useState } from "react";
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Users,
  UserMinus,
} from "lucide-react";

import AddEmployee from "../components/AddEmployee";

const API_URL = "https://zenhr-backend.onrender.com/api";

function Employees({ excludeHRAccounts = false }) {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900";

  // Get the correct token based on the logged-in user
  function getAuthHeaders() {
    const tokenKey = excludeHRAccounts
      ? "zenhr-hr-token"
      : "zenhr-token";

    const token = localStorage.getItem(tokenKey);

    if (!token || token === "undefined" || token === "null") {
      console.error(`Token missing from localStorage: ${tokenKey}`);
      return {};
    }

    return {
      Authorization: `Bearer ${token.trim()}`,
    };
  }

  // Fetch Employees from backend
  async function fetchEmployees() {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch employees");
      }

      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      alert(error.message);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  // HR login sees regular employees only
  // Admin can see regular employees and HR accounts
  const visibleEmployees = excludeHRAccounts
    ? employees.filter((employee) => {
      const role = employee.role?.toLowerCase();

      return role !== "hr" && role !== "admin";
    })
    : employees;

  // Add or update normal Employee
  async function handleAddEmployee(formData, employeeId) {
    try {
      const url = employeeId
        ? `${API_URL}/employees/${employeeId}`
        : `${API_URL}/employees`;

      const response = await fetch(url, {
        method: employeeId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...formData,
          role: "Employee",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save employee");
      }

      const savedEmployee = data.employee || data;

      if (employeeId) {
        setEmployees((previousEmployees) =>
          previousEmployees.map((employee) =>
            employee._id === employeeId ? savedEmployee : employee
          )
        );

        alert(data.message || "Employee updated successfully!");
      } else {
        setEmployees((previousEmployees) => [
          ...previousEmployees,
          savedEmployee,
        ]);

        alert(
          data.message ||
          "Employee created successfully. Login credentials sent to email."
        );
      }

      closeEmployeeForm();
    } catch (error) {
      console.error("Error saving employee:", error);
      alert(error.message);
    }
  }

  // Deactivate Employee
  async function handleDeleteEmployee(employeeId) {
    const employee = employees.find((item) => item._id === employeeId);

    const role = employee?.role?.toLowerCase();

    if (role === "hr" || role === "admin") {
      alert("HR and Admin accounts cannot be deactivated from this page.");
      return;
    }

    const confirmDeactivate = window.confirm(
      "Are you sure you want to deactivate this employee? Their attendance, leave, and task records will be preserved."
    );

    if (!confirmDeactivate) return;

    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to deactivate employee");
      }

      setEmployees((previousEmployees) =>
        previousEmployees.filter((employee) => employee._id !== employeeId)
      );

      alert(data.message || "Employee deactivated successfully!");
    } catch (error) {
      console.error("Error deactivating employee:", error);
      alert(error.message);
    }
  }

  // Permanently Delete Employee
  async function handlePermanentDeleteEmployee(employeeId) {
    const employee = employees.find((item) => item._id === employeeId);

    const role = employee?.role?.toLowerCase();

    if (role === "hr" || role === "admin") {
      alert(
        "HR and Admin accounts cannot be permanently deleted from this page."
      );
      return;
    }

    const confirmPermanentDelete = window.confirm(
      `WARNING: Permanently delete ${employee?.firstName || "this employee"
      }? This will also delete their related attendance, leave, and task records. This action cannot be undone.`
    );

    if (!confirmPermanentDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/employees/${employeeId}/permanent`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to permanently delete employee"
        );
      }

      setEmployees((previousEmployees) =>
        previousEmployees.filter((employee) => employee._id !== employeeId)
      );

      alert(data.message || "Employee permanently deleted successfully!");
    } catch (error) {
      console.error("Error permanently deleting employee:", error);
      alert(error.message);
    }
  }

  // Open Add Employee form
  function openAddEmployeeForm() {
    setSelectedEmployee(null);
    setShowAddEmployee(true);
  }

  // Open Edit Employee form
  function openEditEmployeeForm(employee) {
    const role = employee.role?.toLowerCase();

    if (role === "hr" || role === "admin") {
      alert("HR and Admin accounts cannot be edited from this page.");
      return;
    }

    setSelectedEmployee(employee);
    setShowAddEmployee(true);
  }

  // Close Add / Edit form
  function closeEmployeeForm() {
    setShowAddEmployee(false);
    setSelectedEmployee(null);
  }

  // Get Employee initials
  function getInitials(employee) {
    return `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""
      }`.toUpperCase();
  }

  // Status badge style
  function getStatusStyle(status) {
    if (status === "Active") {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    }

    if (status === "On Leave") {
      return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    }

    if (status === "Inactive") {
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
    }

    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }

  // Role badge style
  function getRoleStyle(role) {
    if (role?.toLowerCase() === "hr") {
      return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
    }

    return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  }

  // Search by name, email, department, or role
  const filteredEmployees = visibleEmployees.filter((employee) => {
    const search = searchTerm.toLowerCase();

    const fullName =
      `${employee.firstName || ""} ${employee.lastName || ""}`.toLowerCase();

    return (
      fullName.includes(search) ||
      employee.email?.toLowerCase().includes(search) ||
      employee.department?.toLowerCase().includes(search) ||
      employee.role?.toLowerCase().includes(search)
    );
  });

  // Summary values use visible employees
  const totalEmployees = visibleEmployees.length;

  const activeEmployees = visibleEmployees.filter(
    (employee) => employee.status === "Active"
  ).length;

  const totalHR = visibleEmployees.filter(
    (employee) => employee.role?.toLowerCase() === "hr"
  ).length;

  const totalRegularEmployees = visibleEmployees.filter(
    (employee) => employee.role?.toLowerCase() !== "hr"
  ).length;

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium tracking-wider text-blue-600">
            PEOPLE MANAGEMENT
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-3xl">
            Employees
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {excludeHRAccounts
              ? "View and manage employee information."
              : "Manage your team, HR, and employee information."}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddEmployeeForm}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Add Employee
        </button>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Employees */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Employees
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                {totalEmployees}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {excludeHRAccounts
                  ? "Regular employees only"
                  : "Includes HR accounts"}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Active Employees */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Active Employees
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                {activeEmployees}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Active {excludeHRAccounts ? "employees" : "HR and employees"}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* HR Accounts - Admin only */}
        {!excludeHRAccounts && (
          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  HR Accounts
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                  {totalHR}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {totalRegularEmployees} regular employees
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Users size={22} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Employee Table */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white">
              {excludeHRAccounts ? "Employee Directory" : "All Employees"}
            </h2>

            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              {excludeHRAccounts
                ? "Regular employee directory"
                : "HR and employee directory"}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, role..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="px-5 py-4 font-semibold">Employee</th>
                <th className="px-5 py-4 font-semibold">Department</th>
                <th className="px-5 py-4 font-semibold">Designation</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((employee) => {
                const isHR = employee.role?.toLowerCase() === "hr";

                return (
                  <tr
                    key={employee._id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    {/* Employee Details */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${isHR
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                        >
                          {getInitials(employee)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {employee.firstName} {employee.lastName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            {employee.email || "No email provided"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {employee.department || "-"}
                    </td>

                    {/* Designation */}
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {employee.designation || (isHR ? "HR Manager" : "-")}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getRoleStyle(
                          employee.role || "Employee"
                        )}`}
                      >
                        {employee.role || "Employee"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          employee.status
                        )}`}
                      >
                        {employee.status || "Unknown"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      {isHR ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Manage in HR Management
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditEmployeeForm(employee)}
                            title="Edit employee"
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:hover:border-blue-900 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                          >
                            <Pencil size={15} />
                          </button>

                          {/* Deactivate */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(employee._id)}
                            title="Deactivate employee"
                            className="rounded-lg border border-amber-200 p-2 text-amber-600 transition hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950"
                          >
                            <UserMinus size={15} />
                          </button>

                          {/* Permanent Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              handlePermanentDeleteEmployee(employee._id)
                            }
                            title="Permanently delete employee"
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Employee Form */}
      {showAddEmployee && (
        <AddEmployee
          employee={selectedEmployee}
          onAddEmployee={handleAddEmployee}
          onCancel={closeEmployeeForm}
        />
      )}
    </div>
  );
}

export default Employees;
