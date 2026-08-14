<!-- @locale:en -->
## Orienting in the repo

Composition lives in `packages/boot/app-boot` — a small package whose only job is turning configuration files into a running plugin tree. The three bundle packages show what composition feels like from the outside: `packages/bundle/base` (the minimal surface), `packages/bundle/web-app`, and `packages/bundle/headless`. Each is a directory of YAML plus a `package.json` that declares its place in the system.

Start from the chapter summary's claim: what boots is a **tree**, not a program. There is no executable that "knows how to run dsh." There is machinery that reads ordered layers and produces a tree, and then Cordis boots that tree.

## The layers, in order

`composeEntries` in `app-boot` applies layers to an *empty entry list*:

1. Bundles, in the order the profile lists them — each bundle inserts configuration rows.
2. The profile's own `cordis.patch.yml` (loaded by `loadOptionalPatches`).
3. The home-level `cordis.patch.yml`.
4. Any `--patch` overlay passed on the command line.

Each layer targets rows by `id` and either replaces the whole config of a matched row or inserts new rows. The `dsh` field in `package.json` declares the shape: `dsh.profile` lists a profile's bundles, `dsh.bundle` points at a bundle's patch file. This is the *layered-composition* decision: one code path (`resolveProfileDir` / `loadProfile` / `composeEntries`) serves web, headless, and every custom profile — variation is data, not code.

## Patch by id, not by edit

The *patch-over-edit* decision is a rule with teeth. A patch row replaces the *entire* matched config — there is no deep-merge. Want to keep a field? You restate it. That looks annoying until you realize it is exactly what makes patches safe: the effect is total and reviewable, never a silent merge that depends on field-by-field semantics.

Bundles ship their own patches, and users patch on top. Upgrade safety is structural: when a bundle updates, your home-level patch rows still target the same ids, and if a row disappears you see it immediately instead of discovering a half-merged config later. And because everything is declarative YAML in version control, "what did I change" is a diff, not a memory.

## Profiles are named compositions

A profile is a directory under `$DSH_HOME/profiles/<name>` containing a `package.json` (with out-of-tree plugin dependencies) plus the `dsh.profile` manifest. `web` and `headless` ship as templates (`PROFILE_TEMPLATES` in `app-boot`) that auto-initialize on first use — you type `dsh --profile web`, and the directory materializes with its dependencies installed.

The *profile-templates* decision answers a real problem: a single fixed startup configuration would force every user with different needs to maintain a fork. A named profile is a composition you create with `dsh plugin`, not a fork you must maintain. "Web with my extra plugins" is a profile that stacks the web bundle and your own rows.

The fastest way to see the whole machine: `dsh --profile web --dump-config` prints the exact tree your machine boots — every row patchable.

## Reading guide

- `packages/boot/app-boot/src/index.ts` — `resolveProfileDir`, `loadProfile`, `composeEntries`, `loadOptionalPatches`; read in that order.
- `packages/boot/app-boot/README.md` — directory layout and `PROFILE_TEMPLATES`.
- Then run `dsh --profile web --dump-config` and trace where each row came from.

<!-- @locale:zh -->
## 在仓库中定位

组合机制在 `packages/boot/app-boot`——一个小包，唯一职责就是把配置文件变成一棵正在运行的插件树。三个 bundle 包展示了组合从外部看是什么样：`packages/bundle/base`（最小表面）、`packages/bundle/web-app`、`packages/bundle/headless`。每个都是一堆 YAML 加一个声明自己在系统中位置的 `package.json`。

从章节摘要的主张出发：启动的是一个**树**，而不是一个"程序"。不存在一个"知道如何运行 dsh"的可执行文件。存在的是一套按顺序读取分层、产出树的机制，然后由 Cordis 启动这棵树。

## 分层，按顺序

`app-boot` 中的 `composeEntries` 把各层应用到*空条目列表*：

1. Bundle，按 profile 列出的顺序——每个 bundle 插入配置行。
2. Profile 自己的 `cordis.patch.yml`（由 `loadOptionalPatches` 加载）。
3. 家目录级的 `cordis.patch.yml`。
4. 命令行传入的任意 `--patch` 覆盖。

每层按 `id` 定位行，整体替换匹配行的 config，或插入新行。`package.json` 中的 `dsh` 字段声明形态：`dsh.profile` 列出 profile 的 bundles，`dsh.bundle` 指向 bundle 的 patch 文件。这就是 *layered-composition* 决策：`resolveProfileDir` / `loadProfile` / `composeEntries` 这一条代码路径服务 web、headless 和每个自定义 profile——变化是数据，不是代码。

## 按 id 打补丁，而不是改源码

*patch-over-edit* 决策是一条有牙齿的规则。patch 行会整体替换匹配行的 config——没有深合并。想保留某个字段？那就重述它。这看起来烦人，直到你意识到这正是 patch 安全的原因：效果是整体且可审查的，永远不会是依赖逐字段语义的静默合并。

Bundle 自带 patch，用户在其上再打补丁。升级安全是结构性的：bundle 更新时，你家目录级的 patch 行仍然指向相同的 id；如果某行消失了，你会立刻看到，而不是之后才发现一个半合并的配置。而且因为一切都是版本控制里的声明式 YAML，"我改了什么"是一个 diff，而不是一段记忆。

## Profile 是可命名的组合

Profile 是 `$DSH_HOME/profiles/<name>` 下的一个目录，包含 `package.json`（带 out-of-tree 插件依赖）和 `dsh.profile` 清单。`web` 和 `headless` 作为模板随附（`app-boot` 里的 `PROFILE_TEMPLATES`），首次使用时自动初始化——你输入 `dsh --profile web`，目录就带着依赖实例化出来。

*profile-templates* 决策回答了一个真实问题：单一固定启动配置会迫使每个需求不同的用户维护一份 fork。命名 profile 是用 `dsh plugin` 创建的组合，而不是必须维护的 fork。"带额外插件的 web"就是一个叠加了 web bundle 和你自己行的 profile。

看到整台机器最快的办法：`dsh --profile web --dump-config` 会打印你机器启动时的完整树——每一行都可被 patch 覆盖。

## 阅读指引

- `packages/boot/app-boot/src/index.ts`——按顺序读 `resolveProfileDir`、`loadProfile`、`composeEntries`、`loadOptionalPatches`。
- `packages/boot/app-boot/README.md`——目录布局与 `PROFILE_TEMPLATES`。
- 然后运行 `dsh --profile web --dump-config`，追踪每一行来自哪一层。
