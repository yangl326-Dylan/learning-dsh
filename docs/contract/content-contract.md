# 内容契约 Content Contract

> 状态: `approved` | 更新时间: 2026-08-14
> 本契约定义 learning-dsh 学习内容的**数据模型、组织方式与校验规则**。内容与渲染分离：渲染层只消费契约定义的结构化数据，不感知内容文件格式。

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-14 | 初始定稿：三层模型、双语内嵌（方案 A）、正文语言块约定、codeRefs/sourceRef |

---

## 1. 设计原则

| # | 原则 | 说明 |
|---|------|------|
| P1 | 内容与渲染分离 | 渲染层只消费契约数据，不感知内容文件格式 |
| P2 | 版本驱动 | 内容按 dsh 源码版本组织，版本切换 = 切换数据 |
| P3 | 知识单元 = 设计决策 | 章节由 decisions 组成：title / description / alternatives（为什么做 + 备选为何被否决） |
| P4 | 双语内嵌同一数据 | 每个可翻译字段内嵌 `zh` 变体，单一数据源 |
| P5 | 架构图独立成资源 | SVG 独立存放，正文与决策引用资源 id |
| P6 | 数量不设限 | 章节数、每章决策数由源码内容决定，无固定配额 |

## 2. 三层数据模型

```
Version（版本层）          ← 对应 dsh 源码版本，目前 v0.1.0-rc.5，未来增量
 └── Chapter（章节层）      ← 按 dsh 架构层次划分，数量由源码决定
      └── Decision（知识单元） ← 每章提炼的设计决策，数量由内容决定
```

### 2.1 Version

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 版本标识，稳定 ID，如 `v0.1.0-rc.5` |
| `label` | string | ✅ | 显示名，如 `0.1.0-rc.5` |
| `sourceRef` | object | ✅ | 源码锚点，见 2.4 |
| `status` | enum | ✅ | `complete` / `partial` / `planned` |
| `releasedAt` | string | ❌ | 版本发布时间，ISO 日期 |
| `chapters` | Chapter[] | ✅ | 该版本下的章节列表（含排序） |

### 2.2 Chapter

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 章节标识，如 `ch01` |
| `order` | number | ✅ | 章节顺序（1 起） |
| `title` | LocalizedText | ✅ | 章节标题 |
| `summary` | LocalizedText | ✅ | 章节概述（1-3 句，读哪些源码） |
| `topics` | string[] | ❌ | 本章涉及的源码范围描述 |
| `decisions` | Decision[] | ✅ | 知识单元列表（可为空数组） |
| `diagrams` | string[] | ❌ | 关联架构图资源 id 列表 |

### 2.3 Decision

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 稳定 ID，kebab-case，如 `everything-is-a-plugin` |
| `title` | LocalizedText | ✅ | 决策标题 |
| `description` | LocalizedText | ✅ | 为什么这样设计 |
| `alternatives` | LocalizedText | ✅ | 备选方案及被否决原因 |
| `codeRefs` | CodeRef[] | ❌ | 源码引用（文件 + 说明） |
| `diagram` | string | ❌ | 关联局部流程图资源 id |
| `insight` | LocalizedText | ❌ | 可选"提炼"：读完该记住什么 |

### 2.4 通用子结构

**LocalizedText（双语内嵌，方案 A）**

```yaml
title:
  en: Everything Is a Plugin
  zh: 一切皆插件
```

所有可翻译字段均为该结构：顶层 `en` + `zh`（未来可扩展 `ja` 等）。

**CodeRef（源码引用，文件 + 说明粒度）**

```yaml
codeRefs:
  - path: packages/boot/app-boot/src/index.ts
    note:            # LocalizedText
      en: Profile composition machinery
      zh: Profile 组合机制
```

**SourceRef（版本锚点）**

```yaml
sourceRef:
  type: commit      # 当前仅 commit；上游打 tag 后可升级为 tag
  sha: abe560f81e   # dsh 发布 commit
```

预留演进：`type: tag` + `tag: v0.1.0-rc.5`。升级规则见 spec-data-pipeline.md。

## 3. 正文语言块约定

章节正文为 Markdown 单文件 `body.md`，双语以内嵌锚点分块：

```markdown
# Chapter 1: Everything Is a Plugin

<!-- @locale:en -->
English prose here...
<!-- @locale:zh -->
中文正文……
```

规则：
- 语言块锚点必须是 `<!-- @locale:en -->` / `<!-- @locale:zh -->`，成对出现
- 渲染层按当前 locale 提取对应块渲染；缺失块视为内容错误（校验脚本拦截）
- 块内为合法 Markdown，支持代码围栏、列表、链接、图片（引用 `assets/` 下资源）

## 4. 内容目录结构

```
content/
  versions/
    <version-id>/
      version.yaml          # Version 元数据 + chapters 清单
      chapters/
        <chapter-id>/
          chapter.yaml      # Chapter 元数据 + decisions
          body.md           # 章节正文（语言块约定）
  assets/
    diagrams/               # 架构图 SVG 资源
```

组织原则：**按版本分层目录**。新增版本 = 新增 `versions/<new-version>/` 目录，旧版本目录不动——这是"版本切换"能力的文件系统基础。

## 5. 校验规则（草案）

| # | 规则 | 级别 |
|---|------|------|
| V1 | Version/Chapter/Decision 必填字段齐全 | error |
| V2 | 所有 LocalizedText 必须同时含 `en` 与 `zh` | error |
| V3 | `body.md` 语言块成对且覆盖所有已声明 locale | error |
| V4 | `sourceRef` 合法（type ∈ {commit, tag}，sha/tag 非空） | error |
| V5 | `codeRefs[].path` 指向存在文件（内容构建时校验） | warning |
| V6 | `diagrams`/`diagram` 引用的资源 id 存在于 assets 清单 | error |
| V7 | 章节 id / 决策 id 唯一且 kebab-case | error |

校验脚本实现见 spec-data-pipeline.md，与内容构建同一管线执行。

## 6. 契约边界

- **内容消费方**：前端渲染层（packages/web）与内容构建管线（scripts/）共同遵守本契约。
- **不在契约内**：UI 表现、路由结构、主题样式（属 spec-ui.md）；插件挂载行为（属 plugin-contract.md）。
