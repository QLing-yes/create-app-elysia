/**
 * 体 - ESLint 配置文件生成
 */

import type { Preferences } from "../../utils";

export function generateEslintConfig({ orm }: Preferences) {
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
