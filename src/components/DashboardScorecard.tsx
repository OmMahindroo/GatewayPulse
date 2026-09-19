'use client';

import React from 'react';
import { ShieldCheck, AlertOctagon, Clock, Activity, CheckCircle2, ChevronRight } from 'lucide-react';

interface GatewayStat {
  id: string;
  name: string;
  slug: string;
  domain: string;
  website: string;
  totalComplaints: number;
  openComplaints: number;
  breachedComplaints: number;
  resolvedCount: number;
  avgResolutionHours: number | null;
}

interface DashboardScorecardProps {
  gateways: GatewayStat[];
  selectedGateway: string | null;
  onSelectGateway: (slug: string | null) => void;
}

export function DashboardScorecard({
  gateways,
  selectedGateway,
  onSelectGateway,
}: DashboardScorecardProps) {
  const totalOpen = gateways.reduce((sum, g) => sum + g.openComplaints, 0);
  const totalBreached = gateways.reduce((sum, g) => sum + g.breachedComplaints, 0);
  const totalResolved = gateways.reduce((sum, g) => sum + g.resolvedCount, 0);

  return (
    <div className="space-y-4">
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. Verified Resolutions (Green) */}
        <div className="p-3.5 sm:p-4 rounded-md border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Verified Resolutions
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-950 mt-1.5">{totalResolved}</p>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-0.5">Confirmed or auto-closed</p>
        </div>

        {/* 2. Active Incidents (Yellow / Amber) */}
        <div className="p-3.5 sm:p-4 rounded-md border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Active Incidents
            </span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-950 mt-1.5">{totalOpen}</p>
          <p className="text-[10px] sm:text-[11px] text-amber-700 mt-0.5">Across {gateways.length} tracked gateways</p>
        </div>

        {/* 3. Critical Breaches (Red) */}
        <div className="p-3.5 sm:p-4 rounded-md border border-red-200 bg-red-50/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-red-800 uppercase tracking-wider">
              Critical Breaches
            </span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-red-950 mt-1.5">{totalBreached}</p>
          <p className="text-[10px] sm:text-[11px] text-red-700 mt-0.5">Unresolved tickets exceeding 7 days</p>
        </div>
      </div>

      {/* Gateway Scorecard Card Container */}
      <div className="border border-neutral-200 rounded-md bg-white shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Gateway Incident Scorecard
            </h3>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5">
              Comparative incident volume, SLA breaches, and verified resolution turnaround times
            </p>
          </div>
          {selectedGateway && (
            <button
              onClick={() => onSelectGateway(null)}
              className="text-xs text-neutral-600 underline hover:text-neutral-900"
            >
              Reset Gateway Filter
            </button>
          )}
        </div>

        {/* Desktop & Tablet: Full Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-600 font-medium font-mono text-[11px]">
                <th className="py-2.5 px-4">Gateway</th>
                <th className="py-2.5 px-4 text-center">Open Incidents</th>
                <th className="py-2.5 px-4 text-center">Critical Breaches (&gt;7d)</th>
                <th className="py-2.5 px-4 text-center">Resolved</th>
                <th className="py-2.5 px-4 text-center">Avg Turnaround</th>
                <th className="py-2.5 px-4 text-right">Filter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {gateways.map((gw) => {
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
                        <span>{gw.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400">@{gw.domain}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-900">
                      {gw.openComplaints}
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
                      {gw.resolvedCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-700">
                      {gw.avgResolutionHours ? `${gw.avgResolutionHours} hours` : 'Pending data'}
                    </td>
                    <td className="py-3 px-4 text-right">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View (< 768px): Card-based responsive list */}
        <div className="md:hidden divide-y divide-neutral-200">
          {gateways.map((gw) => {
            const isSelected = selectedGateway === gw.slug;
            return (
              <div
                key={gw.id}
                onClick={() => onSelectGateway(isSelected ? null : gw.slug)}
                className={`p-3.5 space-y-2 cursor-pointer transition-colors ${
                  isSelected ? 'bg-neutral-100/70' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-neutral-900">{gw.name}</span>
                    <span className="text-[10px] font-mono text-neutral-400">@{gw.domain}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {isSelected ? 'Active Filter' : 'Filter Feed'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                  <div className="bg-neutral-50 border border-neutral-200 p-1.5 rounded">
                    <span className="text-neutral-500 block text-[9px] uppercase">Open</span>
                    <span className="font-bold text-neutral-900">{gw.openComplaints}</span>
                  </div>
                  <div className="bg-red-50/60 border border-red-200 p-1.5 rounded">
                    <span className="text-red-700 block text-[9px] uppercase">&gt;7d</span>
                    <span className="font-bold text-red-800">{gw.breachedComplaints}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-1.5 rounded">
                    <span className="text-neutral-500 block text-[9px] uppercase">Done</span>
                    <span className="font-bold text-neutral-800">{gw.resolvedCount}</span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-1.5 rounded">
                    <span className="text-neutral-500 block text-[9px] uppercase">Avg Time</span>
                    <span className="font-bold text-neutral-700">{gw.avgResolutionHours ? `${gw.avgResolutionHours}h` : '-'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
