import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAuction, getMyAuctions, getPendingAuctions, approveAuction } from '../services/auctionApi';

const STATUS_STYLES = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  ended:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  rejected: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const formatDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

const SkeletonRows = ({ cols = 5, rows = 3 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        </td>
      ))}
    </tr>
  ));

// ── Seller ─────────────────────────────────────────────────
const SellerDashboard = () => {
  const [form, setForm] = useState({ title: '', description: '', basePrice: '', minIncrement: '', startTime: '', endTime: '' });
  const [images, setImages] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    getMyAuctions().then(r => setMyAuctions(r.data || [])).catch(() => {}).finally(() => setTableLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      const res = await createAuction(fd);
      setMsg({ type: 'success', text: res.message || 'Auction created!' });
      setMyAuctions(prev => [res.data, ...prev]);
      setForm({ title: '', description: '', basePrice: '', minIncrement: '', startTime: '', endTime: '' });
      setImages([]);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create auction' });
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Create form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Create New Auction</h2>

        {msg.text && (
          <div className={`mb-5 px-4 py-3 rounded-lg text-sm border ${msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelClass}>Title</label>
            <input name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Vintage Rolex Submariner" className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Describe your item…" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className={labelClass}>Base Price (₹)</label>
            <input name="basePrice" type="number" required min="0" value={form.basePrice} onChange={handleChange} placeholder="1000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Min Increment (₹)</label>
            <input name="minIncrement" type="number" required min="1" value={form.minIncrement} onChange={handleChange} placeholder="100" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Start Time</label>
            <input name="startTime" type="datetime-local" required value={form.startTime} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>End Time</label>
            <input name="endTime" type="datetime-local" required value={form.endTime} onChange={handleChange} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Images</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setImages([...e.target.files])}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-950/40 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-950/60 transition"
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>

      {/* My Auctions Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Auctions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                {['Title', 'Base Price', 'Status', 'Start', 'End'].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tableLoading ? <SkeletonRows cols={5} /> : myAuctions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-gray-600">You haven&apos;t created any auctions yet.</td></tr>
              ) : myAuctions.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.title}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">₹{a.basePrice?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] || ''}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(a.startTime)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(a.endTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ── Admin ──────────────────────────────────────────────────
const AdminDashboard = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    getPendingAuctions().then(r => setPending(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      await approveAuction(id, action);
      setPending(prev => prev.filter(a => a._id !== id));
    } catch { /* silent */ } finally { setActionLoading(null); }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Approvals</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and approve seller auction requests</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
              {['Title', 'Seller', 'Base Price', 'Created At', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? <SkeletonRows cols={5} /> : pending.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-gray-600">No pending auctions to review.</td></tr>
            ) : pending.map((a) => (
              <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.title}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.seller?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">₹{a.basePrice?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleAction(a._id, 'approve')} disabled={actionLoading === a._id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition disabled:opacity-50">
                      Approve
                    </button>
                    <button onClick={() => handleAction(a._id, 'reject')} disabled={actionLoading === a._id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Bidder ─────────────────────────────────────────────────
const BidderDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
      <svg className="w-16 h-16 mx-auto text-primary-400 dark:text-primary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ready to bid?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Browse active auctions and place your bids in real time.</p>
      <button onClick={() => navigate('/auctions')}
        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition">
        Browse Auctions
      </button>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const roleLabels = { seller: 'Seller Dashboard', admin: 'Admin Dashboard', bidder: 'Bidder Dashboard' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{roleLabels[user?.role] || 'Dashboard'}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.name}</p>
      </div>
      {user?.role === 'seller' && <SellerDashboard />}
      {user?.role === 'admin'  && <AdminDashboard />}
      {user?.role === 'bidder' && <BidderDashboard />}
    </div>
  );
};

export default Dashboard;
