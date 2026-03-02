import { FileText, Key, Play, BarChart3, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/** Force dynamic rendering so account data is always fresh */
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------
//  Setup guide steps (always shown)
// ---------------------------------------------------------------

const steps = [
  {
    number: 1,
    title: "Set up Google Ads Script",
    description:
      "Copy the provided script into your Google Ads account to begin collecting creative performance data.",
    icon: FileText,
  },
  {
    number: 2,
    title: "Configure API Key",
    description:
      "Add your unique API key to the script configuration so the app can securely receive your data.",
    icon: Key,
  },
  {
    number: 3,
    title: "Push First Data",
    description:
      "Run the script manually or wait for the daily schedule. Data will be analysed automatically.",
    icon: Play,
  },
  {
    number: 4,
    title: "View Your Dashboard",
    description:
      "Performance data will appear here automatically. Surface what's working, what's not, and what to test next.",
    icon: BarChart3,
  },
];

// ---------------------------------------------------------------
//  Relative time formatter
// ---------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------
//  Sync status helpers
// ---------------------------------------------------------------

type SyncStatus = "active" | "stale" | "inactive";

function getSyncStatus(lastSyncedAt: Date | null): SyncStatus {
  if (!lastSyncedAt) return "inactive";
  const now = new Date();
  const diffMs = now.getTime() - lastSyncedAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours <= 48) return "active";
  if (diffHours <= 168) return "stale"; // 7 days
  return "inactive";
}

const STATUS_CONFIG: Record<SyncStatus, { label: string; dotClass: string; badgeClass: string }> = {
  active: {
    label: "Active",
    dotClass: "bg-brand-green",
    badgeClass: "text-brand-green border-brand-green/30 bg-brand-green/5",
  },
  stale: {
    label: "Stale",
    dotClass: "bg-brand-amber",
    badgeClass: "text-brand-amber border-brand-amber/30 bg-brand-amber/5",
  },
  inactive: {
    label: "Inactive",
    dotClass: "bg-brand-red",
    badgeClass: "text-brand-red border-brand-red/30 bg-brand-red/5",
  },
};

// ---------------------------------------------------------------
//  Data fetching (Server Component)
// ---------------------------------------------------------------

interface SyncEntry {
  pushedAt: Date;
  recordCount: number;
  status: string;
  errorMessage: string | null;
}

interface AccountWithSyncs {
  id: string;
  displayName: string;
  lastSyncedAt: Date | null;
  recentSyncs: SyncEntry[];
}

async function getAccounts(): Promise<AccountWithSyncs[]> {
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

    return accountsWithSyncs;
  } catch {
    // If DATABASE_URL is not set or DB is unreachable, return empty
    return [];
  }
}

// ---------------------------------------------------------------
//  Page component
// ---------------------------------------------------------------

export default async function Home() {
  const accounts = await getAccounts();
  const hasAccounts = accounts.length > 0;

  return (
    <div className="max-w-3xl mx-auto pt-8 lg:pt-16 pl-10 lg:pl-0">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome to Creative Analyser
        </h1>
        <p className="text-base text-gray-500">
          Surface what&apos;s working, what&apos;s not, and what to test next
        </p>
      </div>

      {/* Status badge */}
      <div className="mb-8">
        {hasAccounts ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm text-brand-green border border-brand-green/30">
            <span className="h-2 w-2 rounded-full bg-brand-green" />
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"} connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm text-brand-grey border border-surface-gridline">
            <span className="h-2 w-2 rounded-full bg-brand-grey" />
            No data received yet
          </span>
        )}
      </div>

      {/* Connected accounts */}
      {hasAccounts && (
        <div className="mb-10 space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Connected Accounts
          </h2>

          <div className="space-y-4">
            {accounts.map((account) => {
              const status = getSyncStatus(account.lastSyncedAt);
              const config = STATUS_CONFIG[status];

              return (
                <div
                  key={account.id}
                  className="bg-white rounded-xl border border-surface-gridline p-5 shadow-sm"
                >
                  {/* Account header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {account.displayName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {account.id}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
                      {config.label}
                    </span>
                  </div>

                  {/* Last synced */}
                  {account.lastSyncedAt && (
                    <p className="text-xs text-gray-500 mb-3">
                      Last synced: {formatRelativeTime(account.lastSyncedAt)}
                    </p>
                  )}

                  {/* Recent sync log */}
                  {account.recentSyncs.length > 0 && (
                    <div className="border-t border-surface-gridline pt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Recent syncs
                      </p>
                      <div className="space-y-1.5">
                        {account.recentSyncs.map((sync, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {sync.status === "success" ? (
                                <CheckCircle size={12} className="text-brand-green flex-shrink-0" />
                              ) : (
                                <XCircle size={12} className="text-brand-red flex-shrink-0" />
                              )}
                              <span className="text-gray-600">
                                {formatRelativeTime(sync.pushedAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400">
                                {sync.recordCount} records
                              </span>
                              {sync.status === "error" && sync.errorMessage && (
                                <span className="text-brand-red truncate max-w-[200px]" title={sync.errorMessage}>
                                  <AlertTriangle size={10} className="inline mr-1" />
                                  {sync.errorMessage}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Setup steps -- always visible */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {hasAccounts ? "Add Another Account" : "Getting Started"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white rounded-xl border border-surface-gridline p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-brand-blue/10 text-brand-blue text-sm font-semibold">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={15} className="text-brand-grey flex-shrink-0" />
                      <h3 className="text-sm font-medium text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
