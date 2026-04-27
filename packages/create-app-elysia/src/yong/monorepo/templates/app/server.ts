/**
 * 用 Monorepo - 内部 App server.ts 模板
 */

export function getMonorepoAppServer(appName: string): string {
	return `import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "${appName} API",
          version: "1.0.0",
        },
      },
    })
  )
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
  \`🦊 ${appName} is running at \${app.server?.hostname}:\${app.server?.port}\`
);
`;
}
