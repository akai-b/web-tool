import React, { useState, useCallback } from 'react'
import {
  Card, CardContent,
  DropZone, FileList, Button,
  Slider, Switch, Label,
} from '@pal/ui'
import type { FileItem } from '@pal/ui'
import { nanoid } from '@pal/utils'

export interface GifMakerToolProps {
  className?: string
}

interface FrameItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

export function GifMakerTool({ className }: GifMakerToolProps) {
  const [frames, setFrames] = useState<FrameItem[]>([])
  const [fps, setFps] = useState(10)
  const [loop, setLoop] = useState(true)
  const [processing, setProcessing] = useState(false)

  const handleFiles = useCallback((files: File[]) => {
    setFrames((prev) => [
      ...prev,
      ...files.map((f) => ({ id: nanoid(), file: f, status: 'pending' as const })),
    ])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setFrames((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleMake = useCallback(async () => {
    if (processing || frames.length === 0) return
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 800))
    alert(`TODO: 将 ${frames.length} 帧合成为 GIF（fps=${fps}，loop=${loop}）`)
    setProcessing(false)
  }, [frames, fps, loop, processing])

  const fileItems: FileItem[] = frames.map((f) => ({
    id: f.id,
    name: f.file.name,
    size: f.file.size,
    status: f.status,
    error: f.error,
  }))

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
      {/* 参数设置 */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>
                帧率
                <span className="ml-1 font-normal text-muted-foreground">({fps} fps)</span>
              </Label>
              <div className="pt-2.5">
                <Slider
                  value={[fps]}
                  onValueChange={([v]) => setFps(v)}
                  min={1}
                  max={30}
                  step={1}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>循环播放</Label>
              <div className="pt-2.5 flex items-center gap-2">
                <Switch
                  checked={loop}
                  onCheckedChange={setLoop}
                  id="loop-switch"
                />
                <Label htmlFor="loop-switch" className="font-normal text-muted-foreground cursor-pointer">
                  {loop ? '无限循环' : '播放一次'}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 上传区 */}
      <DropZone accept="image/*" onFiles={handleFiles} className="h-36" />

      {/* 文件列表 + 操作 */}
      {frames.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <FileList files={fileItems} onRemove={handleRemove} />
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={handleMake} disabled={processing}>
                {processing ? '合成中…' : `合成 GIF（${frames.length} 帧）`}
              </Button>
              <Button variant="ghost" onClick={() => setFrames([])}>清空</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
