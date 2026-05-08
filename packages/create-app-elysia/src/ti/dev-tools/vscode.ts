/**
 * 体 - VSCode 配置文件生成
 */

import type { Preferences } from "../../utils";
import type { LinterType } from "../../types";

const linterExtensionTag: Record<Exclude<LinterType, "None">, string> = {
	ESLint: "dbaeumer.vscode-eslint",
	Biome: "biomejs.biome",
};

export function getVSCodeExtensions({
	linter,
	packageManager,
	docker,
	orm,
}: Preferences) {
	const extensionsFile: { recommendations: string[] } = {
		recommendations: [
			"usernamehw.errorlens",
			"YoavBls.pretty-ts-errors",
			"meganrogge.template-string-converter",
		],
	};

	if (packageManager === "bun")
		extensionsFile.recommendations.push("oven.bun-vscode");
	if (linter !== "None")
		extensionsFile.recommendations.push(linterExtensionTag[linter]);
	if (docker)
		extensionsFile.recommendations.push("ms-azuretools.vscode-docker");
	if (orm === "Drizzle")
		extensionsFile.recommendations.push("rphlmr.vscode-drizzle-orm");
	if (orm === "Prisma") extensionsFile.recommendations.push("Prisma.prisma");

	return JSON.stringify(extensionsFile, null, 2);
}

export function getVSCodeSettings({ linter }: Preferences) {
	let settingsFile: Record<string, unknown> = {
		"editor.formatOnSave": true,
	};

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
