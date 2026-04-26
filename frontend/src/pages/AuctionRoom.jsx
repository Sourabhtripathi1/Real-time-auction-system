import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getAuctionById } from "../services/auctionApi";
import { getBidsByAuction } from "../services/bidApi";
import { addToWatchlist } from "../services/watchlistApi";
import useBid from "../hooks/useBid";
import CountdownTimer from "../components/CountdownTimer";
import BidHistory from "../components/BidHistory";
import ImageSlider from "../components/ImageSlider";
import Loader from "../components/Loader";

// ── Seller chip with avatar ────────────────────────────────
const SellerChip = ({ seller }) => {
  const [imgErr, setImgErr] = useState(false);
  const imgUrl = seller?.profileImage?.url;
  const initial = (seller?.name || "S")[0].toUpperCase();
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-4 py-2">
      {imgUrl && !imgErr ? (
        <img
          src={imgUrl}
          alt={seller?.name}
          onError={() => setImgErr(true)}
          className="w-7 h-7 rounded-full object-cover ring-1 ring-white dark:ring-gray-900 flex-shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
          {initial}
        </div>
      )}
      <div>
        <span className="text-xs text-gray-400 dark:text-gray-500 block leading-none">
          Seller
        </span>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {seller?.name || "—"}
        </span>
      </div>
    </div>
  );
};

// ── Main AuctionRoom ───────────────────────────────────────
const AuctionRoom = () => {
  const { id: auctionId } = useParams();
  const { user, token } = useAuth();
  const { socket, connect, joinAuction, leaveAuction } = useSocket();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidsPage, setBidsPage] = useState(1);
  const [hasMoreBids, setHasMoreBids] = useState(false);
  const [loadingMoreBids, setLoadingMoreBids] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [viewers, setViewers] = useState(1);
  const [winner, setWinner] = useState(null);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistDone, setWatchlistDone] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [bidFlashConflict, setBidFlashConflict] = useState(false);

  const {
    bidAmount,
    setBidAmount,
    bidError,
    bidLoading,
    bidSuccess,
    bidConflict,
    placeBid,
  } = useBid();

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const [auctionRes, bidsRes] = await Promise.all([
          getAuctionById(auctionId),
          getBidsByAuction(auctionId, 1, 20),
        ]);
        const a = auctionRes.data;
        setAuction(a);
        setCurrentBid(a.currentHighestBid);
        setHighestBidder(a.highestBidder);
        setEndTime(a.endTime);
        if (a.status === "ended") {
          setAuctionEnded(true);
          if (a.highestBidder)
            setWinner({
              name: a.highestBidder.name || "Unknown",
              amount: a.currentHighestBid,
            });
        }
        // bidsRes.data is now { bids, pagination }
        const bidsData = bidsRes.data;
        setBids(bidsData?.bids || bidsData || []);
        setHasMoreBids(bidsData?.pagination?.hasNextPage ?? false);
        setBidsPage(1);
      } catch (err) {
        setPageError(err.response?.data?.message || "Failed to load auction");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [auctionId]);

  // Socket setup + reconnect handling
  useEffect(() => {
    if (!token) return;
    connect(token);

    // Fetch latest auction state + re-join room (used on mount AND on reconnect)
    const rejoinAndRefetch = async () => {
      joinAuction(auctionId, user?._id);
      // Re-fetch to catch any bids missed during disconnect
      try {
        const [auctionRes, bidsRes] = await Promise.all([
          getAuctionById(auctionId),
          getBidsByAuction(auctionId, 1, 20),
        ]);
        const a = auctionRes.data;
        setCurrentBid(a.currentHighestBid);
        setHighestBidder(a.highestBidder);
        setEndTime(a.endTime);
        const bidsData = bidsRes.data;
        setBids(bidsData?.bids || bidsData || []);
        setHasMoreBids(bidsData?.pagination?.hasNextPage ?? false);
        setBidsPage(1);
      } catch {
        /* silent on refetch failure */
      }
    };

    if (socket.connected) rejoinAndRefetch();
    else socket.once("connect", rejoinAndRefetch);

    const onBidUpdated = ({ highestBid, highestBidder: bidder, timestamp }) => {
      setCurrentBid(highestBid);
      setHighestBidder(bidder);
      // Prepend new live bid to the top — do NOT refetch (socket is authoritative)
      setBids((prev) => [
        {
          _id: `live_${Date.now()}`,
          bidder,
          amount: highestBid,
          timestamp: timestamp || new Date().toISOString(),
        },
        ...prev.slice(0, 49),
      ]);
    };
    const onTimerExtended = ({ newEndTime }) => {
      setEndTime(newEndTime);
      toast.info("⏱ Timer extended by 10 seconds!");
    };
    const onAuctionEnded = ({ winnerName, finalBid }) => {
      setAuctionEnded(true);
      setAuction((prev) => (prev ? { ...prev, status: "ended" } : prev));
      if (winnerName) setWinner({ name: winnerName, amount: finalBid });
    };
    // Viewer count updated after anyone joins or disconnects
    const onViewerUpdate = ({ auctionId: id, viewers: count }) => {
      if (id === auctionId) setViewers(count);
    };
    // Reconnect: re-join room and re-fetch data after connection restored
    const onReconnect = () => {
      setIsReconnecting(false);
      rejoinAndRefetch();
    };
    const onDisconnect = () => {
      setIsReconnecting(true);
    };

    socket.on("bidUpdated", onBidUpdated);
    socket.on("timerExtended", onTimerExtended);
    socket.on("auctionEnded", onAuctionEnded);
    socket.on("viewerUpdate", onViewerUpdate);
    socket.on("connect", onReconnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("bidUpdated", onBidUpdated);
      socket.off("timerExtended", onTimerExtended);
      socket.off("auctionEnded", onAuctionEnded);
      socket.off("viewerUpdate", onViewerUpdate);
      socket.off("connect", onReconnect);
      socket.off("disconnect", onDisconnect);
      // Leave the room — do NOT disconnect the socket (reused across pages)
      leaveAuction(auctionId);
    };
  }, [auctionId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    try {
      await placeBid(auctionId, bidAmount, {
        // On 409 BID_CONFLICT: update local currentBid state + show orange flash
        onConflict: ({ currentHighestBid, minIncrement }) => {
          if (currentHighestBid != null) setCurrentBid(currentHighestBid);
          // Flash the bid display orange to signal the conflict
          setBidFlashConflict(true);
          setTimeout(() => setBidFlashConflict(false), 1500);
          toast.warning(
            "⚡ Someone just outbid you! Input updated with new minimum.",
            { autoClose: 3000 },
          );
        },
      });
    } catch (err) {
      // bidConflict case is handled inside useBid and via onConflict callback
      // other errors surface via bidError state from useBid
    }
  };
  const handleAddWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      await addToWatchlist(auctionId);
      setWatchlistDone(true);
      toast.success("❤️ Added to your watchlist!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to watchlist");
    } finally {
      setWatchlistLoading(false);
    }
  };

  const isBidder = user?.role === "bidder";
  const isSeller =
    auction && user && auction.seller?._id?.toString() === user._id;
  const canBid =
    isBidder && !isSeller && !auctionEnded && auction?.status === "active";
  const minBid = currentBid + (auction?.minIncrement || 0);

  if (pageLoading) return <Loader />;
  if (pageError)
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">
          {pageError}
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Reconnecting Banner — shown when socket drops */}
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-medium animate-pulse">
          ⚡ Reconnecting to live auction...
        </div>
      )}

      {/* Winner Banner */}
      {winner && (
        <div className="mb-6 flex items-center gap-3 px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">
              Auction won by {winner.name}
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-sm">
              Final bid: ₹{winner.amount?.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT */}
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">
              {auction?.status === "active"
                ? "🟢 Live Now"
                : `Status: ${auction?.status}`}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {auction?.title}
            </h1>
          </div>

          <ImageSlider
            images={auction?.images}
            height="h-80"
            showDots={true}
            showThumbnails={true}
            autoPlay={false}
            rounded="rounded-2xl"
          />

          {auction?.description && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {auction.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <SellerChip seller={auction?.seller} />

            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>
                <strong className="text-gray-800 dark:text-gray-200">
                  {viewers}
                </strong>{" "}
                watching
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Bid info card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-gray-900/50 p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                  Current Highest Bid
                </p>
                <p className={`text-4xl font-bold transition-colors duration-300 ${
                  bidFlashConflict
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  ₹{currentBid?.toLocaleString("en-IN")}
                </p>
                {highestBidder && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    by{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {highestBidder?.name || highestBidder?.id || "Unknown"}
                    </span>
                  </p>
                )}
              </div>

              {endTime && <CountdownTimer endTime={endTime} />}

              {canBid ? (
                <form onSubmit={handlePlaceBid} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Your Bid (min ₹{minBid?.toLocaleString("en-IN")})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={minBid}
                        step={auction?.minIncrement}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`₹${minBid?.toLocaleString("en-IN")}`}
                        required
                        className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition"
                      />
                      <button
                        type="submit"
                        disabled={bidLoading}
                        className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        {bidLoading ? "…" : "Place Bid"}
                      </button>
                    </div>
                  </div>

                  {bidError && (
                    <div className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                      <span>⚠</span>
                      <span>{bidError}</span>
                    </div>
                  )}
                  {bidSuccess && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                      <span>✓</span>
                      <span>Bid placed successfully!</span>
                    </div>
                  )}
                </form>
              ) : (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 text-center">
                  {auctionEnded
                    ? "🔒 This auction has ended"
                    : isSeller
                      ? "🚫 You cannot bid on your own auction"
                      : !isBidder
                        ? "👁 Viewing as observer"
                        : "⏳ Auction not yet active"}
                </div>
              )}

              {isBidder && !isSeller && (
                <button
                  onClick={handleAddWatchlist}
                  disabled={watchlistLoading || watchlistDone}
                  className={`w-full py-2.5 text-sm font-medium rounded-lg border transition focus:outline-none
                    ${
                      watchlistDone
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 cursor-default"
                        : "border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30"
                    }`}>
                  {watchlistDone
                    ? "❤️ In Watchlist"
                    : watchlistLoading
                      ? "Adding…"
                      : "+ Add to Watchlist"}
                </button>
              )}
            </div>

            {/* Bid History card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-gray-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Bid History
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  {bids.length} bids
                </span>
              </div>
              <BidHistory
                bids={bids}
                currentUserId={user?._id}
                hasMoreBids={hasMoreBids}
                loadingMore={loadingMoreBids}
                onLoadMore={async () => {
                  if (loadingMoreBids) return;
                  setLoadingMoreBids(true);
                  try {
                    const nextPage = bidsPage + 1;
                    const res = await getBidsByAuction(auctionId, nextPage, 20);
                    const bidsData = res.data;
                    const olderBids = bidsData?.bids || [];
                    setBids((prev) => [...prev, ...olderBids]);
                    setBidsPage(nextPage);
                    setHasMoreBids(bidsData?.pagination?.hasNextPage ?? false);
                  } catch {
                    /* silent */
                  } finally {
                    setLoadingMoreBids(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;
