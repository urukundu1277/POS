import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  SquareMenu,
  ShoppingCart,
  FileText,
  Building,
  LogOut,
  Menu,
  ChevronRight,
  BarChart3,
  CreditCard,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/categories", label: "Categories", icon: SquareMenu },
  { path: "/menu", label: "Menu Management", icon: ShoppingCart },
  { path: "/sales", label: "Sales History", icon: FileText },
  { path: "/revenue", label: "Revenue Analytics", icon: BarChart3 },
  { path: "/expenses", label: "Daily Expenses", icon: CreditCard },
  { path: "/profile", label: "Business Profile", icon: Building },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full border-r border-gray-200 bg-white transition-transform duration-300 z-50 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:relative lg:translate-x-0 lg:w-64`}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
        <span className="font-bold text-[var(--theme-primary)] text-lg tracking-tight">POS</span>
        <button
          onClick={onToggle}
          className="lg:hidden p-1 text-gray-500 hover:text-gray-900"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--theme-bg-secondary)] text-[var(--theme-primary)]"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {isActive && <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
