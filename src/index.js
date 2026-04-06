#!/usr/bin/env node
import { Command } from 'commander';
import { confirm, input, select } from '@inquirer/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import { cosmiconfig } from 'cosmiconfig';
import { simpleGit } from 'simple-git';
import ora from 'ora';
import fs from 'fs-extra';

/**
 * 将本地文件路径转换为 file:// URL（兼容 Windows 和 Linux）
 * @param {string} filepath - 本地文件路径
 * @returns {string} file:// URL
 */
function pathToFileURL(filepath) {
  const normalized = filepath.replace(/\\/g, '/');
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///';
  return prefix + normalized.replace(/:/g, '%3A');
}

/** 日志级别前缀图标 */
const ICON = {
  info:    chalk.cyan('ℹ'),
  success: chalk.green('✔'),
  warn:    chalk.yellow('⚠'),
  error:   chalk.red('✖'),
  step:    chalk.magenta('›'),
};

/**
 * 输出普通信息
 * @param {string} msg - 消息内容
 * @returns {void}
 */
function info(msg) {
  console.log(`${ICON.info} ${msg}`);
}

/**
 * 输出成功信息
 * @param {string} msg - 消息内容
 * @returns {void}
 */
function success(msg) {
  console.log(`${ICON.success} ${chalk.green(msg)}`);
}

/**
 * 输出警告信息（不中断流程）
 * @param {string} msg - 消息内容
 * @returns {void}
 */
function warn(msg) {
  console.warn(`${ICON.warn} ${chalk.yellow(msg)}`);
}

/**
 * 输出错误信息并退出进程
 * @param {string}   msg  - 错误描述
 * @param {unknown} [err] - 原始错误对象（可选）
 * @returns {never}
 */
function error(msg, err) {
  console.error(`${ICON.error} ${chalk.red(msg)}`);
  if (err) console.error(chalk.dim(err instanceof Error ? err.message : String(err)));
  process.exit(1);
}

/**
 * 输出流程步骤提示
 * @param {string} msg - 步骤描述
 * @returns {void}
 */
function step(msg) {
  console.log(`  ${ICON.step} ${chalk.dim(msg)}`);
}

/**
 * 输出带样式的 CLI 启动横幅
 * @param {string}  title     - 主标题
 * @param {string} [subtitle] - 副标题（可选）
 * @returns {void}
 */
function banner(title, subtitle) {
  console.log();
  console.log(chalk.bold.blue(title));
  if (subtitle) console.log(chalk.dim(subtitle));
  console.log();
}

/**
 * 输出水平分隔线
 * @param {number} [len=44] - 线段字符数
 * @returns {void}
 */
function divider(len = 44) {
  console.log(chalk.dim('─'.repeat(len)));
}

const logger = { info, success, warn, error, step, banner, divider };

/** cosmiconfig 搜索模块名 */
const MODULE_NAME = 'elysia-app';

/** @type {import('cosmiconfig').CosmiconfigResult | null} 配置搜索结果缓存 */
let _cached = null;

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
  });

  _cached = await explorer.search(searchFrom);
  return _cached?.config ?? {}
}

/**
 * 直接从指定文件路径加载配置（跳过自动搜索）
 * @param {string} filepath - 配置文件路径（绝对或相对）
 * @returns {Promise<AppConfig>} 配置对象
 */
async function loadConfigFile(filepath) {
  const explorer = cosmiconfig(MODULE_NAME);
  const result = await explorer.load(filepath);
  return result?.config ?? {}
}

/**
 * 清除配置缓存（用于测试或热重载）
 * @returns {void}
 */
function clearConfigCache() {
  _cached = null;
}

const config = { loadConfig, loadConfigFile, clearConfigCache };

/** 项目模板默认仓库地址 */
const DEFAULT_REPO = 'https://github.com/QLing-yes/ElysiaTemplate.git';

/** 最大重试次数 */
const MAX_RETRIES = 3;

/** 重试延迟基数（毫秒） */
const RETRY_DELAY_BASE = 1000;

/**
 * @typedef {Object} CloneOptions
 * @property {string}  dest        - 克隆到本地的目标目录（必填）
 * @property {string} [repo]       - 仓库地址（默认 DEFAULT_REPO）
 * @property {string} [branch]     - 指定分支（默认克隆默认分支）
 * @property {number} [depth=1]    - shallow clone 深度，0 表示完整克隆
 * @property {number} [retries=3]  - 最大重试次数
 */

/**
 * 检查 git 命令是否可用
 * @returns {Promise<boolean>}
 */
async function hasGit() {
  try {
    await simpleGit().version();
    return true
  } catch {
    return false
  }
}

/**
 * 克隆远端 Git 仓库到本地目录（带 spinner 和重试）
 * @param {CloneOptions} opts - 克隆选项
 * @returns {Promise<void>}
 * @throws {Error} git 不可用或克隆失败时抛出
 */
async function cloneRepo({ repo = DEFAULT_REPO, dest, branch, depth = 1, retries = MAX_RETRIES }) {
  if (!await hasGit()) {
    throw new Error('未找到 git 命令，请先安装 Git: https://git-scm.com')
  }

  /** @type {string[]} */
  const cloneArgs = [];
  if (depth > 0) cloneArgs.push('--depth', String(depth));
  if (branch)    cloneArgs.push('--branch', branch);

  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const spinner = ora(`拉取模板仓库… (${attempt}/${retries})`).start();

    try {
      await simpleGit().clone(repo, dest, cloneArgs);
      spinner.succeed('模板拉取完成');
      return
    } catch (err) {
      spinner.fail(`拉取失败 (${attempt}/${retries})`);
      lastErr = err;

      if (attempt < retries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastErr
}

/**
 * 检查指定目录是否已是 Git 仓库
 * @param {string} dir - 目标目录
 * @returns {Promise<boolean>}
 */
async function isGitRepo(dir) {
  try {
    await simpleGit(dir).revparse(['--git-dir']);
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
  const result = await simpleGit(dir).revparse(['--abbrev-ref', 'HEAD']);
  return result.trim()
}

const git = { cloneRepo, isGitRepo, currentBranch, hasGit, DEFAULT_REPO };

/**
 * 将源目录内容递归复制到目标目录（覆盖已存在文件，排除 _config.js）
 * @param {string} src  - 源目录路径
 * @param {string} dest - 目标目录路径
 * @returns {Promise<void>}
 */
async function copyDir(src, dest) {
  await fs.ensureDir(dest);
  await fs.copy(src, dest, {
    overwrite: true,
    filter: (srcPath) => !srcPath.endsWith('_config.js'),
  });
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
  const src = path.resolve(templateRoot, templateName);

  if (!await fs.pathExists(src)) {
    if (required) logger.error(`必要模板目录不存在: ${src}`);
    logger.warn(`跳过模板 "${templateName}"（目录不存在）`);
    return false
  }

  logger.step(`应用模板: ${templateName}`);
  await copyDir(src, destDir);
  return true
}

/**
 * 批量应用模板：先应用必要基础模板，再依次叠加可选 feature 模板
 * @param {string}   baseTemplate  - 必要的基础模板名称（缺失时致命退出）
 * @param {string[]} featureNames  - 可选 feature 模板名称列表
 * @param {string}   destDir       - 目标目录
 * @param {string}   templateRoot  - 模板根目录
 * @param {string}   [packageManager] - 包管理器
 * @returns {Promise<void>}
 */
async function applyTemplates(baseTemplate, featureNames, destDir, templateRoot, packageManager) {
  await applyTemplate(baseTemplate, destDir, templateRoot, true);
  await invokeTemplateConfig(baseTemplate, destDir, templateRoot, packageManager);

  for (const name of featureNames) {
    await applyTemplate(name, destDir, templateRoot, false);
    await invokeTemplateConfig(name, destDir, templateRoot, packageManager);
  }
}

/**
 * 加载并调用模板目录下的 _config.js 默认导出函数
 * @param {string} templateName - 模板名称
 * @param {string} destDir      - 目标目录（项目根目录）
 * @param {string} templateRoot - 模板根目录
 * @param {string} [packageManager] - 包管理器
 * @returns {Promise<void>}
 */
async function invokeTemplateConfig(templateName, destDir, templateRoot, packageManager) {
  const src = path.resolve(templateRoot, templateName);
  const configPath = path.join(src, '_config.js');

  if (!await fs.pathExists(configPath)) return;

  try {
    const configURL = pathToFileURL(configPath);
    const configModule = await import(configURL);
    if (configModule.default && typeof configModule.default === 'function') {
      await configModule.default({ projectDir: destDir, templateName, packageManager });
      logger.step(`调用模板配置: ${templateName}/_config.js`);
    }
  } catch (err) {
    logger.warn(`调用模板配置 "${templateName}/_config.js" 失败: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 确保目录存在（不存在则递归创建）
 * @param {string} dir - 目录路径
 * @returns {Promise<void>}
 */
async function ensureDir(dir) {
  await fs.ensureDir(dir);
}

/**
 * 安全删除目录（不存在时静默跳过）
 * @param {string} dir - 目录路径
 * @returns {Promise<void>}
 */
async function removeDir(dir) {
  await fs.remove(dir);
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
  await fs.outputJson(filepath, data, { spaces });
}

/**
 * 判断路径是否存在
 * @param {string} target - 文件或目录路径
 * @returns {Promise<boolean>}
 */
async function exists(target) {
  return fs.pathExists(target)
}

const fsu = { copyDir, applyTemplate, applyTemplates, ensureDir, removeDir, readJson, writeJson, exists };

/**
 * @typedef {Object} OperationContext
 * @property {string} projectDir  - 项目根目录绝对路径
 * @property {string} projectName - 项目名称
 * @property {string} selection   - 用户选择的模板名称
 */

/**
 * 更新 package.json 中的 name 字段
 * @param {OperationContext} ctx
 * @returns {Promise<void>}
 */
async function updatePackageName({ projectDir, projectName }) {
  const pkgPath = path.join(projectDir, 'package.json');

  if (!await fsu.exists(pkgPath)) {
    logger.warn('package.json 不存在，跳过 name 更新');
    return
  }

  const pkg = await fsu.readJson(pkgPath);
  pkg.name = projectName;
  await fsu.writeJson(pkgPath, pkg);
  logger.success(`已更新 package.json name → "${projectName}"`);
}

/**
 * 操作注册表
 * @type {Record<string, (ctx: OperationContext) => Promise<void>>}
 */
const OPERATION_MAP = {
  updateName: updatePackageName,
};

/**
 * 顺序执行操作列表（单个失败仅 warn，不中断后续）
 * @param {string[]}        keys
 * @param {OperationContext} ctx
 * @returns {Promise<void>}
 */
async function runOperations(keys, ctx) {
  for (const key of keys) {
    const fn = OPERATION_MAP[key];

    if (!fn) {
      logger.warn(`未知操作 "${key}"，已跳过`);
      continue
    }

    logger.step(`执行: ${key}`);

    try {
      await fn(ctx);
    } catch (err) {
      logger.warn(`操作 "${key}" 失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/** 兼容 Windows 的 __dirname（src/ 中使用，dist/ 中同样有效） */
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));

/** @type {{ version: string, name: string }} */
const pkg = JSON.parse(readFileSync(path.join(__dirname$1, '..', 'package.json'), 'utf8'));

/**
 * 动态获取 template 目录下的所有子目录名称
 * @returns {Promise<string[]>}
 */
async function getTemplateDirs() {
  const templateRoot = path.join(__dirname$1, '..', 'template');
  const entries = await fs.readdir(templateRoot, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
}

/**
 * 返回默认操作列表
 * @returns {string[]}
 */
function getDefaultOperations() {
  return ['updateName'];
}

// ── 选项定义（动态生成）───────────────────────────────────────────────────────

let VALID_SELECTIONS = new Set();
let SELECTION_CHOICES = [];
let NEXT_STEPS = {};

// ── 类型定义 ──────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CreateOptions
 * @property {string}  [configPath] - 配置文件路径（--config）
 * @property {string}  [select]     - 预设选项（--select）
 * @property {boolean} [force]      - 覆盖已存在目录（--force）
 * @property {boolean} [yes]        - 跳过所有确认（--yes）
 */

// ── 交互提示 ──────────────────────────────────────────────────────────────────

/**
 * 收集项目名称（命令行传入则跳过提示）
 * @param {string | undefined} nameArg
 * @returns {Promise<string>}
 */
async function askProjectName(nameArg) {
  if (nameArg) return nameArg

  return input({
    message:  '项目名称',
    default:  'my-elysia-app',
    validate: v => /^[a-z0-9][a-z0-9-]*$/.test(v) || '只允许小写字母、数字和连字符，且不得以连字符开头',
  })
}

/**
 * 收集模板选项（--select 传入则跳过提示）
 * @param {string | undefined} selectOpt
 * @returns {Promise<string>}
 */
async function askSelection(selectOpt) {
  if (selectOpt) {
    if (!VALID_SELECTIONS.has(selectOpt)) {
      logger.error(`无效选项 "${selectOpt}"，可选值: ${[...VALID_SELECTIONS].join(', ')}`);
      process.exit(1);
    }
    return selectOpt
  }

  return select({ message: '选择模板', choices: SELECTION_CHOICES })
}

/**
 * 收集包管理器选项
 * @returns {Promise<string>}
 */
async function askPackageManager() {
  return select({
    message: '选择包管理器',
    choices: [
      { name: `${chalk.cyan('bun')} (推荐)`, value: 'bun' },
      { name: 'npm', value: 'npm' },
      { name: 'pnpm', value: 'pnpm' },
      { name: 'yarn', value: 'yarn' },
    ],
  });
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

/**
 * CLI 主流程：询问 → 确认 → 克隆 → 应用模板 → 后处理操作
 * @param {string | undefined} nameArg
 * @param {CreateOptions}      opts
 * @returns {Promise<void>}
 */
async function handleCreate(nameArg, opts) {
  logger.banner('create-app-elysia', `v${pkg.version}  ·  ElysiaJS 项目脚手架`);

  const templateDirs = await getTemplateDirs();
  VALID_SELECTIONS = new Set(templateDirs);
  SELECTION_CHOICES = templateDirs.map(name => ({
    name:  `${chalk.cyan(name)}`,
    value: name,
  }));
  NEXT_STEPS = Object.fromEntries(
    templateDirs.map(name => [name, ['bun install', 'bun dev']])
  );

  const fileConfig = opts.configPath
    ? await config.loadConfigFile(opts.configPath)
    : await config.loadConfig();

  const projectName = await askProjectName(nameArg);
  const selection   = await askSelection(opts.select);
  const packageManager = opts.yes ? 'bun' : await askPackageManager();
  const projectDir  = path.resolve(process.cwd(), projectName);

  // 目录冲突处理
  if (await fsu.exists(projectDir)) {
    if (opts.force || opts.yes) {
      logger.warn(`覆盖已存在的目录: ${chalk.dim(projectDir)}`);
      await fsu.removeDir(projectDir);
    } else {
      const overwrite = await confirm({
        message: `目录 "${projectName}" 已存在，是否覆盖？`,
        default: false,
      });
      if (!overwrite) { logger.info('已取消。'); process.exit(0); }
      await fsu.removeDir(projectDir);
    }
  }

  // 摘要确认
  logger.divider();
  logger.info(`名称: ${chalk.bold(projectName)}`);
  logger.info(`模板: ${chalk.cyan(selection)}`);
  logger.divider();

  if (!opts.yes) {
    const ok = await confirm({ message: '确认创建？', default: true });
    if (!ok) { logger.info('已取消。'); process.exit(0); }
  }

  console.log();

  // Step 1 — 拉取项目模板
  const repo = fileConfig.template ?? git.DEFAULT_REPO;
  try {
    await git.cloneRepo({ repo, dest: projectDir });
  } catch (err) {
    await fsu.removeDir(projectDir);
    logger.error('克隆失败，已清理目标目录', err);
  }

  // Step 2 — 应用模板覆盖文件
  const templateRoot = path.join(__dirname$1, '..', 'template');
  await fsu.applyTemplates(selection, [], projectDir, templateRoot, packageManager);

  // Step 3 — 按选择执行后处理操作
  const ctx = { projectDir, projectName, selection };
  await runOperations(getDefaultOperations(), ctx);

  // 完成提示
  const steps = NEXT_STEPS[selection] ?? ['bun install', 'bun dev'];
  console.log();
  logger.divider();
  logger.success(`项目 ${chalk.bold.green(projectName)} 已就绪！`);
  console.log();
  console.log(chalk.dim('  下一步：'));
  console.log(`    ${chalk.cyan('cd')} ${projectName}`);
  for (const s of steps) console.log(`    ${chalk.cyan(s)}`);
  console.log();
}

// ── Commander ─────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('create-app-elysia')
  .description('快速创建 ElysiaJS 后端项目')
  .version(pkg.version, '-v, --version', '显示版本号')
  .helpOption('-h, --help', '显示帮助信息')
  .argument('[name]', '项目名称（省略则交互式输入）')
  .option('-s, --select <n>', '指定模板名称，跳过交互')
  .option('-c, --config <path>', '指定配置文件路径', (v, _) => v, undefined)
  .option('-f, --force', '目录已存在时直接覆盖，不询问')
  .option('-y, --yes', '跳过所有确认，使用默认值')
  .addHelpText('after', `
${chalk.dim('示例：')}
  ${chalk.cyan('$')} create-app-elysia
  ${chalk.cyan('$')} create-app-elysia my-api
  ${chalk.cyan('$')} create-app-elysia my-api --select <template>
`)
  .action(handleCreate);

process.on('SIGINT', () => {
  console.log();
  logger.info('已中止。');
  process.exit(0);
});

await program.parseAsync(process.argv);