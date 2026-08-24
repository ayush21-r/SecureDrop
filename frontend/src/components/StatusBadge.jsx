import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, Lock, Shield } from 'lucide-react';

export default function StatusBadge({ status = 'pending', label, size = 'sm' }) {
  const statusConfig = {
    pending: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Clock,
      defaultLabel: 'Pending',
    },
    verified: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      defaultLabel: 'Verified',
    },
    encrypted: {
      bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      icon: Lock,
      defaultLabel: 'Encrypted',
    },
    active: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: ShieldCheck,
      defaultLabel: 'Active',
    },
    ready: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: Shield,
      defaultLabel: 'Ready',
    },
    error: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: AlertCircle,
      defaultLabel: 'Failed',
    },
  };

  const current = statusConfig[status.toLowerCase()] || statusConfig.pending;
  const Icon = current.icon;
  const text = label || current.defaultLabel;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${current.bg} ${
        sizeClasses[size] || sizeClasses.sm
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{text}</span>
    </span>
  );
}
