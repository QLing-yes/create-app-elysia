import dedent from "ts-dedent";
import type { Preferences } from "../utils";
import { driverNames } from "./db";
import { driverNamesToDrizzle } from "./db";

/**
 * 生成测试预加载文件 (tests/preload.ts)
 * 使用 PGLite 模拟 PostgreSQL 数据库
 */
export function getPreloadFile({ redis, driver }: Preferences) {
	const imports: string[] = [];
	const mocks: string[] = [];

	// 如果使用 Redis，添加 ioredis-mock 模拟
	if (redis) {
		imports.push('import redis from "ioredis-mock"');
		mocks.push(
			"mock.module('ioredis', () => ({ Redis: redis, default: redis }))",
		);
	}

	return dedent /* ts */`import { mock } from "bun:test";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
${imports.join("\n")}

console.time("PGLite init");

const pglite = new PGlite();
export const db = drizzle(pglite);

mock.module("${driverNames[driver]}", () => ({ default: () => pglite }));

mock.module("drizzle-orm/${driverNamesToDrizzle[driver]}", () => ({ drizzle }));
${mocks.join("\n")}

await migrate(db, {
  migrationsFolder: join(import.meta.dir, "..", "drizzle"),
});

console.timeEnd("PGLite init");
`;
}

/**
 * 生成测试 API 文件 (tests/api.ts)
 * 使用 @elysiajs/eden 创建类型安全的 API 客户端
 */
export function getTestsAPIFile({ redis, driver }: Preferences) {
	return dedent /* ts */`import { treaty } from "@elysiajs/eden";
    import { app } from "../src/server.ts";

    export const api = treaty(app);`;
}

/**
 * 生成测试入口文件 (tests/e2e/index.test.ts)
 * 包含基础的端到端测试示例
 */
export function getTestsIndex({ redis, driver }: Preferences) {
	return dedent /* ts */`import { describe, it, expect } from "bun:test";
    import { api } from "../api.ts";

    describe("API - /", () => {
        it("/ - should return hello world", async () => {
            const response = await api.index.get();

            expect(response.status).toBe(200);
            expect(response.data).toBe("Hello World");
        });
    });

`;
}

/**
 * 生成 Telegram 共享测试工具文件
 * 包含 Bot Token 和签名初始化数据
 */
export function getTestSharedFile() {
	return dedent /* ts */`import { signInitData } from "@gramio/init-data";

    export const BOT_TOKEN = "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	export const INIT_DATA = signInitData(
		{
			user: {
				id: 1,
				first_name: "durov",
				username: "durov",
			},
		},
		BOT_TOKEN,
	);
	`;
}
