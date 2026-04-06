import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const TEMPLATE_REPO = 'https://raw.githubusercontent.com/QLing-yes/ElysiaTemplate/main';

const REMOTE_FILES = [
  { name: 'README.md', filename: 'README.md' },
  { name: 'README-en.md', filename: 'README-en.md' },
];

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastErr;
}

/**
 * @param {string} url
 * @param {string} dest
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
async function downloadFile(url, dest, filename) {
  const res = await fetchWithRetry(url);
  const content = await res.text();
  await mkdir(dest, { recursive: true });
  await writeFile(path.join(dest, filename), content, 'utf8');
  return true;
}

/**
 * @param {string} dest
 * @returns {Promise<void>}
 */
async function downloadRemoteFiles(dest) {
  const results = await Promise.allSettled(
    REMOTE_FILES.map(({ name, filename }) =>
      downloadFile(`${TEMPLATE_REPO}/${name}`, dest, filename)
        .then(() => ({ name, success: true }))
        .catch(err => ({ name, success: false, err }))
    )
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { name, success, err } = result.value;
      if (success) {
        console.log(`✅ ${name} 已下载到根目录`);
      } else {
        console.warn(`⚠️ ${name} 下载失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      console.warn(`⚠️ 下载任务异常: ${result.reason}`);
    }
  }
}

export { downloadRemoteFiles };