import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Generate 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    await prisma.otpToken.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    console.log(`[AUTH OTP] Passcode generated for ${cleanEmail}: ${code}`);

    // Check if Resend is configured
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'GatewayPulse <onboarding@resend.dev>';

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [cleanEmail],
          subject: `GatewayPulse Verification Code: ${code}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Verification Code</title>
              </head>
              <body style="margin:0;padding:24px;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
                <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                  <div style="border-bottom:1px solid #f3f4f6;padding-bottom:16px;margin-bottom:24px;">
                    <span style="font-size:16px;font-weight:700;letter-spacing:-0.5px;color:#111827;">GatewayPulse</span>
                    <span style="font-size:12px;color:#6b7280;margin-left:8px;font-family:monospace;">PG Incident Registry</span>
                  </div>
                  
                  <h1 style="font-size:18px;font-weight:600;margin:0 0 12px 0;color:#111827;">Your Verification Passcode</h1>
                  <p style="font-size:14px;color:#4b5563;margin:0 0 24px 0;line-height:1.5;">
                    Use the following one-time code to authenticate your session on GatewayPulse. This code is valid for 10 minutes.
                  </p>
                  
                  <div style="text-align:center;margin:28px 0;">
                    <div style="display:inline-block;padding:12px 28px;background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;font-family:monospace;font-size:28px;font-weight:700;letter-spacing:8px;color:#111827;">
                      ${code}
                    </div>
                  </div>
                  
                  <p style="font-size:12px;color:#6b7280;margin:24px 0 0 0;line-height:1.4;border-top:1px solid #f3f4f6;padding-top:16px;">
                    If you did not request this verification code, you can safely ignore this email. Do not share this code with anyone.
                  </p>
                </div>
              </body>
            </html>
          `,
        });

        if (error) {
          console.error('[AUTH OTP] Resend API error:', error);
          return NextResponse.json({
            success: true,
            emailSent: false,
            message: `Could not deliver to ${cleanEmail} via Resend (${error.message}). Using dev code fallback.`,
            devCode: code,
          });
        }

        console.log(`[AUTH OTP] Email dispatched successfully to ${cleanEmail} (ID: ${data?.id})`);
        return NextResponse.json({
          success: true,
          emailSent: true,
          message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
        });
      } catch (sendErr: any) {
        console.error('[AUTH OTP] Error invoking Resend:', sendErr);
        return NextResponse.json({
          success: true,
          emailSent: false,
          message: `Email dispatch failed: ${sendErr.message}. Using dev code fallback.`,
          devCode: code,
        });
      }
    }

    // No API key configured: fallback to local simulation
    return NextResponse.json({
      success: true,
      emailSent: false,
      message: `Passcode generated in local mode (RESEND_API_KEY not configured).`,
      devCode: code,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send OTP.' }, { status: 500 });
  }
}
