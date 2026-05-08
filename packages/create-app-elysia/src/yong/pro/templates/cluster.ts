import { dedent } from "ts-dedent";

export function getClusterFile(): string {
  return dedent`
    import "@/app/lib/error";
    import * as common from "@/app/common";

    /** 唯一全局变量（不建议增加更多了） */
    (globalThis as unknown as { $g: typeof common }).$g = common;

    import cluster from "node:cluster";
    import os from "node:os";
    import { logger } from "@/app/lib/logger";

    (async () => {
      const port = process.env.PORT;

      if (process.env.CLUSTER_ENABLED !== "true") {
        logger.info(
          \`server \${process.pid} http://localhost:\${process.env.PORT}/openapi\`,
        );
        await import("./index");
      }
      else if (cluster.isPrimary) {
        const config = {
          workers: Math.max(
            1,
            Math.min(
              Number(process.env.CLUSTER_WORKERS) || os.availableParallelism(),
              os.availableParallelism(),
            ),
          ),
          restartDelay: Number(process.env.CLUSTER_RESTART_DELAY) || 1000,
          maxRestarts: Number(process.env.CLUSTER_MAX_RESTARTS) || 5,
          restartWindow: Number(process.env.CLUSTER_RESTART_WINDOW) || 60000,
        } as const;

        let restartCount = 0;
        let windowStart = Date.now();
        let isShuttingDown = false;

        for (let i = 0; i < config.workers; i++) cluster.fork();

        cluster.on("exit", (worker, code, signal) => {
          logger.error(
            \`[cluster] worker \${worker.process.pid} exited (\${signal ?? \`code \${code}\`})\`,
          );

          if (isShuttingDown || worker.exitedAfterDisconnect) return;

          const now = Date.now();
          if (now - windowStart > config.restartWindow) {
            restartCount = 0;
            windowStart = now;
          }

          if (++restartCount > config.maxRestarts) {
            logger.error(
              \`[cluster] circuit breaker tripped (\${restartCount} restarts), shutting down\`,
            );
            isShuttingDown = true;
            Object.values(cluster.workers!).forEach((w) => w?.kill("SIGTERM"));
            return;
          }

          setTimeout(() => {
            const worker = cluster.fork();
            logger.info(\`[cluster] worker restarted, pid: \${worker.process.pid}\`);
          }, config.restartDelay);
        });

        const shutdown = (signal: NodeJS.Signals) => {
          logger.info(\`[cluster] \${signal} received, shutting down…\`);
          isShuttingDown = true;
          Object.values(cluster.workers!).forEach((w) => w?.kill("SIGTERM"));
          process.exitCode = 0;
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        logger.info(
          \`[cluster] workers: \${config.workers}\\n server http://localhost:\${port}/openapi\`,
        );
      }
      else {
        await import("./index");
      }
    })();
  `;
}
