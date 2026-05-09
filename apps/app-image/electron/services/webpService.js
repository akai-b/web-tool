/**
 * WebP 动图处理服务
 * 提供 WebP 动图的创建和帧提取功能
 */

const { execFile } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const path = require('path')
const cwebp = require('cwebp-bin')
const dwebp = require('dwebp-bin')
const gif2webp = require('gif2webp-bin')
const webpmux = require('webpmux-bin')

const execFileAsync = promisify(execFile)

/**
 * 创建 WebP 动图
 * @param {Object} options - 创建选项
 * @param {Array<{path: string, delay: number}>} options.frames - 帧列表
 * @param {string} options.outputPath - 输出文件路径
 * @param {number} [options.loop=0] - 循环次数 (0=无限)
 * @param {number} [options.quality=90] - 质量 (1-100)
 * @returns {Promise<Object>}
 */
async function createAnimated(options) {
  const { frames, outputPath, loop = 0, quality = 90 } = options

  if (!frames || frames.length === 0) {
    throw new Error('No frames provided')
  }

  // 创建临时目录
  const tempDir = path.join(path.dirname(outputPath), '.temp_webp_' + Date.now())
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // 将所有帧转换为 WebP 格式
    const webpFrames = []
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      const webpPath = path.join(tempDir, `frame_${i}.webp`)

      // 使用 cwebp 转换单帧
      await execFileAsync(cwebp, [
        frame.path,
        '-q', String(quality),
        '-o', webpPath
      ])

      webpFrames.push({
        path: webpPath,
        delay: frame.delay || 100
      })
    }

    // 使用 webpmux 合成动图
    const args = []
    for (const frame of webpFrames) {
      args.push('-frame', frame.path, `+${frame.delay}`)
    }
    args.push('-loop', String(loop))
    args.push('-o', outputPath)

    await execFileAsync(webpmux, args)

    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true })

    const stats = await fs.stat(outputPath)
    return {
      outputPath,
      frameCount: frames.length,
      duration: frames.reduce((sum, f) => sum + (f.delay || 100), 0),
      size: stats.size,
    }
  } catch (error) {
    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true })
    throw new Error(`WebP creation error: ${error.message}`)
  }
}

/**
 * 提取 WebP 动图的帧
 * @param {Object} options - 提取选项
 * @param {string} options.inputPath - 输入文件路径
 * @param {string} options.outputDir - 输出目录
 * @returns {Promise<Object>}
 */
async function extractFrames(options) {
  const { inputPath, outputDir } = options

  await fs.mkdir(outputDir, { recursive: true })

  try {
    // 使用 webpmux 获取帧信息
    const { stdout } = await execFileAsync(webpmux, ['-info', inputPath])

    // 解析帧数
    const frameMatches = stdout.match(/Number of frames: (\d+)/)
    const frameCount = frameMatches ? parseInt(frameMatches[1]) : 0

    if (frameCount === 0) {
      throw new Error('No frames found in WebP animation')
    }

    // 提取每一帧
    const frames = []
    for (let i = 1; i <= frameCount; i++) {
      const framePath = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.webp`)
      await execFileAsync(webpmux, ['-get', 'frame', String(i), inputPath, '-o', framePath])
      frames.push(framePath)
    }

    return {
      frames,
      frameCount: frames.length,
    }
  } catch (error) {
    throw new Error(`WebP extraction error: ${error.message}`)
  }
}

/**
 * GIF 转 WebP
 * @param {string} inputPath - 输入 GIF 路径
 * @param {string} outputPath - 输出 WebP 路径
 * @param {number} [quality=90] - 质量 (1-100)
 * @returns {Promise<Object>}
 */
async function gifToWebP(inputPath, outputPath, quality = 90) {
  try {
    await execFileAsync(gif2webp, [
      inputPath,
      '-q', String(quality),
      '-o', outputPath
    ])

    const stats = await fs.stat(outputPath)
    return {
      outputPath,
      size: stats.size,
    }
  } catch (error) {
    throw new Error(`GIF to WebP conversion error: ${error.message}`)
  }
}

module.exports = {
  createAnimated,
  extractFrames,
  gifToWebP,
}
