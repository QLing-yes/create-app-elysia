import { dedent } from "ts-dedent";

export function getTestSubSubCtrl(): string {
  return dedent`
    export default (app: Ctrl) => app.get("/test", () => "test");
  `;
}
