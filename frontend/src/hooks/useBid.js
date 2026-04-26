import { useState } from "react";
import { placeBid as placeBidApi } from "../services/bidApi";

const useBid = () => {
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidConflict, setBidConflict] = useState(false); // true when 409 BID_CONFLICT

  const placeBid = async (auctionId, amount, { onConflict } = {}) => {
    setBidError("");
    setBidSuccess(false);
    setBidConflict(false);
    setBidLoading(true);

    try {
      const res = await placeBidApi(auctionId, Number(amount));
      setBidSuccess(true);
      setBidAmount("");

      // Clear success flag after 3s
      setTimeout(() => setBidSuccess(false), 3000);

      return res;
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      // ── 409 BID_CONFLICT: race condition caught ────────────
      // Someone else placed a higher bid between our validation and write.
      // Do NOT show generic error — handle gracefully with UI update.
      if (status === 409 && data?.code === "BID_CONFLICT") {
        setBidConflict(true);

        // Auto-fill input with new minimum (currentHighestBid + minIncrement)
        if (data.currentHighestBid != null && data.minIncrement != null) {
          const newMin = data.currentHighestBid + data.minIncrement;
          setBidAmount(String(newMin));
        }

        // Invoke caller's onConflict callback so AuctionRoom can update state
        if (typeof onConflict === "function") {
          onConflict({
            currentHighestBid: data.currentHighestBid,
            minIncrement: data.minIncrement,
          });
        }

        // Clear conflict flag after 3s
        setTimeout(() => setBidConflict(false), 3000);

        throw err; // let AuctionRoom show its specific toast
      }

      // ── Generic error ──────────────────────────────────────
      const msg = data?.message || "Failed to place bid";
      setBidError(msg);

      // Auto-clear error after 5s
      setTimeout(() => setBidError(""), 5000);

      throw err;
    } finally {
      setBidLoading(false);
    }
  };

  return {
    bidAmount,
    setBidAmount,
    bidError,
    bidLoading,
    bidSuccess,
    bidConflict,
    placeBid,
  };
};

export default useBid;
