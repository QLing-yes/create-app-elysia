import * as esbuild from 'esbuild';
import { downloadRemoteFiles } from './download.js';

await esbuild.build({
  // 
  // 1. 入口与输出配置（核心必填）
  // 
  entryPoints: ['src/index.js'],
  outfile: 'dist/index.js',
  outbase: '.',
  outExtension: { '.js': '.js' },
  allowOverwrite: true,

  // 
  // 2. 打包核心配置
  // 
  bundle: true,
  splitting: false,
  preserveSymlinks: false,

  // 排除依赖
  external: ['typescript', 'esbuild'],
  packages: 'bundle',
  alias: {},

  // 
  // 3. 平台与模块格式（你的核心配置）
  // 
  platform: 'node',
  format: 'esm',
  target: ['node18', 'es2022'],
  supported: {},
  globalName: '',

  // 
  // 4. 代码压缩与优化（生产环境）
  // 
  minify: true,
  minifyWhitespace: false,
  minifyIdentifiers: false,
  minifySyntax: false,
  treeShaking: true,
  drop: [],
  keepNames: false,
  charset: 'utf8',
  lineLimit: 0,

  // 
  // 5. 排除
  // 
  loader: {
    './template/**': 'empty',
    './dist/**': 'empty',
    './src/esbuild.js': 'empty',
    './src/download.js': 'empty',
  },
  resolveExtensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  mainFields: ['module', 'main', 'browser'],

  // 
  // 6. 调试与日志配置
  // 
  sourcemap: false, // 发布关闭sourcemap                    
  sourcesContent: true,
  legalComments: 'eof',
  logLevel: 'info',
  color: true,
  logLimit: 10,
  write: true,

  // 
  // 7. 全局变量与代码注入
  // 
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  pure: [],
  inject: [],
  // 🔥🔥🔥 关键修复：解决 ESM 不支持 require 的报错（终极修复）
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
  },
  footer: { js: '' },

  // 
  // 8. 高级配置
  // 
  metafile: false,
  tsconfig: '',
  publicPath: '',
  entryNames: '',
  chunkNames: '',
  assetNames: '',
  absWorkingDir: process.cwd(),
  plugins: [],

  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
});

downloadRemoteFiles(process.cwd());

console.log('✅ 打包完成！产物已生成到 dist/index.js');