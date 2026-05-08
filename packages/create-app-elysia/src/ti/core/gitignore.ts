/**
 * 体 - .gitignore 文件生成
 */

export function getGitIgnore(extraRules: string[] = []): string {
	const defaultRules = [
		"node_modules",
		"dist",
		".env",
		".env.local",
		".env.*.local",
		"logs",
		"*.log",
		".DS_Store",
		"Thumbs.db",
		".idea",
		"*.swp",
		"*.swo",
		"*~",
	];

	const allRules = [...defaultRules, ...extraRules].filter(
		(rule, index, self) => self.indexOf(rule) === index,
	);

	return allRules.join("\n");
}
