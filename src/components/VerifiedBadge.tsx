import React from 'react';

interface VerifiedBadgeProps {
  companyName?: string | null;
  domain?: string | null;
  className?: string;
}

export function VerifiedBadge({ companyName, domain, className = '' }: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider bg-neutral-900 text-white ${className}`}
      title="Verified payment provider representative"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span>Official {companyName || 'Provider'} Response</span>
      {domain && <span className="text-neutral-400 font-normal lowercase">@{domain}</span>}
    </span>
  );
}
