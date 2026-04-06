import path from 'node:path'
import { fsu } from './utils/fs.js'
import { logger } from './utils/logger.js'

/**
 * @typedef {Object} OperationContext
 * @property {string}   projectDir  - 项目根目录绝对路径
 * @property {string}   projectName - 项目名称
 * @property {string}   template    - 所选基础模板名
 * @property {string[]} features    - 所选 feature 列表
 */

/**
 * 更新项目 package.json 的 name 字段为用户输入的项目名
 * @param {OperationContext} ctx - 操作上下文
 * @returns {Promise<void>}
 */
async function updatePackageName({ projectDir, projectName }) {
  const pkgPath = path.join(projectDir, 'package.json')

  if (!await fsu.exists(pkgPath)) {
    logger.warn('package.json 不存在，跳过 name 更新')
    return
  }

  const pkg = await fsu.readJson(pkgPath)
  pkg.name = projectName
  await fsu.writeJson(pkgPath, pkg)
  logger.success(`已更新 package.json name → "${projectName}"`)
}

/**
 * 删除模板自带的 .git 目录，防止新项目继承原始提交历史
 * @param {OperationContext} ctx - 操作上下文
 * @returns {Promise<void>}
 */
async function cleanGitHistory({ projectDir }) {
  const gitDir = path.join(projectDir, '.git')
  await fsu.removeDir(gitDir)
  logger.success('已清除模板 .git 历史')
}

/**
 * 操作注册表
 * 新增操作只需在此注册，key 与 runOperations 调用的标识对应
 * @type {Record<string, (ctx: OperationContext) => Promise<void>>}
 */
const OPERATION_MAP = {
  cleanGit:   cleanGitHistory,
  updateName: updatePackageName,
}

/**
 * 按标识列表顺序执行注册操作（单个失败仅 warn，不中断后续）
 * @param {string[]}        keys - 操作标识列表
 * @param {OperationContext} ctx - 操作上下文
 * @returns {Promise<void>}
 */
async function runOperations(keys, ctx) {
  for (const key of keys) {
    const fn = OPERATION_MAP[key]

    if (!fn) {
      logger.warn(`未知操作 "${key}"，已跳过`)
      continue
    }

    logger.step(`执行: ${key}`)

    try {
      await fn(ctx)
    } catch (err) {
      logger.warn(`操作 "${key}" 失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

export { runOperations, updatePackageName, cleanGitHistory, OPERATION_MAP }
