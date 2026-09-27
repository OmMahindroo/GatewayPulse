'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Layers,
  Activity,
  FileText,
  Plus,
  Edit3,
  Check,
  Lock,
  Eye,
} from 'lucide-react';
import { GatewayStat } from './DashboardScorecard';
import { AuthSession } from '@/lib/auth';

interface ProviderProfileModalProps {
  gateway: GatewayStat | null;
  currentUser: AuthSession | null;
  onClose: () => void;
  onReportIssueForGateway: (gatewaySlug: string) => void;
  onViewAllReportsForGateway: (gatewaySlug: string) => void;
  onSelectIssue: (issueId: string) => void;
  onGatewayUpdated: () => void;
}

export function ProviderProfileModal({
  gateway,
  currentUser,
  onClose,
  onReportIssueForGateway,
  onViewAllReportsForGateway,
  onSelectIssue,
  onGatewayUpdated,
}: ProviderProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'PUBLIC' | 'DETAILED'>('PUBLIC');
  const [providerIssues, setProviderIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Escalation matrix / Claim editing for PG POC or Admin
  const [editingProfile, setEditingProfile] = useState(false);
  const [escalationMatrix, setEscalationMatrix] = useState('');
  const [isClaimed, setIsClaimed] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!gateway) return;
    setEscalationMatrix(
      gateway.escalationMatrix ||
        `Level 1: Standard Merchant Support Desk (support@${gateway.domain} - 24h SLA)\nLevel 2: Nodal Officer & Settlement Escalation (nodal@${gateway.domain} - 48h SLA)\nLevel 3: Principal Nodal Officer / Regulatory Compliance`
    );
    setIsClaimed(Boolean(gateway.isClaimed));

    setLoadingIssues(true);
    fetch(`/api/issues?gateway=${gateway.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.issues) {
          setProviderIssues(data.issues);
        }
      })
      .finally(() => setLoadingIssues(false));
  }, [gateway]);

  if (!gateway) return null;

  const isVerifiedPgOwner =
    currentUser &&
    ((currentUser.role === 'PG_SUPPORT' &&
      currentUser.domain?.toLowerCase() === gateway.domain.toLowerCase()) ||
      currentUser.role === 'ADMIN');

  const canAccessDetailedView = isClaimed || isVerifiedPgOwner;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayId: gateway.id,
          isClaimed,
          escalationMatrix,
        }),
      });
      if (res.ok) {
        setEditingProfile(false);
        onGatewayUpdated();
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // Compute Transparency Index (0-100)
  const resolutionScore = gateway.resolutionRate ?? 0;
  const officialReplyRate =
    gateway.totalComplaints > 0
      ? Math.round(((gateway.officialResponseCount || 0) / gateway.totalComplaints) * 100)
      : 0;
  const transparencyIndex =
    gateway.totalComplaints > 0
      ? Math.round(resolutionScore * 0.6 + officialReplyRate * 0.4)
      : isClaimed
      ? 80
      : 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="w-full max-w-3xl bg-white rounded-md border border-neutral-300 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center">
              {gateway.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-neutral-900">{gateway.name}</h2>
                {isClaimed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Provider profile: Claimed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                    Provider profile: Not claimed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">@{gateway.domain}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Public Provider Profile vs Detailed Provider Profile */}
            <div className="flex items-center gap-1 bg-neutral-200/70 p-0.5 rounded-md border border-neutral-300 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('PUBLIC')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  activeTab === 'PUBLIC'
                    ? 'bg-white text-neutral-900 font-semibold shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Public Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DETAILED')}
                className={`px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1 ${
                  activeTab === 'DETAILED'
                    ? 'bg-white text-neutral-900 font-semibold shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>Detailed PG Profile</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'PUBLIC' ? (
            /* 1. PUBLIC PROVIDER PROFILE (Exact User Specification) */
            <div className="space-y-5">
              <div className="p-5 rounded-md border border-neutral-200 bg-neutral-50/50 space-y-4">
                <div className="border-b border-neutral-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">{gateway.name}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {gateway.description || `Public Merchant Support Board for ${gateway.name}`}
                    </p>
                  </div>
                  {gateway.website && (
                    <a
                      href={gateway.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 underline font-mono"
                    >
                      <span>{gateway.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Structured Public Metrics List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-md bg-white border border-neutral-200 flex items-center justify-between">
                    <span className="text-neutral-600">Merchant reports</span>
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {gateway.totalComplaints} merchant reports
                    </span>
                  </div>

                  <div className="p-3 rounded-md bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
                    <span className="text-emerald-800">Merchant-confirmed resolved</span>
                    <span className="font-mono font-bold text-sm text-emerald-950">
                      {gateway.resolvedCount} merchant-confirmed resolved
                    </span>
                  </div>

                  <div className="p-3 rounded-md bg-amber-50/50 border border-amber-200 flex items-center justify-between">
                    <span className="text-amber-800">Currently reported unresolved</span>
                    <span className="font-mono font-bold text-sm text-amber-950">
                      {gateway.openComplaints} currently reported unresolved
                    </span>
                  </div>

                  <div className="p-3 rounded-md bg-red-50/50 border border-red-200 flex items-center justify-between">
                    <span className="text-red-800">No recent update (&gt;7d)</span>
                    <span className="font-mono font-bold text-sm text-red-950">
                      {gateway.breachedComplaints} no recent update
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-md bg-white border border-neutral-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Most reported:</span>
                    <span className="font-semibold text-neutral-900">
                      {gateway.mostReportedCategory || 'No categories reported yet'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Median reported resolution:</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      {gateway.medianResolutionHours || gateway.avgResolutionHours
                        ? `${gateway.medianResolutionHours || gateway.avgResolutionHours} hrs*`
                        : 'Pending sufficient data*'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Provider profile:</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      {isClaimed ? 'Claimed (Verified Official POC)' : 'Not claimed'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReportIssueForGateway(gateway.slug);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Report an issue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewAllReportsForGateway(gateway.slug);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-neutral-800 border border-neutral-300 text-xs font-medium hover:bg-neutral-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View all reports</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('DETAILED')}
                    className="ml-auto text-xs text-neutral-600 underline hover:text-neutral-900"
                  >
                    Inspect Detailed PG Analytics &amp; Feed &rarr;
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 2. DETAILED PROVIDER PROFILE (For Verified PG / Analytics View) */
            <div className="space-y-5">
              {/* Verification Notice Banner */}
              <div className="p-3.5 rounded-md bg-neutral-100 border border-neutral-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-neutral-800">
                    <strong>Detailed Provider Profile:</strong>{' '}
                    {canAccessDetailedView
                      ? 'Verified PG Portal & Escalation Matrix active.'
                      : 'Previewing Detailed Provider Portal (Available to Verified Payment Providers @' +
                        gateway.domain +
                        ').'}
                  </span>
                </div>
                {isVerifiedPgOwner && (
                  <button
                    type="button"
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 text-white text-[11px] font-medium hover:bg-neutral-800"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{editingProfile ? 'Cancel Edit' : 'Manage PG Profile'}</span>
                  </button>
                )}
              </div>

              {/* Editable Profile & Escalation Matrix Form for Admin / PG Owner */}
              {editingProfile && (
                <form
                  onSubmit={handleSaveProfile}
                  className="p-4 rounded-md bg-neutral-50 border border-neutral-300 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 uppercase tracking-wider">
                      Update Official Provider Profile &amp; Escalation Matrix
                    </span>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isClaimed}
                        onChange={(e) => setIsClaimed(e.target.checked)}
                        className="rounded border-neutral-300"
                      />
                      <span className="font-medium text-neutral-800">
                        Mark Provider Profile as Claimed &amp; Verified
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Official Support &amp; Escalation Matrix
                    </label>
                    <textarea
                      rows={3}
                      value={escalationMatrix}
                      onChange={(e) => setEscalationMatrix(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingProfile ? 'Saving...' : 'Save Provider Settings'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 1. Basic Profile & Escalation Matrix */}
              <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Basic Profile &amp; Escalation Matrix
                  </h4>
                  <a
                    href={gateway.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-neutral-600 underline hover:text-neutral-900 flex items-center gap-1"
                  >
                    <span>{gateway.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-3 rounded bg-neutral-50 border border-neutral-200 font-mono text-[11px] text-neutral-700 whitespace-pre-line leading-relaxed">
                  {escalationMatrix}
                </div>
              </div>

              {/* 2. Provider Summary + 5. Merchant Support Transparency Index */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 p-4 rounded-md border border-neutral-200 bg-white space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Provider Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                      <span className="text-[10px] text-neutral-500 block uppercase">
                        Reported cases
                      </span>
                      <span className="text-base font-bold text-neutral-900">
                        {gateway.totalComplaints}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 block uppercase">
                        Confirmed resolved
                      </span>
                      <span className="text-base font-bold text-emerald-950">
                        {gateway.resolvedCount}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-amber-50/50 border border-amber-200">
                      <span className="text-[10px] text-amber-800 block uppercase">
                        Currently unresolved
                      </span>
                      <span className="text-base font-bold text-amber-950">
                        {gateway.openComplaints}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-red-50/50 border border-red-200">
                      <span className="text-[10px] text-red-800 block uppercase">
                        No recent update
                      </span>
                      <span className="text-base font-bold text-red-950">
                        {gateway.breachedComplaints}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transparency Index */}
                <div className="p-4 rounded-md border border-neutral-200 bg-neutral-50 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Support Transparency Index
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Based on official PG responses &amp; merchant-confirmed closures
                    </p>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-neutral-900">
                      {transparencyIndex}/100
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {gateway.resolutionRate !== null && gateway.resolutionRate !== undefined
                        ? `${gateway.resolutionRate}% Resolution Rate`
                        : 'Active Monitoring'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Most Reported Issues (% breakdown) & 4. Reported Resolution Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Most Reported Issues */}
                <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Most Reported Issues
                  </h4>
                  {gateway.categoryBreakdown && gateway.categoryBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      {gateway.categoryBreakdown.map((item) => (
                        <div key={item.categoryName} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-800 font-medium truncate pr-2">
                              {item.categoryName}
                            </span>
                            <span className="font-mono text-neutral-900 font-semibold">
                              {item.percentage}% ({item.count})
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-100 rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-neutral-900"
                              style={{ width: `${Math.max(4, item.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      No category breakdown available yet for {gateway.name}.
                    </p>
                  )}
                </div>

                {/* Reported Resolution Experience */}
                <div className="p-4 rounded-md border border-neutral-200 bg-white space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Reported Resolution Experience
                  </h4>
                  <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                    <span className="text-neutral-600">Median reported resolution time:</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {gateway.medianResolutionHours || gateway.avgResolutionHours
                        ? `${gateway.medianResolutionHours || gateway.avgResolutionHours} hours`
                        : 'Pending data'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1">
                    <div className="p-2.5 rounded border border-emerald-200 bg-emerald-50/40">
                      <span className="text-[10px] text-emerald-800 block">Under 24 hrs</span>
                      <span className="text-sm font-bold text-emerald-950 mt-0.5 block">
                        {gateway.resolutionBuckets?.under24hPercent ?? 0}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded border border-amber-200 bg-amber-50/40">
                      <span className="text-[10px] text-amber-800 block">24-72 hrs</span>
                      <span className="text-sm font-bold text-amber-950 mt-0.5 block">
                        {gateway.resolutionBuckets?.hrs24to72Percent ?? 0}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded border border-red-200 bg-red-50/40">
                      <span className="text-[10px] text-red-800 block">72+ hrs</span>
                      <span className="text-sm font-bold text-red-950 mt-0.5 block">
                        {gateway.resolutionBuckets?.over72hPercent ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Real-time Dedicated Issue Feed for Providers (Anonymised Case View) */}
              <div className="border border-neutral-200 rounded-md bg-white overflow-hidden">
                <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                      Real-Time Dedicated Issue Feed ({providerIssues.length} Cases)
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Anonymised case view (Category, Issue summary, Duration, Channel tried, Current status)
                    </p>
                  </div>
                </div>

                {loadingIssues ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    Loading provider cases...
                  </div>
                ) : providerIssues.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No reported cases for {gateway.name}.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200 max-h-64 overflow-y-auto">
                    {providerIssues.map((iss) => (
                      <div
                        key={iss.id}
                        onClick={() => {
                          onClose();
                          onSelectIssue(iss.id);
                        }}
                        className="p-3.5 hover:bg-neutral-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                              Case #{iss.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-medium text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                              {iss.category?.name}
                            </span>
                            {iss.issueDuration && (
                              <span className="text-[10px] font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                                Duration: {iss.issueDuration}
                              </span>
                            )}
                            {iss.channelTried && (
                              <span className="text-[10px] font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                                Channel: {iss.channelTried}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-neutral-900 truncate">{iss.title}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              iss.status === 'RESOLVED' || iss.status === 'AUTO_CLOSED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : iss.status === 'PROPOSED_RESOLUTION'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                            }`}
                          >
                            {iss.status}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-900 underline">
                            <Eye className="w-3 h-3" />
                            Inspect / Respond
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
