<!-- @locale:en -->
## Orienting in the repo

"Everything is a plugin" is not a slogan — it is literally how dsh is built. The two files that prove it best are `docs/cordis-primer.md` (the framework in five ideas) and `docs/architecture.md` (the harness overview, section *Cordis*). The framework itself is vendored under `vendor/cordis`, so you can read the real implementation without leaving the repo.

Here is the key observation: the architecture docs never point at a package you *must* edit to change how dsh behaves. There is no "core" directory in that sense. There are packages that happen to ship with the product, and there is a shared context those packages register into. Understanding that difference is the whole point of this chapter.

## The shared context is a service directory

Think of a Cordis `Context` as a **service directory** (like a phone book), not a dependency-injection container. When a package wants to be findable, it claims a stable key — `ctx.tools`, `ctx.llm`, `ctx.sessions`, `ctx.agents` — and publishes its service under that key. Consumers declare what they need with `inject: ['tools', 'llm']`, and the context hands them the matching services when the plugin loads.

The payoff: no package imports another package's concrete implementation. Dependencies exist at the key level, which is what makes swapping possible — replacing a service means registering a *different implementation under the same key*, not editing every file that imports it. This is the *service-key-context* decision in practice.

## Registrations are reversible effects

Installing anything — a prompt section, a tool schema, an event listener, a model adapter — goes through `ctx.effect()` or `ctx.on()`. Both return a **disposer** (think of it as a receipt for undoing the change), and Cordis tracks every active registration on the context. When a plugin unloads, its registrations unwind in the reverse order they were created. Reload a plugin a hundred times and the context ends up identical — no leftover state.

This is the *reversible-effects* decision, and it is what makes the "no privileged core" claim safe. A plugin can mount the agent loop itself — and `core/agent-loop` does exactly that — because mounting is a reversible effect, not a surgical edit. If the loop is just a plugin, then replacing the loop is just unloading one plugin and loading another.

## Why there is no core

The *no-privileged-core* decision is the deep one. A kernel-plus-extensions architecture always creates second-class citizens: plugins can extend things, but they can never own core behavior. dsh refuses that split. The model adapter is a plugin, the tool registry is a plugin, the session log is a plugin, the loop is a plugin. The "core" is just the discipline of the shared context plus the convention that every part of the product mounts through it.

The insight to hold onto: if you can replace the agent loop from configuration, then "core" is just another plugin you have not replaced yet.

## Reading guide

- `docs/cordis-primer.md` — the five ideas; read slowly, everything else references them.
- `docs/architecture.md` § *Cordis* — how the framework shows up at the product level.
- Then open `packages/core/agent-loop/src/index.ts` and watch a plugin register itself as `ctx.agentLoop` — that file is the proof of the whole chapter.

<!-- @locale:zh -->
## 在仓库中定位

"一切皆插件"不是口号，而是 dsh 真实的设计。最能证明这一点的两个文件是 `docs/cordis-primer.md`（框架的五个核心思想）和 `docs/architecture.md`（harness 总览的 *Cordis* 一节）。框架本身以 vendored 形式放在 `vendor/cordis` 下，所以你不离开仓库就能读到真实实现。

关键观察：架构文档从头到尾不会指着一个"你必须去改它才能改变 dsh 行为"的包。在这个意义上不存在"核心"目录。存在的只是一些碰巧随产品一起发布的包，以及一个这些包注册进去的共享上下文。理解这个区别，就是本章的全部重点。

## 共享上下文是一本服务通讯录

把 Cordis 的 `Context` 想成一本**服务通讯录**（像电话簿），而不是一个替你注入依赖的容器。一个包想被人找到，就在通讯录上认领一个稳定的 key——`ctx.tools`、`ctx.llm`、`ctx.sessions`、`ctx.agents`——并把服务发布在这个 key 下面。消费方用 `inject: ['tools', 'llm']` 声明自己需要什么，加载时由上下文把对应的服务交给它。

好处是：没有任何包会 import 另一个包的具体实现。依赖只存在于 key 层面，这正是"可替换"成为可能的根本原因——替换一个服务，就是在同一个 key 下注册**另一个实现**，而不是去改所有 import 它的文件。这就是 *service-key-context* 决策的实践形态。

## 注册都是可逆的

安装任何东西——一段提示词、一个工具 schema、一个事件监听、一个模型适配器——都走 `ctx.effect()` 或 `ctx.on()`。两者都会返回一个 **disposer**（可以理解成"撤销凭证"），Cordis 会在上下文中跟踪每一笔活跃注册。插件卸载时，注册按创建顺序的逆序回滚。一个插件重载一百次，上下文最终还是一模一样——没有任何残留状态。

这就是 *reversible-effects* 决策，也正是"没有特权核心"这个主张安全的原因。插件可以挂载 agent 循环本身——`core/agent-loop` 就是这么做的——因为挂载是可逆的，不是动手术改源码。如果循环只是个插件，那替换循环就只是"卸载一个插件、加载另一个"。

## 为什么没有核心

*no-privileged-core* 决策是最深刻的一个。"内核 + 扩展"的架构总会造出二等公民：插件可以扩展东西，但永远无法拥有核心行为。dsh 拒绝这种分裂。模型适配器是插件，工具注册表是插件，会话日志是插件，循环也是插件。所谓的"核心"，不过是共享上下文的纪律，加上"产品的每个部分都通过它挂载"的约定。

要记住的洞察：如果 agent 循环都能通过配置替换，那么"核心"不过是另一个你还没替换的插件而已。

## 阅读指引

- `docs/cordis-primer.md`——五个核心思想，慢慢读；其余内容都引用这些概念。
- `docs/architecture.md` § *Cordis*——框架在产品层面是如何呈现的。
- 然后打开 `packages/core/agent-loop/src/index.ts`，看一个插件如何把自己注册为 `ctx.agentLoop`——这个文件就是全章的证明。
