import React, { useState, useCallback } from 'react'
import {
  Card, CardContent,
  DropZone, FileList, Button,
  Label, Textarea,
} from '@pal/ui'
import type { FileItem } from '@pal/ui'
import { nanoid, downloadBytes } from '@pal/utils'

export interface FontCompressToolProps {
  className?: string
}

interface FontItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  resultSize?: number
  resultBlob?: Blob
  resultFilename?: string
  error?: string
}

export function FontCompressTool({ className }: FontCompressToolProps) {
  const [items, setItems] = useState<FontItem[]>([])
  const [glyphs, setGlyphs] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleFiles = useCallback((files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((f) => ({ id: nanoid(), file: f, status: 'pending' as const })),
    ])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handleCompress = useCallback(async () => {
    if (processing) return
    setProcessing(true)
    for (const item of items) {
      if (item.status === 'done') continue
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'processing' } : i))
      try {
        await new Promise((r) => setTimeout(r, 500))
        setItems((prev) => prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', error: '字体压缩功能需要 Electron 环境' } : i
        ))
      } catch (e) {
        setItems((prev) => prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', error: e instanceof Error ? e.message : '处理失败' } : i
        ))
      }
    }
    setProcessing(false)
  }, [items, glyphs, processing])

  const fileItems: FileItem[] = items.map((i) => ({
    id: i.id,
    name: i.file.name,
    size: i.file.size,
    status: i.status,
    resultSize: i.resultSize,
    error: i.error,
  }))

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      {/* 字符集设置 */}
      <Card>
        <CardContent className="pt-5">
          <div className="space-y-2">
            <Label htmlFor="glyph-input">保留字符集</Label>
            <Textarea
              id="glyph-input"
              value={glyphs}
              onChange={(e) => setGlyphs(e.target.value)}
              placeholder="输入需要保留的字符，例如：你好世界 ABCabc123（留空则保留全部）"
              className="h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* 上传区 */}
      <DropZone accept=".ttf,.otf,.woff,.woff2" onFiles={handleFiles} className="h-36" />

      {/* 文件列表 + 操作 */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <FileList files={fileItems} onRemove={handleRemove} />
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleCompress} disabled={processing}>
                {processing ? '处理中…' : '开始压缩'}
              </Button>
              <Button variant="ghost" onClick={() => setItems([])}>清空</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
