import { useState, useEffect, useRef } from "react";
import useCountdown from "../hooks/useCountdown";
import ImageSlider from "./ImageSlider";

const pad = (n) => String(n).padStart(2, "0");

// ── Compact Countdown ──────────────────────────────────────
const CompactTimer = ({ endTime }) => {
  const { hours, minutes, seconds, isExpired } = useCountdown(endTime);

  if (isExpired) {
    return (
      <span className="text-xs font-semibold text-red-500 dark:text-red-400">
        Auction Ended
      </span>
    );
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const isUrgent = totalSeconds < 60;
  const isCritical = totalSeconds <= 10;

  const colorClass = isCritical
    ? "text-red-600 dark:text-red-400"
    : isUrgent
      ? "text-amber-500 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <span
      className={`font-mono font-bold text-sm ${colorClass} ${isCritical ? "animate-pulse" : ""}`}>
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
};

// ── Status Badge ───────────────────────────────────────────
const StatusBadge = ({ status, endTime }) => {
  const { minutes, seconds, isExpired } = useCountdown(endTime);
  const totalMinLeft = minutes + (isExpired ? 0 : 1);

  if (status === "ended" || isExpired) {
    return (
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-gray-700/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
        Ended
      </div>
    );
  }

  if (status === "active") {
    const isEndingSoon = totalMinLeft <= 10 && !isExpired;
    if (isEndingSoon) {
      return (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Ending Soon
        </div>
      );
    }
    return (
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Live
      </div>
    );
  }

  if (status === "pending" || status === "approved") {
    return (
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-amber-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
        {status === "approved" ? "Starting Soon" : "Pending"}
      </div>
    );
  }

  return null;
};

// ═══════════════════════════════════════════════════════════
// AUCTION CARD
// ═══════════════════════════════════════════════════════════
const AuctionCard = ({
  auction,
  onJoin,
  currentHighestBid: liveBid,
  isEnded: liveEnded,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const bidAmount = liveBid ?? auction.currentHighestBid;
  const status = liveEnded ? "ended" : auction.status;
  const hasBids = bidAmount != null && bidAmount > 0;
  const [bidFlash, setBidFlash] = useState(false);
  const prevBidRef = useRef(bidAmount);

  // Flash animation on bid update
  useEffect(() => {
    if (prevBidRef.current !== bidAmount && bidAmount > 0) {
      setBidFlash(true);
      const t = setTimeout(() => setBidFlash(false), 1000);
      prevBidRef.current = bidAmount;
      return () => clearTimeout(t);
    }
  }, [bidAmount]);

  return (
    <div className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/50 border border-gray-200/80 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* Image Section */}
      <div className="relative">
        <StatusBadge status={status} endTime={auction.endTime} />
        
        {onToggleWatchlist && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleWatchlist(auction._id); }}
            className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm hover:scale-110 active:scale-95"
            title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
          >
            {isWatchlisted ? (
              <svg className="w-5 h-5 text-red-500 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}

        <ImageSlider
          images={auction.images}
          height="h-52"
          showDots={true}
          autoPlay={false}
          rounded="rounded-none"
        />
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Title + Seller */}
        <div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate leading-tight">
            {auction.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            by {auction.seller?.name || "—"}
          </p>
        </div>

        {/* Current Bid */}
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">
            Current Bid
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-bold text-xl text-indigo-600 dark:text-indigo-400 transition-all duration-300 ${bidFlash ? "scale-110 text-indigo-500" : ""}`}>
              ₹
              {(hasBids ? bidAmount : auction.basePrice)?.toLocaleString(
                "en-IN",
              )}
            </span>
            {!hasBids && (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                (Starting)
              </span>
            )}
          </div>
        </div>

        {/* Min Increment */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Min Increment: ₹{auction.minIncrement?.toLocaleString("en-IN")}
        </p>

        {/* Countdown */}
        {status === "active" && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>⏱</span>
            <span>Ends in:</span>
            <CompactTimer endTime={auction.endTime} />
          </div>
        )}
        {status === "ended" && (
          <p className="text-xs font-semibold text-red-500 dark:text-red-400">
            🔴 Auction Ended
          </p>
        )}

        {/* Stats Row */}
        {/* <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-1">
          <span>🏷 ID: #{auction._id?.slice(-6).toUpperCase()}</span>
        </div> */}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Action Button */}
        {status === "active" ? (
          <button
            onClick={() => onJoin(auction._id)}
            className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-colors shadow-sm">
            Join Auction →
          </button>
        ) : status === "ended" ? (
          <button
            disabled
            className="w-full py-2.5 text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-not-allowed">
            Auction Ended
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl cursor-not-allowed">
            Starting Soon...
          </button>
        )}
      </div>
    </div>
  );
};

export default AuctionCard;
