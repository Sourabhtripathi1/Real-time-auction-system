// StatusTabs — horizontally scrollable pill tabs with count badges
const StatusTabs = ({ tabs = [], activeTab = 'all', onChange }) => {
  if (!tabs.length) return null;

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
      <div className="flex gap-2 pb-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <button
              key={tab.value}
              onClick={() => onChange?.(tab.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={`inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTabs;
