import React from "react";
import { NavLink } from "react-router-dom";

const AdminSidebar = () => {
  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Analytics", path: "/admin/analytics" },
    { name: "Conversations", path: "/admin/conversations" },
    { name: "Settings", path: "/admin/settings" },
  ];

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col shrink-0">
      
      {/* Logo */}
      <div className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Math<span className="text-[#5d44f8]">Vox</span>
        </h1>

        <span className="ml-2 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <NavLink
          to="/"
          className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          ← Back to MathVox
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;