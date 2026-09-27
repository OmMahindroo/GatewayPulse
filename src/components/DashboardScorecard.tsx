'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  Activity,
  CheckCircle2,
  Building2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

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

  // Exclude "other-pg" meta entry from the main scorecard rows unless it has reports
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
    <div className="space-y-4">
      {/* Top Level Summary Cards: Verified (Green) -> Active (Yellow) -> Critical (Red) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. Verified Resolutions (Green) */}
        <div className="p-3.5 sm:p-4 rounded-md border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Verified Resolutions
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-950 mt-1.5">
            {totalResolved}
          </p>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-0.5">
            Merchant-confirmed resolutions
          </p>
        </div>

        {/* 2. Active Incidents (Yellow / Amber) */}
        <div className="p-3.5 sm:p-4 rounded-md border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Active Incidents
            </span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-950 mt-1.5">
            {totalOpen}
          </p>
          <p className="text-[10px] sm:text-[11px] text-amber-700 mt-0.5">
            Across {standardGateways.length} tracked payment providers
          </p>
        </div>

        {/* 3. Critical (Red) */}
        <div className="p-3.5 sm:p-4 rounded-md border border-red-200 bg-red-50/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-red-800 uppercase tracking-wider">
              Critical
            </span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-red-950 mt-1.5">
            {totalBreached}
          </p>
          <p className="text-[10px] sm:text-[11px] text-red-700 mt-0.5">
            Reported &gt;7 days ago
          </p>
        </div>
      </div>

      {/* Gateway Scorecard Card Container */}
      <div className="border border-neutral-200 rounded-md bg-white shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Payment Provider Support Scorecard
            </h3>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5">
              Click any provider name to view its Public Provider Profile, category breakdown, and resolution metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedGateway && (
              <button
                onClick={() => onSelectGateway(null)}
                className="text-xs text-neutral-600 underline hover:text-neutral-900"
              >
                Reset Provider Filter
              </button>
            )}
            {standardGateways.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllProviders(!showAllProviders)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors"
              >
                <span>
                  {showAllProviders
                    ? 'Show Top 8 Providers'
                    : `View All ${standardGateways.length} Providers`}
                </span>
                {showAllProviders ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Desktop & Tablet: Full Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-600 font-medium font-mono text-[11px]">
                <th className="py-2.5 px-4">Providers</th>
                <th className="py-2.5 px-4 text-center">Reported</th>
                <th className="py-2.5 px-4 text-center">Resolved</th>
                <th className="py-2.5 px-4 text-center">No recent Update &gt;7days</th>
                <th className="py-2.5 px-4 text-center">Avg. Response time</th>
                <th className="py-2.5 px-4 text-center">Resolution Rate</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {displayedGateways.map((gw) => {
                const isSelected = selectedGateway === gw.slug;
                return (
                  <tr
                    key={gw.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      isSelected ? 'bg-neutral-100/70 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenProviderProfile(gw)}
                          className="text-left font-semibold text-neutral-900 hover:underline flex items-center gap-1.5"
                        >
                          <span>{gw.name}</span>
                          {gw.isClaimed && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded"
                              title="Claimed & Verified Provider Profile"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Claimed
                            </span>
                          )}
                        </button>
                        <span className="text-[10px] font-mono text-neutral-400">
                          @{gw.domain}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-900">
                      {gw.totalComplaints}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-800 font-medium">
                      {gw.resolvedCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {gw.breachedComplaints > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-medium">
                          {gw.breachedComplaints}
                        </span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-700">
                      {gw.avgResolutionHours ? `${gw.avgResolutionHours} hrs` : 'Pending data'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {gw.resolutionRate !== null && gw.resolutionRate !== undefined ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                          {gw.resolutionRate}%
                        </span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenProviderProfile(gw)}
                          className="px-2.5 py-1 text-xs rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectGateway(isSelected ? null : gw.slug)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'View Feed'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View (< 768px): Card-based responsive list */}
        <div className="md:hidden divide-y divide-neutral-200">
          {displayedGateways.map((gw) => {
            const isSelected = selectedGateway === gw.slug;
            return (
              <div
                key={gw.id}
                className={`p-3.5 space-y-2.5 transition-colors ${
                  isSelected ? 'bg-neutral-100/70' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProviderProfile(gw)}
                    className="flex items-center gap-1.5 text-left"
                  >
                    <span className="font-semibold text-xs text-neutral-900 underline">
                      {gw.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">@{gw.domain}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenProviderProfile(gw)}
                      className="text-[10px] px-2 py-0.5 rounded border border-neutral-300 bg-white text-neutral-700"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectGateway(isSelected ? null : gw.slug)}
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {isSelected ? 'Active Filter' : 'Filter Feed'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                  <div className="bg-neutral-50 border border-neutral-200 p-1.5 rounded">
                    <span className="text-neutral-500 block text-[9px] uppercase">Reported</span>
                    <span className="font-bold text-neutral-900">{gw.totalComplaints}</span>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200 p-1.5 rounded">
                    <span className="text-emerald-700 block text-[9px] uppercase">Resolved</span>
                    <span className="font-bold text-emerald-800">{gw.resolvedCount}</span>
                  </div>
                  <div className="bg-red-50/60 border border-red-200 p-1.5 rounded">
                    <span className="text-red-700 block text-[9px] uppercase">&gt;7d</span>
                    <span className="font-bold text-red-800">{gw.breachedComplaints}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-1.5 rounded">
                    <span className="text-neutral-500 block text-[9px] uppercase">Avg Time</span>
                    <span className="font-bold text-neutral-700">
                      {gw.avgResolutionHours ? `${gw.avgResolutionHours}h` : '-'}
                    </span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-1.5 rounded">
                    <span className="text-neutral-500 block text-[9px] uppercase">Rate</span>
                    <span className="font-bold text-neutral-800">
                      {gw.resolutionRate !== null && gw.resolutionRate !== undefined
                        ? `${gw.resolutionRate}%`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scorecard Footnote per exact user specification */}
        <div className="px-4 sm:px-5 py-2.5 bg-neutral-50 border-t border-neutral-200 flex items-start gap-2 text-[11px] text-neutral-600">
          <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <p>
            FYR, &ldquo;No Recent Update&rdquo; means GatewayPulse has not received further information and does not indicate that the issue remains unresolved.
          </p>
        </div>
      </div>
    </div>
  );
}
