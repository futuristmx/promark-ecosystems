import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  // Runtime debe usar el TRANSACTION pooler (DATABASE_URL, puerto 6543).
  // DIRECT_DATABASE_URL (session pooler, puerto 5432) es solo para migraciones
  // y tiene límite de 15 conexiones — agotar ese pool causa EMAXCONNSESSION.
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL!;

  // En serverless cada invocación es efímera; mantener pool pequeño para no
  // saturar el transaction pooler de Supabase.
  const pool = new pg.Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
