import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
  parseAsIsoDate,
} from "nuqs/server";
import { subDays, format, startOfDay } from "date-fns";

/**
 * Display page URL search param definitions.
 * Parsed server-side via createSearchParamsCache (nuqs/server)
 * and client-side via useQueryStates (nuqs).
 */
export const displaySearchParams = createSearchParamsCache({
  /** Google Ads account ID */
  account: parseAsString.withDefault(""),
  /** Date range preset */
  range: parseAsStringLiteral(
    ["7d", "30d", "90d", "custom"] as const,
  ).withDefault("30d"),
  /** Custom range start (ISO date) */
  from: parseAsIsoDate,
  /** Custom range end (ISO date) */
  to: parseAsIsoDate,
  /** Campaign ID filter */
  campaign: parseAsString,
  /** Ad group ID filter */
  adGroup: parseAsString,
  /** Active tab for section navigation */
  tab: parseAsStringLiteral(
    ["overview", "formats", "recommendations"] as const,
  ).withDefault("overview"),
});

export type DateRange = "7d" | "30d" | "90d" | "custom";
export type DisplayTab = "overview" | "formats" | "recommendations";

/**
 * Resolve the active date range into concrete YYYY-MM-DD strings.
 * For presets (7d, 30d, 90d), computes from today.
 * For 'custom', uses from/to params with 30d fallback if either is null.
 */
export function resolveDateRange(params: {
  range: DateRange;
  from: Date | null;
  to: Date | null;
}): { dateFrom: string; dateTo: string } {
  const today = startOfDay(new Date());
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  const presetDays: Record<string, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  if (params.range === "custom" && params.from && params.to) {
    return {
      dateFrom: fmt(startOfDay(params.from)),
      dateTo: fmt(startOfDay(params.to)),
    };
  }

  const days = presetDays[params.range] ?? 30;
  return {
    dateFrom: fmt(subDays(today, days)),
    dateTo: fmt(today),
  };
}
