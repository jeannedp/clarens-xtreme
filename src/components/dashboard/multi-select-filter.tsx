"use client"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox"

export interface FilterOption {
  value: string
  label: string
}

export function MultiSelectFilter({
  options,
  value,
  onValueChange,
  placeholder,
  "aria-label": ariaLabel,
}: {
  options: FilterOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder: string
  "aria-label"?: string
}) {
  const anchor = useComboboxAnchor()

  return (
    <Combobox items={options} multiple value={value} onValueChange={onValueChange}>
      <ComboboxChips ref={anchor} className="flex-1 min-w-0 max-h-8 overflow-y-auto bg-background">
        {value.map((v) => (
          <ComboboxChip key={v}>{options.find((o) => o.value === v)?.label ?? v}</ComboboxChip>
        ))}
        <ComboboxChipsInput placeholder={value.length ? undefined : placeholder} aria-label={ariaLabel ?? placeholder} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No matches</ComboboxEmpty>
        <ComboboxList>
          {(item: FilterOption) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
