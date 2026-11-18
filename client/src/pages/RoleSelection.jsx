import {
  ShieldCheck,
  Users,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";

const roles = [
  {
    title: "Administrator",
    description:
      "Oversee your organization, manage HR accounts, and control system settings.",
    path: "/admin-login",
    icon: ShieldCheck,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
  },
  {
    title: "HR Manager",
    description:
      "Manage employee information, attendance, leave requests, and HR operations.",
    path: "/hr-login",
    icon: Users,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    title: "Employee",
    description:
      "Access your profile, track attendance, and manage your leave requests.",
    path: "/employee-login",
    icon: BriefcaseBusiness,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
];

const RoleSelection = () => {
  const handleRoleSelect = (path) => {
    window.location.href = path;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-indigo-600" />

            <span className="text-sm font-semibold tracking-wide text-indigo-700">
              ZenHR Workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Welcome to <span className="text-indigo-600">ZenHR</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
            Choose your workspace to securely access the tools and information
            you need.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <button
                key={role.title}
                type="button"
                onClick={() => handleRoleSelect(role.path)}
                className="group flex min-h-[290px] flex-col rounded-2xl border border-slate-200/80 bg-white p-7 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:p-8"
              >
                {/* Icon */}
                <div
                  className={`mb-7 flex h-14 w-14 items-center justify-center rounded-xl ${role.iconBg} ${role.iconColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon size={27} strokeWidth={1.8} />
                </div>

                {/* Content */}
                <h2 className="text-xl font-semibold text-slate-900">
                  {role.title}
                </h2>

                <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                  {role.description}
                </p>

                {/* Action */}
                <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-sm font-semibold text-indigo-600">
                    Continue
                  </span>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-slate-400">
            Secure access to your organization’s workspace
          </p>

          <p className="mt-2 text-xs text-slate-400">
            © 2026 ZenHR. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
