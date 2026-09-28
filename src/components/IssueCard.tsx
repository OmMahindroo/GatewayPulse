'use client';

import React from 'react';
import { SlaBadge } from './SlaBadge';

interface IssueCardProps {
  issue: any;
  onClick: () => void;
  onUpvote: (e: React.MouseEvent) => void;
}

export function IssueCard({ issue, onClick, onUpvote }: IssueCardProps) {
  return (
    <article
      onClick={onClick}
      className="p-4 sm:p-5 bg-white hover:bg-[#FAF9F5] cursor-pointer transition-colors space-y-3"
    >
      {/* Top Row: Case ID, Provider, Category, Official PG Response, SLA Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs">
          <span className="font-mono text-[11px] text-neutral-400">
            #{issue.id.slice(-6).toUpperCase()}
          </span>
          <span className="font-semibold text-neutral-950 tracking-tight">
            {issue.customPgName || issue.gateway.name}
          </span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-600">{issue.category.name}</span>

          {issue.hasOfficialReply && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-neutral-900 text-white ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Official PG Response
            </span>
          )}
        </div>

        {issue.sla && <SlaBadge sla={issue.sla} />}
      </div>

      {/* Middle: Issue Title & Readable Sans-Serif Description */}
      <div>
        <h3 className="text-sm sm:text-[15px] font-semibold text-neutral-950 leading-snug">
          {issue.title}
        </h3>
        <p className="text-xs sm:text-[13px] text-neutral-600 line-clamp-2 mt-1 leading-relaxed">
          {issue.description}
        </p>
      </div>

      {/* Bottom Row: Structured Case Facts & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-neutral-100 text-[11px] text-neutral-500">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
          <span className="text-neutral-700">
            {issue.merchant?.companyName || issue.merchant?.name || 'Verified Merchant'}
          </span>
          <span className="text-neutral-300">·</span>
          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>

          {issue.issueDuration && (
            <>
              <span className="text-neutral-300">·</span>
              <span>Duration: {issue.issueDuration}</span>
            </>
          )}

          {issue.channelTried && (
            <>
              <span className="text-neutral-300 hidden sm:inline">·</span>
              <span className="hidden sm:inline">Channel: {issue.channelTried}</span>
            </>
          )}

          {issue.attachments && issue.attachments.length > 0 && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="text-neutral-700 underline decoration-neutral-300">
                {issue.attachments.length} proof file{issue.attachments.length > 1 ? 's' : ''}
              </span>
            </>
          )}

          {issue.nudgeCount > 0 && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="text-amber-800">Nudged {issue.nudgeCount}x</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
          <span className="text-neutral-500">
            {issue._count?.comments || 0} {issue._count?.comments === 1 ? 'reply' : 'replies'}
          </span>

          <button
            type="button"
            onClick={onUpvote}
            className="px-2.5 py-1 border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900 hover:text-neutral-950 transition-colors"
          >
            I have the same issue ({issue.upvotesCount})
          </button>
        </div>
      </div>
    </article>
  );
}
