import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/deals";

const getAuthHeaders = () => {
  const token = localStorage.getItem("zenhr-token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const emptyForm = {
  dealName: "",
  companyName: "",
  value: "",
  stage: "Qualification",
  expectedCloseDate: "",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all deals
  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch deals");
      }

      const data = await response.json();
      setDeals(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open Add Deal modal
  const handleAdd = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  // Open Edit Deal modal
  const handleEdit = (deal) => {
    setFormData({
      dealName: deal.dealName || "",
      companyName: deal.companyName || "",
      value: deal.value ?? "",
      stage: deal.stage || "Qualification",
      expectedCloseDate: deal.expectedCloseDate
        ? deal.expectedCloseDate.slice(0, 10)
        : "",
      notes: deal.notes || "",
    });

    setEditingId(deal._id);
    setError("");
    setShowModal(true);
  };

  // Add or Update Deal
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
        value: Number(formData.value) || 0,
        expectedCloseDate: formData.expectedCloseDate || null,
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save deal");
      }

      await fetchDeals();

      setShowModal(false);
      setFormData({ ...emptyForm });
      setEditingId(null);
    } catch (error) {
      setError(error.message);
    }
  };

  // Delete Deal
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this deal?"
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
        throw new Error(data.message || "Failed to delete deal");
      }

      await fetchDeals();
    } catch (error) {
      setError(error.message);
    }
  };

  // Search and Filter
  const filteredDeals = deals.filter((deal) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      deal.dealName?.toLowerCase().includes(searchText) ||
      deal.companyName?.toLowerCase().includes(searchText);

    const matchesStage =
      stageFilter === "All" || deal.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  const totalValue = deals.reduce(
    (total, deal) => total + (Number(deal.value) || 0),
    0
  );

  const wonDeals = deals.filter(
    (deal) => deal.stage === "Won"
  );

  const lostDeals = deals.filter(
    (deal) => deal.stage === "Lost"
  );

  const wonValue = wonDeals.reduce(
    (total, deal) => total + (Number(deal.value) || 0),
    0
  );

  return (
    <div className="w-full min-w-0 bg-transparent text-gray-900 dark:text-white">

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Track business opportunities and sales pipeline.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add Deal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Deals"
          value={deals.length}
        />

        <SummaryCard
          title="Pipeline Value"
          value={`₹${totalValue.toLocaleString("en-IN")}`}
        />

        <SummaryCard
          title="Won Deals"
          value={wonDeals.length}
          subtitle={`₹${wonValue.toLocaleString("en-IN")} value`}
        />

        <SummaryCard
          title="Lost Deals"
          value={lostDeals.length}
        />
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
          placeholder="Search deal or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className={`${inputClass} sm:max-w-56`}
        >
          <option value="All">All Stages</option>
          <option value="Qualification">Qualification</option>
          <option value="Proposal">Proposal</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>
      </div>

      {/* Deals Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-5 py-4">Deal Name</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Deal Value</th>
                <th className="px-5 py-4">Stage</th>
                <th className="px-5 py-4">Expected Close</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-gray-500 dark:text-slate-400"
                  >
                    Loading deals...
                  </td>
                </tr>
              ) : filteredDeals.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-gray-500 dark:text-slate-400"
                  >
                    No deals found.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr
                    key={deal._id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-5 py-4 font-medium">
                      {deal.dealName}
                    </td>

                    <td className="px-5 py-4">
                      {deal.companyName || "-"}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      ₹{(Number(deal.value) || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <StageBadge stage={deal.stage} />
                    </td>

                    <td className="px-5 py-4">
                      {deal.expectedCloseDate
                        ? new Date(deal.expectedCloseDate).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(deal._id)}
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
                {editingId ? "Edit Deal" : "Add New Deal"}
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

              {/* Deal Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Deal Name *
                </label>

                <input
                  type="text"
                  name="dealName"
                  value={formData.dealName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Enter deal name"
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

              {/* Deal Value */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Deal Value (₹) *
                </label>

                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  min="0"
                  required
                  className={inputClass}
                  placeholder="Enter deal amount"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Pipeline Stage
                </label>

                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Qualification">Qualification</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Expected Close Date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Expected Close Date
                </label>

                <input
                  type="date"
                  name="expectedCloseDate"
                  value={formData.expectedCloseDate}
                  onChange={handleChange}
                  className={inputClass}
                />
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
                  placeholder="Enter deal notes"
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
                  {editingId ? "Update Deal" : "Save Deal"}
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
function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-gray-500 dark:text-slate-400">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-bold">
        {value}
      </h3>

      {subtitle && (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Pipeline Stage Badge
function StageBadge({ stage }) {
  const stageClass = {
    Qualification:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    Proposal:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Negotiation:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Won:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Lost:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        stageClass[stage] || "bg-gray-100 text-gray-600"
      }`}
    >
      {stage}
    </span>
  );
}

export default Deals;