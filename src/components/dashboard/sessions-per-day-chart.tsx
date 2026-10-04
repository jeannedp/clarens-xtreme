"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  sessions: {
    label: "Sessions",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface EdgeTickProps {
  x?: number
  y?: number
  index?: number
  visibleTicksCount?: number
  payload?: { value: string }
}

function EdgeTick({ x, y, index, visibleTicksCount, payload }: EdgeTickProps) {
  const isEdge = index === 0 || index === (visibleTicksCount ?? 0) - 1
  if (!isEdge || !payload) return <g />

  return (
    <text x={x} y={(y ?? 0) + 12} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">
      {payload.value}
    </text>
  )
}

export function SessionsPerDayChart({ data }: { data: { label: string; sessions: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" interval={0} tickLine axisLine={false} tick={<EdgeTick />} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="sessions" fill="var(--color-sessions)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
