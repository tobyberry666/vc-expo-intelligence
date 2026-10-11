# Changelog

## Unreleased — 2026-10-11

### Reliability

- 拆分共享 feed service/provider/parser/cache/store，消除逐页面重复检索。
- 搜索与整体请求超时、取消、过期结果保护、有限并发和限流退避。
- 空白/全失败不写空成功；失败保留数据并提示；批量提取减少重复调用。
- 修复融资公司正则、空列错位、日期伪造、展会范围丢失和多轮融资误去重。
- 稳定路由身份及可验证的旧缓存/收藏迁移；收藏同步与会话降级。
- URL 筛选与历史一致；详情读共享数据；未知日期显示安全，参展企业搜索无结果有反馈。

### Engineering and Security

- 可复现 npm 锁文件、跨平台开发启动，两种可执行构建。
- Vitest/Testing Library、覆盖率门禁、Playwright、ESLint/TypeScript/Prettier。
- GitHub Actions 双系统检查、浏览器根/子路径验证、只读权限和 SHA 固定；Dependabot。
- 移除开发 shell 拼接/杀进程行为，默认 loopback；依赖兼容修补、限期安全公告门禁。
- 重写真实能力说明及架构、开发、测试、部署、安全、贡献文档。

尚未发布 tag、推送远端、部署生产环境或验证平台真实检索。
