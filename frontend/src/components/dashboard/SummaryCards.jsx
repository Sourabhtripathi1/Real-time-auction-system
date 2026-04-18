// ── Inline SVG icons ───────────────────────────────────────
const GridIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const PencilIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ClockIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SignalIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const XCircIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ThumbsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.415-.586l-3.535-3.536m7.35-4.878A4 4 0 0012 6H8.5a4 4 0 00-4 4v3.586m7.35-4.878L6 17" /></svg>;

// ── Skeleton card ──────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3.5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </div>
  </div>
);

// ── Config for seller cards ────────────────────────────────
const SELLER_CARDS = [
  {
    key:     'total',
    label:   'Total Auctions',
    icon:    GridIcon,
    bg:      'bg-indigo-50 dark:bg-indigo-950/30',
    border:  'border-indigo-100 dark:border-indigo-900/40',
    iconBg:  'bg-indigo-100 dark:bg-indigo-900/60',
    color:   'text-indigo-600 dark:text-indigo-400',
    accent:  'border-t-2 border-t-indigo-400',
    status:  'all',
  },
  {
    key:     'inactive',
    label:   'Drafts',
    icon:    PencilIcon,
    bg:      'bg-gray-50 dark:bg-gray-800/40',
    border:  'border-gray-100 dark:border-gray-700/60',
    iconBg:  'bg-gray-200 dark:bg-gray-700',
    color:   'text-gray-600 dark:text-gray-400',
    accent:  'border-t-2 border-t-gray-400',
    status:  'inactive',
  },
  {
    key:     'pending',
    label:   'Pending Review',
    icon:    ClockIcon,
    bg:      'bg-amber-50 dark:bg-amber-950/20',
    border:  'border-amber-100 dark:border-amber-900/40',
    iconBg:  'bg-amber-100 dark:bg-amber-900/60',
    color:   'text-amber-600 dark:text-amber-400',
    accent:  'border-t-2 border-t-amber-400',
    status:  'pending',
  },
  {
    key:     'active',
    label:   'Live Now',
    icon:    SignalIcon,
    bg:      'bg-emerald-50 dark:bg-emerald-950/20',
    border:  'border-emerald-100 dark:border-emerald-900/40',
    iconBg:  'bg-emerald-100 dark:bg-emerald-900/60',
    color:   'text-emerald-600 dark:text-emerald-400',
    accent:  'border-t-2 border-t-emerald-400',
    status:  'active',
    pulse:   true,
  },
  {
    key:     'rejected',
    label:   'Rejected',
    icon:    XCircIcon,
    bg:      'bg-red-50 dark:bg-red-950/20',
    border:  'border-red-100 dark:border-red-900/40',
    iconBg:  'bg-red-100 dark:bg-red-900/60',
    color:   'text-red-600 dark:text-red-400',
    accent:  'border-t-2 border-t-red-400',
    status:  'rejected',
  },
  {
    key:     'ended',
    label:   'Ended',
    icon:    CheckIcon,
    bg:      'bg-slate-50 dark:bg-slate-800/40',
    border:  'border-slate-100 dark:border-slate-700/60',
    iconBg:  'bg-slate-200 dark:bg-slate-700',
    color:   'text-slate-600 dark:text-slate-400',
    accent:  'border-t-2 border-t-slate-400',
    status:  'ended',
  },
];

// ── Config for admin cards ─────────────────────────────────
const ADMIN_CARDS = [
  {
    key:    'total',
    label:  'Total Auctions',
    icon:   GridIcon,
    bg:     'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-100 dark:border-indigo-900/40',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    color:  'text-indigo-600 dark:text-indigo-400',
    accent: 'border-t-2 border-t-indigo-400',
    status: 'all',
  },
  {
    key:    'pending',
    label:  'Pending Review',
    icon:   ClockIcon,
    bg:     'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    color:  'text-amber-600 dark:text-amber-400',
    accent: 'border-t-2 border-t-amber-400',
    status: 'pending',
  },
  {
    key:    'active',
    label:  'Live Now',
    icon:   SignalIcon,
    bg:     'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    color:  'text-emerald-600 dark:text-emerald-400',
    accent: 'border-t-2 border-t-emerald-400',
    status: 'active',
    pulse:  true,
  },
  {
    key:    'approved',
    label:  'Approved',
    icon:   ThumbsIcon,
    bg:     'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/60',
    color:  'text-blue-600 dark:text-blue-400',
    accent: 'border-t-2 border-t-blue-400',
    status: 'approved',
  },
  {
    key:    'rejected',
    label:  'Rejected',
    icon:   XCircIcon,
    bg:     'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-100 dark:border-red-900/40',
    iconBg: 'bg-red-100 dark:bg-red-900/60',
    color:  'text-red-600 dark:text-red-400',
    accent: 'border-t-2 border-t-red-400',
    status: 'rejected',
  },
  {
    key:    'ended',
    label:  'Ended',
    icon:   CheckIcon,
    bg:     'bg-slate-50 dark:bg-slate-800/40',
    border: 'border-slate-100 dark:border-slate-700/60',
    iconBg: 'bg-slate-200 dark:bg-slate-700',
    color:  'text-slate-600 dark:text-slate-400',
    accent: 'border-t-2 border-t-slate-400',
    status: 'ended',
  },
];

// ── SummaryCards ───────────────────────────────────────────
const SummaryCards = ({
  summary       = {},
  role          = 'seller',
  isLoading     = false,
  activeStatus  = 'all',
  onStatusClick,
}) => {
  const cards = role === 'admin' ? ADMIN_CARDS : SELLER_CARDS;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon    = card.icon;
        const count   = summary[card.key] ?? 0;
        const isActive = activeStatus === card.status;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onStatusClick?.(card.status)}
            className={`rounded-2xl p-4 border text-left transition-all duration-150
              ${card.bg} ${card.border} ${card.accent}
              ${isActive
                ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 shadow-md'
                : 'hover:shadow-sm hover:scale-[1.01]'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`shrink-0 w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center ${card.color}`}>
                {card.key === 'active' ? (
                  <div className="relative">
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Icon />
                  </div>
                ) : <Icon />}
              </div>
              <div>
                <p className={`text-2xl font-bold ${card.color}`}>{count.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{card.label}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SummaryCards;
