/**
 * Monorepo 根目录 package.json 模板
 */

export function getMonorepoRootPackageJson(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      private: true,
      scripts: {
        build: "turbo run build",
        dev: "turbo run dev",
        lint: "turbo run lint",
        format: "prettier --write \"**/*.{ts,tsx,md}\"",
        "check-types": "turbo run check-types",
        check: "biome check --write .",
      },
      devDependencies: {
        "@biomejs/biome": "^2.2.3",
        "@types/bun": "^1.2.21",
        "@types/node": "^22.15.21",
        prettier: "^3.5.3",
        turbo: "^2.5.4",
        typescript: "^5.8.3",
      },
      packageManager: "bun@1.2.15",
      workspaces: ["apps/*", "packages/*"],
    },
    null,
    2
  );
}
