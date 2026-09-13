const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Clean existing
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.issueFollow.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.template.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentGateway.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Gateways
  const gateways = await Promise.all([
    prisma.paymentGateway.create({
      data: {
        name: 'Razorpay',
        slug: 'razorpay',
        domain: 'razorpay.com',
        website: 'https://razorpay.com',
        description: 'Payment gateway and banking platform for Indian businesses.'
      }
    }),
    prisma.paymentGateway.create({
      data: {
        name: 'Cashfree',
        slug: 'cashfree',
        domain: 'cashfree.com',
        website: 'https://cashfree.com',
        description: 'Payments and API banking solutions for high-volume merchants.'
      }
    }),
    prisma.paymentGateway.create({
      data: {
        name: 'Stripe',
        slug: 'stripe',
        domain: 'stripe.com',
        website: 'https://stripe.com',
        description: 'Global payment processing and financial infrastructure.'
      }
    }),
    prisma.paymentGateway.create({
      data: {
        name: 'PayU',
        slug: 'payu',
        domain: 'payu.in',
        website: 'https://payu.in',
        description: 'Payment gateway provider for online businesses in emerging markets.'
      }
    }),
    prisma.paymentGateway.create({
      data: {
        name: 'PhonePe PG',
        slug: 'phonepe',
        domain: 'phonepe.com',
        website: 'https://phonepe.com/business-solutions',
        description: 'UPI and digital payment gateway for merchants across India.'
      }
    })
  ]);

  const [razorpay, cashfree, stripe, payu, phonepe] = gateways;

  // 2. Seed Categories
  const catSettlement = await prisma.category.create({
    data: {
      name: 'Settlement Delays',
      slug: 'settlements',
      description: 'Issues regarding delayed bank credits, pending payouts, or unverified UTRs.'
    }
  });

  const catWebhook = await prisma.category.create({
    data: {
      name: 'Webhook & Event Failures',
      slug: 'webhooks',
      description: 'Delays or errors in payment webhook callbacks, status desyncs, or signature failures.'
    }
  });

  const catOutage = await prisma.category.create({
    data: {
      name: 'Transaction Drop / API Outage',
      slug: 'api-outage',
      description: 'Sudden drops in success rate, checkout SDK crashes, or UPI rail timeouts.'
    }
  });

  const catDisputes = await prisma.category.create({
    data: {
      name: 'Disputes & Chargebacks',
      slug: 'chargebacks',
      description: 'Premature dispute deductions, evidence portal bugs, or unfair chargeback fees.'
    }
  });

  const catRisk = await prisma.category.create({
    data: {
      name: 'Risk Holds & Verification',
      slug: 'risk-holds',
      description: 'Unexpected settlement holds, document re-verification delays, or volume cap issues.'
    }
  });

  // 3. Seed Templates
  // 3. Seed Templates for All Categories
  await prisma.template.createMany({
    data: [
      // Disputes & Chargebacks
      {
        categoryId: catDisputes.id,
        title: 'Premature dispute deduction before evidence submission deadline',
        content: 'A customer chargeback was initiated on transaction ARN, but the gateway auto-debited the dispute amount and dispute fee before the stated 7-day representment window expired. Supporting delivery documents were ready for submission.'
      },
      {
        categoryId: catDisputes.id,
        title: 'Chargeback evidence document upload portal returning error / upload failure',
        content: 'Attempting to submit proof of delivery and customer tax invoice through the merchant dispute dashboard fails with a network timeout. We are at risk of losing the dispute representment window due to portal downtime.'
      },
      {
        categoryId: catDisputes.id,
        title: 'Duplicate chargeback fee debited on single transaction ARN',
        content: 'Our merchant ledger statement shows two separate dispute processing charges debited for the exact same transaction reference. Customer card issuing bank confirmed only a single dispute was raised.'
      },

      // Settlements
      {
        categoryId: catSettlement.id,
        title: 'T+2 settlement delayed past 48 hours without dashboard update',
        content: 'Settlement for batch processing from 2 days ago is still listed as "Processing" on the merchant dashboard. No UTR generated, and standard customer support ticket has not received an update.'
      },
      {
        categoryId: catSettlement.id,
        title: 'Settlement marked as Processed but bank account has not received funds',
        content: 'The dashboard indicates batch funds were sent, but the beneficiary bank reports no inward IMPS/NEFT transfer with the specified UTR. Please confirm bank clearing status.'
      },
      {
        categoryId: catSettlement.id,
        title: 'Nodal account reconciliation delay during weekend settlement',
        content: 'Weekend settlements for Friday to Sunday transactions have not been initiated on Monday morning. Support desk indicates a nodal bank clearing backlog with no turnaround ETA.'
      },

      // Webhook & Event Failures
      {
        categoryId: catWebhook.id,
        title: 'Payment captured but payment.captured webhook dropped / 500 error',
        content: 'Customer payment was successfully debited, but our server endpoint did not receive the webhook callback. Orders remain unfulfilled until manual reconciliation.'
      },
      {
        categoryId: catWebhook.id,
        title: 'Signature verification failure on webhook payload',
        content: 'Webhook requests received from gateway IP range are failing cryptographic signature verification against the shared webhook secret.'
      },
      {
        categoryId: catWebhook.id,
        title: 'Webhook delivery delayed by 30+ minutes causing fulfillment bottlenecks',
        content: 'While transactions show as captured in the gateway dashboard immediately, the webhook payload reaches our server 30 to 60 minutes later, causing delayed order dispatch and customer complaints.'
      },

      // Transaction Drop / API Outage
      {
        categoryId: catOutage.id,
        title: 'Checkout modal latency / Gateway timeout on mobile web',
        content: 'Users attempting checkout via mobile browsers experience 15+ second hangs before payment rail initialization. Success rate dropped by over 25% in the last 4 hours.'
      },
      {
        categoryId: catOutage.id,
        title: 'UPI intent flow timing out for PhonePe / GooglePay / Paytm',
        content: 'Intent invoke triggers a white screen on Android devices, resulting in failed transaction status after 300 seconds.'
      },
      {
        categoryId: catOutage.id,
        title: 'Card processing API returning 502 Bad Gateway intermittently',
        content: 'Direct server-to-server card authorization endpoints are failing with 502 Bad Gateway responses on approximately 15% of checkout requests.'
      },

      // Risk Holds & Verification
      {
        categoryId: catRisk.id,
        title: 'Unannounced settlement pause due to routine KYC verification',
        content: 'All merchant payouts were placed on hold without advance notice requesting documents that were already approved at onboarding.'
      },
      {
        categoryId: catRisk.id,
        title: 'Monthly processing volume limit triggered without warning or upgrade path',
        content: 'Account payments were throttled after hitting an uncommunicated monthly threshold. Business registration documents for volume increase submitted 3 days ago without review.'
      }
    ]
  });

  // 4. Seed Users
  const merchant1 = await prisma.user.create({
    data: {
      email: 'merchant@acmestore.in',
      name: 'Rahul Sharma',
      role: 'MERCHANT',
      companyName: 'Acme Retail India',
      isVerified: true
    }
  });

  const merchant2 = await prisma.user.create({
    data: {
      email: 'tech@quickbazaar.io',
      name: 'Priya Iyer',
      role: 'MERCHANT',
      companyName: 'QuickBazaar App',
      isVerified: true
    }
  });

  const razorpayPOC = await prisma.user.create({
    data: {
      email: 'support.ops@razorpay.com',
      name: 'Razorpay Support Team',
      role: 'PG_SUPPORT',
      domain: 'razorpay.com',
      companyName: 'Razorpay',
      isVerified: true
    }
  });

  const cashfreePOC = await prisma.user.create({
    data: {
      email: 'integrations@cashfree.com',
      name: 'Cashfree Support Desk',
      role: 'PG_SUPPORT',
      domain: 'cashfree.com',
      companyName: 'Cashfree Payments',
      isVerified: true
    }
  });

  // 5. Seed Issues with varying SLA ages
  const now = new Date();

  // Fresh issue (1 day old, Green SLA)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const issue1 = await prisma.issue.create({
    data: {
      title: 'payment.captured webhooks delayed by 45 minutes',
      description: 'We are observing a severe lag in webhook events for captured payments. While transactions show as captured in Razorpay dashboard immediately, the webhook payload reaches our server 40-50 minutes later, causing delayed order dispatch.',
      status: 'OPEN',
      merchantId: merchant1.id,
      gatewayId: razorpay.id,
      categoryId: catWebhook.id,
      upvotesCount: 4,
      nudgeCount: 0,
      createdAt: oneDayAgo
    }
  });

  // 3 days old issue (Yellow SLA)
  const threeDaysAgo = new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000);
  const issue2 = await prisma.issue.create({
    data: {
      title: 'T+2 settlement for Friday batch still not credited',
      description: 'Friday settlement cycle for amount INR 4,80,000 has been stuck in "Scheduled" status since Monday morning. Ticket #CF-89912 submitted on support portal without response.',
      status: 'INVESTIGATING',
      merchantId: merchant2.id,
      gatewayId: cashfree.id,
      categoryId: catSettlement.id,
      upvotesCount: 8,
      nudgeCount: 1,
      lastNudgedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      createdAt: threeDaysAgo
    }
  });

  // 6 days old issue (Orange SLA)
  const sixDaysAgo = new Date(now.getTime() - 6.2 * 24 * 60 * 60 * 1000);
  const issue3 = await prisma.issue.create({
    data: {
      title: 'UPI Intent flow failure rate spike across HDFC & ICICI handles',
      description: 'UPI intent calls failing intermittently with response code 504 Gateway Timeout. Affects approximately 35% of all mobile checkouts. Support ticket open for 6 days.',
      status: 'OPEN',
      merchantId: merchant1.id,
      gatewayId: payu.id,
      categoryId: catOutage.id,
      upvotesCount: 14,
      nudgeCount: 2,
      lastNudgedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      createdAt: sixDaysAgo
    }
  });

  // 9 days old issue (Red SLA Breached)
  const nineDaysAgo = new Date(now.getTime() - 9.5 * 24 * 60 * 60 * 1000);
  const issue4 = await prisma.issue.create({
    data: {
      title: 'Merchant risk hold placed without prior notification or document upload link',
      description: 'Account payouts frozen for 9 days citing periodic risk audit. All requested documents submitted via email twice, but no verification acknowledgement or turnaround timeline provided.',
      status: 'OPEN',
      merchantId: merchant2.id,
      gatewayId: stripe.id,
      categoryId: catRisk.id,
      upvotesCount: 22,
      nudgeCount: 3,
      lastNudgedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      createdAt: nineDaysAgo
    }
  });

  // Resolved issue (Handshake completed)
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const issue5 = await prisma.issue.create({
    data: {
      title: 'Duplicate webhook deliveries on order refund event',
      description: 'Refund webhooks were firing three times in rapid succession, resulting in duplicate credit ledger entries on our internal ERP.',
      status: 'RESOLVED',
      merchantId: merchant1.id,
      gatewayId: razorpay.id,
      categoryId: catWebhook.id,
      upvotesCount: 6,
      nudgeCount: 0,
      resolutionNotes: 'Identified retry queue misconfiguration in webhook dispatcher. Deployed hotfix to deduplicate refund event dispatching.',
      proposedAt: fourDaysAgo,
      resolvedAt: fourDaysAgo,
      createdAt: fiveDaysAgo
    }
  });

  // 6. Comments
  await prisma.comment.create({
    data: {
      issueId: issue2.id,
      authorId: cashfreePOC.id,
      content: 'We are investigating the settlement queue for the Friday cycle. Our nodal banking partner had a reconciliation backlog over the weekend. Updates will be posted here.',
      isOfficial: true,
      isPinned: true
    }
  });

  await prisma.comment.create({
    data: {
      issueId: issue2.id,
      authorId: merchant1.id,
      content: 'We had the same issue on our account. Our bank received the IMPS credit today at 11:30 AM.',
      isOfficial: false,
      isPinned: false
    }
  });

  await prisma.comment.create({
    data: {
      issueId: issue5.id,
      authorId: razorpayPOC.id,
      content: 'Hotfix has been applied to webhook service cluster v3.2. Deduplication cache active. Please verify on your server logs.',
      isOfficial: true,
      isPinned: true
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
