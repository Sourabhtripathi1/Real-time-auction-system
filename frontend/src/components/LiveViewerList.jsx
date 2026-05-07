import React from "react";

const LiveViewerList = ({ viewers = [] }) => {
  if (!viewers || viewers.length === 0) {
    return <span className="text-sm text-gray-400">No viewers yet</span>;
  }

  const maxVisible = 5;
  const visibleViewers = viewers.slice(0, maxVisible);
  const remainingCount = viewers.length - maxVisible;

  return (
    <div className="flex items-center">
      {visibleViewers.map((viewer, index) => (
        <div
          key={viewer.id || index}
          className={`relative ${index !== 0 ? "-ml-2" : ""}`}
          title={viewer.name}
        >
          {viewer.profileImage ? (
            <img
              src={viewer.profileImage}
              alt={viewer.name}
              className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-xs">
              {viewer.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className="w-8 h-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium -ml-2 relative z-10"
          title={`${remainingCount} more viewers`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default LiveViewerList;
