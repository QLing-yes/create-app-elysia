/**
 * 体 - Jobify 任务队列文件 (src/services/jobify.ts)
 */

import dedent from "ts-dedent";

export function getJobifyFile() {
	return dedent /* ts */`
	import { initJobify } from "jobify"
	import { redis } from "./redis.ts"

	export const defineJob = initJobify(redis);`;
}
