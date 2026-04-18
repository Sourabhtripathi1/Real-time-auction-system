import { useState } from "react";
import { placeBid as placeBidApi } from "../services/bidApi";

const useBid = () => {
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);

  const placeBid = async (auctionId, amount) => {
    setBidError("");
    setBidSuccess(false);
    setBidLoading(true);

    try {
      const res = await placeBidApi(auctionId, Number(amount));
      setBidSuccess(true);
      setBidAmount("");

      // Clear success flag after 3s
      setTimeout(() => setBidSuccess(false), 3000);

      return res;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to place bid";
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
    placeBid,
  };
};

export default useBid;
