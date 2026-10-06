import React from 'react';

export const Badge = ({ status = 'Present', children }) => {
  const getBadgeStyle = (st) => {
    switch (st.toLowerCase()) {
      case 'present':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'absent':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'late':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'face recognition':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'manual':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
        status
      )}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;
