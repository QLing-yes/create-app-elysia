/**
 * 依赖安装（体之基）
 * 根据用户偏好生成安装命令
 */

import type { Preferences } from "../utils";

export function getInstallCommands({
  formatter,
  orm,
  database,
  git,
  husky,
}: Preferences) {
  const commands: string[] = [];

  if (git) commands.push("git init");
  commands.push("bun install");

  if (husky && formatter !== "none") {
    commands.push(`echo "bun lint:fix" > .husky/pre-commit`);
  }

  if (orm === "Prisma") {
    commands.push(
      `bunx prisma init --datasource-provider ${database.toLowerCase()}`,
    );
  }

  if (formatter === "biome") commands.push("bunx @biomejs/biome init");
  if (formatter === "eslint") commands.push("bun lint:fix");

  return commands;
}
