import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTO_CLOSE_WINDOW_MS } from '@/lib/resolution';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, userId, resolutionNotes, disputeReason } = await request.json();

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { gateway: true, merchant: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found.' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'propose') {
      if (!resolutionNotes || !resolutionNotes.trim()) {
        return NextResponse.json(
          { error: 'Please provide resolution details explaining the fix or action taken.' },
          { status: 400 }
        );
      }

      const autoCloseAt = new Date(now.getTime() + AUTO_CLOSE_WINDOW_MS);

      const updated = await prisma.issue.update({
        where: { id: params.id },
        data: {
          status: 'PROPOSED_RESOLUTION',
          resolutionNotes: resolutionNotes.trim(),
          proposedAt: now,
          autoCloseAt,
        },
      });

      // Post pinned official comment
      await prisma.comment.create({
        data: {
          issueId: issue.id,
          authorId: userId,
          content: `Official Resolution Proposed:\n${resolutionNotes.trim()}\n\nNote: The merchant has 48 hours to verify this resolution. If no action is taken, the ticket will be auto-closed.`,
          isOfficial: true,
          isPinned: true,
        },
      });

      return NextResponse.json({
        success: true,
        issue: updated,
        message: 'Resolution proposed. 48-hour confirmation timer initiated.',
      });
    }

    if (action === 'confirm') {
      const updated = await prisma.issue.update({
        where: { id: params.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
        },
      });

      await prisma.comment.create({
        data: {
          issueId: issue.id,
          authorId: userId,
          content: 'Resolution confirmed by merchant. Issue closed successfully.',
          isOfficial: false,
          isPinned: false,
        },
      });

      return NextResponse.json({
        success: true,
        issue: updated,
        message: 'Resolution confirmed. Ticket closed.',
      });
    }

    if (action === 'dispute') {
      const updated = await prisma.issue.update({
        where: { id: params.id },
        data: {
          status: 'DISPUTED',
          autoCloseAt: null,
        },
      });

      await prisma.comment.create({
        data: {
          issueId: issue.id,
          authorId: userId,
          content: `Resolution disputed by merchant:\n${disputeReason || 'The problem remains unresolved in our environment.'}`,
          isOfficial: false,
          isPinned: false,
        },
      });

      return NextResponse.json({
        success: true,
        issue: updated,
        message: 'Resolution disputed. Ticket reopened for gateway review.',
      });
    }

    return NextResponse.json({ error: 'Invalid resolution action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Resolution action failed.' }, { status: 500 });
  }
}
