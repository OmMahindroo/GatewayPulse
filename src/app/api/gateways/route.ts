import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAutoClosures } from '@/lib/resolution';

export async function GET() {
  try {
    // Run auto-close verification for any pending tickets
    await processAutoClosures();

    const gateways = await prisma.paymentGateway.findMany({
      include: {
        issues: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
            proposedAt: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const stats = gateways.map((gw) => {
      const issues = gw.issues;
      const totalComplaints = issues.length;

      const openIssues = issues.filter(
        (i) => i.status !== 'RESOLVED' && i.status !== 'AUTO_CLOSED'
      );
      const openComplaints = openIssues.length;

      const breachedComplaints = openIssues.filter((i) => {
        const createdTime = new Date(i.createdAt).getTime();
        // If resolution proposed, timer stopped at proposedAt
        const endTime = i.proposedAt ? new Date(i.proposedAt).getTime() : now;
        return endTime - createdTime > 7 * 24 * 60 * 60 * 1000;
      }).length;

      const resolvedIssues = issues.filter(
        (i) => i.status === 'RESOLVED' || i.status === 'AUTO_CLOSED'
      );

      let totalResolutionHours = 0;
      let resolvedCountWithTime = 0;

      for (const res of resolvedIssues) {
        const finishTime = res.resolvedAt || res.proposedAt;
        if (finishTime) {
          const diffMs = new Date(finishTime).getTime() - new Date(res.createdAt).getTime();
          totalResolutionHours += Math.max(0, diffMs / (1000 * 60 * 60));
          resolvedCountWithTime++;
        }
      }

      const avgResolutionHours =
        resolvedCountWithTime > 0
          ? Math.round(totalResolutionHours / resolvedCountWithTime)
          : null;

      return {
        id: gw.id,
        name: gw.name,
        slug: gw.slug,
        domain: gw.domain,
        website: gw.website,
        description: gw.description,
        totalComplaints,
        openComplaints,
        breachedComplaints,
        resolvedCount: resolvedIssues.length,
        avgResolutionHours,
      };
    });

    return NextResponse.json({ gateways: stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch gateways.' }, { status: 500 });
  }
}
