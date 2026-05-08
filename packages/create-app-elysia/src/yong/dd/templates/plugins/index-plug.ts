import { dedent } from "ts-dedent";
import type { PreferencesType } from "../../../../types";

export function getIndexPlug(prefs: PreferencesType): string {
  const plugins = prefs.plugins;
  const imports: string[] = [];
  const uses: string[] = [];

  // Always include openapi and static
  imports.push('import { openapi } from "@elysia/openapi";');
  uses.push(".use(openapi())");

  imports.push('import { staticPlugin } from "@elysia/static";');
  uses.push(".use(staticPlugin())");

  // Optional plugins
  if (plugins.includes("CORS")) {
    imports.push('import { cors } from "@elysiajs/cors";');
    uses.push(".use(cors())");
  }
  if (plugins.includes("Swagger")) {
    imports.push('import { swagger } from "@elysiajs/swagger";');
    uses.push('.use(swagger({ path: "/swagger" }))');
  }
  if (plugins.includes("JWT")) {
    imports.push('import { jwt } from "@elysiajs/jwt";');
    uses.push('.use(jwt({ secret: process.env.JWT_SECRET ?? "" }))');
  }
  if (plugins.includes("Bearer")) {
    imports.push('import { bearer } from "@elysiajs/bearer";');
    uses.push(".use(bearer())");
  }
  if (plugins.includes("HTML/JSX")) {
    imports.push('import { html } from "@elysiajs/html";');
    uses.push(".use(html())");
  }
  if (plugins.includes("Server Timing")) {
    imports.push('import { serverTiming } from "@elysiajs/server-timing";');
    uses.push(".use(serverTiming())");
  }

  // Autoload replaces controller routes
  if (plugins.includes("Autoload")) {
    imports.push('import { autoload } from "elysia-autoload";');
    uses.push(".use(autoload())");
  }

  // Controller plugin + routes (always included, unless autoload replaces them)
  imports.push('import routes from "@/support/generated/routes";');
  imports.push('import plug_controller from "./controller.plug";');

  if (!plugins.includes("Autoload")) {
    uses.push(".use(plug_controller.use(routes))");
  } else {
    uses.push(".use(plug_controller)");
  }

  const importsStr = imports.join("\n");
  const usesStr = uses.join("\n  ");

  return dedent`
    ${importsStr}
    import { Elysia } from "elysia";

    /** 插件入口 */
    export default new Elysia({ name: __filename })
      ${usesStr};
  `;
}
