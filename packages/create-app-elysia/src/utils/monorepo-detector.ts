/**
 * Monorepo 检测工具
 * 
 * 检测当前是否在 monorepo 项目中，并返回相关信息
 */

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

/**
 * Monorepo 类型
 */
export type MonorepoType = "turborepo" | "pnpm" | "npm" | "yarn" | null;

/**
 * Monorepo 检测结果
 */
export interface MonorepoResult {
  /** 是否在 monorepo 中 */
  isMonorepo: boolean;
  /** Monorepo 根目录路径 */
  rootPath: string | null;
  /** Monorepo 类型 */
  type: MonorepoType;
  /** workspaces 配置 */
  workspaces: string[];
}

/**
 * 检查目录是否是 monorepo 根目录
 */
async function checkMonorepoRoot(dir: string): Promise<MonorepoResult> {
  try {
    // 检查 turbo.json
    const turboPath = path.join(dir, "turbo.json");
    const turboExists = await fs
      .access(turboPath)
      .then(() => true)
      .catch(() => false);

    if (turboExists) {
      const turboContent = await fs.readFile(turboPath, "utf-8");
      const turbo = JSON.parse(turboContent);
      const workspaces = getWorkspacesFromPackageJson(dir);
      return {
        isMonorepo: true,
        rootPath: dir,
        type: "turborepo",
        workspaces,
      };
    }

    // 检查 pnpm-workspace.yaml
    const pnpmWorkspacePath = path.join(dir, "pnpm-workspace.yaml");
    const pnpmExists = await fs
      .access(pnpmWorkspacePath)
      .then(() => true)
      .catch(() => false);

    if (pnpmExists) {
      const workspaces = getWorkspacesFromPackageJson(dir);
      return {
        isMonorepo: true,
        rootPath: dir,
        type: "pnpm",
        workspaces,
      };
    }

    // 检查 package.json 的 workspaces 字段
    const packagePath = path.join(dir, "package.json");
    const packageExists = await fs
      .access(packagePath)
      .then(() => true)
      .catch(() => false);

    if (packageExists) {
      const packageContent = await fs.readFile(packagePath, "utf-8");
      const pkg = JSON.parse(packageContent);
      
      if (pkg.workspaces) {
        const workspaces = Array.isArray(pkg.workspaces)
          ? pkg.workspaces
          : pkg.workspaces.packages || [];
        
        // 判断是哪种包管理器的 monorepo
        let type: MonorepoType = "npm";
        if (pkg.packageManager?.startsWith("pnpm")) {
          type = "pnpm";
        } else if (pkg.packageManager?.startsWith("yarn")) {
          type = "yarn";
        }
        
        return {
          isMonorepo: true,
          rootPath: dir,
          type,
          workspaces,
        };
      }
    }

    return {
      isMonorepo: false,
      rootPath: null,
      type: null,
      workspaces: [],
    };
  } catch {
    return {
      isMonorepo: false,
      rootPath: null,
      type: null,
      workspaces: [],
    };
  }
}

/**
 * 从 package.json 中提取 workspaces
 */
function getWorkspacesFromPackageJson(dir: string): string[] {
  try {
    const packagePath = path.join(dir, "package.json");
    const packageContent = fsSync.readFileSync(packagePath, "utf-8");
    const pkg = JSON.parse(packageContent);
    
    if (pkg.workspaces) {
      return Array.isArray(pkg.workspaces)
        ? pkg.workspaces
        : pkg.workspaces.packages || [];
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * 向上查找检测 monorepo
 * 
 * 从当前目录开始，逐级向上查找 monorepo 根目录
 */
export async function detectMonorepo(
  startDir: string = process.cwd()
): Promise<MonorepoResult> {
  let currentDir = path.resolve(startDir);
  
  // 最多向上查找 10 层
  for (let i = 0; i < 10; i++) {
    const result = await checkMonorepoRoot(currentDir);
    
    if (result.isMonorepo) {
      return result;
    }
    
    const parentDir = path.dirname(currentDir);
    
    // 已经到达根目录
    if (parentDir === currentDir) {
      break;
    }
    
    currentDir = parentDir;
  }
  
  return {
    isMonorepo: false,
    rootPath: null,
    type: null,
    workspaces: [],
  };
}

/**
 * 获取 monorepo 中所有的 apps 和 packages 路径
 */
export async function getMonorepoWorkspaces(
  rootPath: string,
  workspaces: string[]
): Promise<{ apps: string[]; packages: string[]; others: string[] }> {
  const apps: string[] = [];
  const packages: string[] = [];
  const others: string[] = [];

  for (const pattern of workspaces) {
    // 解析 glob 模式
    const basePattern = pattern.replace(/\/\*$/, "");
    const searchDir = path.join(rootPath, basePattern);

    try {
      const entries = await fs.readdir(searchDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const fullPath = path.join(searchDir, entry.name);
          const relativePath = path.relative(rootPath, fullPath);
          
          if (basePattern.startsWith("apps") || basePattern === "apps") {
            apps.push(relativePath);
          } else if (basePattern.startsWith("packages") || basePattern === "packages") {
            packages.push(relativePath);
          } else {
            others.push(relativePath);
          }
        }
      }
    } catch {
      // 目录不存在，跳过
    }
  }

  return { apps, packages, others };
}
