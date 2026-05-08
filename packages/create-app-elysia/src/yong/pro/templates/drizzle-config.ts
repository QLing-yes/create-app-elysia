import { dedent } from "ts-dedent";

export function getDrizzleConfig(): string {
  return dedent`
    import { type Config, defineConfig } from "drizzle-kit";

    const DATABASE_TYPE = process.env.DATABASE_TYPE || "";
    const DATABASE_URL = process.env.DATABASE_URL!;

    export default defineConfig({
      schema: "./app/model/",
      out: \`./support/generated/drizzle/\`,
      dialect: DATABASE_TYPE as Config["dialect"],
      dbCredentials: { url: DATABASE_URL },
    });
  `;
}
