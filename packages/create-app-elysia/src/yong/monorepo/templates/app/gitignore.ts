/**
 * 用 Monorepo - 内部 App .gitignore 模板
 */

export function getMonorepoAppGitignore(): string {
	return `# Dependencies
node_modules/

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# Environment
.env
.env.local
.env.*.local

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
`;
}
