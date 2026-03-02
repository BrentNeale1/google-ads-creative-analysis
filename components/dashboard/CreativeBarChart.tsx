"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { COLOURS } from "@/lib/constants/colours";
import { ChartTooltip } from "./ChartTooltip";

export interface CreativeBarChartProps {
  /** Creative name + metric value pairs */
  data: Array<{ name: string; value: number }>;
  /** Formatter for axis tick labels and tooltip values */
  formatValue: (v: number) => string;
}

/** Recharts horizontal BarChart for creative comparison, sorted by value descending. */
export function CreativeBarChart({
  data,
  formatValue,
}: CreativeBarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, d) => sum + d.value, 0);
  const showLabels = sorted.length < 10;
  const dynamicHeight = Math.max(300, sorted.length * 40);

  return (
    <div style={{ minHeight: dynamicHeight }}>
      <ResponsiveContainer width="100%" height={dynamicHeight}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ left: 120, right: showLabels ? 60 : 20 }}
        >
          <CartesianGrid
            stroke={COLOURS.surface.gridline}
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis type="number" tickFormatter={formatValue} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={<ChartTooltip formatValue={formatValue} total={total} />}
          />
          <Bar
            dataKey="value"
            fill={COLOURS.brand.blue}
            radius={[0, 4, 4, 0]}
          >
            {showLabels && (
              <LabelList
                dataKey="value"
                position="right"
                formatter={formatValue}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
