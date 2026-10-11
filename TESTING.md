# 测试与质量保障

## 分层

| 层            | 工具                         | 重点                                                                       |
| ------------- | ---------------------------- | -------------------------------------------------------------------------- |
| 单元          | Vitest                       | 日期精度/非法日期、ID、Markdown 空列、结构化输出、缓存及迁移               |
| 服务集成      | Vitest                       | SDK 参数契约、无响应/到期流、全失败、空白输出、提取批次                    |
| 状态/页面回归 | Testing Library              | 多消费者、StrictMode、竞态、存储失败、收藏同步、路由筛选、详情内存数据     |
| 浏览器        | Playwright Chromium          | 构建后真实页面、筛选、旧详情链接、刷新、展会名单、移动导航、异常缓存和 404 |
| 安全门禁      | Node test + npm audit        | 未知公告失败、过期例外失败、无效报告失败                                   |
| 静态          | ESLint、TypeScript、Prettier | src、测试、构建配置；保留未修改模板格式                                    |

## 命令

```sh
npm run test
npm run test:coverage
node --test tests/audit-gate.test.mjs
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
npm run audit:check
npm run build:platform
```

覆盖率门禁：核心 `features/**/*.ts` 与两个业务 Hook，语句/函数/行 ≥80%，分支 ≥75%；不是全站 UI 覆盖率。报告在 coverage/。当前部分 timer/retry/未识别文本路径仍未覆盖，见报告，不能声称全面测试。

浏览器使用合成 v3 缓存，不发起真实平台调用，不使用生产数据。验证子路径需以同一个 CLIENT_BASE_PATH 环境构建和启动预览，再运行测试；CI 分别执行根路径与 /vc-expo-intelligence/。

CI 已配置但本轮未推送，没有真实远端 CI 成功结论；平台构建成功只证明编译，不等于妙搭运行时授权、真实供应商返回格式、成本或生产环境已验证。发布前应在平台测试账号验证正常检索、429/权限错误、用量和格式。浏览器测试只覆盖 Chromium，其他浏览器属于后续工作。

`npm run test:e2e` 由脚本直接创建 Vite 预览服务器，测试结束关闭自身服务器，不依赖 Windows shell 的进程树清理，也不会终止占用 4173 端口的其他程序。若端口已占用，明确失败。直接运行 Playwright 时也可设置 PLAYWRIGHT_EXTERNAL_SERVER=1 使用自己启动的预览服务器。
