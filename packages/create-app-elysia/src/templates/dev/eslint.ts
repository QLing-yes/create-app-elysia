import type { PreferencesType } from "../../utils";

/**
 * 生成 ESLint 配置文件
 * 使用 @antfu/eslint-config 并可选添加 Drizzle 插件
 */
export function generateEslintConfig({ orm }: PreferencesType) {
  return [
    `import antfu from "@antfu/eslint-config"`,
    orm === "Drizzle" && `import drizzle from "eslint-plugin-drizzle";`,
    `
export default antfu(
  {
    stylistic: {
      indent: 2,
      quotes: "double",
    },
  },
  {
        files: ["**/*.js", "**/*.ts"],
    rules: {
      "node/prefer-global/process": "off",
      "no-console": "off",
      "antfu/no-top-level-await": "off",
    },`,
    orm === "Drizzle" &&
      `plugins: {
      drizzle,
    },`,
    `
  },
);
`,
  ]
    .filter(Boolean)
    .join("\n");
}
