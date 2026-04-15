/**
 * 步骤 3: 询问 Elysia 插件选择
 */

import { prompt } from "enquirer";
import type { PreferencesType } from "../utils";

export interface PluginsResult {
  plugins: PreferencesType["plugins"];
}

/**
 * 询问用户选择 Elysia 插件
 * 
 * @returns 插件选择结果
 */
export async function askPlugins(): Promise<PluginsResult> {
  const { plugins } = await prompt<{
    plugins: PreferencesType["plugins"];
  }>({
    type: "multiselect",
    name: "plugins",
    message: "Select Elysia plugins: (Space to select, Enter to continue)",
    choices: [
      "CORS",
      "Swagger",
      "JWT",
      "Autoload",
      "Oauth 2.0",
      // "Logger",
      "HTML/JSX",
      "Static",
      "Bearer",
      "Server Timing",
    ] as PreferencesType["plugins"],
  });

  return { plugins };
}
