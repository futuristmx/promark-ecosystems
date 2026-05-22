import { NextResponse } from 'next/server';
import { runAlertDetector } from '@/lib/alerts/detector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/check-alerts/trigger
 *
 * Manual trigger for the alert detector. Only available in development
 * (NODE_ENV !== 'production').
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Manual trigger disabled in production' },
      { status: 403 }
    );
  }

  try {
    const result = await runAlertDetector();
    return NextResponse.json({
      ok: true,
      triggered: 'manual',
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
