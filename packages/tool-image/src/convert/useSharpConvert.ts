import { useCallback } from 'react'
import '@pal/ipc-types'

type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif'

interface ConvertResult {
  blob: Blob
  originalSize: number
  resultSize: number
  filename: string
}

type IpcResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export function useSharpConvert() {
  const isElectron = typeof window !== 'undefined' && 'api' in window

  const convertWithSharp = useCallback(async (
    file: File,
    format: OutputFormat,
    quality: number,
  ): Promise<ConvertResult> => {
    if (!isElectron || !window.api) {
      throw new Error('Sharp conversion is only available in Electron environment')
    }

    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const result = await window.api.invoke('sharp:convert', {
      inputBuffer: uint8Array,
      format,
      quality,
    }) as IpcResponse<{ outputBuffer: Uint8Array; originalSize: number; resultSize: number }>

    if (!result.ok) {
      throw new Error(result.error || 'Sharp conversion failed')
    }

    const { outputBuffer, originalSize, resultSize } = result.data
    const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
    const blob = new Blob([new Uint8Array(outputBuffer)], { type: mimeType })
    const ext = format === 'jpeg' ? 'jpg' : format
    const baseName = file.name.replace(/\.[^.]+$/, '')

    return { blob, originalSize, resultSize, filename: `${baseName}.${ext}` }
  }, [isElectron])

  return { isAvailable: isElectron, convertWithSharp }
}
