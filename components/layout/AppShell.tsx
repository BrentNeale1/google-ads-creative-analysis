import { Sidebar } from "@/components/layout/Sidebar";

/**
 * AppShell is the root layout wrapper for the application.
 * It renders the Sidebar navigation on the left and the main
 * scrollable content area on the right, using a flex layout.
 *
 * Background: surface.background (#F8F9FA) from the design system.
 * Padding: p-4 on smaller screens, p-6 on lg+ breakpoint.
 */

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="flex h-screen bg-surface-background">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area -- scrollable, padded */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
};
