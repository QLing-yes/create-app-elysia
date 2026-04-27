/**
 * Monorepo .gitignore 模板
 */

export function getMonorepoGitignore(): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Package manager locks
bun.lockb
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build outputs
dist/
build/
.next/
out/
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
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# Turbo
.turbo/

# Biome
.biome.json

# Testing
coverage/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
`;
}
