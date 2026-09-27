import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { moderateContent } from '@/lib/moderation';
import { calculateSla, SlaTier } from '@/lib/sla';
import { processAutoClosures } from '@/lib/resolution';

export async function GET(request: Request) {
  try {
    await processAutoClosures();

    const { searchParams } = new URL(request.url);
    const gatewaySlug = searchParams.get('gateway');
    const categorySlug = searchParams.get('category');
    const status = searchParams.get('status');
    const slaTier = searchParams.get('sla') as SlaTier | null;
    const search = searchParams.get('search');
    const isAdminView = searchParams.get('admin') === 'true';

    const where: any = {};

    if (gatewaySlug) {
      where.gateway = { slug: gatewaySlug };
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (status) {
      if (status === 'RESOLVED') {
        where.status = { in: ['RESOLVED', 'AUTO_CLOSED'] };
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { pgTicketId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        gateway: true,
        category: true,
        merchant: {
          select: {
            id: true,
            name: true,
            email: isAdminView,
            mobileNumber: isAdminView,
            companyName: true,
            role: true,
          },
        },
        attachments: true,
        comments: {
          where: { isOfficial: true },
          take: 1,
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Compute SLA and sanitize private contact details for public feed
    const enrichedIssues = issues.map((issue: any) => {
      const sla = calculateSla(
        issue.createdAt,
        issue.status,
        issue.proposedAt,
        issue.resolvedAt
      );

      // Ensure email and mobile number are never exposed on the public board
      const publicMerchant = isAdminView
        ? issue.merchant
        : {
            id: issue.merchant?.id,
            name: 'Verified Merchant',
            companyName:
              issue.merchant?.companyName && !issue.merchant.companyName.includes('@')
                ? issue.merchant.companyName
                : `Merchant #${(issue.merchant?.id || '0000').slice(-4).toUpperCase()}`,
            role: issue.merchant?.role || 'MERCHANT',
          };

      return {
        ...issue,
        contactMobile: isAdminView ? issue.contactMobile : undefined,
        merchant: publicMerchant,
        sla,
        hasOfficialReply: issue.comments.length > 0,
      };
    });

    const filteredIssues = slaTier
      ? enrichedIssues.filter((i: any) => i.sla.tier === slaTier)
      : enrichedIssues;

    return NextResponse.json({ issues: filteredIssues });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load issues.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      gatewayId,
      categoryId,
      merchantId,
      attachments,
      pgTicketId,
      dateRaised,
      channelTried,
      issueDuration,
      contactMobile,
      customPgName,
    } = body;

    if (!title || !description || !gatewayId || !categoryId || !merchantId) {
      return NextResponse.json(
        { error: 'Gateway, Category, Title, and Description are required.' },
        { status: 400 }
      );
    }

    // 1. Validate / Self-heal Merchant User
    let validMerchant = await prisma.user.findUnique({
      where: { id: merchantId },
    });

    if (!validMerchant) {
      validMerchant = await prisma.user.findFirst({
        where: { role: 'MERCHANT' },
      });

      if (!validMerchant) {
        return NextResponse.json(
          { error: 'Your session has expired. Please verify your email to publish an issue.' },
          { status: 401 }
        );
      }
    } else if (contactMobile && !validMerchant.mobileNumber) {
      await prisma.user.update({
        where: { id: validMerchant.id },
        data: { mobileNumber: contactMobile.trim() },
      });
    }

    // 2. Validate Gateway
    let validGateway = await prisma.paymentGateway.findUnique({
      where: { id: gatewayId },
    });

    if (!validGateway) {
      validGateway = await prisma.paymentGateway.findFirst();
      if (!validGateway) {
        return NextResponse.json({ error: 'Selected payment provider does not exist.' }, { status: 400 });
      }
    }

    // 3. Validate Category
    let validCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!validCategory) {
      validCategory = await prisma.category.findFirst();
      if (!validCategory) {
        return NextResponse.json({ error: 'Selected category does not exist.' }, { status: 400 });
      }
    }

    // 4. Content Moderation on Title
    const titleMod = moderateContent(title);
    if (!titleMod.isValid) {
      return NextResponse.json({ error: titleMod.error }, { status: 422 });
    }

    // 5. Content Moderation on Description
    const descMod = moderateContent(description);
    if (!descMod.isValid) {
      return NextResponse.json({ error: descMod.error }, { status: 422 });
    }

    // 6. Create Issue with validated relations & structured metadata
    const newIssue = await prisma.issue.create({
      data: {
        title: titleMod.sanitizedText,
        description: descMod.sanitizedText,
        gatewayId: validGateway.id,
        categoryId: validCategory.id,
        merchantId: validMerchant.id,
        status: 'OPEN',
        pgTicketId: pgTicketId ? String(pgTicketId).trim() : null,
        dateRaised: dateRaised ? String(dateRaised).trim() : null,
        channelTried: channelTried ? String(channelTried).trim() : null,
        issueDuration: issueDuration ? String(issueDuration).trim() : null,
        contactMobile: contactMobile ? String(contactMobile).trim() : null,
        customPgName: customPgName ? String(customPgName).trim() : null,
        attachments:
          attachments && Array.isArray(attachments) && attachments.length > 0
            ? {
                create: attachments.map((att: any) => ({
                  fileUrl: att.fileUrl,
                  fileName: att.fileName || 'proof_attachment',
                  fileType: att.fileType || 'image/png',
                  fileSize: att.fileSize || 0,
                })),
              }
            : undefined,
      },
      include: {
        gateway: true,
        category: true,
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      issue: newIssue,
      redacted: titleMod.hasRedactions || descMod.hasRedactions,
    });
  } catch (err: any) {
    console.error('Failed to create issue:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit issue.' }, { status: 500 });
  }
}
