import { useCallback } from 'react'
import type { CompressOptions, CompressResult } from './types'
import '@pal/ipc-types'

type IpcResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export function useSharpCompress() {
  const isElectron = typeof window !== 'undefined' && 'api' in window

  const compressWithSharp = useCallback(async (file: File, options: CompressOptions): Promise<CompressResult> => {
    if (!isElectron || !window.api) {
      throw new Error('Sharp compression is only available in Electron environment')
    }

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const result = await window.api.invoke('sharp:compress', {
      inputBuffer: uint8Array,
      quality: options.quality,
      format: options.outputFormat || 'jpeg',
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    }) as IpcResponse<{ outputBuffer: Uint8Array; originalSize: number; resultSize: number }>

    if (!result.ok) {
      throw new Error(result.error || 'Sharp compression failed')
    }

    const { outputBuffer, originalSize, resultSize } = result.data
    const mimeType = `image/${options.outputFormat || 'jpeg'}`
    const blob = new Blob([new Uint8Array(outputBuffer)], { type: mimeType })
    const ext = (options.outputFormat || 'jpeg').replace('jpeg', 'jpg')
    const baseName = file.name.replace(/\.[^.]+$/, '')

    return {
      blob,
      originalSize,
      resultSize,
      filename: `${baseName}_compressed.${ext}`,
    }
  }, [isElectron])

  return { isAvailable: isElectron, compressWithSharp }
}
