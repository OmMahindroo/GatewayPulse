import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  companyName?: string | null;
  domain?: string | null;
  className?: string;
}

export function VerifiedBadge({ companyName, domain, className = '' }: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-sky-50 text-sky-800 border border-sky-200 ${className}`}
      title="Verified corporate payment gateway representative"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
      <span>Verified {companyName || 'Gateway'} POC</span>
      {domain && <span className="text-sky-600 font-mono text-[11px]">@{domain}</span>}
    </span>
  );
}
