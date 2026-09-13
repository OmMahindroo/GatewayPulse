import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        upvotesCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        upvotesCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      upvotesCount: issue.upvotesCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to register upvote.' }, { status: 500 });
  }
}
