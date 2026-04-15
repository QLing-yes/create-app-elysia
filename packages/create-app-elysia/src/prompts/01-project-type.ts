/**
 * 步骤 1: 询问项目类型
 * Monorepo 还是 Standalone 单体应用
 */

import enquirer from 'enquirer';
const { prompt } = enquirer; 

export interface ProjectTypeResult {
  isMonorepo: boolean;
}

/**
 * 询问用户项目类型
 * 
 * @returns 项目类型选择结果
 */
export async function askProjectType(): Promise<ProjectTypeResult> {
  const { isMonorepo } = await prompt<{ isMonorepo: boolean }>({
    type: "toggle",
    name: "isMonorepo",
    message: "Is this a monorepo? (Monorepo will have simplified configuration)",
    initial: false,
  });

  return { isMonorepo };
}
