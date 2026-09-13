'use client';

import React from 'react';
import {
  Building2,
  Layers,
  MessageSquare,
  ThumbsUp,
  FileText,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import { SlaBadge } from './SlaBadge';

interface IssueCardProps {
  issue: any;
  onClick: () => void;
  onUpvote: (e: React.MouseEvent) => void;
}

export function IssueCard({ issue, onClick, onUpvote }: IssueCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-3.5 sm:p-4 border border-neutral-200 rounded-md bg-white hover:border-neutral-400 hover:shadow-sm cursor-pointer transition-all space-y-2.5"
    >
      {/* Top Row: Gateway, Category, SLA Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
            <Building2 className="w-3 h-3 text-neutral-500 shrink-0" />
            {issue.gateway.name}
          </span>
          <span className="inline-flex items-center gap-1 text-neutral-600 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-md">
            <Layers className="w-3 h-3 text-neutral-400 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">{issue.category.name}</span>
          </span>
          {issue.hasOfficialReply && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-sky-600 shrink-0" />
              Official Reply
            </span>
          )}
        </div>

        {issue.sla && <SlaBadge sla={issue.sla} />}
      </div>

      {/* Middle: Title & preview */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 sm:line-clamp-1">
          {issue.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-neutral-600 line-clamp-2 mt-1 leading-relaxed font-mono">
          {issue.description}
        </p>
      </div>

      {/* Bottom row: Reporter, Attachments, Nudge, Comments, Upvote */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-neutral-500 pt-2 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="truncate max-w-[120px] sm:max-w-none font-medium text-neutral-700">
            {issue.merchant.companyName || issue.merchant.name || 'Merchant'}
          </span>
          <span>•</span>
          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>

          {issue.attachments && issue.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-500">
              <FileText className="w-3 h-3 shrink-0" />
              {issue.attachments.length} proof
            </span>
          )}

          {issue.nudgeCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-mono">
              <BellRing className="w-2.5 h-2.5 text-amber-600 shrink-0" />
              Nudged {issue.nudgeCount}x
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
            <MessageSquare className="w-3 h-3 text-neutral-400 shrink-0" />
            {issue._count?.comments || 0}
          </span>

          <button
            type="button"
            onClick={onUpvote}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <ThumbsUp className="w-3 h-3 text-neutral-500 shrink-0" />
            <span>{issue.upvotesCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
