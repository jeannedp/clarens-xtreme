'use client'

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function RangeDatePicker({
  date,
  onDateChange,
}: {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}) {
  return (
    <Field className="w-fit">
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal">
              <CalendarIcon data-icon="inline-start" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={onDateChange} numberOfMonths={2} />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
