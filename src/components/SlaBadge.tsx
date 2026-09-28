import React from 'react';
import { SlaInfo } from '@/lib/sla';

interface SlaBadgeProps {
  sla: SlaInfo;
  className?: string;
}

export function SlaBadge({ sla, className = '' }: SlaBadgeProps) {
  const getDotColor = () => {
    switch (sla.tier) {
      case 'RESOLVED':
        return 'bg-emerald-600';
      case 'RED':
        return 'bg-red-600';
      case 'ORANGE':
        return 'bg-orange-500';
      case 'YELLOW':
        return 'bg-amber-500';
      case 'GREEN':
      default:
        return 'bg-emerald-600';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-0.5 text-[11px] font-mono tracking-tight border bg-white border-neutral-300 text-neutral-800 ${className}`}
      title={sla.isBreached ? 'Reported >7 days ago without resolution' : `Elapsed: ${sla.daysElapsed} days`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor()}`} />
      <span>{sla.label}</span>
    </span>
  );
}
