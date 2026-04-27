/**
 * 用 Monorepo - 内部 App tsconfig.json 模板
 */

export function getMonorepoAppTsConfig(): string {
	return JSON.stringify(
		{
			extends: "@repo/tsconfig/base.json",
			compilerOptions: {
				module: "ESNext",
				moduleResolution: "bundler",
				noEmit: true,
				skipLibCheck: true,
				allowSyntheticDefaultImports: true,
				esModuleInterop: true,
				resolveJsonModule: true,
				types: ["bun-types"],
			},
			include: ["src/**/*"],
			exclude: ["node_modules", "dist"],
		},
		null,
		2,
	);
}
