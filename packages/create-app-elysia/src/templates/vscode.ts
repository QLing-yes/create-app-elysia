import type { PreferencesType } from "../utils.js";

// 代码检查工具对应的 VSCode 扩展 ID
const linterExtensionTag: Record<
	Exclude<PreferencesType["linter"], "None">,
	string
> = {
	ESLint: "dbaeumer.vscode-eslint",
	Biome: "biomejs.biome",
};

/**
 * 生成 VSCode 扩展推荐文件 (.vscode/extensions.json)
 * 根据项目配置推荐相关扩展
 */
export function getVSCodeExtensions({
	linter,
	packageManager,
	docker,
	orm,
}: PreferencesType) {
	const extensionsFile: { recommendations: string[] } = {
		// 通用推荐扩展
		recommendations: [
			"usernamehw.errorlens",
			"YoavBls.pretty-ts-errors",
			"meganrogge.template-string-converter",
		],
	};

	// Bun 包管理器扩展
	if (packageManager === "bun")
		extensionsFile.recommendations.push("oven.bun-vscode");

	// 代码检查工具扩展
	if (linter !== "None")
		extensionsFile.recommendations.push(linterExtensionTag[linter]);

	// Docker 扩展
	if (docker)
		extensionsFile.recommendations.push("ms-azuretools.vscode-docker");

	// ORM 相关扩展
	if (orm === "Drizzle")
		extensionsFile.recommendations.push("rphlmr.vscode-drizzle-orm");
	if (orm === "Prisma") extensionsFile.recommendations.push("Prisma.prisma");

	return JSON.stringify(extensionsFile, null, 2);
}

/**
 * 生成 VSCode 设置文件 (.vscode/settings.json)
 * 配置格式化行为和默认格式化器
 */
export function getVSCodeSettings({ linter }: PreferencesType) {
	let settingsFile: Record<string, unknown> = {
		"editor.formatOnSave": true,
	};

	// 配置不同语言的文件格式化器
	if (linter !== "None")
		settingsFile = {
			...settingsFile,
			"[javascript]": {
				"editor.defaultFormatter": linterExtensionTag[linter],
			},
			"[typescript]": {
				"editor.defaultFormatter": linterExtensionTag[linter],
			},
		};

	return JSON.stringify(settingsFile, null, 2);
}
