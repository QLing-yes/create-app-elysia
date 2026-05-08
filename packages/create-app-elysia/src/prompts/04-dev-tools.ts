/**
 * 步骤 4: 开发工具选择
 * Docker, VSCode, Git, Husky
 *
 * 注意：格式化工具在步骤 5 独立询问
 */

import enquirer from "enquirer-esm";
const { prompt } = enquirer;

export interface DevToolsResult {
  docker: boolean;
  vscode: boolean;
  git: boolean;
  husky: boolean;
}

export async function askDevTools(isMonorepo: boolean): Promise<DevToolsResult> {
  if (isMonorepo) {
    return { docker: false, vscode: false, git: true, husky: false };
  }

  const { docker } = await prompt<{ docker: boolean }>({
    type: "toggle",
    name: "docker",
    message: "是否创建 Dockerfile + docker-compose.yml？",
    initial: true,
  });

  const { vscode } = await prompt<{ vscode: boolean }>({
    type: "toggle",
    name: "vscode",
    message: "是否创建 .vscode 配置文件夹？",
    initial: true,
  });

  // Git（选了 Husky 则自动启用）
  const { husky } = await prompt<{ husky: boolean }>({
    type: "toggle",
    name: "husky",
    message: "是否使用 Husky（Git hooks）？",
    initial: true,
  });

  let git = true;
  if (!husky) {
    const result = await prompt<{ git: boolean }>({
      type: "toggle",
      name: "git",
      message: "是否初始化 Git 仓库？",
      initial: true,
    });
    git = result.git;
  }

  return { docker, vscode, git, husky };
}
