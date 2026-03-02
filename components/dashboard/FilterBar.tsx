"use client";

/**
 * FilterBar placeholder -- will be replaced with full implementation in Task 2.
 * Provides the correct type interface so the dashboard page type-checks.
 */

interface FilterBarProps {
  campaigns: Array<{ id: string; name: string }>;
  adGroups: Array<{ id: string; name: string; campaignId: string }>;
}

export const FilterBar = ({ campaigns, adGroups }: FilterBarProps) => {
  return (
    <div className="bg-white border-b border-surface-gridline px-6 py-3 rounded-lg">
      <p className="text-sm text-gray-500">
        Filters: {campaigns.length} campaigns, {adGroups.length} ad groups
      </p>
    </div>
  );
};
