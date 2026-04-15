/**
 * Prompts 层统一导出
 * 第二层：用户交互层
 * 
 * 交互顺序（漏斗式）：
 * 1. 项目类型 (Monorepo vs Standalone)
 * 2. 数据库配置 (ORM + 数据库类型)
 * 3. Elysia 插件选择
 * 4. 集成工具选择 (Redis, S3, Posthog 等)
 * 5. 开发工具选择 (ESLint, Docker, VSCode 等)
 */

export { askProjectType } from "./01-project-type";
export { askDatabase } from "./02-database";
export { askPlugins } from "./03-plugins";
export { askIntegrations } from "./04-integrations";
export { askDevTools, printFormatHint } from "./05-dev-tools";
