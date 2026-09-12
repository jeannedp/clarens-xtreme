"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  rides: {
    label: "Sessions",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const MINOR_STEP = 5
const MAJOR_STEP = 10
const VIEWPORT_HEIGHT = 220

function ticksTo(max: number, step: number): number[] {
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  return ticks
}

export function SessionsPerGearChart({ data }: { data: { label: string; rides: number }[] }) {
  const maxValue = Math.max(0, ...data.map((d) => d.rides))
  const domainMax = Math.max(MAJOR_STEP, Math.ceil((maxValue + 1) / MAJOR_STEP) * MAJOR_STEP)
  const majorTicks = ticksTo(domainMax, MAJOR_STEP)
  const minorTicks = ticksTo(domainMax, MINOR_STEP)
  const chartHeight = Math.max(VIEWPORT_HEIGHT, data.length * 36 + 40)

  return (
    <div className="h-[220px] w-full overflow-y-auto">
      <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height: chartHeight }}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
          <CartesianGrid xAxisId="minor" horizontal={false} stroke="var(--border)" strokeOpacity={0.6} />
          <CartesianGrid xAxisId="major" horizontal={false} stroke="var(--border)" />
          <XAxis xAxisId="minor" type="number" domain={[0, domainMax]} ticks={minorTicks} hide />
          <XAxis
            xAxisId="major"
            type="number"
            domain={[0, domainMax]}
            ticks={majorTicks}
            tickLine={false}
            axisLine={false}
          />
          <YAxis type="category" dataKey="label" width={140} tickLine={false} axisLine={false} interval={0} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar xAxisId="major" dataKey="rides" fill="var(--color-rides)" radius={4} barSize={18} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
