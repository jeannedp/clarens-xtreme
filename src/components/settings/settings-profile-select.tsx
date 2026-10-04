"use client"

import { useRouter } from "next/navigation"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface SettingsProfileItem {
  value: string
  label: string
}

export function SettingsProfileSelect({ items, value }: { items: SettingsProfileItem[]; value: string }) {
  const router = useRouter()

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) router.push(`/settings?id=${encodeURIComponent(next)}`)
      }}
    >
      <SelectTrigger className="w-[220px] bg-white hover:bg-white">
        <SelectValue placeholder="Select a settings profile" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
