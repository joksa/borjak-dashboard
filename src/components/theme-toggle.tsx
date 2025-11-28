"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/lib/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = theme === "dark"

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark")
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4" />
        <div className="h-6 w-11" /> {/* Placeholder to maintain layout */}
        <Moon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch checked={isDark} onCheckedChange={handleToggle} />
      <Moon className="h-4 w-4" />
    </div>
  )
}
