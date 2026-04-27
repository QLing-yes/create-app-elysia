/**
 * Monorepo App README.md 模板
 */

export function getMonorepoAppReadme(appName: string): string {
  return `# ${appName}

A Elysia application in the monorepo.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.2.0

### Installation

\`\`\`bash
bun install
\`\`\`

### Development

From the monorepo root:

\`\`\`bash
bun run dev --filter=${appName}
\`\`\`

Or directly:

\`\`\`bash
bun run dev
\`\`\`

### Build

\`\`\`bash
bun run build
\`\`\`

### API Documentation

Once the server is running, access the Swagger UI at:

\`\`\`
http://localhost:3000/swagger
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| \`bun run dev\` | Start development server |
| \`bun run build\` | Build the application |
| \`bun run start\` | Start production server |
| \`bun run lint\` | Lint the code |
| \`bun run check-types\` | Type check the code |
`;
}
