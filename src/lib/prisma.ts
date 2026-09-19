import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;
  if (!url.includes('connect_timeout')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}connect_timeout=30&pool_timeout=30`;
  }
  return url;
}

const dbUrl = getDatabaseUrl();

const createPrismaClient = () => {
  const client = new PrismaClient(
    dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
  );

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          let attempt = 0;
          const maxRetries = 2;
          let delayMs = 1500;

          while (true) {
            try {
              return await query(args);
            } catch (err: any) {
              attempt++;
              const isConnectionError =
                err?.message?.includes('P1001') ||
                err?.message?.includes("Can't reach database server") ||
                err?.code === 'P1001';

              if (isConnectionError && attempt <= maxRetries) {
                console.warn(
                  `[Neon Auto-Wakeup] Database waking up from suspend (${model || 'db'}.${operation}, attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`
                );
                await new Promise((res) => setTimeout(res, delayMs));
                delayMs *= 1.5;
                continue;
              }
              throw err;
            }
          }
        },
      },
    },
  });
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
