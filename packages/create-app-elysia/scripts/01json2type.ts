import pkg  from './package.json'

Bun.write("src/ti/dependency/package.json", JSON.stringify(pkg))

import { $ } from "bun";
await $`quicktype src/ti/dependency/package.json -o src/ti/dependency/types.ts`; // => "Hello, world!"
