'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { GatewayStat } from './DashboardScorecard';

interface AdminDashboardModalProps {
  isOpen: boolean;
  gateways: GatewayStat[];
  onClose: () => void;
  onSelectIssue: (issueId: string) => void;
  onRefreshData: () => void;
}

export function AdminDashboardModal({
  isOpen,
  gateways,
  onClose,
  onSelectIssue,
  onRefreshData,
}: AdminDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'PROVIDERS'>('REPORTS');
  const [adminIssues, setAdminIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [sendingFollowupId, setSendingFollowupId] = useState<string | null>(null);

  const fetchAdminIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/issues?admin=true');
      const data = await res.json();
      if (data.issues) {
        setAdminIssues(data.issues);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminIssues();
      setActionMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend48hEmail = async (issueId: string) => {
    setSendingFollowupId(issueId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_48h_email' }),
      });
      const data = await res.json();
      setActionMessage(data.message || '48-hour follow-up check dispatched.');
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to send follow-up email.');
    } finally {
      setSendingFollowupId(null);
    }
  };

  const handleSetFollowupStatus = async (issueId: string, followupStatus: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'followup_48h', followupStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchAdminIssues();
        onRefreshData();
      }
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleToggleProviderClaim = async (gw: GatewayStat) => {
    try {
      const res = await fetch('/api/gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayId: gw.id,
          isClaimed: !gw.isClaimed,
        }),
      });
      if (res.ok) {
        setActionMessage(
          `${gw.name} profile marked as ${!gw.isClaimed ? 'Claimed (Verified)' : 'Not claimed'}.`
        );
        onRefreshData();
      }
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="w-full max-w-5xl bg-white rounded-md border border-neutral-300 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold">
                GatewayPulse Admin Dashboard
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                Private Merchant Contact Verification, 48h Resolution Check-ins &amp; Provider Claims
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-md border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('REPORTS')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  activeTab === 'REPORTS'
                    ? 'bg-white text-neutral-900 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                All Merchant Reports ({adminIssues.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PROVIDERS')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  activeTab === 'PROVIDERS'
                    ? 'bg-white text-neutral-900 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Provider Profiles ({gateways.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {actionMessage && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <span>{actionMessage}</span>
              <button
                type="button"
                onClick={() => setActionMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 font-mono"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'REPORTS' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    Merchant Email IDs and Mobile Numbers below are strictly confidential and hidden from the public board.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchAdminIssues}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Loading confidential admin records...
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-md overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 font-mono text-[11px] text-neutral-600">
                        <th className="py-2.5 px-3">Case / Provider</th>
                        <th className="py-2.5 px-3">Private Merchant Contact</th>
                        <th className="py-2.5 px-3">Escalation Context</th>
                        <th className="py-2.5 px-3">48h Resolution Follow-Up</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {adminIssues.map((iss) => (
                        <tr key={iss.id} className="hover:bg-neutral-50/80">
                          <td className="py-3 px-3 align-top max-w-[240px]">
                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-500">
                              <span>#{iss.id.slice(-6).toUpperCase()}</span>
                              <span>•</span>
                              <span className="font-semibold text-neutral-900">
                                {iss.gateway?.name}
                              </span>
                            </div>
                            <p className="font-semibold text-neutral-900 mt-0.5 line-clamp-2">
                              {iss.title}
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 border border-neutral-200 text-neutral-700">
                              {iss.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 align-top font-mono text-[11px] space-y-1">
                            <div className="flex items-center gap-1.5 text-neutral-900">
                              <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span>{iss.merchant?.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-neutral-700">
                              <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span>
                                {iss.contactMobile || iss.merchant?.mobileNumber || 'Not provided'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 align-top font-mono text-[11px] text-neutral-600 space-y-0.5">
                            <div>Ticket ID: {iss.pgTicketId || '-'}</div>
                            <div>Date Raised: {iss.dateRaised || '-'}</div>
                            <div>Channel: {iss.channelTried || '-'}</div>
                            <div>Duration: {iss.issueDuration || '-'}</div>
                          </td>

                          <td className="py-3 px-3 align-top space-y-1.5">
                            <div className="text-[11px] font-mono">
                              Status:{' '}
                              <span className="font-semibold text-neutral-900">
                                {iss.followup48hStatus || 'Awaiting 48h Check-in'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetFollowupStatus(iss.id, 'YES_RESOLVED')}
                                className="px-2 py-0.5 text-[10px] rounded border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-medium"
                              >
                                Yes, resolved
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetFollowupStatus(iss.id, 'STILL_UNRESOLVED')}
                                className="px-2 py-0.5 text-[10px] rounded border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-medium"
                              >
                                Still unresolved
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetFollowupStatus(iss.id, 'NO_UPDATE')}
                                className="px-2 py-0.5 text-[10px] rounded border border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 font-medium"
                              >
                                No update
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3 align-top text-right space-y-1.5">
                            <div>
                              <button
                                type="button"
                                disabled={sendingFollowupId === iss.id}
                                onClick={() => handleSend48hEmail(iss.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 font-medium"
                              >
                                <Send className="w-3 h-3" />
                                <span>
                                  {sendingFollowupId === iss.id ? 'Sending...' : 'Send 48h Email'}
                                </span>
                              </button>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectIssue(iss.id);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-neutral-600 underline hover:text-neutral-900"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Open Ticket</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* PROVIDERS MANAGEMENT TAB */
            <div className="border border-neutral-200 rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 font-mono text-[11px] text-neutral-600">
                    <th className="py-2.5 px-4">Payment Provider</th>
                    <th className="py-2.5 px-4">Official Domain</th>
                    <th className="py-2.5 px-4 text-center">Reported / Resolved</th>
                    <th className="py-2.5 px-4 text-center">Profile Status</th>
                    <th className="py-2.5 px-4 text-right">Toggle Claimed Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {gateways.map((gw) => (
                    <tr key={gw.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-4 font-semibold text-neutral-900">{gw.name}</td>
                      <td className="py-2.5 px-4 font-mono text-neutral-600">@{gw.domain}</td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {gw.totalComplaints} / {gw.resolvedCount}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {gw.isClaimed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Claimed
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                            Not claimed
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleProviderClaim(gw)}
                          className="px-2.5 py-1 text-xs rounded border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 font-medium"
                        >
                          {gw.isClaimed ? 'Mark Unclaimed' : 'Verify & Claim PG'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
