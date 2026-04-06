import chalk from 'chalk'

/** 日志级别前缀图标 */
const ICON = {
  info:    chalk.cyan('ℹ'),
  success: chalk.green('✔'),
  warn:    chalk.yellow('⚠'),
  error:   chalk.red('✖'),
  step:    chalk.magenta('›'),
}

/**
 * 输出普通信息
 * @param {string} msg - 消息内容
 * @returns {void}
 */
function info(msg) {
  console.log(`${ICON.info} ${msg}`)
}

/**
 * 输出成功信息
 * @param {string} msg - 消息内容
 * @returns {void}
 */
function success(msg) {
  console.log(`${ICON.success} ${chalk.green(msg)}`)
}

/**
 * 输出警告信息（不中断流程）
 * @param {string} msg - 消息内容
 * @returns {void}
 */
function warn(msg) {
  console.warn(`${ICON.warn} ${chalk.yellow(msg)}`)
}

/**
 * 输出错误信息并退出进程
 * @param {string}   msg  - 错误描述
 * @param {unknown} [err] - 原始错误对象（可选）
 * @returns {never}
 */
function error(msg, err) {
  console.error(`${ICON.error} ${chalk.red(msg)}`)
  if (err) console.error(chalk.dim(err instanceof Error ? err.message : String(err)))
  process.exit(1)
}

/**
 * 输出流程步骤提示
 * @param {string} msg - 步骤描述
 * @returns {void}
 */
function step(msg) {
  console.log(`  ${ICON.step} ${chalk.dim(msg)}`)
}

/**
 * 输出带样式的 CLI 启动横幅
 * @param {string}  title     - 主标题
 * @param {string} [subtitle] - 副标题（可选）
 * @returns {void}
 */
function banner(title, subtitle) {
  console.log()
  console.log(chalk.bold.blue(title))
  if (subtitle) console.log(chalk.dim(subtitle))
  console.log()
}

/**
 * 输出水平分隔线
 * @param {number} [len=44] - 线段字符数
 * @returns {void}
 */
function divider(len = 44) {
  console.log(chalk.dim('─'.repeat(len)))
}

export const logger = { info, success, warn, error, step, banner, divider }
