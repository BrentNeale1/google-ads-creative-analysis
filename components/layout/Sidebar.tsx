"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Zap,
  Monitor,
  PlayCircle,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  disabled: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    active: true,
    disabled: false,
  },
  {
    name: "RSA Analysis",
    href: "/rsa",
    icon: Search,
    active: false,
    disabled: true,
  },
  {
    name: "PMax",
    href: "/pmax",
    icon: Zap,
    active: false,
    disabled: true,
  },
  {
    name: "Display",
    href: "/display",
    icon: Monitor,
    active: false,
    disabled: true,
  },
  {
    name: "Video",
    href: "/video",
    icon: PlayCircle,
    active: false,
    disabled: true,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    active: false,
    disabled: false,
  },
];

interface SidebarProps {
  accounts: Array<{ id: string; displayName: string }>;
}

export const Sidebar = ({ accounts }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedAccount = searchParams.get("account") ?? "";

  const handleAccountChange = (accountId: string) => {
    if (!accountId) return;
    // Preserve existing search params and update account
    const params = new URLSearchParams(searchParams.toString());
    params.set("account", accountId);
    router.push(`/dashboard?${params.toString()}`);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-md p-2 text-brand-grey hover:bg-surface-gridline transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-surface-gridline
          flex flex-col transition-transform duration-200 ease-in-out
          w-60
          lg:relative lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-end p-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-brand-grey hover:bg-surface-gridline transition-colors"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block h-6" />

        {/* Account selector */}
        <div className="px-4 mb-4">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-grey mb-1.5">
            Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="bg-white border border-surface-gridline rounded-lg px-3 py-2 text-sm w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
          >
            <option value="" disabled>
              Select account...
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.disabled ? undefined : item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${
                    item.active
                      ? "bg-brand-blue/10 text-brand-blue"
                      : item.disabled
                        ? "opacity-50 cursor-not-allowed text-brand-grey"
                        : "text-gray-600 hover:bg-surface-background hover:text-gray-900"
                  }
                `}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  } else {
                    setMobileOpen(false);
                  }
                }}
              >
                <Icon
                  size={18}
                  className={item.active ? "text-brand-blue" : ""}
                />
                <span>{item.name}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs text-brand-grey">Soon</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom branding */}
        <div className="px-6 py-4 border-t border-surface-gridline">
          <p className="text-xs text-brand-grey">Creative Analyser</p>
        </div>
      </aside>
    </>
  );
};
