"use client";

import { useQueryStates, parseAsString, parseAsStringLiteral, parseAsIsoDate } from "nuqs";
import { Calendar, Filter, X } from "lucide-react";

interface FilterBarProps {
  campaigns: Array<{ id: string; name: string }>;
  adGroups: Array<{ id: string; name: string; campaignId: string }>;
}

const RANGE_OPTIONS = ["7d", "30d", "90d", "custom"] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const PRESET_LABELS: Record<string, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
};

export const FilterBar = ({ campaigns, adGroups }: FilterBarProps) => {
  const [filters, setFilters] = useQueryStates({
    range: parseAsStringLiteral(RANGE_OPTIONS).withDefault("30d"),
    from: parseAsIsoDate,
    to: parseAsIsoDate,
    campaign: parseAsString,
    adGroup: parseAsString,
  });

  const isCustom = filters.range === "custom";

  // Filter ad groups by selected campaign
  const filteredAdGroups = filters.campaign
    ? adGroups.filter((ag) => ag.campaignId === filters.campaign)
    : adGroups;

  const handlePresetClick = (preset: RangeOption) => {
    setFilters({ range: preset, from: null, to: null });
  };

  const handleCustomToggle = () => {
    if (isCustom) {
      // Switch back to default
      setFilters({ range: "30d", from: null, to: null });
    } else {
      setFilters({ range: "custom", from: null, to: null });
    }
  };

  const handleFromChange = (value: string) => {
    setFilters({
      range: "custom",
      from: value ? new Date(value) : null,
    });
  };

  const handleToChange = (value: string) => {
    setFilters({
      range: "custom",
      to: value ? new Date(value) : null,
    });
  };

  const handleCampaignChange = (value: string) => {
    // CRITICAL: clear adGroup when campaign changes (prevents stale ad group selection)
    setFilters({ campaign: value || null, adGroup: null });
  };

  const handleAdGroupChange = (value: string) => {
    setFilters({ adGroup: value || null });
  };

  const handleClearAll = () => {
    setFilters({
      range: "30d",
      from: null,
      to: null,
      campaign: null,
      adGroup: null,
    });
  };

  const hasActiveFilters =
    filters.range !== "30d" ||
    filters.from !== null ||
    filters.to !== null ||
    filters.campaign !== null ||
    filters.adGroup !== null;

  return (
    <div className="bg-white border-b border-surface-gridline px-6 py-3 rounded-lg">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Date range section */}
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-brand-grey mr-1" />

          {/* Preset buttons */}
          {(["7d", "30d", "90d"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${
                  filters.range === preset
                    ? "bg-brand-blue text-white"
                    : "bg-surface-background text-gray-600 hover:bg-surface-gridline"
                }
              `}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}

          {/* Custom button */}
          <button
            onClick={handleCustomToggle}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${
                isCustom
                  ? "bg-brand-blue text-white"
                  : "bg-surface-background text-gray-600 hover:bg-surface-gridline"
              }
            `}
          >
            Custom
          </button>

          {/* Custom date inputs */}
          {isCustom && (
            <div className="flex items-center gap-1.5 ml-1">
              <input
                type="date"
                value={
                  filters.from
                    ? filters.from.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => handleFromChange(e.target.value)}
                className="border border-surface-gridline rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue/30"
                placeholder="From"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={
                  filters.to
                    ? filters.to.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => handleToChange(e.target.value)}
                className="border border-surface-gridline rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue/30"
                placeholder="To"
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-surface-gridline" />

        {/* Campaign / Ad group filter section */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-brand-grey" />

          {/* Campaign dropdown */}
          <select
            value={filters.campaign ?? ""}
            onChange={(e) => handleCampaignChange(e.target.value)}
            className="bg-white border border-surface-gridline rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue/30 max-w-[200px]"
          >
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Ad group dropdown */}
          <select
            value={filters.adGroup ?? ""}
            onChange={(e) => handleAdGroupChange(e.target.value)}
            className="bg-white border border-surface-gridline rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-blue/30 max-w-[200px]"
          >
            <option value="">All ad groups</option>
            {filteredAdGroups.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-surface-gridline" />
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs text-brand-grey hover:text-gray-900 transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          </>
        )}
      </div>
    </div>
  );
};
