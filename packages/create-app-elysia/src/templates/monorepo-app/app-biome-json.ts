/**
 * Monorepo App biome.json 模板
 */

export function getMonorepoAppBiomeConfig(): string {
  return JSON.stringify(
    {
      $schema: "https://biomejs.dev/schemas/2.2.3/schema.json",
      extends: ["../../biome.json"],
    },
    null,
    2
  );
}
