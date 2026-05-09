import React, { useState, useCallback } from 'react'
import {
  Card, CardContent,
  DropZone, FileList, Button,
  Slider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Label, Input, Progress,
} from '@pal/ui'
import type { FileItem } from '@pal/ui'
import { nanoid, calcSavingPercent, downloadBytes } from '@pal/utils'
import { compressImage } from './compress'
import { useSharpCompress } from './useSharpCompress'
import type { CompressOptions, CompressFileItem } from './types'

export interface ImageCompressToolProps {
  className?: string
}

export function ImageCompressTool({ className }: ImageCompressToolProps) {
  const [files, setFiles] = useState<CompressFileItem[]>([])
  const [options, setOptions] = useState<CompressOptions>({
    quality: 80,
    outputFormat: 'jpeg',
    maxWidth: undefined,
    maxHeight: undefined,
  })
  const [processing, setProcessing] = useState(false)
  const { isAvailable: isSharpAvailable, compressWithSharp } = useSharpCompress()

  const handleFiles = useCallback((incoming: File[]) => {
    const items: CompressFileItem[] = incoming.map((f) => ({
      id: nanoid(),
      file: f,
      status: 'pending',
    }))
    setFiles((prev) => [...prev, ...items])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleCompress = useCallback(async () => {
    if (files.length === 0 || processing) return
    setProcessing(true)
    for (const item of files) {
      if (item.status === 'done') continue
      setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'processing' } : f))
      try {
        const result = isSharpAvailable
          ? await compressWithSharp(item.file, options)
          : await compressImage(item.file, options)
        setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'done', result } : f))
      } catch (e) {
        const error = e instanceof Error ? e.message : '压缩失败'
        setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'error', error } : f))
      }
    }
    setProcessing(false)
  }, [files, options, processing, isSharpAvailable, compressWithSharp])

  const handleDownloadAll = useCallback(() => {
    files.forEach((f) => {
      if (f.result) {
        f.result.blob.arrayBuffer().then((buf) => {
          downloadBytes(new Uint8Array(buf), f.result!.filename, f.result!.blob.type)
        })
      }
    })
  }, [files])

  const fileItems: FileItem[] = files.map((f) => ({
    id: f.id,
    name: f.file.name,
    size: f.file.size,
    status: f.status,
    resultSize: f.result?.resultSize,
    error: f.error,
  }))

  const doneCount = files.filter((f) => f.status === 'done').length
  const progress = files.length > 0 ? (doneCount / files.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      {/* 设置区 */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="space-y-2">
              <Label>输出格式</Label>
              <Select
                value={options.outputFormat ?? 'jpeg'}
                onValueChange={(v) => setOptions((o) => ({ ...o, outputFormat: v as CompressOptions['outputFormat'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                质量
                <span className="ml-1 font-normal text-muted-foreground">({options.quality}%)</span>
              </Label>
              <div className="pt-2.5">
                <Slider
                  value={[options.quality]}
                  onValueChange={([value]) => setOptions((o) => ({ ...o, quality: value }))}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWidth">最大宽度</Label>
              <Input
                id="maxWidth"
                type="number"
                placeholder="不限 (px)"
                value={options.maxWidth ?? ''}
                onChange={(e) => setOptions((o) => ({ ...o, maxWidth: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHeight">最大高度</Label>
              <Input
                id="maxHeight"
                type="number"
                placeholder="不限 (px)"
                value={options.maxHeight ?? ''}
                onChange={(e) => setOptions((o) => ({ ...o, maxHeight: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 拖拽上传区 */}
      <DropZone accept="image/*" onFiles={handleFiles} className="h-36" />

      {/* 文件列表 + 操作 */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <FileList files={fileItems} onRemove={handleRemove} />
            {processing && <Progress value={progress} className="h-1.5" />}
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleCompress} disabled={processing}>
                {processing ? '压缩中…' : '开始压缩'}
              </Button>
              {doneCount > 0 && (
                <Button variant="outline" onClick={handleDownloadAll}>
                  下载全部 ({doneCount})
                </Button>
              )}
              <Button variant="ghost" onClick={() => setFiles([])}>清空</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
