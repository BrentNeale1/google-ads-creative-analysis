"use client";

import { useMemo, useState } from "react";
import type { CreativeRow } from "@/lib/queries/dashboard";
import {
  formatNumber,
  formatPercentage,
  formatCurrency,
  convertMicrosToAud,
} from "@/lib/constants/formatting";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

/** Columns where lower values are better (CPA). Affects row highlighting. */
const LOWER_IS_BETTER = new Set(["cpa"]);

/** Columns that are metric-based (not text) -- eligible for row highlighting. */
const METRIC_COLUMNS = new Set([
  "impressions",
  "clicks",
  "ctr",
  "conversions",
  "cpa",
  "roas",
]);

interface ColumnConfig {
  key: string;
  label: string;
  align: "left" | "right";
  format: (value: number) => string;
  /** Compute derived value from a row. If absent, use row[key] directly. */
  compute?: (row: CreativeRow) => number;
}

const COLUMNS: ColumnConfig[] = [
  { key: "name", label: "Creative", align: "left", format: (v) => String(v) },
  { key: "type", label: "Type", align: "left", format: (v) => String(v) },
  { key: "impressions", label: "Impr.", align: "right", format: formatNumber },
  { key: "clicks", label: "Clicks", align: "right", format: formatNumber },
  {
    key: "ctr",
    label: "CTR",
    align: "right",
    format: formatPercentage,
    compute: (row) => row.clicks / (row.impressions || 1),
  },
  {
    key: "conversions",
    label: "Conv.",
    align: "right",
    format: (v) => v.toFixed(1),
  },
  {
    key: "cpa",
    label: "CPA",
    align: "right",
    format: formatCurrency,
    compute: (row) =>
      convertMicrosToAud(row.costMicros) / (row.conversions || 1),
  },
  {
    key: "roas",
    label: "ROAS",
    align: "right",
    format: (v) => v.toFixed(2) + "x",
    compute: (row) =>
      row.conversionsValue / (convertMicrosToAud(row.costMicros) || 1),
  },
];

interface EnrichedRow extends CreativeRow {
  ctr: number;
  cpa: number;
  roas: number;
}

export interface PerformanceTableProps {
  data: CreativeRow[];
}

/**
 * Sortable, paginated data table for creative performance.
 * Displays 8 columns with click-to-sort headers and top/bottom row highlighting.
 */
export function PerformanceTable({ data }: PerformanceTableProps) {
  const [sortKey, setSortKey] = useState<string>("conversions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  // Enrich rows with computed fields once
  const enriched = useMemo<EnrichedRow[]>(
    () =>
      data.map((row) => ({
        ...row,
        ctr: row.clicks / (row.impressions || 1),
        cpa: convertMicrosToAud(row.costMicros) / (row.conversions || 1),
        roas:
          row.conversionsValue /
          (convertMicrosToAud(row.costMicros) || 1),
      })),
    [data],
  );

  // Sort enriched rows
  const sortedData = useMemo(() => {
    const sorted = [...enriched].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortKey];
      const bVal = (b as unknown as Record<string, unknown>)[sortKey];

      // Handle string columns (name, type)
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Handle numeric columns -- push NaN/null to end
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      const aValid = Number.isFinite(aNum);
      const bValid = Number.isFinite(bNum);

      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;

      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [enriched, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
  const pageData = sortedData.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  // Identify top/bottom performer indices in the current page
  const { topIdx, bottomIdx } = useMemo(() => {
    if (!METRIC_COLUMNS.has(sortKey) || sortedData.length < 2) {
      return { topIdx: -1, bottomIdx: -1 };
    }

    // For the full sorted dataset, top is first and bottom is last
    // But we need their index within the page
    const isInverted = LOWER_IS_BETTER.has(sortKey);

    // In desc sort: first = highest value, last = lowest value
    // For normal metrics: highest = top (green), lowest = bottom (red)
    // For CPA (inverted): lowest = top (green), highest = bottom (red)
    let topGlobalIdx: number;
    let bottomGlobalIdx: number;

    if (sortDir === "desc") {
      topGlobalIdx = isInverted ? sortedData.length - 1 : 0;
      bottomGlobalIdx = isInverted ? 0 : sortedData.length - 1;
    } else {
      topGlobalIdx = isInverted ? 0 : sortedData.length - 1;
      bottomGlobalIdx = isInverted ? sortedData.length - 1 : 0;
    }

    const pageStart = page * PAGE_SIZE;
    const pageEnd = pageStart + pageData.length;

    return {
      topIdx:
        topGlobalIdx >= pageStart && topGlobalIdx < pageEnd
          ? topGlobalIdx - pageStart
          : -1,
      bottomIdx:
        bottomGlobalIdx >= pageStart && bottomGlobalIdx < pageEnd
          ? bottomGlobalIdx - pageStart
          : -1,
    };
  }, [sortedData, sortKey, sortDir, page, pageData.length]);

  // Handle header click
  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-gridline overflow-hidden shadow-sm">
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">
            No creative data for the selected filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-gridline overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F1F3F4]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-surface-gridline select-none ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ChevronUp size={14} className="text-brand-blue" />
                      ) : (
                        <ChevronDown size={14} className="text-brand-blue" />
                      )
                    ) : (
                      <ChevronDown size={14} className="text-gray-300" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, idx) => {
              const isTop = idx === topIdx;
              const isBottom = idx === bottomIdx;
              const rowBg = isTop
                ? "bg-[#E6F4EA]"
                : isBottom
                  ? "bg-[#FCE8E6]"
                  : "";

              return (
                <tr
                  key={row.adId}
                  className={`border-b border-surface-gridline hover:bg-surface-background ${rowBg}`}
                >
                  {COLUMNS.map((col) => {
                    const rawValue = (row as unknown as Record<string, unknown>)[col.key];
                    const displayValue =
                      col.align === "left"
                        ? String(rawValue)
                        : col.format(Number(rawValue));

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm ${
                          col.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-gridline bg-[#F8F9FA]">
          <span className="text-xs text-gray-500">
            Page {page + 1} of {totalPages} ({sortedData.length} creatives)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-surface-gridline bg-white hover:bg-surface-background disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-surface-gridline bg-white hover:bg-surface-background disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
