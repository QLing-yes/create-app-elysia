import { cosmiconfig } from 'cosmiconfig'

/** cosmiconfig 搜索模块名 */
const MODULE_NAME = 'elysia-app'

/** @type {import('cosmiconfig').CosmiconfigResult | null} 配置搜索结果缓存 */
let _cached = null

/**
 * @typedef {Object} AppConfig
 * @property {string}                  [template]  - 自定义模板仓库地址
 * @property {string}                  [outputDir] - 默认项目输出目录
 * @property {Record<string, unknown>} [options]   - 自定义扩展字段
 */

/**
 * 从当前工作目录向上搜索并加载配置文件
 * 支持 `.elysia-apprc` / `.elysia-apprc.json` / `elysia-app.config.js` 等标准位置
 * 结果会被内存缓存，多次调用只读一次磁盘
 * @param {string} [searchFrom=process.cwd()] - 搜索起始目录
 * @returns {Promise<AppConfig>} 配置对象（无配置文件时返回空对象）
 */
async function loadConfig(searchFrom = process.cwd()) {
  if (_cached) return _cached.config ?? {}

  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.js`,
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.mjs`,
    ],
  })

  _cached = await explorer.search(searchFrom)
  return _cached?.config ?? {}
}

/**
 * 直接从指定文件路径加载配置（跳过自动搜索）
 * @param {string} filepath - 配置文件路径（绝对或相对）
 * @returns {Promise<AppConfig>} 配置对象
 */
async function loadConfigFile(filepath) {
  const explorer = cosmiconfig(MODULE_NAME)
  const result = await explorer.load(filepath)
  return result?.config ?? {}
}

/**
 * 清除配置缓存（用于测试或热重载）
 * @returns {void}
 */
function clearConfigCache() {
  _cached = null
}

export const config = { loadConfig, loadConfigFile, clearConfigCache }
