"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COLOURS } from "@/lib/constants/colours";
import { ChartTooltip } from "./ChartTooltip";

export interface TimeSeriesChartProps {
  /** Daily time series data for one metric */
  data: Array<{ date: string; value: number }>;
  /** Formatter for axis tick labels and tooltip values */
  formatValue: (v: number) => string;
}

/** Recharts LineChart wrapper for time-series trends. */
export function TimeSeriesChart({ data, formatValue }: TimeSeriesChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="min-h-[300px]">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
        >
          <CartesianGrid
            stroke={COLOURS.surface.gridline}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(d: string) =>
              new Date(d).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
              })
            }
          />
          <YAxis tickFormatter={formatValue} tick={{ fontSize: 12 }} />
          <Tooltip
            content={<ChartTooltip formatValue={formatValue} total={total} />}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={COLOURS.brand.blue}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: COLOURS.brand.blue }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
