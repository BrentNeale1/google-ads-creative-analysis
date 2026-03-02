import { Suspense } from "react";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * AppShell is the root layout wrapper for the application.
 * It renders the Sidebar navigation on the left and the main
 * scrollable content area on the right, using a flex layout.
 *
 * Async Server Component: queries accounts from the database
 * and passes them to the Sidebar for the account selector dropdown.
 *
 * Background: surface.background (#F8F9FA) from the design system.
 * Padding: p-4 on smaller screens, p-6 on lg+ breakpoint.
 */

interface AppShellProps {
  children: React.ReactNode;
}

async function fetchAccountsForSidebar() {
  try {
    const accounts = await db
      .select({
        id: schema.accounts.id,
        displayName: schema.accounts.displayName,
      })
      .from(schema.accounts)
      .orderBy(schema.accounts.displayName);
    return accounts;
  } catch {
    // If DATABASE_URL is not set or DB is unreachable, return empty
    return [];
  }
}

export const AppShell = async ({ children }: AppShellProps) => {
  const accounts = await fetchAccountsForSidebar();

  return (
    <div className="flex h-screen bg-surface-background">
      {/* Sidebar navigation with account data */}
      <Suspense fallback={null}>
        <Sidebar accounts={accounts} />
      </Suspense>

      {/* Main content area -- scrollable, padded */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
};
