# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`create-app-elysia` is a CLI scaffolding tool for bootstrapping ElysiaJS projects with interactive prompts. It's published as an npm package (`create-elysiajs`) and follows a 体用 (Ti-Yong) architecture.

## 创建添加cli的时候，要一个模板的加，不要一次添加两种模板，这样会里不清楚

### Architecture

```
src/
├── index.ts           # 轻量入口路由
├── types.ts           # 全局共享类型定义
│
├── ti/                # ═══ 体：项目生成核心能力 ═══
│   ├── dependency.ts  #   依赖版本集中管理
│   ├── install.ts     #   依赖安装逻辑
│   ├── core/          #   package.json, tsconfig, gitignore, readme
│   ├── source/        #   server.ts, index.ts, config.ts, env.ts
│   ├── db/            #   数据库模板 (Drizzle/Prisma)
│   ├── services/      #   服务层 (Auth, Redis, S3, Posthog, Jobify, Locks)
│   ├── dev-tools/     #   开发工具 (ESLint, Docker, VSCode)
│   ├── tests/         #   测试相关模板
│   └── bot.ts         #   Telegram Bot 模板
│
├── yong/              # ═══ 用：模式编排 ═══
│   ├── index.ts       #   路由导出
│   ├── standalone/    #   独立项目流程 + 完整交互漏斗
│   └── monorepo/      #   Monorepo 流程 + 特有模板
│
├── prompts/           # 通用交互（Monorepo 检测）
└── utils/             # 工具函数
```

### Key Design Decisions

- **体用解耦**: 体（ti）不关心项目模式，只接收配置生成文件；用（yong）根据模式编排体的调用
- **体不调用用**: 模板内部无 `isMonorepo` 判断
- **漏斗式交互**: 独立项目在 `yong/standalone/prompts.ts` 中按"ORM → 数据库 → 驱动 → 插件 → 集成 → 开发工具"顺序递减
- **Monorepo 包含 Standalone**: 创建 Monorepo 时内部 app 复用 standalone 逻辑
- **依赖管理**: `ti/dependency.ts` 是依赖版本的单一来源
- **格式化工具手动执行**: 生成项目后提示用户手动执行 (ultracite/biome/prettier)

## Commands

```bash
# 类型检查
bun run type-check

# 本地测试
bun run dev

# 构建
bun run build

# 运行构建产物
bun run dist/index.js <项目名>
```

## Package Manager

- 本项目使用 Bun workspace
- 构建使用 `bun build`（内建，非 pkgroll）
- 运行时依赖: enquirer-esm, tasuku, ts-dedent, minimist
