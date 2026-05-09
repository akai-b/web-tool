import React from 'react'
import { X, FileImage, Loader2 } from 'lucide-react'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

export interface FileItem {
  id: string
  name: string
  size: number
  status: 'pending' | 'processing' | 'done' | 'error'
  progress?: number
  resultSize?: number
  error?: string
}

export interface FileListProps {
  files: FileItem[]
  onRemove?: (id: string) => void
  className?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const statusConfig = {
  pending: { label: '等待', variant: 'secondary' as const },
  processing: { label: '处理中', variant: 'info' as const },
  done: { label: '完成', variant: 'success' as const },
  error: { label: '错误', variant: 'destructive' as const },
}

export function FileList({ files, onRemove, className = '' }: FileListProps) {
  if (files.length === 0) return null
  return (
    <div className={cn("rounded-xl border divide-y overflow-hidden", className)}>
      {files.map((f) => {
        const config = statusConfig[f.status]
        const saving = f.resultSize != null && f.status === 'done'
          ? Math.round((1 - f.resultSize / f.size) * 100)
          : null
        return (
          <div
            key={f.id}
            className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>{formatBytes(f.size)}</span>
                {f.resultSize != null && f.status === 'done' && (
                  <>
                    <span>→</span>
                    <span className="text-emerald-600 font-medium">{formatBytes(f.resultSize)}</span>
                    {saving !== null && saving > 0 && (
                      <span className="text-emerald-600">↓{saving}%</span>
                    )}
                  </>
                )}
                {f.error && <span className="text-destructive">{f.error}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {f.status === 'processing' ? (
                <Badge variant="info" className="gap-1">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  {config.label}
                </Badge>
              ) : (
                <Badge variant={config.variant}>{config.label}</Badge>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(f.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors rounded-sm p-0.5"
                  aria-label={`移除 ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
