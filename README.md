# 🌐 全球创投与科技展会情报追踪平台

> **VC & Expo Intelligence** — 一站式聚合全球顶级 PE/VC 投资动态与国际科技展会参展信息

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📋 项目简介

面向投资研究员、创业者及科技行业从业者的商业情报追踪工具。实时聚合全球私募股权/风险投资动态与国际科技展会参展信息，提供结构化目录浏览与时间线视图双模式，支持多维度筛选与 AI 实时搜索。

## ✨ 核心功能

| 模块 | 功能描述 |
|------|---------|
| **情报概览** | 首页 5 秒掌握最新动态全貌 — 最近投资/展会 Feed 流 + 4 大核心 KPI 统计卡片 + 快捷入口导航 |
| **投资事件库** | 双视图切换（目录树 / 时间线），按机构→赛道→企业三级下钻，支持多维筛选与收藏 |
| **科技展会** | 全球展会卡片网格 + 中国参展企业查询，按类型/地区/时间筛选 |
| **AI 实时搜索** | 8 路并行 AI 搜索引擎，动态查询词覆盖投资 + 展会两大赛道，24h 智能缓存 |
| **详情深潜** | 投资/展会详情页 — 结构化信息 + 相关推荐 + 面包屑导航 + 收藏分享 |

## 🛠 技术栈

- **前端框架**: React 19 + TypeScript 5.9
- **样式系统**: Tailwind CSS 4 + shadcn/ui (New York 风格)
- **路由**: react-router-dom 7 (SPA 路径导航)
- **动画**: Framer Motion 12
- **图表**: ECharts 5 / Recharts
- **AI 能力**: 飞书妙搭 `ai-search-summary` 插件 (流式搜索)
- **构建工具**: Vite 8

## 🎨 设计理念

**Precision Intel Grid** — 瑞士排版的秩序感 × 终端级精度

- 深墨蓝基底 + 冷银灰信息层 + 琥珀金主行动色
- 1px 细分隔线 + 状态点阵表达数据活性
- 等宽数字 + 无衬线中文，保障长时间阅读不疲劳
- 克制动效：新事件 fade-up 200ms，hover 过渡 150ms

## 📁 项目结构

```
src/
├── components/          # 共享组件 (Header, Layout, UI)
├── data/                # 数据接口定义
├── hooks/               # 自定义 Hooks (useLiveFeed 等)
├── lib/                 # 工具函数
├── pages/
│   ├── HomePage/        # 情报概览首页
│   ├── InvestmentsPage/ # 投资事件库
│   ├── InvestmentDetailPage/ # 投资详情
│   ├── ExposPage/       # 科技展会
│   └── ExpoDetailPage/  # 展会详情
├── app.tsx              # 路由配置
└── index.tsx            # 入口文件
```

## 🚀 快速开始

本项目基于[飞书妙搭](https://www.miaoda.cn)平台构建，支持在线预览与一键发布。

```bash
# 克隆仓库
git clone https://github.com/tobyberry666/vc-expo-intelligence.git
cd vc-expo-intelligence

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📊 数据架构

- **实时数据**: 通过 `useLiveFeed` Hook 调用 8 路并行 AI 搜索引擎，动态生成查询词
- **智能缓存**: 24 小时 localStorage 缓存 + 手动刷新机制
- **持久化**: 用户收藏与筛选状态通过 `scopedStorage` 本地持久化

## 📄 License

[MIT](LICENSE) © 2026 [Toby_here](https://github.com/tobyberry666)
