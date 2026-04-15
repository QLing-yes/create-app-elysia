/**
 * Utils 层统一导出
 * 第一层：配置与工具层
 */

// 文件操作工具
export {
  createOrFindDir,
  writeFile,
  fileExists,
  removeDir,
  readDir,
  resolvePath,
  joinPath,
} from "./fs";

// 包管理器工具
export {
  detectPackageManager,
  pmExecuteMap,
  pmRunMap,
  pmFilterMonorepoMap,
  pmLockFilesMap,
  pmInstallFrozenLockfile,
  pmInstallFrozenLockfileProduction,
  getInstallCommand,
} from "./package-manager";

// 日志工具
export {
  info,
  success,
  warn,
  error,
  step,
  title,
  divider,
} from "./logger";

// 用户偏好配置
export { Preferences } from "./preferences";
export type { PreferencesType } from "./preferences";

// 从原 utils.ts 保持向后兼容
export { exec } from "./package-manager";
