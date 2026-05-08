import { dedent } from "ts-dedent";

export function getDDReadme(projectName: string): string {
  return dedent`
    # ${projectName}

    ## 项目结构

    > ⚠️ **注意**：Drizzle 相关文件已默认生成。

    - 全自动路由、日志系统、ORM、端到端类型安全，更多功能即将推出。

    \`\`\`
    Project/
    ├── app/
    │   ├── common/
    │   │   ├── index.ts          # 全局模块 ($g)
    │   │   ├── schemas.ts        # 数据模型
    │   │   └── schemaDerive.ts   # 数据模型派生类型
    │   ├── controller/           # 控制器层 (自动加载 *.ctrl.ts)
    │   ├── lib/
    │   │   ├── error.ts          # 全局错误捕获
    │   │   └── redis.ts          # Redis 客户端
    │   ├── model/                # Drizzle 数据模型
    │   ├── plugins/
    │   │   ├── controller.plug.ts # 控制器插件
    │   │   ├── macro.plug.ts      # 宏插件
    │   │   └── schemas.plug.ts    # 数据模型注册插件
    │   ├── utils/                # 工具函数
    │   └── index.ts              # 应用入口
    ├── support/                  # 辅助脚本目录
    │   ├── script/
    │   │   ├── index.ts          # 生成脚本
    │   │   ├── batchExport.ts    # 批量导出生成器
    │   │   └── routes.ts         # 路由生成工具
    │   └── types/
    │       └── global.d.ts       # 全局类型声明
    ├── test/                     # Eden 测试目录
    ├── bunfig.toml               # Bun 配置
    └── tsconfig.json             # TypeScript 配置
    \`\`\`

    ## 快速开始

    \`\`\`bash
    bun i
    bun run dev
    \`\`\`

    ## 命令

    \`\`\`bash
    bun run dev     # 启动开发服务器、自动生成路由
    bun run generate  # 运行全部 generate_ 开头的命令
    bun run generate_script  # 生成路由（一般不需要手动执行）
    \`\`\`
  `;
}
