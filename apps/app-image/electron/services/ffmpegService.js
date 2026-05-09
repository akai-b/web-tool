/**
 * FFmpeg 动图处理服务
 * 提供序列帧合成、动图转换、帧提取等功能
 */

const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs').promises
const os = require('os')
const path = require('path')
const { promisify } = require('util')
const { exec } = require('child_process')
const execAsync = promisify(exec)

/**
 * 序列帧合成为动图
 * @param {Object} options - 合成选项
 * @param {Array<{path: string, delay: number}>} options.frames - 帧列表
 * @param {string} options.outputPath - 输出文件路径
 * @param {string} options.format - 输出格式 (gif/webp/apng)
 * @param {number} [options.width] - 输出宽度
 * @param {number} [options.height] - 输出高度
 * @param {number} [options.loop=0] - 循环次数 (0=无限)
 * @param {number} [options.quality=90] - 质量 (1-100)
 * @param {number} [options.fps] - 帧率（优先级高于 delay）
 * @returns {Promise<Object>}
 */
async function framesToAnimated(options) {
  const { frames, outputPath, format, width, height, loop = 0, quality = 90, fps } = options

  if (!frames || frames.length === 0) {
    throw new Error('No frames provided')
  }

  // 创建临时目录存放符号链接的帧
  const tempDir = path.join(path.dirname(outputPath), '.temp_frames_' + Date.now())
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // 创建符号链接，统一命名为 frame_0001.png, frame_0002.png, ...
    for (let i = 0; i < frames.length; i++) {
      const ext = path.extname(frames[i].path)
      const linkPath = path.join(tempDir, `frame_${String(i + 1).padStart(4, '0')}${ext}`)
      await fs.copyFile(frames[i].path, linkPath)
    }

    // 计算帧率
    let frameRate = fps
    if (!frameRate && frames[0].delay) {
      // 从 delay 计算帧率（delay 单位是毫秒）
      frameRate = Math.round(1000 / frames[0].delay)
    }
    frameRate = frameRate || 10 // 默认 10fps

    const inputPattern = path.join(tempDir, 'frame_%04d' + path.extname(frames[0].path))

    return new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(inputPattern)
        .inputFPS(frameRate)

      // 设置输出尺寸
      if (width || height) {
        const scale = width && height ? `${width}:${height}` : width ? `${width}:-1` : `-1:${height}`
        command = command.videoFilter(`scale=${scale}`)
      }

      // 根据格式设置参数
      if (format === 'gif') {
        command = command
          .outputOptions([
            '-loop', String(loop),
            '-vf', 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'
          ])
      } else if (format === 'webp') {
        command = command
          .outputOptions([
            '-loop', String(loop),
            '-quality', String(quality),
            '-lossless', quality >= 100 ? '1' : '0'
          ])
      } else if (format === 'apng') {
        command = command
          .outputOptions([
            '-plays', String(loop),
            '-f', 'apng'
          ])
      }

      command
        .output(outputPath)
        .on('end', async () => {
          // 清理临时目录
          await fs.rm(tempDir, { recursive: true, force: true })

          const stats = await fs.stat(outputPath)
          resolve({
            outputPath,
            frameCount: frames.length,
            duration: (frames.length / frameRate) * 1000,
            size: stats.size,
          })
        })
        .on('error', async (err) => {
          // 清理临时目录
          await fs.rm(tempDir, { recursive: true, force: true })
          reject(new Error(`FFmpeg error: ${err.message}`))
        })
        .run()
    })
  } catch (error) {
    // 清理临时目录
    await fs.rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

/**
 * 动图转换为序列帧
 * @param {Object} options - 转换选项
 * @param {string} options.inputPath - 输入文件路径
 * @param {string} options.outputDir - 输出目录
 * @param {string} options.format - 输出格式 (png/jpeg/webp)
 * @returns {Promise<Object>}
 */
async function animatedToFrames(options) {
  const { inputPath, outputDir, format = 'png' } = options

  await fs.mkdir(outputDir, { recursive: true })

  const outputPattern = path.join(outputDir, `frame_%04d.${format}`)

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-vsync', '0'])
      .output(outputPattern)
      .on('end', async () => {
        const files = await fs.readdir(outputDir)
        const frames = files
          .filter(f => f.startsWith('frame_') && f.endsWith(`.${format}`))
          .sort()
          .map(f => path.join(outputDir, f))

        resolve({
          frames,
          frameCount: frames.length,
        })
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`))
      })
      .run()
  })
}

/**
 * 动图格式转换
 * @param {Object} options - 转换选项
 * @param {string} options.inputPath - 输入文件路径
 * @param {string} options.outputPath - 输出文件路径
 * @param {string} options.format - 目标格式 (gif/webp/apng)
 * @param {number} [options.quality=90] - 质量 (1-100)
 * @param {number} [options.width] - 输出宽度
 * @param {number} [options.height] - 输出高度
 * @returns {Promise<Object>}
 */
async function convertAnimated(options) {
  const { inputPath, outputPath, format, quality = 90, width, height } = options

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)

    // 设置输出尺寸
    if (width || height) {
      const scale = width && height ? `${width}:${height}` : width ? `${width}:-1` : `-1:${height}`
      command = command.videoFilter(`scale=${scale}`)
    }

    // 根据格式设置参数
    if (format === 'gif') {
      command = command.outputOptions([
        '-vf', 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'
      ])
    } else if (format === 'webp') {
      command = command.outputOptions([
        '-quality', String(quality),
        '-lossless', quality >= 100 ? '1' : '0'
      ])
    } else if (format === 'apng') {
      command = command.outputOptions(['-f', 'apng'])
    }

    command
      .output(outputPath)
      .on('end', async () => {
        const stats = await fs.stat(outputPath)
        // 获取帧数和时长需要额外的 ffprobe 调用
        const info = await getAnimatedInfo(outputPath)
        resolve({
          outputPath,
          frameCount: info.frameCount,
          duration: info.duration,
          size: stats.size,
        })
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`))
      })
      .run()
  })
}

/**
 * 编辑动图
 * @param {Object} options - 编辑选项
 * @param {string} options.inputPath - 输入文件路径
 * @param {string} options.outputPath - 输出文件路径
 * @param {Object} [options.crop] - 裁剪区域 {x, y, width, height}
 * @param {Object} [options.resize] - 缩放尺寸 {width, height}
 * @param {number} [options.fps] - 帧率
 * @param {Object} [options.frameRange] - 帧范围 {start, end}
 * @returns {Promise<Object>}
 */
async function editAnimated(options) {
  const { inputPath, outputPath, crop, resize, fps, frameRange } = options

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)

    // 构建视频滤镜
    const filters = []

    if (crop) {
      filters.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`)
    }

    if (resize) {
      const scale = resize.width && resize.height
        ? `${resize.width}:${resize.height}`
        : resize.width
        ? `${resize.width}:-1`
        : `-1:${resize.height}`
      filters.push(`scale=${scale}`)
    }

    if (filters.length > 0) {
      command = command.videoFilter(filters.join(','))
    }

    if (fps) {
      command = command.fps(fps)
    }

    if (frameRange) {
      // 帧范围转换为时间范围需要知道原始帧率
      // 这里简化处理，使用 select 滤镜
      command = command.outputOptions([
        '-vf', `select='between(n\\,${frameRange.start}\\,${frameRange.end})'`,
        '-vsync', '0'
      ])
    }

    command
      .output(outputPath)
      .on('end', async () => {
        const stats = await fs.stat(outputPath)
        const info = await getAnimatedInfo(outputPath)
        resolve({
          outputPath,
          frameCount: info.frameCount,
          duration: info.duration,
          size: stats.size,
        })
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`))
      })
      .run()
  })
}

/**
 * 获取动图信息（帧数、时长）
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>}
 */
async function getAnimatedInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video')
      if (!videoStream) {
        reject(new Error('No video stream found'))
        return
      }

      resolve({
        frameCount: videoStream.nb_frames || 0,
        duration: (metadata.format.duration || 0) * 1000, // 转换为毫秒
      })
    })
  })
}

/**
 * 从 Buffer 序列合成动图（渲染进程专用，自动管理临时文件）
 * @param {Object} options
 * @param {Array<{buffer: Uint8Array, filename: string, delay: number}>} options.frames
 * @param {string} options.format - gif/webp/apng
 * @param {number} [options.fps]
 * @param {number} [options.loop=0]
 * @param {number} [options.quality=90]
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @returns {Promise<{outputBuffer: Uint8Array, frameCount: number, duration: number, size: number}>}
 */
async function makeAnimatedFromBuffers(options) {
  const { frames, format, fps, loop = 0, quality = 90, width, height } = options

  const tempDir = path.join(os.tmpdir(), 'tool-pal-' + Date.now())
  await fs.mkdir(tempDir, { recursive: true })

  const outputPath = path.join(tempDir, `output.${format}`)

  try {
    const framePaths = []
    for (let i = 0; i < frames.length; i++) {
      const { buffer, filename, delay } = frames[i]
      const ext = path.extname(filename) || '.png'
      const framePath = path.join(tempDir, `frame_${String(i + 1).padStart(4, '0')}${ext}`)
      await fs.writeFile(framePath, Buffer.from(buffer))
      framePaths.push({ path: framePath, delay: delay || 100 })
    }

    const result = await framesToAnimated({ frames: framePaths, outputPath, format, fps, loop, quality, width, height })
    const outputBuffer = await fs.readFile(outputPath)

    return {
      outputBuffer: new Uint8Array(outputBuffer),
      frameCount: result.frameCount,
      duration: result.duration,
      size: result.size,
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

/**
 * 从 Buffer 转换动图格式（渲染进程专用）
 * @param {Object} options
 * @param {Uint8Array} options.inputBuffer
 * @param {string} options.inputFilename
 * @param {string} options.format - gif/webp/apng
 * @param {number} [options.quality=90]
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @returns {Promise<{outputBuffer: Uint8Array, frameCount: number, duration: number, size: number}>}
 */
async function convertAnimatedFromBuffer(options) {
  const { inputBuffer, inputFilename, format, quality = 90, width, height } = options

  const tempDir = path.join(os.tmpdir(), 'tool-pal-' + Date.now())
  await fs.mkdir(tempDir, { recursive: true })

  const ext = path.extname(inputFilename) || '.gif'
  const inputPath = path.join(tempDir, `input${ext}`)
  const outputPath = path.join(tempDir, `output.${format}`)

  try {
    await fs.writeFile(inputPath, Buffer.from(inputBuffer))
    const result = await convertAnimated({ inputPath, outputPath, format, quality, width, height })
    const outputBuffer = await fs.readFile(outputPath)

    return {
      outputBuffer: new Uint8Array(outputBuffer),
      frameCount: result.frameCount,
      duration: result.duration,
      size: result.size,
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

module.exports = {
  framesToAnimated,
  animatedToFrames,
  convertAnimated,
  editAnimated,
  getAnimatedInfo,
  makeAnimatedFromBuffers,
  convertAnimatedFromBuffer,
}
