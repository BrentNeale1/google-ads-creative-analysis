/**
 * AU locale number formatting utilities.
 * Uses Intl.NumberFormat('en-AU') for locale-correct output.
 * All functions are named exports per CLAUDE.md code style.
 */

/** Format as AUD currency: $1,234.56 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/** Format as compact AUD currency: $12.4K */
export const formatCurrencyCompact = (value: number): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Format as percentage: 3.2%
 * Input is a ratio (e.g. 0.032 for 3.2%), NOT already multiplied by 100.
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

/** Format as plain number with locale grouping: 1,234 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-AU").format(value);
};

/** Format as compact number: 12.4K */
export const formatNumberCompact = (value: number): string => {
  return new Intl.NumberFormat("en-AU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

/** Convert Google Ads cost_micros (millionths of currency unit) to AUD dollars. */
export const convertMicrosToAud = (micros: number): number => {
  return micros / 1_000_000;
};
