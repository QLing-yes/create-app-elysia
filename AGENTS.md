# 项目
请参考package.json确定技术栈。

# 规则
代码准则：极致性能、高复用性、高可读性、易维护，逻辑嵌套≤3 层，分区分块编写
语法规范：优先使用let、禁用var；不可变对象用const；函数不使用const声明
规范：所有入参、返回值、字段、函数，必须通过/** */添加 JSDoc 注释
格式：合理换行，代码精简无冗余

# 流程步骤

## 1. 初始化
- 调用 `logger.banner()` 显示 CLI 启动横幅
- 横幅包含标题 `create-app-elysia` 和版本号
- 打印空行分隔

## 2. 同步模板（可选失败）
- 调用 `updateTemplateFolder()` 异步执行
- 从远程仓库 `git@github.com:QLing-yes/ElysiaTemplate.git` 的 `template` 分支克隆到临时目录
- 遍历临时目录中的子目录，复制到本地 `template/` 文件夹
- 克隆完成后删除临时目录和 `.git` 目录
- **失败处理**：同步失败时仅 warn，不中断主流程

## 3. 加载配置
- 调用 `config.loadConfig()` 或 `config.loadConfigFile()` 加载配置
- 支持的配置文件位置：
  - `.elysia-apprc`
  - `.elysia-apprc.json`
  - `.elysia-apprc.js`
  - `elysia-app.config.js`
  - `elysia-app.config.mjs`
- 配置结果缓存到 `_cached`，后续调用直接返回缓存

## 4. 收集参数

### 4.1 获取模板列表
- 调用 `getTemplateDirs()` 读取 `template/` 下所有子目录
- 子目录名称即模板名称，按字母排序
- 构建选择项 `SELECTION_CHOICES` 供用户选择

### 4.2 询问项目名称
- 调用 `askProjectName(nameArg)`
- 若命令行传入名称直接使用
- 否则调用 `@inquirer/prompts` 的 `input` 组件
- 默认值：`my-elysia-app`
- 校验规则：`^[a-z0-9][a-z0-9-]*$`（小写字母、数字、连字符，不能以连字符开头）

### 4.3 询问模板选择
- 调用 `askSelection(selectOpt)`
- 若命令行传入 `--select` 直接使用并校验有效性
- 否则调用 `@inquirer/prompts` 的 `select` 组件

## 5. 冲突检测
- 调用 `fsu.exists(projectDir)` 检查目标目录是否存在
- 目标目录 = `process.cwd() + 项目名称`
- **目录已存在时**：
  - 若有 `--force` 或 `--yes` 标志：直接调用 `fsu.removeDir()` 删除
  - 否则调用 `confirm` 询问用户，否的话打印 `已取消` 并 `process.exit(0)`

## 6. 摘要确认
- 调用 `logger.divider()` 打印分隔线
- 显示 `名称: xxx` 和 `模板: xxx`
- 再打印分隔线
- 若无 `--yes` 标志：调用 `confirm` 询问确认，默认 true
- 用户选择否时打印 `已取消` 并退出

## 7. 克隆仓库
- 调用 `git.cloneRepo()` 克隆到 `projectDir`
- 仓库地址：`fileConfig.template ?? git.DEFAULT_REPO`（默认 `https://github.com/QLing-yes/ElysiaTemplate.git`）
- 克隆 `main` 分支，shallow clone（depth=1）
- **失败处理**：克隆失败时删除目标目录，打印错误信息并退出
- **重试机制**：最多重试 3 次，指数退避（1s, 2s, 4s）

## 8. 应用模板
- 调用 `fsu.applyTemplates()`
- 模板根目录：`__dirname + /../template`
- 将选择的模板子目录内容复制到项目根目录
- 调用 `invokeTemplateConfig()` 执行模板下的 `_config.js`（若有）
- `_config.js` 默认导出函数接收 `{ projectDir, templateName }` 参数

## 9. 后处理操作
- 调用 `runOperations()`
- 默认操作列表：`['updateName']`
- **updateName**：读取项目目录下的 `package.json`，更新 `name` 字段为项目名称
- 操作失败时仅 warn，不中断后续操作

## 10. 完成提示
- 打印分隔线
- 显示成功信息：`项目 xxx 已就绪！`
- 打印下一步指引（根据模板不同而不同）
- 默认指引：
  ```
  cd <projectName>
  bun install
  bun dev
  ```

## 11. 清理
- 调用 `fs.emptyDir(templateRoot)` 清空本地 `template/` 文件夹