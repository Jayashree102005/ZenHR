
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  ListTodo,
  FolderKanban,
  Settings as SettingsIcon,
  LogOut,
  UserRound,
  Handshake,
  UserCog,
  ReceiptText,

} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Employees", icon: Users },
  { name: "HR Management", icon: UserCog },
  { name: "Payslips", icon: ReceiptText },
  { name: "Attendance", icon: CalendarCheck },
  { name: "Leave Management", icon: ClipboardList },
  { name: "Tasks", icon: ListTodo },
  { name: "Projects", icon: FolderKanban },
  { name: "Clients", icon: Users },
  { name: "Leads", icon: UserRound },
  { name: "Deals", icon: Handshake },
  { name: "Activities", icon: CalendarCheck },
  { name: "Settings", icon: SettingsIcon },
];

function Sidebar({ activePage, onPageChange, theme, onLogout, admin }) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white text-gray-800 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-gray-200">
      {/* Logo */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-5 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-blue-600">ZenHR</h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Human Resource Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Main Menu
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onPageChange(item.name)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-gray-200 p-4 dark:border-slate-800">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {(admin?.name || "Admin").charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {admin?.name || "Admin"}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {admin?.role || "Administrator"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-950"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
