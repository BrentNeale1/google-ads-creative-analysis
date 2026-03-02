"use client";

import { useQueryStates, parseAsStringLiteral } from "nuqs";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "assets", label: "Assets" },
  { key: "recommendations", label: "Recommendations" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export interface RsaTabNavProps {
  activeTab: string;
}

/**
 * RSA page tab navigation using URL search params for state.
 * Tabs: Overview | Assets | Recommendations
 */
export function RsaTabNav({ activeTab }: RsaTabNavProps) {
  const [, setParams] = useQueryStates(
    {
      tab: parseAsStringLiteral(
        ["overview", "assets", "recommendations"] as const,
      ).withDefault("overview"),
    },
    { shallow: false },
  );

  const handleTabClick = (tab: TabKey) => {
    setParams({ tab: tab === "overview" ? null : tab });
  };

  return (
    <div className="border-b border-surface-gridline">
      <nav className="flex gap-6" aria-label="RSA analysis tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`
                pb-3 text-sm font-medium transition-colors border-b-2
                ${
                  isActive
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
