/**
 * 步骤 2: Elysia 插件选择
 */

import enquirer from "enquirer-esm";
const { prompt } = enquirer;
import type { PreferencesType } from "../utils";

export interface PluginsResult {
  plugins: PreferencesType["plugins"];
}

export async function askPlugins(): Promise<PluginsResult> {
  const { plugins } = await prompt<{ plugins: PreferencesType["plugins"] }>({
    type: "multiselect",
    name: "plugins",
    message: "选择 Elysia 插件：（空格选择，回车确认）",
    choices: [
      "CORS",
      "Swagger",
      "JWT",
      "Autoload",
      "Oauth 2.0",
      "HTML/JSX",
      "Static",
      "Bearer",
      "Server Timing",
    ] as PreferencesType["plugins"],
  });

  return { plugins };
}
