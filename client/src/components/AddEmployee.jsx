
import { useEffect, useState } from "react";
import {
  UserPlus,
  User,
  Mail,
  Phone,
  BriefcaseBusiness,
  Building2,
  X,
  CalendarDays,
  IndianRupee,
} from "lucide-react";

// Department and designation options
const departmentOptions = {
  Administration: [
    "Admin Manager",
    "Administrative Executive",
    "Office Assistant",
  ],
  Finance: ["Finance Manager", "Accountant", "Finance Executive"],
  Development: [
    "Software Developer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Web Developer",
    "Software Engineer",
    "Team Lead",
  ],
  Marketing: [
    "Marketing Manager",
    "Marketing Executive",
    "Digital Marketing Specialist",
    "Content Writer",
  ],
  Sales: [
    "Sales Manager",
    "Sales Executive",
    "Business Development Executive",
  ],
  Operations: [
    "Operations Manager",
    "Operations Executive",
    "Operations Coordinator",
  ],
  General: ["General Employee", "Assistant", "Executive"],
};

const departments = Object.keys(departmentOptions);

// Convert date to YYYY-MM-DD format for date input
const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Get employee data for Add/Edit form
const getInitialFormData = (employee) => ({
  firstName: employee?.firstName || "",
  lastName: employee?.lastName || "",
  email: employee?.email || "",
  phone: employee?.phone || "",
  department: employee?.department || "",
  designation: employee?.designation || "",
  joiningDate: formatDate(employee?.joiningDate),
  salary: employee?.salary ?? "",
});

function AddEmployee({ onAddEmployee, onCancel, employee }) {
  const [formData, setFormData] = useState(
    getInitialFormData(employee)
  );

  // Update form when switching between Add and Edit
  useEffect(() => {
    setFormData(getInitialFormData(employee));
  }, [employee]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => {
      // When department changes, reset designation
      if (name === "department") {
        return {
          ...prevData,
          department: value,
          designation: "",
        };
      }

      return {
        ...prevData,
        [name]: value,
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onAddEmployee(
      {
        ...formData,
        salary: Number(formData.salary),
        role: "Employee",
      },
      employee?._id
    );
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  const currentDesignations =
    departmentOptions[formData.department] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus size={23} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {employee ? "Edit Employee" : "Add New Employee"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {employee
                  ? "Update employee information"
                  : "Add a new member to your team"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8">

            {/* Personal Information */}
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <User size={17} className="text-blue-600" />

                <h3 className="text-sm font-bold text-slate-800">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* First Name */}
                <div>
                  <label className={labelClass}>
                    First Name *
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className={labelClass}>
                    Last Name *
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>
                    Email Address *
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="employee@company.com"
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <BriefcaseBusiness
                  size={17}
                  className="text-blue-600"
                />

                <h3 className="text-sm font-bold text-slate-800">
                  Work Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Department Dropdown */}
                <div>
                  <label className={labelClass}>
                    Department *
                  </label>

                  <div className="relative">
                    <Building2
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className={`${inputClass} appearance-none pl-10`}
                    >
                      <option value="">
                        Select Department
                      </option>

                      {departments.map((department) => (
                        <option
                          key={department}
                          value={department}
                        >
                          {department}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Designation Dropdown */}
                <div>
                  <label className={labelClass}>
                    Designation *
                  </label>

                  <div className="relative">
                    <BriefcaseBusiness
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      disabled={!formData.department}
                      className={`${inputClass} appearance-none pl-10 disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <option value="">
                        {formData.department
                          ? "Select Designation"
                          : "Select Department First"}
                      </option>

                      {currentDesignations.map((designation) => (
                        <option
                          key={designation}
                          value={designation}
                        >
                          {designation}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Joining Date */}
                <div>
                  <label className={labelClass}>
                    Joining Date *
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Monthly Salary */}
                <div>
                  <label className={labelClass}>
                    Monthly Salary (₹) *
                  </label>

                  <div className="relative">
                    <IndianRupee
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="Enter monthly salary"
                      min="0"
                      step="0.01"
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs text-slate-400">
              * Required fields
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {employee ? "Update Employee" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployee;
