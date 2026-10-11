# 可靠性升级实施计划

目标：保留当前核心产品，消除审计确认的 P0 并实施可验证 P1。遵循用户授权，本次在独立 checkout 内顺序实施，小范围提交；高风险产品变化留待确认。

1. 工程基线：修复 scripts、锁文件，加入 Vitest/Testing Library/Playwright、Prettier、CI。验证：clean install、lint、tsc、build、预览路径。
2. 数据边界：`src/features/feed/{types,parsers,identity,cache}.ts`，先测试坏结构/日期/表格空列/稳定 ID/同公司多轮融资，再最小修复。schema 消费 unknown，输出 LiveInvestmentItem/LiveExpoItem；旧 hook 保留类型导出。
3. 请求边界：`provider.ts` 只调用已声明 additional_keywords；`service.ts` 管理并发、限流重试、超时、提取及部分失败。先测试供应商契约、全失败、挂起、取消、重复合并，再实现。
4. 状态边界：`store.ts` + `useLiveFeed.ts` 共享请求/内存/缓存，generation 保护过期请求；收藏共享 store 校验存储、迁移下标 ID。验证多个消费者、StrictMode、刷新失败、存储失败、跨页详情。
5. 页面回归：URL 作为筛选真值源，日期显示安全，详情引用共享 feed；只触及业务所需组件。验证路由返回、过滤、收藏、参展商分页、未知 ID、异常反馈。
6. 交付：README/架构/开发/测试/部署/安全/贡献/变更文档，安全扫描与剩余项。运行完整 npm run check、Playwright、npm audit 和 git diff --check；记录真实输出、覆盖率、提交，不宣称平台生产验证。

每个步骤执行 RED → 最小修复 → GREEN；配置和文档用实际命令校验。方案选择：前端模块化单体 + 平台/静态两种构建配置，避免无需求后台。详情永久可分享、真正订阅监控与供应商替换不在本轮承诺范围。
