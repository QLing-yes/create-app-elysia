import { dedent } from "ts-dedent";

export function getTestSubCtrl(): string {
  return dedent`
    export default (app: Ctrl) => app.get("/test", () => $g.success("test"));
  `;
}
