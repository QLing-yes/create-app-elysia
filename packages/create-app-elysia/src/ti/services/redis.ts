/**
 * 体 - Redis 服务文件 (src/services/redis.ts)
 */

import dedent from "ts-dedent";

export function getRedisFile() {
	return dedent /* ts */`
	import { Redis } from "ioredis";
    import { config } from "../config.ts"

	export const redis = new Redis({
		host: config.REDIS_HOST,
		maxRetriesPerRequest: null,
	})`;
}
