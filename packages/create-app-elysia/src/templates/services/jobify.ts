import { dedent } from "ts-dedent";

/**
 * 生成 Jobify 任务队列文件 (src/services/jobify.ts)
 * 初始化基于 Redis 的任务队列系统
 */
export function getJobifyFile() {
	return dedent /* ts */`
	import { initJobify } from "jobify"
	import { redis } from "./redis.ts"

	export const defineJob = initJobify(redis);
	`;
}
