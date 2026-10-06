import React from 'react';

export const Card = ({ children, className = '', title, action, icon: Icon }) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="w-4 h-4 text-blue-400" />}
            <h3 className="font-semibold text-sm text-slate-100">{title}</h3>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default Card;
