<!-- @locale:en -->
## Orienting in the repo

Six packages form the harness spine, and each claims one stable `ctx` key:

- `packages/core/session` → `ctx.sessions`
- `packages/core/tools` → `ctx.tools`
- `packages/core/agent` → `ctx.agents`
- `packages/core/agent-loop` → `ctx.agentLoop`
- `packages/core/system-prompt` → `ctx.systemPrompt`
- `packages/llm/llm` → `ctx.llm`

`docs/architecture.md` § *Core packages* is the map; `docs/subsystems/*.md` is the detail. Read this chapter as "the spine, and the keys it claims" — each key is a contract that other plugins depend on through `inject`.

## The session is an append-only ledger

`core/session` is the single source of truth for an agent's entire interaction history. The type `SessionEventMap` in `src/types.ts` defines the vocabulary of typed events, and the log is append-only. Think of it as a **ledger you can only write to** — nothing ever rewrites history, not the model's own retries, not user edits, not compaction.

The *append-only-session* decision is about derivation: the LLM message history is *derived* from the log (`deriveMessages()`), never stored separately. Every consumer — fork, resume, telemetry, persistence, the UI — derives from the same events, so they cannot drift. Replay is just re-deriving over the same log. The cost: reading history means projecting the log. The benefit: there is exactly one description of what happened.

## A scoped registry with a guarded pipeline

`core/tools` owns two things: the scoped tool registry and the guarded execution pipeline. Tools register their schemas into the registry, and those schemas join prompt assembly — the model sees the tool's shape because it was registered, not because something special-cased it.

Execution is the interesting half. A tool call does not run directly; it passes through `pre-execute` → `execute` → `post-execute` events — think of it as going through a **security checkpoint**. That is the *scoped-tool-registry* decision: policy — permissions, logging, cancellation, sandboxing — lives at the harness level, centralized in one pipeline, instead of being re-implemented inside each tool. A tool author writes the capability; the harness owns the guardrails.

## One agent interface, swappable drivers

`core/agent` defines the `Agent` interface, keeps a *live* registry of running agents, and emits the `agent/*` events (`ctx.agents`). It implements nothing that loops. The default driver is `core/agent-loop`, which implements the interface and claims `ctx.agentLoop`.

The *agent-interface* decision is chapter 1's "no privileged core" made concrete: the loop is a plugin implementing an interface. A different driver — one that delegates turns to another product, a replay driver, a test double — registers under the same contract, and configuration picks which one boots. The harness's behavior becomes a consumer choice, not a compile-time fact.

## How the spine holds together

Prompt assembly pulls from `system-prompt`; the loop asks `llm` to stream; `tools` supplies schemas and guards execution; `session` records everything; `agent` tracks who is alive. Each package is small and owns its key. When you read a subsystem doc, keep asking: what key does this claim, and who injects it? That key is the seam through which the package participates in the product.

## Reading guide

- `docs/architecture.md` § *Core packages* — the map, then `docs/subsystems/session.md`, `docs/subsystems/tools.md`, `docs/subsystems/core.md`.
- `packages/core/session/src/types.ts` — `SessionEventMap`, the vocabulary everything else derives from.
- `packages/core/agent-loop/src/index.ts` — the default driver claiming `ctx.agentLoop`.

<!-- @locale:zh -->
## 在仓库中定位

六个包构成 harness 主干，每个认领一个稳定的 `ctx` key：

- `packages/core/session` → `ctx.sessions`
- `packages/core/tools` → `ctx.tools`
- `packages/core/agent` → `ctx.agents`
- `packages/core/agent-loop` → `ctx.agentLoop`
- `packages/core/system-prompt` → `ctx.systemPrompt`
- `packages/llm/llm` → `ctx.llm`

`docs/architecture.md` § *Core packages* 是地图，`docs/subsystems/*.md` 是细节。把这一章读作"主干，以及它认领的 key"——每个 key 都是一份其他插件通过 `inject` 依赖的契约。

## 会话是一本只记不改的账本

`core/session` 是 agent 全部交互历史的唯一事实源。`src/types.ts` 中的 `SessionEventMap` 类型定义了类型化事件的词汇表，日志只追加。把它想成一本**只能写、不能改的账本**——历史从不会被改写，模型的自我重试、用户编辑、压缩都不行。

*append-only-session* 决策的核心是派生：LLM 消息历史从日志*派生*（`deriveMessages()`），绝不单独存储。每个消费者——fork、resume、遥测、持久化、UI——都从同一批事件派生，因此不会漂移。回放就是基于同一份日志重新派生。代价：读历史意味着投影日志。收益："发生了什么"只有一种描述。

## 作用域注册表与安检门管线

`core/tools` 拥有两样东西：作用域工具注册表和受保护的执行管线。工具把 schema 注册进注册表，schema 随即加入提示词组装——模型能看到工具的形状，是因为它被注册了，而不是因为有什么东西特判了它。

执行才是更有意思的一半。工具调用不直接运行，而是穿过 `pre-execute` → `execute` → `post-execute` 事件——可以理解成过一道**安检门**。这就是 *scoped-tool-registry* 决策：策略——权限、日志、取消、沙箱——存在于 harness 层，集中在那一条管线里，而不是在每个工具内部重新实现。工具作者写能力；harness 拥有护栏。

## 统一 agent 接口，可替换的驱动

`core/agent` 定义 `Agent` 接口、维护运行中 agent 的*实时*注册表，并发出 `agent/*` 事件（`ctx.agents`）。它自己不实现任何循环。默认驱动是 `core/agent-loop`，它实现该接口并认领 `ctx.agentLoop`。

*agent-interface* 决策是第一章"没有特权核心"的具体兑现：循环是一个实现接口的插件。不同的驱动——把 turn 委托给另一个产品的、回放驱动、测试替身——在同一个契约下注册，由配置决定启动哪个。harness 的行为成为消费方的选择，而不是编译期事实。

## 主干如何协同

提示词组装从 `system-prompt` 取料；循环让 `llm` 流式输出；`tools` 提供 schema 并守卫执行；`session` 记录一切；`agent` 跟踪谁还活着。每个包都很小，且拥有自己的 key。读子系统文档时持续问：这个认领了什么 key，谁 inject 它？那个 key 就是这个包参与产品的接缝。

## 阅读指引

- `docs/architecture.md` § *Core packages*——先看地图，再读 `docs/subsystems/session.md`、`docs/subsystems/tools.md`、`docs/subsystems/core.md`。
- `packages/core/session/src/types.ts`——`SessionEventMap`，其余一切派生的词汇表。
- `packages/core/agent-loop/src/index.ts`——认领 `ctx.agentLoop` 的默认驱动。
