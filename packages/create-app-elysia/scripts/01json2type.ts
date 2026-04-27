import pkg  from './package.json'

Bun.write("src/dependency/package.json", JSON.stringify(pkg))

import { $ } from "bun";
await $`quicktype src/dependency/package.json -o src/dependency/types.ts`; // => "Hello, world!"
