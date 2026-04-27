/**
 * Monorepo Workspace 包 package.json 模板
 * 用于 packages/* 下的共享包
 */

export function getWorkspacePackageJson(
  name: string,
  version = "1.0.0",
  description = "",
  exports: Record<string, string> = { ".": "./src/index.ts" }
): string {
  return JSON.stringify(
    {
      name,
      version,
      description,
      type: "module",
      exports,
      scripts: {
        clean: "rm -rf dist .tsbuildinfo .turbo",
        "type-check": "tsc --noEmit",
      },
      devDependencies: {
        "@types/bun": "^1.2.21",
        "@types/node": "^22.15.21",
        typescript: "^5.8.3",
      },
    },
    null,
    2
  );
}

/**
 * Monorepo App package.json 模板
 * 用于 apps/* 下的应用
 */
export function getMonorepoAppPackageJson(appName: string): string {
  return JSON.stringify(
    {
      name: appName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "bun run --watch src/server.ts",
        build: "bun build src/server.ts --outdir ./dist --target bun",
        start: "bun run dist/server.js",
        lint: "biome check --write .",
        "check-types": "tsc --noEmit",
      },
      dependencies: {
        "@elysiajs/cors": "^1.3.3",
        "@elysiajs/swagger": "^1.3.1",
        elysia: "^1.3.21",
      },
      devDependencies: {
        "@biomejs/biome": "^2.2.3",
        "@types/bun": "^1.2.21",
        typescript: "^5.8.3",
      },
    },
    null,
    2
  );
}
