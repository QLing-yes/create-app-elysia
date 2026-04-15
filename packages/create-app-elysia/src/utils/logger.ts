/**
 * 日志工具函数
 * 提供彩色的控制台输出
 */

// ANSI 颜色代码
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

/**
 * 打印信息日志
 */
export function info(message: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

/**
 * 打印成功日志
 */
export function success(message: string): void {
  console.log(`${colors.green}✔${colors.reset} ${message}`);
}

/**
 * 打印警告日志
 */
export function warn(message: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * 打印错误日志
 */
export function error(message: string): void {
  console.log(`${colors.red}✖${colors.reset} ${message}`);
}

/**
 * 打印步骤日志
 */
export function step(message: string): void {
  console.log(`${colors.cyan}›${colors.reset} ${message}`);
}

/**
 * 打印标题
 */
export function title(message: string): void {
  console.log(`\n${colors.bright}${colors.magenta}${message}${colors.reset}\n`);
}

/**
 * 打印分隔线
 */
export function divider(): void {
  console.log(`${colors.dim}───────────────────────────────────────${colors.reset}`);
}
