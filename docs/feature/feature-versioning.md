# 功能：版本切换 Versioning

> 状态: `approved` | 更新时间: 2026-08-14
> 关联契约: [content-contract.md](../contract/content-contract.md) §2.1 Version · [spec-data-pipeline.md](../spec/spec-data-pipeline.md)

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-14 | 初始定稿：版本下拉、内容锁定 sourceRef、增量添加 |

---

## 1. 目标

学习页面展示 **dsh 指定源码版本** 的内容（章节 + 设计决策），并提供版本切换入口。内容与渲染分离：切换版本 = 切换数据，不重新渲染逻辑。

## 2. 用户故事

- 作为 dsh 使用者，我打开页面看到当前版本 `v0.1.0-rc.5` 的全部章节，我知道这些内容描述的是**哪一个 commit** 的代码。
- 当新版本发布后，我能在版本下拉中选择新版本，章节列表随之切换；旧版本内容不消失，仍可回看。
- 作为内容作者，我添加新版本 = 新增 `content/versions/<new-version>/` 目录并重新构建，前端零改动。

## 3. 关键行为

| 行为 | 说明 |
|------|------|
| 版本下拉 | Header 中显示版本选择器，列出 `index.json` 中全部版本；当前仅 `v0.1.0-rc.5`（`status: complete`） |
| 版本切换 | 选择版本后，Home 章节列表与章节页全部切换为对应版本数据 |
| 源码锚点 | 每个版本携带 `sourceRef`（`{ type: 'commit', sha }`），在 Home hero 区展示，向读者明确"内容指向的精确代码" |
| 增量添加 | 添加新版本 = 新增内容目录 + 重跑 `pnpm build:content`；旧版本 JSON 保留不动 |

## 4. 验收标准

- [ ] `index.json` 存在至少一个版本，Home 页展示该版本的章节卡片列表
- [ ] 版本选择器切换后，章节列表与章节页内容全部更新
- [ ] 章节页 badge 显示 `NN · <version.label>`，表明当前数据版本
- [ ] 版本列表为空时页面优雅降级（显示 loading/空态，不白屏）
- [ ] 数据缺失时（章节 JSON 不存在）显示"未找到"而非崩溃

## 5. 边界与约束

- 版本切换**不进入路由**（HashRouter 下版本状态放 context），避免 URL 因版本变化失效；
- 内容锁定 `sourceRef` commit，`type: tag` 预留演进（上游打 tag 后升级）；
- 未来版本可携带 `releasedAt`，UI 可选展示。