import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: "sm" | "md" | "lg"
  strokeWidth?: number
  showValue?: boolean
}

export function ProgressCircle({
  value,
  size = "md",
  strokeWidth = 8,
  showValue = true,
  className,
  ...props
}: ProgressCircleProps) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const sizes = {
    sm: "h-12 w-12 text-xs",
    md: "h-24 w-24 text-sm",
    lg: "h-40 w-40 text-xl",
  }

  return (
    <div
      className={cn("relative flex items-center justify-center", sizes[size], className)}
      {...props}
    >
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        {/* Progress circle */}
        <circle
          className="text-primary stroke-current transition-all duration-500 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center font-bold">
          {Math.round(value)}%
        </div>
      )}
    </div>
  )
}
