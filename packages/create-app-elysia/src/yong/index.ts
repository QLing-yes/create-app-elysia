/**
 * 用 - 统一导出
 * 根据模式路由到对应的编排器
 */

export { createStandalone } from "./standalone/index";
export { createNewMonorepo, addAppToMonorepo } from "./monorepo/index";
export { createDDProject } from "./dd/index";
