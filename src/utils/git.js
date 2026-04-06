import { simpleGit } from 'simple-git'
import ora from 'ora'

/** 项目模板默认仓库地址 */
const DEFAULT_REPO = 'https://github.com/QLing-yes/ElysiaTemplate.git'

/**
 * @typedef {Object} CloneOptions
 * @property {string}  dest        - 克隆到本地的目标目录（必填）
 * @property {string} [repo]       - 仓库地址（默认 DEFAULT_REPO）
 * @property {string} [branch]     - 指定分支（默认克隆默认分支）
 * @property {number} [depth=1]    - shallow clone 深度，0 表示完整克隆
 */

/**
 * 检查 git 命令是否可用
 * @returns {Promise<boolean>}
 */
async function hasGit() {
  try {
    await simpleGit().version()
    return true
  } catch {
    return false
  }
}

/**
 * 克隆远端 Git 仓库到本地目录（带 spinner）
 * @param {CloneOptions} opts - 克隆选项
 * @returns {Promise<void>}
 * @throws {Error} git 不可用或克隆失败时抛出
 */
async function cloneRepo({ repo = DEFAULT_REPO, dest, branch, depth = 1 }) {
  if (!await hasGit()) {
    throw new Error('未找到 git 命令，请先安装 Git: https://git-scm.com')
  }

  /** @type {string[]} */
  const cloneArgs = []
  if (depth > 0) cloneArgs.push('--depth', String(depth))
  if (branch)    cloneArgs.push('--branch', branch)

  const spinner = ora('拉取模板仓库…').start()

  try {
    await simpleGit().clone(repo, dest, cloneArgs)
    spinner.succeed('模板拉取完成')
  } catch (err) {
    spinner.fail('模板拉取失败')
    throw err
  }
}

/**
 * 检查指定目录是否已是 Git 仓库
 * @param {string} dir - 目标目录
 * @returns {Promise<boolean>}
 */
async function isGitRepo(dir) {
  try {
    await simpleGit(dir).revparse(['--git-dir'])
    return true
  } catch {
    return false
  }
}

/**
 * 获取仓库当前分支名
 * @param {string} [dir=process.cwd()] - 仓库目录
 * @returns {Promise<string>}
 */
async function currentBranch(dir = process.cwd()) {
  const result = await simpleGit(dir).revparse(['--abbrev-ref', 'HEAD'])
  return result.trim()
}

export const git = { cloneRepo, isGitRepo, currentBranch, hasGit, DEFAULT_REPO }
