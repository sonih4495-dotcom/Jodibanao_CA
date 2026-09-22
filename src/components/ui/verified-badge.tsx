import React from "react"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function VerifiedBadge({ size = "md", showLabel = false, className }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)} title="Verified CA/CS Member">
      <ShieldCheck className={cn("text-success shrink-0", sizeClasses[size])} />
      {showLabel && (
        <span className={cn("font-medium text-success", textClasses[size])}>
          Verified Member
        </span>
      )}
    </div>
  )
}
