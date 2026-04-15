import dedent from "ts-dedent";
import {
	type Preferences,
	type PreferencesType,
	pmExecuteMap,
	pmInstallFrozenLockfile,
	pmInstallFrozenLockfileProduction,
	pmLockFilesMap,
	pmRunMap,
} from "../utils.js";

// ORM 相关的 Docker 复制命令映射
const ormDockerCopy: Record<Exclude<PreferencesType["orm"], "None">, string> = {
	Prisma: "COPY --from=prerelease /usr/src/app/prisma ./prisma",
	Drizzle: dedent`
    COPY --from=prerelease /usr/src/app/drizzle ./drizzle
    COPY --from=prerelease /usr/src/app/drizzle.config.ts .`,
};

/**
 * 生成 Dockerfile
 * 使用多阶段构建优化镜像大小
 */
export function getDockerfile({ packageManager, orm }: Preferences) {
	// Bun 运行时配置
	if (packageManager === "bun")
		return dedent /* Dockerfile */`
# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:${process.versions.bun ?? "1.2.5"} AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN ${pmExecuteMap[packageManager]} tsc --noEmit

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/.env .
COPY --from=prerelease /usr/src/app/.env.production .
COPY --from=prerelease /usr/src/app/${pmLockFilesMap[packageManager]} .
RUN mkdir -p /usr/src/app/src
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/tsconfig.json .
${orm !== "None" ? ormDockerCopy[orm] : ""}

ENTRYPOINT [ "bun", "start" ]`;

	// Node.js 运行时配置
	return dedent /* Dockerfile */`
# Use the official Node.js 22 image.
# See https://hub.docker.com/_/node for more information.
FROM node:${process?.versions?.node ?? "22.12"} AS base

# Create app directory
WORKDIR /usr/src/app

${packageManager !== "npm" ? "npm install ${packageManager} -g" : ""}
# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json ${pmLockFilesMap[packageManager]} /temp/dev/
RUN cd /temp/dev && ${pmInstallFrozenLockfile[packageManager]}

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json ${pmLockFilesMap[packageManager]} /temp/prod/
RUN cd /temp/prod && ${pmInstallFrozenLockfileProduction[packageManager]}

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production

RUN ${pmExecuteMap[packageManager]} tsc --noEmit

# Copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/.env .
COPY --from=prerelease /usr/src/app/.env.production .
RUN mkdir -p /usr/src/app/src
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/${pmLockFilesMap[packageManager]} .
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/tsconfig.json .
${orm !== "None" ? ormDockerCopy[orm] : ""}

# TODO:// should be downloaded not at ENTRYPOINT
ENTRYPOINT [ "${pmRunMap[packageManager]}", "start" ]`;
}

// TODO: generate redis+postgres
/**
 * 生成 Docker Compose 配置文件（生产环境）
 * 包含应用服务和数据库服务
 */
export function getDockerCompose({
	database,
	redis,
	projectName,
	meta,
	others,
}: PreferencesType) {
	const volumes: string[] = [];

	// 根据配置添加数据卷
	if (database === "PostgreSQL") volumes.push("postgres_data:");
	if (redis) volumes.push("redis_data:");
	if (others.includes("S3")) volumes.push("minio_data:");

	const services = [
		/* yaml */ `bot:
            container_name: ${projectName}-bot
            restart: unless-stopped
            build:
                context: .
                dockerfile: Dockerfile
            environment:
                - NODE_ENV=production`,
		// PostgreSQL 数据库服务
		database === "PostgreSQL"
			? /* yaml */ `postgres:
            container_name: ${projectName}-postgres
            image: postgres:latest
            restart: unless-stopped
            environment:
                - POSTGRES_USER=${projectName}
                - POSTGRES_PASSWORD=${meta.databasePassword}
                - POSTGRES_DB=${projectName}
            volumes:
                - postgres_data:/var/lib/postgresql/data`
			: "",
		// Redis 服务
		redis
			? /* yaml */ `redis:
            container_name: ${projectName}-redis
            image: redis:latest
            command: [ "redis-server", "--maxmemory-policy", "noeviction" ]
            restart: unless-stopped
            volumes:
                - redis_data:/data`
			: "",
		// MinIO S3 服务
		others.includes("S3")
			? /* yaml */ `minio:
            container_name: ${projectName}-minio
            image: minio/minio:latest
            command: [ "minio", "server", "/data", "--console-address", ":9001" ]
            restart: unless-stopped
            environment:
                - MINIO_ACCESS_KEY=${projectName}
                - MINIO_SECRET_KEY=${meta.databasePassword}
            ports:
                - 9000:9000
                - 9001:9001
            volumes:
                - minio_data:/data
            healthcheck:
                test: ["CMD", "mc", "ready", "local"]
                interval: 5s
                timeout: 5s
                retries: 5`
			: "",
	];

	return dedent /* yaml */`
services:
    ${services.filter(Boolean).join("\n")}
volumes:
    ${volumes.join("\n")}

networks:
    default: {}
`;
}

/**
 * 生成 Docker Compose 配置文件（开发环境）
 * 仅包含数据库和 Redis 等基础设施服务
 */
export function getDevelopmentDockerCompose({
	database,
	redis,
	projectName,
	meta,
	others,
}: PreferencesType) {
	const volumes: string[] = [];

	if (database === "PostgreSQL") volumes.push("postgres_data:");
	if (redis) volumes.push("redis_data:");
	if (others.includes("S3")) volumes.push("minio_data:");

	const services = [
		// PostgreSQL 数据库服务（暴露端口）
		database === "PostgreSQL"
			? /* yaml */ `postgres:
            container_name: ${projectName}-postgres
            image: postgres:latest
            restart: unless-stopped
            environment:
                - POSTGRES_USER=${projectName}
                - POSTGRES_PASSWORD=${meta.databasePassword}
                - POSTGRES_DB=${projectName}
            ports:
                - 5432:5432
            volumes:
                - postgres_data:/var/lib/postgresql/data`
			: "",
		// Redis 服务（暴露端口）
		redis
			? /* yaml */ `redis:
            container_name: ${projectName}-redis
            image: redis:latest
            command: [ "redis-server", "--maxmemory-policy", "noeviction" ]
            restart: unless-stopped
            ports:
                - 6379:6379
            volumes:
                - redis_data:/data`
			: "",
		// MinIO S3 服务
		others.includes("S3")
			? /* yaml */ `minio:
            container_name: ${projectName}-minio
            image: minio/minio:latest
            command: [ "minio", "server", "/data", "--console-address", ":9001" ]
            restart: unless-stopped
            environment:
                - MINIO_ACCESS_KEY=${projectName}
                - MINIO_SECRET_KEY=${meta.databasePassword}
            volumes:
                - minio_data:/data
            healthcheck:
                test: ["CMD", "mc", "ready", "local"]
                interval: 5s
                timeout: 5s
                retries: 5`
			: "",
	];

	return dedent /* yaml */`
services:
    ${services.filter(Boolean).join("\n")}
volumes:
    ${volumes.join("\n")}

networks:
    default: {}
`;
}
