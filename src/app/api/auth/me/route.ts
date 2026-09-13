import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { authenticateOrRegisterUser } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('pg_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Verify if the user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: sessionData.userId },
    });

    // Self-healing: If user was deleted or database reseeded, re-sync using email
    if (!dbUser && sessionData.email) {
      const freshSession = await authenticateOrRegisterUser(sessionData.email, sessionData.name);
      const response = NextResponse.json({ user: freshSession });
      response.cookies.set({
        name: 'pg_session',
        value: JSON.stringify(freshSession),
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    if (!dbUser) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('pg_session');
      return response;
    }

    return NextResponse.json({ user: sessionData });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('pg_session');
  return response;
}
