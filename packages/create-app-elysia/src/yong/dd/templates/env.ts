import type { PreferencesType } from "../../../types";

export function getDDEnv(prefs: PreferencesType): string {
  const dbType = prefs.database;
  const lines: string[] = [
    "PORT=3000",
    `DATABASE_TYPE="${dbType.toLowerCase()}"`,
  ];

  if (dbType === "SQLite") {
    lines.push('DATABASE_URL="sqlite.db"');
  } else {
    const defaultPort = dbType === "MySQL" ? "3306" : "5432";
    const defaultUser = dbType === "MySQL" ? "root" : "postgres";
    lines.push(
      `DATABASE_HOST="localhost"`,
      `DATABASE_PORT="${defaultPort}"`,
      `DATABASE_NAME="${prefs.projectName}"`,
      `DATABASE_USER="${defaultUser}"`,
      `DATABASE_PASSWORD="${prefs.meta.databasePassword}"`,
    );
    if (dbType === "MySQL") {
      lines.push(
        'DATABASE_URL="mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"',
        'DATABASE_SHADOW_URL="mysql://${DATABASE_USER}_shadow:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}_shadow"',
      );
    } else {
      lines.push(
        'DATABASE_URL="postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"',
      );
    }
  }

  lines.push("");
  lines.push("# 集群配置");
  lines.push("# CLUSTER_ENABLED=true");
  lines.push("# CLUSTER_WORKERS=4");
  lines.push("# CLUSTER_RESTART_DELAY=1000");
  lines.push("# CLUSTER_MAX_RESTARTS=5");
  lines.push("# CLUSTER_RESTART_WINDOW=60000");

  if (prefs.redis) {
    lines.push("");
    lines.push("# Redis");
    lines.push('REDIS_URL="redis://localhost:6379"');
  }

  return lines.join("\n") + "\n";
}
