import type { Preferences } from "../utils";

/**
 * 生成安装命令列表
 * 根据用户选择生成相应的初始化和安装命令
 */
export function getInstallCommands({
	linter,
	orm,
	database,
	git,
	others,
}: Preferences) {
	const commands: string[] = [];

	// 初始化 Git 仓库
	if (git) commands.push("git init");
	// 安装依赖
	commands.push("bun install");
	// 如果使用 Husky 且有 linter，配置 pre-commit hook
	if (others.includes("Husky") && linter !== "None")
		commands.push(`echo "bun lint:fix" > .husky/pre-commit`);
	// 初始化 Prisma
	if (orm === "Prisma")
		commands.push(
			`bunx prisma init --datasource-provider ${database.toLowerCase()}`,
		);
	// 初始化 Biome
	if (linter === "Biome") commands.push("bunx @biomejs/biome init");
	// 运行代码检查修复
	if (linter !== "None") commands.push("bun lint:fix");

	return commands;
}
