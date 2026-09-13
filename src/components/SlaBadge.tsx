import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SlaInfo } from '@/lib/sla';

interface SlaBadgeProps {
  sla: SlaInfo;
  className?: string;
}

export function SlaBadge({ sla, className = '' }: SlaBadgeProps) {
  const getIcon = () => {
    switch (sla.tier) {
      case 'RESOLVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-neutral-600" />;
      case 'RED':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
      case 'ORANGE':
      case 'YELLOW':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'GREEN':
      default:
        return <Clock className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-md border ${sla.colorClass.bg} ${sla.colorClass.text} ${sla.colorClass.border} ${className}`}
      title={sla.isBreached ? 'SLA Breached: Over 7 days unresolved' : `Age: ${sla.daysElapsed} days`}
    >
      {getIcon()}
      <span>{sla.label}</span>
    </span>
  );
}
