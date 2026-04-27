/**
 * 用 Monorepo - 模板统一导出
 */

export { getMonorepoRootPackageJson } from "./root-package-json";
export { getTurboJson } from "./turbo-json";
export { getMonorepoRootTsConfig } from "./root-tsconfig";
export { getMonorepoGitignore } from "./gitignore";
export { getMonorepoReadme } from "./readme";
export { getContractIndex, getContractPackageJson } from "./contract-package";
export { getTsConfigPackage, getBaseTsConfig } from "./tsconfig-package";
export { getMonorepoNewAppPackageJson } from "./app/package-json";
export { getMonorepoAppServer } from "./app/server";
export { getMonorepoAppTsConfig } from "./app/tsconfig";
export { getMonorepoAppBiomeConfig } from "./app/biome-json";
export { getMonorepoAppGitignore } from "./app/gitignore";
export { getMonorepoAppReadme } from "./app/readme";
