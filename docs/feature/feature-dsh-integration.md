# 功能：dsh 集成 Integration

> 状态: `approved` | 更新时间: 2026-08-14
> 关联契约: [plugin-contract.md](../contract/plugin-contract.md) · [spec-architecture.md](../spec/spec-architecture.md)

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.1 | 2026-08-14 | 更新：webserver 服务名双拼写自适应（`httpServer`/`webServer`），安装方式落地 bundle（`dsh plugin add`）与 `--patch` overlay 两种 |
| v1.0 | 2026-08-14 | 初始定稿：profile 安装、/learning 路由、与 dsh web UI 共存 |

---

## 1. 目标

learning-dsh 以 **dsh 插件**（Cordis 插件，`@dylan/learning-dsh`）形式运行在 dsh 运行时内，注册 `/learning` prefix 路由，向使用者提供学习页面。安装 = 在 profile 中加入插件依赖。

## 2. 用户故事

- 作为 dsh 使用者，我在 profile 中加一行依赖即可获得 `/learning` 学习页面，不影响原有 dsh web UI；
- 我想改挂载路径 → 通过 `cordis.patch.yml` 覆盖插件 `mountPath` 配置；
- 前端构建产物缺失时，我得到清晰的错误而非静默白屏。

## 3. 关键行为

| 行为 | 说明 |
|------|------|
| 插件入口 | `name='learning-dsh'`，`inject=[]`（双拼写自适应，见下方 API 注记），`async apply(ctx, config)` 探测 webserver 服务并注册路由 |
| 路由挂载 | `server.register({ kind: 'prefix', path: mountPath, handler })`，默认 `/learning`；路径须唯一（重复注册 throw） |
| SPA fallback | prefix 下的未知路径回退到 `index.html`（HashRouter 下实为单一路径） |
| 静态资源 | 从 `@learning-dsh/web` 的 exports 经 `require.resolve` 解析 dist 路径（dsh-web-frontend 模式）；缺失时 loud error |
| 路径穿越防护 | handler 内对解码后的 path 做 `..` 归一化校验，拒绝越界读取 |
| 配置 | `Config` schema（schemastery）：`mountPath`（默认 `/learning`）、`title`；patch 可覆盖 |

## 4. 验收标准

- [ ] `pnpm --filter @dylan/learning-dsh build` 产出 `lib/`（index.js + types）
- [ ] 插件 typecheck 通过（`tsc --noEmit` 干净）
- [ ] 在 dsh profile 中加入插件依赖后，`/learning` 可访问（集成验证阶段人工/脚本验证）
- [ ] `mountPath` 可被 patch 覆盖且生效
- [ ] dist 缺失时插件 activation 报错信息明确

## 5. 边界与约束

- 使用 **prefix** 路由而非 fallback seat（fallback 已被 `dsh-host-frontend-static` 占用，single-owner）；
- 与 dsh 官方 web UI 并存：插件路径 `/learning` 独立，不抢占 fallback；
- 不依赖 dsh 官方未来 web UI 嵌入通道（developer preview 期间无稳定通道）；
- **API 拼写注意（v1.1 修正，v1.2 自适应）**：npm 发布版 `@deepseek-ai/dsh-host-webserver@0.0.1-rc.1` 为 `ctx.httpServer`，master 源码为 `ctx.webServer`——Cordis inject 为 AND 语义，静态声明任一名字会在另一环境死锁；插件以空 inject + 运行时探测（`ctx.reflect.get` 预检 + `internal/service` 事件等待）自适应两个服务名。