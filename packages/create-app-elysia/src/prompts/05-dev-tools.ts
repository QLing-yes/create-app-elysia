/**
 * 步骤 5: 询问开发工具选择
 * ESLint, Docker, VSCode, Git 等
 * 
 * 注意：格式化工具（如 Biome、Prettier、ultracite）不包含在此处
 * 用户需要在项目生成后手动执行格式化命令
 */

import { prompt } from "enquirer";
import type { PreferencesType } from "../utils";

export interface DevToolsResult {
  linter: PreferencesType["linter"];
  docker: PreferencesType["docker"];
  vscode: PreferencesType["vscode"];
  git: PreferencesType["git"];
}

/**
 * 询问用户选择开发工具
 * 
 * @param isMonorepo 是否为单仓库模式（Monorepo 精简配置）
 * @param hasHusky 是否已选择 Husky
 * @returns 开发工具选择结果
 */
export async function askDevTools(
  isMonorepo: boolean,
  hasHusky: boolean = false
): Promise<DevToolsResult> {
  // Monorepo 模式：精简配置（开发工具由根目录统一管理）
  if (isMonorepo) {
    return {
      linter: "None",
      docker: false,
      vscode: false,
      git: true,
    };
  }

  // Standalone 模式：完整配置
  
  // 选择 Linter
  const { linter } = await prompt<{ linter: PreferencesType["linter"] }>({
    type: "select",
    name: "linter",
    message: "Select linters/formatters:",
    choices: ["None", "ESLint", "Biome"],
  });

  // Docker 配置
  const { docker } = await prompt<{ docker: PreferencesType["docker"] }>({
    type: "toggle",
    name: "docker",
    message: "Create Dockerfile + docker-compose.yml?",
    initial: "yes",
    active: "yes",
    inactive: "no",
  });

  // VSCode 配置
  const { vscode } = await prompt<{ vscode: PreferencesType["vscode"] }>({
    type: "toggle",
    name: "vscode",
    message:
      "Create .vscode folder with VSCode extensions recommendations and settings?",
    initial: "yes",
    active: "yes",
    inactive: "no",
  });

  // Git 配置（如果已选择 Husky 则跳过）
  let git = true;
  if (!hasHusky) {
    const { git: g } = await prompt<{ git: PreferencesType["git"] }>({
      type: "toggle",
      name: "git",
      message: "Create an empty Git repository?",
      initial: "yes",
      active: "yes",
      inactive: "no",
    });
    git = g;
  }

  return {
    linter,
    docker,
    vscode,
    git,
  };
}

/**
 * 提示用户手动执行格式化命令
 * 
 * @param packageManager 包管理器
 */
export function printFormatHint(packageManager: string): void {
  console.log(`
💡 Tip: To format your code, run one of the following commands:

   ${packageManager} run lint:fix
   
   Or with ultracite:
   npx ultracite init
   npx ultracite fix

`);
}
