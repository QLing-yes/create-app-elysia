/**
 * 用 Monorepo - README.md 模板
 */

export function getMonorepoReadme(projectName: string): string {
	return `# ${projectName}

A monorepo built with Turborepo, Next.js, and Elysia.

## Structure

\`\`\`
${projectName}/
├── apps/           # Applications
│   ├── web/        # Next.js frontend
│   └── api/        # Elysia backend
├── packages/       # Shared packages
│   ├── contract/   # Shared schemas and types
│   └── tsconfig/   # Shared TypeScript configuration
├── turbo.json      # Turborepo configuration
├── package.json    # Root package.json
└── README.md
\`\`\`

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) >= 1.2.0

### Installation
\`\`\`bash
bun install
\`\`\`

### Development
\`\`\`bash
bun run dev
\`\`\`

Run a specific app:
\`\`\`bash
bun run dev --filter=web
bun run dev --filter=api
\`\`\`

## License
MIT
`;
}
