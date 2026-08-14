# 规格：整体架构 Architecture

> 状态: `approved` | 更新时间: 2026-08-14
> 关联: [content-contract.md](../contract/content-contract.md) · [plugin-contract.md](../contract/plugin-contract.md) · [feature-*.md](../feature/)

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-14 | 初始定稿：内容→构建→静态包→插件 serve→浏览器 数据流与模块边界 |

---

## 1. 架构概览

```
content/                    scripts/                  packages/web             packages/plugin
(版本化双语内容源)           (构建管线)                (Vite 静态前端)          (dsh Cordis 插件)
┌──────────────────┐   ┌────────────────────┐   ┌───────────────────┐   ┌──────────────────┐
│ versions/<ver>/  │   │ build-content.ts   │   │ public/data/*.json│   │ src/index.ts     │
│  version.yaml    │──▶│  校验 V1-V7        │──▶│ src/ (React 页面) │   │ inject httpServer│
│  chapters/<id>/  │   │ 拆分 body 语言块    │   │ dist/ (Vite build)│──▶│ register /learning│
│   chapter.yaml   │   │ 复制 diagrams      │   │                   │   │ serve dist       │
│   body.md        │   │                    │   │                   │   │                  │
│ assets/diagrams/ │   │                    │   │                   │   │                  │
└──────────────────┘   └────────────────────┘   └───────────────────┘   └──────────────────┘
        ▲ 构建时                                  ▲ 构建时                   │ 运行时
        └────────────── 内容源（唯一事实）─────────┘                          ▼
                                                                   浏览器 /learning 页面
```

**关键结论**：内容加载采用**构建时编译**（方案 1）——`content/` 在构建期编译为静态 JSON 嵌入 web 包，运行时零内容逻辑；版本切换 = 切换数据文件，非运行时拉取。

## 2. 模块边界

| 模块 | 职责 | 产出 | 消费方 |
|------|------|------|--------|
| `content/` | 版本化双语内容源（YAML + body.md + SVG） | 源文件 | 构建管线 |
| `scripts/build-content.ts` | 校验（契约 V1-V7）、拆分语言块、复制 diagrams、产出 JSON | `packages/web/public/data/` | 前端运行时 |
| `packages/web` | 静态学习页面（React + Vite + HashRouter） | `dist/` | 插件 serve |
| `packages/plugin` | Cordis 插件：注册 `/learning` 路由、解析并 serve dist | `lib/` | dsh 运行时 |
| `docs/` | contract/feature/spec 三级文档 | 文档 | 开发者 |
| `tests/` | （规划）管线与插件测试 | 测试 | CI |

## 3. 数据流

1. **编辑**：作者维护 `content/versions/<ver>/`（version.yaml、chapter.yaml、body.md、SVG）；
2. **构建**：`pnpm build:content` → 校验 → 拆分 `body.{en,zh}` → 生成 `index.json` / `versions/<ver>.json` / `chapters/<ver>/<id>.json`，复制 diagrams；
3. **前端构建**：`pnpm --filter @learning-dsh/web build` → `tsc --noEmit` + `vite build` → `dist/`（`public/data/` 一并打包）；
4. **插件加载**：dsh 运行时加载 `@dylan/learning-dsh` → `require.resolve('@learning-dsh/web')` 定位 dist → 注册 `/learning` prefix 路由 → 浏览器访问。

## 4. 设计约束

- **内容与渲染分离**：渲染层只消费契约 JSON，不感知 YAML/body.md 格式；
- **构建期校验**：内容错误在构建时失败（error 级），不流到运行时；
- **单一事实源**：`content/` 是内容的唯一事实源；前端数据只是编译产物，不可手改；
- **静态部署友好**：web 包为纯静态产物（`base: './'`），插件只做静态 serve，无 SSR 需求。