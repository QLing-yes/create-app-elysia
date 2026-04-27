# create-elysiajs

<div align="center">

[![npm](https://img.shields.io/npm/v/create-elysiajs?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/create-elysiajs)
[![npm downloads](https://img.shields.io/npm/dw/create-elysiajs?logo=npm&style=flat&labelColor=000&color=3b82f6)](https://www.npmjs.org/package/create-elysiajs)

</div>

快速搭建 [Elysia](https://elysiajs.com/) 项目的脚手架工具，支持独立项目和 Monorepo 两种模式。

## 快速开始

```bash
# 使用 bun
bun create elysiajs <项目名>

# 或直接使用
bun create-app-elysia <项目名>
```

## 项目架构

本项目基于 **体用（Ti-Yong）** 架构设计：

```
src/
├── index.ts           # 轻量入口路由
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
│   ├── standalone/    #   独立项目流程 + 完整交互漏斗
│   └── monorepo/      #   Monorepo 流程 + 特有模板
│
├── prompts/           # 通用交互（Monorepo 检测）
└── utils/             # 工具函数
```

### 体用解耦原则

- **体（ti）**：不关心项目模式（独立/Monorepo），只接收配置生成文件
- **用（yong）**：根据模式编排体的调用，组装配置
- **体不调用用**：模板内部无 `isMonorepo` 判断
- **用编排体**：用层决定调用哪些体函数

## 如何开发自己的脚手架

这个项目的架构设计让你可以轻松定制和扩展：

### 添加新的体（模板能力）

1. 在 `src/ti/` 下创建新的模块文件
2. 实现纯函数，接收 `Preferences` 配置，返回文件内容字符串
3. 在 `src/ti/index.ts` 中导出

```typescript
// src/ti/my-service.ts
import type { Preferences } from "../utils";

export function getMyServiceFile({ myOption }: Preferences): string {
  if (!myOption) return "";
  return `// 生成的文件内容`;
}
```

### 添加新的用（模式编排）

1. 在 `src/yong/` 下创建新的模式目录
2. 实现编排函数，调用体层生成文件
3. 在 `src/yong/index.ts` 中导出
4. 在 `src/index.ts` 中添加路由逻辑

```typescript
// src/yong/my-mode/index.ts
import * as ti from "../../ti";

export async function createMyMode(dir: string) {
  // 1. 交互收集配置
  // 2. 组装 Preferences
  // 3. 调用 ti.* 生成文件
  await ti.writeFile("package.json", ti.getPackageJson(prefs));
  // 4. 安装依赖
}
```

### 修改交互流程

独立项目的完整漏斗在 `src/yong/standalone/prompts.ts` 中，你可以：
- 增删问题（添加/移除 prompt 调用）
- 修改问题文案（message 字段）
- 调整选项（choices 数组）
- 根据选择跳过/添加后续问题

### 修改生成的文件内容

每个体模块对应一个生成的文件，你可以直接修改模板内容：
- `src/ti/core/package-json.ts` → `package.json`
- `src/ti/source/server.ts` → `src/server.ts`
- `src/ti/services/redis.ts` → `src/services/redis.ts`

### 依赖版本管理

所有依赖版本集中在 `src/ti/dependency.ts`，添加新依赖时在此文件中声明版本号。

## 本地开发

```bash
# 进入包目录
cd packages/create-app-elysia

# 类型检查
bun run type-check

# 本地测试（会生成 my-elysia-app 目录）
bun run dev

# 构建
bun run build

# 运行构建产物
bun run start my-test-app
```

## 技术栈

- **运行时**: Bun
- **打包**: bun build（内建）
- **交互**: enquirer-esm
- **进度显示**: tasuku
- **模板**: ts-dedent（标签模板字面量）
