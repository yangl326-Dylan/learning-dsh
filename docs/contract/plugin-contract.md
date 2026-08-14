# 插件契约 Plugin Contract

> 状态: `approved` | 更新时间: 2026-08-14
> 本契约定义 learning-dsh 作为 **DeepSeek Harness (dsh) 插件** 的接入接口。契约事实以 dsh 源码为准（v0.1.0-rc.5，参照 `@deepseek-ai/dsh-tool-todo`、`@deepseek-ai/dsh-host-webserver`、`@deepseek-ai/dsh-host-frontend-static` 等真实包）。

## 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.2 | 2026-08-14 | 契约修正：webserver 服务名双拼写自适应（`httpServer` npm 发布版 / `webServer` master 源码），插件不再静态 inject 单一名（Cordis inject 为 AND 语义会死锁），改运行时探测；新增 `dsh.bundle` 正式安装 |
| v1.1 | 2026-08-14 | 契约修正：npm 发布版 `@deepseek-ai/dsh-host-webserver@0.0.1-rc.1` 的 ctx key 为 `httpServer`/`HttpServerService`（master 源码拼写为 `webServer`/`WebServer`）。插件以 npm 可安装版本为准。 |

---

## 1. 定位

learning-dsh 是一个 **dsh 插件**（Cordis 插件），在 dsh 运行时内注册 `/learning` 路由，向 dsh 使用者提供学习页面（版本化源码阅读 + 设计决策讲解）。页面本身是 Vite 构建的静态产物，作为插件的资源被 serve。

**形态结论（源码依据）**：
- dsh 的 webserver 服务提供 `register({ kind, path, handler })` 命名路由注册，匹配顺序 exact → 最长 prefix → fallback。**服务名双拼写**：npm 发布版 `@deepseek-ai/dsh-host-webserver@0.0.1-rc.1` 为 `ctx.httpServer`/`HttpServerService`，本地 master 源码（v0.1.0-rc.5 开发线）为 `ctx.webServer`/`WebServer`——developer preview 破坏性变更的实例；插件**运行时自适应**两个服务名（v1.2），发布与源码环境均可激活。
- fallback seat 是 single-owner（已被 `dsh-host-frontend-static` 占用），因此插件**必须**用 prefix/exact 路由而非 fallback；
- 重复路径注册会 throw——路由路径是组合层契约，插件路径必须唯一。

## 2. 插件包格式

包名：`@dylan/learning-dsh`（第三方 scope；dsh 官方包为 `@deepseek-ai/dsh-<name>` 命名，第三方可用自有 scope）。

### 2.1 package.json 契约

| 字段 | 要求 | 依据 |
|------|------|------|
| `type` | `module` | dsh 包约定 |
| `main` | `lib/index.js` | 同上 |
| `types` | `lib/types/index.d.ts` | 同上 |
| `exports["."]` | `{ types, default }` | 同上 |
| `exports["./package.json"]` | 指向自身 | 同上 |
| `files` | `lib/` 产物（`lib/index.js` + `lib/types/**/*.d.ts`）+ `cordis.patch.yml`（bundle 配置层），不发布 src | dsh 发布门禁 |
| `dsh.bundle` | `{ patch: './cordis.patch.yml' }` | dsh bundle 声明：`dsh plugin add` 后自动加入 profile 的 `dsh.profile.bundles` |
| `dependencies` | `@deepseek-ai/schemastery`（配置运行时验证） | dsh 包约定 |
| `peerDependencies` | `@deepseek-ai/cordis` + 所用 dsh 包（本项目：`@deepseek-ai/dsh-host-webserver` 提供的 webServer 类型所在包） | dsh 包约定 |
| `devDependencies` | 镜像所有 peerDependencies | dsh 包约定 |
| `license` | MIT | 仓库 LICENSE |

### 2.2 插件入口（Cordis 插件格式）

```ts
export const name = 'learning-dsh'       // 插件 id
export const inject: string[] = []        // 不静态 inject（见下方双拼写说明）
export const Config = z.object({          // schemastery 配置 schema
  // mountPath?: string  默认 '/learning'
  // ...
})
export async function apply(ctx: Context, config: Config) {
  // 运行时探测 webserver 服务，注册 /learning prefix route，serve 前端 dist
}
```

**inject 契约（双拼写自适应）**：dsh webserver 服务名在发布版与 master 源码间不一致——npm 发布版 `@deepseek-ai/dsh-host-webserver@0.0.1-rc.1` 提供 `ctx.httpServer`（类 `HttpServerService`），master 源码提供 `ctx.webServer`（类 `WebServer`）。Cordis 的 inject 列表是 **AND 语义**（所有名字齐备才激活），静态声明任一名字都会在另一环境死锁；故插件 `inject = []`，在 `apply` 内用 `ctx.reflect.get` 预检 + `internal/service` 全局事件等待，解析宿主实际提供的服务名。两个变体的路由 API 一致：

| 方法 | 签名 | 说明 |
|------|------|------|
| `register` | `(route: WebRoute) => () => void` | 注册 exact/prefix 路由，返回 disposer |
| `registerFallback` | `(handler) => void` | fallback seat（本项目不使用，single-owner） |

`WebRoute`：`{ kind: 'exact' | 'prefix', path: string, handler: (req, res) => void }`。

### 2.3 前端 dist 解析（dsh-web-frontend 模式）

参照 `@deepseek-ai/dsh-web-app`：前端构建产物独立成包（`packages/web`），插件通过其 exports 的 `require.resolve` 解析 dist 路径，activation 时失败需 loud error（仿 `dsh-host-frontend-static` 的 "frontend dist must be built" 行为）。

## 3. 配置契约（Config）

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `mountPath` | string | `/learning` | 路由挂载路径（prefix），须唯一 |
| `title` | string | `Learning dsh` | 页面标题（进 index.html transform 可选） |

配置经 schemastery 验证，patch 可覆盖（profile `cordis.patch.yml` 机制）。

## 4. 第三方插件加载机制（使用者视角）

| 机制 | 说明 |
|------|------|
| Profile | `$DSH_HOME/profiles/<name>/package.json` 声明插件依赖 + `dsh.profile.bundles` |
| `dsh plugin` 命令 | `dsh plugin --profile <name> add <pkg>` 安装依赖；检测到 `dsh.bundle.patch` 声明则自动追加 bundle 到 `dsh.profile.bundles` |
| `cordis.patch.yml` | 按行 id 替换/插入配置（本项目插件的 Config 可被 patch 覆盖 mountPath 等） |
| `--patch` overlay | 不修改 profile 的临时覆盖层（快速试用：`dsh --profile web --patch <file>`） |

本项目插件的正式安装 = `dsh plugin --profile web add <pkg>`（bundle 自动入列）；快速试用 = `--patch` overlay（见仓库根 README 中英双语使用说明）。

## 5. 契约边界

- **在契约内**：包格式（含 `dsh.bundle`）、插件入口（双拼写自适应 inject）、webserver 路由挂载、dist 解析、Config schema。
- **不在契约内**：前端页面内部实现（spec-ui.md）、内容数据结构（content-contract.md）、dsh 官方未来 web UI 嵌入通道（developer preview 期间无稳定通道，本插件不依赖）。
