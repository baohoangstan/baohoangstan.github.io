import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, X, Search } from "lucide-react"

import { cn } from "@site/src/lib/utils"

export type MultiSelectOption = {
  value: string
  label?: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowCustom?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No options",
  allowCustom = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [mounted, setMounted] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [menuRect, setMenuRect] = React.useState<{ top: number; left: number; width: number } | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = React.useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setMenuRect({ top: r.bottom + 4, left: r.left, width: r.width })
  }, [])

  React.useEffect(() => {
    if (!open) return
    updatePosition()
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false)
        setQuery("")
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }
    const onReposition = () => updatePosition()
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [open, updatePosition])

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  const remove = (value: string) => {
    onChange(selected.filter((v) => v !== value))
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = options.filter((o) =>
    (o.label ?? o.value).toLowerCase().includes(normalizedQuery)
  )
  const canAddCustom =
    allowCustom &&
    normalizedQuery.length > 0 &&
    !options.some((o) => o.value.toLowerCase() === normalizedQuery) &&
    !selected.some((s) => s.toLowerCase() === normalizedQuery)

  const addCustom = () => {
    const value = query.trim()
    if (!value) return
    if (!selected.includes(value)) onChange([...selected, value])
    setQuery("")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-left text-sm shadow-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className="flex flex-1 flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-secondary-foreground"
              >
                {options.find((o) => o.value === value)?.label ?? value}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${value}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(value)
                  }}
                  className="rounded-sm hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && mounted && menuRect && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[1000] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
          style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
        >
          <div className="flex items-center gap-2 border-b px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddCustom) {
                  e.preventDefault()
                  addCustom()
                }
              }}
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filtered.length === 0 && !canAddCustom && (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            )}
            {filtered.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate font-mono text-xs">
                    {option.label ?? option.value}
                  </span>
                </button>
              )
            })}
            {canAddCustom && (
              <button
                type="button"
                onClick={addCustom}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-dashed border-input">
                  +
                </span>
                <span className="truncate text-xs">
                  Add “<span className="font-mono">{query.trim()}</span>”
                </span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
