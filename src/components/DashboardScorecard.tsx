'use client';

import React, { useState } from 'react';

export interface GatewayStat {
  id: string;
  name: string;
  slug: string;
  domain: string;
  website: string;
  description?: string | null;
  isClaimed?: boolean;
  escalationMatrix?: string | null;
  totalComplaints: number;
  openComplaints: number;
  breachedComplaints: number;
  resolvedCount: number;
  resolutionRate?: number | null;
  avgResolutionHours: number | null;
  medianResolutionHours?: number | null;
  mostReportedCategory?: string | null;
  categoryBreakdown?: Array<{ categoryName: string; count: number; percentage: number }>;
  resolutionBuckets?: {
    under24hPercent: number;
    hrs24to72Percent: number;
    over72hPercent: number;
  };
  officialResponseCount?: number;
}

interface DashboardScorecardProps {
  gateways: GatewayStat[];
  selectedGateway: string | null;
  onSelectGateway: (slug: string | null) => void;
  onOpenProviderProfile: (gateway: GatewayStat) => void;
}

export function DashboardScorecard({
  gateways,
  selectedGateway,
  onSelectGateway,
  onOpenProviderProfile,
}: DashboardScorecardProps) {
  const [showAllProviders, setShowAllProviders] = useState(false);

  const standardGateways = gateways.filter(
    (g) => g.slug !== 'other-pg' || g.totalComplaints > 0
  );

  const totalOpen = standardGateways.reduce((sum, g) => sum + g.openComplaints, 0);
  const totalBreached = standardGateways.reduce((sum, g) => sum + g.breachedComplaints, 0);
  const totalResolved = standardGateways.reduce((sum, g) => sum + g.resolvedCount, 0);

  const displayedGateways = showAllProviders
    ? standardGateways
    : standardGateways.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Unified 3-Column Architectural Ledger Strip (Green -> Yellow -> Red) */}
      <div className="border border-neutral-300 bg-white grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
        {/* 1. Verified Resolutions (Green) */}
        <div className="p-4 sm:p-5 border-t-[3px] border-t-emerald-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-600">
              Verified Resolutions
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-950 mt-2 tracking-tight">
            {totalResolved}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Merchant-confirmed resolutions
          </p>
        </div>

        {/* 2. Active Incidents (Yellow / Amber) */}
        <div className="p-4 sm:p-5 border-t-[3px] border-t-amber-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-600">
              Active Incidents
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-950 mt-2 tracking-tight">
            {totalOpen}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Across {standardGateways.length} tracked payment providers
          </p>
        </div>

        {/* 3. Critical (Red) */}
        <div className="p-4 sm:p-5 border-t-[3px] border-t-red-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-600">
              Critical
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-950 mt-2 tracking-tight">
            {totalBreached}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Reported &gt;7 days ago
          </p>
        </div>
      </div>

      {/* Provider Support Scorecard Ledger */}
      <div className="border border-neutral-300 bg-white">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-neutral-950 tracking-tight">
              Payment Provider Support Scorecard
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select any provider to inspect its public dossier, category breakdown, or filter the case ledger below.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {selectedGateway && (
              <button
                onClick={() => onSelectGateway(null)}
                className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 underline hover:text-neutral-950"
              >
                Reset Filter
              </button>
            )}
            {standardGateways.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllProviders(!showAllProviders)}
                className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-neutral-800 bg-[#FAF9F5] border border-neutral-300 hover:border-neutral-900 transition-colors"
              >
                {showAllProviders
                  ? 'Show Top 8 Providers'
                  : `Index All ${standardGateways.length} Providers`}
              </button>
            )}
          </div>
        </div>

        {/* Desktop & Tablet: Financial Ledger Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-[#FAF9F5] text-neutral-500 font-mono text-[10px] uppercase tracking-[0.1em]">
                <th className="py-3 px-6 font-medium">Providers</th>
                <th className="py-3 px-4 text-right font-medium">Reported</th>
                <th className="py-3 px-4 text-right font-medium">Resolved</th>
                <th className="py-3 px-4 text-right font-medium">No recent Update &gt;7days</th>
                <th className="py-3 px-4 text-right font-medium">Avg. Response time</th>
                <th className="py-3 px-4 text-right font-medium">Resolution Rate</th>
                <th className="py-3 px-6 text-right font-medium">Dossier / Feed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {displayedGateways.map((gw) => {
                const isSelected = selectedGateway === gw.slug;
                return (
                  <tr
                    key={gw.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-neutral-100/90' : 'hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-baseline gap-2.5">
                        <button
                          type="button"
                          onClick={() => onOpenProviderProfile(gw)}
                          className="text-left font-medium text-neutral-950 hover:underline underline-offset-4"
                        >
                          {gw.name}
                        </button>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {gw.domain}
                        </span>
                        {gw.isClaimed && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-800"
                            title="Claimed & Verified Provider Profile"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Claimed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-neutral-900">
                      {gw.totalComplaints}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800 font-medium">
                      {gw.resolvedCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {gw.breachedComplaints > 0 ? (
                        <span className="text-red-700 font-semibold">
                          {gw.breachedComplaints}
                        </span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-neutral-700">
                      {gw.avgResolutionHours ? `${gw.avgResolutionHours} hrs` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {gw.resolutionRate !== null && gw.resolutionRate !== undefined ? (
                        <span className="text-neutral-950 font-medium">
                          {gw.resolutionRate}%
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-3 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => onOpenProviderProfile(gw)}
                          className="text-neutral-600 hover:text-neutral-950 underline underline-offset-4"
                        >
                          Profile
                        </button>
                        <span className="text-neutral-300">|</span>
                        <button
                          type="button"
                          onClick={() => onSelectGateway(isSelected ? null : gw.slug)}
                          className={`${
                            isSelected
                              ? 'text-neutral-950 font-bold underline underline-offset-4'
                              : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          {isSelected ? 'Filtered' : 'Filter'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View (< 768px): Clean Ledger List */}
        <div className="md:hidden divide-y divide-neutral-200">
          {displayedGateways.map((gw) => {
            const isSelected = selectedGateway === gw.slug;
            return (
              <div
                key={gw.id}
                className={`p-4 space-y-3 transition-colors ${
                  isSelected ? 'bg-neutral-100/80' : 'hover:bg-[#FAF9F5]'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProviderProfile(gw)}
                    className="flex items-baseline gap-2 text-left"
                  >
                    <span className="font-semibold text-sm text-neutral-950 underline underline-offset-4">
                      {gw.name}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">{gw.domain}</span>
                  </button>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => onOpenProviderProfile(gw)}
                      className="text-neutral-700 underline"
                    >
                      Profile
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={() => onSelectGateway(isSelected ? null : gw.slug)}
                      className={isSelected ? 'font-bold text-neutral-950' : 'text-neutral-600'}
                    >
                      {isSelected ? 'Active' : 'Filter'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-1 border-t border-neutral-100 font-mono text-[11px]">
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase">Reported</span>
                    <span className="font-semibold text-neutral-900">{gw.totalComplaints}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase">Resolved</span>
                    <span className="font-semibold text-emerald-800">{gw.resolvedCount}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase">&gt;7d</span>
                    <span className="font-semibold text-red-700">{gw.breachedComplaints}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase">Avg Time</span>
                    <span className="text-neutral-700">
                      {gw.avgResolutionHours ? `${gw.avgResolutionHours}h` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase">Rate</span>
                    <span className="font-semibold text-neutral-900">
                      {gw.resolutionRate !== null && gw.resolutionRate !== undefined
                        ? `${gw.resolutionRate}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scorecard Footnote per exact user specification */}
        <div className="px-4 sm:px-6 py-3 bg-[#FAF9F5] border-t border-neutral-200 text-[11px] text-neutral-500">
          <p>
            FYR, &ldquo;No Recent Update&rdquo; means GatewayPulse has not received further information and does not indicate that the issue remains unresolved.
          </p>
        </div>
      </div>
    </div>
  );
}
