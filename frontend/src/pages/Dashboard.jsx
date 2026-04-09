import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createAuction,
  getMyAuctions,
  getPendingAuctions,
  approveAuction,
} from '../services/auctionApi';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  ended: 'bg-red-100 text-red-700',
  rejected: 'bg-gray-100 text-gray-500',
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

// ════════════════════════════════════════════════════════════
//  SELLER DASHBOARD
// ════════════════════════════════════════════════════════════
const SellerDashboard = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    basePrice: '',
    minIncrement: '',
    startTime: '',
    endTime: '',
  });
  const [images, setImages] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyAuctions();
        setMyAuctions(res.data || []);
      } catch {
        /* silent */
      } finally {
        setTableLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));

      const res = await createAuction(fd);
      setMsg({ type: 'success', text: res.message || 'Auction created!' });
      setMyAuctions((prev) => [res.data, ...prev]);
      setFormData({
        title: '',
        description: '',
        basePrice: '',
        minIncrement: '',
        startTime: '',
        endTime: '',
      });
      setImages([]);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create auction',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Create form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Create New Auction</h2>

        {msg.text && (
          <div
            className={`mb-5 px-4 py-3 rounded-lg text-sm border ${
              msg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Vintage Rolex Submariner"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item…"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (₹)</label>
            <input
              name="basePrice"
              type="number"
              required
              min="0"
              value={formData.basePrice}
              onChange={handleChange}
              placeholder="1000"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Increment (₹)</label>
            <input
              name="minIncrement"
              type="number"
              required
              min="1"
              value={formData.minIncrement}
              onChange={handleChange}
              placeholder="100"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
            <input
              name="startTime"
              type="datetime-local"
              required
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
            <input
              name="endTime"
              type="datetime-local"
              required
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages([...e.target.files])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>

      {/* My Auctions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Auctions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold text-gray-600">Title</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Base Price</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Start</th>
                <th className="px-4 py-3 font-semibold text-gray-600">End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : myAuctions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    You haven&apos;t created any auctions yet.
                  </td>
                </tr>
              ) : (
                myAuctions.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                    <td className="px-4 py-3 text-gray-600">₹{a.basePrice?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.startTime)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.endTime)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPendingAuctions();
        setPending(res.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      await approveAuction(id, action);
      setPending((prev) => prev.filter((a) => a._id !== id));
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve seller auction requests</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 font-semibold text-gray-600">Title</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Seller</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Base Price</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Created At</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pending.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  No pending auctions to review.
                </td>
              </tr>
            ) : (
              pending.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                  <td className="px-4 py-3 text-gray-600">{a.seller?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">₹{a.basePrice?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAction(a._id, 'approve')}
                        disabled={actionLoading === a._id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(a._id, 'reject')}
                        disabled={actionLoading === a._id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  BIDDER DASHBOARD
// ════════════════════════════════════════════════════════════
const BidderDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <svg className="w-16 h-16 mx-auto text-primary-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to bid?</h2>
      <p className="text-gray-500 mb-6">Browse active auctions and place your bids in real time.</p>
      <button
        onClick={() => navigate('/auctions')}
        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
      >
        Browse Auctions
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();

  const roleLabels = {
    seller: 'Seller Dashboard',
    admin: 'Admin Dashboard',
    bidder: 'Bidder Dashboard',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {roleLabels[user?.role] || 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}
        </p>
      </div>

      {user?.role === 'seller' && <SellerDashboard />}
      {user?.role === 'admin' && <AdminDashboard />}
      {user?.role === 'bidder' && <BidderDashboard />}
    </div>
  );
};

export default Dashboard;
