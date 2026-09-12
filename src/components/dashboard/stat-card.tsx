import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function StatCard({
  title,
  value,
  subtitle,
  loading,
}: {
  title: string
  value: number | undefined
  subtitle: string
  loading: boolean
}) {
  return (
    <Card className="flex-1 min-w-[180px] gap-0 border-t-4 border-t-chart-2 text-chart-2">
      <CardHeader className="h-[30px]">
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col text-[28px] font-bold">
        {value ?? (loading ? "…" : 0)}
      </CardContent>
      <CardFooter className="text-[12px] h-[40px] border-transparent bg-transparent text-muted-foreground">{subtitle}</CardFooter>
    </Card>
  )
}
