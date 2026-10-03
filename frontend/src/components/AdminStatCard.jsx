import React from "react";

const AdminStatCard = ({
  title,
  value,
  change,
  icon,
}) => {
  const isPositive = change?.startsWith("+");

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      
      <div className="flex items-start justify-between">
        
        {/* Information */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </h3>
        </div>

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
      </div>

      {/* Change */}
      {change && (
        <div className="mt-4 flex items-center gap-1 text-xs">
          <span
            className={
              isPositive
                ? "text-green-600 dark:text-green-400 font-semibold"
                : "text-red-500 dark:text-red-400 font-semibold"
            }
          >
            {change}
          </span>

          <span className="text-gray-400">
            from last month
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminStatCard;