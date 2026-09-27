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
    });

    categories.sort((a, b) => {
      const numA = parseInt(a.name, 10);
      const numB = parseInt(b.name, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch categories.' }, { status: 500 });
  }
}
