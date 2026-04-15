/**
 * 生成 .gitignore 文件
 * 包含常见的忽略规则
 */

/**
 * 生成 .gitignore 文件内容
 * @param extraRules 额外的忽略规则（可选）
 */
export function getGitIgnore(extraRules: string[] = []): string {
  const defaultRules = [
    // 依赖目录
    "node_modules",
    // 构建输出
    "dist",
    // 环境变量
    ".env",
    ".env.local",
    ".env.*.local",
    // 日志文件
    "logs",
    "*.log",
    // 系统文件
    ".DS_Store",
    "Thumbs.db",
    // IDE 配置
    ".idea",
    "*.swp",
    "*.swo",
    "*~",
  ];

  const allRules = [...defaultRules, ...extraRules].filter(
    (rule, index, self) => self.indexOf(rule) === index
  );

  return allRules.join("\n");
}
