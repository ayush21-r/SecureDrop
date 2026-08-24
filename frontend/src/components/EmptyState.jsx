import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 max-w-lg mx-auto my-6">
      <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-slate-400 mb-4 border border-slate-700/50">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-medium text-slate-200">{title}</h3>
      <p className="mt-1 text-sm text-slate-400 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
