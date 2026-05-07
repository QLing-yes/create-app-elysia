/**
 * 步骤 5: 格式化工具选择 ← 漏斗最后一步
 * ultracite / Biome / ESLint / None
 */

import enquirer from "enquirer-esm";
const { prompt } = enquirer;

export interface FormatterResult {
  formatter: "ultracite" | "biome" | "eslint" | "none";
}

export async function askFormatter(isMonorepo: boolean): Promise<FormatterResult> {
  if (isMonorepo) {
    return { formatter: "none" };
  }

  const { formatter } = await prompt<{ formatter: FormatterResult["formatter"] }>({
    type: "select",
    name: "formatter",
    message: "选择格式化工具：",
    choices: ["ultracite", "biome", "eslint", "none"],
    initial: 0,
  });

  return { formatter };
}
