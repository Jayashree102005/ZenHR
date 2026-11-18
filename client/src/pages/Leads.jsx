import { useEffect, useState } from "react";

const API_URL = "https://zenhr-backend.onrender.com/api/leads";

const getAuthHeaders = () => {
  const token = localStorage.getItem("zenhr-token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const emptyForm = {
  leadName: "",
  companyName: "",
  email: "",
  phone: "",
  source: "Other",
  status: "New",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get all leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leads");
      }

      const data = await response.json();
      setLeads(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open Add Lead modal
  const handleAdd = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  // Open Edit Lead modal
  const handleEdit = (lead) => {
    setFormData({
      leadName: lead.leadName || "",
      companyName: lead.companyName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "Other",
      status: lead.status || "New",
      notes: lead.notes || "",
    });

    setEditingId(lead._id);
    setError("");
    setShowModal(true);
  };

  // Add or Update lead
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save lead");
      }

      await fetchLeads();

      setShowModal(false);
      setFormData({ ...emptyForm });
      setEditingId(null);
    } catch (error) {
      setError(error.message);
    }
  };

  // Delete lead
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
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
        throw new Error(data.message || "Failed to delete lead");
      }

      await fetchLeads();
    } catch (error) {
      setError(error.message);
    }
  };

  // Search and filter leads
  const filteredLeads = leads.filter((lead) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      lead.leadName?.toLowerCase().includes(searchText) ||
      lead.companyName?.toLowerCase().includes(searchText) ||
      lead.email?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const newLeads = leads.filter(
    (lead) => lead.status === "New"
  ).length;

  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "Qualified"
  ).length;

  const lostLeads = leads.filter(
    (lead) => lead.status === "Lost"
  ).length;

  return (
    <div className="w-full min-w-0 bg-transparent text-gray-900 dark:text-white">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Manage potential customers and track their progress.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add Lead
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Leads" value={leads.length} />
        <SummaryCard title="New Leads" value={newLeads} />
        <SummaryCard title="Qualified Leads" value={qualifiedLeads} />
        <SummaryCard title="Lost Leads" value={lostLeads} />
      </div>

      {/* Error Message */}
      {error && !showModal && (
        <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search lead, company or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} sm:max-w-48`}
        >
          <option value="All">All Status</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Lost">Lost</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-5 py-4">Lead Name</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-gray-500 dark:text-slate-400"
                  >
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-gray-500 dark:text-slate-400"
                  >
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-5 py-4 font-medium">
                      {lead.leadName}
                    </td>

                    <td className="px-5 py-4">
                      {lead.companyName || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {lead.email || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {lead.phone || "-"}
                    </td>

                    <td className="px-5 py-4">
                      {lead.source}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${lead.status === "Qualified"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : lead.status === "Lost"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : lead.status === "Contacted"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(lead._id)}
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
                {editingId ? "Edit Lead" : "Add New Lead"}
              </h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
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
              {/* Lead Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Lead Name *
                </label>

                <input
                  type="text"
                  name="leadName"
                  value={formData.leadName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Enter lead name"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Company Name
                </label>

                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter company name"
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="lead@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Phone
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Source
                </label>

                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Other">Other</option>
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
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className={inputClass}
                  placeholder="Enter notes about this lead"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingId ? "Update Lead" : "Save Lead"}
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

export default Leads;