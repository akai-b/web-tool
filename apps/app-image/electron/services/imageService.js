/**
 * Sharp 图片处理服务
 * 提供静态图片的压缩、转换、缩放等功能
 */

const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')

/**
 * 缩放图片
 * @param {Object} options - 缩放选项
 * @param {string} options.inputPath - 输入文件路径
 * @param {string} options.outputPath - 输出文件路径
 * @param {number} [options.width] - 目标宽度
 * @param {number} [options.height] - 目标高度
 * @param {string} [options.fit='inside'] - 缩放模式
 * @returns {Promise<Object>}
 */
async function resize(options) {
  const { inputPath, outputPath, width, height, fit = 'inside' } = options

  const inputStats = await fs.stat(inputPath)
  const originalSize = inputStats.size

  await sharp(inputPath)
    .resize(width, height, { fit })
    .toFile(outputPath)

  const outputStats = await fs.stat(outputPath)
  const resultSize = outputStats.size

  return {
    outputPath,
    originalSize,
    resultSize,
  }
}

/**
 * 压缩图片
 * @param {Object} options - 压缩选项
 * @param {Uint8Array|string} options.inputBuffer - 输入图片 buffer（优先）
 * @param {string} [options.inputPath] - 输入文件路径（降级）
 * @param {string} [options.outputPath] - 输出文件路径（可选）
 * @param {number} options.quality - 质量 (1-100)
 * @param {string} options.format - 输出格式 (jpeg/png/webp)
 * @param {number} [options.maxWidth] - 最大宽度
 * @param {number} [options.maxHeight] - 最大高度
 * @returns {Promise<Object>}
 */
async function compress(options) {
  const { inputBuffer, inputPath, outputPath, quality, format, maxWidth, maxHeight } = options

  let originalSize
  let pipeline

  // 优先使用 buffer，降级到文件路径
  if (inputBuffer) {
    originalSize = inputBuffer.length
    pipeline = sharp(Buffer.from(inputBuffer))
  } else if (inputPath) {
    const inputStats = await fs.stat(inputPath)
    originalSize = inputStats.size
    pipeline = sharp(inputPath)
  } else {
    throw new Error('Either inputBuffer or inputPath must be provided')
  }

  // 如果指定了最大尺寸，先缩放
  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
  }

  // 根据格式应用压缩
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true })
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality, compressionLevel: 9 })
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality })
  }

  // 如果提供了输出路径，写入文件；否则返回 buffer
  if (outputPath) {
    await pipeline.toFile(outputPath)
    const outputStats = await fs.stat(outputPath)
    return {
      outputPath,
      originalSize,
      resultSize: outputStats.size,
    }
  } else {
    const outputBuffer = await pipeline.toBuffer()
    return {
      outputBuffer: new Uint8Array(outputBuffer),
      originalSize,
      resultSize: outputBuffer.length,
    }
  }
}

/**
 * 转换图片格式
 * @param {Object} options - 转换选项
 * @param {Uint8Array|string} [options.inputBuffer] - 输入图片 buffer（优先）
 * @param {string} [options.inputPath] - 输入文件路径（降级）
 * @param {string} [options.outputPath] - 输出文件路径（可选）
 * @param {string} options.format - 目标格式 (jpeg/png/webp/avif)
 * @param {number} [options.quality] - 质量 (1-100)
 * @returns {Promise<Object>}
 */
async function convert(options) {
  const { inputBuffer, inputPath, outputPath, format, quality = 90 } = options

  let originalSize
  let pipeline

  if (inputBuffer) {
    originalSize = inputBuffer.length
    pipeline = sharp(Buffer.from(inputBuffer))
  } else if (inputPath) {
    const inputStats = await fs.stat(inputPath)
    originalSize = inputStats.size
    pipeline = sharp(inputPath)
  } else {
    throw new Error('Either inputBuffer or inputPath must be provided')
  }

  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true })
      break
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality })
      break
    case 'avif':
      pipeline = pipeline.avif({ quality })
      break
    default:
      throw new Error(`Unsupported format: ${format}`)
  }

  if (outputPath) {
    await pipeline.toFile(outputPath)
    const outputStats = await fs.stat(outputPath)
    return {
      outputPath,
      originalSize,
      resultSize: outputStats.size,
    }
  } else {
    const outputBuffer = await pipeline.toBuffer()
    return {
      outputBuffer: new Uint8Array(outputBuffer),
      originalSize,
      resultSize: outputBuffer.length,
    }
  }
}

module.exports = {
  resize,
  compress,
  convert,
}
