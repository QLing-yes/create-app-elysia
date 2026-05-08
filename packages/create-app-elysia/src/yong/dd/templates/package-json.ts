import { dedent } from "ts-dedent";
import type { PreferencesType } from "../../../types";

export function getDDPackageJson(prefs: PreferencesType): string {
  const dbDriver = getDriverPackage(prefs.database, prefs.driver);
  const scripts = getScripts(prefs);
  const deps = getDependencies(prefs, dbDriver);
  const devDeps = getDevDependencies(prefs);

  return JSON.stringify(
    {
      name: prefs.projectName,
      version: "0.0.0",
      type: "module",
      scripts,
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  );
}

function getDriverPackage(db: string, driver: string): string | null {
  if (db === "MySQL") return "mysql2";
  if (db === "PostgreSQL") {
    if (driver === "node-postgres") return "pg";
    if (driver === "Postgres.JS") return "postgres";
    return null; // Bun.sql no extra dep
  }
  return null; // SQLite uses Bun built-in
}

function getScripts(prefs: PreferencesType): Record<string, string> {
  const s: Record<string, string> = {
    dev: "bun --parallel run watch_generate_script watch_dev",
    "start-hot": "NODE_ENV=production bun --hot ./app/cluster.ts",
    "start-hot-bg": "NODE_ENV=production bun --hot --background ./app/cluster.ts",
    fix: "bunx --bun @biomejs/biome check --write .",
    watch_dev: "bun --watch ./app/cluster.ts",
    watch_generate_script: "bun ./support/script/index.ts watch",
    generate: "bun --parallel 'generate_*'",
    generate_script: "bun ./support/script/index.ts",
    drizzle_studio: "bun --bun run drizzle-kit studio",
    "generate_drigrate_migrate":
      "bun --bun run drizzle-kit generate && bun --bun run drizzle-kit migrate",
  };

  if (prefs.withMenu) {
    s.menu = "bun ./support/script/menu.ts";
  }

  if (prefs.formatter === "eslint") {
    s["lint:fix"] = "eslint . --fix";
  }

  return s;
}

function getDependencies(prefs: PreferencesType, dbDriver: string | null): Record<string, string> {
  const deps: Record<string, string> = {
    elysia: "^1.4.28",
    "@elysiajs/eden": "^1.3.0",
    "@elysiajs/openapi": "^1.3.0",
    "@elysiajs/static": "^1.3.0",
    "drizzle-orm": "^0.45.0",
    "drizzle-typebox": "^0.2.0",
  };

  if (dbDriver === "mysql2") deps.mysql2 = "^3.14.0";
  if (dbDriver === "pg") deps.pg = "^8.16.0";
  if (dbDriver === "postgres") deps.postgres = "^3.4.0";

  // Plugin dependencies
  for (const plugin of prefs.plugins) {
    const name = plugin.toLowerCase().replace(/\s+/g, "-");
    if (name === "oauth-2.0") deps["elysia-oauth2"] = "^2.1.0";
    else if (name === "html/jsx") deps["@elysiajs/html"] = "^1.3.0";
    else if (name === "server-timing") deps["@elysiajs/server-timing"] = "^1.3.0";
    else if (name === "autoload") deps["elysia-autoload"] = "^1.7.0";
    else if (name === "logger") deps["@bogeychan/elysia-logger"] = "^0.1.0";
    else deps[`@elysiajs/${name}`] = "^1.3.0";
  }

  if (prefs.redis) deps.ioredis = "^5.7.0";

  return deps;
}

function getDevDependencies(prefs: PreferencesType): Record<string, string> {
  const dev: Record<string, string> = {
    "@biomejs/biome": "^2.2.0",
    "bun-types": "^1.3.0",
    "drizzle-kit": "^0.31.0",
    typescript: "^5.9.0",
  };

  if (prefs.database === "PostgreSQL" && prefs.driver === "node-postgres") {
    dev["@types/pg"] = "^8.15.0";
  }

  if (prefs.husky) {
    dev.husky = "^9.1.0";
  }

  return dev;
}
