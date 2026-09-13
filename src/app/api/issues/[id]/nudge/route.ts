import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canNudge } from '@/lib/resolution';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { gateway: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found.' }, { status: 404 });
    }

    if (issue.status === 'RESOLVED' || issue.status === 'AUTO_CLOSED') {
      return NextResponse.json({ error: 'Cannot nudge an already resolved issue.' }, { status: 400 });
    }

    const { allowed, remainingMs } = canNudge(issue.lastNudgedAt);

    if (!allowed) {
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return NextResponse.json(
        {
          error: `Follow-up nudge rate limit active. Please wait ${remainingHours} hours before nudging again.`,
          remainingMs,
        },
        { status: 429 }
      );
    }

    const newNudgeCount = issue.nudgeCount + 1;
    const now = new Date();

    const updatedIssue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        nudgeCount: newNudgeCount,
        lastNudgedAt: now,
      },
    });

    // Create a system timeline audit entry
    await prisma.comment.create({
      data: {
        issueId: issue.id,
        authorId: userId || issue.merchantId,
        content: `Follow-up escalation logged (Nudge #${newNudgeCount}). Notification queued for ${issue.gateway.name} support operations.`,
        isOfficial: false,
        isPinned: false,
      },
    });

    return NextResponse.json({
      success: true,
      nudgeCount: updatedIssue.nudgeCount,
      lastNudgedAt: updatedIssue.lastNudgedAt,
      message: `Follow-up #${newNudgeCount} sent to ${issue.gateway.name}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit follow-up.' }, { status: 500 });
  }
}
