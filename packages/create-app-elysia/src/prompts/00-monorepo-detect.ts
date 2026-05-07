/**
 * 步骤 0: Monorepo 检测和处理
 *
 * 检测到 monorepo → 直接在里面添加 app
 * 未检测到 → 后续流程由入口路由决定
 */

import enquirer from "enquirer-esm";
import path from "node:path";
const { prompt } = enquirer;

/**
 * 在现有 monorepo 中选择创建位置
 */
export interface MonorepoLocationResult {
  locationType: "apps" | "packages" | "custom";
  projectName: string;
  fullPath: string;
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
      message: "apps/（前端/全栈应用）",
      hint: `${existingApps.length} 个现有应用`,
    },
    {
      name: "packages",
      message: "packages/（共享库/包）",
      hint: `${existingPackages.length} 个现有包`,
    },
    {
      name: "custom",
      message: "自定义位置 (Custom)",
      hint: "指定自定义路径",
    },
  ];

  const { locationType } = await prompt<{ locationType: "apps" | "packages" | "custom" }>({
    type: "select",
    name: "locationType",
    message: "你想在哪里创建新项目？",
    choices,
  });

  // 获取项目名称
  const { projectName } = await prompt<{ projectName: string }>({
    type: "input",
    name: "projectName",
    message: "请输入项目名称：",
    initial: locationType === "apps" ? "web" : "shared",
    validate: (value: string) => {
      if (!value.trim()) {
        return "项目名称不能为空";
      }
      if (!/^[a-z0-9_-]+$/.test(value)) {
        return "项目名称只能包含小写字母、数字、连字符和下划线";
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
      message: "请输入自定义路径（相对于 Monorepo 根目录）：",
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
 * 未检测到 monorepo 时，询问创建类型
 */
export async function askProjectType(): Promise<"standalone" | "monorepo"> {
  const { projectType } = await prompt<{ projectType: "standalone" | "monorepo" }>({
    type: "select",
    name: "projectType",
    message: "你想创建什么类型的项目？",
    choices: [
      { name: "standalone", message: "独立项目 (Standalone)", hint: "单个 Elysia 项目" },
      { name: "monorepo", message: "Monorepo（多项目仓库）", hint: "包含 Elysia + 共享包的多项目结构" },
    ],
  });

  return projectType;
}

/**
 * 询问 monorepo 根目录名称（创建新 monorepo 时）
 */
export async function askMonorepoName(): Promise<string> {
  const { name } = await prompt<{ name: string }>({
    type: "input",
    name: "name",
    message: "请输入 Monorepo 名称：",
    initial: "my-monorepo",
    validate: (value: string) => {
      if (!value.trim()) {
        return "Monorepo 名称不能为空";
      }
      if (!/^[a-z0-9_-]+$/.test(value)) {
        return "名称只能包含小写字母、数字、连字符和下划线";
      }
      return true;
    },
  });

  return name;
}
