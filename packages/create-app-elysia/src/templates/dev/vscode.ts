import type { PreferencesType } from "../../utils";

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
 */
export function getVSCodeExtensions({
  linter,
  packageManager,
  docker,
  orm,
}: PreferencesType) {
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

/**
 * 生成 VSCode 设置文件 (.vscode/settings.json)
 */
export function getVSCodeSettings({ linter }: PreferencesType) {
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
