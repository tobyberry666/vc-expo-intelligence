# 全球创投与科技展会情报追踪平台

一站式聚合全球顶级 PE/VC 投资动态与国际科技展会参展信息，提供结构化目录与实时时间线视图。面向投资研究员、创业者、科技行业从业者的商业情报工具。

## 功能特性

- **情报概览** — 5 秒掌握最新创投与展会动态全貌，核心 KPI 统计卡片 + 最新动态 Feed 流
- **投资事件库** — 支持目录视图（机构→赛道→企业三级折叠）与时间线视图一键切换，多维度筛选
- **科技展会** — 全球科技展会卡片网格 + 中国参展企业查询，按类型/地区/时间筛选
- **多维筛选** — 投资机构、赛道、时间范围、关键词组合过滤，筛选状态同步 URL
- **收藏功能** — 投资事件 / 展会条目收藏，localStorage 持久化
- **AI 实时搜索** — 接入妙搭平台 AI 搜索插件，实时获取全球创投资讯

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS v4 |
| UI 组件 | shadcn/ui (New York 风格) |
| 图标 | lucide-react |
| 图表 | echarts-for-react |
| 动画 | framer-motion |
| 路由 | react-router-dom v7 |
| 表单 | react-hook-form + zod |

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/tobyberry666/vc-expo-intelligence.git
cd vc-expo-intelligence

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

启动后在浏览器打开终端提示的 localhost 地址即可访问。

> **注意**：本项目基于妙搭（MiaoDa）平台开发，AI 实时搜索等插件功能需在妙搭平台运行时中使用。本地开发时 UI 框架和页面结构可正常渲染，AI 搜索功能展示为示例数据。

## 项目结构

```
src/
├── app.tsx              # 路由配置
├── index.tsx            # 应用入口
├── index.css            # 全局样式 + 字体引入
├── tailwind-theme.css   # 主题配色变量
├── components/          # 共享组件
│   ├── Layout.tsx       # 全局布局（Topbar + Outlet）
│   ├── Header.tsx       # 顶部导航栏
│   ├── LiveIndicator.tsx # AI 实时数据指示器
│   └── ui/              # shadcn/ui 基础组件库
├── pages/               # 页面模块
│   ├── HomePage/        # 情报概览首页
│   ├── InvestmentsPage/ # 投资事件库
│   ├── InvestmentDetailPage/ # 投资详情
│   ├── ExposPage/       # 科技展会
│   ├── ExpoDetailPage/  # 展会详情
│   └── NotFoundPage/    # 404 页面
├── hooks/               # 自定义 Hooks
│   ├── useLiveFeed.ts   # AI 实时数据引擎
│   ├── useFavorites.ts  # 收藏管理
│   └── use-mobile.ts    # 响应式检测
├── data/                # 数据类型定义
│   ├── investments.ts   # 投资事件接口
│   └── expos.ts         # 展会数据接口
└── lib/                 # 工具函数
    ├── utils.ts         # cn() 等通用工具
    └── chart-colors.ts  # 图表配色常量

shared/
└── capabilities/        # 妙搭平台能力声明
```

## 页面说明

| 页面 | 路由 | 说明 |
|------|------|------|
| 情报概览 | `/` | 核心统计卡片 + 最新动态 Feed + 快捷导航入口 |
| 投资事件库 | `/investments` | 目录树/时间线双视图 + 多维度筛选 + 收藏 |
| 投资详情 | `/investments/:id` | 单笔投资完整信息 + 关联推荐 |
| 科技展会 | `/expos` | 展会卡片网格 + 参展企业查询 + 筛选 |
| 展会详情 | `/expos/:id` | 展会基础信息 + 参展企业可搜索表格 |

## 设计风格

- **Precision Intel Grid** — 瑞士极简排版 + 终端级精度
- **深墨蓝基底** + 冷银灰信息层 + 琥珀金主行动色
- **Space Grotesk** 标题 + **Noto Sans SC** 正文
- 1px 细分隔线 + 状态点阵，无厚阴影，全靠色差分层的暗色主题

## License

MIT
