import { dedent } from "ts-dedent";

/**
 * 生成 PostHog 分析服务文件 (src/services/posthog.ts)
 * 用于产品分析和用户行为追踪
 */
export function getPosthogIndex() {
	return dedent /* ts */`
    import { PostHog } from "posthog-node";
    import { config } from "../config.ts";

    export const posthog = new PostHog(config.POSTHOG_API_KEY, {
        host: config.POSTHOG_HOST,
        disabled: config.NODE_ENV !== "production",
    });

    posthog.on("error", (err) => {
        console.error("PostHog had an error!", err)
    })
`;
}
