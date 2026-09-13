import { prisma } from './prisma';

export const AUTO_CLOSE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
export const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function processAutoClosures(): Promise<number> {
  const now = new Date();
  
  // Find issues where PG proposed resolution and 48 hours have elapsed without merchant dispute
  const expiredIssues = await prisma.issue.findMany({
    where: {
      status: 'PROPOSED_RESOLUTION',
      autoCloseAt: {
        lte: now,
      },
    },
  });

  for (const issue of expiredIssues) {
    await prisma.issue.update({
      where: { id: issue.id },
      data: {
        status: 'AUTO_CLOSED',
        // Freeze SLA at the proposedAt timestamp
        resolvedAt: issue.proposedAt ?? now,
      },
    });

    // Add a system audit comment
    await prisma.comment.create({
      data: {
        issueId: issue.id,
        authorId: issue.merchantId, // Attributed to system workflow
        content: 'Issue was automatically closed after 48 hours of inactivity following the payment gateway resolution proposal. The SLA turnaround time has been recorded up to the gateway response timestamp.',
        isOfficial: false,
        isPinned: false,
      },
    });
  }

  return expiredIssues.length;
}

export function canNudge(lastNudgedAt: Date | string | null | undefined): {
  allowed: boolean;
  remainingMs: number;
} {
  if (!lastNudgedAt) {
    return { allowed: true, remainingMs: 0 };
  }

  const lastTime = new Date(lastNudgedAt).getTime();
  const elapsed = Date.now() - lastTime;
  const remainingMs = NUDGE_COOLDOWN_MS - elapsed;

  return {
    allowed: remainingMs <= 0,
    remainingMs: Math.max(0, remainingMs),
  };
}
