
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ClipboardList,
  ListTodo,
  Clock,
  CheckCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const API_URL = "https://zenhr-backend.onrender.com/api/tasks";
const EMPLOYEE_URL = "https://zenhr-backend.onrender.com/api/employees";

const emptyForm = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "Medium",
  status: "To Do",
  dueDate: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

// Get token based on logged-in account
const getAuthHeaders = () => {
  const hrToken = localStorage.getItem("zenhr-hr-token");
  const adminToken = localStorage.getItem("zenhr-token");

  const token = hrToken || adminToken;

  if (!token) {
    console.error("Authentication token not found. Please login again.");
  }

  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [error, setError] = useState("");

  // Fetch tasks and employees
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getAuthHeaders();

      const [taskResponse, employeeResponse] = await Promise.all([
        fetch(API_URL, { headers }),
        fetch(EMPLOYEE_URL, { headers }),
      ]);

      const taskData = await taskResponse.json();
      const employeeData = await employeeResponse.json();

      if (!taskResponse.ok) {
        throw new Error(taskData.message || "Unable to load tasks");
      }

      if (!employeeResponse.ok) {
        throw new Error(employeeData.message || "Unable to load employees");
      }

      setTasks(Array.isArray(taskData) ? taskData : []);

      setEmployees(
        Array.isArray(employeeData)
          ? employeeData
          : employeeData.employees || []
      );
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Add Task modal
  const handleAddTask = () => {
    setEditingTask(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  // Open Edit Task modal
  const handleEditTask = (task) => {
    setEditingTask(task);

    setFormData({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo?._id || "",
      priority: task.priority || "Medium",
      status: task.status || "To Do",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });

    setShowModal(true);
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save Task
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const url = editingTask
        ? `${API_URL}/${editingTask._id}`
        : API_URL;

      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save task");
      }

      setShowModal(false);
      setFormData(emptyForm);
      setEditingTask(null);

      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete task");
      }

      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to delete task");
    }
  };

  // Summary counts
  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "To Do"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  // Search and filter
  const filteredTasks = tasks.filter((task) => {
    const employeeName = task.assignedTo
      ? `${task.assignedTo.firstName || ""} ${task.assignedTo.lastName || ""
      }`
      : "";

    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Priority badge
  const getPriorityStyle = (priority) => {
    if (priority === "High") {
      return "bg-[#fee2e2] text-[#b91c1c] ring-1 ring-inset ring-[#fca5a5] dark:bg-[#7f1d1d] dark:text-[#fecaca] dark:ring-[#b91c1c]";
    }

    if (priority === "Low") {
      return "bg-[#dcfce7] text-[#15803d] ring-1 ring-inset ring-[#86efac] dark:bg-[#14532d] dark:text-[#bbf7d0] dark:ring-[#15803d]";
    }

    return "bg-[#fef3c7] text-[#b45309] ring-1 ring-inset ring-[#fcd34d] dark:bg-[#78350f] dark:text-[#fde68a] dark:ring-[#b45309]";
  };

  const getStatusStyle = (status) => {
    if (status === "Completed") {
      return "bg-[#dcfce7] text-[#15803d] ring-1 ring-inset ring-[#86efac] dark:bg-[#14532d] dark:text-[#bbf7d0] dark:ring-[#15803d]";
    }

    if (status === "In Progress") {
      return "bg-[#dbeafe] text-[#1d4ed8] ring-1 ring-inset ring-[#93c5fd] dark:bg-[#1e3a8a] dark:text-[#bfdbfe] dark:ring-[#1d4ed8]";
    }

    return "bg-[#f3f4f6] text-[#374151] ring-1 ring-inset ring-[#d1d5db] dark:bg-[#334155] dark:text-[#e2e8f0] dark:ring-[#475569]";
  };

  // Initials from employee name
  const getInitials = (employee) => {
    if (!employee) return "?";

    const first = employee.firstName?.trim().charAt(0) || "";
    const last = employee.lastName?.trim().charAt(0) || "";

    return (first + last).toUpperCase() || "?";
  };

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Management
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create, assign, and track employee tasks.
          </p>
        </div>

        <button
          onClick={handleAddTask}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New Task
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Tasks"
          count={totalTasks}
          icon={ClipboardList}
          color="blue"
        />

        <SummaryCard
          title="To Do"
          count={pendingTasks}
          icon={ListTodo}
          color="orange"
        />

        <SummaryCard
          title="In Progress"
          count={inProgressTasks}
          icon={Clock}
          color="purple"
        />

        <SummaryCard
          title="Completed"
          count={completedTasks}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Task Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Search and Filter */}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search tasks or employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="All">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] table-fixed text-left">
            <colgroup>
              <col style={{ width: "30%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>

            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-4 font-semibold">Task</th>
                <th className="px-5 py-4 font-semibold">Assigned To</th>
                <th className="px-5 py-4 font-semibold">Priority</th>
                <th className="px-5 py-4 font-semibold">Due Date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task._id}
                    className="border-t border-[#e5e7eb] transition hover:bg-gray-50 dark:border-[#1e293b] dark:hover:bg-slate-800/60"
                  >
                    {/* Task */}
                    <td className="px-5 py-4 align-middle">
                      <p className="truncate font-semibold text-gray-800 dark:text-white">
                        {task.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {task.description || "No description"}
                      </p>
                    </td>

                    {/* Assigned To */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            minWidth: 36,
                            flexShrink: 0,
                          }}
                          className="flex items-center justify-center rounded-full bg-[#dbeafe] text-xs font-bold leading-none text-[#1d4ed8] ring-1 ring-inset ring-[#bfdbfe] dark:bg-[#1e3a8a] dark:text-[#dbeafe] dark:ring-[#1d4ed8]"
                        >
                          {getInitials(task.assignedTo)}
                        </div>

                        <span className="truncate text-sm font-medium capitalize text-gray-700 dark:text-gray-200">
                          {task.assignedTo
                            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                            : "Unassigned"}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-5 py-4 align-middle text-sm text-gray-600 dark:text-gray-300">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditTask(task)}
                          title="Edit Task"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          title="Delete Task"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingTask ? "Edit Task" : "Create New Task"}
                </h2>

                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Assign and manage employee work.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {/* Title */}
              <div>
                <label className={labelClass}>Task Title</label>

                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter task title"
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter task description"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Employee + Due date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Assign Employee</label>

                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select Employee</option>

                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Due Date</label>

                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Priority + Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Priority</label>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Status</label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingTask
                      ? "Update Task"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, count, icon: Icon, color }) {
  const colorStyles = {
    blue: "bg-[#dbeafe] text-[#2563eb] dark:bg-[#1e3a8a] dark:text-[#93c5fd]",
    orange:
      "bg-[#ffedd5] text-[#ea580c] dark:bg-[#7c2d12] dark:text-[#fdba74]",
    purple:
      "bg-[#f3e8ff] text-[#9333ea] dark:bg-[#581c87] dark:text-[#d8b4fe]",
    green:
      "bg-[#dcfce7] text-[#16a34a] dark:bg-[#14532d] dark:text-[#86efac]",
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>

        <h3 className="mt-2 text-2xl font-bold leading-none text-gray-900 dark:text-white">
          {count}
        </h3>
      </div>

      <div
        style={{ width: 48, height: 48, minWidth: 48, flexShrink: 0 }}
        className={`flex items-center justify-center rounded-xl ${colorStyles[color]}`}
      >
        <Icon size={22} strokeWidth={2.2} />
      </div>
    </div>
  );
}

export default Tasks;
