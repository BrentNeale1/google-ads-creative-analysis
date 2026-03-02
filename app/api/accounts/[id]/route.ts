import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

/**
 * GET /api/accounts/:id
 *
 * Returns a single account by ID with its recent sync history (last 10 entries).
 * Returns 404 if account not found.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const account = await db.query.accounts.findFirst({
      where: eq(schema.accounts.id, id),
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found', details: [] },
        { status: 404 },
      );
    }

    const recentSyncs = await db.query.syncLog.findMany({
      where: eq(schema.syncLog.accountId, account.id),
      orderBy: [desc(schema.syncLog.pushedAt)],
      limit: 10,
    });

    return NextResponse.json(
      {
        id: account.id,
        displayName: account.displayName,
        primaryKpi: account.primaryKpi,
        lastSyncedAt: account.lastSyncedAt,
        createdAt: account.createdAt,
        recentSyncs: recentSyncs.map((s) => ({
          pushedAt: s.pushedAt,
          recordCount: s.recordCount,
          status: s.status,
          errorMessage: s.errorMessage,
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch account', details: [{ field: '', message }] },
      { status: 500 },
    );
  }
}
