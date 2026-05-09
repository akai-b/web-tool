import React, { useState, useCallback } from 'react'
import '@pal/ipc-types'

type IpcResponse<T> = { ok: true; data: T } | { ok: false; error: string }
import {
  Card, CardContent,
  DropZone, Button,
  Slider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Label, Progress, Badge,
} from '@pal/ui'
import { nanoid, formatBytes, downloadBytes } from '@pal/utils'
import { Loader2, FileVideo, X } from 'lucide-react'

type OutputFormat = 'gif' | 'webp' | 'apng'

interface ConvertItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  resultBuffer?: Uint8Array
  resultFilename?: string
  originalSize?: number
  resultSize?: number
  error?: string
}

const statusConfig = {
  pending: { label: '等待', variant: 'secondary' as const },
  processing: { label: '处理中', variant: 'info' as const },
  done: { label: '完成', variant: 'success' as const },
  error: { label: '错误', variant: 'destructive' as const },
}

export function AnimatedConverterTool({ className }: { className?: string }) {
  const [items, setItems] = useState<ConvertItem[]>([])
  const [format, setFormat] = useState<OutputFormat>('webp')
  const [quality, setQuality] = useState(85)
  const [processing, setProcessing] = useState(false)

  const isElectron = typeof window !== 'undefined' && 'api' in window

  const handleFiles = useCallback((files: File[]) => {
    const animatedFiles = files.filter((f) =>
      f.type === 'image/gif' || f.type === 'image/webp' || f.name.endsWith('.apng') || f.name.endsWith('.gif') || f.name.endsWith('.webp')
    )
    setItems((prev) => [
      ...prev,
      ...animatedFiles.map((f) => ({ id: nanoid(), file: f, status: 'pending' as const })),
    ])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handleConvert = useCallback(async () => {
    if (items.length === 0 || processing || !isElectron) return
    setProcessing(true)

    for (const item of items) {
      if (item.status === 'done') continue
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'processing' } : i))
      try {
        const inputBuffer = new Uint8Array(await item.file.arrayBuffer())
        const response = await window.api!.invoke('ffmpeg:convert-animated-buffer', {
          inputBuffer,
          inputFilename: item.file.name,
          format,
          quality,
        }) as IpcResponse<{ outputBuffer: Uint8Array; frameCount: number; duration: number; size: number }>

        if (!response.ok) throw new Error(response.error || '转换失败')
        const { outputBuffer, size } = response.data
        const baseName = item.file.name.replace(/\.[^.]+$/, '')
        setItems((prev) => prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'done', resultBuffer: new Uint8Array(outputBuffer), resultFilename: `${baseName}.${format}`, originalSize: item.file.size, resultSize: size }
            : i
        ))
      } catch (e) {
        setItems((prev) => prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', error: e instanceof Error ? e.message : '转换失败' } : i
        ))
      }
    }
    setProcessing(false)
  }, [items, format, quality, processing, isElectron])

  const handleDownloadAll = useCallback(() => {
    items.forEach((i) => {
      if (i.resultBuffer && i.resultFilename) {
        const mime = format === 'gif' ? 'image/gif' : format === 'webp' ? 'image/webp' : 'image/apng'
        downloadBytes(i.resultBuffer, i.resultFilename, mime)
      }
    })
  }, [items, format])

  const doneCount = items.filter((i) => i.status === 'done').length
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      {/* 参数设置 */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>目标格式</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="apng">APNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {format === 'webp' && (
              <div className="space-y-2">
                <Label>
                  质量
                  <span className="ml-1 font-normal text-muted-foreground">({quality}%)</span>
                </Label>
                <div className="pt-2.5">
                  <Slider
                    value={[quality]}
                    onValueChange={([v]) => setQuality(v)}
                    min={1} max={100} step={1}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 拖拽上传区 */}
      <DropZone accept="image/gif,image/webp,.apng" onFiles={handleFiles} className="h-36">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full p-3 bg-muted">
            <FileVideo className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">拖入 GIF / WebP / APNG 动图</p>
            <p className="text-xs text-muted-foreground mt-0.5">或 <span className="text-primary font-medium">点击选择文件</span></p>
          </div>
        </div>
      </DropZone>

      {/* 文件列表 + 操作 */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="rounded-xl border divide-y overflow-hidden">
              {items.map((item) => {
                const config = statusConfig[item.status]
                const saving = item.resultSize != null && item.status === 'done'
                  ? Math.round((1 - item.resultSize / item.file.size) * 100)
                  : null
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                    <FileVideo className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{formatBytes(item.file.size)}</span>
                        {item.resultSize != null && item.status === 'done' && (
                          <>
                            <span>→</span>
                            <span className="text-emerald-600 font-medium">{formatBytes(item.resultSize)}</span>
                            {saving !== null && saving > 0 && (
                              <span className="text-emerald-600">↓{saving}%</span>
                            )}
                          </>
                        )}
                        {item.error && <span className="text-destructive">{item.error}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === 'processing' ? (
                        <Badge variant="info" className="gap-1">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          {config.label}
                        </Badge>
                      ) : (
                        <Badge variant={config.variant}>{config.label}</Badge>
                      )}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors rounded-sm p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {processing && <Progress value={progress} className="h-1.5" />}

            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleConvert} disabled={processing || !isElectron}>
                {processing ? '转换中…' : '开始转换'}
              </Button>
              {doneCount > 0 && (
                <Button variant="outline" onClick={handleDownloadAll}>
                  下载全部 ({doneCount})
                </Button>
              )}
              <Button variant="ghost" onClick={() => setItems([])}>清空</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isElectron && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          此功能需要在 Electron 桌面应用中运行（依赖 FFmpeg）
        </p>
      )}
    </div>
  )
}
