import * as React from "react"
import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  wrap?: "soft" | "hard"
}

function Textarea({
  className,
  wrap = "soft",
  style,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      wrap={wrap}
      style={{ wordBreak: "break-all", ...style }}
      className={cn(
        // ---- CLASES AJUSTADAS ----
        "min-w-0 w-full max-w-full " +         // permite encoger y fija al 100%
        "bg-transparent border border-input rounded-md px-3 py-2 " +
        "whitespace-pre-wrap break-words " +   // fuerza wrap automático + respeta saltos
        "placeholder:text-muted-foreground " +
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] " +
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 " +
        "dark:aria-invalid:ring-destructive/40 dark:bg-input/30 " +
        "resize-y outline-none transition-[color,box-shadow] shadow-xs " +
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
