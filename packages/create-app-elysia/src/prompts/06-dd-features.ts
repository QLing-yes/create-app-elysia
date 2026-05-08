/**
 * 步骤 6: DD 全栈模板专属功能
 * 仅在用户选择 dd 项目类型时调用
 */

import enquirer from "enquirer-esm";
const { prompt } = enquirer;

export interface DDFeaturesResult {
  clusterEnabled: boolean;
  withMenu: boolean;
}

export async function askDDFeatures(): Promise<DDFeaturesResult> {
  const { clusterEnabled } = await prompt<{ clusterEnabled: boolean }>({
    type: "toggle",
    name: "clusterEnabled",
    message: "是否启用集群模式（多进程 + 熔断器）？",
    initial: true,
  });

  const { withMenu } = await prompt<{ withMenu: boolean }>({
    type: "toggle",
    name: "withMenu",
    message: "是否生成 CLI 交互菜单？",
    initial: true,
  });

  return { clusterEnabled, withMenu };
}
