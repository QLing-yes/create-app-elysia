/**
 * 文件操作工具函数
 * 封装 Node.js fs 模块，提供统一的文件操作接口
 */

import fs from "node:fs/promises";
import path from "node:path";

/**
 * 创建目录（如果不存在）
 * @param dirPath 目录路径
 */
export async function createOrFindDir(dirPath: string): Promise<void> {
  await fs.stat(dirPath).catch(async () => {
    await fs.mkdir(dirPath, { recursive: true });
  });
}

/**
 * 写入文件（自动创建目录）
 * @param filePath 文件路径
 * @param content 文件内容
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath);
  await createOrFindDir(dir);
  await fs.writeFile(filePath, content);
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 删除目录（递归）
 * @param dirPath 目录路径
 */
export async function removeDir(dirPath: string): Promise<void> {
  await fs.rm(dirPath, { recursive: true, force: true });
}

/**
 * 读取目录内容
 * @param dirPath 目录路径
 */
export async function readDir(dirPath: string): Promise<string[]> {
  return await fs.readdir(dirPath);
}

/**
 * 解析路径（相对于当前工作目录）
 * @param relativePath 相对路径
 */
export function resolvePath(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}

/**
 * 拼接路径
 * @param paths 路径片段
 */
export function joinPath(...paths: string[]): string {
  return path.join(...paths);
}
