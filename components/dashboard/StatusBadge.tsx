'use client';

import React from 'react';
import { Clock, CheckCircle, Warning, Prohibit, Lightbulb } from '@phosphor-icons/react';

export type CommitmentStatus = 'to_check' | 'done' | 'expired' | 'not_actual' | 'ideas_backlog';

interface StatusBadgeProps {
  status: CommitmentStatus;
  className?: string;
  showIcon?: boolean;
}

export const statusConfig = {
  to_check: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    label: 'Pending Review',
    icon: Clock,
  },
  done: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    label: 'Verified Done',
    icon: CheckCircle,
  },
  expired: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    label: 'Expired',
    icon: Warning,
  },
  not_actual: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    label: 'Not Actual',
    icon: Prohibit,
  },
  ideas_backlog: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
    label: 'Ideas Backlog',
    icon: Lightbulb,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  const config = statusConfig[status] || statusConfig.to_check;
  const StatusIcon = config.icon;

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-full border whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && <StatusIcon size={12} weight="bold" className="flex-shrink-0" />}
      <span>{config.label}</span>
    </div>
  );
};
