import { dedent } from "ts-dedent";

export function getAppIndex(): string {
  return dedent`
    import { Elysia } from "elysia";
    import plugins from "@/app/plugins/index.plug";

    const app = new Elysia().use(plugins).listen(process.env.PORT!);

    export type APP = typeof app;
  `;
}
