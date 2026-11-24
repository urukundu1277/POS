import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, Bell } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Navbar({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen((o) => !o)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">Online</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:p-1.5 md:p-2 text-gray-500 hover:text-gray-900 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.email || ""}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--theme-bg-secondary)] flex items-center justify-center text-[var(--theme-primary)] font-medium">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
        <div className="flex flex-col w-full overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
