import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  children,
  footer,
  className = '',
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm shadow-md overflow-hidden ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className="p-5">{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-slate-950/40 border-t border-slate-800/80 text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}
