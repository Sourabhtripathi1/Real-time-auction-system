import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAuctionById } from '../services/auctionApi';
import { getBidsByAuction } from '../services/bidApi';
import { addToWatchlist } from '../services/watchlistApi';
import useBid from '../hooks/useBid';
import CountdownTimer from '../components/CountdownTimer';
import BidHistory from '../components/BidHistory';
import Loader from '../components/Loader';

// ── Toast ──────────────────────────────────────────────────
const Toast = ({ message, onClose }) => (
  <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-amber-500 dark:bg-amber-600 text-white rounded-xl shadow-lg animate-bounce">
    <span>{message}</span>
    <button onClick={onClose} className="ml-1 text-white/80 hover:text-white text-lg leading-none">&times;</button>
  </div>
);

// ── Image Carousel ─────────────────────────────────────────
const ImageCarousel = ({ images }) => {
  const [current, setCurrent] = useState(0);

  if (!images?.length) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img src={`${import.meta.env.VITE_SOCKET_URL}${images[current]}`} alt={`Auction image ${current + 1}`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition">‹</button>
          <button onClick={() => setCurrent((c) => (c + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition">›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition ${i === current ? 'bg-white' : 'bg-white/40'}`} />)}
          </div>
        </>
      )}
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
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [viewers, setViewers] = useState(1);
  const [winner, setWinner] = useState(null);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [toast, setToast] = useState('');
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistDone, setWatchlistDone] = useState(false);
  const toastTimer = useRef(null);

  const { bidAmount, setBidAmount, bidError, bidLoading, bidSuccess, placeBid } = useBid();

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4000);
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const [auctionRes, bidsRes] = await Promise.all([getAuctionById(auctionId), getBidsByAuction(auctionId)]);
        const a = auctionRes.data;
        setAuction(a);
        setCurrentBid(a.currentHighestBid);
        setHighestBidder(a.highestBidder);
        setEndTime(a.endTime);
        if (a.status === 'ended') {
          setAuctionEnded(true);
          if (a.highestBidder) setWinner({ name: a.highestBidder.name || 'Unknown', amount: a.currentHighestBid });
        }
        setBids(bidsRes.data || []);
      } catch (err) {
        setPageError(err.response?.data?.message || 'Failed to load auction');
      } finally { setPageLoading(false); }
    };
    load();
  }, [auctionId]);

  // Socket
  useEffect(() => {
    if (!token) return;
    connect(token);
    if (socket.connected) joinAuction(auctionId, user?._id);
    else socket.once('connect', () => joinAuction(auctionId, user?._id));

    const onBidUpdated = ({ highestBid, highestBidder: bidder, timestamp }) => {
      setCurrentBid(highestBid);
      setHighestBidder(bidder);
      setBids((prev) => [{ _id: `live_${Date.now()}`, bidder, amount: highestBid, timestamp: timestamp || new Date().toISOString() }, ...prev.slice(0, 49)]);
    };
    const onTimerExtended = ({ newEndTime }) => { setEndTime(newEndTime); showToast('⏱ Timer extended by 10 seconds!'); };
    const onAuctionEnded = ({ winnerName, finalBid }) => {
      setAuctionEnded(true);
      setAuction((prev) => prev ? { ...prev, status: 'ended' } : prev);
      if (winnerName) setWinner({ name: winnerName, amount: finalBid });
    };
    const onUserJoined = ({ totalViewers }) => setViewers(totalViewers || 1);

    socket.on('bidUpdated', onBidUpdated);
    socket.on('timerExtended', onTimerExtended);
    socket.on('auctionEnded', onAuctionEnded);
    socket.on('userJoined', onUserJoined);

    return () => {
      socket.off('bidUpdated', onBidUpdated);
      socket.off('timerExtended', onTimerExtended);
      socket.off('auctionEnded', onAuctionEnded);
      socket.off('userJoined', onUserJoined);
      leaveAuction(auctionId);
    };
  }, [auctionId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlaceBid = async (e) => { e.preventDefault(); await placeBid(auctionId, bidAmount); };
  const handleAddWatchlist = async () => {
    setWatchlistLoading(true);
    try { await addToWatchlist(auctionId); setWatchlistDone(true); showToast('❤️ Added to your watchlist!'); }
    catch (err) { showToast(err.response?.data?.message || 'Failed to add to watchlist'); }
    finally { setWatchlistLoading(false); }
  };

  const isBidder = user?.role === 'bidder';
  const isSeller = auction && user && auction.seller?._id?.toString() === user._id;
  const canBid = isBidder && !isSeller && !auctionEnded && auction?.status === 'active';
  const minBid = currentBid + (auction?.minIncrement || 0);

  if (pageLoading) return <Loader />;
  if (pageError) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-red-600 dark:text-red-400 font-medium">{pageError}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* Winner Banner */}
      {winner && (
        <div className="mb-6 flex items-center gap-3 px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">Auction won by {winner.name}</p>
            <p className="text-amber-700 dark:text-amber-400 text-sm">Final bid: ₹{winner.amount?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT */}
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">
              {auction?.status === 'active' ? '🟢 Live Now' : `Status: ${auction?.status}`}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{auction?.title}</h1>
          </div>

          <ImageCarousel images={auction?.images} />

          {auction?.description && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{auction.description}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-4 py-2">
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950/60 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
                {(auction?.seller?.name || 'S')[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 block leading-none">Seller</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{auction?.seller?.name || '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span><strong className="text-gray-800 dark:text-gray-200">{viewers}</strong> watching</span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Bid info card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-gray-900/50 p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Current Highest Bid</p>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">₹{currentBid?.toLocaleString('en-IN')}</p>
                {highestBidder && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    by <span className="font-medium text-gray-700 dark:text-gray-300">{highestBidder?.name || highestBidder?.id || 'Unknown'}</span>
                  </p>
                )}
              </div>

              {endTime && <CountdownTimer endTime={endTime} />}

              {canBid ? (
                <form onSubmit={handlePlaceBid} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Your Bid (min ₹{minBid?.toLocaleString('en-IN')})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={minBid}
                        step={auction?.minIncrement}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`₹${minBid?.toLocaleString('en-IN')}`}
                        required
                        className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition"
                      />
                      <button type="submit" disabled={bidLoading}
                        className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        {bidLoading ? '…' : 'Place Bid'}
                      </button>
                    </div>
                  </div>

                  {bidError && (
                    <div className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                      <span>⚠</span><span>{bidError}</span>
                    </div>
                  )}
                  {bidSuccess && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                      <span>✓</span><span>Bid placed successfully!</span>
                    </div>
                  )}
                </form>
              ) : (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 text-center">
                  {auctionEnded ? '🔒 This auction has ended' : isSeller ? '🚫 You cannot bid on your own auction' : !isBidder ? '👁 Viewing as observer' : '⏳ Auction not yet active'}
                </div>
              )}

              {isBidder && !isSeller && (
                <button
                  onClick={handleAddWatchlist}
                  disabled={watchlistLoading || watchlistDone}
                  className={`w-full py-2.5 text-sm font-medium rounded-lg border transition focus:outline-none
                    ${watchlistDone
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 cursor-default'
                      : 'border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
                    }`}
                >
                  {watchlistDone ? '❤️ In Watchlist' : watchlistLoading ? 'Adding…' : '+ Add to Watchlist'}
                </button>
              )}
            </div>

            {/* Bid History card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-gray-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bid History</h2>
                <span className="text-xs text-gray-400 dark:text-gray-600">{bids.length} bids</span>
              </div>
              <BidHistory bids={bids} currentUserId={user?._id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;
