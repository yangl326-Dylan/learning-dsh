# 功能：中英双语 i18n

> 状态: `approved` | 更新时间: 2026-08-14
> 关联契约: [content-contract.md](../contract/content-contract.md) §2.4 LocalizedText · [spec-ui.md](../spec/spec-ui.md)

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-14 | 初始定稿：UI 文案与内容双语分离、locale 记忆 |

---

## 1. 目标

页面支持 **中文 / English** 切换。两种文本来源，两条独立机制：

- **UI chrome**（按钮、标签、导航等界面框架文字）→ 前端内置词典；
- **内容**（章节标题、正文、决策卡片）→ 数据层 `LocalizedText { en, zh }`，构建时已按 locale 拆分。

## 2. 用户故事

- 作为中文读者，我打开页面默认看到中文内容与中文界面；
- 作为英文读者，我点击 EN 切换，内容与界面全部切换为英文；
- 我刷新页面后语言选择被记住。

## 3. 关键行为

| 行为 | 说明 |
|------|------|
| 切换入口 | Header 中 locale 按钮（`中` / `EN`），点击切换 |
| 默认语言 | `zh`（首次访问无记忆时） |
| 记忆持久化 | `localStorage` key `learning-dsh:locale`；`<html lang>` 同步更新 |
| 内容双语 | `LocalizedText` 双字段；正文 `body.md` 语言块构建时已拆分为 `body.en` / `body.zh` |
| 词典 | `src/i18n.tsx` 中 `ui` 词典：`en` / `zh` 两组 UI 字符串，`useLocale()` 提供 `t` |

## 4. 验收标准

- [ ] 默认语言为中文（无 localStorage 记忆时）
- [ ] 切换 EN/中后，Header、Home、章节页、决策卡片文案全部切换
- [ ] 刷新页面后语言保持
- [ ] 内容双语完整性由构建管线保证（契约 V2/V3 校验缺 en/zh 即 error）

## 5. 边界与约束

- 路线采用 **HashRouter**，locale 不影响 URL 路径（与 learn_opencode 的 `/en/` `/zh/` 路径路由不同，hash 方案更简单且插件只需 serve 单一路径）；
- 架构图 SVG 以英文为主（技术图形语言），不做双语渲染；
- 词典与内容分离：新增界面文案只改 `src/i18n.tsx`，不触碰内容。