const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// 导入服务
const toolsChecker = require('./services/toolsChecker')
const imageService = require('./services/imageService')
const ffmpegService = require('./services/ffmpegService')
const gifsicleService = require('./services/gifsicleService')
const webpService = require('./services/webpService')
const apngService = require('./services/apngService')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5174')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── IPC 处理 ─────────────────────────────────────────────────────────────────

ipcMain.handle('fs:readFile', async (_event, { path: filePath }) => {
  const buf = fs.readFileSync(filePath)
  return new Uint8Array(buf)
})

ipcMain.handle('fs:writeFile', async (_event, { path: filePath, data }) => {
  fs.writeFileSync(filePath, Buffer.from(data))
})

ipcMain.handle('fs:showSaveDialog', async (_event, { defaultPath, filters }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath, filters })
  return canceled ? null : filePath
})

ipcMain.handle('fs:showOpenDialog', async (_event, { filters, multiSelections }) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters,
    properties: multiSelections ? ['openFile', 'multiSelections'] : ['openFile'],
  })
  return canceled ? null : filePaths
})

ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:platform', () => process.platform)

// ─── 工具检测 ─────────────────────────────────────────────────────────────────

ipcMain.handle('check:tools', async () => {
  try {
    const status = await toolsChecker.checkAllTools()
    return { ok: true, data: status }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

// ─── Sharp 图片处理 ───────────────────────────────────────────────────────────

ipcMain.handle('sharp:resize', async (_event, options) => {
  try {
    const result = await imageService.resize(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('sharp:compress', async (_event, options) => {
  try {
    const result = await imageService.compress(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('sharp:convert', async (_event, options) => {
  try {
    const result = await imageService.convert(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

// ─── FFmpeg 动图处理 ──────────────────────────────────────────────────────────

ipcMain.handle('ffmpeg:make-animated', async (_event, options) => {
  try {
    const result = await ffmpegService.makeAnimatedFromBuffers(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('ffmpeg:convert-animated-buffer', async (_event, options) => {
  try {
    const result = await ffmpegService.convertAnimatedFromBuffer(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('ffmpeg:frames-to-animated', async (_event, options) => {
  try {
    const result = await ffmpegService.framesToAnimated(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('ffmpeg:animated-to-frames', async (_event, options) => {
  try {
    const result = await ffmpegService.animatedToFrames(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('ffmpeg:convert-animated', async (_event, options) => {
  try {
    const result = await ffmpegService.convertAnimated(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('ffmpeg:edit-animated', async (_event, options) => {
  try {
    const result = await ffmpegService.editAnimated(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

// ─── gifsicle GIF 优化 ────────────────────────────────────────────────────────

ipcMain.handle('gifsicle:optimize', async (_event, options) => {
  try {
    const result = await gifsicleService.optimize(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

// ─── WebP 动图处理 ────────────────────────────────────────────────────────────

ipcMain.handle('webp:create-animated', async (_event, options) => {
  try {
    const result = await webpService.createAnimated(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('webp:extract-frames', async (_event, options) => {
  try {
    const result = await webpService.extractFrames(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

// ─── APNG 处理 ────────────────────────────────────────────────────────────────

ipcMain.handle('apng:create', async (_event, options) => {
  try {
    const result = await apngService.create(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

ipcMain.handle('apng:disassemble', async (_event, options) => {
  try {
    const result = await apngService.disassemble(options)
    return { ok: true, data: result }
  } catch (error) {
    return { ok: false, error: error.message }
  }
})

