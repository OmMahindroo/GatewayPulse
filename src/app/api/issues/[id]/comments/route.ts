import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { moderateContent } from '@/lib/moderation';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content, authorId } = await request.json();

    if (!content || !content.trim() || !authorId) {
      return NextResponse.json({ error: 'Comment content and author are required.' }, { status: 400 });
    }

    const mod = moderateContent(content);
    if (!mod.isValid) {
      return NextResponse.json({ error: mod.error }, { status: 422 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { gateway: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found.' }, { status: 404 });
    }

    const author = await prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      return NextResponse.json({ error: 'Author user not found.' }, { status: 404 });
    }

    // Determine if author is official PG representative
    const isOfficial =
      author.role === 'PG_SUPPORT' &&
      author.domain?.toLowerCase() === issue.gateway.domain.toLowerCase();

    const comment = await prisma.comment.create({
      data: {
        issueId: issue.id,
        authorId: author.id,
        content: mod.sanitizedText,
        isOfficial,
        isPinned: isOfficial,
      },
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
    });

    return NextResponse.json({
      success: true,
      comment,
      redacted: mod.hasRedactions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to post comment.' }, { status: 500 });
  }
}
