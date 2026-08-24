import React from 'react';

export default function PageHeader({ title, description, action, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-800/80 gap-4">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="mt-1.5 text-sm text-slate-400 max-w-2xl">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
