# 全球创投与科技展会情报追踪平台 - 需求拆解文档

## 产品概述

- **产品类型**: 商业情报追踪 Web 应用
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 投资研究员、创业者、科技行业从业者、AI 大赛选手
- **核心价值**: 一站式聚合全球顶级 PE/VC 投资动态与国际科技展会参展信息，提供结构化目录与实时时间线视图
- **界面语言**: zh-CN
- **主题偏好**: light
- **导航模式**: 路径导航
- **导航布局**: Topbar（面向行业研究者/公众的信息聚合平台，非内部 CRUD 后台）

---

## 页面结构总览

> **说明**：此表为页面生成的唯一数据源。核心诉求围绕"查看投资动态"与"查看展会信息"两个独立任务流，加上首页概览，共 3 个一级页面。详情页作为二级页面从列表页进入。

| 页面名称 | 文件名 | 路由 | 页面类型 | 入口来源 |
|---------|-------|------|---------|---------|
| 情报概览 | `HomePage.tsx` | `/` | 一级 | 导航 |
| 投资事件库 | `InvestmentsPage.tsx` | `/investments` | 一级 | 导航 |
| 投资详情 | `InvestmentDetailPage.tsx` | `/investments/:id` | 二级 | 投资事件库 → 列表项点击 |
| 科技展会 | `ExposPage.tsx` | `/expos` | 一级 | 导航 |
| 展会详情 | `ExpoDetailPage.tsx` | `/expos/:id` | 二级 | 科技展会 → 列表项点击 |

---

## 页面布局建议

- **布局模式**: 左右分栏（主内容区 + 右侧/左侧筛选侧边栏）—— 用户需要在浏览列表的同时按机构/赛道/时间等维度快速过滤，FilterAside 是核心交互
- **视觉重心**: 列表 + 时间线 —— "历史动态"和"目录逐级查看"要求信息以时间轴或层级列表形式呈现，而非纯表格
- **结果承载区**: 
  - 首页：最近动态 Feed 流 + 核心统计卡片；初始态为 mock 示例数据
  - 投资页：可折叠的树形目录（按机构→赛道→企业）+ 时间线视图切换；初始态为分类骨架屏
  - 展会页：展会卡片网格 + 参展企业列表；初始态为展会封面占位图

---

## 插件规划

本需求核心为"监听/获取外部平台数据"，属于真实数据获取场景，但当前无对应官方 AI 插件可直接调用（无专门的"私募股权数据API插件"或"CES参展商爬取插件"）。因此**本版本不规划 real-plugin**，数据来源统一走 `demo-mock`（作为 MVP 展示）+ `real-api` 预留接口模式。若后续接入飞书多维表格存储抓取结果，再新增 `feishu-bitable` 插件实例。

> ⚠️ 注意：用户提到的"监听"本质是数据获取需求，但当前工具链无匹配插件，不能强行用 `ai-search-summary` 替代（搜索结果≠结构化投融资数据）。此处诚实声明为 demo-mock + API 预留，避免旁路插件铁律。

---

## 导航配置

- **导航布局**: Topbar
- **导航项**（仅一级页面）:

| 导航文字 | 路由 | 图标(可选) |
|---------|------|-----------|
| 情报概览 | `/` | Home |
| 投资事件 | `/investments` | TrendingUp |
| 科技展会 | `/expos` | Calendar |

---

## 数据来源声明

| 数据/操作 | 来源类型 | 实现要求 | mock 兜底 |
|---|---|---|---|
| 投资事件列表 | demo-mock | src/data/investments.ts const，包含 IDG/红杉中国等机构的模拟投资记录，每条含 source: 'mock' | ✅ 本身就是 mock（MVP 阶段无真实 API） |
| 展会及参展企业列表 | demo-mock | src/data/expos.ts const，包含 CES 等展会及中国参展企业模拟数据，每条含 source: 'mock' | ✅ 本身就是 mock |
| 最近动态 Feed | demo-mock | 从 investments + expos mock 数据中按日期排序取最新 10 条合并展示 | ✅ 基于上述 mock 衍生 |
| 目录树结构 | demo-mock | 前端根据 investments mock 数据按 institution → sector → company 三级分组计算生成 | ✅ 基于上述 mock 衍生 |
| 收藏/关注条目 | local-persist | localStorage key=__global_vc_expo_favorites，存储用户收藏的投资事件ID或展会ID数组 | 无 |
| 真实数据获取（预留） | real-api | 预留 src/api/vcDataApi.ts fetch 封装，接口地址待对接（如 PitchBook/Crunchbase API 或自建爬虫服务）；当前未启用，UI 层通过 dataSource flag 切换 mock/api | 失败时 fallback 到 demo-mock + toast 提示"实时数据暂不可用，展示示例数据" |

> 🔴 自检：用户说"监听"但未给具体 API URL / 未上传文件 / 未提 AI 识别，且当前无匹配官方插件 → 不能声明为 real-plugin / real-file。声明为 demo-mock + real-api 预留是最小可用方案，符合 MVP 原则。

---

## 功能列表

- **页面/区块**: 情报概览 (`HomePage.tsx`)
  - **页面目标**: 让用户 5 秒内掌握最新创投与展会动态全貌
  - **功能点**:
    - **最新动态 Feed 流**: 按时间倒序混合展示投资事件与展会资讯，每条卡片含机构Logo/展会Badge + 标题 + 时间戳 + 来源标签；点击跳转对应详情页
    - **核心统计卡片行**: 展示"近30天投资事件数""活跃机构TOP3""即将举办展会数""中国参展企业数"4 个 KPI，数据从 mock 聚合计算
    - **快捷入口导航**: 提供"按机构浏览""按赛道浏览""按展会浏览"3 个快捷按钮，点击跳转至对应列表页并预置筛选条件

- **页面/区块**: 投资事件库 (`InvestmentsPage.tsx`)
  - **页面目标**: 支持用户按目录逐级下钻或按时间线浏览投资动态
  - **功能点**:
    - **双视图切换**: 提供"目录视图"（Tree 组件，机构→赛道→企业三级可折叠）与"时间线视图"（垂直 Timeline 按日期分组）一键切换，共享同一份筛选后数据
    - **多维度筛选 FilterAside**: 左侧 FilterAside 含投资机构多选、赛道多选、时间范围选择器、搜索框；筛选状态同步更新 URL query，刷新不丢失
    - **投资条目卡片**: 每个条目展示被投企业名、轮次、金额、日期、机构Tag；hover 显示摘要，点击进入详情页
    - **收藏操作**: 每个条目卡片右上角 Star 按钮，点击切换收藏状态（写 localStorage），已收藏条目在 FilterAside 中有专属"只看收藏"开关

- **页面/区块**: 投资详情 (`InvestmentDetailPage.tsx`)
  - **页面目标**: 展示单笔投资的完整上下文
  - **功能点**:
    - **结构化信息展示**: 分区展示交易基本信息、投资方介绍、被投企业业务描述、关联投资轮次
    - **相关条目推荐**: 底部展示同机构/同赛道的其他投资条目（从 mock 数据过滤）
    - **返回列表面包屑**: 顶部面包屑导航，保留用户之前的筛选状态（从 URL query 恢复）

- **页面/区块**: 科技展会 (`ExposPage.tsx`)
  - **页面目标**: 浏览全球科技展会及中国企业参展情况
  - **功能点**:
    - **展会卡片网格**: 按时间排序展示展会卡片，含封面图、名称、日期、地点、参展中国企业数量 Badge
    - **参展企业查询**: 每个展会卡片展开或点击后显示该展会下的中国参展企业列表（表格形式，含企业名、展位号、业务领域）
    - **展会筛选 FilterAside**: 按展会类型（消费电子/AI/汽车等）、地区、时间筛选

- **页面/区块**: 展会详情 (`ExpoDetailPage.tsx`)
  - **页面目标**: 展示单个展会的完整信息及参展商名录
  - **功能点**:
    - **展会基础信息区**: 展示展会简介、日程、官网链接、往届回顾
    - **参展企业可搜索表格**: 支持按企业名称/业务领域模糊搜索，表格分页展示
    - **收藏与分享**: 收藏按钮 + 复制链接按钮（navigator.clipboard）

---

## 数据共享配置

| 存储键名 | 数据说明 | 使用页面 |
|---------|---------|---------|
| `__global_vc_expo_favorites` | 用户收藏的条目ID集合，类型为 `IFavoriteItem[]` | 投资事件库、科技展会、情报概览 |
| `__global_vc_expo_filters` | 上次使用的筛选条件缓存，类型为 `IFilterState` | 投资事件库、科技展会 |

```ts
interface IFavoriteItem {
  /** 条目唯一标识 */
  id: string;
  /** 条目类型：投资事件 or 展会 */
  type: 'investment' | 'expo';
  /** 收藏时间戳 */
  favoritedAt: number;
}

interface IFilterState {
  institutions?: string[];
  sectors?: string[];
  dateRange?: [string, string];
  keyword?: string;
}

-------

<scene_type>prototype-app</scene_type>

# UI 设计指南

## 1. 设计推导依据

- **参考意图**: Free Direction —— 无参考材料，从“全球资本流动监测”语义自主推导视觉语言
- **核心情绪 / 应用类型**: 专业、敏锐、高信噪比的金融情报工具，兼顾数据密度与阅读节奏
- **独特记忆点**: “资本脉搏”视觉母题——用精密网格+微光节点表达资金流向，替代通用图表堆叠

## 2. Art Direction

- **方向名**: Precision Intel Grid
- **Design Style**: Swiss Minimalist + Terminal Precision —— 瑞士排版的秩序感承载高密度信息，终端级精度强化“监听/追踪”工具属性
- **DNA 参数**: rounded-sm / shadow-none / gap-4 p-6 / 等宽数字+无衬线中文 / 1px 细分隔线+状态点阵
- **应用类型**: Tool / Data Monitor —— 左侧目录导航+右侧动态流+顶部筛选器三栏结构

## 3. Color System

**色彩关系**: 深墨蓝基底 + 冷银灰信息层 + 琥珀金主行动色，构建“暗夜监控台”沉浸感
**配色设计理由**: primary 琥珀金仅用于最新投资事件高亮、CTA与活跃态；bg/card/textMuted 构成三级灰阶保障长时间阅读不疲劳；accent 极浅蓝灰承接hover/focus避免干扰数据焦点
**主色推导**: 琥珀金(hsl(38 90% 55%))取自金融终端经典高亮色，比红色克制、比蓝色醒目，精准锚定“关键资本动向”而非泛泛强调
**使用比例**: 70% 深墨中性 / 20% 冷银辅助 / 10% 琥珀金primary；严禁表格行、边框、次要按钮使用primary

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|---|---|---|---|---|
| bg | `--background` | `bg-background` | hsl(220 20% 8%) | 深墨蓝基底，降低眩光 |
| card | `--card` | `bg-card` | hsl(220 18% 12%) | 数据卡片容器，比bg浅4% |
| text | `--foreground` | `text-foreground` | hsl(210 20% 92%) | 主信息文字，冷银白 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(215 15% 55%) | 时间戳、来源、辅助标签 |
| primary | `--primary` | `bg-primary` / `text-primary` | hsl(38 90% 55%) | 最新事件高亮、主CTA、激活tab |
| primaryForeground | `--primary-foreground` | `text-primary-foreground` | hsl(220 20% 8%) | primary上文字，复用bg色保证对比 |
| accent | `--accent` | `bg-accent` | hsl(215 20% 18%) | hover/focus底、选中行、skeleton |
| accentForeground | `--accent-foreground` | `text-accent-foreground` | hsl(210 20% 80%) | accent上文字，弱于text |
| border | `--border` | `border-border` | hsl(215 15% 22%) | 1px分隔线，比accent暗4% |

**语义色提示**: 
成功(新投资确认): bg hsl(150 60% 40%) / border hsl(150 60% 50%) / text hsl(150 70% 70%)，饱和度与primary对齐±10%
警告(数据延迟): bg hsl(45 85% 45%) / border hsl(45 85% 55%) / text hsl(45 90% 75%)，色温偏暖但不抢primary
错误(源失效): bg hsl(0 70% 45%) / border hsl(0 70% 55%) / text hsl(0 80% 75%)，明度压低避免刺眼

## 4. 字体与节奏

- **font-display**: Space Grotesk —— 机械感几何字形强化“监测工具”精密气质，数字等宽特性利于金额/日期对齐
- **font-body**: Noto Sans SC —— 中文正文清晰可读，与Space Grotesk x-height匹配，混排不跳行
- **字号**: H1 text-3xl font-bold tracking-tight；H2 text-xl font-medium；body text-sm leading-relaxed；muted text-xs uppercase tracking-wider
- **圆角**: rounded-sm (2px) —— 保持网格锐利感，卡片/按钮/输入框统一，避免圆润削弱专业度

## 5. 全局布局契约

- **Reference Layout Use**: 按需求结构推导：左侧可折叠目录树(机构/展会分类)+右侧时间轴动态流+顶部全局筛选器
- **Page / Section Order**: 首页=最新动态流；二级页=机构详情页/展会参与企业列表；三级页=单笔投资/单家企业详情
- **Standard Content Zone**: max-w-[1400px] mx-auto，适配多列数据表格与并排卡片
- **Shell / Frame Alignment**: 内容容器与左侧导航独立滚动，右侧主区域sticky header固定筛选器
- **Padding & Rhythm**: px-6 py-6，卡片间距gap-4，表格行高h-12，严格8px倍数
- **Full-bleed Zones**: 仅顶部全局搜索栏全宽，内容区始终受max-w约束
- **Local Narrowing**: 企业详情页正文区max-w-3xl居中，避免长文本阅读过宽
- **Overflow Strategy**: 投资组合表格、展会企业列表使用overflow-x-auto + min-w-[800px]，不换行压缩
- **Flexibility Boundary**: 移动端目录树收起为抽屉，卡片改为单列；桌面端保持三栏；圆角/主色/阴影语言不变

## 6. 视觉与动效

- **装饰**: 1px细分隔线 + 状态点阵(● ○ ◐)表达数据活性
- **阴影/边界**: shadow-none，全靠border与bg色差分层；卡片hover时border-color过渡到accent
- **动效**: 克制——新事件入场fade-up 200ms；hover/focus背景色transition 150ms；目录展开height ease-out 250ms；无自动轮播/粒子/渐变流动

## 7. 组件原则

- 所有交互元素:focus-visible ring-2 ring-primary/50 offset-2，键盘可达性优先
- Primary Button仅用于“订阅提醒”“导出报告”；Secondary Outline用于筛选器；Ghost用于目录项与表格操作
- 空状态用textMuted图标+文案，不用插画；加载态用accent色skeleton，高度与实际内容一致
- 时间轴节点用1px border-left + 状态点阵，不用彩色竖线或大圆点

## 8. Image Direction

- **Image Role**: 无强制图片需求，优先通过排版、色彩和点阵图形建立视觉记忆点
- **Image Art Direction**: 若未来需Hero图，采用抽象数据拓扑线稿+琥珀金光点，深墨蓝底，无具象人物/建筑
- **Image Prompt Keywords**: abstract data topology, amber light nodes, dark navy background, minimal line art, financial network visualization, no people, no buildings, precision grid, terminal aesthetic
- **Image Avoidance**: 禁止商务握手剪影、地球仪连线、股票K线图、模糊科技感渐变；所有视觉必须服务“资本流向追踪”语义

## 9. Anti-patterns

- **Split personality**: 动态流用深色、详情页突然切浅色；全站锁定同一套Dark Precision Grid系统
- **Phantom tokens**: 编造--chart-gold等未定义变量；图表色直接用语义色提示中的HSL值
- **Default SaaS drift**: 回退到蓝色主按钮、圆角xl卡片、紫粉渐变标题；坚守琥珀金+直角网格+深墨基底
- **Invisible interaction**: 表格行hover有底色但focus-visible丢失；每个可点击单元格必须含ring状态
- **Mono-hue tyranny**: 琥珀金铺满表格高亮行、按钮、icon、链接；primary仅限最新事件标记与主CTA，其余交由accent/textMuted
- **Status color drift**: 成功绿比amber更饱和刺眼；所有语义色明度压至45-55%区间，与primary视觉权重平衡