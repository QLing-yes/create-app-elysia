/**
 * 依赖安装（体之基）
 * 根据用户偏好生成安装命令
 */

import type { Preferences } from "../utils";

export function getInstallCommands({
	linter,
	orm,
	database,
	git,
	others,
}: Preferences) {
	const commands: string[] = [];

	if (git) commands.push("git init");
	commands.push("bun install");
	if (others.includes("Husky") && linter !== "None")
		commands.push(`echo "bun lint:fix" > .husky/pre-commit`);
	if (orm === "Prisma")
		commands.push(
			`bunx prisma init --datasource-provider ${database.toLowerCase()}`,
		);
	if (linter === "Biome") commands.push("bunx @biomejs/biome init");
	if (linter !== "None") commands.push("bun lint:fix");

	return commands;
}
