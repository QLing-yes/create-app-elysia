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

## 项目架构：体用（Ti-Yong）

本项目采用三层架构，将**提问**、**编排**、**生成**彻底解耦：

```
src/
├── index.ts                  # 入口：检测环境 → 路由到对应的「用」
│
├── prompts/                  # ═══ 第一层：共享提问 ═══
│   ├── 00-monorepo-detect.ts #   步骤0: 检测/选择创建位置
│   ├── 01-orm-database.ts    #   步骤1: ORM → 数据库 → 驱动 → PGLite
│   ├── 02-plugins.ts         #   步骤2: Elysia 插件多选
│   ├── 03-integrations.ts    #   步骤3: 集成工具 (Telegram/S3/Posthog/Jobify/Redis/Locks)
│   ├── 04-dev-tools.ts       #   步骤4: 开发工具 (Docker/VSCode/Git/Husky)
│   └── 05-formatter.ts       #   步骤5: 格式化工具 (ultracite/Biome/ESLint)
│
├── ti/                       # ═══ 第二层：共享体 — 文件生成函数 ═══
│   ├── core/                 #   package.json, tsconfig, .gitignore, README
│   ├── source/               #   server.ts, index.ts, config.ts, .env
│   ├── db/                   #   Drizzle 配置, schema 骨架
│   ├── services/             #   Redis, S3, Locks, Posthog, Jobify, Auth
│   ├── dev-tools/            #   ESLint, Docker, VSCode
│   ├── tests/                #   测试模板
│   ├── bot.ts                #   Telegram Bot
│   ├── install.ts            #   安装命令生成
│   └── dependency.ts         #   依赖版本唯一来源
│
└── yong/                     # ═══ 第三层：用 — 模板编排 ═══
    ├── standalone/
    │   └── index.ts          #   调共享 prompts → 组装 Preferences → 调共享 ti
    └── monorepo/
        ├── index.ts          #   编排（精简版 prompts + 私有模板 + 共享 ti）
        └── templates/        #   私有体：不被 standalone 共享（turbo, contract 等）
```

### 三层职责

| 层 | 职责 | 不可做什么 |
|---|---|---|
| **prompts/** | 向用户提问，返回答案 | 不生成文件 |
| **ti/** | 接收 `Preferences`，返回文件内容字符串 | 不提问、不关心项目模式 |
| **yong/** | 调 prompts 收集配置 → 组装 Preferences → 调 ti 生成文件 → 安装依赖 | — |

### 核心数据结构：Preferences

`Preferences`（`src/utils/preferences.ts`）是三层之间传递配置的唯一载体：

```typescript
class Preferences {
  projectName: string;          // 项目名
  packageManager: "bun";       // 包管理器
  runtime: "Bun" | "Node.js";  // 运行时
  orm: "Prisma" | "Drizzle" | "None";
  database: "PostgreSQL" | "MySQL" | "SQLite" | ...;
  driver: "Bun.sql" | "node-postgres" | ...;
  mockWithPGLite: boolean;
  plugins: ElysiaPlugin[];     // CORS, Swagger, JWT, ...
  others: IntegrationTool[];   // S3, Posthog, Jobify
  s3Client: "Bun.S3Client" | "@aws-sdk/client-s3" | "None";
  redis: boolean;
  locks: boolean;
  telegramRelated: boolean;
  docker: boolean;
  vscode: boolean;
  git: boolean;
  husky: boolean;
  formatter: "ultracite" | "biome" | "eslint" | "none";
  noInstall: boolean;
}
```

---

## 如何创建自己的模板

下面以「新建一个 `minimal` 模板」为例，逐步演示如何利用三层架构完成。

### 第 1 步：创建用（模板编排）

在 `src/yong/` 下新建目录，入口文件遵循固定模式：**提问 → 组装 → 生成**。

```typescript
// src/yong/minimal/index.ts
import path from "node:path";
import {
  Preferences,
  createOrFindDir, writeFile, resolvePath, joinPath,
  success, title, divider, step,
} from "../../utils";
import * as ti from "../../ti";
// 从共享提问层引入需要的 prompt
import { askDatabase, askPlugins, askFormatter } from "../../prompts";

export async function createMinimal(dir: string, packageManager: string, args: Record<string, unknown>) {
  const projectDir = resolvePath(dir);
  const projectName = path.basename(projectDir);
  const runtime = packageManager === "bun" ? "Bun" : "Node.js";

  // ═══════════════════════════════════════════
  // 阶段一：漏斗式提问
  // ═══════════════════════════════════════════
  const dbConfig = await askDatabase(false, runtime);   // 共享 prompt
  const { plugins } = await askPlugins();                // 共享 prompt
  const { formatter } = await askFormatter(false);       // 共享 prompt

  // ═══════════════════════════════════════════
  // 阶段二：组装 Preferences
  // ═══════════════════════════════════════════
  const prefs = new Preferences();
  prefs.dir = dir;
  prefs.projectName = projectName;
  prefs.packageManager = packageManager as "bun";
  prefs.runtime = runtime;
  prefs.orm = dbConfig.orm;
  prefs.database = dbConfig.database ?? "PostgreSQL";
  prefs.driver = dbConfig.driver ?? "None";
  prefs.mockWithPGLite = dbConfig.mockWithPGLite ?? false;
  prefs.plugins = plugins ?? [];
  prefs.formatter = formatter;

  // ═══════════════════════════════════════════
  // 阶段三：调用共享体生成文件
  // ═══════════════════════════════════════════
  await createOrFindDir(projectDir);
  await writeFile(joinPath(projectDir, "package.json"), ti.getPackageJson(prefs));
  await writeFile(joinPath(projectDir, "tsconfig.json"), ti.getTSConfig(prefs));
  await writeFile(joinPath(projectDir, ".gitignore"), ti.getGitIgnore());
  await writeFile(joinPath(projectDir, "README.md"), ti.getReadme(prefs));

  // 可选：生成自己的私有模板（此模板不被其他模式共享）
  await writeFile(joinPath(projectDir, "HELLO.md"), "# Minimal Template\n\nHello!");

  // ═══════════════════════════════════════════
  // 阶段四：安装依赖 + 完成提示
  // ═══════════════════════════════════════════
  if (prefs.formatter === "ultracite") {
    console.log("💡 运行 npx ultracite init 初始化格式化");
  }

  success(`🎉 项目 ${projectName} 创建成功！`);
}
```

### 第 2 步：注册导出

```typescript
// src/yong/index.ts
export { createStandalone } from "./standalone/index";
export { createNewMonorepo, addAppToMonorepo } from "./monorepo/index";
export { createMinimal } from "./minimal/index";   // ← 新增
```

### 第 3 步：添加入口路由

```typescript
// src/index.ts
import { createMinimal } from "./yong";

// 在 main() 中添加路由分支，例如通过 --minimal 参数：
if (args.minimal) {
  await createMinimal(dir, packageManager, args);
  return;
}
```

---

## 如何添加新的提问（prompt）

如果共享提问不够用，可以在 `src/prompts/` 下新增文件：

```typescript
// src/prompts/06-my-feature.ts
import enquirer from "enquirer-esm";
const { prompt } = enquirer;

export async function askMyFeature(): Promise<{ myOption: boolean }> {
  const { myOption } = await prompt<{ myOption: boolean }>({
    type: "toggle",
    name: "myOption",
    message: "是否启用我的功能？",
    initial: false,
  });
  return { myOption };
}
```

然后在 `src/prompts/index.ts` 中导出：

```typescript
export { askMyFeature } from "./06-my-feature";
```

**提问漏斗的设计原则：**

1. **依赖排序** — 有依赖关系的问题必须按序排列（如：ORM 选了 Drizzle 才问数据库类型，选了 PG 才问 PGLite）
2. **isMonorepo 参数** — 每个 prompt 接受 `isMonorepo: boolean`，在 monorepo 下自动精简
3. **放最后** — 格式化工具这类独立选项永远在漏斗末尾

### 如何在已有提问中插入条件分支

```typescript
// 我的 prompt 只在选择了 Drizzle + PostgreSQL 时才出现
const dbConfig = await askDatabase(false, "Bun");
if (dbConfig.orm === "Drizzle" && dbConfig.database === "PostgreSQL") {
  const { myPgOption } = await askMyPostgresFeature();
}
```

---

## 如何添加新的体（共享生成函数）

在 `src/ti/` 下新建文件，遵循纯函数模式：

```typescript
// src/ti/services/my-service.ts
import type { Preferences } from "../../utils";

export function getMyServiceFile(prefs: Preferences): string {
  // 根据配置决定是否生成
  if (!prefs.redis) return "";

  return `// 此文件由 create-elysiajs 生成
import { redis } from "./redis";

export async function myService() {
  await redis.connect();
  // ...
}
`;
}
```

在 `src/ti/index.ts` 中导出后，任何「用」都可以调用它。

### 如果模板需要专用体（不被其他模式共享）

放在 `src/yong/<模板名>/templates/` 下，这是该模板的私有目录：

```
src/yong/minimal/
├── index.ts          # 编排逻辑
└── templates/
    └── server.ts     # 只给 minimal 用的 server 模板
```

---

## 新增 Preferences 字段

当你添加新功能需要配置开关时：

1. 在 `src/utils/preferences.ts` 的 `Preferences` 类加字段
2. 在 `src/types.ts` 的 `PartialPreferences` 接口加可选字段
3. 新的 ti 函数从 `Preferences` 中解构该字段

```typescript
// 1. preferences.ts
class Preferences {
  // ...
  myFeature = false;   // ← 默认值
}

// 2. types.ts
interface PartialPreferences {
  // ...
  myFeature?: boolean;
}
```

---

## 完整的三层协作流程

```
用户执行：bun create elysiajs my-app

index.ts (入口路由)
  │
  ├─ detectMonorepo()
  │   ├─ 是 monorepo → addAppToMonorepo()
  │   └─ 否 → askProjectType()
  │           ├─ standalone → createStandalone()
  │           └─ monorepo → createNewMonorepo()
  │
  └─ createStandalone() 为例：
       │
       ├─ 1. 调 prompts/01-orm-database.ts  → askDatabase(false, "Bun")
       ├─ 2. 调 prompts/02-plugins.ts       → askPlugins()
       ├─ 3. 调 prompts/03-integrations.ts  → askIntegrations(false)
       ├─ 4. 调 prompts/04-dev-tools.ts     → askDevTools(false)
       ├─ 5. 调 prompts/05-formatter.ts     → askFormatter(false)
       │
       ├─ 6. 组装 new Preferences()  ← 汇总上述答案
       │
       ├─ 7. 调 ti 层生成文件:
       │      ti.getPackageJson(prefs)
       │      ti.getTSConfig(prefs)
       │      ti.getElysiaIndex(prefs)
       │      ti.getDBIndex(prefs)         ← orm !== "None" 才调
       │      ti.getRedisFile()            ← redis === true 才调
       │      ti.getDockerfile(prefs)      ← docker === true 才调
       │      ...
       │
       ├─ 8. 安装依赖 (bun install)
       └─ 9. 输出提示 (格式化命令、插件安装命令)
```

### 关键原则

- **prompts 不问体** — 提问函数不知道文件会怎么生成
- **ti 不提问** — 体函数只接收配置，返回字符串，不做交互
- **yong 不生成** — 用不写文件内容，只做编排
- **私有体放 yong/templates** — 不被其他模板共享的生成函数放在模板自己的目录下
- **依赖版本集中在 ti/dependency.ts** — 所有版本号统一管理

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
