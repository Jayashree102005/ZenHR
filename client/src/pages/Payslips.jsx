import { useEffect, useMemo, useState } from "react";
import {
  ReceiptText,
  Download,
  Search,
  Plus,
  X,
  Users,
  IndianRupee,
  CalendarDays,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
} from "lucide-react";

const API_URL = "https://zenhr-backend.onrender.com/api";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();

const initialForm = {
  employeeId: "",
  employeeModel: "Employee",
  month: new Date().getMonth() + 1,
  year: currentYear,
  allowances: 0,
  bonus: 0,
  deductions: 0,
  paymentDate: new Date().toISOString().split("T")[0],
};

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

function Payslips() {
  const token = localStorage.getItem("zenhr-token");

  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewPayslip, setPreviewPayslip] = useState(null);
  const [deletePayslip, setDeletePayslip] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch Employees and Payslips
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error("Login session missing. Please login again.");
      }

      const [employeeResponse, payslipResponse] = await Promise.all([
        fetch(`${API_URL}/employees`, {
          headers: getHeaders(token),
        }),
        fetch(`${API_URL}/payslips`, {
          headers: getHeaders(token),
        }),
      ]);

      const employeeData = await employeeResponse.json();
      const payslipData = await payslipResponse.json();

      if (!employeeResponse.ok) {
        throw new Error(employeeData.message || "Failed to fetch employees");
      }

      if (!payslipResponse.ok) {
        throw new Error(payslipData.message || "Failed to fetch payslips");
      }

      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      setPayslips(Array.isArray(payslipData) ? payslipData : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Selected person from the form
  const selectedPerson = useMemo(() => {
    return employees.find((person) => {
      const personType = person.role === "HR" ? "HR" : "Employee";

      return (
        person._id === form.employeeId &&
        personType === form.employeeModel
      );
    });
  }, [employees, form.employeeId, form.employeeModel]);

  const basicSalary = Number(selectedPerson?.salary || 0);
  const allowances = Number(form.allowances || 0);
  const bonus = Number(form.bonus || 0);
  const deductions = Number(form.deductions || 0);

  const netSalary = basicSalary + allowances + bonus - deductions;

  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Employee type handler
  const handleEmployeeTypeChange = (e) => {
    setForm((previous) => ({
      ...previous,
      employeeModel: e.target.value,
      employeeId: "",
    }));
  };

  // Generate Payslip
  const handleGeneratePayslip = async (e) => {
    e.preventDefault();

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      if (!form.employeeId) {
        throw new Error("Please select a person");
      }

      if (netSalary < 0) {
        throw new Error("Deductions cannot exceed total earnings");
      }

      const response = await fetch(`${API_URL}/payslips`, {
        method: "POST",
        headers: {
          ...getHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: form.employeeId,
          employeeModel: form.employeeModel,
          month: Number(form.month),
          year: Number(form.year),
          allowances: Number(form.allowances),
          bonus: Number(form.bonus),
          deductions: Number(form.deductions),
          paymentDate: form.paymentDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate payslip");
      }

      setSuccess("Payslip generated successfully!");
      setForm({ ...initialForm });
      setShowForm(false);

      await fetchData();
    } catch (err) {
      setError(err.message || "Error generating payslip");
    } finally {
      setGenerating(false);
    }
  };

  // Fetch PDF blob
  const getPDFBlob = async (payslip) => {
    const response = await fetch(
      `${API_URL}/payslips/${payslip._id}/pdf`,
      {
        headers: getHeaders(token),
      }
    );

    if (!response.ok) {
      let message = "PDF request failed";

      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        // Response was not JSON
      }

      throw new Error(message);
    }

    return response.blob();
  };

  // Download PDF
  const handleDownloadPDF = async (payslip) => {
    try {
      setDownloadingId(payslip._id);
      setError("");

      const blob = await getPDFBlob(payslip);
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Payslip_${payslip.employeeName}_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      setError(err.message || "Error downloading PDF");
    } finally {
      setDownloadingId("");
    }
  };

  // Open PDF preview
  const handlePreview = async (payslip) => {
    try {
      setError("");
      setDownloadingId(payslip._id);

      const blob = await getPDFBlob(payslip);
      const url = window.URL.createObjectURL(blob);

      setPreviewUrl((previousUrl) => {
        if (previousUrl) {
          window.URL.revokeObjectURL(previousUrl);
        }

        return url;
      });

      setPreviewPayslip(payslip);
    } catch (err) {
      setError(err.message || "Unable to open preview");
    } finally {
      setDownloadingId("");
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setPreviewPayslip(null);
  };

  // Delete payslip - Admin API only
  const handleDeletePayslip = async () => {
    if (!deletePayslip) return;

    try {
      setDeletingId(deletePayslip._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/payslips/${deletePayslip._id}`,
        {
          method: "DELETE",
          headers: getHeaders(token),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete payslip");
      }

      setPayslips((previous) =>
        previous.filter((item) => item._id !== deletePayslip._id)
      );

      setSuccess("Payslip deleted successfully.");
      setDeletePayslip(null);
    } catch (err) {
      setError(err.message || "Error deleting payslip");
    } finally {
      setDeletingId("");
    }
  };

  // Search and filters
  const filteredPayslips = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return payslips.filter((payslip) => {
      const matchesSearch =
        payslip.employeeName?.toLowerCase().includes(searchText) ||
        payslip.employeeEmail?.toLowerCase().includes(searchText) ||
        payslip.department?.toLowerCase().includes(searchText) ||
        `${monthNames[payslip.month - 1]} ${payslip.year}`
          .toLowerCase()
          .includes(searchText);

      const matchesMonth =
        monthFilter === "All" || Number(monthFilter) === payslip.month;

      const matchesYear =
        yearFilter === "All" || Number(yearFilter) === payslip.year;

      const matchesType =
        typeFilter === "All" || typeFilter === payslip.employeeModel;

      return matchesSearch && matchesMonth && matchesYear && matchesType;
    });
  }, [payslips, search, monthFilter, yearFilter, typeFilter]);

  const years = useMemo(() => {
    const values = new Set(payslips.map((item) => item.year));
    values.add(currentYear);

    return [...values].sort((a, b) => b - a);
  }, [payslips]);

  const totalNetSalary = payslips.reduce(
    (total, payslip) => total + Number(payslip.netSalary || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payslips
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Generate, manage, preview and download salary payslips.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setForm({ ...initialForm });
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Generate Payslip
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Payslips"
          value={payslips.length}
          icon={<ReceiptText size={22} className="text-blue-600" />}
        />

        <StatCard
          label="Employees & HR"
          value={employees.length}
          icon={<Users size={22} className="text-purple-600" />}
        />

        <StatCard
          label="Total Net Salary"
          value={formatCurrency(totalNetSalary)}
          icon={<IndianRupee size={22} className="text-green-600" />}
        />
      </div>

      {/* Generate Form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Generate New Payslip
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a person and enter salary components.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleGeneratePayslip} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Person Type">
                <select
                  name="employeeModel"
                  value={form.employeeModel}
                  onChange={handleEmployeeTypeChange}
                  className={inputClass}
                >
                  <option value="Employee">Employee</option>
                  <option value="HR">HR</option>
                </select>
              </FormField>

              <FormField label="Select Person">
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Select a person</option>
                  {employees
                    .filter((person) => {
                      const type = person.role === "HR" ? "HR" : "Employee";
                      return type === form.employeeModel && person.status === "Active";
                    })
                    .map((person) => (
                      <option key={person._id} value={person._id}>
                        {person.firstName} {person.lastName} —{" "}
                        {person.designation || person.role}
                      </option>
                    ))}
                </select>
              </FormField>
            </div>

            {selectedPerson && (
              <div className="grid grid-cols-1 gap-4 rounded-lg bg-blue-50 p-4 sm:grid-cols-3 dark:bg-blue-950/40">
                <InfoField
                  label="Name"
                  value={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                />
                <InfoField
                  label="Department"
                  value={selectedPerson.department || "General"}
                />
                <InfoField
                  label="Basic Salary"
                  value={formatCurrency(basicSalary)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <FormField label="Salary Month">
                <select
                  name="month"
                  value={form.month}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Salary Year">
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  min="2000"
                  max="2100"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Payment Date">
                <input
                  type="date"
                  name="paymentDate"
                  value={form.paymentDate}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </FormField>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                Salary Components
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Basic Salary">
                  <input
                    type="number"
                    value={basicSalary}
                    readOnly
                    className={`${inputClass} bg-gray-100 dark:bg-slate-800`}
                  />
                </FormField>

                <FormField label="Allowances">
                  <input
                    type="number"
                    name="allowances"
                    value={form.allowances}
                    onChange={handleChange}
                    min="0"
                    required
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Bonus">
                  <input
                    type="number"
                    name="bonus"
                    value={form.bonus}
                    onChange={handleChange}
                    min="0"
                    required
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Deductions">
                  <input
                    type="number"
                    name="deductions"
                    value={form.deductions}
                    onChange={handleChange}
                    min="0"
                    required
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-300">
                  Calculated Net Salary
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {formatCurrency(netSalary)}
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Basic + Allowances + Bonus − Deductions
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={generating || !selectedPerson || netSalary < 0}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Payslip"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payslip List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-4 border-b border-gray-200 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Generated Payslips
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Preview, download and manage generated salary slips.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search payslips..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className={inputClass}
            >
              <option value="All">All Months</option>
              {monthNames.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className={inputClass}
            >
              <option value="All">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={inputClass}
            >
              <option value="All">All Types</option>
              <option value="Employee">Employee</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Filter size={14} />
            Showing {filteredPayslips.length} of {payslips.length} payslips
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading payslips...
          </div>
        ) : filteredPayslips.length === 0 ? (
          <div className="p-10 text-center">
            <ReceiptText
              size={40}
              className="mx-auto text-gray-300 dark:text-slate-700"
            />
            <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
              No payslips found
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Change your filters or generate a payslip.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Salary Period</th>
                  <th className="px-5 py-4">Net Salary</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredPayslips.map((payslip) => (
                  <tr
                    key={payslip._id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {payslip.employeeName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {payslip.employeeEmail}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {payslip.department}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CalendarDays size={16} className="text-gray-400" />
                        {monthNames[payslip.month - 1]} {payslip.year}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(payslip.netSalary)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${payslip.employeeModel === "HR"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                      >
                        {payslip.employeeModel}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          title="Preview payslip"
                          onClick={() => handlePreview(payslip)}
                          disabled={downloadingId === payslip._id}
                        >
                          <Eye size={16} />
                        </ActionButton>

                        <ActionButton
                          title="Download PDF"
                          onClick={() => handleDownloadPDF(payslip)}
                          disabled={downloadingId === payslip._id}
                        >
                          <Download size={16} />
                        </ActionButton>

                        <ActionButton
                          title="Delete payslip"
                          onClick={() => setDeletePayslip(payslip)}
                          danger
                        >
                          <Trash2 size={16} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewPayslip && previewUrl && (
        <Modal onClose={closePreview}>
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-slate-800 sm:p-5">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Payslip Preview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {previewPayslip.employeeName} —{" "}
                {monthNames[previewPayslip.month - 1]} {previewPayslip.year}
              </p>
            </div>

            <button
              type="button"
              onClick={closePreview}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="h-[70vh] bg-gray-100 dark:bg-slate-950">
            <iframe
              title="Payslip PDF Preview"
              src={previewUrl}
              className="h-full w-full"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-slate-800">
            <button
              type="button"
              onClick={closePreview}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-gray-300"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPDF(previewPayslip)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletePayslip && (
        <Modal onClose={() => setDeletePayslip(null)}>
          <div className="p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-center text-lg font-bold text-gray-900 dark:text-white">
              Delete Payslip?
            </h2>

            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the payslip for{" "}
              <strong>{deletePayslip.employeeName}</strong> —{" "}
              {monthNames[deletePayslip.month - 1]} {deletePayslip.year}?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setDeletePayslip(null)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-gray-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeletePayslip}
                disabled={deletingId === deletePayslip._id}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === deletePayslip._id
                  ? "Deleting..."
                  : "Delete Payslip"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Reusable components
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {icon}
      </div>
      <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </h2>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ActionButton({ title, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${danger
          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
        }`}
    >
      {children}
    </button>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Payslips;