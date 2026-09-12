"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  rides: {
    label: "Rides",
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

export function RidesPerDayChart({ data }: { data: { label: string; rides: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        {/* every day still gets a tick mark; only the first/last get a label */}
        <XAxis dataKey="label" interval={0} tickLine axisLine={false} tick={<EdgeTick />} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="rides" fill="var(--color-rides)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
