import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    FolderKanban,
    CalendarDays,
    CheckCircle,
    Clock,
    Pencil,
    Trash2,
    X,
} from "lucide-react";

const API_URL = "https://zenhr-backend.onrender.com/api/projects";
const EMPLOYEE_URL = "https://zenhr-backend.onrender.com/api/employees";

const emptyForm = {
    name: "",
    description: "",
    clientName: "",
    teamMembers: [],
    startDate: "",
    dueDate: "",
    priority: "Medium",
    status: "Planning",
    createdBy: "Admin",
};

const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]";

const labelClass =
    "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

// Get JWT token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem("zenhr-token");

    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};

function Projects() {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [error, setError] = useState("");

    const [deleteProject, setDeleteProject] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch projects and employees
    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [projectResponse, employeeResponse] = await Promise.all([
                fetch(API_URL, {
                    headers: getAuthHeaders(),
                }),
                fetch(EMPLOYEE_URL, {
                    headers: getAuthHeaders(),
                }),
            ]);

            const projectData = await projectResponse.json();
            const employeeData = await employeeResponse.json();

            if (!projectResponse.ok || !employeeResponse.ok) {
                throw new Error("Unable to load projects or employees.");
            }

            setProjects(Array.isArray(projectData) ? projectData : []);

            setEmployees(
                Array.isArray(employeeData)
                    ? employeeData
                    : employeeData.employees || []
            );
        } catch (err) {
            setError(err.message || "Failed to load projects.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Open Add Project modal
    const handleAddProject = () => {
        setEditingProject(null);
        setFormData({ ...emptyForm });
        setError("");
        setShowModal(true);
    };

    // Open Edit Project modal
    const handleEditProject = (project) => {
        setEditingProject(project);

        setFormData({
            name: project.name || "",
            description: project.description || "",
            clientName: project.clientName || "",
            teamMembers: (project.teamMembers || [])
                .map((member) =>
                    typeof member === "string" ? member : member?._id
                )
                .filter(Boolean),
            startDate: project.startDate ? project.startDate.slice(0, 10) : "",
            dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
            priority: project.priority || "Medium",
            status: project.status || "Planning",
            createdBy: project.createdBy || "Admin",
        });

        setError("");
        setShowModal(true);
    };

    // Handle form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle multiple team member selection
    const handleTeamMembers = (employeeId) => {
        setFormData((prev) => ({
            ...prev,
            teamMembers: prev.teamMembers.includes(employeeId)
                ? prev.teamMembers.filter((id) => id !== employeeId)
                : [...prev.teamMembers, employeeId],
        }));
    };

    // Create or update project
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.startDate && formData.dueDate < formData.startDate) {
            setError("Due date must be after the start date.");
            return;
        }

        try {
            setSaving(true);

            const isEditing = Boolean(editingProject);

            const response = await fetch(
                isEditing ? `${API_URL}/${editingProject._id}` : API_URL,
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save project.");
            }

            setShowModal(false);
            setEditingProject(null);
            setFormData({ ...emptyForm });

            await fetchData();
        } catch (err) {
            setError(err.message || "Failed to save project.");
        } finally {
            setSaving(false);
        }
    };

    // Delete project
    const handleDeleteProject = async () => {
        if (!deleteProject) return;

        try {
            setDeleting(true);

            const response = await fetch(`${API_URL}/${deleteProject._id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete project.");
            }

            setDeleteProject(null);
            await fetchData();
        } catch (err) {
            setError(err.message || "Failed to delete project.");
        } finally {
            setDeleting(false);
        }
    };

    // Search and filter
    const filteredProjects = projects.filter((project) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            (project.name || "").toLowerCase().includes(search) ||
            (project.clientName || "").toLowerCase().includes(search);

        const matchesStatus =
            statusFilter === "All" || project.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Priority badge styles
    const getPriorityStyle = (priority) => {
        if (priority === "High") {
            return "bg-[#fee2e2] text-[#b91c1c] ring-1 ring-inset ring-[#fca5a5] dark:bg-[#7f1d1d] dark:text-[#fecaca] dark:ring-[#b91c1c]";
        }

        if (priority === "Low") {
            return "bg-[#dcfce7] text-[#15803d] ring-1 ring-inset ring-[#86efac] dark:bg-[#14532d] dark:text-[#bbf7d0] dark:ring-[#15803d]";
        }

        return "bg-[#fef3c7] text-[#b45309] ring-1 ring-inset ring-[#fcd34d] dark:bg-[#78350f] dark:text-[#fde68a] dark:ring-[#b45309]";
    };

    // Status badge styles
    const getStatusStyle = (status) => {
        if (status === "Completed") {
            return "bg-[#dcfce7] text-[#15803d] ring-1 ring-inset ring-[#86efac] dark:bg-[#14532d] dark:text-[#bbf7d0] dark:ring-[#15803d]";
        }

        if (status === "In Progress") {
            return "bg-[#dbeafe] text-[#1d4ed8] ring-1 ring-inset ring-[#93c5fd] dark:bg-[#1e3a8a] dark:text-[#bfdbfe] dark:ring-[#1d4ed8]";
        }

        if (status === "On Hold") {
            return "bg-[#f3f4f6] text-[#374151] ring-1 ring-inset ring-[#d1d5db] dark:bg-[#334155] dark:text-[#e2e8f0] dark:ring-[#475569]";
        }

        return "bg-[#f3e8ff] text-[#7e22ce] ring-1 ring-inset ring-[#d8b4fe] dark:bg-[#581c87] dark:text-[#e9d5ff] dark:ring-[#9333ea]";
    };

    const totalProjects = projects.length;

    const inProgressProjects = projects.filter(
        (project) => project.status === "In Progress"
    ).length;

    const completedProjects = projects.filter(
        (project) => project.status === "Completed"
    ).length;

    const planningProjects = projects.filter(
        (project) => project.status === "Planning"
    ).length;

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Project Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage projects, clients, timelines, and team assignments.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAddProject}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Add New Project
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
                    title="Total Projects"
                    count={totalProjects}
                    icon={FolderKanban}
                    color="blue"
                />

                <SummaryCard
                    title="Planning"
                    count={planningProjects}
                    icon={CalendarDays}
                    color="purple"
                />

                <SummaryCard
                    title="In Progress"
                    count={inProgressProjects}
                    icon={Clock}
                    color="orange"
                />

                <SummaryCard
                    title="Completed"
                    count={completedProjects}
                    icon={CheckCircle}
                    color="green"
                />
            </div>

            {/* Projects Table */}
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
                            placeholder="Search projects or clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={inputClass + " sm:w-auto"}
                    >
                        <option value="All">All Status</option>
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] table-fixed text-left">
                        <colgroup>
                            <col style={{ width: "25%" }} />
                            <col style={{ width: "13%" }} />
                            <col style={{ width: "17%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "14%" }} />
                            <col style={{ width: "9%" }} />
                            <col style={{ width: "10%" }} />
                        </colgroup>

                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Project</th>
                                <th className="px-5 py-4 font-semibold">Client</th>
                                <th className="px-5 py-4 font-semibold">Timeline</th>
                                <th className="px-5 py-4 font-semibold">Priority</th>
                                <th className="px-5 py-4 font-semibold">Status</th>
                                <th className="px-5 py-4 font-semibold">Team</th>
                                <th className="px-5 py-4 text-center font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        Loading projects...
                                    </td>
                                </tr>
                            ) : filteredProjects.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        No projects found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((project) => (
                                    <tr
                                        key={project._id}
                                        className="border-t border-gray-100 transition hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                                    >
                                        {/* Project */}
                                        <td className="px-5 py-4 align-middle">
                                            <p className="truncate font-semibold text-gray-800 dark:text-white">
                                                {project.name}
                                            </p>

                                            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                                {project.description || "No description"}
                                            </p>
                                        </td>

                                        {/* Client */}
                                        <td className="px-5 py-4 align-middle">
                                            <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                                {project.clientName || "—"}
                                            </span>
                                        </td>

                                        {/* Timeline */}
                                        <td className="px-5 py-4 align-middle text-sm text-gray-600 dark:text-gray-300">
                                            <p>
                                                {project.startDate
                                                    ? new Date(project.startDate).toLocaleDateString()
                                                    : "—"}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Due:{" "}
                                                {project.dueDate
                                                    ? new Date(project.dueDate).toLocaleDateString()
                                                    : "—"}
                                            </p>
                                        </td>

                                        {/* Priority */}
                                        <td className="px-5 py-4 align-middle">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                                                    project.priority
                                                )}`}
                                            >
                                                {project.priority}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4 align-middle">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                                    project.status
                                                )}`}
                                            >
                                                {project.status}
                                            </span>
                                        </td>

                                        {/* Team */}
                                        <td className="px-5 py-4 align-middle text-sm text-gray-600 dark:text-gray-300">
                                            {project.teamMembers?.length || 0} members
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditProject(project)}
                                                    title="Edit Project"
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteProject(project)}
                                                    title="Delete Project"
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

            {/* Add / Edit Project Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingProject ? "Edit Project" : "Create New Project"}
                                </h2>

                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                    Enter project details and assign your team.
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

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 p-5">
                            {/* Project Name + Client */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Project Name</label>

                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter project name"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Client Name</label>

                                    <input
                                        name="clientName"
                                        value={formData.clientName}
                                        onChange={handleChange}
                                        placeholder="Enter client name"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className={labelClass}>Description</label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter project description"
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Start Date</label>

                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Due Date</label>

                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        min={formData.startDate}
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
                                        <option value="Planning">Planning</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                    </select>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div>
                                <label className={labelClass}>
                                    Assign Team Members
                                </label>

                                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                                    {employees.length > 0 ? (
                                        employees.map((employee) => {
                                            const employeeId = employee._id;

                                            return (
                                                <label
                                                    key={employeeId}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-blue-50 dark:hover:bg-slate-700"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.teamMembers.includes(employeeId)}
                                                        onChange={() => handleTeamMembers(employeeId)}
                                                        className="h-4 w-4 cursor-pointer accent-blue-600"
                                                    />

                                                    <span className="text-sm text-gray-700 dark:text-gray-200">
                                                        {employee.firstName} {employee.lastName}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                            No employees available.
                                        </p>
                                    )}
                                </div>

                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {formData.teamMembers.length} team member(s) selected
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                    {error}
                                </div>
                            )}

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
                                        : editingProject
                                            ? "Update Project"
                                            : "Create Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50">
                                <Trash2 size={20} />
                            </div>

                            <button
                                type="button"
                                onClick={() => setDeleteProject(null)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Delete Project?
                        </h2>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-gray-800 dark:text-white">
                                {deleteProject.name}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteProject(null)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteProject}
                                disabled={deleting}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting ? "Deleting..." : "Delete Project"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Summary Card
function SummaryCard({ title, count, icon: Icon, color }) {
    const colorStyles = {
        blue: "bg-[#dbeafe] text-[#2563eb] dark:bg-[#1e3a8a] dark:text-[#93c5fd]",
        orange:
            "bg-[#ffedd5] text-[#ea580c] dark:bg-[#7c2d12] dark:text-[#fdba74]",
        purple:
            "bg-[#f3e8ff] text-[#9333ea] dark:bg-[#581c87] dark:text-[#d8b4fe]",
        green: "bg-[#dcfce7] text-[#16a34a] dark:bg-[#14532d] dark:text-[#86efac]",
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

export default Projects;
