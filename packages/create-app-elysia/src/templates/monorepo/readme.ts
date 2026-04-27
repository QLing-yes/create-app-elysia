/**
 * Monorepo README.md 模板
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

Run all apps in development mode:

\`\`\`bash
bun run dev
\`\`\`

Run a specific app:

\`\`\`bash
bun run dev --filter=web
bun run dev --filter=api
\`\`\`

### Build

\`\`\`bash
bun run build
\`\`\`

### Linting

\`\`\`bash
bun run lint
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| \`bun install\` | Install dependencies |
| \`bun run dev\` | Start development server |
| \`bun run build\` | Build all apps |
| \`bun run lint\` | Lint all apps |
| \`bun run check-types\` | Type check all apps |

## Adding New Apps

### New Frontend App

\`\`\`bash
mkdir -p apps/my-app
cd apps/my-app
# Initialize your Next.js app
\`\`\`

### New Backend App

\`\`\`bash
mkdir -p apps/my-api
cd my-api
# Initialize your Elysia app
\`\`\`

### New Shared Package

\`\`\`bash
mkdir -p packages/my-package
cd packages/my-package
# Initialize your shared package
\`\`\`

## License

MIT
`;
}
