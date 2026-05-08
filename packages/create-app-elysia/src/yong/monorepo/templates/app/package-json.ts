/**
 * 用 Monorepo - 内部 App package.json 模板
 */

import type { PreferencesType } from "../../../../utils";

export function getMonorepoNewAppPackageJson(appName: string, prefs?: PreferencesType): string {
  const plugins = prefs?.plugins ?? [];
  const deps: Record<string, string> = { elysia: "^1.3.21" };

  // 根据选择的插件添加依赖
  for (const plugin of plugins) {
    const name = plugin.toLowerCase().replace(/\s+/g, "-");
    switch (name) {
      case "cors": deps["@elysiajs/cors"] = "^1.3.3"; break;
      case "swagger": deps["@elysiajs/swagger"] = "^1.3.1"; break;
      case "jwt": deps["@elysiajs/jwt"] = "^1.3.1"; break;
      case "autoload": deps["@elysiajs/autoload"] = "^1.3.1"; break;
      case "oauth-2.0": deps["@elysiajs/oauth2"] = "^1.3.1"; break;
      case "html/jsx": deps["@elysiajs/html"] = "^1.3.1"; break;
      case "static": deps["@elysiajs/static"] = "^1.3.1"; break;
      case "bearer": deps["@elysiajs/bearer"] = "^1.3.1"; break;
      case "server-timing": deps["@elysiajs/server-timing"] = "^1.3.1"; break;
    }
  }

  return JSON.stringify(
    {
      name: `apps/${appName}`,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "bun run --watch src/server.ts",
        build: "bun build src/server.ts --outdir ./dist --target bun",
        start: "bun run dist/server.js",
        lint: "biome check --write .",
        "check-types": "tsc --noEmit",
      },
      dependencies: deps,
      devDependencies: {
        "@biomejs/biome": "^2.2.3",
        "@types/bun": "^1.2.21",
        typescript: "^5.8.3",
      },
    },
    null,
    2,
  );
}
