import dedent from "ts-dedent";
import type { PreferencesType } from "../../utils";

/**
 * 生成 Verrou 分布式锁服务文件 (src/services/locks.ts)
 * 支持内存和 Redis 两种存储后端
 */
export function getLocksFile({ redis }: PreferencesType) {
	const imports: string[] = [];
	const stores: string[] = [];

	// 添加内存存储（始终启用）
	stores.push("memory: { driver: memoryStore() }");
	imports.push(`import { memoryStore } from '@verrou/core/drivers/memory'`);

	// 如果使用 Redis，添加 Redis 存储
	if (redis) {
		stores.push("redis: { driver: redisStore({ connection: redis }) },");
		imports.push(`import { redisStore } from '@verrou/core/drivers/redis'`);
		imports.push(`import { redis } from './redis.ts'`);
	}

	return dedent /* ts */`
	import { Verrou } from "@verrou/core"
    import { config } from "../config.ts"
    ${imports.join("\n")}

    export const verrou = new Verrou({
        default: config.LOCK_STORE,
        stores: {
            ${stores.join(",\n")}
        }
    })
	`;
}
