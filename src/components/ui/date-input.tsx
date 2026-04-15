"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Converts yyyy-mm-dd → dd.mm.yyyy for display
function toDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

// Converts dd.mm.yyyy → yyyy-mm-dd for state/DB
function toISO(display: string): string {
  const parts = display.replace(/\s/g, "").split(".")
  if (parts.length === 3) {
    const [d, m, y] = parts
    if (d && m && y && y.length === 4) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return ""
}

interface DateInputProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value?: string // yyyy-mm-dd
  onChange?: (e: { target: { value: string } }) => void // fires with yyyy-mm-dd
}

function DateInput({ value = "", onChange, className, ...props }: DateInputProps) {
  const [display, setDisplay] = React.useState(() => toDisplay(value))

  // Sync when external value changes (e.g. form reset or edit open)
  React.useEffect(() => {
    setDisplay(toDisplay(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value

    // Auto-insert dots after day and month digits
    raw = raw.replace(/[^0-9.]/g, "")
    if (raw.length === 2 && !raw.includes(".")) raw = raw + "."
    if (raw.length === 5 && raw.split(".").length - 1 === 1) raw = raw + "."

    setDisplay(raw)

    const iso = toISO(raw)
    if (iso && onChange) {
      onChange({ target: { value: iso } })
    } else if (raw === "" && onChange) {
      onChange({ target: { value: "" } })
    }
  }

  function handleBlur() {
    // Reformat on blur if valid, otherwise leave as-is
    const iso = toISO(display)
    if (iso) setDisplay(toDisplay(iso))
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="dd.mm.yyyy"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(className)}
      {...props}
    />
  )
}

export { DateInput }
