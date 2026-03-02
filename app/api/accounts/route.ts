import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

/**
 * GET /api/accounts
 *
 * Returns a list of all registered accounts with their recent sync history.
 * No authentication required for v1 (single operator).
 */
export async function GET() {
  try {
    const allAccounts = await db.query.accounts.findMany({
      orderBy: [desc(schema.accounts.lastSyncedAt)],
    });

    const accountsWithSyncs = await Promise.all(
      allAccounts.map(async (account) => {
        const recentSyncs = await db.query.syncLog.findMany({
          where: eq(schema.syncLog.accountId, account.id),
          orderBy: [desc(schema.syncLog.pushedAt)],
          limit: 10,
        });

        return {
          id: account.id,
          displayName: account.displayName,
          primaryKpi: account.primaryKpi,
          lastSyncedAt: account.lastSyncedAt,
          recentSyncs: recentSyncs.map((s) => ({
            pushedAt: s.pushedAt,
            recordCount: s.recordCount,
            status: s.status,
            errorMessage: s.errorMessage,
          })),
        };
      }),
    );

    return NextResponse.json({ accounts: accountsWithSyncs }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: [{ field: '', message }] },
      { status: 500 },
    );
  }
}
