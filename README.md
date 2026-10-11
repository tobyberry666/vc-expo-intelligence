# 全球创投与科技展会情报

面向投资研究员、创业者和科技行业从业者，整理 PE/VC 融资事件与科技展会、中国参展企业信息。保留 React 前端与妙搭 AI 插件，采用模块化单体，无额外后台或数据库。

## 当前能力与边界

- 投资事件：机构 → 赛道 → 企业目录、时间线，机构/赛道/关键词/收藏筛选。
- 展会：类型、地区、关键词、排序及收藏筛选，详情日期范围与参展企业搜索、分页。
- 列表筛选与视图保存在 URL；返回、刷新和浏览器历史一致。
- 全页面共享一份情报与请求；24 小时新鲜缓存、失败时保留可用数据；最多保留 30 天旧缓存并尝试更新。
- 收藏仅存在当前浏览器，不是自动监控、消息订阅或跨设备同步。
- AI 搜索摘要和结构化条目需要人工核验；当前没有逐条原始来源链接。未知日期、地点和机构不会补造成事实。

**实时检索需要妙搭平台运行环境与插件授权。** 独立模式提供可部署的页面和已有本地缓存浏览，没有内置示例数据，也不会绕过平台权限获取实时数据。新浏览器无缓存时显示明确的运行环境提示。

## 快速开始

建议 Node.js 24 LTS、npm 10+（工程允许 Node 24–26）。

```sh
npm ci --ignore-scripts
npm run dev
```

浏览器打开终端显示的 `http://127.0.0.1:8001`。可复制 `.env.example` 为 `.env.local` 调整公开的路径和开发端口；不要加入真实密钥。端口占用时启动失败，不会结束其他程序。

```sh
npm run check                 # ESLint、覆盖率门禁、类型检查、独立构建、格式检查
node --test tests/audit-gate.test.mjs
npx playwright install chromium
npm run test:e2e              # 先 npm run build
npm run audit:check           # 联网扫描，明确的限期上游例外
npm run build:platform        # 妙搭产物 dist-platform/
npm run preview              # 静态产物 dist/ 的本地预览
```

## 工程文档

| 文档                          | 内容                              |
| ----------------------------- | --------------------------------- |
| [审计与路线图](docs/AUDIT.md) | 修改前的实际证据、优点与 P0/P1/P2 |
| [架构](ARCHITECTURE.md)       | 模块边界、数据流与设计取舍        |
| [开发](DEVELOPMENT.md)        | 初始化、配置和协作流程            |
| [测试](TESTING.md)            | 测试分层、覆盖范围与执行方法      |
| [部署](DEPLOYMENT.md)         | 静态/平台构建、子路径与回滚       |
| [安全](SECURITY.md)           | 威胁模型、扫描与残留风险          |
| [贡献](CONTRIBUTING.md)       | 最小变更和评审约定                |
| [变更](CHANGELOG.md)          | 本轮升级记录                      |

技术栈：React 19、TypeScript 5.9、Vite 8、Tailwind 4、Radix/shadcn、React Router 7、Zod、Vitest、Testing Library、Playwright。
