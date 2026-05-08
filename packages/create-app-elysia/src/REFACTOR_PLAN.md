# 📦 项目重构计划 - 分层架构 + 漏斗式交互

## ✅ 已完成的工作

### 1. 创建新的分层目录结构

已创建以下新文件和目录：

```
src/
├── types.ts                          ✅ 全局类型定义
├── REFACTOR_PLAN.md                  ✅ 重构计划文档
│
├── utils/                            ✅ 第一层：工具层
│   ├── index.ts                      ✅ 统一导出
│   ├── fs.ts                         ✅ 文件操作工具
│   ├── package-manager.ts            ✅ 包管理器工具
│   ├── logger.ts                     ✅ 日志工具
│   └── preferences.ts                ✅ 用户偏好配置类
│
├── prompts/                          ✅ 第二层：交互层
│   ├── index.ts                      ✅ 统一导出
│   ├── 01-project-type.ts            ✅ 项目类型选择
│   ├── 02-database.ts                ✅ 数据库配置
│   ├── 03-plugins.ts                 ✅ Elysia 插件选择
│   ├── 04-integrations.ts            ✅ 集成工具选择
│   └── 05-dev-tools.ts               ✅ 开发工具选择
│
└── templates/                        ✅ 第三层：模板层
    ├── index.ts                      ✅ 统一导出（已更新）
    ├── base/                         ✅ 基础配置目录
    ├── core/                         ✅ 核心代码目录
    ├── db/                           ✅ 数据库目录
    ├── dev/                          ✅ 开发工具目录
    ├── services/                     ✅ 服务层目录（已有）
    └── tests/                        ✅ 测试目录（已有）
```

### 2. 设计决策

#### 漏斗式交互顺序

```
1. 项目类型 (Monorepo vs Standalone)
   ↓
2. 数据库配置 (ORM + 数据库类型) - Monorepo 跳过
   ↓
3. Elysia 插件选择
   ↓
4. 集成工具选择 (Redis, S3, Posthog 等) - Monorepo 精简
   ↓
5. 开发工具选择 (ESLint, Docker, VSCode 等) - Monorepo 精简
   ↓
6. ⚠️ 格式化提示 - 用户手动执行
```

#### Monorepo vs Standalone 差异化

| 配置项 | Standalone | Monorepo |
|--------|------------|----------|
| ORM | 完整选择 | 跳过（由根目录管理） |
| 数据库 | 完整选择 | 跳过 |
| Elysia 插件 | 完整选择 | 完整选择 |
| 集成工具 | 完整选择 | 仅 Telegram |
| 开发工具 | 完整选择 | 跳过 |
| Docker | 可选 | 跳过 |
| ESLint | 可选 | 跳过 |

#### 格式化工具处理

根据用户反馈，**格式化工具不包含在自动生成流程中**，而是：
- 生成项目后提示用户手动执行
- 支持 ultracite、biome、prettier 等工具
- 避免与现有工具链冲突

---

## 📋 待完成的工作

### Phase 1: 完成 templates 层重组 (优先级：高)

将现有模板文件移动到新目录：

```bash
# base/
src/templates/package.json.ts    → src/templates/base/package-json.ts (✅ 已创建)
src/templates/tsconfig.json.ts   → src/templates/base/tsconfig.ts
src/templates/readme.md.ts       → src/templates/base/readme.ts
src/templates/env.ts             → src/templates/base/gitignore.ts (新增)

# core/
src/templates/elysia.ts          → src/templates/core/server.ts
src/templates/index.ts           → src/templates/core/index.ts
src/templates/env.ts             → src/templates/core/config.ts

# db/
src/templates/db.ts              → src/templates/db/index.ts
# Drizzle 配置保留在 db/ 目录

# dev/
src/templates/eslint.ts          → src/templates/dev/eslint.ts
src/templates/docker.ts          → src/templates/dev/docker.ts
src/templates/vscode.ts          → src/templates/dev/vscode.ts
```

### Phase 2: 重构 index.ts 主控层 (优先级：高)

新的 index.ts 应该：

```typescript
#!/usr/bin/env node
import {
  createOrFindDir,
  writeFile,
  detectPackageManager,
  Preferences,
  info,
  success,
  error,
  title,
  divider,
} from "./utils";
import {
  askProjectType,
  askDatabase,
  askPlugins,
  askIntegrations,
  askDevTools,
} from "./prompts";
import {
  getPackageJson,
  getTSConfig,
  getElysiaIndex,
  // ... 其他生成函数
} from "./templates";

async function main() {
  // 1. 解析命令行参数
  const args = minimist(process.argv.slice(2));
  const dir = args._.at(0);
  
  // 2. 检测包管理器
  const packageManager = args.pm || detectPackageManager();
  
  // 3. 创建项目目录
  const projectDir = resolvePath(dir);
  await createOrFindDir(projectDir);
  
  // 4. 漏斗式交互收集偏好
  title("🚀 Create Elysia App");
  
  const { isMonorepo } = await askProjectType();
  const runtime: "Bun" | "Node.js" = packageManager === "bun" ? "Bun" : "Node.js";
  
  const dbConfig = await askDatabase(isMonorepo, runtime);
  const { plugins } = await askPlugins();
  const integrations = await askIntegrations(isMonorepo);
  const devTools = await askDevTools(isMonorepo, integrations.others.includes("Husky"));
  
  // 5. 组装 Preferences 对象
  const preferences = new Preferences();
  preferences.isMonorepo = isMonorepo;
  preferences.orm = dbConfig.orm;
  preferences.database = dbConfig.database || "PostgreSQL";
  preferences.driver = dbConfig.driver || "None";
  preferences.mockWithPGLite = dbConfig.mockWithPGLite || false;
  preferences.plugins = plugins;
  preferences.others = integrations.others;
  preferences.s3Client = integrations.s3Client || "None";
  preferences.redis = integrations.redis;
  preferences.locks = integrations.locks;
  preferences.telegramRelated = integrations.telegramRelated;
  preferences.linter = devTools.linter;
  preferences.docker = devTools.docker;
  preferences.vscode = devTools.vscode;
  preferences.git = devTools.git;
  preferences.packageManager = packageManager;
  preferences.runtime = runtime;
  
  // 6. 生成基础文件（总是生成）
  info("Generating base files...");
  await writeFile(
    joinPath(projectDir, "package.json"),
    getPackageJson(preferences)
  );
  await writeFile(
    joinPath(projectDir, "tsconfig.json"),
    getTSConfig(preferences)
  );
  // ...
  
  // 7. 条件生成文件
  if (preferences.linter === "ESLint") {
    // ...
  }
  
  // 8. 安装依赖
  if (!preferences.noInstall) {
    info("Installing dependencies...");
    // ...
  }
  
  // 9. 完成提示
  success("Project created successfully!");
  divider();
  printFormatHint(packageManager);
}

main().catch(console.error);
```

### Phase 3: 测试与验证 (优先级：中)

- [ ] 测试 Standalone 模式
- [ ] 测试 Monorepo 模式
- [ ] 测试所有数据库选项
- [ ] 测试所有插件组合
- [ ] 测试错误处理

### Phase 4: 文档更新 (优先级：低)

- [ ] 更新 README.md
- [ ] 添加代码注释（已完成大部分）
- [ ] 添加 CONTRIBUTING.md

---

## 🎯 预期收益

1. **代码可读性** - 新成员能快速理解项目结构
2. **易于维护** - 每个模块职责清晰
3. **易于扩展** - 添加新功能只需在对应层添加文件
4. **用户体验** - 漏斗式交互更符合直觉
5. **灵活性** - Monorepo 和 Standalone 差异化处理

---

## 📝 注意事项

1. **向后兼容** - 保持现有生成函数的接口不变
2. **类型安全** - 所有类型定义在 `types.ts` 中统一管理
3. **错误处理** - 在 index.ts 顶层统一处理
4. **日志输出** - 使用新的 logger 工具提供友好提示
