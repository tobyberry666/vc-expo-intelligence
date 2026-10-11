# 本轮升级验收报告

日期：2026-10-11。基线 main：4376eab01cdd7c705ec74bb9f0c532ccff00293c。执行位置：独立 checkout `vc-expo-intelligence/`，分支 `codex/reliability-upgrade`。保留创投与展会情报定位，无生产数据改动或发布操作。

## 1. 审计和架构前后

原项目已有可保留的列表、目录/时间线、详情和收藏 UI，平台插件配置集中；主要风险是混合约 900 行的数据 Hook、每页独立请求、下标身份、缓存不校验及缺失构建/测试入口。完整基线、优势、P0/P1/P2 证据见 [AUDIT](AUDIT.md)。

本轮采用适合规模的前端模块化单体：页面 → Hook → 共享 store → service → provider → runtime/SDK；parser/date/identity 负责纯转换，cache 负责数据验证。保留页面 sections 和平台预设，无微服务、后台数据库或额外认证。[架构对比和初学者流程](../ARCHITECTURE.md)。

## 2. 实际完成的改进与功能

| 范围       | 已完成行为                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 数据正确性 | 修复融资公司正则、表格空列错位、按公司误去重、日期伪造、展会结束日期丢失；未知值诚实展示       |
| 外部边界   | 校正 additional_keywords 契约；搜索45s/提取30s/整体180s期限；大小、数组和流分片上限            |
| 请求可靠性 | 3并发，限流有限退避重试，取消、StrictMode共享请求、generation保护；全失败/空白输出不缓存成功   |
| 数据恢复   | Zod校验v3/v4缓存、明确旧数据上限，刷新失败保留结果、持久化失败保留会话并提示                   |
| 身份与收藏 | 内容身份、不同融资轮次分别保留；只迁移可验证旧ID，确认迁移持久化；多实例及跨标签同步           |
| 页面       | URL筛选/视图与历史一致；详情/相关投资/参展商读取共享内存；返回保留参数；键盘导航与未知日期安全 |
| 运行       | 修复缺失build入口，跨平台Vite启动；默认loopback，严格端口，不拼shell命令、不杀其他进程         |
| 部署       | 独立静态与平台两种构建；子路径一致；独立模式无平台SDK认证/telemetry JS                         |
| 工具       | 自动化测试、覆盖率、lint/type/format门禁、只读CI及固定Actions SHA、Dependabot和限期安全门禁    |

核心功能得到补全和纠错；未增加真正实时通知、永久数据归档、云端收藏、时间范围筛选或来源溯源。界面“跟踪”只是收藏，不代表持续监控。

## 3. 设计理由与兼容性

仅在供应商、loader、storage边界注入依赖，避免DI框架。Zod消费unknown，不靠类型断言信任网络或缓存。身份采用可逆规范化内容编码，避免下标串联与短哈希碰撞；没有上游永久ID，内容纠正仍可能改变身份。老hook类型与缓存读取导出保留，详情改读共享状态。

静态构建与平台构建分开，既保留妙搭能力注册，又避免静态部署注入平台模板。SDK无传输AbortSignal，取消只能停止本地等待并尽力关闭流，远端执行/计费无法保证停止。投资提取按200k批次合并，正常小响应只调用一次，避免放大成本。

## 4. 实际测试结果

执行环境：Windows，Node26.3.0/npm11.16.0。最终锁文件干净安装成功；首次因本次预览进程占用原生模块而失败，关闭确认的本次进程后重新安装成功，未结束其他进程。

| 执行                                              | 结果                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| npm ci --ignore-scripts                           | 成功，945包安装                                                                      |
| npm run check                                     | exit0；ESLint、51项Vitest、4项Node工具测试、3份tsconfig、独立build、Prettier全部通过 |
| npm run build:platform                            | exit0，生成dist-platform                                                             |
| npm run test:e2e，根路径                          | 5/5 Chromium通过，命令exit0，服务器自行关闭                                          |
| CLIENT_BASE_PATH=/vc-expo-intelligence/ 构建及E2E | 5/5通过，exit0                                                                       |
| npm run audit:check                               | exit0，两个已记录且未到期的上游公告获限期例外；原生npm audit仍exit1                  |
| git diff --check / staged diff --check            | 通过                                                                                 |
| CI/Dependabot YAML                                | js-yaml解析成功；Actions三个固定SHA经GitHub API验证存在                              |

核心feature模块与两个业务Hook：语句92.71%、行95.32%、分支83.69%、函数93.26%；门禁为语句/行/函数80%、分支75%。这不是整个UI的覆盖率。51项覆盖解析、身份、缓存、竞态、取消、SDK契约/超时/限流、收藏、URL与详情回归；4项工具测试覆盖安全例外/期限及开发端口；E2E使用合成数据。

独立复核提出四处缺陷（流deadline、会话收藏、迁移持久化、空白搜索），均先运行失败测试，再修复并通过。追加流清理异常测试也完成RED→GREEN。未删除或弱化断言。最终CI未推送触发，不宣称GitHub远端运行成功；平台真实检索也未测试。

## 5. CI、运行和发布

[Quality workflow](../.github/workflows/ci.yml)：Ubuntu/Windows Node24质量与平台构建，Ubuntu Chromium根/子路径测试、安全门禁和报告归档；无自动生产发布。Node24 CI尚待远端首次运行。

```sh
npm ci --ignore-scripts
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run build:platform
```

静态产物dist需要SPA rewrite与HTTPS；平台产物dist-platform依赖妙搭运行环境/授权。静态无缓存时明确提示平台要求，无内置模拟数据。[部署、回滚及配置](../DEPLOYMENT.md)。

## 6. 安全改进与剩余风险

npm audit从37项（4critical/21high/12moderate）降至15项（0critical/11high/4moderate）。兼容修补CryptoJS、selector-parser、ECharts并统一Router版本，未audit --force。剩余是braces开发预设与OpenTelemetry平台SDK两个叶子公告，传播到多个父包。例外2026-11-11到期，新公告及过期例外都会失败；不是零漏洞认证。

所有可达Git对象特征扫描：187提交/127唯一blob，私钥、AWS/GitHub/OpenAI Token规则零命中，不打印值；并非专业秘密扫描。前端不存储真实服务密钥，存储/网络输入有schema与尺寸边界，错误不暴露原始摘要或凭证。

[安全约定](../SECURITY.md)及security/内保留报告。SDK仍有上游安全和隐私风险，是否接受必须在发布前评审；静态模式排除SDK JS不能修复平台模式。AI摘要不能自动作为权威投资数据。

## 7. 未完成项和后续路线

| 优先级       | 剩余项/验收                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| P0发布条件   | 平台测试租户真实能力授权、返回格式、限流、成本/配额；依赖残留接受或SDK修复，例外到期前处理           |
| P1           | 远端首次Node24双系统CI；逐条来源链接/核验时间/可信度；专业秘密与运行时安全扫描                       |
| P2           | 首屏JS约884kB（gzip271kB）仍有bundle警告，按路由延迟加载；其他浏览器与全面可访问性；明确日期过滤需求 |
| 可选产品方向 | 经许可数据供应商、服务端归档和永久分享、通知、导出、跨设备收藏；需产品/成本/权限决策                 |

详情只对应当前浏览器数据，不是永久事件数据库；已验证旧收藏可保留身份但事件离开当前feed后不能打开历史详情。收藏无备份和云同步，清除浏览器数据会丢失。保留旧分类可能早于整体刷新时间，已有明确未更新提示，后续可补逐条时间。未部署Nginx、Docker或生产服务器，部署示例不等于实测。

## 8. 提交与修改文件

- 0f51923：记录审计基线与路线图。
- 762ac3a：可靠性代码、兼容构建、安全边界与回归测试（68文件）。
- 65f679e：CI、工程文档与安全证据（14文件）。
- 本报告在独立验收记录提交中；最终提交可用git log查看。

本地分支保留，无远端推送/PR、合并或生产发布。变更范围如下（含本报告），未修改父工作区原项目：

- `.env.example`
- `.github/dependabot.yml`
- `.github/workflows/ci.yml`
- `.gitignore`
- `.nvmrc`
- `.prettierignore`
- `.prettierrc.json`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `DEPLOYMENT.md`
- `DEVELOPMENT.md`
- `README.md`
- `SECURITY.md`
- `TESTING.md`
- `docs/AUDIT.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/security/audit-baseline.json`
- `docs/security/audit-current.json`
- `docs/security/audit-gate-result.json`
- `docs/security/exceptions.json`
- `docs/security/secret-scan.json`
- `e2e/app.spec.ts`
- `eslint.config.mjs`
- `index.html`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `scripts/check-audit.mjs`
- `scripts/dev.mjs`
- `scripts/run-browser-tests.mjs`
- `src/components/Header.tsx`
- `src/components/Layout.tsx`
- `src/components/LiveIndicator.tsx`
- `src/features/favorites/store.ts`
- `src/features/feed/async.ts`
- `src/features/feed/cache.ts`
- `src/features/feed/dates.ts`
- `src/features/feed/identity.ts`
- `src/features/feed/parsers.ts`
- `src/features/feed/provider.ts`
- `src/features/feed/queries.ts`
- `src/features/feed/service.ts`
- `src/features/feed/store.ts`
- `src/features/feed/types.ts`
- `src/hooks/useFavorites.ts`
- `src/hooks/useLiveFeed.ts`
- `src/index.tsx`
- `src/infrastructure/runtime.ts`
- `src/infrastructure/standalone-runtime.tsx`
- `src/pages/ExpoDetailPage/ExpoDetailPage.tsx`
- `src/pages/ExpoDetailPage/sections/ExhibitorTableSection.tsx`
- `src/pages/ExpoDetailPage/sections/ExpoInfoSection.tsx`
- `src/pages/ExposPage/ExposPage.tsx`
- `src/pages/ExposPage/sections/ExpoGridSection.tsx`
- `src/pages/HomePage/HomePage.tsx`
- `src/pages/HomePage/sections/RecentFeedSection.tsx`
- `src/pages/HomePage/sections/StatsCardsSection.tsx`
- `src/pages/InvestmentDetailPage/InvestmentDetailPage.tsx`
- `src/pages/InvestmentDetailPage/sections/InvestmentInfoSection.tsx`
- `src/pages/InvestmentDetailPage/sections/RelatedInvestmentsSection.tsx`
- `src/pages/InvestmentsPage/InvestmentsPage.tsx`
- `src/pages/InvestmentsPage/sections/InvestmentTimelineSection.tsx`
- `src/pages/InvestmentsPage/sections/InvestmentTreeSection.tsx`
- `src/vite-env.d.ts`
- `tests/async.test.ts`
- `tests/audit-gate.test.mjs`
- `tests/cache.test.ts`
- `tests/dates.test.ts`
- `tests/dev-script.test.mjs`
- `tests/favorites-store.test.ts`
- `tests/favorites.test.tsx`
- `tests/feed-hook.test.tsx`
- `tests/feed-store.test.ts`
- `tests/fixtures.ts`
- `tests/identity.test.ts`
- `tests/pages.test.tsx`
- `tests/parsers.test.ts`
- `tests/service.test.ts`
- `tests/setup.ts`
- `tsconfig.node.json`
- `tsconfig.test.json`
- `vite.standalone.config.ts`
- `vitest.config.ts`
- `docs/UPGRADE_REPORT.md`
