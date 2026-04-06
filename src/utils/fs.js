import fs from 'fs-extra'
import path from 'node:path'
import { logger } from './logger.js'

/**
 * 将源目录内容递归复制到目标目录（覆盖已存在文件）
 * @param {string} src  - 源目录路径
 * @param {string} dest - 目标目录路径
 * @returns {Promise<void>}
 */
async function copyDir(src, dest) {
  await fs.ensureDir(dest)
  await fs.copy(src, dest, { overwrite: true })
}

/**
 * 将模板子目录内容覆盖合并到目标目录
 * @param {string}  templateName     - 模板子目录名称
 * @param {string}  destDir          - 目标目录（项目根目录）
 * @param {string}  templateRoot     - 模板根目录
 * @param {boolean} [required=false] - true 时目录缺失触发致命退出；false 时 warn 并跳过
 * @returns {Promise<boolean>} 是否实际应用了模板
 */
async function applyTemplate(templateName, destDir, templateRoot, required = false) {
  const src = path.resolve(templateRoot, templateName)

  if (!await fs.pathExists(src)) {
    if (required) logger.error(`必要模板目录不存在: ${src}`)
    logger.warn(`跳过模板 "${templateName}"（目录不存在）`)
    return false
  }

  logger.step(`应用模板: ${templateName}`)
  await copyDir(src, destDir)
  return true
}

/**
 * 批量应用模板：先应用必要基础模板，再依次叠加可选 feature 模板
 * @param {string}   baseTemplate  - 必要的基础模板名称（缺失时致命退出）
 * @param {string[]} featureNames  - 可选 feature 模板名称列表
 * @param {string}   destDir       - 目标目录
 * @param {string}   templateRoot  - 模板根目录
 * @returns {Promise<void>}
 */
async function applyTemplates(baseTemplate, featureNames, destDir, templateRoot) {
  await applyTemplate(baseTemplate, destDir, templateRoot, true)

  for (const name of featureNames) {
    await applyTemplate(name, destDir, templateRoot, false)
  }
}

/**
 * 确保目录存在（不存在则递归创建）
 * @param {string} dir - 目录路径
 * @returns {Promise<void>}
 */
async function ensureDir(dir) {
  await fs.ensureDir(dir)
}

/**
 * 安全删除目录（不存在时静默跳过）
 * @param {string} dir - 目录路径
 * @returns {Promise<void>}
 */
async function removeDir(dir) {
  await fs.remove(dir)
}

/**
 * 读取 JSON 文件并解析
 * @template T
 * @param {string} filepath - JSON 文件路径
 * @returns {Promise<T>}
 */
async function readJson(filepath) {
  return fs.readJson(filepath)
}

/**
 * 将对象序列化写入 JSON 文件（带缩进格式化）
 * @param {string}  filepath   - 目标文件路径
 * @param {unknown} data       - 要写入的对象
 * @param {number} [spaces=2]  - 缩进空格数
 * @returns {Promise<void>}
 */
async function writeJson(filepath, data, spaces = 2) {
  await fs.outputJson(filepath, data, { spaces })
}

/**
 * 判断路径是否存在
 * @param {string} target - 文件或目录路径
 * @returns {Promise<boolean>}
 */
async function exists(target) {
  return fs.pathExists(target)
}

export const fsu = { copyDir, applyTemplate, applyTemplates, ensureDir, removeDir, readJson, writeJson, exists }
