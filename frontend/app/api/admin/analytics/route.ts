// Task 12.3 — Analytics API Endpoint
// REST API restricted to admins serving aggregated enterprise automation analytics

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAnalyticsSummary } from '@/lib/analytics';

function requireAdmin(session: { user?: { id?: string } | null } | null) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return role === 'eng_admin' || role === 'sys_admin';
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const analytics = await getAnalyticsSummary();
    return NextResponse.json({ analytics });
  } catch (err) {
    console.error('[Analytics API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
