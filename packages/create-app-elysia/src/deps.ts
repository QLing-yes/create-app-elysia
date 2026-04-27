import type { Dependencies, DevDependencies } from "./dependency/types";
import pkg from "./dependency/package.json";

export const dependencies = pkg.dependencies as unknown as Dependencies;
export const devDependencies = pkg.devDependencies as unknown as DevDependencies;
