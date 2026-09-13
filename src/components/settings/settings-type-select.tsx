"use client"

import { useRouter } from "next/navigation"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SettingsTypeSelect({ types, value }: { types: string[]; value: string }) {
  const router = useRouter()

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) router.push(`/settings?type=${encodeURIComponent(next)}`)
      }}
    >
      <SelectTrigger className="w-[220px] bg-white hover:bg-white">
        <SelectValue placeholder="Select a settings group" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {types.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
