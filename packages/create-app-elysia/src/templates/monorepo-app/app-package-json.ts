/**
 * Monorepo App package.json 模板
 * 用于在现有 monorepo 中添加新的 app
 */

export function getMonorepoNewAppPackageJson(appName: string): string {
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
