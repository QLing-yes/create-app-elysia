import { execSync } from 'node:child_process';

/**
 * @param {{ projectDir: string, templateName: string, packageManager?: string }} ctx
 */
export default function ({ projectDir, packageManager = 'bun' }) {
  const pmCmd = getPmCommands(packageManager);

  const cmd1 = `${packageManager} ${pmCmd.add} prismabox@1.1.26 @prisma/adapter-mariadb@7.6.0 @prisma/client@7.6.0`;
  const cmd2 = `${packageManager} ${pmCmd.addDev} prisma@7.6.0`;

  try {
    execSync(cmd1, { cwd: projectDir, stdio: 'inherit' });
    execSync(cmd2, { cwd: projectDir, stdio: 'inherit' });
  } catch (err) {
    console.warn(`_config.js 执行失败: ${err.message}`);
  }
}

/**
 * @param {string} pm
 * @returns {{ add: string, addDev: string }}
 */
function getPmCommands(pm) {
  const commands = {
    bun:   { add: 'add',       addDev: 'add -d' },
    npm:   { add: 'install',   addDev: 'install -D' },
    pnpm:  { add: 'add',       addDev: 'add -D' },
    yarn:  { add: 'add',       addDev: 'add -D' },
  };
  return commands[pm] ?? commands.bun;
}
