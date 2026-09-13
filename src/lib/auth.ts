import { prisma } from './prisma';

export interface AuthSession {
  userId: string;
  email: string;
  name: string | null;
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

export async function authenticateOrRegisterUser(email: string, name?: string): Promise<AuthSession> {
  const cleanEmail = email.toLowerCase().trim();
  const domain = extractDomain(cleanEmail);

  // Check if domain matches any payment gateway
  const matchedGateway = await prisma.paymentGateway.findFirst({
    where: {
      domain: domain,
    },
  });

  const role = matchedGateway ? 'PG_SUPPORT' : 'MERCHANT';
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
        role,
        companyName,
        domain,
        isVerified,
      },
    });
  } else if (matchedGateway && user.role !== 'PG_SUPPORT') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'PG_SUPPORT',
        domain,
        isVerified: true,
        companyName: matchedGateway.name,
      },
    });
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'MERCHANT' | 'PG_SUPPORT' | 'ADMIN',
    companyName: user.companyName,
    domain: user.domain,
    isVerified: user.isVerified,
    pgId: matchedGateway?.id || null,
  };
}
