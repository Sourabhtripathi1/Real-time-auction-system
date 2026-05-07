import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const OverviewCard = ({ title, value, subtitle, icon, color = "indigo" }) => {
  // Define color mappings for Tailwind (Tailwind needs static class names, 
  // so we pre-define them or use inline styles, but since the prompt gave 
  // dynamic string templates, we can map the allowed colors to safe strings)
  
  const bg50 = {
    green: "bg-green-50 dark:bg-green-900/20",
    blue: "bg-blue-50 dark:bg-blue-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20",
  }[color] || "bg-gray-50 dark:bg-gray-900/20";
  
  const text700 = {
    green: "text-green-700 dark:text-green-400",
    blue: "text-blue-700 dark:text-blue-400",
    purple: "text-purple-700 dark:text-purple-400",
    indigo: "text-indigo-700 dark:text-indigo-400",
  }[color] || "text-gray-700 dark:text-gray-400";
  
  const bg100 = {
    green: "bg-green-100 dark:bg-green-900/40",
    blue: "bg-blue-100 dark:bg-blue-900/40",
    purple: "bg-purple-100 dark:bg-purple-900/40",
    indigo: "bg-indigo-100 dark:bg-indigo-900/40",
  }[color] || "bg-gray-100 dark:bg-gray-800";

  const hoverBorder = {
    green: "hover:border-green-200 dark:hover:border-green-800",
    blue: "hover:border-blue-200 dark:hover:border-blue-800",
    purple: "hover:border-purple-200 dark:hover:border-purple-800",
    indigo: "hover:border-indigo-200 dark:hover:border-indigo-800",
  }[color] || "hover:border-gray-200 dark:hover:border-gray-800";

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border-2 border-transparent transition-all",
        bg50,
        hoverBorder
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className={cn("text-3xl font-bold mt-2", text700)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "text-3xl w-12 h-12 rounded-full flex items-center justify-center",
            bg100
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
