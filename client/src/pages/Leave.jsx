import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  Check,
  X,
  Clock,
  Trash2,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/leaves";

function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMonth, setFilterMonth] = useState(
    String(new Date().getMonth())
  );
  const [filterYear, setFilterYear] = useState(
    String(new Date().getFullYear())
  );

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Admin token first; HR token is fallback
  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem("zenhr-token");
    const hrToken = localStorage.getItem("zenhr-hr-token");
    const token = adminToken || hrToken;

    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
  };

  // Fetch leave requests
  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch leave requests.");
      }

      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Leave fetch error:", error);
      alert(error.message || "Unable to fetch leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Month and year options based on available requests
  const years = useMemo(() => {
    const availableYears = leaves
      .filter((leave) => leave.startDate)
      .map((leave) => new Date(leave.startDate).getFullYear());

    availableYears.push(new Date().getFullYear());

    return [...new Set(availableYears)].sort((a, b) => b - a);
  }, [leaves]);

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

  // Selected month leave requests
  const monthLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (!leave.startDate) return false;

      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate || leave.startDate);

      const selectedMonth = Number(filterMonth);
      const selectedYear = Number(filterYear);

      // Request overlaps the selected month
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      return startDate <= monthEnd && endDate >= monthStart;
    });
  }, [leaves, filterMonth, filterYear]);

  // Approve or reject leave
  const updateLeaveStatus = async (id, status) => {
    if (updatingId) return;

    try {
      setUpdatingId(id);

      const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update leave status.");
      }

      const updatedLeave = data.leave;

      if (updatedLeave) {
        setLeaves((previousLeaves) =>
          previousLeaves.map((leave) =>
            leave._id === id ? updatedLeave : leave
          )
        );
      } else {
        await fetchLeaves();
      }
    } catch (error) {
      console.error("Leave status update error:", error);
      alert(error.message || "Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete a leave request
  const deleteLeave = async (leave) => {
    const employeeName = getApplicantName(leave);

    const confirmed = window.confirm(
      `Delete ${employeeName}'s ${leave.leaveType || "leave"} request?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(leave._id);

      const response = await fetch(`${API_URL}/${leave._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete leave request.");
      }

      setLeaves((previousLeaves) =>
        previousLeaves.filter((item) => item._id !== leave._id)
      );
    } catch (error) {
      console.error("Leave delete error:", error);
      alert(error.message || "Unable to delete leave request.");
    } finally {
      setDeletingId(null);
    }
  };

  // Applicant name
  function getApplicantName(leave) {
    const applicant = leave.employee || leave.hr || {};

    const fullName = [
      applicant.firstName,
      applicant.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || applicant.name || "Applicant";
  }

  // Search and status filter
  const filteredLeaves = monthLeaves.filter((leave) => {
    const employeeName = getApplicantName(leave).toLowerCase();
    const email = (leave.employee?.email || leave.hr?.email || "").toLowerCase();
    const leaveType = (leave.leaveType || "").toLowerCase();
    const searchText = search.toLowerCase();

    const matchesSearch =
      employeeName.includes(searchText) ||
      email.includes(searchText) ||
      leaveType.includes(searchText);

    const matchesStatus =
      filterStatus === "All" || leave.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Status badge styles
  const getStatusStyle = (status) => {
    if (status === "Approved") {
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    }

    if (status === "Rejected") {
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    }

    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
  };

  // Format date safely
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-IN");
  };

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Leave Management
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage HR and employee leave requests
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
            <CalendarDays size={20} className="text-indigo-600" />

            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Total Requests: {monthLeaves.length}
            </span>
          </div>
        </div>

        {/* Month and Year Filters */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row dark:bg-slate-900">
          <div className="flex flex-1 items-center gap-2">
            <CalendarDays size={18} className="text-slate-400" />

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pending
            </p>

            <h2 className="mt-2 text-2xl font-bold text-yellow-600">
              {monthLeaves.filter((leave) => leave.status === "Pending").length}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Approved
            </p>

            <h2 className="mt-2 text-2xl font-bold text-green-600">
              {monthLeaves.filter((leave) => leave.status === "Approved").length}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rejected
            </p>

            <h2 className="mt-2 text-2xl font-bold text-red-600">
              {monthLeaves.filter((leave) => leave.status === "Rejected").length}
            </h2>
          </div>
        </div>

        {/* Search and Status Filter */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row dark:bg-slate-900">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search employee or leave type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Leave Requests Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          {loading ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">
              Loading leave requests...
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">
              No leave requests found for {months[Number(filterMonth)]}{" "}
              {filterYear}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Applicant</th>
                    <th className="px-5 py-4">Leave Type</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLeaves.map((leave) => {
                    const applicant = leave.employee || leave.hr || {};
                    const applicantName = getApplicantName(leave);
                    const isUpdating = updatingId === leave._id;
                    const isDeleting = deletingId === leave._id;

                    return (
                      <tr
                        key={leave._id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        {/* Applicant */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800 dark:text-white">
                            {applicantName}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {applicant.email || "Email unavailable"}
                          </p>

                          <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {leave.applicantModel === "HR" ? "HR" : "Employee"}
                          </span>
                        </td>

                        {/* Leave Type */}
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {leave.leaveType}
                        </td>

                        {/* Duration */}
                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          <p>{formatDate(leave.startDate)}</p>

                          <p className="text-xs text-slate-400">
                            to {formatDate(leave.endDate)}
                          </p>
                        </td>

                        {/* Reason */}
                        <td className="max-w-[180px] px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {leave.reason || "—"}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                              leave.status
                            )}`}
                          >
                            {leave.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {leave.status === "Pending" ? (
                              <>
                                <button
                                  disabled={isUpdating || isDeleting}
                                  onClick={() =>
                                    updateLeaveStatus(leave._id, "Approved")
                                  }
                                  className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-900/40 dark:text-green-300"
                                >
                                  <Check size={14} />
                                  {isUpdating ? "Updating..." : "Approve"}
                                </button>

                                <button
                                  disabled={isUpdating || isDeleting}
                                  onClick={() =>
                                    updateLeaveStatus(leave._id, "Rejected")
                                  }
                                  className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/40 dark:text-red-300"
                                >
                                  <X size={14} />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock size={14} />
                                Processed
                              </span>
                            )}

                            <button
                              disabled={isUpdating || isDeleting}
                              onClick={() => deleteLeave(leave)}
                              title="Delete leave request"
                              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-900/40 dark:hover:text-red-300"
                            >
                              <Trash2 size={14} />
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leave;
