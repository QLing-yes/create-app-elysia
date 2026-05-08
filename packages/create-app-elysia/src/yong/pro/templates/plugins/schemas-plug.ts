import { dedent } from "ts-dedent";

export function getSchemasPlug(): string {
  return dedent`
    import { Elysia } from "elysia";
    import * as Schema from "@/app/common/schemas";

    export default new Elysia({ name: __filename }).model(Schema);
  `;
}
