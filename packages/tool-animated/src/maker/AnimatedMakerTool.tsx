import React, { useState, useCallback } from 'react'
import '@pal/ipc-types'

type IpcResponse<T> = { ok: true; data: T } | { ok: false; error: string }
import {
  Card, CardContent,
  DropZone, Button,
  Slider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Label, Input,
} from '@pal/ui'
import { nanoid, formatBytes, downloadBytes } from '@pal/utils'
import { FrameList, type FrameItem } from './FrameList'

type OutputFormat = 'gif' | 'webp' | 'apng'

interface MakerOptions {
  format: OutputFormat
  fps: number
  loop: number
  quality: number
  width: string
  height: string
}

interface GenerateResult {
  buffer: Uint8Array
  filename: string
  size: number
  frameCount: number
  duration: number
}

export function AnimatedMakerTool({ className }: { className?: string }) {
  const [frames, setFrames] = useState<FrameItem[]>([])
  const [options, setOptions] = useState<MakerOptions>({
    format: 'gif',
    fps: 10,
    loop: 0,
    quality: 85,
    width: '',
    height: '',
  })
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isElectron = typeof window !== 'undefined' && 'api' in window

  const handleFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    const newFrames: FrameItem[] = imageFiles.map((f) => ({
      id: nanoid(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      delay: Math.round(1000 / options.fps),
    }))
    setFrames((prev) => [...prev, ...newFrames])
    setResult(null)
  }, [options.fps])

  const handleGenerate = useCallback(async () => {
    if (frames.length === 0 || processing) return
    if (!isElectron) {
      setError('此功能需要在 Electron 桌面应用中运行')
      return
    }
    setProcessing(true)
    setError(null)
    setResult(null)
    try {
      const frameBuffers = await Promise.all(
        frames.map(async (f) => ({
          buffer: new Uint8Array(await f.file.arrayBuffer()),
          filename: f.file.name,
          delay: f.delay,
        }))
      )
      const response = await window.api!.invoke('ffmpeg:make-animated', {
        frames: frameBuffers,
        format: options.format,
        fps: options.fps,
        loop: options.loop,
        quality: options.quality,
        width: options.width ? Number(options.width) : undefined,
        height: options.height ? Number(options.height) : undefined,
      }) as IpcResponse<{ outputBuffer: Uint8Array; frameCount: number; duration: number; size: number }>

      if (!response.ok) throw new Error(response.error || '生成失败')
      const { outputBuffer, frameCount, duration, size } = response.data
      setResult({
        buffer: new Uint8Array(outputBuffer),
        filename: `animated_${Date.now()}.${options.format}`,
        size,
        frameCount,
        duration,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setProcessing(false)
    }
  }, [frames, options, processing, isElectron])

  const handleDownload = useCallback(() => {
    if (!result) return
    const mime = options.format === 'gif' ? 'image/gif' : options.format === 'webp' ? 'image/webp' : 'image/apng'
    downloadBytes(result.buffer, result.filename, mime)
  }, [result, options.format])

  const handleClear = useCallback(() => {
    frames.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setFrames([])
    setResult(null)
    setError(null)
  }, [frames])

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      {/* 参数设置 */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>输出格式</Label>
              <Select value={options.format} onValueChange={(v) => setOptions((o) => ({ ...o, format: v as OutputFormat }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="apng">APNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                帧率
                <span className="ml-1 font-normal text-muted-foreground">({options.fps} fps)</span>
              </Label>
              <div className="pt-2.5">
                <Slider
                  value={[options.fps]}
                  onValueChange={([v]) => setOptions((o) => ({ ...o, fps: v }))}
                  min={1} max={60} step={1}
                />
              </div>
            </div>

            {options.format === 'webp' && (
              <div className="space-y-2">
                <Label>
                  质量
                  <span className="ml-1 font-normal text-muted-foreground">({options.quality})</span>
                </Label>
                <div className="pt-2.5">
                  <Slider
                    value={[options.quality]}
                    onValueChange={([v]) => setOptions((o) => ({ ...o, quality: v }))}
                    min={1} max={100} step={1}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>循环次数</Label>
              <Select value={String(options.loop)} onValueChange={(v) => setOptions((o) => ({ ...o, loop: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">无限循环</SelectItem>
                  <SelectItem value="1">播放 1 次</SelectItem>
                  <SelectItem value="2">播放 2 次</SelectItem>
                  <SelectItem value="3">播放 3 次</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anim-width">宽度</Label>
              <Input
                id="anim-width"
                type="number"
                placeholder="原始 (px)"
                value={options.width}
                onChange={(e) => setOptions((o) => ({ ...o, width: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anim-height">高度</Label>
              <Input
                id="anim-height"
                type="number"
                placeholder="原始 (px)"
                value={options.height}
                onChange={(e) => setOptions((o) => ({ ...o, height: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 拖拽上传 */}
      <DropZone accept="image/*" onFiles={handleFiles} multiple className="h-36">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full p-3 bg-muted">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">拖入图片帧（支持多选）</p>
            <p className="text-xs text-muted-foreground mt-0.5">或 <span className="text-primary font-medium">点击选择文件</span></p>
          </div>
        </div>
      </DropZone>

      {/* 帧列表 */}
      {frames.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {frames.length} 帧 · 拖拽调整顺序 · 可修改每帧延迟
              </p>
            </div>
            <FrameList frames={frames} onChange={setFrames} />

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            {result && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                生成完成：{result.frameCount} 帧，时长 {(result.duration / 1000).toFixed(1)}s，大小 {formatBytes(result.size)}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleGenerate} disabled={processing || !isElectron}>
                {processing ? '生成中…' : '生成动图'}
              </Button>
              {result && (
                <Button variant="outline" onClick={handleDownload}>
                  下载 {options.format.toUpperCase()}
                </Button>
              )}
              <Button variant="ghost" onClick={handleClear}>清空</Button>
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
