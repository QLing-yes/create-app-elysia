import { Preferences } from "./src/utils/preferences";
import * as tpl from "./src/yong/pro/templates";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

const dir = join(import.meta.dirname, "..", "test-dd");

function w(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log("Wrote:", path.replace(dir, ""));
}

const prefs = new Preferences();
prefs.projectName = "test-dd";
prefs.database = "MySQL";
prefs.driver = "MySQL 2";
prefs.orm = "Drizzle";
prefs.plugins = ["Swagger", "CORS"];
prefs.redis = true;
prefs.clusterEnabled = true;
prefs.withMenu = true;

w(join(dir, "package.json"), tpl.getProPackageJson(prefs));
w(join(dir, "tsconfig.json"), tpl.getProTsConfig());
w(join(dir, ".gitignore"), tpl.getProGitignore());
w(join(dir, "bunfig.toml"), tpl.getProBunfig());
w(join(dir, ".env"), tpl.getProEnv(prefs));
w(join(dir, "biome.jsonc"), tpl.getBiomeJson());
w(join(dir, "drizzle.config.ts"), tpl.getDrizzleConfig());
w(join(dir, "app/index.ts"), tpl.getAppIndex());
w(join(dir, "app/cluster.ts"), tpl.getClusterFile());
w(join(dir, "app/common/index.ts"), tpl.getCommonIndex());
w(join(dir, "app/common/schemas.ts"), tpl.getSchemas());
w(join(dir, "app/common/schemaDerive.ts"), tpl.getSchemaDerive());
w(join(dir, "app/lib/drizzle.ts"), tpl.getDrizzleLib(prefs));
w(join(dir, "app/lib/logger.ts"), tpl.getLogger());
w(join(dir, "app/lib/error.ts"), tpl.getErrorLib());
w(join(dir, "app/lib/redis.ts"), tpl.getRedisLib());
w(join(dir, "app/utils/file.ts"), tpl.getFileUtils());
w(join(dir, "app/utils/watch.ts"), tpl.getWatchUtil());
w(join(dir, "app/utils/menu-ui.ts"), tpl.getMenuUI());
w(join(dir, "app/plugins/index.plug.ts"), tpl.getIndexPlug(prefs));
w(join(dir, "app/plugins/controller.plug.ts"), tpl.getControllerPlug());
w(join(dir, "app/plugins/macro.plug.ts"), tpl.getMacroPlug());
w(join(dir, "app/plugins/schemas.plug.ts"), tpl.getSchemasPlug());
w(join(dir, "app/model/post.mold.ts"), tpl.getPostMold());
w(join(dir, "app/model/user.mold.ts"), tpl.getUserMold());
w(join(dir, "app/controller/test.ctrl.ts"), tpl.getTestCtrl());
w(join(dir, "app/controller/test/test.ctrl.ts"), tpl.getTestSubCtrl());
w(join(dir, "app/controller/test/testsub/test.ctrl.ts"), tpl.getTestSubSubCtrl());
w(join(dir, "support/script/index.ts"), tpl.getScriptIndex());
w(join(dir, "support/script/routes.ts"), tpl.getRoutesGen());
w(join(dir, "support/script/batchExport.ts"), tpl.getBatchExport());
w(join(dir, "support/script/menu.ts"), tpl.getMenuScript());
w(join(dir, "support/types/global.d.ts"), tpl.getGlobalTypes());
w(join(dir, "test/client.ts"), tpl.getTestClient());

console.log("\nDone! All files generated at:", dir);
