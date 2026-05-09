// ─── Electron preload bridge ─────────────────────────────────────────────────

declare global {
  interface Window {
    api?: {
      invoke(channel: string, req?: unknown): Promise<unknown>
    }
  }
}

// ─── 通用 IPC 类型 ────────────────────────────────────────────────────────────

export interface IpcResult<T = void> {
  ok: boolean
  data?: T
  error?: string
}

// ─── 图片压缩 ─────────────────────────────────────────────────────────────────

export interface CompressImageOptions {
  quality: number        // 0~100
  maxWidth?: number
  maxHeight?: number
  outputFormat?: 'jpeg' | 'png' | 'webp'
}

export interface CompressImageResult {
  originalSize: number
  resultSize: number
  outputPath: string
}

// ─── Sharp 图片处理 ───────────────────────────────────────────────────────────

export interface SharpResizeOptions {
  inputBuffer: Uint8Array
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface SharpResizeResult {
  outputBuffer: Uint8Array
  width: number
  height: number
}

export interface SharpCompressOptions {
  inputBuffer: Uint8Array
  quality: number
  format: 'jpeg' | 'png' | 'webp'
  maxWidth?: number
  maxHeight?: number
}

export interface SharpCompressResult {
  outputBuffer: Uint8Array
  originalSize: number
  resultSize: number
}

export interface SharpConvertOptions {
  inputBuffer: Uint8Array
  format: 'jpeg' | 'png' | 'webp' | 'avif'
  quality?: number
}

export interface SharpConvertResult {
  outputBuffer: Uint8Array
  format: string
}

// ─── FFmpeg 动图处理 ──────────────────────────────────────────────────────────

export interface CompressFontOptions {
  /** 需要保留的字符集，为空则保留全部 */
  glyphs?: string
  outputFormat?: 'woff2' | 'woff'
}

export interface CompressFontResult {
  originalSize: number
  resultSize: number
  outputPath: string
}

// ─── GIF 制作 ─────────────────────────────────────────────────────────────────

export interface MakeGifOptions {
  fps: number
  width?: number
  loop?: number   // 0 = 无限循环
}

export interface MakeGifResult {
  outputPath: string
  frameCount: number
  duration: number
}


// ─── 动图处理（FFmpeg）────────────────────────────────────────────────────────

export interface FrameInfo {
  path: string
  delay: number  // 毫秒
}

export interface FramesToAnimatedOptions {
  frames: FrameInfo[]
  outputPath: string
  format: 'gif' | 'webp' | 'apng'
  width?: number
  height?: number
  loop?: number  // 0=无限循环
  quality?: number  // 1-100（WebP/有损格式）
  fps?: number  // 帧率（优先级高于 frames 中的 delay）
}

export interface AnimatedToFramesOptions {
  inputPath: string
  outputDir: string
  format: 'png' | 'jpeg' | 'webp'
}

export interface AnimatedToFramesResult {
  frames: string[]  // 输出的帧文件路径列表
  frameCount: number
}

export interface ConvertAnimatedOptions {
  inputPath: string
  outputPath: string
  format: 'gif' | 'webp' | 'apng'
  quality?: number
  width?: number
  height?: number
}

export interface EditAnimatedOptions {
  inputPath: string
  outputPath: string
  crop?: { x: number; y: number; width: number; height: number }
  resize?: { width?: number; height?: number }
  fps?: number
  frameRange?: { start: number; end: number }  // 帧范围（0-based）
}

export interface AnimatedProcessResult {
  outputPath: string
  frameCount: number
  duration: number  // 毫秒
  size: number  // 字节
}

// ─── GIF 优化（gifsicle）──────────────────────────────────────────────────────

export interface GifsicleOptimizeOptions {
  inputPath: string
  outputPath: string
  optimizationLevel?: 1 | 2 | 3  // 1=快速, 2=正常, 3=最优
  lossy?: number  // 0-200，有损压缩级别
}

// ─── WebP 动图处理（webpmux）──────────────────────────────────────────────────

export interface WebPCreateAnimatedOptions {
  frames: FrameInfo[]
  outputPath: string
  loop?: number
  quality?: number
}

export interface WebPExtractFramesOptions {
  inputPath: string
  outputDir: string
}

// ─── APNG 处理（apngasm）──────────────────────────────────────────────────────

export interface APNGCreateOptions {
  frames: FrameInfo[]
  outputPath: string
  loop?: number
}

export interface APNGDisassembleOptions {
  inputPath: string
  outputDir: string
}

// ─── 工具检测 ─────────────────────────────────────────────────────────────────

export interface ToolsStatus {
  ffmpeg: boolean
  ffmpegVersion?: string
  sharp: boolean
  gifsicle: boolean
  webpmux: boolean
  apngasm: boolean
}

// ─── 动图处理（Buffer 接口，渲染进程专用）────────────────────────────────────

export interface AnimatedFrameBuffer {
  buffer: Uint8Array
  filename: string
  delay: number  // 毫秒
}

export interface MakeAnimatedOptions {
  frames: AnimatedFrameBuffer[]
  format: 'gif' | 'webp' | 'apng'
  fps?: number
  loop?: number  // 0=无限循环
  quality?: number  // 1-100
  width?: number
  height?: number
}

export interface MakeAnimatedResult {
  outputBuffer: Uint8Array
  frameCount: number
  duration: number  // 毫秒
  size: number
}

export interface ConvertAnimatedBufferOptions {
  inputBuffer: Uint8Array
  inputFilename: string
  format: 'gif' | 'webp' | 'apng'
  quality?: number
  width?: number
  height?: number
}

export interface ConvertAnimatedBufferResult {
  outputBuffer: Uint8Array
  frameCount: number
  duration: number
  size: number
}

// ─── IPC 频道名称常量 ─────────────────────────────────────────────────────────

export const IPC_CHANNELS = {
  // 原有频道
  COMPRESS_IMAGE: 'compress-image',
  CONVERT_IMAGE: 'convert-image',
  COMPRESS_FONT: 'compress-font',
  MAKE_GIF: 'make-gif',
  SAVE_FILE: 'save-file',
  OPEN_FILE_DIALOG: 'open-file-dialog',
  OPEN_SAVE_DIALOG: 'open-save-dialog',

  // 静态图片处理（Sharp）
  SHARP_RESIZE: 'sharp:resize',
  SHARP_COMPRESS: 'sharp:compress',
  SHARP_CONVERT: 'sharp:convert',

  // 动图处理（FFmpeg）—— Buffer 接口（渲染进程专用）
  FFMPEG_MAKE_ANIMATED: 'ffmpeg:make-animated',
  FFMPEG_CONVERT_ANIMATED_BUFFER: 'ffmpeg:convert-animated-buffer',

  // 动图处理（FFmpeg）—— 路径接口（服务间调用）
  FFMPEG_FRAMES_TO_ANIMATED: 'ffmpeg:frames-to-animated',
  FFMPEG_ANIMATED_TO_FRAMES: 'ffmpeg:animated-to-frames',
  FFMPEG_CONVERT_ANIMATED: 'ffmpeg:convert-animated',
  FFMPEG_EDIT_ANIMATED: 'ffmpeg:edit-animated',

  // GIF 优化（gifsicle）
  GIFSICLE_OPTIMIZE: 'gifsicle:optimize',

  // WebP 动图处理（webpmux）
  WEBP_CREATE_ANIMATED: 'webp:create-animated',
  WEBP_EXTRACT_FRAMES: 'webp:extract-frames',

  // APNG 处理（apngasm）
  APNG_CREATE: 'apng:create',
  APNG_DISASSEMBLE: 'apng:disassemble',

  // 工具检测
  CHECK_TOOLS: 'check:tools',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
