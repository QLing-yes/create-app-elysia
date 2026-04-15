import type { Preferences } from "../../utils";

/**
 * 生成 Elysia 服务器文件 (src/server.ts)
 * 配置 Elysia 框架和各种插件
 */
export function getElysiaIndex({
  orm,
  driver,
  plugins,
  telegramRelated,
  isMonorepo,
}: Preferences): string {
  const elysiaPlugins: string[] = [];
  const elysiaImports: string[] = [
    `import { Elysia } from "elysia"`,
    `import { config } from "./config.ts"`,
  ];

  // 根据用户选择的插件添加相应的导入和配置
  if (plugins.includes("Logger")) {
    elysiaImports.push(`import { logger } from "@bogeychan/elysia-logger"`);
    elysiaPlugins.push(".use(logger())");
  }

  if (plugins.includes("Swagger")) {
    elysiaImports.push(`import { swagger } from "@elysiajs/swagger"`);
    elysiaPlugins.push(".use(swagger())");
  }
  if (plugins.includes("Oauth 2.0")) {
    elysiaImports.push(`import { oauth2 } from "elysia-oauth2"`);
    elysiaPlugins.push(".use(oauth2({}))");
  }
  if (plugins.includes("Bearer")) {
    elysiaImports.push(`import { bearer } from "@elysiajs/bearer"`);
    elysiaPlugins.push(".use(bearer())");
  }
  if (plugins.includes("CORS")) {
    elysiaImports.push(`import { cors } from "@elysiajs/cors"`);
    elysiaPlugins.push(".use(cors())");
  }
  if (plugins.includes("HTML/JSX")) {
    elysiaImports.push(`import { html } from "@elysiajs/html"`);
    elysiaPlugins.push(".use(html())");
  }
  if (plugins.includes("JWT")) {
    elysiaImports.push(`import { jwt } from "@elysiajs/jwt"`);
    elysiaPlugins.push(".use(jwt({ secret: config.JWT_SECRET }))");
  }
  if (plugins.includes("Server Timing")) {
    elysiaImports.push(
      `import { serverTiming } from "@elysiajs/server-timing"`
    );
    elysiaPlugins.push(".use(serverTiming())");
  }
  if (plugins.includes("Static")) {
    elysiaImports.push(`import { staticPlugin } from "@elysiajs/static"`);
    elysiaPlugins.push(".use(staticPlugin())");
  }
  if (plugins.includes("Autoload")) {
    elysiaImports.push(`import { autoload } from "elysia-autoload"`);
    elysiaPlugins.push(".use(autoload())");
  }

  // 添加默认路由
  elysiaPlugins.push(`.get("/", "Hello World")`);

  // 如果与 Telegram 相关，添加 webhook 路由
  if (telegramRelated && !isMonorepo) {
    elysiaImports.push(`import { bot } from "./bot.ts"`);
    elysiaImports.push(`import { webhookHandler } from "./services/auth.ts"`);
    elysiaPlugins.push(
      `.post(\`/\${config.BOT_TOKEN}\`, webhookHandler(bot, "elysia"), {
        detail: {
          hide: true,
        },
      })`
    );
  }

  // 组合生成服务器文件
  return [
    ...elysiaImports,
    "",
    "export const app = new Elysia()",
    ...elysiaPlugins,
    plugins.includes("Autoload") ? "\nexport type ElysiaApp = typeof app" : "",
  ].join("\n");
}
