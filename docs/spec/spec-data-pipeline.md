# 规格：内容管线 Data Pipeline

> 状态: `approved` | 更新时间: 2026-08-14
> 关联契约: [content-contract.md](../contract/content-contract.md) §5 校验规则 · [spec-architecture.md](./spec-architecture.md)

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-14 | 初始定稿：管线步骤、V1-V7 校验实现、新增版本端到端流程 |

---

## 1. 管线目标

把 `content/`（YAML + body.md + SVG）编译为前端消费的静态 JSON，并在编译期执行契约校验（V1-V7），保证**错误在构建时暴露**。

## 2. 管线步骤

```
scripts/build-content.ts
 1. 枚举 content/versions/*/  → 得到版本列表
 2. 读 version.yaml          → 校验 V1/V4
 3. 枚举 chapters/*/         → 读 chapter.yaml（校验 V1/V2/V7）
 4. 读 body.md               → 语言块拆分（V3）→ body.{en,zh}
 5. 校验 codeRefs 存在性     → V5（warning）
 6. 校验 diagrams 资源存在   → V6（对照 content/assets/diagrams/）
 7. 产出：
    public/data/index.json                      # 版本摘要 + 章节摘要
    public/data/versions/<ver>.json             # 版本元数据 + sourceRef
    public/data/chapters/<ver>/<chapterId>.json # 章节全量 + body 拆分
    public/data/diagrams/*.svg                  # 从 content/assets 复制
```

## 3. 校验规则实现（V1-V7）

| # | 校验 | 级别 | 实现位置 |
|---|------|------|----------|
| V1 | 必填字段齐全 | error | `validateVersion` / `validateChapter` |
| V2 | LocalizedText 同时含 en+zh | error | 遍历所有可翻译字段 |
| V3 | body.md 语言块成对且非空 | error | `parseBody`（`<!-- @locale:en -->` / `<!-- @locale:zh -->` 锚点正则） |
| V4 | sourceRef 合法（type/sha 非空） | error | `validateSourceRef` |
| V5 | codeRefs path 存在（相对 dsh 仓库） | warning | 存在性检查（不阻断） |
| V6 | diagrams 资源存在 | error | 对照 assets 清单 |
| V7 | id 唯一且 kebab-case | error | 集合去重 + 正则 |

校验失败：error 级以非零退出码终止构建；warning 级打印警告继续。

## 4. 添加新 dsh 版本的端到端流程

1. 在 dsh 仓库确认新版本 commit（`sourceRef.sha`）；
2. 新建 `content/versions/<new-ver>/`：写 `version.yaml`（含新 sourceRef）；
3. 按需新建/复用章节目录：每章 `chapter.yaml` + `body.md`（双语块）；
4. 更新 `content/assets/diagrams/`（如需新图）；
5. 重跑 `pnpm build:content` → 新版本 JSON 生成，旧版本 JSON 保留；
6. 前端零改动（数据驱动章节列表）。

## 5. sourceRef 升级规则

- 当前 `type: commit` + `sha`；
- 上游 dsh 发布正式 tag 后，可将 `type` 升级为 `tag` + `tag: vX.Y.Z`（V4 校验同步放宽：type=tag 时 tag 非空）；
- 一个版本内 `sourceRef` 只指向一个锚点（commit 或 tag），不混用；
- 内容描述的是**该锚点的精确代码**；上游 master 移动不影响已发布版本内容。

## 6. 约束

- 管线输出目录 `packages/web/public/data/` 为构建产物，**禁止手改**（纳入 .gitignore 决策待定：产物随包发布，故提交入库）；
- 校验规则与 content-contract.md §5 保持同步，契约变更须同步更新脚本；
- 管线为纯 Node 脚本（tsx 运行），无运行时依赖链。