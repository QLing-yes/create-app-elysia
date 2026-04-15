import dedent from "ts-dedent";

/**
 * 生成 Telegram Bot 文件 (src/bot.ts)
 * 使用 gramio 框架构建 Telegram Bot
 */
export function getBotFile() {
	return dedent /* ts */`
	import { Bot } from "gramio";
    import { config } from "./config.ts";

	export const bot = new Bot(config.BOT_TOKEN)
        .onStart(({ info }) => console.log(\`✨ Bot \${info.username} was started!\`))`;
}
