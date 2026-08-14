# 规格：UI 规格 UI Spec

> 状态: `approved` | 更新时间: 2026-08-14
> 关联: [content-contract.md](../contract/content-contract.md) · [feature-i18n.md](../feature/feature-i18n.md) · [feature-reading.md](../feature/feature-reading.md)

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-14 | 初始定稿：组件树、路由、主题、数据消费 |

---

## 1. 技术选型

| 项 | 选择 | 理由 |
|----|------|------|
| 构建 | Vite 5 | 静态产物、`base: './'` 插件 serve 友好 |
| 框架 | React 18 | 组件化、生态成熟 |
| 路由 | react-router-dom v6 **HashRouter** | 插件只 serve 单一路径，hash 无服务端配合需求 |
| 样式 | 原生 CSS + CSS 变量 | 不引 Tailwind，主题经 `[data-theme]` 切换 |
| Markdown | 内置轻量渲染器 | 内容子集可控，避免依赖；HTML 转义防注入 |

## 2. 组件树

```
App
├── LocaleProvider (locale + ui 词典)
├── AppProvider    (versions + currentVersion 状态)
└── HashRouter
    ├── Header
    │   ├── brand (Link → /)
    │   ├── version-select (下拉, 数据来自 index.json)
    │   ├── locale toggle (中 / EN)
    │   └── theme toggle (☀ / ☾)
    ├── Routes
    │   ├── "/"          → HomePage
    │   │   ├── hero (tagline + 版本/sourceRef)
    │   │   └── chapter-cards (当前版本章节列表)
    │   └── "/:chapterId" → ChapterPage
    │       ├── chapter-main
    │       │   ├── header (badge + title + summary)
    │       │   ├── Markdown (body[locale])
    │       │   ├── diagrams (data/diagrams/*.svg)
    │       │   ├── topics (阅读指引)
    │       │   └── chapter-nav (prev/next)
    │       └── chapter-decisions (aside)
    │           └── DecisionCard[]
    └── footer
```

## 3. 路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| `#/` | Home | 版本章节卡片列表 |
| `#/<chapterId>` | Chapter | 章节页；chapterId 取当前版本 `chapters[].id` |

- 版本选择**不进路由**（context 状态）；切换版本后 `#/` 章节列表即变；
- 章节页在版本切换后重新拉取对应版本 JSON；
- 非法 chapterId → `getChapter` 返回 null → 显示"未找到"。

## 4. 状态管理

| 状态 | 载体 | 持久化 |
|------|------|--------|
| locale | `LocaleProvider` context | localStorage `learning-dsh:locale`（默认 zh） |
| theme | `useTheme`（Header 内） | localStorage `learning-dsh:theme`（默认 dark） |
| versions / currentVersion | `AppProvider` context | 无（数据来自 index.json fetch） |

数据消费：`src/data/loader.ts`（`getIndex` / `getVersion` / `getChapter`）用相对路径 `data/...` 拉取，失败返回 null 优雅降级。

## 5. 主题

- 默认 dark（`<html data-theme="dark">`），亮色经 `[data-theme="light"]` 覆盖 CSS 变量；
- 全部颜色走 CSS 变量（`--bg` / `--text` / `--accent` 等），组件不硬编码色值；
- 架构图 SVG 为暗色背景设计，暗色主题下原生融合（亮色下保留深色图底，可接受）。

## 6. 响应式

- 桌面（>900px）：章节页 `grid-template-columns: minmax(0,1fr) 360px`，决策卡片 sticky 侧栏；
- 窄屏：单列，决策卡片转正文下方，侧栏取消 sticky；
- Header 元素在窄屏保持单行（版本下拉 + 两个 icon 按钮）。

## 7. 验收

- `pnpm --filter @learning-dsh/web typecheck` 干净；
- `pnpm --filter @learning-dsh/web build` 产出 dist 无错；
- 数据缺失（未构建 content）时页面不白屏（loading/空态）；
- 主题、语言切换即时生效且持久化。