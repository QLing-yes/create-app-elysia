/**
 * Monorepo turbo.json 模板
 */

export function getTurboJson(): string {
  return JSON.stringify(
    {
      $schema: "https://turborepo.org/schema.json",
      tasks: {
        build: {
          dependsOn: ["^build"],
          inputs: ["$TURBO_DEFAULT$", ".env*"],
          outputs: [".next/**", "!.next/cache/**"],
        },
        lint: {
          dependsOn: ["^lint"],
        },
        "check-types": {
          dependsOn: ["^check-types"],
        },
        dev: {
          cache: false,
          persistent: true,
        },
      },
    },
    null,
    2
  );
}
