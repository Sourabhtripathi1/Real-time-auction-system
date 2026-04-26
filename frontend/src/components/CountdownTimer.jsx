import { memo } from "react";
import useCountdown from "../hooks/useCountdown";

const pad = (n) => String(n).padStart(2, "0");

const CountdownTimer = ({ endTime }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endTime);

  if (isExpired) {
    return (
      <div className="flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <span className="text-lg font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
          Auction Ended
        </span>
      </div>
    );
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const isUrgent = days === 0 && totalSeconds < 60;
  const isCritical = days === 0 && totalSeconds <= 10;

  const colorClass = isCritical
    ? "text-red-600 dark:text-red-400"
    : isUrgent
      ? "text-amber-500 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";

  const bgClass = isCritical
    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    : isUrgent
      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";

  return (
    <div
      className={`flex flex-col items-center px-4 py-3 rounded-xl border ${bgClass} ${isCritical ? "animate-pulse" : ""}`}>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
        Time Remaining
      </span>

      <div
        className={`flex items-center gap-1 font-mono font-bold ${colorClass}`}>
        {days > 0 && (
          <>
            <span className="text-2xl">{pad(days)}d</span>
            <span className="text-xl opacity-50">:</span>
          </>
        )}
        <span className="text-3xl">{pad(hours)}</span>
        <span className="text-2xl opacity-50 -mt-0.5">:</span>
        <span className="text-3xl">{pad(minutes)}</span>
        <span className="text-2xl opacity-50 -mt-0.5">:</span>
        <span className="text-3xl">{pad(seconds)}</span>
      </div>

      {isCritical && (
        <span className="mt-1.5 text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide">
          Last few seconds!
        </span>
      )}
    </div>
  );
};

// React.memo: only re-render if endTime prop changes.
// The hook internally updates via setInterval — no external trigger needed.
export default memo(CountdownTimer, (prev, next) => prev.endTime === next.endTime);
