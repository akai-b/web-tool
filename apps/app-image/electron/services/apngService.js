/**
 * APNG 处理服务
 * 提供 APNG 的创建和拆分功能
 * 注意：需要系统安装 apngasm 工具
 */

const { execFile } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const path = require('path')

const execFileAsync = promisify(execFile)

/**
 * 创建 APNG
 * @param {Object} options - 创建选项
 * @param {Array<{path: string, delay: number}>} options.frames - 帧列表
 * @param {string} options.outputPath - 输出文件路径
 * @param {number} [options.loop=0] - 循环次数 (0=无限)
 * @returns {Promise<Object>}
 */
async function create(options) {
  const { frames, outputPath, loop = 0 } = options

  if (!frames || frames.length === 0) {
    throw new Error('No frames provided')
  }

  // 创建临时目录和帧列表文件
  const tempDir = path.join(path.dirname(outputPath), '.temp_apng_' + Date.now())
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // 复制帧到临时目录并创建帧列表
    const frameListPath = path.join(tempDir, 'frames.txt')
    const frameListContent = []

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      const ext = path.extname(frame.path)
      const tempFramePath = path.join(tempDir, `frame_${String(i).padStart(4, '0')}${ext}`)
      await fs.copyFile(frame.path, tempFramePath)

      // apngasm 的延迟单位是 1/1000 秒
      const delay = frame.delay || 100
      const delayNum = delay
      const delayDen = 1000
      frameListContent.push(`${path.basename(tempFramePath)} ${delayNum} ${delayDen}`)
    }

    await fs.writeFile(frameListPath, frameListContent.join('\n'))

    // 调用 apngasm
    // apngasm output.png frame1.png 1 10 frame2.png 1 10 ...
    // 或者使用帧列表文件
    const args = [outputPath]

    // 添加循环参数
    if (loop !== 0) {
      args.push('-l', String(loop))
    } else {
      args.push('-l', '0') // 无限循环
    }

    // 添加所有帧
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      const ext = path.extname(frame.path)
      const tempFramePath = path.join(tempDir, `frame_${String(i).padStart(4, '0')}${ext}`)
      const delay = frame.delay || 100
      args.push(tempFramePath, String(delay), '1000')
    }

    await execFileAsync('apngasm', args)

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
    throw new Error(`APNG creation error: ${error.message}`)
  }
}

/**
 * 拆分 APNG 为序列帧
 * @param {Object} options - 拆分选项
 * @param {string} options.inputPath - 输入文件路径
 * @param {string} options.outputDir - 输出目录
 * @returns {Promise<Object>}
 */
async function disassemble(options) {
  const { inputPath, outputDir } = options

  await fs.mkdir(outputDir, { recursive: true })

  try {
    // apngasm -d output_dir input.png
    await execFileAsync('apngasm', ['-d', outputDir, inputPath])

    // 读取输出的帧文件
    const files = await fs.readdir(outputDir)
    const frames = files
      .filter(f => f.match(/^apngframe\d+\.png$/))
      .sort()
      .map(f => path.join(outputDir, f))

    return {
      frames,
      frameCount: frames.length,
    }
  } catch (error) {
    throw new Error(`APNG disassembly error: ${error.message}`)
  }
}

module.exports = {
  create,
  disassemble,
}
