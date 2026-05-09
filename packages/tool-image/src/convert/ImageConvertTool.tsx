import React, { useState, useCallback } from 'react'
import {
  Card, CardContent,
  DropZone, FileList, Button,
  Slider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Label, Progress,
} from '@pal/ui'
import type { FileItem } from '@pal/ui'
import { nanoid, downloadBytes } from '@pal/utils'
import { useSharpConvert } from './useSharpConvert'

export interface ImageConvertToolProps {
  className?: string
}

type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif'

interface ConvertItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  resultBlob?: Blob
  resultFilename?: string
  originalSize?: number
  resultSize?: number
  error?: string
}

async function convertImageCanvas(
  file: File,
  format: OutputFormat,
  quality: number
): Promise<{ blob: Blob; filename: string; originalSize: number; resultSize: number }> {
  const bitmap = await createImageBitmap(file)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
  const blob = await canvas.convertToBlob({ type: mimeType, quality: quality / 100 })
  const ext = format === 'jpeg' ? 'jpg' : format
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return { blob, filename: `${baseName}.${ext}`, originalSize: file.size, resultSize: blob.size }
}

export function ImageConvertTool({ className }: ImageConvertToolProps) {
  const [items, setItems] = useState<ConvertItem[]>([])
  const [format, setFormat] = useState<OutputFormat>('webp')
  const [quality, setQuality] = useState(85)
  const [processing, setProcessing] = useState(false)
  const { isAvailable: isSharpAvailable, convertWithSharp } = useSharpConvert()

  const handleFiles = useCallback((files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((f) => ({ id: nanoid(), file: f, status: 'pending' as const })),
    ])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handleConvert = useCallback(async () => {
    if (processing) return
    setProcessing(true)
    for (const item of items) {
      if (item.status === 'done') continue
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'processing' } : i))
      try {
        const result = isSharpAvailable
          ? await convertWithSharp(item.file, format, quality)
          : await convertImageCanvas(item.file, format, quality)
        setItems((prev) => prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'done', resultBlob: result.blob, resultFilename: result.filename, originalSize: result.originalSize, resultSize: result.resultSize }
            : i
        ))
      } catch (e) {
        setItems((prev) => prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', error: e instanceof Error ? e.message : '转换失败' } : i
        ))
      }
    }
    setProcessing(false)
  }, [items, format, quality, processing, isSharpAvailable, convertWithSharp])

  const handleDownloadAll = useCallback(() => {
    items.forEach((i) => {
      if (i.resultBlob && i.resultFilename) {
        i.resultBlob.arrayBuffer().then((buf) => {
          downloadBytes(new Uint8Array(buf), i.resultFilename!, i.resultBlob!.type)
        })
      }
    })
  }, [items])

  const fileItems: FileItem[] = items.map((i) => ({
    id: i.id,
    name: i.file.name,
    size: i.file.size,
    status: i.status,
    resultSize: i.resultSize,
    error: i.error,
  }))

  const doneCount = items.filter((i) => i.status === 'done').length
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      {/* 设置区 */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>目标格式</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="avif">AVIF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {format !== 'png' && (
              <div className="space-y-2">
                <Label>
                  质量
                  <span className="ml-1 font-normal text-muted-foreground">({quality}%)</span>
                </Label>
                <div className="pt-2.5">
                  <Slider
                    value={[quality]}
                    onValueChange={([v]) => setQuality(v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 拖拽上传区 */}
      <DropZone accept="image/*" onFiles={handleFiles} className="h-36" />

      {/* 文件列表 + 操作 */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <FileList files={fileItems} onRemove={handleRemove} />
            {processing && <Progress value={progress} className="h-1.5" />}
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleConvert} disabled={processing}>
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
    </div>
  )
}
