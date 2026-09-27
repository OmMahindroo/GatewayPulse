import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTO_CLOSE_WINDOW_MS } from '@/lib/resolution';
import nodemailer from 'nodemailer';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, userId, resolutionNotes, disputeReason, followupStatus } = await request.json();

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { gateway: true, merchant: true, category: true },
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
          authorId: userId || issue.merchantId,
          content: `Official PG Response - Resolution Proposed:\n${resolutionNotes.trim()}\n\nNote: The merchant has 48 hours to verify this resolution. If no action is taken, the ticket will be auto-closed.`,
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
          followup48hStatus: 'YES_RESOLVED',
        },
      });

      await prisma.comment.create({
        data: {
          issueId: issue.id,
          authorId: userId || issue.merchantId,
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
          followup48hStatus: 'STILL_UNRESOLVED',
        },
      });

      await prisma.comment.create({
        data: {
          issueId: issue.id,
          authorId: userId || issue.merchantId,
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

    // 48-Hour Resolution Follow-Up ("Yes, resolved" | "Still unresolved" | "No update")
    if (action === 'followup_48h') {
      if (!['YES_RESOLVED', 'STILL_UNRESOLVED', 'NO_UPDATE'].includes(followupStatus)) {
        return NextResponse.json({ error: 'Invalid follow-up status.' }, { status: 400 });
      }

      const isResolved = followupStatus === 'YES_RESOLVED';
      const updated = await prisma.issue.update({
        where: { id: params.id },
        data: {
          followup48hStatus: followupStatus,
          status: isResolved ? 'RESOLVED' : issue.status === 'RESOLVED' ? 'OPEN' : issue.status,
          resolvedAt: isResolved ? now : issue.resolvedAt,
        },
      });

      const statusLabel =
        followupStatus === 'YES_RESOLVED'
          ? 'Yes, resolved (Merchant confirmed the payment issue has been resolved)'
          : followupStatus === 'STILL_UNRESOLVED'
          ? 'Still unresolved (Merchant reported the issue remains unresolved after 48h check-in)'
          : 'No update (Merchant reported no response or update received yet)';

      await prisma.comment.create({
        data: {
          issueId: issue.id,
          authorId: userId || issue.merchantId,
          content: `48-Hour Status Update: ${statusLabel}`,
          isOfficial: false,
          isPinned: false,
        },
      });

      return NextResponse.json({
        success: true,
        issue: updated,
        message: `48-hour follow-up recorded: ${statusLabel}`,
      });
    }

    // Admin / System action to dispatch 48-Hour Resolution Follow-Up Email to Merchant
    if (action === 'send_48h_email') {
      const merchantEmail = issue.merchant?.email;
      if (!merchantEmail) {
        return NextResponse.json({ error: 'No email found for reporting merchant.' }, { status: 400 });
      }

      const smtpUser = process.env.SMTP_USER?.trim();
      const smtpPass = process.env.SMTP_PASS?.trim();
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gatewaypulse.netlify.app';

      if (smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass },
        });

        const htmlBody = `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:24px;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
              <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:28px;">
                <div style="border-bottom:1px solid #f3f4f6;padding-bottom:14px;margin-bottom:20px;">
                  <span style="font-size:16px;font-weight:700;color:#111827;">GatewayPulse</span>
                  <span style="font-size:12px;color:#6b7280;margin-left:8px;font-family:monospace;">48-Hour Resolution Follow-Up</span>
                </div>
                <h2 style="font-size:17px;font-weight:600;margin:0 0 10px 0;color:#111827;">
                  Has your payment issue been resolved?
                </h2>
                <p style="font-size:13px;color:#4b5563;line-height:1.5;margin:0 0 16px 0;">
                  You recently reported an issue regarding <strong>${issue.gateway.name}</strong> (${issue.category.name}):
                  <br/><em>"${issue.title}"</em>
                </p>
                <p style="font-size:13px;color:#374151;margin:0 0 20px 0;">
                  Please update the public board with your latest status so the ecosystem stays accurate:
                </p>
                <div style="margin:20px 0;">
                  <a href="${siteUrl}" style="display:inline-block;padding:10px 16px;background-color:#065f46;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;margin-right:8px;">
                    Yes, resolved
                  </a>
                  <a href="${siteUrl}" style="display:inline-block;padding:10px 16px;background-color:#92400e;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;margin-right:8px;">
                    Still unresolved
                  </a>
                  <a href="${siteUrl}" style="display:inline-block;padding:10px 16px;background-color:#374151;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">
                    No update
                  </a>
                </div>
                <p style="font-size:11px;color:#6b7280;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:14px;">
                  Payment Provider Issues. Reported. Tracked. Made Transparent.
                </p>
              </div>
            </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"GatewayPulse Follow-Up" <${smtpUser}>`,
          to: merchantEmail,
          subject: `48h Check-in: Has your ${issue.gateway.name} issue been resolved?`,
          html: htmlBody,
        });

        return NextResponse.json({
          success: true,
          emailSent: true,
          message: `48-hour follow-up email dispatched to ${merchantEmail}.`,
        });
      }

      return NextResponse.json({
        success: true,
        emailSent: false,
        message: `48-hour follow-up check triggered for ${merchantEmail}.`,
      });
    }

    return NextResponse.json({ error: 'Invalid resolution action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Resolution action failed.' }, { status: 500 });
  }
}
