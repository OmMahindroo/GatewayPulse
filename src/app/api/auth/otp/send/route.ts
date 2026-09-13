import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>GatewayPulse Verification</title>
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
            
            <div style="background-color:#fefce8;border:1px solid #fef08a;border-radius:4px;padding:12px;margin:20px 0;font-size:12px;color:#854d0e;">
              <strong>Security Note:</strong> GatewayPulse will never call or ask you for your merchant API keys or banking credentials.
            </div>

            <p style="font-size:12px;color:#6b7280;margin:24px 0 0 0;line-height:1.4;border-top:1px solid #f3f4f6;padding-top:16px;">
              If you did not request this verification code, you can safely ignore this email. Do not share this code with anyone.
            </p>
          </div>
        </body>
      </html>
    `;

    // 1. Primary: Branded Gmail SMTP (Supports ANY recipient globally)
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const fromName = process.env.SMTP_FROM_NAME?.trim() || 'GatewayPulse Security';
        const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser;

        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: cleanEmail,
          subject: `GatewayPulse Verification Code: ${code}`,
          text: `Your GatewayPulse one-time verification passcode is: ${code}. This code expires in 10 minutes.`,
          html: htmlContent,
        });

        console.log(`[AUTH OTP] Email dispatched successfully via Gmail SMTP to ${cleanEmail} (ID: ${info.messageId})`);
        return NextResponse.json({
          success: true,
          emailSent: true,
          message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
        });
      } catch (smtpErr: any) {
        console.error('[AUTH OTP] Gmail SMTP error:', smtpErr);
        // Fallback to Resend if SMTP fails
      }
    }

    // 2. Secondary: Resend API
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'GatewayPulse <onboarding@resend.dev>';

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [cleanEmail],
          subject: `GatewayPulse Verification Code: ${code}`,
          html: htmlContent,
        });

        if (error) {
          console.error('[AUTH OTP] Resend API error:', error);
          const isSandbox =
            error.statusCode === 403 ||
            error.name === 'validation_error' ||
            error.message?.includes('only send testing emails to your own email address');

          return NextResponse.json({
            success: true,
            emailSent: false,
            isSandboxRestriction: isSandbox,
            message: isSandbox
              ? `Resend Free Sandbox: Live emails can only be sent to your registered account (mahindrooom@gmail.com). To test with ${cleanEmail}, use the instant passcode below.`
              : `Could not deliver via Resend (${error.message}). Using fallback code.`,
            devCode: code,
          });
        }

        console.log(`[AUTH OTP] Email dispatched successfully via Resend to ${cleanEmail} (ID: ${data?.id})`);
        return NextResponse.json({
          success: true,
          emailSent: true,
          message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
        });
      } catch (sendErr: any) {
        console.error('[AUTH OTP] Error invoking Resend:', sendErr);
      }
    }

    // 3. Fallback: Local simulation
    return NextResponse.json({
      success: true,
      emailSent: false,
      message: `Passcode generated in local mode.`,
      devCode: code,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send OTP.' }, { status: 500 });
  }
}
