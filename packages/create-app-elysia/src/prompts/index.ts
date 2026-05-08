/**
 * Prompts 层统一导出
 *
 * 交互顺序（漏斗式）：
 * 0. Monorepo 检测和处理
 * 1. ORM → 数据库 → 驱动 → PGLite
 * 2. Elysia 插件
 * 3. 集成工具 (Telegram, S3, Posthog, Jobify, Redis, Locks)
 * 4. 开发工具 (Docker, VSCode, Git, Husky)
 * 5. 格式化工具 (ultracite/Biome/ESLint)
 */

export {
  askMonorepoLocation,
  askMonorepoName,
  askProjectType,
  type MonorepoLocationResult,
} from "./00-monorepo-detect";

export { askDatabase, type DatabaseResult } from "./01-orm-database";
export { askPlugins, type PluginsResult } from "./02-plugins";
export { askIntegrations, type IntegrationsResult } from "./03-integrations";
export { askDevTools, type DevToolsResult } from "./04-dev-tools";
export { askFormatter, type FormatterResult } from "./05-formatter";
export { askDDFeatures, type DDFeaturesResult } from "./06-dd-features";
