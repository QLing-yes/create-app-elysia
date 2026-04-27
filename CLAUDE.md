# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`create-app-elysia` is a CLI scaffolding tool for bootstrapping ElysiaJS projects with interactive prompts. It's published as an npm package (`create-elysiajs`) and follows a four-layer architecture:

### Architecture (from high-level to low-level)

```
src/
├── index.ts           # Layer 4: 执行主控层 - 串联所有流程
├── types.ts           # 全局共享类型定义
├── deps.ts            # 依赖版本号集中管理（已废弃，改用 dependency/ 虚拟包）
│
├── utils/             # Layer 1: 工具层
│   ├── fs.ts                  文件操作 (createOrFindDir, writeFile 等)
│   ├── logger.ts              日志输出 (info, success, warn, error 等)
│   ├── package-manager.ts     包管理器检测与命令映射
│   ├── preferences.ts         用户偏好配置类 (核心数据模型)
│   └── monorepo-detector.ts   Monorepo 环境检测
│
├── prompts/           # Layer 2: 用户交互层 (漏斗式)
│   ├── 00-monorepo-detect.ts  Monorepo 上下文处理
│   ├── 01-project-type.ts     项目类型 (Monorepo vs Standalone)
│   ├── 02-database.ts         数据库配置 (ORM + 数据库类型)
│   ├── 03-plugins.ts          Elysia 插件选择
│   ├── 04-integrations.ts     集成工具 (Redis, S3, Posthog 等)
│   └── 05-dev-tools.ts        开发工具 (ESLint, Docker, VSCode 等)
│
└── templates/         # Layer 3: 模板生成层
    ├── base/          package.json, tsconfig.json, .gitignore, README
    ├── core/          server.ts, index.ts, config.ts
    ├── db/            数据库 (Drizzle/Prisma)
    ├── dev/           开发工具 (ESLint, Docker, VSCode)
    ├── services/      服务层 (Redis, S3, Posthog, Jobify, Locks, Auth)
    ├── tests/         测试相关
    ├── monorepo/      Monorepo 根目录模板 (turbo.json, 共享配置)
    └── monorepo-app/  在 Monorepo 中创建新 app 的模板
```

### Key Design Decisions

- **漏斗式交互**: 按"项目类型 → 数据库 → 插件 → 集成 → 开发工具"顺序递减，前期选择影响后续选项范围
- **Monorepo vs Standalone 差异化**: Monorepo 模式下数据库、开发工具等问题被跳过或精简
- **格式化工具手动执行**: 生成项目后提示用户手动执行 (ultracite/biome/prettier)，不包含在自动流程中
- **依赖管理**: 使用 `packages/dependency/package.json` 作为依赖版本的集中来源（vscode 集成），`src/deps.ts` 已废弃
- **每个 prompt 独立文件编号**: 00- 开头的是 monorepo 检测，01-05 是核心交互流程

## Commands

```bash
# 开发（本地运行 cli 生成项目）
bun run dev

# 构建（使用 pkgroll 打包）
bun run build

# 类型检查
bun run type-check
```

## Package Manager

- 本项目使用 Bun workspace
- 依赖版本集中管理在 `packages/dependency/package.json`（这是为了 vscode 插件能自动更新依赖）
- 工具库打包永远使用 `pkgroll`

## Dependencies Map

`packages/dependency/package.json` 中包含所有可选的运行时依赖及其版本，由 `src/templates/base/package-json.ts` 中的 `dependencies` 对象引用。这是依赖版本管理的核心机制。
