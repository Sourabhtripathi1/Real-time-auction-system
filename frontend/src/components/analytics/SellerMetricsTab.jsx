import React, { useState, useEffect } from "react";
import { getSellerMetrics } from "../../services/metricsApi";
import AuctionMetricsPanel from "./AuctionMetricsPanel";
import Loader from "../Loader";

const SellerMetricsTab = () => {
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: "views", direction: "desc" });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getSellerMetrics();
        if (data.success) {
          setMetricsData(data.auctionMetrics);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...metricsData].sort((a, b) => {
    let valA, valB;
    switch (sortConfig.key) {
      case "title":
        valA = a.auction.title.toLowerCase();
        valB = b.auction.title.toLowerCase();
        break;
      case "views":
        valA = a.metrics?.totalViews || 0;
        valB = b.metrics?.totalViews || 0;
        break;
      case "bids":
        valA = a.metrics?.totalBids || 0;
        valB = b.metrics?.totalBids || 0;
        break;
      case "conversion":
        valA = a.metrics?.bidViewRatio || 0;
        valB = b.metrics?.bidViewRatio || 0;
        break;
      case "avgBid":
        valA = a.metrics?.avgBidAmount || 0;
        valB = b.metrics?.avgBidAmount || 0;
        break;
      case "status":
        valA = a.auction.status;
        valB = b.auction.status;
        break;
      default:
        valA = 0;
        valB = 0;
    }

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) return <Loader className="py-20" />;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {[
                  { label: "Auction Title", key: "title" },
                  { label: "Status", key: "status" },
                  { label: "Views", key: "views" },
                  { label: "Bids", key: "bids" },
                  { label: "Conversion %", key: "conversion" },
                  { label: "Avg Bid", key: "avgBid" },
                ].map(({ label, key }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 cursor-pointer hover:text-indigo-600 transition-colors">
                    <div className="flex items-center gap-1">
                      {label}
                      {sortConfig.key === key && (
                        <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No auction metrics available yet.
                  </td>
                </tr>
              ) : (
                sortedData.map((item) => {
                  const isExpanded = expandedRows.has(item.auction.id);
                  return (
                    <React.Fragment key={item.auction.id}>
                      <tr
                        onClick={() => toggleRow(item.auction.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                          {item.auction.title}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.auction.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.auction.status === "ended"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                            {item.auction.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{item.metrics?.totalViews || 0}</td>
                        <td className="px-4 py-3">{item.metrics?.totalBids || 0}</td>
                        <td className="px-4 py-3">
                          {((item.metrics?.bidViewRatio || 0)).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          ₹{(item.metrics?.avgBidAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 border-b-0">
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/20 border-b border-indigo-100 dark:border-indigo-900/30 shadow-inner">
                              <AuctionMetricsPanel
                                metrics={item.metrics}
                                auctionStatus={item.auction.status}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerMetricsTab;
