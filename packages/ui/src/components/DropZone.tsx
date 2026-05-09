import React, { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '../lib/utils'

export interface DropZoneProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  children?: React.ReactNode
  className?: string
}

export function DropZone({ accept, multiple = true, onFiles, children, className = '' }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFiles(multiple ? files : [files[0]])
  }, [multiple, onFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onFiles(multiple ? files : [files[0]])
    e.target.value = ''
  }, [multiple, onFiles])

  return (
    <label
      onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={handleChange}
      />
      {children ?? (
        <>
          <div className={cn(
            "rounded-full p-3 transition-colors",
            dragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-5 w-5 transition-colors",
              dragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">拖拽文件到此处</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              或 <span className="text-primary font-medium">点击选择文件</span>
            </p>
          </div>
        </>
      )}
    </label>
  )
}
