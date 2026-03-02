"use client";

import { useState, useMemo } from "react";
import type {
  Recommendation,
  RecommendationAction,
  TieredCreative,
} from "@/lib/analysis/types";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface RecommendationListProps {
  recommendations: Recommendation[];
  creatives: TieredCreative[];
}

/** Action group config: label, colour, bg, sort order */
const ACTION_CONFIG: Record<
  RecommendationAction,
  { label: string; colour: string; bgColour: string; borderColour: string; order: number }
> = {
  pause: {
    label: "Pause",
    colour: "#EA4335",
    bgColour: "bg-[#EA4335]/10",
    borderColour: "border-[#EA4335]/20",
    order: 1,
  },
  investigate: {
    label: "Investigate",
    colour: "#FBBC04",
    bgColour: "bg-[#FBBC04]/10",
    borderColour: "border-[#FBBC04]/20",
    order: 2,
  },
  test: {
    label: "Test",
    colour: "#1A73E8",
    bgColour: "bg-[#1A73E8]/10",
    borderColour: "border-[#1A73E8]/20",
    order: 3,
  },
  keep: {
    label: "Keep",
    colour: "#34A853",
    bgColour: "bg-[#34A853]/10",
    borderColour: "border-[#34A853]/20",
    order: 4,
  },
};

/** Parse headline preview from creative data */
function getCreativeName(creative: TieredCreative): string {
  const adGroup = String(creative.adGroupName ?? "");
  const headlines = creative.headlines;
  let firstHeadline = "";
  if (Array.isArray(headlines) && headlines.length > 0) {
    const h = headlines[0];
    firstHeadline =
      typeof h === "string" ? h : (h as { text?: string })?.text ?? "";
  }
  if (adGroup && firstHeadline) {
    return `${adGroup} / ${firstHeadline}`;
  }
  return adGroup || firstHeadline || creative.adId;
}

/**
 * Keep/Test/Pause/Investigate action list.
 * Grouped by action type with expandable details.
 */
export function RecommendationList({
  recommendations,
  creatives,
}: RecommendationListProps) {
  // Build creative lookup
  const creativeMap = useMemo(() => {
    const map = new Map<string, TieredCreative>();
    for (const c of creatives) {
      map.set(c.adId, c);
    }
    return map;
  }, [creatives]);

  // Group recommendations by action
  const groups = useMemo(() => {
    const groupMap = new Map<RecommendationAction, Recommendation[]>();

    for (const rec of recommendations) {
      const existing = groupMap.get(rec.action) ?? [];
      existing.push(rec);
      groupMap.set(rec.action, existing);
    }

    // Sort within groups by KPI value
    for (const [action, recs] of Array.from(groupMap.entries())) {
      recs.sort((a: Recommendation, b: Recommendation) => {
        const creativeA = creativeMap.get(a.adId);
        const creativeB = creativeMap.get(b.adId);
        const valA = creativeA?.kpiValue ?? 0;
        const valB = creativeB?.kpiValue ?? 0;
        // Pause: worst first (highest CPA / lowest ROAS at top)
        // Keep: best first
        if (action === "pause" || action === "investigate") {
          return valB - valA; // descending for worst first
        }
        return valA - valB; // ascending for best first (keep)
      });
    }

    // Return sorted array of groups
    return (
      ["pause", "investigate", "test", "keep"] as RecommendationAction[]
    )
      .filter((action) => groupMap.has(action))
      .map((action) => ({
        action,
        config: ACTION_CONFIG[action],
        recommendations: groupMap.get(action)!,
      }));
  }, [recommendations, creativeMap]);

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-gridline p-8 text-center">
        <p className="text-sm text-gray-500">
          No recommendations available -- add more creatives for analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.action}>
          {/* Group header */}
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: group.config.colour }}
            >
              {group.config.label}
            </span>
            <span className="text-gray-400 text-xs font-normal">
              ({group.recommendations.length})
            </span>
          </h3>

          {/* Recommendation cards */}
          <div className="space-y-2">
            {group.recommendations.map((rec) => (
              <RecommendationCard
                key={rec.adId}
                recommendation={rec}
                creative={creativeMap.get(rec.adId)}
                config={group.config}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  creative: TieredCreative | undefined;
  config: (typeof ACTION_CONFIG)[RecommendationAction];
}

function RecommendationCard({
  recommendation,
  creative,
  config,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const creativeName = creative
    ? getCreativeName(creative)
    : recommendation.adId;

  return (
    <div
      className={`${config.bgColour} border ${config.borderColour} rounded-lg overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-400 truncate">{creativeName}</p>
          <p className="text-sm text-gray-800">{recommendation.summary}</p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-0 border-t border-surface-gridline">
          <p className="text-sm text-gray-700 mt-2">
            {recommendation.details}
          </p>
        </div>
      )}
    </div>
  );
}
