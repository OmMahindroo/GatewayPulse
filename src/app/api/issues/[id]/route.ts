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
            companyName: true,
            role: true,
          },
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
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

    // Anonymize merchant display name if it contains an email prefix
    const publicMerchant = {
      id: issue.merchant?.id,
      name: 'Verified Merchant',
      companyName:
        issue.merchant?.companyName && !issue.merchant.companyName.includes('@')
          ? issue.merchant.companyName
          : `Merchant #${(issue.merchant?.id || '0000').slice(-4).toUpperCase()}`,
      role: issue.merchant?.role || 'MERCHANT',
    };

    const sanitizedComments = (issue.comments || []).map((c: any) => ({
      ...c,
      author: c.isOfficial
        ? c.author
        : {
            ...c.author,
            name: 'Verified Merchant',
            companyName:
              c.author?.companyName && !c.author.companyName.includes('@')
                ? c.author.companyName
                : `Merchant #${(c.author?.id || '0000').slice(-4).toUpperCase()}`,
          },
    }));

    return NextResponse.json({
      issue: {
        ...issue,
        contactMobile: undefined,
        merchant: publicMerchant,
        comments: sanitizedComments,
        sla,
        nudgeStatus,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load issue.' }, { status: 500 });
  }
}
