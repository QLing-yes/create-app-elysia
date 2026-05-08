import { dedent } from "ts-dedent";

export function getBiomeJson(): string {
  return JSON.stringify(
    {
      $schema: "https://biomejs.dev/schemas/2.4.13/schema.json",
      vcs: {
        enabled: true,
        clientKind: "git",
        useIgnoreFile: true,
      },
      files: {
        ignoreUnknown: false,
      },
      formatter: {
        enabled: true,
        indentStyle: "space",
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          suspicious: {
            useIterableCallbackReturn: "off",
          },
          style: {
            noNonNullAssertion: "off",
          },
        },
      },
      javascript: {
        formatter: {
          quoteStyle: "double",
        },
      },
      assist: {
        enabled: true,
        actions: {
          source: {
            organizeImports: "on",
          },
        },
      },
    },
    null,
    2,
  );
}
