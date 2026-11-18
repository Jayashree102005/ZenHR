import { useEffect, useState } from "react";

const API_URL = "https://zenhr-backend.onrender.com/api/activities";
const LEADS_URL = "https://zenhr-backend.onrender.com/api/leads";
const DEALS_URL = "https://zenhr-backend.onrender.com/api/deals";

const getAuthHeaders = () => {
  const token = localStorage.getItem("zenhr-token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const emptyForm = {
  title: "",
  type: "Call",
  date: "",
  status: "Pending",
  description: "",
  lead: "",
  deal: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function getLeadName(lead) {
  if (!lead) return "-";
  if (typeof lead === "string") return lead;

  return (
    lead.companyName ||
    lead.name ||
    `${lead.firstName || ""} ${lead.lastName || ""}`.trim() ||
    lead.email ||
    "-"
  );
}

function Activities() {
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);

  const [formData, setFormData] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Leads and Deals for dropdowns
  const fetchRelatedData = async () => {
    try {
      const [leadsResponse, dealsResponse] = await Promise.all([
        fetch(LEADS_URL, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
        fetch(DEALS_URL, {
          method: "GET",
          headers: getAuthHeaders(),
        }),
      ]);

      if (!leadsResponse.ok || !dealsResponse.ok) {
        throw new Error("Failed to fetch Leads or Deals");
      }

      const leadsData = await leadsResponse.json();
      const dealsData = await dealsResponse.json();

      setLeads(leadsData);
      setDeals(dealsData);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchRelatedData();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open Add modal
  const handleAdd = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  // Open Edit modal
  const handleEdit = (activity) => {
    setFormData({
      title: activity.title || "",
      type: activity.type || "Call",
      date: activity.date ? activity.date.slice(0, 10) : "",
      status: activity.status || "Pending",
      description: activity.description || "",
      lead: activity.lead?._id || activity.lead || "",
      deal: activity.deal?._id || activity.deal || "",
    });

    setEditingId(activity._id);
    setError("");
    setShowModal(true);
  };

  // Add or Update Activity
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        date: formData.date || null,
        lead: formData.lead || null,
        deal: formData.deal || null,
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save activity");
      }

      await fetchActivities();

      setShowModal(false);
      setFormData({ ...emptyForm });
      setEditingId(null);
    } catch (error) {
      setError(error.message);
    }
  };

  // Delete Activity
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this activity?"
    );

    if (!confirmDelete) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete activity");
      }

      await fetchActivities();
    } catch (error) {
      setError(error.message);
    }
  };

  // Search and Filter
  const filteredActivities = activities.filter((activity) => {
    const searchText = search.toLowerCase();

    const leadName = getLeadName(activity.lead).toLowerCase();
    const dealName = activity.deal?.dealName?.toLowerCase() || "";

    const matchesSearch =
      activity.title?.toLowerCase().includes(searchText) ||
      activity.description?.toLowerCase().includes(searchText) ||
      leadName.includes(searchText) ||
      dealName.includes(searchText);

    const matchesType =
      typeFilter === "All" || activity.type === typeFilter;

    const matchesStatus =
      statusFilter === "All" || activity.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Summary data
  const pendingActivities = activities.filter(
    (activity) => activity.status === "Pending"
  );

  const completedActivities = activities.filter(
    (activity) => activity.status === "Completed"
  );

  const callActivities = activities.filter(
    (activity) => activity.type === "Call"
  );

  const meetingActivities = activities.filter(
    (activity) => activity.type === "Meeting"
  );

  return (
    <div className="w-full min-w-0 bg-transparent text-gray-900 dark:text-white">

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Manage calls, emails, meetings, and follow-up tasks.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add Activity
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Activities"
          value={activities.length}
        />

        <SummaryCard
          title="Pending Activities"
          value={pendingActivities.length}
        />

        <SummaryCard
          title="Completed Activities"
          value={completedActivities.length}
        />

        <SummaryCard
          title="Calls / Meetings"
          value={`${callActivities.length} / ${meetingActivities.length}`}
        />
      </div>

      {/* Error Message */}
      {error && !showModal && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search activity, Lead, or Deal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`${inputClass} sm:max-w-52`}
        >
          <option value="All">All Types</option>
          <option value="Call">Call</option>
          <option value="Email">Email</option>
          <option value="Meeting">Meeting</option>
          <option value="Task">Task</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} sm:max-w-52`}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Activities Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-5 py-4">Activity Title</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Related Lead</th>
                <th className="px-5 py-4">Related Deal</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-gray-500 dark:text-slate-400"
                  >
                    Loading activities...
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-gray-500 dark:text-slate-400"
                  >
                    No activities found.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr
                    key={activity._id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-5 py-4 font-medium">
                      {activity.title}
                    </td>

                    <td className="px-5 py-4">
                      <TypeBadge type={activity.type} />
                    </td>

                    <td className="px-5 py-4">
                      {getLeadName(activity.lead)}
                    </td>

                    <td className="px-5 py-4">
                      {activity.deal?.dealName || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {activity.date
                        ? new Date(activity.date).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={activity.status} />
                    </td>

                    <td className="max-w-xs truncate px-5 py-4">
                      {activity.description || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleEdit(activity)}
                          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(activity._id)}
                          className="font-medium text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Delete
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">

            {/* Modal Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Activity" : "Add New Activity"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="text-2xl text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Modal Error */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Activity Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Activity Title *
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Enter activity title"
                />
              </div>

              {/* Activity Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Activity Type *
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Task">Task</option>
                </select>
              </div>

              {/* Activity Date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Activity Date *
                </label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Related Lead */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Related Lead
                </label>

                <select
                  name="lead"
                  value={formData.lead}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">No Lead Selected</option>

                  {leads.map((lead) => (
                    <option key={lead._id} value={lead._id}>
                      {getLeadName(lead)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Related Deal */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Related Deal
                </label>

                <select
                  name="deal"
                  value={formData.deal}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">No Deal Selected</option>

                  {deals.map((deal) => (
                    <option key={deal._id} value={deal._id}>
                      {deal.dealName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={inputClass}
                  placeholder="Enter activity details"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingId ? "Update Activity" : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Card
function SummaryCard({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-gray-500 dark:text-slate-400">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-bold">
        {value}
      </h3>
    </div>
  );
}

// Activity Type Badge
function TypeBadge({ type }) {
  const typeClass = {
    Call:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Email:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Meeting:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Task:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${typeClass[type] || "bg-gray-100 text-gray-600"
        }`}
    >
      {type}
    </span>
  );
}

// Activity Status Badge
function StatusBadge({ status }) {
  const statusClass = {
    Pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    Completed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[status] || "bg-gray-100 text-gray-600"
        }`}
    >
      {status}
    </span>
  );
}

export default Activities;