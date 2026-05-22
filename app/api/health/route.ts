import prisma from '@/lib/prisma/client';

export async function GET() {
  const checks: { database: boolean; timestamp: string; version: string } = {
    database: false,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {}
  const allHealthy = checks.database;
  return Response.json(checks, { status: allHealthy ? 200 : 503 });
}
