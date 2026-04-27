/**
 * Monorepo packages/contract 包模板
 * 共享的 Zod schemas 和类型定义
 */

export function getContractIndex(): string {
  return `/**
 * Contract - Shared schemas and types
 */

// TODO: Add your shared schemas here
// Example:
// import { z } from "zod";

// export const userSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   email: z.string().email(),
// });

// export type User = z.infer<typeof userSchema>;
`;
}

export function getContractPackageJson(): string {
  return JSON.stringify(
    {
      name: "@repo/contract",
      version: "1.0.0",
      description: "Shared schemas and types",
      type: "module",
      main: "./src/index.ts",
      types: "./src/index.ts",
      scripts: {
        "type-check": "tsc --noEmit",
      },
      devDependencies: {
        "@repo/tsconfig": "workspace:*",
        "@types/bun": "^1.2.21",
        typescript: "^5.8.3",
      },
    },
    null,
    2
  );
}
