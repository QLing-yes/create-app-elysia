import { dedent } from "ts-dedent";

/**
 * 生成 Redis 服务文件 (src/services/redis.ts)
 * 使用 ioredis 客户端连接 Redis
 */
export function getRedisFile() {
	return dedent /* ts */`
	import { Redis } from "ioredis";
    import { config } from "../config.ts"

	export const redis = new Redis({
		host: config.REDIS_HOST,
		// 为 bullmq 配置
		maxRetriesPerRequest: null,
	})
	`;
}
