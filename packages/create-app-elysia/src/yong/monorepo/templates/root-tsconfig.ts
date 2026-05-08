/**
 * 用 Monorepo - 根目录 tsconfig.json 模板
 */

export function getMonorepoRootTsConfig(): string {
	return JSON.stringify(
		{
			compilerOptions: {
				target: "ES2022",
				lib: ["ES2022"],
				moduleDetection: "force",
				module: "Preserve",
				moduleResolution: "bundler",
				resolveJsonModule: true,
				allowImportingTsExtensions: true,
				allowJs: true,
				strict: true,
				noFallthroughCasesInSwitch: true,
				noImplicitOverride: true,
				noImplicitReturns: true,
				noUnusedLocals: true,
				noUnusedParameters: true,
				noEmit: true,
				noUncheckedSideEffectImports: true,
				esModuleInterop: true,
				forceConsistentCasingInFileNames: true,
				isolatedModules: true,
				skipLibCheck: true,
			},
		},
		null,
		2,
	);
}
