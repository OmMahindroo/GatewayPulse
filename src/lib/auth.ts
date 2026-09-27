import { prisma } from './prisma';

export interface AuthSession {
  userId: string;
  email: string;
  name: string | null;
  mobileNumber?: string | null;
  role: 'MERCHANT' | 'PG_SUPPORT' | 'ADMIN';
  companyName: string | null;
  domain: string | null;
  isVerified: boolean;
  pgId?: string | null;
}

export function extractDomain(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase().trim() : '';
}

const ADMIN_EMAILS = ['mahindrooom@gmail.com', 'gatewaypulse.auth@gmail.com', 'admin@gatewaypulse.in'];

export async function authenticateOrRegisterUser(
  email: string,
  name?: string,
  mobileNumber?: string
): Promise<AuthSession> {
  const cleanEmail = email.toLowerCase().trim();
  const domain = extractDomain(cleanEmail);

  // Check if domain matches any payment gateway
  const matchedGateway = await prisma.paymentGateway.findFirst({
    where: {
      domain: domain,
    },
  });

  const isAdminEmail = ADMIN_EMAILS.includes(cleanEmail);
  const role = isAdminEmail ? 'ADMIN' : matchedGateway ? 'PG_SUPPORT' : 'MERCHANT';
  const isVerified = true;
  const companyName = matchedGateway ? matchedGateway.name : (name || cleanEmail.split('@')[0]);

  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name || (matchedGateway ? `${matchedGateway.name} Official POC` : cleanEmail.split('@')[0]),
        mobileNumber: mobileNumber || null,
        role,
        companyName,
        domain,
        isVerified,
      },
    });
  } else {
    const updateData: any = {};
    if (mobileNumber && !user.mobileNumber) {
      updateData.mobileNumber = mobileNumber;
    }
    if (isAdminEmail && user.role !== 'ADMIN') {
      updateData.role = 'ADMIN';
    } else if (matchedGateway && user.role !== 'PG_SUPPORT' && user.role !== 'ADMIN') {
      updateData.role = 'PG_SUPPORT';
      updateData.domain = domain;
      updateData.isVerified = true;
      updateData.companyName = matchedGateway.name;
    }
    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    mobileNumber: user.mobileNumber,
    role: user.role as 'MERCHANT' | 'PG_SUPPORT' | 'ADMIN',
    companyName: user.companyName,
    domain: user.domain,
    isVerified: user.isVerified,
    pgId: matchedGateway?.id || null,
  };
}
