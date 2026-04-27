/**
 * 用 Monorepo - 内部 App README.md 模板
 */

export function getMonorepoAppReadme(appName: string): string {
	return `# ${appName}

A Elysia application in the monorepo.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) >= 1.2.0

### Development
\`\`\`bash
bun run dev
\`\`\`

From the monorepo root:
\`\`\`bash
bun run dev --filter=${appName}
\`\`\`

### API Documentation
\`\`\`
http://localhost:3000/swagger
\`\`\`
`;
}
