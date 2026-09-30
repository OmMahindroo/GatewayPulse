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

// Admin endpoint to update Ticket ID, Status, Title, Category, or Escalation Metadata
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      status,
      pgTicketId,
      dateRaised,
      channelTried,
      issueDuration,
      gatewayId,
      categoryId,
    } = body;

    const updateData: any = {};
    if (typeof title === 'string' && title.trim()) updateData.title = title.trim();
    if (typeof description === 'string' && description.trim()) updateData.description = description.trim();
    if (typeof pgTicketId !== 'undefined') updateData.pgTicketId = pgTicketId ? String(pgTicketId).trim() : null;
    if (typeof dateRaised !== 'undefined') updateData.dateRaised = dateRaised ? String(dateRaised).trim() : null;
    if (typeof channelTried !== 'undefined') updateData.channelTried = channelTried ? String(channelTried).trim() : null;
    if (typeof issueDuration !== 'undefined') updateData.issueDuration = issueDuration ? String(issueDuration).trim() : null;
    if (typeof gatewayId === 'string' && gatewayId) updateData.gatewayId = gatewayId;
    if (typeof categoryId === 'string' && categoryId) updateData.categoryId = categoryId;

    if (typeof status === 'string' && status) {
      updateData.status = status;
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
        updateData.followup48hStatus = 'YES_RESOLVED';
      } else if (status === 'OPEN' || status === 'INVESTIGATING') {
        updateData.resolvedAt = null;
      }
    }

    const updated = await prisma.issue.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      issue: updated,
      message: `Case #${params.id.slice(-6).toUpperCase()} updated successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update issue.' }, { status: 500 });
  }
}

// Admin endpoint to permanently delete a submission
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete associated comments, attachments, and followers first (in case cascade isn't enforced on all relations)
    await prisma.comment.deleteMany({ where: { issueId: params.id } });
    await prisma.attachment.deleteMany({ where: { issueId: params.id } });
    await prisma.issueFollow.deleteMany({ where: { issueId: params.id } });

    await prisma.issue.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `Submission #${params.id.slice(-6).toUpperCase()} permanently deleted.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete issue.' }, { status: 500 });
  }
}
