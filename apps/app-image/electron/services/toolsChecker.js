/**
 * 工具可用性检测服务
 * 检测 FFmpeg、Sharp、gifsicle、webpmux 等工具是否可用
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * 检测命令是否可用
 * @param {string} command - 命令名称
 * @returns {boolean}
 */
function isCommandAvailable(command) {
  try {
    execSync(`${command} -version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * 获取 FFmpeg 版本
 * @returns {string | null}
 */
function getFFmpegVersion() {
  try {
    const output = execSync('ffmpeg -version', { encoding: 'utf8' })
    const match = output.match(/ffmpeg version ([\d.]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * 检测 Sharp 是否可用
 * @returns {boolean}
 */
function isSharpAvailable() {
  try {
    require('sharp')
    return true
  } catch {
    return false
  }
}

/**
 * 检测 gifsicle 二进制是否可用
 * @returns {boolean}
 */
function isGifsicleAvailable() {
  try {
    const gifsicle = require('gifsicle')
    return fs.existsSync(gifsicle)
  } catch {
    return false
  }
}

/**
 * 检测 webpmux 二进制是否可用
 * @returns {boolean}
 */
function isWebpmuxAvailable() {
  try {
    const webpmux = require('webpmux-bin')
    return fs.existsSync(webpmux)
  } catch {
    return false
  }
}

/**
 * 检测 apngasm 是否可用（系统安装）
 * @returns {boolean}
 */
function isApngasmAvailable() {
  return isCommandAvailable('apngasm')
}

/**
 * 检测所有工具的可用性
 * @returns {Promise<Object>}
 */
async function checkAllTools() {
  const ffmpegAvailable = isCommandAvailable('ffmpeg')
  const ffmpegVersion = ffmpegAvailable ? getFFmpegVersion() : null

  return {
    ffmpeg: ffmpegAvailable,
    ffmpegVersion,
    sharp: isSharpAvailable(),
    gifsicle: isGifsicleAvailable(),
    webpmux: isWebpmuxAvailable(),
    apngasm: isApngasmAvailable(),
  }
}

module.exports = {
  checkAllTools,
  isCommandAvailable,
  getFFmpegVersion,
  isSharpAvailable,
  isGifsicleAvailable,
  isWebpmuxAvailable,
  isApngasmAvailable,
}
