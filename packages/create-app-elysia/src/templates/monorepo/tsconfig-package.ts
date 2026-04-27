/**
 * Monorepo packages/tsconfig 包模板
 * 共享的 TypeScript 配置
 */

export function getTsConfigPackage(): string {
  return JSON.stringify(
    {
      name: "@repo/tsconfig",
      version: "1.0.0",
      description: "Shared TypeScript configuration",
      files: ["base.json"],
    },
    null,
    2
  );
}

export function getBaseTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022"],
        moduleDetection: "force",
        module: "Preserve",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        allowImportingTsExtensions: true,
        allowJs: true,
        strict: true,
        noFallthroughCasesInSwitch: true,
        noImplicitOverride: true,
        noImplicitReturns: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noEmit: true,
        noUncheckedSideEffectImports: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        isolatedModules: true,
        skipLibCheck: true,
      },
    },
    null,
    2
  );
}
