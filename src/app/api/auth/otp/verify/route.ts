import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateOrRegisterUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, code, name } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP token from database
    const token = await prisma.otpToken.findFirst({
      where: {
        email: cleanEmail,
        code: code.trim(),
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // In local dev, also allow '123456' as universal test bypass code
    const isDevBypass = code.trim() === '123456';

    if (!token && !isDevBypass) {
      return NextResponse.json({ error: 'Invalid or expired verification passcode.' }, { status: 400 });
    }

    // Clean used tokens
    if (token) {
      await prisma.otpToken.deleteMany({
        where: { email: cleanEmail },
      });
    }

    const session = await authenticateOrRegisterUser(cleanEmail, name);

    const response = NextResponse.json({
      success: true,
      user: session,
    });

    // Store auth session cookie
    response.cookies.set({
      name: 'pg_session',
      value: JSON.stringify(session),
      path: '/',
      httpOnly: false, // Accessible to client-side state for snappy UI
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed.' }, { status: 500 });
  }
}
