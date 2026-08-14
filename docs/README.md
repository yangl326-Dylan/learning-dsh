# learning-dsh 文档索引

> learning-dsh：DeepSeek Harness (dsh) 插件的版本化双语源码学习页面。
> 仓库：https://github.com/yangl326-Dylan/learning-dsh · LICENSE: MIT

## 文档体系

本项目采用 **spec 驱动开发**：先契约（contract）、再功能（feature）、后规格（spec），实现与文档互为验证。

| 类型 | 职责 | 生命周期 |
|------|------|----------|
| **contract** | 不可违背的契约：数据结构、插件接口、校验规则 | draft → reviewed → **approved** → deprecated |
| **feature** | 用户可见功能：目标、用户故事、验收标准 | draft → reviewed → **approved** |
| **spec** | 实现规格：架构、管线、UI 设计 | draft → reviewed → **approved** |

变更流程：feature 变更 → 契约同步（如涉及）→ spec 更新 → 代码实现 → 验收标准核对。

## 文档清单

| 文档 | 一句话说明 |
|------|-----------|
| [contract/content-contract.md](contract/content-contract.md) | 内容数据模型（Version/Chapter/Decision）、双语内嵌、body.md 语言块、codeRefs/sourceRef、校验规则 V1-V7 |
| [contract/plugin-contract.md](contract/plugin-contract.md) | 插件包格式、Cordis 入口、httpServer 路由挂载、dist 解析、Config schema |
| [feature/feature-versioning.md](feature/feature-versioning.md) | 版本切换：版本下拉、内容锁定 sourceRef、增量添加 |
| [feature/feature-i18n.md](feature/feature-i18n.md) | 中英双语：UI 词典 + 内容 LocalizedText 双机制、locale 记忆 |
| [feature/feature-reading.md](feature/feature-reading.md) | 章节阅读：正文渲染、决策卡片、架构图、明暗主题 |
| [feature/feature-dsh-integration.md](feature/feature-dsh-integration.md) | dsh 集成：profile 安装、/learning 路由、与 web UI 共存 |
| [spec/spec-architecture.md](spec/spec-architecture.md) | 整体架构：内容→构建→静态包→插件→浏览器 数据流与模块边界 |
| [spec/spec-data-pipeline.md](spec/spec-data-pipeline.md) | 内容管线：校验实现、JSON 产出、新增版本端到端流程、sourceRef 升级规则 |
| [spec/spec-ui.md](spec/spec-ui.md) | UI 规格：组件树、HashRouter 路由、状态管理、主题、响应式 |

## 写作约定

- 默认中文撰写，关键英文技术术语保留原文（如 `mountPath`、`sourceRef`、`ctx`）；
- 文档模板：标题 + `状态/更新时间` 行 + 变更记录表 + 正文；
- 交叉引用用相对路径，如 `[content-contract.md](../contract/content-contract.md)`；
- 不设 ADR；重大架构决策沉淀在对应 spec 中。

## 仓库布局

```
content/            版本化双语内容源（YAML + body.md + SVG）
docs/               本目录（contract/feature/spec）
packages/web        Vite 静态前端（@learning-dsh/web）
packages/plugin     dsh Cordis 插件（@dylan/learning-dsh）
scripts/            内容构建管线（build-content.ts）
tests/              （规划）测试
```