'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Layers,
  Clock,
  Send,
  ThumbsUp,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ZoomIn,
  Download,
  Eye,
  FileImage,
} from 'lucide-react';
import { SlaBadge } from './SlaBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { AuthSession } from '@/lib/auth';

interface IssueDetailModalProps {
  issueId: string | null;
  currentUser: AuthSession | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onRefreshList: () => void;
}

export function IssueDetailModal({
  issueId,
  currentUser,
  onClose,
  onRequireAuth,
  onRefreshList,
}: IssueDetailModalProps) {
  const [issue, setIssue] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentFilter, setCommentFilter] = useState<'ALL' | 'OFFICIAL'>('ALL');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  // Resolution state
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeImagePreview, setActiveImagePreview] = useState<{
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string;
  } | null>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeImagePreview) {
        setActiveImagePreview(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImagePreview]);

  const handleDownloadAttachment = (fileUrl: string, fileName: string) => {
    try {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName || 'evidence_attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(fileUrl, '_blank');
    }
  };

  const fetchIssue = async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load issue');
      setIssue(data.issue);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchIssue();
    }
  }, [issueId]);

  if (!issueId) return null;

  const isMerchantAuthor = currentUser && issue && currentUser.userId === issue.merchantId;
  const isAuthorizedPgRep =
    currentUser &&
    issue &&
    currentUser.role === 'PG_SUPPORT' &&
    currentUser.domain?.toLowerCase() === issue.gateway.domain.toLowerCase();

  const handleUpvote = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    try {
      const res = await fetch(`/api/issues/${issue.id}/upvote`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIssue((prev: any) => ({ ...prev, upvotesCount: data.upvotesCount }));
        onRefreshList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNudge = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    setNudging(true);
    setNudgeMessage(null);

    try {
      const res = await fetch(`/api/issues/${issue.id}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Nudge failed.');
      }

      setNudgeMessage(data.message);
      fetchIssue();
      onRefreshList();
    } catch (err: any) {
      setNudgeMessage(err.message);
    } finally {
      setNudging(false);
    }
  };

  const handleProposeResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;

    setResolving(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'propose',
          userId: currentUser?.userId,
          resolutionNotes: resolutionNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to propose resolution');
      setShowProposeForm(false);
      setResolutionNotes('');
      fetchIssue();
      onRefreshList();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleConfirmResolution = async () => {
    setResolving(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          userId: currentUser?.userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm resolution');
      fetchIssue();
      onRefreshList();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleDisputeResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    setResolving(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispute',
          userId: currentUser?.userId,
          disputeReason: disputeReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispute resolution');
      setShowDisputeForm(false);
      setDisputeReason('');
      fetchIssue();
      onRefreshList();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          authorId: currentUser.userId,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post reply.');
      }

      setCommentText('');
      fetchIssue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const filteredComments = issue?.comments
    ? commentFilter === 'OFFICIAL'
      ? issue.comments.filter((c: any) => c.isOfficial)
      : issue.comments
    : [];

  const officialCommentCount = issue?.comments
    ? issue.comments.filter((c: any) => c.isOfficial).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div className="w-full max-w-3xl bg-white rounded-md border border-neutral-300 shadow-2xl overflow-hidden max-h-[94vh] sm:max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 sm:px-6 py-3.5 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
              #{issue?.id ? issue.id.slice(-6) : '...'}
            </span>
            {issue?.sla && <SlaBadge sla={issue.sla} />}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && !issue ? (
          <div className="p-12 text-center text-xs text-neutral-500">Loading issue details...</div>
        ) : error ? (
          <div className="p-6 text-xs text-red-700 bg-red-50">{error}</div>
        ) : issue ? (
          <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1">
            {/* Title & Metadata */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 text-xs text-neutral-600">
                <span className="inline-flex items-center gap-1 font-medium text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
                  <Building2 className="w-3 h-3 text-neutral-500" />
                  {issue.gateway.name}
                </span>
                <span className="inline-flex items-center gap-1 text-neutral-700 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-md">
                  <Layers className="w-3 h-3 text-neutral-400" />
                  {issue.category.name}
                </span>
                <span className="text-neutral-400">•</span>
                <span className="truncate max-w-[130px] sm:max-w-none">
                  By {issue.merchant.companyName || issue.merchant.name || 'Merchant'}
                </span>
                <span className="text-neutral-400">•</span>
                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>

              <h1 className="text-base sm:text-lg font-semibold text-neutral-900 leading-snug">{issue.title}</h1>
            </div>

            {/* Problem Description */}
            <div className="p-4 bg-neutral-50 rounded-md border border-neutral-200 text-xs text-neutral-800 leading-relaxed whitespace-pre-line font-mono">
              {issue.description}
            </div>

            {/* Attachments / Proof */}
            {issue.attachments && issue.attachments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-neutral-500" />
                    Attached Evidence & Screenshots ({issue.attachments.length})
                  </h3>
                  <span className="text-[11px] text-neutral-500">Click any image to inspect full size</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {issue.attachments.map((att: any) => {
                    const isImage =
                      att.fileType?.startsWith('image/') ||
                      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.fileName || '') ||
                      (typeof att.fileUrl === 'string' && att.fileUrl.startsWith('data:image/'));

                    if (isImage) {
                      return (
                        <div
                          key={att.id}
                          className="border border-neutral-200 rounded-md bg-white overflow-hidden shadow-sm hover:border-neutral-300 transition-all flex flex-col group"
                        >
                          {/* Image Thumbnail with Click-to-Enlarge */}
                          <div
                            onClick={() => setActiveImagePreview(att)}
                            className="relative aspect-video w-full bg-neutral-100 cursor-pointer overflow-hidden flex items-center justify-center border-b border-neutral-200"
                            title="Click to view full size"
                          >
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/30 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-1 bg-neutral-900/80 text-white text-[11px] font-medium rounded-md shadow-sm">
                                <ZoomIn className="w-3 h-3" />
                                Inspect Proof
                              </span>
                            </div>
                          </div>

                          {/* Card Details & Actions */}
                          <div className="p-2.5 flex items-center justify-between gap-2 text-xs bg-neutral-50/70">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-[11px] text-neutral-900 truncate font-medium" title={att.fileName}>
                                {att.fileName}
                              </p>
                              {att.fileSize > 0 && (
                                <p className="text-[10px] text-neutral-500 font-mono">
                                  {(att.fileSize / 1024).toFixed(0)} KB
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveImagePreview(att)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-[11px] font-medium transition-colors"
                                title="View Full Size"
                              >
                                <Eye className="w-3 h-3 text-neutral-600" />
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(att.fileUrl, att.fileName)}
                                className="inline-flex items-center p-1 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-[11px] transition-colors"
                                title="Download file"
                              >
                                <Download className="w-3 h-3 text-neutral-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={att.id}
                        className="border border-neutral-200 rounded-md bg-white p-3 shadow-sm hover:border-neutral-300 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-neutral-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-[11px] text-neutral-900 truncate font-medium" title={att.fileName}>
                              {att.fileName}
                            </p>
                            <p className="text-[10px] text-neutral-500 uppercase">
                              {att.fileType || 'Document'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att.fileUrl, att.fileName)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-[11px] font-medium transition-colors"
                          >
                            <Download className="w-3 h-3 text-neutral-600" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Bar: Upvote & Follow-up Nudge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-neutral-100/70 border border-neutral-200 rounded-md text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleUpvote}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 font-medium transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Me Too ({issue.upvotesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={handleNudge}
                  disabled={nudging || !issue.nudgeStatus?.allowed || issue.status === 'RESOLVED' || issue.status === 'AUTO_CLOSED'}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 font-medium disabled:opacity-50 transition-colors"
                  title={
                    !issue.nudgeStatus?.allowed
                      ? 'Nudge rate limit active. 1 nudge permitted per 24 hours.'
                      : 'Send a follow-up reminder to gateway support'
                  }
                >
                  <BellRing className="w-3.5 h-3.5 text-neutral-600" />
                  <span>
                    Nudge {issue.nudgeCount > 0 ? `(${issue.nudgeCount})` : ''}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-neutral-500">
                {issue.nudgeStatus?.allowed ? (
                  <span>Ready to nudge (24h cooldown reset)</span>
                ) : (
                  <span>Next follow-up available in {Math.ceil((issue.nudgeStatus?.remainingMs || 0) / (1000 * 60 * 60))}h</span>
                )}
              </div>
            </div>

            {nudgeMessage && (
              <div className="p-2.5 rounded-md bg-neutral-100 border border-neutral-200 text-xs text-neutral-800">
                {nudgeMessage}
              </div>
            )}

            {/* Resolution Handshake Banners */}
            {issue.status === 'PROPOSED_RESOLUTION' && (
              <div className="p-4 rounded-md bg-amber-50 border border-amber-300 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                      Gateway Proposed Resolution (Awaiting Confirmation)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-amber-800">
                    Auto-closes in 48 hours if uncontested
                  </span>
                </div>

                <div className="p-3 bg-white/80 rounded border border-amber-200 text-xs text-neutral-800 font-mono">
                  {issue.resolutionNotes || 'Gateway representative marked this ticket as resolved.'}
                </div>

                {isMerchantAuthor ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmResolution}
                      disabled={resolving}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                    >
                      {resolving ? 'Confirming...' : 'Confirm Resolution (Close Ticket)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisputeForm(!showDisputeForm)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 transition-colors"
                    >
                      Dispute (Still Broken)
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800">
                    Logged in as non-author. Only the reporting merchant can confirm or dispute this proposal.
                  </p>
                )}

                {showDisputeForm && (
                  <form onSubmit={handleDisputeResolution} className="pt-2 space-y-2">
                    <textarea
                      required
                      rows={2}
                      placeholder="Explain why the issue is still unresolved..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                    <button
                      type="submit"
                      disabled={resolving}
                      className="px-3 py-1 text-xs font-medium rounded-md bg-red-700 text-white hover:bg-red-800"
                    >
                      {resolving ? 'Submitting Dispute...' : 'Submit Dispute'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* PG Support Official Action Panel */}
            {isAuthorizedPgRep && issue.status !== 'RESOLVED' && issue.status !== 'AUTO_CLOSED' && (
              <div className="p-4 rounded-md bg-sky-50 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-700" />
                    <span className="text-xs font-semibold text-sky-900">
                      Official Representative Action ({issue.gateway.name})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProposeForm(!showProposeForm)}
                    className="text-xs font-medium text-sky-800 underline hover:text-sky-900"
                  >
                    {showProposeForm ? 'Cancel' : 'Propose Resolution'}
                  </button>
                </div>

                {showProposeForm && (
                  <form onSubmit={handleProposeResolution} className="space-y-2 pt-2">
                    <label className="block text-xs font-medium text-sky-900">
                      Resolution Summary & Verification Steps
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g., Settlement batch #4402 reprocessed. Funds cleared via IMPS at 14:00 IST. Webhook replay enabled."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-sky-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-sky-700 text-neutral-900"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-sky-700">
                        Initiates 48-hour confirmation clock and halts the SLA timer at current time.
                      </p>
                      <button
                        type="submit"
                        disabled={resolving}
                        className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-sky-800 text-white hover:bg-sky-900"
                      >
                        {resolving ? 'Submitting...' : 'Submit Resolution'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Comments & Discussion */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                  Discussion & Updates ({issue.comments.length})
                </h3>

                {/* Filter Toggle */}
                <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-md border border-neutral-200 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCommentFilter('ALL')}
                    className={`px-2 py-0.5 rounded-sm transition-colors ${
                      commentFilter === 'ALL'
                        ? 'bg-white text-neutral-900 font-medium shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    All ({issue.comments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentFilter('OFFICIAL')}
                    className={`px-2 py-0.5 rounded-sm transition-colors ${
                      commentFilter === 'OFFICIAL'
                        ? 'bg-white text-neutral-900 font-medium shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Official PG ({officialCommentCount})
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {filteredComments.length === 0 ? (
                  <div className="p-4 rounded-md bg-neutral-50 border border-neutral-200 text-center text-xs text-neutral-500">
                    No replies matching this filter yet.
                  </div>
                ) : (
                  filteredComments.map((cmt: any) => (
                    <div
                      key={cmt.id}
                      className={`p-3.5 rounded-md border text-xs space-y-1.5 ${
                        cmt.isOfficial
                          ? 'bg-sky-50/60 border-sky-300'
                          : 'bg-white border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900">
                            {cmt.author.companyName || cmt.author.name || 'Merchant'}
                          </span>
                          {cmt.isOfficial && (
                            <VerifiedBadge
                              companyName={issue.gateway.name}
                              domain={cmt.author.domain}
                            />
                          )}
                          {cmt.authorId === issue.merchantId && !cmt.isOfficial && (
                            <span className="text-[10px] font-mono uppercase bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded">
                              Author (OP)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {new Date(cmt.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-neutral-800 leading-relaxed whitespace-pre-line font-mono text-[11px]">
                        {cmt.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-2 space-y-2">
                <textarea
                  rows={3}
                  required
                  placeholder={
                    currentUser
                      ? isAuthorizedPgRep
                        ? `Post an official update as ${issue.gateway.name} Representative...`
                        : 'Share your troubleshooting insight or experience...'
                      : 'Please sign in to join the discussion.'
                  }
                  value={commentText}
                  disabled={!currentUser || submittingComment}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 text-neutral-900"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-neutral-500">
                    No vulgarity allowed. Card numbers and API secrets are automatically redacted.
                  </p>
                  {currentUser ? (
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>{submittingComment ? 'Posting...' : 'Post Reply'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onRequireAuth}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                    >
                      Sign In to Reply
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>

      {/* Lightbox / Fullscreen Image Proof Viewer */}
      {activeImagePreview && (
        <div
          className="fixed inset-0 z-[70] bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setActiveImagePreview(null)}
        >
          <div
            className="bg-white border border-neutral-300 rounded-md shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 bg-neutral-50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                <span className="font-mono text-xs font-semibold text-neutral-900 truncate">
                  {activeImagePreview.fileName}
                </span>
                {activeImagePreview.fileSize && activeImagePreview.fileSize > 0 ? (
                  <span className="text-[10px] text-neutral-500 font-mono">
                    ({(activeImagePreview.fileSize / 1024).toFixed(0)} KB)
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(activeImagePreview.fileUrl, activeImagePreview.fileName)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImagePreview(null)}
                  className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Container */}
            <div className="p-3 sm:p-5 overflow-auto flex-1 flex items-center justify-center bg-neutral-900/5">
              <img
                src={activeImagePreview.fileUrl}
                alt={activeImagePreview.fileName}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded border border-neutral-200 bg-white shadow-sm"
              />
            </div>

            {/* Lightbox Footer Note */}
            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200 text-center text-[11px] text-neutral-500 shrink-0">
              Verified Merchant Evidence Proof • Click anywhere outside or press Esc to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
