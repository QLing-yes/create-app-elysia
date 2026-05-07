/**
 * 用 Monorepo - 内部 App server.ts 模板
 */

import type { PreferencesType } from "../../../../utils";

export function getMonorepoAppServer(appName: string, prefs?: PreferencesType): string {
  const plugins = prefs?.plugins ?? [];
  const telegramRelated = prefs?.telegramRelated ?? false;

  const imports: string[] = ['import { Elysia } from "elysia";'];
  const uses: string[] = [];

  if (plugins.includes("CORS")) {
    imports.push('import { cors } from "@elysiajs/cors";');
    uses.push("  .use(cors())");
  }
  if (plugins.includes("Swagger")) {
    imports.push('import { swagger } from "@elysiajs/swagger";');
    uses.push(`  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "${appName} API",
          version: "1.0.0",
        },
      },
    })
  )`);
  }
  if (plugins.includes("JWT")) {
    imports.push('import { jwt } from "@elysiajs/jwt";');
    uses.push("  .use(jwt({ secret: process.env.JWT_SECRET ?? '' }))");
  }
  if (plugins.includes("Autoload")) {
    imports.push('import { autoload } from "@elysiajs/autoload";');
    uses.push("  .use(autoload())");
  }
  if (plugins.includes("Oauth 2.0")) {
    imports.push('import { oauth2 } from "@elysiajs/oauth2";');
    uses.push("  .use(oauth2())");
  }
  if (plugins.includes("HTML/JSX")) {
    imports.push('import { html } from "@elysiajs/html";');
    uses.push("  .use(html())");
  }
  if (plugins.includes("Static")) {
    imports.push('import { staticPlugin } from "@elysiajs/static";');
    uses.push("  .use(staticPlugin())");
  }
  if (plugins.includes("Bearer")) {
    imports.push('import { bearer } from "@elysiajs/bearer";');
    uses.push("  .use(bearer())");
  }
  if (plugins.includes("Server Timing")) {
    imports.push('import { serverTiming } from "@elysiajs/server-timing";');
    uses.push("  .use(serverTiming())");
  }
  if (telegramRelated) {
    imports.push('import { authPlugin } from "./services/auth.plugin";');
    uses.push("  .use(authPlugin)");
  }

  return `${imports.join("\n")}

const app = new Elysia()${uses.join("\n")}
  .get("/", () => {
    return {
      message: "Welcome to ${appName}!",
      timestamp: new Date().toISOString(),
    };
  })
  .get("/health", () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  })
  .listen(3000);

console.log(
  \`🦊 \${appName} is running at \${app.server?.hostname}:\${app.server?.port}\`
);
`;
}
