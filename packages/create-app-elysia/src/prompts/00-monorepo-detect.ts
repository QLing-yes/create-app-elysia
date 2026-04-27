/**
 * 步骤 0: Monorepo 检测和处理
 * 
 * 检测当前是否在 monorepo 环境中，并处理相关交互
 */

import enquirer from 'enquirer';
import path from "node:path";
const { prompt } = enquirer;

/**
 * Monorepo 检测结果
 */
export interface MonorepoContextResult {
  /** 是否在 monorepo 中 */
  isMonorepo: boolean;
  /** Monorepo 根目录路径 */
  monorepoRoot: string | null;
  /** 创建新 monorepo 还是添加到现有 monorepo */
  createNewMonorepo?: boolean;
  /** 在 monorepo 中的目标路径 */
  targetPath?: string;
  /** workspace 名称 */
  workspaceName?: string;
}

/**
 * 在现有 monorepo 中选择创建位置
 */
export interface MonorepoLocationResult {
  /** 选择的位置类型 */
  locationType: "apps" | "packages" | "custom";
  /** 项目名称 */
  projectName: string;
  /** 完整路径 */
  fullPath: string;
}

/**
 * 询问是否在现有 monorepo 中创建项目
 */
export async function askMonorepoContext(
  detectedMonorepo: boolean,
  monorepoRoot: string | null
): Promise<MonorepoContextResult> {
  // 如果检测到 monorepo，询问是否在其中创建项目
  if (detectedMonorepo && monorepoRoot) {
    const { createInMonorepo } = await prompt<{ createInMonorepo: boolean }>({
      type: "toggle",
      name: "createInMonorepo",
      message: `Monorepo detected at ${monorepoRoot}. Create a new project inside this monorepo?`,
      initial: true,
    });

    if (createInMonorepo) {
      return {
        isMonorepo: true,
        monorepoRoot,
        createNewMonorepo: false,
      };
    }

    // 用户不想在现有 monorepo 中创建，询问是否创建新的 monorepo
    const { createNew } = await prompt<{ createNew: boolean }>({
      type: "toggle",
      name: "createNew",
      message: "Do you want to create a new monorepo instead?",
      initial: false,
    });

    return {
      isMonorepo: createNew,
      monorepoRoot: null,
      createNewMonorepo: createNew,
    };
  }

  // 没有检测到 monorepo，询问用户想创建什么类型的项目
  const { projectType } = await prompt<{ projectType: string }>({
    type: "select",
    name: "projectType",
    message: "What type of project do you want to create?",
    choices: [
      {
        name: "standalone",
        message: "Standalone (Single project)",
        hint: "A single Elysia project",
      },
      {
        name: "monorepo",
        message: "Monorepo (Multiple projects)",
        hint: "A monorepo with Next.js + Elysia",
      },
    ],
  });

  return {
    isMonorepo: projectType === "monorepo",
    monorepoRoot: null,
    createNewMonorepo: projectType === "monorepo",
  };
}

/**
 * 在 monorepo 中选择创建位置 (apps/* 或 packages/*)
 */
export async function askMonorepoLocation(
  monorepoRoot: string,
  existingApps: string[],
  existingPackages: string[]
): Promise<MonorepoLocationResult> {
  // 首先选择位置类型
  const choices = [
    {
      name: "apps",
      message: "apps/ (Frontend/Full-stack applications)",
      hint: `${existingApps.length} existing apps`,
    },
    {
      name: "packages",
      message: "packages/ (Shared libraries/packages)",
      hint: `${existingPackages.length} existing packages`,
    },
    {
      name: "custom",
      message: "Custom location",
      hint: "Specify a custom path",
    },
  ];

  const { locationType } = await prompt<{ locationType: "apps" | "packages" | "custom" }>({
    type: "select",
    name: "locationType",
    message: "Where do you want to create the new project?",
    choices,
  });

  // 获取项目名称
  const { projectName } = await prompt<{ projectName: string }>({
    type: "input",
    name: "projectName",
    message: "Enter the project name:",
    initial: locationType === "apps" ? "web" : "shared",
    validate: (value: string) => {
      if (!value.trim()) {
        return "Project name is required";
      }
      if (!/^[a-z0-9_-]+$/.test(value)) {
        return "Project name can only contain lowercase letters, numbers, hyphens, and underscores";
      }
      return true;
    },
  });

  // 构建完整路径
  let fullPath: string;
  if (locationType === "custom") {
    const { customPath } = await prompt<{ customPath: string }>({
      type: "input",
      name: "customPath",
      message: "Enter the custom path (relative to monorepo root):",
      initial: "apps/my-app",
    });
    fullPath = path.join(monorepoRoot, customPath);
  } else {
    fullPath = path.join(monorepoRoot, locationType, projectName);
  }

  return {
    locationType,
    projectName,
    fullPath,
  };
}

/**
 * 询问 monorepo 根目录名称（创建新 monorepo 时）
 */
export async function askMonorepoName(): Promise<string> {
  const { name } = await prompt<{ name: string }>({
    type: "input",
    name: "name",
    message: "Enter the monorepo name:",
    initial: "my-monorepo",
    validate: (value: string) => {
      if (!value.trim()) {
        return "Monorepo name is required";
      }
      if (!/^[a-z0-9_-]+$/.test(value)) {
        return "Name can only contain lowercase letters, numbers, hyphens, and underscores";
      }
      return true;
    },
  });

  return name;
}
