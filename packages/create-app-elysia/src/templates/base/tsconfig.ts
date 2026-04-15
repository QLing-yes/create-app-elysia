import type { Preferences } from "../../utils";

/**
 * 生成 TypeScript 配置文件 (tsconfig.json)
 * 根据插件选择配置 JSX 等选项
 */
export function getTSConfig({ plugins }: Preferences) {
	return JSON.stringify(
		{
			compilerOptions: {
				// 编译目标和模块系统
				lib: ["ESNext"],
				module: "NodeNext",
				target: "ESNext",
				moduleResolution: "NodeNext",
				esModuleInterop: true,
				// 严格类型检查
				strict: true,
				skipLibCheck: true,
				allowSyntheticDefaultImports: true,
				noEmit: true,
				allowImportingTsExtensions: true,
				noUncheckedIndexedAccess: true,
				// 如果选择 HTML/JSX 插件，配置 JSX 支持
				...(plugins.includes("HTML/JSX")
					? {
							jsx: "react",
							jsxFactory: "Html.createElement",
							jsxFragmentFactory: "Html.Fragment",
							plugins: [{ name: "@kitajs/ts-html-plugin" }],
						}
					: {}),
			},
			include: ["src"],
		},
		null,
		2,
	);
}
