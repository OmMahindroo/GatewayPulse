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
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            comments: {
              where: { isOfficial: true },
              select: { id: true, createdAt: true },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const now = Date.now();

    const stats = gateways.map((gw: any) => {
      const issues = gw.issues || [];
      const totalComplaints = issues.length;

      const openIssues = issues.filter(
        (i: any) => i.status !== 'RESOLVED' && i.status !== 'AUTO_CLOSED'
      );
      const openComplaints = openIssues.length;

      const breachedComplaints = openIssues.filter((i: any) => {
        const createdTime = new Date(i.createdAt).getTime();
        const endTime = i.proposedAt ? new Date(i.proposedAt).getTime() : now;
        return endTime - createdTime > 7 * 24 * 60 * 60 * 1000;
      }).length;

      const resolvedIssues = issues.filter(
        (i: any) => i.status === 'RESOLVED' || i.status === 'AUTO_CLOSED'
      );
      const resolvedCount = resolvedIssues.length;

      const resolutionRate =
        totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : null;

      // Resolution durations
      const resolutionHoursList: number[] = [];
      let under24h = 0;
      let hrs24to72 = 0;
      let over72h = 0;

      for (const res of resolvedIssues) {
        const finishTime = res.resolvedAt || res.proposedAt;
        if (finishTime) {
          const diffMs = new Date(finishTime).getTime() - new Date(res.createdAt).getTime();
          const hrs = Math.max(1, diffMs / (1000 * 60 * 60));
          resolutionHoursList.push(hrs);
          if (hrs < 24) under24h++;
          else if (hrs <= 72) hrs24to72++;
          else over72h++;
        }
      }

      const resolvedCountWithTime = resolutionHoursList.length;
      const avgResolutionHours =
        resolvedCountWithTime > 0
          ? Math.round(
              resolutionHoursList.reduce((sum, h) => sum + h, 0) / resolvedCountWithTime
            )
          : null;

      let medianResolutionHours: number | null = null;
      if (resolvedCountWithTime > 0) {
        const sorted = [...resolutionHoursList].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        medianResolutionHours =
          sorted.length % 2 !== 0
            ? Math.round(sorted[mid])
            : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      }

      const resolutionBuckets =
        resolvedCountWithTime > 0
          ? {
              under24hPercent: Math.round((under24h / resolvedCountWithTime) * 100),
              hrs24to72Percent: Math.round((hrs24to72 / resolvedCountWithTime) * 100),
              over72hPercent: Math.round((over72h / resolvedCountWithTime) * 100),
            }
          : {
              under24hPercent: 0,
              hrs24to72Percent: 0,
              over72hPercent: 0,
            };

      // Category breakdown & Most reported category
      const catCounts: Record<string, number> = {};
      for (const issue of issues) {
        const catName = issue.category?.name || 'Others';
        catCounts[catName] = (catCounts[catName] || 0) + 1;
      }

      const categoryBreakdown = Object.entries(catCounts)
        .map(([categoryName, count]) => ({
          categoryName,
          count,
          percentage: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const mostReportedCategory =
        categoryBreakdown.length > 0 ? categoryBreakdown[0].categoryName : null;

      const officialResponseCount = issues.filter(
        (i: any) => (i.comments && i.comments.length > 0) || Boolean(i.proposedAt)
      ).length;

      return {
        id: gw.id,
        name: gw.name,
        slug: gw.slug,
        domain: gw.domain,
        website: gw.website,
        description: gw.description,
        isClaimed: Boolean(gw.isClaimed),
        escalationMatrix: gw.escalationMatrix || null,
        totalComplaints,
        openComplaints,
        breachedComplaints,
        resolvedCount,
        resolutionRate,
        avgResolutionHours,
        medianResolutionHours,
        mostReportedCategory,
        categoryBreakdown,
        resolutionBuckets,
        officialResponseCount,
      };
    });

    // Sort: gateways with reported issues first (by totalComplaints desc, then name asc), except keep "Report a PG (Other / Not Listed)" at the bottom
    stats.sort((a, b) => {
      if (a.slug === 'other-pg') return 1;
      if (b.slug === 'other-pg') return -1;
      if (b.totalComplaints !== a.totalComplaints) {
        return b.totalComplaints - a.totalComplaints;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ gateways: stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch gateways.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { gatewayId, isClaimed, escalationMatrix, description, website } = body;

    if (!gatewayId) {
      return NextResponse.json({ error: 'gatewayId is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isClaimed === 'boolean') updateData.isClaimed = isClaimed;
    if (typeof escalationMatrix === 'string') updateData.escalationMatrix = escalationMatrix;
    if (typeof description === 'string') updateData.description = description;
    if (typeof website === 'string') updateData.website = website;

    const updated = await prisma.paymentGateway.update({
      where: { id: gatewayId },
      data: updateData,
    });

    return NextResponse.json({ success: true, gateway: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update payment gateway profile.' },
      { status: 500 }
    );
  }
}
