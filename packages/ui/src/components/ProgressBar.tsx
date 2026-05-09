import React from 'react'
import { Progress } from './ui/progress'
import { cn } from '../lib/utils'

export interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ value, max = 100, className = '', showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn("space-y-1", className)}>
      <Progress value={pct} className="h-1.5" />
      {showLabel && (
        <p className="text-xs text-muted-foreground text-right">{Math.round(pct)}%</p>
      )}
    </div>
  )
}
