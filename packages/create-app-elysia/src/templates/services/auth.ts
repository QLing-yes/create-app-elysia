import { dedent } from "ts-dedent";

/**
 * 生成 Telegram 认证插件 (src/services/auth.plugin.ts)
 * 用于验证 Telegram Init Data 并提取用户信息
 */
export function getAuthPlugin() {
	return dedent /* ts */`
    import { validateAndParseInitData, signInitData, getBotTokenSecretKey } from "@gramio/init-data";
    import { Elysia, t } from "elysia";
    import { config } from "../config.ts";

    const secretKey = getBotTokenSecretKey(config.BOT_TOKEN);

    export const authElysia = new Elysia({
        name: "auth",
    })
        .guard({
            headers: t.Object({
                "x-init-data": t.String({
                    examples: [
                        signInitData(
                            {
                                user: {
                                    id: 1,
                                    first_name: "durov",
                                    username: "durov",
                                },
                            },
                            secretKey
                        ),
                    ],
                }),
            }),
            response: {
                401: t.Literal("UNAUTHORIZED"),
            },
        })
        .resolve(({ headers, error }) => {
            const result = validateAndParseInitData(
                headers["x-init-data"],
                secretKey
            );
            if (!result || !result.user)
                return error("Unauthorized", "UNAUTHORIZED");

            return {
                tgId: result.user.id,
                user: result.user,
            };
        })
        .as("plugin");`;
}
