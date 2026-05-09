import React from 'react'
import { cn } from '../lib/utils'

export interface ToolLayoutProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ToolLayout({ title, description, children, className = '' }: ToolLayoutProps) {
  return (
    <div className={cn("bg-background", className)}>
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {(title || description) && (
          <div>
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
