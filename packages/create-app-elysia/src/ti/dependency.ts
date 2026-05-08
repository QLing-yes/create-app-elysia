import type { Dependencies, DevDependencies } from "./dependency/types";
import pkg from "./dependency/package.json";

/**
 * 依赖版本管理（体之基）
 * 集中管理所有可选依赖的版本号
 */
export const dependencies = pkg.dependencies as unknown as Dependencies;
/**
 * 依赖版本管理（体之基）
 * 集中管理所有可选依赖的版本号
 */
export const devDependencies = pkg.devDependencies as unknown as DevDependencies;
