import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSla } from '@/lib/sla';
import { canNudge, processAutoClosures } from '@/lib/resolution';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await processAutoClosures();

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        gateway: true,
        category: true,
        merchant: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            role: true,
            domain: true,
          },
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                companyName: true,
                domain: true,
                isVerified: true,
              },
            },
          },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found.' }, { status: 404 });
    }

    const sla = calculateSla(
      issue.createdAt,
      issue.status,
      issue.proposedAt,
      issue.resolvedAt
    );

    const nudgeStatus = canNudge(issue.lastNudgedAt);

    return NextResponse.json({
      issue: {
        ...issue,
        sla,
        nudgeStatus,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load issue.' }, { status: 500 });
  }
}
