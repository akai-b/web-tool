import React, { useState } from 'react'
import { Button, Separator } from '@pal/ui'
import { ImageCompressTool, ImageConvertTool } from '@pal/tool-image'
import { FontCompressTool } from '@pal/tool-font-compress'
import { GifMakerTool } from '@pal/tool-gif-maker'
import { Layers, Image, RefreshCw, Type, Film } from 'lucide-react'

type ToolId = 'image-compress' | 'image-convert' | 'font-compress' | 'gif-maker'

const TOOLS: { id: ToolId; label: string; icon: React.ReactNode }[] = [
  { id: 'image-compress', label: '图片压缩', icon: <Image className="w-4 h-4" /> },
  { id: 'image-convert', label: '图片转换', icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'font-compress', label: '字体压缩', icon: <Type className="w-4 h-4" /> },
  { id: 'gif-maker',    label: 'GIF 制作',  icon: <Film className="w-4 h-4" /> },
]

export function App() {
  const [active, setActive] = useState<ToolId>('image-compress')

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="w-52 shrink-0 flex flex-col border-r bg-card">
        <div className="h-12 flex items-center gap-2 px-4 border-b">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">Pal 工具箱</span>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {TOOLS.map((t) => (
            <Button
              key={t.id}
              variant={active === t.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActive(t.id)}
              className="w-full justify-start gap-2 h-9"
            >
              {t.icon}
              {t.label}
            </Button>
          ))}
        </nav>

        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground text-center">v0.1.0</p>
        </div>
      </aside>

      {/* 内容区 */}
      <main className="flex-1 overflow-auto">
        {active === 'image-compress' && <ImageCompressTool />}
        {active === 'image-convert'  && <ImageConvertTool />}
        {active === 'font-compress'  && <FontCompressTool />}
        {active === 'gif-maker'      && <GifMakerTool />}
      </main>
    </div>
  )
}
