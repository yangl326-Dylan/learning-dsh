# 功能：章节阅读体验 Reading

> 状态: `approved` | 更新时间: 2026-08-14
> 关联契约: [content-contract.md](../contract/content-contract.md) §2.2/§2.3 · [spec-ui.md](../spec/spec-ui.md)

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-14 | 初始定稿：正文渲染、决策卡片、架构图、明暗主题 |

---

## 1. 目标

章节页提供专注的阅读体验：**正文叙述**（markdown）+ **设计决策卡片**（为什么/备选/洞察/代码引用）+ **架构图**，并在暗色/亮色主题下均可读。

## 2. 用户故事

- 作为读者，我在章节页读完正文后，在侧栏看到本章提炼的设计决策卡片，理解"为什么这样设计"与"备选方案为何被否决"；
- 我想查看某个决策对应的源码位置 → 卡片提供 `codeRefs`（文件路径 + 说明）；
- 我想用架构图快速建立整体认知 → 正文下方渲染关联 SVG；
- 我偏好暗色界面，且希望切换被记住。

## 3. 关键行为

| 行为 | 说明 |
|------|------|
| 正文渲染 | `body.md` 语言块构建时拆分为 `body.en` / `body.zh`，前端用内置轻量 Markdown 渲染器渲染（标题/段落/代码/列表/链接，HTML 转义防注入） |
| 决策卡片 | 侧栏（桌面）/ 正文下方（移动端）渲染 `decisions[]`：title、description、alternatives（"为什么"/"备选方案"）、insight（"洞察"高亮块）、codeRefs（monospace 路径） |
| 架构图 | `diagrams[]` 引用的 SVG 从 `data/diagrams/<name>.svg` 渲染，正文之后展示 |
| 阅读指引 | `topics[]` 展示为"阅读指引"代码列表（该读哪些源码文件） |
| 章节导航 | 章节底部 prev/next 导航，按当前版本的章节顺序 |
| 主题 | 暗色默认，`[data-theme="light"]` 亮色；CSS 变量驱动；localStorage 记忆 |

## 4. 验收标准

- [ ] 章节页加载对应版本的章节 JSON，正文/决策/图全部渲染
- [ ] 决策卡片三要素齐全（description / alternatives / codeRefs），insight 有高亮视觉区分
- [ ] 架构图正常显示（`data/diagrams/` 下 8 张 SVG 均有效，构建时已校验）
- [ ] 暗/亮主题切换即时生效且被记忆
- [ ] 章节 id 非法或数据缺失时显示"未找到"，不崩溃
- [ ] Markdown 渲染转义 HTML（`<script>` 等原样显示，不执行）

## 5. 边界与约束

- 用轻量自研 Markdown 渲染器，不引入 marked 等依赖（内容子集可控）；
- 卡片与正文分栏：桌面 `grid-template-columns: 1fr 360px`，窄屏降为单列；
- 主题默认 dark（站点暗色优先，light 可选），与 learn_opencode 风格一致。