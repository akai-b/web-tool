/**
 * gifsicle GIF 优化服务
 * 提供 GIF 压缩和优化功能
 */

const { execFile } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const gifsicle = require('gifsicle')

const execFileAsync = promisify(execFile)

/**
 * 优化 GIF 文件
 * @param {Object} options - 优化选项
 * @param {string} options.inputPath - 输入文件路径
 * @param {string} options.outputPath - 输出文件路径
 * @param {number} [options.optimizationLevel=2] - 优化级别 (1=快速, 2=正常, 3=最优)
 * @param {number} [options.lossy] - 有损压缩级别 (0-200)
 * @returns {Promise<Object>}
 */
async function optimize(options) {
  const { inputPath, outputPath, optimizationLevel = 2, lossy } = options

  const inputStats = await fs.stat(inputPath)
  const originalSize = inputStats.size

  const args = []

  // 优化级别
  if (optimizationLevel === 1) {
    args.push('-O1')
  } else if (optimizationLevel === 2) {
    args.push('-O2')
  } else if (optimizationLevel === 3) {
    args.push('-O3')
  }

  // 有损压缩
  if (lossy !== undefined) {
    args.push(`--lossy=${lossy}`)
  }

  // 输入输出
  args.push('-o', outputPath, inputPath)

  try {
    await execFileAsync(gifsicle, args)

    const outputStats = await fs.stat(outputPath)
    const resultSize = outputStats.size

    return {
      outputPath,
      originalSize,
      resultSize,
    }
  } catch (error) {
    throw new Error(`gifsicle error: ${error.message}`)
  }
}

module.exports = {
  optimize,
}
