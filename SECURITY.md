# 安全约定与风险

## 威胁模型

这是浏览器情报工具。主要不可信输入是 AI/网络返回文本、平台结构化结果、URL 与浏览器存储；运行时权限由妙搭平台管理。当前没有自建 API、账号系统、数据库或多租户权限，不添加虚假的认证层。客户端不能安全存储服务密钥。

- Zod 验证类型、数组及字段长度；缓存年龄/版本/总尺寸检查；请求和流大小限制。
- 日期不猜测，摘要需要核验；保留 React 文本输出和默认 Markdown 安全处理，不把业务输入传给 raw HTML。
- 开发脚本删除 shell 拼接及杀端口进程逻辑，默认 loopback、严格端口。
- 存储失败降级到会话状态并提示；错误界面使用有限错误信息，业务层不输出原始摘要、Token 或堆栈。
- 独立运行时不打包平台认证/telemetry JavaScript；平台模式仍依赖其上游安全性和平台数据政策。
- .env* 忽略提交，仅公开示例。已审查当前跟踪代码和配置，未发现真实密钥；另对全部可达 Git 对象执行私钥、AWS、GitHub、OpenAI Token 特征扫描（187 个提交、127 个唯一 blob，零命中），报告见 docs/security/secret-scan.json；这仍不等于专业扫描或外部平台凭证审查。

## 依赖扫描

2026-10-11 初始 npm audit：37 项（4 critical、21 high、12 moderate）；最终扫描见 docs/security/audit-current.json。通过兼容更新、统一 React Router 7、CryptoJS 4、selector-parser 安全补丁、ECharts 6 补丁降低风险。CryptoJS 上游已废弃，保留它仅因为平台 SDK 仍依赖。

剩余两类叶子公告：braces GHSA-vfj7-8cjw-p6xm（开发平台预设，无修复版本）、OpenTelemetry core GHSA-8988-4f7v-96qf（平台 SDK 固定版本）。传播到多个父依赖的计数不是独立漏洞数量。限定例外记录在 docs/security/exceptions.json，2026-11-11 到期；`npm run audit:check` 拒绝新公告及过期例外。门禁允许例外不代表 npm audit 清零或风险已经消失。

不得向开发服务器开放公网或处理不可信 glob 输入；平台 telemetry 使用环境须经供应商确认。发布前复查这些风险，若不接受则暂停平台发布，等待 SDK 修复或按契约替换其依赖，不能直接强制大版本更新。

## 报告安全问题

请使用仓库 GitHub Security 的私密漏洞报告功能（若维护者尚未启用，先联系维护者建立私密渠道），不要在公开 issue 上传凭证或用户数据。本轮不代替用户开启账号设置，也未配置未经确认的收件地址。

部署需 HTTPS、SPA rewrite 与适当响应头。平台模式的 CSP 必须依据真实插件与平台域名测试后设置；未提供未经验证的限制性 CSP。请求取消只能阻止本地等待，供应商可能继续执行/计费。来源溯源、SDK 修复、完整秘密扫描及真实运行时安全测试为剩余发布条件。
