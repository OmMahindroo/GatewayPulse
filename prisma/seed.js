const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROVIDERS = [
  { name: 'Razorpay', slug: 'razorpay', domain: 'razorpay.com', website: 'https://razorpay.com', description: 'Payment gateway and banking platform for businesses.', isClaimed: true },
  { name: 'PayU', slug: 'payu', domain: 'payu.in', website: 'https://payu.in', description: 'Payment gateway provider for online businesses.', isClaimed: false },
  { name: 'Cashfree', slug: 'cashfree', domain: 'cashfree.com', website: 'https://cashfree.com', description: 'Payments and API banking solutions for merchants.', isClaimed: true },
  { name: 'CCAvenue', slug: 'ccavenue', domain: 'ccavenue.com', website: 'https://ccavenue.com', description: 'Enterprise payment gateway and e-commerce processing.', isClaimed: false },
  { name: 'Paytm Payment Gateway', slug: 'paytm', domain: 'paytm.com', website: 'https://business.paytm.com', description: 'Digital payments and merchant acquiring network.', isClaimed: false },
  { name: 'BillDesk', slug: 'billdesk', domain: 'billdesk.com', website: 'https://billdesk.com', description: 'Online payment aggregation and recurring billing.', isClaimed: false },
  { name: 'Pine Labs', slug: 'pinelabs', domain: 'pinelabs.com', website: 'https://pinelabs.com', description: 'Merchant commerce and plural online payment gateway.', isClaimed: false },
  { name: 'Easebuzz', slug: 'easebuzz', domain: 'easebuzz.in', website: 'https://easebuzz.in', description: 'Full-stack payment solutions and API collection.', isClaimed: false },
  { name: 'SabPaisa', slug: 'sabpaisa', domain: 'sabpaisa.in', website: 'https://sabpaisa.in', description: 'Unified online and offline payment collection gateway.', isClaimed: false },
  { name: 'Airpay', slug: 'airpay', domain: 'airpay.co.in', website: 'https://airpay.co.in', description: 'Omnichannel financial services and payment gateway.', isClaimed: false },
  { name: 'Juspay', slug: 'juspay', domain: 'juspay.in', website: 'https://juspay.in', description: 'Payment orchestration and checkout infrastructure.', isClaimed: false },
  { name: 'PhonePe Payment Gateway', slug: 'phonepe', domain: 'phonepe.com', website: 'https://phonepe.com/business-solutions', description: 'UPI and digital payment gateway for merchants across India.', isClaimed: false },
  { name: 'Instamojo', slug: 'instamojo', domain: 'instamojo.com', website: 'https://instamojo.com', description: 'Payment links and digital commerce gateway for MSMEs.', isClaimed: false },
  { name: 'Lyra', slug: 'lyra', domain: 'lyra.com', website: 'https://lyra.com/in', description: 'Secure payment routing and e-commerce gateway.', isClaimed: false },
  { name: 'NTT DATA', slug: 'nttdata', domain: 'nttdatapay.com', website: 'https://nttdatapay.com', description: 'Atom payment gateway and enterprise merchant services.', isClaimed: false },
  { name: 'PayKun', slug: 'paykun', domain: 'paykun.com', website: 'https://paykun.com', description: 'Online checkout and digital payment collection.', isClaimed: false },
  { name: 'Stripe', slug: 'stripe', domain: 'stripe.com', website: 'https://stripe.com', description: 'Global payment processing and financial infrastructure.', isClaimed: false },
  { name: 'Zoho Payments', slug: 'zohopayments', domain: 'zoho.com', website: 'https://zoho.com/in/payments', description: 'Integrated business payment acceptance platform.', isClaimed: false },
  { name: 'CAMS Pay', slug: 'camspay', domain: 'camspay.com', website: 'https://camspay.com', description: 'BFSI and enterprise payment authentication and collection.', isClaimed: false },
  { name: 'Unlimit', slug: 'unlimit', domain: 'unlimit.com', website: 'https://unlimit.com', description: 'Cross-border and domestic payment gateway processing.', isClaimed: false },
  { name: 'NSDL', slug: 'nsdl', domain: 'nsdl.co.in', website: 'https://nsdlbank.com', description: 'Payment bank and digital merchant acquiring services.', isClaimed: false },
  { name: 'Airtel Payments', slug: 'airtelpayments', domain: 'airtel.in', website: 'https://airtel.in/bank', description: 'Digital banking and merchant payment gateway.', isClaimed: false },
  { name: 'JIO', slug: 'jiopay', domain: 'jio.com', website: 'https://jiopay.com', description: 'JioPay Business payment gateway and acquiring.', isClaimed: false },
  { name: 'EnKash', slug: 'enkash', domain: 'enkash.com', website: 'https://enkash.com', description: 'B2B spend management and payment gateway.', isClaimed: false },
  { name: 'Xflow', slug: 'xflow', domain: 'xflowpay.com', website: 'https://xflowpay.com', description: 'Cross-border B2B international payment settlements.', isClaimed: false },
  { name: 'Skydo', slug: 'skydo', domain: 'skydo.com', website: 'https://skydo.com', description: 'International export invoice collections and FIRA.', isClaimed: false },
  { name: 'Zaakpay', slug: 'zaakpay', domain: 'zaakpay.com', website: 'https://zaakpay.com', description: 'MobiKwik enterprise payment gateway for businesses.', isClaimed: false },
  { name: 'Payswiff', slug: 'payswiff', domain: 'payswiff.com', website: 'https://payswiff.com', description: 'Omnichannel POS and online merchant payment solutions.', isClaimed: false },
  { name: 'Ippopay', slug: 'ippopay', domain: 'ippopay.com', website: 'https://ippopay.com', description: 'SME payment collection and banking infrastructure.', isClaimed: false },
  { name: 'PayG', slug: 'payg', domain: 'payg.in', website: 'https://payg.in', description: 'Unified merchant payment gateway and billing.', isClaimed: false },
  { name: 'Pay10', slug: 'pay10', domain: 'pay10.com', website: 'https://pay10.com', description: 'Real-time digital payment gateway and merchant services.', isClaimed: false },
  { name: 'ISG', slug: 'isg', domain: 'isgpay.com', website: 'https://isgpay.com', description: 'In-Solutions Global payment acquiring and switching.', isClaimed: false },
  { name: 'Report a PG (Other / Not Listed)', slug: 'other-pg', domain: 'other-provider.com', website: 'https://gatewaypulse.netlify.app', description: 'Select this option if your payment provider is not listed above.', isClaimed: false },
];

const CATEGORIES = [
  {
    name: '1. Account, KYC & Activation',
    slug: 'account-kyc',
    description: 'Account setup, KYC or activation issue',
    templates: [
      {
        title: 'KYC verification pending beyond stated SLA with all documents uploaded',
        content: 'All required business registration, GSTIN, and bank verification documents were submitted. Account activation remains in pending review state with no update from onboarding support.',
      },
      {
        title: 'Live API keys not enabled despite completed onboarding verification',
        content: 'Dashboard displays KYC verified status, but live mode payment acceptance and production API keys remain restricted without explanation.',
      },
    ],
  },
  {
    name: '2. Transaction Failures & Payment Drops',
    slug: 'transactions',
    description: 'Transactions failing, downtime or API disruption',
    templates: [
      {
        title: 'Sudden spike in UPI intent and collect transaction drops',
        content: 'Customer UPI payment success rate dropped significantly since morning. Customers report payment debited from bank account while gateway marks order as failed or timed out.',
      },
      {
        title: 'Card 3DS OTP page failing to load across major issuing banks',
        content: 'Domestic credit and debit card transactions are failing at the ACS 3D Secure authentication step with a gateway timeout error.',
      },
    ],
  },
  {
    name: '3. API, Integration & Technical Issues',
    slug: 'webhooks',
    description: 'API, SDK, plugin or integration-related issue',
    templates: [
      {
        title: 'Payment captured but payment.captured webhook not delivered',
        content: 'Transactions are marked as Captured in the payment provider dashboard, but our server endpoint is not receiving the webhook payload, leaving customer orders unfulfilled.',
      },
      {
        title: 'Checkout SDK throwing unhandled CORS / initialization error in production',
        content: 'Standard checkout script integration is failing to initialize payment modal on mobile browsers despite valid order token generation.',
      },
    ],
  },
  {
    name: '4. Settlement Delays & Payouts',
    slug: 'settlements',
    description: 'Settlement, payout or funds-crediting issue',
    templates: [
      {
        title: 'T+2 settlement batch delayed past 48 hours without UTR reference',
        content: 'Scheduled settlement batch has been stuck in Processing state for over 48 hours past the agreed T+2 settlement cycle. No bank UTR number or rejection reason has been provided.',
      },
      {
        title: 'Payout API requests stuck in queued state despite sufficient balance',
        content: 'IMPS and NEFT vendor payouts initiated via dashboard/API remain stuck in Queued state for over 24 hours without status transition.',
      },
    ],
  },
  {
    name: '5. Refunds & Chargebacks',
    slug: 'chargebacks',
    description: 'Refund pending, failed or chargeback-related issue',
    templates: [
      {
        title: 'Initiated customer refunds stuck in processing beyond 7 business days',
        content: 'Multiple customer refunds initiated via dashboard are still showing as Processing after 7+ working days, and bank ARN references have not been generated.',
      },
      {
        title: 'Premature chargeback debit before evidence submission deadline',
        content: 'Dispute amount was debited from our settlement ledger before the stated representment window expired, despite proof of delivery being uploaded.',
      },
    ],
  },
  {
    name: '6. Risk Holds & Verifications',
    slug: 'risk-holds',
    description: 'Account/transaction hold, risk review or verification issue',
    templates: [
      {
        title: 'Settlements paused by risk team without specific transaction list',
        content: 'Entire settlement balance was placed on hold citing routine risk review. Requested invoices and delivery proofs were submitted, but settlements remain frozen with no response.',
      },
      {
        title: 'Legitimate B2B high-value transaction flagged and held without timeline',
        content: 'A verified customer payment was flagged for manual risk verification. Customer KYC and tax invoice were shared immediately, but funds remain held.',
      },
    ],
  },
  {
    name: '7. Pricing, MDR & Billing',
    slug: 'pricing-mdr',
    description: 'MDR, fees, pricing, deductions or commercial dispute',
    templates: [
      {
        title: 'Higher MDR deducted on settlements than agreed onboarding commercial rate',
        content: 'Settlement reconciliation shows platform fees deducted at a higher percentage than the approved rate card in our merchant agreement.',
      },
      {
        title: 'Unexplained platform fee deduction on settled batch without tax invoice',
        content: 'A lump-sum deduction was applied to our recent settlement payout without breakdown or corresponding fee invoice in the billing portal.',
      },
    ],
  },
  {
    name: '9. Support & Escalation',
    slug: 'support-escalation',
    description: 'Support not responding, repeated follow-ups or unresolved ticket',
    templates: [
      {
        title: 'Support ticket auto-closed as resolved without addressing reported issue',
        content: 'Our raised support ticket was marked as closed/resolved with a generic automated response while the underlying settlement/technical issue remains completely unresolved.',
      },
      {
        title: 'No response on escalated priority ticket for over 7 days',
        content: 'Multiple follow-ups sent on our open support ticket with all requested logs and screenshots attached, but the ticket has received zero human replies.',
      },
    ],
  },
  {
    name: '10. Others',
    slug: 'others',
    description: "Issue doesn't fit the above categories",
    templates: [
      {
        title: 'Dashboard reporting discrepancy and reconciliation statement mismatch',
        content: 'Monthly settlement report exported from the merchant dashboard does not match actual bank credits and transaction-level ledger entries.',
      },
    ],
  },
];

async function main() {
  console.log('Syncing 33 Payment Providers and 9 Problem Categories...');

  // 1. Upsert all 33 Payment Providers
  for (const prov of PROVIDERS) {
    await prisma.paymentGateway.upsert({
      where: { slug: prov.slug },
      update: {
        name: prov.name,
        domain: prov.domain,
        website: prov.website,
        description: prov.description,
      },
      create: {
        name: prov.name,
        slug: prov.slug,
        domain: prov.domain,
        website: prov.website,
        description: prov.description,
        isClaimed: prov.isClaimed || false,
        escalationMatrix:
          'Level 1: Merchant Support Desk (SLA: 24 hrs)\nLevel 2: Grievance Nodal Officer (SLA: 3 business days)\nLevel 3: Principal Nodal Officer & Regulatory Compliance',
      },
    });
  }

  // 2. Upsert all 9 Categories & Templates
  for (const cat of CATEGORIES) {
    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });

    const existingTmplCount = await prisma.template.count({
      where: { categoryId: upsertedCat.id },
    });

    if (existingTmplCount === 0 && cat.templates && cat.templates.length > 0) {
      for (const tmpl of cat.templates) {
        await prisma.template.create({
          data: {
            categoryId: upsertedCat.id,
            title: tmpl.title,
            content: tmpl.content,
          },
        });
      }
    }
  }

  // 3. Seed initial demo issues ONLY if there are zero issues in the database
  const issueCount = await prisma.issue.count();
  if (issueCount === 0) {
    console.log('Seeding initial baseline merchant reports...');

    const merchant1 = await prisma.user.upsert({
      where: { email: 'ops@zenvia-commerce.in' },
      update: {},
      create: {
        email: 'ops@zenvia-commerce.in',
        name: 'Verified Merchant #104',
        companyName: 'Verified E-Commerce Merchant',
        domain: 'zenvia-commerce.in',
        role: 'MERCHANT',
        isVerified: true,
      },
    });

    const rzpRep = await prisma.user.upsert({
      where: { email: 'escalations@razorpay.com' },
      update: {},
      create: {
        email: 'escalations@razorpay.com',
        name: 'Razorpay Escalation Desk',
        companyName: 'Razorpay',
        domain: 'razorpay.com',
        role: 'PG_SUPPORT',
        isVerified: true,
      },
    });

    const rzp = await prisma.paymentGateway.findUnique({ where: { slug: 'razorpay' } });
    const cf = await prisma.paymentGateway.findUnique({ where: { slug: 'cashfree' } });
    const payu = await prisma.paymentGateway.findUnique({ where: { slug: 'payu' } });
    const catSettlement = await prisma.category.findUnique({ where: { slug: 'settlements' } });
    const catWebhook = await prisma.category.findUnique({ where: { slug: 'webhooks' } });

    if (rzp && cf && payu && catSettlement && catWebhook) {
      const now = new Date();
      const d1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const d9 = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);

      await prisma.issue.create({
        data: {
          title: 'T+2 settlement batch delayed past 48 hours without UTR reference',
          description: 'Scheduled settlement batch of INR 4,82,000 has been stuck in Processing state for over 48 hours past the agreed T+2 cycle. Support ticket raised via dashboard has received no UTR update.',
          status: 'OPEN',
          merchantId: merchant1.id,
          gatewayId: cf.id,
          categoryId: catSettlement.id,
          pgTicketId: 'CF-9928410',
          dateRaised: d1.toISOString().split('T')[0],
          channelTried: 'In-app Chat',
          issueDuration: '1-3 days',
          upvotesCount: 6,
          createdAt: d1,
        },
      });

      const resolvedIssue = await prisma.issue.create({
        data: {
          title: 'Payment captured but payment.captured webhook not delivered',
          description: 'Multiple UPI orders were captured on gateway dashboard, but webhook notifications timed out with 502 Bad Gateway. Manually reconciled after gateway engineering deployed queue fix.',
          status: 'RESOLVED',
          merchantId: merchant1.id,
          gatewayId: rzp.id,
          categoryId: catWebhook.id,
          pgTicketId: 'RZP-7731204',
          dateRaised: d9.toISOString().split('T')[0],
          channelTried: 'Email',
          issueDuration: '1-3 days',
          followup48hStatus: 'YES_RESOLVED',
          upvotesCount: 11,
          createdAt: d9,
          resolvedAt: new Date(d9.getTime() + 22 * 60 * 60 * 1000),
        },
      });

      await prisma.comment.create({
        data: {
          issueId: resolvedIssue.id,
          authorId: rzpRep.id,
          content: 'Our webhook delivery cluster experienced a backlog on node pool AP-South-1b. All pending payment.captured events have been re-triggered and delivered. Merchant confirmed resolution.',
          isOfficial: true,
          isPinned: true,
        },
      });
    }
  }

  console.log('Seed synchronization completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
