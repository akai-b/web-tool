import React from 'react'
import { ImageIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger, Separator } from '@pal/ui'
import { ImageCompressTool, ImageConvertTool } from '@pal/tool-image'
import { AnimatedMakerTool, AnimatedConverterTool } from '@pal/tool-animated'

const tabTriggerClass =
  "h-11 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"

export function App() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* App header */}
      <header className="h-12 flex items-center gap-3 border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <ImageIcon className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">ToolPal</span>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <span className="text-xs text-muted-foreground">图像工具</span>
        </div>
      </header>

      {/* Tabs navigation + content */}
      <Tabs defaultValue="compress" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-card px-6 shrink-0">
          <TabsList className="h-11 bg-transparent p-0 gap-1 rounded-none">
            <TabsTrigger value="compress" className={tabTriggerClass}>图片压缩</TabsTrigger>
            <TabsTrigger value="convert" className={tabTriggerClass}>图片转换</TabsTrigger>
            <TabsTrigger value="animated-maker" className={tabTriggerClass}>动图制作</TabsTrigger>
            <TabsTrigger value="animated-converter" className={tabTriggerClass}>动图转换</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 overflow-auto">
          <TabsContent value="compress" className="mt-0 h-full">
            <ImageCompressTool />
          </TabsContent>
          <TabsContent value="convert" className="mt-0 h-full">
            <ImageConvertTool />
          </TabsContent>
          <TabsContent value="animated-maker" className="mt-0 h-full">
            <AnimatedMakerTool />
          </TabsContent>
          <TabsContent value="animated-converter" className="mt-0 h-full">
            <AnimatedConverterTool />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
