#!/usr/bin/env node
import { Command } from 'commander';
import { confirm, input, select } from '@inquirer/prompts';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import { cosmiconfig } from 'cosmiconfig';
import { simpleGit } from 'simple-git';
import ora from 'ora';
import fs from 'fs-extra';

// ── 统一配置中心 ──────────────────────────────────────────────────────────────
/**
 * 全局应用配置，所有常量、默认值、路径、文本均在此统一维护。
 * 业务代码应从此对象读取，避免魔法字符串散落各处。
 */
const APP_CONFIG = {
  /** cosmiconfig 搜索模块名 */
  moduleName: 'elysia-app',

  /** 项目模板默认远程仓库（主项目） */
  defaultRepo: 'https://github.com/QLing-yes/ElysiaTemplate.git',

  /** 用于同步本地 template 文件夹的远程仓库 */
  templateSyncRepo: 'https://github.com/QLing-yes/ElysiaTemplate.git',

  /** 同步时拉取的分支名 */
  templateSyncBranch: 'template',

  /** 临时克隆目录名（相对于包根目录） */
  tempDirName: '.temp-template',

  /** 本地 template 目录名（相对于包根目录） */
  templateDirName: 'template',

  /** package.json 位置（相对于包根目录） */
  packageJsonRelPath: '../package.json',

  git: {
    /** shallow clone 默认深度，0 = 完整克隆 */
    defaultDepth: 1,
    /** 克隆失败最大重试次数 */
    maxRetries: 3,
    /** 重试指数退避基数（毫秒） */
    retryDelayBase: 1000,
    /** 主模板克隆分支 */
    mainBranch: 'main',
  },

  /** 项目名称校验正则 */
  projectNamePattern: /^[a-z0-9][a-z0-9-]*$/,

  /** 项目名称默认值 */
  defaultProjectName: 'my-elysia-app',

  /** 创建完成后默认提示的下一步命令 */
  defaultNextSteps: ['bun install', 'bun dev'],

  /** 分隔线默认长度 */
  dividerLen: 44,

  /** 配置文件搜索位置（按优先级排序） */
  get configSearchPlaces() {
    const n = APP_CONFIG.moduleName;
    return [`.${n}rc`, `.${n}rc.json`, `.${n}rc.js`, `${n}.config.js`, `${n}.config.mjs`];
  },
};

// ── 兼容 __dirname ────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {{ version: string, name: string }} */
const pkg = JSON.parse(
  readFileSync(path.join(__dirname, APP_CONFIG.packageJsonRelPath), 'utf8'),
);

// ── 日志工具 ──────────────────────────────────────────────────────────────────
/** 日志级别前缀图标 */
const ICON = {
  info:    chalk.cyan('ℹ'),
  success: chalk.green('✔'),
  warn:    chalk.yellow('⚠'),
  error:   chalk.red('✖'),
  step:    chalk.magenta('›'),
};

/**
 * @param {string} msg
 * @returns {void}
 */
function info(msg) { console.log(`${ICON.info} ${msg}`); }

/**
 * @param {string} msg
 * @returns {void}
 */
function success(msg) { console.log(`${ICON.success} ${chalk.green(msg)}`); }

/**
 * @param {string} msg
 * @returns {void}
 */
function warn(msg) { console.warn(`${ICON.warn} ${chalk.yellow(msg)}`); }

/**
 * 输出错误信息并退出进程
 * @param {string}   msg
 * @param {unknown} [err]
 * @returns {never}
 */
function error(msg, err) {
  console.error(`${ICON.error} ${chalk.red(msg)}`);
  if (err) console.error(chalk.dim(err instanceof Error ? err.message : String(err)));
  process.exit(1);
}

/**
 * @param {string} msg
 * @returns {void}
 */
function step(msg) { console.log(`  ${ICON.step} ${chalk.dim(msg)}`); }

/**
 * @param {string}  title
 * @param {string} [subtitle]
 * @returns {void}
 */
function banner(title, subtitle) {
  console.log();
  console.log(chalk.bold.blue(title));
  if (subtitle) console.log(chalk.dim(subtitle));
  console.log();
}

/**
 * @param {number} [len]
 * @returns {void}
 */
function divider(len = APP_CONFIG.dividerLen) {
  console.log(chalk.dim('─'.repeat(len)));
}

const logger = { info, success, warn, error, step, banner, divider };

// ── 配置加载（cosmiconfig） ────────────────────────────────────────────────────
/**
 * @typedef {Object} AppConfig
 * @property {string}                  [template]  - 自定义模板仓库地址
 * @property {string}                  [outputDir] - 默认项目输出目录
 * @property {Record<string, unknown>} [options]   - 自定义扩展字段
 */

/** @type {import('cosmiconfig').CosmiconfigResult | null} */
let _configCache = null;

/**
 * 从当前工作目录向上搜索并加载配置文件（结果内存缓存，多次调用只读一次磁盘）
 * @param {string} [searchFrom]
 * @returns {Promise<AppConfig>}
 */
async function loadConfig(searchFrom = process.cwd()) {
  if (_configCache) return _configCache.config ?? {};

  const explorer = cosmiconfig(APP_CONFIG.moduleName, {
    searchPlaces: APP_CONFIG.configSearchPlaces,
  });

  _configCache = await explorer.search(searchFrom);
  return _configCache?.config ?? {};
}

/**
 * 直接从指定文件路径加载配置（跳过自动搜索）
 * @param {string} filepath
 * @returns {Promise<AppConfig>}
 */
async function loadConfigFile(filepath) {
  const explorer = cosmiconfig(APP_CONFIG.moduleName);
  const result = await explorer.load(filepath);
  return result?.config ?? {};
}

/**
 * 清除配置缓存（用于测试或热重载）
 * @returns {void}
 */
function clearConfigCache() { _configCache = null; }

const config = { loadConfig, loadConfigFile, clearConfigCache };

// ── Git 操作 ──────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} CloneOptions
 * @property {string}  dest           - 克隆到本地的目标目录（必填）
 * @property {string} [repo]          - 仓库地址（默认 APP_CONFIG.defaultRepo）
 * @property {string} [branch]        - 指定分支（默认克隆默认分支）
 * @property {number} [depth]         - shallow clone 深度，0 表示完整克隆
 * @property {number} [retries]       - 最大重试次数
 * @property {object} [spinner]       - 外部传入的 ora spinner（不传则自行创建）
 */

/**
 * 检查 git 命令是否可用
 * @returns {Promise<boolean>}
 */
async function hasGit() {
  try { await simpleGit().version(); return true; }
  catch { return false; }
}

/**
 * 克隆远端 Git 仓库到本地目录（带 spinner 和指数退避重试）
 * @param {CloneOptions} opts
 * @returns {Promise<void>}
 * @throws {Error} git 不可用或重试耗尽时抛出
 */
async function cloneRepo({
  repo    = APP_CONFIG.defaultRepo,
  dest,
  branch,
  depth   = APP_CONFIG.git.defaultDepth,
  retries = APP_CONFIG.git.maxRetries,
  spinner = null,
}) {
  if (!await hasGit()) {
    throw new Error('未找到 git 命令，请先安装 Git: https://git-scm.com');
  }

  /** @type {string[]} */
  const cloneArgs = [];
  if (depth > 0) cloneArgs.push('--depth', String(depth));
  if (branch)    cloneArgs.push('--branch', branch);

  const ownSpinner = !spinner;
  if (ownSpinner) spinner = ora();

  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    spinner.start(`拉取中… (${attempt}/${retries})`);

    try {
      await simpleGit().clone(repo, dest, cloneArgs);
      // 外部 spinner 由调用方统一收尾；自有 spinner 在此 succeed
      if (ownSpinner) spinner.succeed('主模板拉取完成');
      return;
    } catch (err) {
      spinner.fail(`拉取失败 (${attempt}/${retries})`);
      lastErr = err;

      if (attempt < retries) {
        const delay = APP_CONFIG.git.retryDelayBase * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastErr;
}

/**
 * 检查指定目录是否已是 Git 仓库
 * @param {string} dir
 * @returns {Promise<boolean>}
 */
async function isGitRepo(dir) {
  try { await simpleGit(dir).revparse(['--git-dir']); return true; }
  catch { return false; }
}

/**
 * 获取仓库当前分支名
 * @param {string} [dir]
 * @returns {Promise<string>}
 */
async function currentBranch(dir = process.cwd()) {
  const result = await simpleGit(dir).revparse(['--abbrev-ref', 'HEAD']);
  return result.trim();
}

const git = { cloneRepo, isGitRepo, currentBranch, hasGit };

// ── 文件系统工具 ──────────────────────────────────────────────────────────────
/**
 * 将源目录内容递归复制到目标目录（覆盖已存在文件，排除 _config.js）
 * @param {string} src
 * @param {string} dest
 * @returns {Promise<void>}
 */
async function copyDir(src, dest) {
  await fs.ensureDir(dest);
  await fs.copy(src, dest, {
    overwrite: true,
    filter: srcPath => !srcPath.endsWith('_config.js'),
  });
}

/**
 * 将模板子目录内容覆盖合并到目标目录
 * @param {string}  templateName
 * @param {string}  destDir
 * @param {string}  templateRoot
 * @param {boolean} [required=false]
 * @returns {Promise<boolean>}
 */
async function applyTemplate(templateName, destDir, templateRoot, required = false) {
  const src = path.resolve(templateRoot, templateName);

  if (!await fs.pathExists(src)) {
    if (required) logger.error(`必要模板目录不存在: ${src}`);
    logger.warn(`跳过模板 "${templateName}"（目录不存在）`);
    return false;
  }

  await copyDir(src, destDir);
  return true;
}

/**
 * 加载并调用模板目录下的 _config.js 默认导出函数
 * @param {string} templateName
 * @param {string} destDir
 * @param {string} templateRoot
 * @returns {Promise<void>}
 */
async function invokeTemplateConfig(templateName, destDir, templateRoot) {
  const configPath = path.join(path.resolve(templateRoot, templateName), '_config.js');
  if (!await fs.pathExists(configPath)) return;

  try {
    const mod = await import(pathToFileURL(configPath).href);
    if (typeof mod.default === 'function') {
      await mod.default({ projectDir: destDir, templateName });
    }
  } catch (err) {
    logger.warn(
      `调用模板配置 "${templateName}/_config.js" 失败: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * 批量应用模板：先应用必要基础模板，再依次叠加可选 feature 模板
 * @param {string}   baseTemplate
 * @param {string[]} featureNames
 * @param {string}   destDir
 * @param {string}   templateRoot
 * @returns {Promise<void>}
 */
async function applyTemplates(baseTemplate, featureNames, destDir, templateRoot) {
  await applyTemplate(baseTemplate, destDir, templateRoot, true);
  await invokeTemplateConfig(baseTemplate, destDir, templateRoot);

  for (const name of featureNames) {
    await applyTemplate(name, destDir, templateRoot, false);
    await invokeTemplateConfig(name, destDir, templateRoot);
  }
}

/**
 * @param {string} dir
 * @returns {Promise<void>}
 */
async function ensureDir(dir) { await fs.ensureDir(dir); }

/**
 * @param {string} dir
 * @returns {Promise<void>}
 */
async function removeDir(dir) { await fs.remove(dir); }

/**
 * @template T
 * @param {string} filepath
 * @returns {Promise<T>}
 */
async function readJson(filepath) { return fs.readJson(filepath); }

/**
 * @param {string}  filepath
 * @param {unknown} data
 * @param {number}  [spaces=2]
 * @returns {Promise<void>}
 */
async function writeJson(filepath, data, spaces = 2) {
  await fs.outputJson(filepath, data, { spaces });
}

/**
 * @param {string} target
 * @returns {Promise<boolean>}
 */
async function exists(target) { return fs.pathExists(target); }

const fsu = { copyDir, applyTemplate, applyTemplates, ensureDir, removeDir, readJson, writeJson, exists };

// ── 后处理操作 ────────────────────────────────────────────────────────────────
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
    return;
  }

  const pkgData = await fsu.readJson(pkgPath);
  pkgData.name = projectName;
  await fsu.writeJson(pkgPath, pkgData);
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

    if (!fn) { logger.warn(`未知操作 "${key}"，已跳过`); continue; }

    try {
      await fn(ctx);
    } catch (err) {
      logger.warn(`操作 "${key}" 失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

// ── 主流程辅助函数 ────────────────────────────────────────────────────────────
/** 包根目录路径 */
const PKG_ROOT     = path.join(__dirname, '..');
const TEMPLATE_DIR = path.join(PKG_ROOT, APP_CONFIG.templateDirName);
const TEMP_DIR     = path.join(PKG_ROOT, APP_CONFIG.tempDirName);

/**
 * 动态获取 template 目录下的所有子目录名称
 * @returns {Promise<string[]>}
 */
async function getTemplateDirs() {
  const entries = await fs.readdir(TEMPLATE_DIR, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name).sort();
}

/**
 * 从远程仓库拉取最新模板并覆盖本地 template 目录（使用统一 spinner）
 * @returns {Promise<void>}
 */
async function syncRemoteTemplates() {
  const spinner = ora('同步远程模板…').start();

  try {
    await fs.remove(TEMP_DIR); // 清理上次可能残留的临时目录
    await git.cloneRepo({
      repo:    APP_CONFIG.templateSyncRepo,
      dest:    TEMP_DIR,
      branch:  APP_CONFIG.templateSyncBranch,
      depth:   1,
      spinner,                  // 复用外部 spinner，避免嵌套闪烁
    });

    const entries = await fs.readdir(TEMP_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      await fs.remove(path.join(TEMPLATE_DIR, entry.name));
      await fs.copy(path.join(TEMP_DIR, entry.name), path.join(TEMPLATE_DIR, entry.name));
    }

    await fs.remove(TEMP_DIR);
    await fs.remove(path.join(TEMPLATE_DIR, '.git'));
    spinner.succeed('远程模板同步完成');
  } catch (err) {
    spinner.fail('远程模板同步失败');
    logger.warn(err instanceof Error ? err.message : String(err));
  }
}

/**
 * 构建运行时选项（模板列表、choices、nextSteps）
 * @param {string[]} templateDirs
 * @returns {{ validSelections: Set<string>, selectionChoices: object[], nextSteps: Record<string, string[]> }}
 */
function buildRuntimeOptions(templateDirs) {
  return {
    validSelections: new Set(templateDirs),
    selectionChoices: templateDirs.map(name => ({
      name:  chalk.cyan(name),
      value: name,
    })),
    nextSteps: Object.fromEntries(
      templateDirs.map(name => [name, [...APP_CONFIG.defaultNextSteps]]),
    ),
  };
}

// ── 交互提示 ──────────────────────────────────────────────────────────────────
/**
 * @param {string | undefined} nameArg
 * @returns {Promise<string>}
 */
async function askProjectName(nameArg) {
  if (nameArg) return nameArg;

  return input({
    message:  '项目名称',
    default:  APP_CONFIG.defaultProjectName,
    validate: v => APP_CONFIG.projectNamePattern.test(v) || '只允许小写字母、数字和连字符，且不得以连字符开头',
  });
}

/**
 * @param {string | undefined}  selectOpt
 * @param {Set<string>}         validSelections
 * @param {object[]}            selectionChoices
 * @returns {Promise<string>}
 */
async function askSelection(selectOpt, validSelections, selectionChoices) {
  if (selectOpt) {
    if (!validSelections.has(selectOpt)) {
      logger.error(`无效选项 "${selectOpt}"，可选值: ${[...validSelections].join(', ')}`);
      // logger.error 内部调用 process.exit(1)，以下永不执行
    }
    return selectOpt;
  }

  return select({ message: '选择模板', choices: selectionChoices });
}

/**
 * 处理目录冲突（已存在时询问是否覆盖）
 * @param {string}  projectDir
 * @param {string}  projectName
 * @param {object}  opts
 * @param {boolean} opts.force
 * @param {boolean} opts.yes
 * @returns {Promise<void>}
 */
async function handleDirConflict(projectDir, projectName, { force, yes }) {
  if (!await fsu.exists(projectDir)) return;

  if (force || yes) {
    logger.warn(`覆盖已存在的目录: ${chalk.dim(projectDir)}`);
  } else {
    const overwrite = await confirm({
      message: `目录 "${projectName}" 已存在，是否覆盖？`,
      default: false,
    });
    if (!overwrite) { logger.info('已取消。'); process.exit(0); }
  }

  await fsu.removeDir(projectDir);
}

/**
 * 打印创建完成后的操作指引
 * @param {string}   projectName
 * @param {string[]} steps
 * @returns {void}
 */
function printNextSteps(projectName, steps) {
  console.log();
  logger.divider();
  logger.success(`项目 ${chalk.bold.green(projectName)} 已就绪！`);
  console.log();
  console.log(chalk.dim('  下一步：'));
  console.log(`    ${chalk.cyan('cd')} ${projectName}`);
  for (const s of steps) console.log(`    ${chalk.cyan(s)}`);
  console.log();
}

// ── 主流程 ────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} CreateOptions
 * @property {string}  [configPath] - 配置文件路径（--config）
 * @property {string}  [select]     - 预设选项（--select）
 * @property {boolean} [force]      - 覆盖已存在目录（--force）
 * @property {boolean} [yes]        - 跳过所有确认（--yes）
 */

/**
 * CLI 主流程：询问 → 确认 → 克隆 → 应用模板 → 后处理操作
 * @param {string | undefined} nameArg
 * @param {CreateOptions}      opts
 * @returns {Promise<void>}
 */
async function handleCreate(nameArg, opts) {
  logger.banner('create-app-elysia', `v${pkg.version}  ·  ElysiaJS 项目脚手架`);

  // Step 0 — 同步远程模板
  await syncRemoteTemplates();

  // Step 1 — 初始化运行时选项
  const templateDirs = await getTemplateDirs();
  const { validSelections, selectionChoices, nextSteps } = buildRuntimeOptions(templateDirs);

  // Step 2 — 加载用户配置文件
  const fileConfig = opts.configPath
    ? await config.loadConfigFile(opts.configPath)
    : await config.loadConfig();

  // Step 3 — 收集用户输入
  const projectName = await askProjectName(nameArg);
  const selection   = await askSelection(opts.select, validSelections, selectionChoices);
  const projectDir  = path.resolve(process.cwd(), projectName);

  // Step 4 — 目录冲突处理
  await handleDirConflict(projectDir, projectName, opts);

  // Step 5 — 最终确认
  if (!opts.yes) {
    const ok = await confirm({ message: '确认创建？', default: true });
    if (!ok) { logger.info('已取消。'); process.exit(0); }
  }

  console.log();

  // Step 6 — 拉取项目模板
  const repo = fileConfig.template ?? APP_CONFIG.defaultRepo;
  try {
    await git.cloneRepo({ repo, dest: projectDir, branch: APP_CONFIG.git.mainBranch });
  } catch (err) {
    await fsu.removeDir(projectDir);
    logger.error('克隆失败，已清理目标目录', err);
  }

  // Step 7 — 应用本地模板覆盖文件
  await fsu.applyTemplates(selection, [], projectDir, TEMPLATE_DIR);

  // Step 8 — 后处理操作
  await runOperations(['updateName'], { projectDir, projectName, selection });

  // Step 9 — 完成提示 & 清理临时模板
  printNextSteps(projectName, nextSteps[selection] ?? APP_CONFIG.defaultNextSteps);
  await fs.emptyDir(TEMPLATE_DIR);
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
  .option('-c, --config <path>', '指定配置文件路径')
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