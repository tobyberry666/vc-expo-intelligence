# 开发指南

## 环境

使用 `.nvmrc` 的 Node 24；npm 10+。本轮本地执行环境为 Windows、Node 26，CI 配置 Ubuntu/Windows Node 24，远端 CI 尚未触发。

```sh
npm ci --ignore-scripts
npm run dev
```

`--ignore-scripts` 避免安装第三方 lifecycle 脚本；Vite 和测试均采用锁文件中的已发布二进制依赖。项目 prepare 仅安装可选 Git hook，不作为质量保证，质量由命令与 CI 检查。

## 配置

复制 `.env.example` → `.env.local`，环境变量优先级高于文件；以下都是公开配置。

| 配置             | 默认      | 作用                                          |
| ---------------- | --------- | --------------------------------------------- |
| CLIENT_DEV_PORT  | 8001      | 整数 1–65535，严格端口                        |
| CLIENT_DEV_HOST  | 127.0.0.1 | 仅本机；确需局域网访问时显式设置              |
| CLIENT_BASE_PATH | /         | 静态构建绝对路径，例如 /vc-expo-intelligence/ |
| MIAODA_BUILD     | 未设置    | 设置为 1 时开发使用原平台预设                 |

PowerShell 示例：`$env:CLIENT_BASE_PATH='/vc-expo-intelligence/'; npm run build`。平台发布使用 `npm run build:platform`，由平台提供运行环境和权限。`.env.local` 被 Git 忽略，不得放入前端密钥：任何前端构建变量都有暴露风险。

## 修改流程

读相关模块和审计证据 → 用最小测试重现缺陷 → 修改 → 运行相关测试 → `npm run check` → 构建及浏览器验证。对 parser/store 优先纯函数和注入依赖，不在页面重新调用 SDK。只改任务必需的代码，保留原有 UI 模板，格式化门禁排除了历史页面与模板，避免无关重排。

新增供应商时实现 FeedProvider 并替换组合点；先建立契约测试。不得将虚构数据混入真实 feed。测试数据位于 tests/fixtures.ts，明确是合成记录。
