import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
  parseAsIsoDate,
} from "nuqs/server";
import { subDays, differenceInDays, format, startOfDay } from "date-fns";

/**
 * Dashboard URL search param definitions.
 * Parsed server-side via createSearchParamsCache (nuqs/server)
 * and client-side via useQueryStates (nuqs).
 */
export const dashboardSearchParams = createSearchParamsCache({
  /** Google Ads account ID */
  account: parseAsString.withDefault(""),
  /** Date range preset */
  range: parseAsStringLiteral(
    ["7d", "30d", "90d", "custom"] as const
  ).withDefault("30d"),
  /** Custom range start (ISO date) */
  from: parseAsIsoDate,
  /** Custom range end (ISO date) */
  to: parseAsIsoDate,
  /** Campaign ID filter */
  campaign: parseAsString,
  /** Ad group ID filter */
  adGroup: parseAsString,
});

export type DateRange = "7d" | "30d" | "90d" | "custom";

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

/**
 * Calculate the comparison period for period-over-period display.
 * Given a date range, returns the equivalent-length window immediately
 * preceding it.
 *
 * Example: dateFrom=2026-02-01, dateTo=2026-02-28 (28 days)
 * Comparison: 2026-01-04 to 2026-01-31 (28 days prior)
 */
export function getComparisonRange(
  dateFrom: string,
  dateTo: string,
): { compFrom: string; compTo: string } {
  const from = startOfDay(new Date(dateFrom));
  const to = startOfDay(new Date(dateTo));
  const days = differenceInDays(to, from) + 1; // inclusive

  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  const compTo = subDays(from, 1);
  const compFrom = subDays(compTo, days - 1);

  return {
    compFrom: fmt(compFrom),
    compTo: fmt(compTo),
  };
}
