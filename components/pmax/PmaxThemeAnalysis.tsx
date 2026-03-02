"use client";

import type { PmaxTextAsset } from "@/lib/queries/pmax";
import { AlertTriangle } from "lucide-react";

export interface PmaxThemeAnalysisProps {
  textAssets: PmaxTextAsset[];
  /** Map of assetGroupId to assetGroupName for display */
  assetGroupNames: Record<string, string>;
}

/** Performance label colour config */
const LABEL_STYLES: Record<string, string> = {
  BEST: "bg-[#34A853]/10 text-[#34A853]",
  GOOD: "bg-[#1A73E8]/10 text-[#1A73E8]",
  LOW: "bg-[#EA4335]/10 text-[#EA4335]",
  LEARNING: "bg-[#FBBC04]/10 text-[#9A7400]",
};

/**
 * PMax text asset theme analysis.
 * Shows which text assets are present across PMax asset groups,
 * grouped by asset group with performance labels.
 */
export function PmaxThemeAnalysis({
  textAssets,
  assetGroupNames,
}: PmaxThemeAnalysisProps) {
  // Group text assets by asset group
  const grouped = new Map<
    string,
    Array<{ textContent: string | null; performanceLabel: string | null }>
  >();

  for (const asset of textAssets) {
    const existing = grouped.get(asset.assetGroupId) ?? [];
    existing.push({
      textContent: asset.textContent,
      performanceLabel: asset.performanceLabel,
    });
    grouped.set(asset.assetGroupId, existing);
  }

  const assetGroupIds = Array.from(grouped.keys()).sort((a, b) => {
    const nameA = assetGroupNames[a] ?? a;
    const nameB = assetGroupNames[b] ?? b;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-4">
      {/* Caveat banner */}
      <div className="bg-[#FBBC04]/10 border border-[#FBBC04]/30 rounded-lg px-4 py-3 flex items-start gap-3">
        <AlertTriangle
          size={18}
          className="text-[#9A7400] flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="text-sm font-medium text-[#9A7400]">
            Google controls creative assembly
          </p>
          <p className="text-xs text-[#9A7400]/80 mt-0.5">
            Theme analysis reflects asset composition, not Google&apos;s served
            combinations. Performance labels are Google&apos;s directional
            ratings -- cross-reference with conversion data.
          </p>
        </div>
      </div>

      {assetGroupIds.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-gridline p-8 text-center">
          <p className="text-sm text-gray-500">
            No text assets found for PMax asset groups in this period.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assetGroupIds.map((agId) => {
            const assets = grouped.get(agId) ?? [];
            const groupName = assetGroupNames[agId] ?? agId;

            return (
              <div
                key={agId}
                className="bg-white rounded-xl border border-surface-gridline shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#F8F9FA] border-b border-surface-gridline">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {groupName}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {assets.length} text asset{assets.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="divide-y divide-surface-gridline">
                  {assets.map((asset, idx) => (
                    <div
                      key={`${agId}-${idx}`}
                      className="px-4 py-2.5 flex items-center justify-between gap-3"
                    >
                      <p className="text-sm text-gray-700 truncate flex-1">
                        {asset.textContent ?? "(empty)"}
                      </p>
                      {asset.performanceLabel && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                            LABEL_STYLES[asset.performanceLabel] ??
                            "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {asset.performanceLabel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
