'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Send,
  Eye,
  Lock,
  RefreshCw,
  Trash2,
  Edit3,
  Check,
  Plus,
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

  // Inline Ticket Editing State
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPgTicketId, setEditPgTicketId] = useState('');
  const [editDateRaised, setEditDateRaised] = useState('');
  const [editChannelTried, setEditChannelTried] = useState('');
  const [editIssueDuration, setEditIssueDuration] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [savingIssue, setSavingIssue] = useState(false);

  // Inline Provider Profile Editing State
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [editGwName, setEditGwName] = useState('');
  const [editGwDomain, setEditGwDomain] = useState('');
  const [editGwWebsite, setEditGwWebsite] = useState('');
  const [editGwDescription, setEditGwDescription] = useState('');
  const [editGwEscalation, setEditGwEscalation] = useState('');
  const [editGwClaimed, setEditGwClaimed] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);

  // Add New Provider State
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newGwName, setNewGwName] = useState('');
  const [newGwDomain, setNewGwDomain] = useState('');
  const [newGwWebsite, setNewGwWebsite] = useState('');
  const [newGwDescription, setNewGwDescription] = useState('');
  const [addingProvider, setAddingProvider] = useState(false);

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
      setEditingIssueId(null);
      setEditingGatewayId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Ticket Management Actions ---
  const startEditIssue = (iss: any) => {
    setEditingIssueId(iss.id);
    setEditTitle(iss.title || '');
    setEditPgTicketId(iss.pgTicketId || '');
    setEditDateRaised(iss.dateRaised || '');
    setEditChannelTried(iss.channelTried || 'Email');
    setEditIssueDuration(iss.issueDuration || '1-3 days');
    setEditStatus(iss.status || 'OPEN');
  };

  const handleSaveIssueChanges = async (issueId: string) => {
    setSavingIssue(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          pgTicketId: editPgTicketId,
          dateRaised: editDateRaised,
          channelTried: editChannelTried,
          issueDuration: editIssueDuration,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket.');
      setActionMessage(data.message || 'Ticket updated.');
      setEditingIssueId(null);
      fetchAdminIssues();
      onRefreshData();
    } catch (err: any) {
      setActionMessage(err.message);
    } finally {
      setSavingIssue(false);
    }
  };

  const handleForceStatusChange = async (issueId: string, newStatus: string) => {
    setActionMessage(null);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Case #${issueId.slice(-6).toUpperCase()} status set to ${newStatus}.`);
        fetchAdminIssues();
        onRefreshData();
      }
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleDeleteIssue = async (issueId: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently DELETE this submission?\n\n"${title}"\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setActionMessage(null);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete submission.');
      setActionMessage(data.message || 'Submission permanently deleted.');
      fetchAdminIssues();
      onRefreshData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

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

  // --- Provider Profile Management Actions ---
  const startEditGateway = (gw: GatewayStat) => {
    setEditingGatewayId(gw.id);
    setEditGwName(gw.name);
    setEditGwDomain(gw.domain);
    setEditGwWebsite(gw.website || `https://${gw.domain}`);
    setEditGwDescription(gw.description || '');
    setEditGwEscalation(
      gw.escalationMatrix ||
        `Level 1: Standard Merchant Support Desk (support@${gw.domain} - 24h SLA)\nLevel 2: Nodal Officer & Settlement Escalation (nodal@${gw.domain} - 48h SLA)\nLevel 3: Principal Nodal Officer / Regulatory Compliance`
    );
    setEditGwClaimed(Boolean(gw.isClaimed));
  };

  const handleSaveGateway = async (gatewayId: string) => {
    setSavingGateway(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayId,
          name: editGwName,
          domain: editGwDomain,
          website: editGwWebsite,
          description: editGwDescription,
          escalationMatrix: editGwEscalation,
          isClaimed: editGwClaimed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update provider profile.');
      setActionMessage(`${editGwName} profile settings updated successfully.`);
      setEditingGatewayId(null);
      onRefreshData();
    } catch (err: any) {
      setActionMessage(err.message);
    } finally {
      setSavingGateway(false);
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

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGwName.trim() || !newGwDomain.trim()) return;

    setAddingProvider(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGwName.trim(),
          domain: newGwDomain.trim(),
          website: newGwWebsite.trim(),
          description: newGwDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add provider.');
      setActionMessage(`Added new payment provider: ${newGwName.trim()}`);
      setNewGwName('');
      setNewGwDomain('');
      setNewGwWebsite('');
      setNewGwDescription('');
      setShowAddProvider(false);
      onRefreshData();
    } catch (err: any) {
      setActionMessage(err.message);
    } finally {
      setAddingProvider(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div className="w-full max-w-6xl bg-white border border-neutral-400 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 px-5 py-3.5 bg-neutral-950 text-white shrink-0 gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
              Restricted Back-Office Operations
            </p>
            <h2 className="font-serif text-base sm:text-lg font-semibold">
              GatewayPulse Admin Portal
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-neutral-700 bg-neutral-900 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('REPORTS')}
                className={`px-3 py-1.5 transition-colors ${
                  activeTab === 'REPORTS'
                    ? 'bg-white text-neutral-950 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Submissions &amp; Ticket IDs ({adminIssues.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PROVIDERS')}
                className={`px-3 py-1.5 transition-colors ${
                  activeTab === 'PROVIDERS'
                    ? 'bg-white text-neutral-950 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Manage PG Profiles ({gateways.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {actionMessage && (
            <div className="p-3 bg-[#FAF9F5] border-l-2 border-neutral-950 text-xs text-neutral-900 flex items-center justify-between">
              <span className="font-medium">{actionMessage}</span>
              <button
                type="button"
                onClick={() => setActionMessage(null)}
                className="font-mono text-[11px] text-neutral-500 hover:text-neutral-950 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'REPORTS' ? (
            /* TAB 1: SUBMISSIONS, TICKET IDS, FORCE RESOLVE & DELETE */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Lock className="w-3.5 h-3.5 text-neutral-800" />
                  <span>
                    Manage submissions, edit PG Ticket IDs, force-resolve or reopen cases, and delete invalid/spam tickets.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchAdminIssues}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center font-mono text-xs text-neutral-500">
                  Loading confidential admin records...
                </div>
              ) : (
                <div className="border border-neutral-300 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF9F5] border-b border-neutral-300 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                        <th className="py-2.5 px-3">Case / Provider / Status</th>
                        <th className="py-2.5 px-3">Private Merchant Contact</th>
                        <th className="py-2.5 px-3">PG Ticket ID &amp; Context</th>
                        <th className="py-2.5 px-3">48h Follow-Up &amp; Force Status</th>
                        <th className="py-2.5 px-3 text-right">Admin Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {adminIssues.map((iss) => {
                        const isEditing = editingIssueId === iss.id;
                        return (
                          <React.Fragment key={iss.id}>
                            <tr className="hover:bg-[#FAF9F5]/80">
                              <td className="py-3 px-3 align-top max-w-[240px]">
                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-500">
                                  <span>#{iss.id.slice(-6).toUpperCase()}</span>
                                  <span>·</span>
                                  <span className="font-semibold text-neutral-950">
                                    {iss.customPgName || iss.gateway?.name}
                                  </span>
                                </div>
                                <p className="font-semibold text-neutral-950 mt-0.5 line-clamp-2">
                                  {iss.title}
                                </p>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <select
                                    value={iss.status}
                                    onChange={(e) => handleForceStatusChange(iss.id, e.target.value)}
                                    className="px-2 py-0.5 text-[10px] font-mono border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900"
                                    title="Force change case status"
                                  >
                                    <option value="OPEN">OPEN</option>
                                    <option value="INVESTIGATING">INVESTIGATING</option>
                                    <option value="PROPOSED_RESOLUTION">PROPOSED_RESOLUTION</option>
                                    <option value="RESOLVED">RESOLVED (Force Resolve)</option>
                                    <option value="DISPUTED">DISPUTED</option>
                                  </select>
                                </div>
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

                              <td className="py-3 px-3 align-top font-mono text-[11px] text-neutral-700 space-y-0.5">
                                <div>
                                  <span className="text-neutral-400">Ticket ID:</span>{' '}
                                  <span className="font-semibold text-neutral-950">
                                    {iss.pgTicketId || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-neutral-400">Date Raised:</span>{' '}
                                  {iss.dateRaised || '—'}
                                </div>
                                <div>
                                  <span className="text-neutral-400">Channel:</span>{' '}
                                  {iss.channelTried || '—'}
                                </div>
                                <div>
                                  <span className="text-neutral-400">Duration:</span>{' '}
                                  {iss.issueDuration || '—'}
                                </div>
                              </td>

                              <td className="py-3 px-3 align-top space-y-1.5">
                                <div className="text-[11px] font-mono">
                                  48h Check:{' '}
                                  <span className="font-semibold text-neutral-950">
                                    {iss.followup48hStatus || 'Awaiting'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSetFollowupStatus(iss.id, 'YES_RESOLVED')}
                                    className="px-2 py-0.5 text-[10px] border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-medium"
                                  >
                                    Yes, resolved
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetFollowupStatus(iss.id, 'STILL_UNRESOLVED')}
                                    className="px-2 py-0.5 text-[10px] border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-medium"
                                  >
                                    Still unresolved
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetFollowupStatus(iss.id, 'NO_UPDATE')}
                                    className="px-2 py-0.5 text-[10px] border border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 font-medium"
                                  >
                                    No update
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-3 align-top text-right space-y-1.5">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      isEditing ? setEditingIssueId(null) : startEditIssue(iss)
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900 font-medium"
                                    title="Edit Ticket ID, Title, or Context"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{isEditing ? 'Cancel' : 'Edit Ticket'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteIssue(iss.id, iss.title)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 font-medium"
                                    title="Permanently Delete Submission"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-0.5">
                                  <button
                                    type="button"
                                    disabled={sendingFollowupId === iss.id}
                                    onClick={() => handleSend48hEmail(iss.id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-600 underline hover:text-neutral-950"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                    <span>
                                      {sendingFollowupId === iss.id ? 'Sending...' : 'Send 48h Email'}
                                    </span>
                                  </button>
                                  <span className="text-neutral-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onSelectIssue(iss.id);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-600 underline hover:text-neutral-950"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Inline Ticket Editor Row */}
                            {isEditing && (
                              <tr className="bg-[#FAF9F5] border-b border-neutral-300">
                                <td colSpan={5} className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-900">
                                        Edit Ticket #{iss.id.slice(-6).toUpperCase()} Metadata &amp; Ticket ID
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                                      <div className="lg:col-span-2">
                                        <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                          Issue Title
                                        </label>
                                        <input
                                          type="text"
                                          value={editTitle}
                                          onChange={(e) => setEditTitle(e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-neutral-950"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                          PG Own Ticket ID
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g., TKT-992841"
                                          value={editPgTicketId}
                                          onChange={(e) => setEditPgTicketId(e.target.value)}
                                          className="w-full px-2.5 py-1.5 font-mono bg-white border border-neutral-300 text-neutral-950"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                          Date Raised
                                        </label>
                                        <input
                                          type="date"
                                          value={editDateRaised}
                                          onChange={(e) => setEditDateRaised(e.target.value)}
                                          className="w-full px-2.5 py-1.5 font-mono bg-white border border-neutral-300 text-neutral-950"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                          Channel Tried
                                        </label>
                                        <input
                                          type="text"
                                          value={editChannelTried}
                                          onChange={(e) => setEditChannelTried(e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-neutral-950"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingIssueId(null)}
                                        className="px-3 py-1.5 text-xs border border-neutral-300 bg-white text-neutral-700"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={savingIssue}
                                        onClick={() => handleSaveIssueChanges(iss.id)}
                                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs bg-neutral-950 text-white font-medium hover:bg-neutral-800"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{savingIssue ? 'Saving...' : 'Save Ticket Changes'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: FULL PAYMENT PROVIDER PROFILE MANAGER */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-neutral-600">
                  Manage Payment Provider profile pages, official corporate domains, escalation matrices, and claimed verification status.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddProvider(!showAddProvider)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-950 text-white font-medium hover:bg-neutral-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddProvider ? 'Cancel' : 'Add New Payment Provider'}</span>
                </button>
              </div>

              {showAddProvider && (
                <form
                  onSubmit={handleCreateProvider}
                  className="p-4 bg-[#FAF9F5] border border-neutral-900 space-y-3 text-xs"
                >
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-950">
                    Register New Payment Provider
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                        Provider Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Worldline"
                        value={newGwName}
                        onChange={(e) => setNewGwName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                        Official Domain *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., worldline.com"
                        value={newGwDomain}
                        onChange={(e) => setNewGwDomain(e.target.value)}
                        className="w-full px-2.5 py-1.5 font-mono bg-white border border-neutral-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                        Website URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://worldline.com"
                        value={newGwWebsite}
                        onChange={(e) => setNewGwWebsite(e.target.value)}
                        className="w-full px-2.5 py-1.5 font-mono bg-white border border-neutral-300"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addingProvider}
                      className="px-4 py-1.5 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800"
                    >
                      {addingProvider ? 'Creating...' : 'Create Provider Profile'}
                    </button>
                  </div>
                </form>
              )}

              <div className="border border-neutral-300 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F5] border-b border-neutral-300 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                      <th className="py-2.5 px-4">Payment Provider</th>
                      <th className="py-2.5 px-4">Official Domain</th>
                      <th className="py-2.5 px-4 text-center">Reported / Resolved</th>
                      <th className="py-2.5 px-4 text-center">Profile Status</th>
                      <th className="py-2.5 px-4 text-right">Manage Profile &amp; Claim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {gateways.map((gw) => {
                      const isEditingGw = editingGatewayId === gw.id;
                      return (
                        <React.Fragment key={gw.id}>
                          <tr className="hover:bg-[#FAF9F5]/80">
                            <td className="py-3 px-4 font-semibold text-neutral-950">{gw.name}</td>
                            <td className="py-3 px-4 font-mono text-neutral-600">@{gw.domain}</td>
                            <td className="py-3 px-4 text-center font-mono">
                              {gw.totalComplaints} / {gw.resolvedCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {gw.isClaimed ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  Claimed
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5">
                                  Not claimed
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    isEditingGw ? setEditingGatewayId(null) : startEditGateway(gw)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900 font-medium"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{isEditingGw ? 'Close' : 'Edit Profile'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleProviderClaim(gw)}
                                  className="px-2.5 py-1 text-xs border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900 font-medium"
                                >
                                  {gw.isClaimed ? 'Mark Unclaimed' : 'Verify & Claim PG'}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline PG Profile Editor */}
                          {isEditingGw && (
                            <tr className="bg-[#FAF9F5] border-b border-neutral-300">
                              <td colSpan={5} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-950">
                                      Manage PG Profile Page: {gw.name}
                                    </span>
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editGwClaimed}
                                        onChange={(e) => setEditGwClaimed(e.target.checked)}
                                      />
                                      <span className="font-medium text-neutral-900">
                                        Profile Claimed &amp; Verified
                                      </span>
                                    </label>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                        Provider Name
                                      </label>
                                      <input
                                        type="text"
                                        value={editGwName}
                                        onChange={(e) => setEditGwName(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                        Official Corporate Domain (for PG Verification)
                                      </label>
                                      <input
                                        type="text"
                                        value={editGwDomain}
                                        onChange={(e) => setEditGwDomain(e.target.value)}
                                        className="w-full px-2.5 py-1.5 font-mono bg-white border border-neutral-300"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                        Website URL
                                      </label>
                                      <input
                                        type="text"
                                        value={editGwWebsite}
                                        onChange={(e) => setEditGwWebsite(e.target.value)}
                                        className="w-full px-2.5 py-1.5 font-mono bg-white border border-neutral-300"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                      Public Profile Description
                                    </label>
                                    <input
                                      type="text"
                                      value={editGwDescription}
                                      onChange={(e) => setEditGwDescription(e.target.value)}
                                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                                      Official Support &amp; Escalation Matrix
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={editGwEscalation}
                                      onChange={(e) => setEditGwEscalation(e.target.value)}
                                      className="w-full px-2.5 py-1.5 font-mono bg-white border border-neutral-300"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingGatewayId(null)}
                                      className="px-3 py-1.5 text-xs border border-neutral-300 bg-white text-neutral-700"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingGateway}
                                      onClick={() => handleSaveGateway(gw.id)}
                                      className="inline-flex items-center gap-1 px-4 py-1.5 text-xs bg-neutral-950 text-white font-medium hover:bg-neutral-800"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>
                                        {savingGateway ? 'Saving...' : 'Save PG Profile Page'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
