'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
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
  onRequireAuth?: () => void;
}

export function ProviderProfileModal({
  gateway,
  currentUser,
  onClose,
  onReportIssueForGateway,
  onViewAllReportsForGateway,
  onSelectIssue,
  onGatewayUpdated,
  onRequireAuth,
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
    setActiveTab('PUBLIC');
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

  // Strict Role Restriction: ONLY Verified PG Representative (@provider-domain) or GatewayPulse ADMIN
  const isVerifiedPgOrAdmin = Boolean(
    currentUser &&
      (currentUser.role === 'ADMIN' ||
        (currentUser.role === 'PG_SUPPORT' &&
          currentUser.domain?.toLowerCase() === gateway.domain.toLowerCase()))
  );

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
      <div className="w-full max-w-3xl bg-white border border-neutral-400 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Editorial Top Bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 bg-[#FAF9F5] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-neutral-950">
                {gateway.name}
              </h2>
              {isClaimed ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Provider profile: Claimed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-600 bg-white border border-neutral-300 px-2 py-0.5">
                  Provider profile: Not claimed
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">@{gateway.domain}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Public Provider Profile vs Restricted Detailed PG Profile */}
            <div className="flex items-center border border-neutral-300 bg-white text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('PUBLIC')}
                className={`px-3 py-1.5 transition-colors ${
                  activeTab === 'PUBLIC'
                    ? 'bg-neutral-950 text-white font-medium'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                Public Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DETAILED')}
                className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'DETAILED'
                    ? 'bg-neutral-950 text-white font-medium'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {!isVerifiedPgOrAdmin && <Lock className="w-3 h-3" />}
                <span>Detailed PG Profile</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'PUBLIC' ? (
            /* 1. PUBLIC PROVIDER PROFILE (Open to All Visitors) */
            <div className="space-y-5">
              <div className="p-5 border border-neutral-300 bg-[#FAF9F5]/60 space-y-5">
                <div className="border-b border-neutral-200 pb-3.5 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                      Public Provider Summary
                    </p>
                    <h3 className="font-serif text-lg font-semibold text-neutral-950 mt-0.5">
                      {gateway.name}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {gateway.description || `Public Merchant Support Board for ${gateway.name}`}
                    </p>
                  </div>
                  {gateway.website && (
                    <a
                      href={gateway.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-950 underline font-mono"
                    >
                      <span>{gateway.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Structured Public Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-neutral-200 flex items-center justify-between">
                    <span className="text-neutral-600">Merchant reports</span>
                    <span className="font-mono font-semibold text-sm text-neutral-950">
                      {gateway.totalComplaints} merchant reports
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-neutral-200 border-l-2 border-l-emerald-700 flex items-center justify-between">
                    <span className="text-neutral-700">Merchant-confirmed resolved</span>
                    <span className="font-mono font-semibold text-sm text-emerald-900">
                      {gateway.resolvedCount} merchant-confirmed resolved
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-neutral-200 border-l-2 border-l-amber-500 flex items-center justify-between">
                    <span className="text-neutral-700">Currently reported unresolved</span>
                    <span className="font-mono font-semibold text-sm text-amber-900">
                      {gateway.openComplaints} currently reported unresolved
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-neutral-200 border-l-2 border-l-red-700 flex items-center justify-between">
                    <span className="text-neutral-700">No recent update (&gt;7d)</span>
                    <span className="font-mono font-semibold text-sm text-red-900">
                      {gateway.breachedComplaints} no recent update
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-neutral-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Most reported:</span>
                    <span className="font-semibold text-neutral-950">
                      {gateway.mostReportedCategory || 'No categories reported yet'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Median reported resolution:</span>
                    <span className="font-mono font-semibold text-neutral-950">
                      {gateway.medianResolutionHours || gateway.avgResolutionHours
                        ? `${gateway.medianResolutionHours || gateway.avgResolutionHours} hrs*`
                        : 'Pending sufficient data*'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Provider profile:</span>
                    <span className="font-mono font-semibold text-neutral-950">
                      {isClaimed ? 'Claimed (Verified Official POC)' : 'Not claimed'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReportIssueForGateway(gateway.slug);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
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
                    className="px-4 py-2 bg-white text-neutral-900 border border-neutral-300 text-xs font-medium hover:border-neutral-900 transition-colors"
                  >
                    View all reports
                  </button>
                </div>
              </div>
            </div>
          ) : !isVerifiedPgOrAdmin ? (
            /* 2A. RESTRICTED ACCESS LOCK SCREEN FOR PUBLIC / UNVERIFIED VISITORS */
            <div className="p-8 sm:p-10 border border-neutral-300 bg-[#FAF9F5] text-center space-y-4">
              <div className="w-10 h-10 mx-auto border border-neutral-400 bg-white flex items-center justify-center text-neutral-800">
                <Lock className="w-4 h-4" />
              </div>

              <div className="max-w-lg mx-auto space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Restricted Institutional Portal
                </p>
                <h3 className="font-serif text-xl font-semibold text-neutral-950">
                  Detailed Provider Profile Restricted to Verified {gateway.name} Team
                </h3>
                <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                  The Detailed Provider Dossier — including the Escalation Matrix configuration, Category Percentage Breakdown, Resolution Time Distribution (&lt;24h / 24-72h / 72+h), Merchant Support Transparency Index, and Real-Time Dedicated Issue Feed — is restricted to verified representatives of <strong>{gateway.name}</strong> (<span className="font-mono">@{gateway.domain}</span>) and GatewayPulse Administrators.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {onRequireAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequireAuth();
                    }}
                    className="px-4 py-2.5 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
                  >
                    Sign In with @{gateway.domain} or Admin Account
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('PUBLIC')}
                  className="px-4 py-2.5 bg-white text-neutral-800 border border-neutral-300 text-xs font-medium hover:border-neutral-900 transition-colors"
                >
                  Return to Public Profile
                </button>
              </div>
            </div>
          ) : (
            /* 2B. DETAILED PROVIDER PROFILE (Unlocked for Verified PG @domain or Admin) */
            <div className="space-y-5">
              {/* Verification Notice Banner */}
              <div className="p-3.5 bg-[#FAF9F5] border border-neutral-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-neutral-800">
                    <strong>Authorized Access:</strong> Viewing restricted Detailed Provider Portal for{' '}
                    <strong>{gateway.name}</strong> ({currentUser?.role === 'ADMIN' ? 'Admin Mode' : `@${gateway.domain}`}).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-950 text-white text-[11px] font-mono uppercase tracking-wider hover:bg-neutral-800"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{editingProfile ? 'Cancel Edit' : 'Edit Escalation Matrix'}</span>
                </button>
              </div>

              {/* Editable Profile & Escalation Matrix Form */}
              {editingProfile && (
                <form
                  onSubmit={handleSaveProfile}
                  className="p-4 bg-[#FAF9F5] border border-neutral-900 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-neutral-950 uppercase tracking-wider">
                      Update Official Provider Profile &amp; Escalation Matrix
                    </span>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isClaimed}
                        onChange={(e) => setIsClaimed(e.target.checked)}
                        className="border-neutral-300"
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
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingProfile ? 'Saving...' : 'Save Provider Settings'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 1. Basic Profile & Escalation Matrix */}
              <div className="p-4 border border-neutral-200 bg-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">
                    01 / Basic Profile &amp; Escalation Matrix
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
                <div className="p-3 bg-[#FAF9F5] border border-neutral-200 font-mono text-[11px] text-neutral-700 whitespace-pre-line leading-relaxed">
                  {escalationMatrix}
                </div>
              </div>

              {/* 2. Provider Summary + 5. Merchant Support Transparency Index */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 p-4 border border-neutral-200 bg-white space-y-3">
                  <h4 className="font-mono text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">
                    02 / Provider Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2.5 bg-[#FAF9F5] border border-neutral-200">
                      <span className="text-[10px] text-neutral-500 block uppercase">
                        Reported cases
                      </span>
                      <span className="text-base font-bold text-neutral-900">
                        {gateway.totalComplaints}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F5] border border-neutral-200 border-t-2 border-t-emerald-700">
                      <span className="text-[10px] text-emerald-800 block uppercase">
                        Confirmed resolved
                      </span>
                      <span className="text-base font-bold text-emerald-950">
                        {gateway.resolvedCount}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F5] border border-neutral-200 border-t-2 border-t-amber-500">
                      <span className="text-[10px] text-amber-800 block uppercase">
                        Currently unresolved
                      </span>
                      <span className="text-base font-bold text-amber-950">
                        {gateway.openComplaints}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FAF9F5] border border-neutral-200 border-t-2 border-t-red-700">
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
                <div className="p-4 border border-neutral-200 bg-[#FAF9F5] flex flex-col justify-between">
                  <div>
                    <h4 className="font-mono text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">
                      05 / Transparency Index
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Based on official PG responses &amp; merchant-confirmed closures
                    </p>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-neutral-900">
                      {transparencyIndex}/100
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800 bg-white border border-neutral-300 px-2 py-0.5">
                      {gateway.resolutionRate !== null && gateway.resolutionRate !== undefined
                        ? `${gateway.resolutionRate}% Resolution Rate`
                        : 'Active Monitoring'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Most Reported Issues (% breakdown) & 4. Reported Resolution Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 border border-neutral-200 bg-white space-y-3">
                  <h4 className="font-mono text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">
                    03 / Most Reported Issues
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
                          <div className="w-full h-1.5 bg-neutral-100 overflow-hidden">
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

                <div className="p-4 border border-neutral-200 bg-white space-y-3">
                  <h4 className="font-mono text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">
                    04 / Reported Resolution Experience
                  </h4>
                  <div className="p-2.5 bg-[#FAF9F5] border border-neutral-200 flex items-center justify-between text-xs">
                    <span className="text-neutral-600">Median reported resolution time:</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {gateway.medianResolutionHours || gateway.avgResolutionHours
                        ? `${gateway.medianResolutionHours || gateway.avgResolutionHours} hours`
                        : 'Pending data'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1">
                    <div className="p-2.5 border border-neutral-200 bg-[#FAF9F5]">
                      <span className="text-[10px] text-neutral-600 block">Under 24 hrs</span>
                      <span className="text-sm font-bold text-emerald-900 mt-0.5 block">
                        {gateway.resolutionBuckets?.under24hPercent ?? 0}%
                      </span>
                    </div>
                    <div className="p-2.5 border border-neutral-200 bg-[#FAF9F5]">
                      <span className="text-[10px] text-neutral-600 block">24-72 hrs</span>
                      <span className="text-sm font-bold text-amber-900 mt-0.5 block">
                        {gateway.resolutionBuckets?.hrs24to72Percent ?? 0}%
                      </span>
                    </div>
                    <div className="p-2.5 border border-neutral-200 bg-[#FAF9F5]">
                      <span className="text-[10px] text-neutral-600 block">72+ hrs</span>
                      <span className="text-sm font-bold text-red-900 mt-0.5 block">
                        {gateway.resolutionBuckets?.over72hPercent ?? 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Real-time Dedicated Issue Feed for Providers (Anonymised Case View) */}
              <div className="border border-neutral-200 bg-white overflow-hidden">
                <div className="px-4 py-3 bg-[#FAF9F5] border-b border-neutral-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-mono text-[11px] font-semibold text-neutral-900 uppercase tracking-wider">
                      06 / Real-Time Dedicated Issue Feed ({providerIssues.length} Cases)
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
                        className="p-3.5 hover:bg-[#FAF9F5] cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] text-neutral-500 bg-[#FAF9F5] px-1.5 py-0.5 border border-neutral-200">
                              Case #{iss.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-medium text-neutral-700 bg-[#FAF9F5] px-2 py-0.5 border border-neutral-200">
                              {iss.category?.name}
                            </span>
                            {iss.issueDuration && (
                              <span className="text-[10px] font-mono text-neutral-600">
                                Duration: {iss.issueDuration}
                              </span>
                            )}
                            {iss.channelTried && (
                              <span className="text-[10px] font-mono text-neutral-600">
                                · Channel: {iss.channelTried}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-neutral-900 truncate">{iss.title}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 border border-neutral-300 bg-white text-neutral-800">
                            {iss.status}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-700 hover:text-neutral-950 underline">
                            <Eye className="w-3 h-3" />
                            Respond
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
