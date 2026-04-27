/**
 * 体 - Docker 配置文件生成
 */

import dedent from "ts-dedent";
import {
    type Preferences,
    pmExecuteMap,
    pmInstallFrozenLockfile,
    pmInstallFrozenLockfileProduction,
    pmLockFilesMap,
    pmRunMap,
} from "../../utils";

const ormDockerCopy: Record<string, string> = {
    Prisma: "COPY --from=prerelease /usr/src/app/prisma ./prisma",
    Drizzle: dedent`
    COPY --from=prerelease /usr/src/app/drizzle ./drizzle
    COPY --from=prerelease /usr/src/app/drizzle.config.ts .`,
};

function getDockerfileBun({ orm }: Preferences) {
    return dedent /* Dockerfile */ `
FROM oven/bun:${process.versions.bun ?? "1.2.5"} AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun x tsc --noEmit

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/.env .
COPY --from=prerelease /usr/src/app/.env.production .
COPY --from=prerelease /usr/src/app/bun.lock .
RUN mkdir -p /usr/src/app/src
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/tsconfig.json .
${orm !== "None" ? ormDockerCopy[orm] : ""}

ENTRYPOINT [ "bun", "start" ]`;
}

function getDockerfileNode({ packageManager, orm }: Preferences) {
    return dedent /* Dockerfile */ `
FROM node:${process?.versions?.node ?? "22.12"} AS base
WORKDIR /usr/src/app

${packageManager !== "npm" ? `npm install ${packageManager} -g` : ""}

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json ${pmLockFilesMap[packageManager]} /temp/dev/
RUN cd /temp/dev && ${pmInstallFrozenLockfile[packageManager]}

RUN mkdir -p /temp/prod
COPY package.json ${pmLockFilesMap[packageManager]} /temp/prod/
RUN cd /temp/prod && ${pmInstallFrozenLockfileProduction[packageManager]}

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN ${pmExecuteMap[packageManager]} tsc --noEmit

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

ENTRYPOINT [ "${pmRunMap[packageManager]}", "start" ]`;
}

export function getDockerfile(preferences: Preferences) {
    if (preferences.packageManager === "bun") return getDockerfileBun(preferences);
    return getDockerfileNode(preferences);
}

export function getDockerCompose({
    database,
    redis,
    projectName,
    meta,
    others,
}: Preferences) {
    const volumes: string[] = [];
    if (database === "PostgreSQL") volumes.push("postgres_data:");
    if (redis) volumes.push("redis_data:");
    if (others.includes("S3")) volumes.push("minio_data:");

    const services = [
        `bot:
            container_name: ${projectName}-bot
            restart: unless-stopped
            build:
                context: .
                dockerfile: Dockerfile
            environment:
                - NODE_ENV=production`,
        database === "PostgreSQL"
            ? `postgres:
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
        redis
            ? `redis:
            container_name: ${projectName}-redis
            image: redis:latest
            command: [ "redis-server", "--maxmemory-policy", "noeviction" ]
            restart: unless-stopped
            volumes:
                - redis_data:/data`
            : "",
        others.includes("S3")
            ? `minio:
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

    return dedent /* yaml */ `
services:
    ${services.filter(Boolean).join("\n")}
volumes:
    ${volumes.join("\n")}

networks:
    default: {}
`;
}

export function getDevelopmentDockerCompose({
    database,
    redis,
    projectName,
    meta,
    others,
}: Preferences) {
    const volumes: string[] = [];
    if (database === "PostgreSQL") volumes.push("postgres_data:");
    if (redis) volumes.push("redis_data:");
    if (others.includes("S3")) volumes.push("minio_data:");

    const services = [
        database === "PostgreSQL"
            ? `postgres:
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
        redis
            ? `redis:
            container_name: ${projectName}-redis
            image: redis:latest
            command: [ "redis-server", "--maxmemory-policy", "noeviction" ]
            restart: unless-stopped
            ports:
                - 6379:6379
            volumes:
                - redis_data:/data`
            : "",
        others.includes("S3")
            ? `minio:
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

    return dedent /* yaml */ `
services:
    ${services.filter(Boolean).join("\n")}
volumes:
    ${volumes.join("\n")}

networks:
    default: {}
`;
}
