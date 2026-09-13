import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        templates: true,
        _count: {
          select: { issues: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch categories.' }, { status: 500 });
  }
}
