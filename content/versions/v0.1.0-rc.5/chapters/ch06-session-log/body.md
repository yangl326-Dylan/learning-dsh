<!-- @locale:en -->
## Orienting in the repo

The log lives in `packages/core/session`. `docs/subsystems/session.md` is the primary document; `docs/architecture.md` § *Session log* is the invariant in one paragraph. The type that defines the vocabulary is `SessionEventMap` in `packages/core/session/src/types.ts`.

The chapter's thesis is a runtime invariant: **anything model-visible must be reconstructable from the log**. Work backwards from it and the design of dsh's session becomes obvious.

## Model-visible means logged

The *model-visible-means-logged* decision is not a style preference; it is enforced. Anything that reaches a model request — a system prompt section, a tool schema, a user message, a prior assistant turn — must be derivable from the session log. Think of the log as the **court transcript**: if it did not happen in the transcript, the model never saw it. That is why a new model-visible input requires a new session event: you extend `SessionEventMap` and render from the log, rather than injecting the context directly into the request.

The alternative is seductive — inject context straight into the model request, cheap and convenient — but it creates a second, unlogged path to the model. Replay breaks, telemetry misses it, persistence cannot store it, audit cannot see it. The invariant keeps every model-visible input on the one road.

The practical question to carry into any dsh feature: how does this reach the model — and is it on the log?

## Lossless, chunk-level fidelity

Two event kinds carry the model output. Raw `assistant/chunk` events preserve **token-level replay fidelity** — think of them as the **verbatim transcript** — the UI renders from these chunks, and telemetry needs the token stream. The assembled `assistant/message` carries usage on top. The *lossless-replay* decision keeps both: every event is lossless JSON, and sequence numbers stay contiguous, so persistence can store the canonical log verbatim.

Why not persist only the assembled messages? The log would shrink, but the UI and telemetry consume the raw stream — a lossy log would force re-inventing the raw stream at replay time, and "replay" would no longer mean "play back exactly what happened."

## One log, many projections

*derive-not-store* is the rule for every consumer. Fork, resume, transcripts, telemetry, and persistence all derive from the same stream. `deriveMessages()` projects model history; the UI projects its own view; a future feature projects another. Imagine a court transcript and different reports written from it: the transcript is the single truth, each report is a projection. Nobody owns a second private copy of history, so nobody's history can disagree with anyone else's.

The cost is that reading history is a projection, not a lookup. The benefit is structural: there is exactly one description of what happened, and every consumer renders the same facts. The moment a feature seems to need its own history store is the moment to ask which projection of the log it actually is.

## Reading guide

- `docs/subsystems/session.md` — the log, the invariant, `deriveMessages()`.
- `packages/core/session/src/types.ts` — `SessionEventMap`; extend it to see how a new model-visible input enters the system.
- Then revisit `docs/architecture.md` § *Session log* — the invariant should now read as an obvious consequence.

<!-- @locale:zh -->
## 在仓库中定位

日志在 `packages/core/session`。`docs/subsystems/session.md` 是主要文档；`docs/architecture.md` § *Session log* 用一段话讲清不变式。定义词汇表的类型是 `packages/core/session/src/types.ts` 中的 `SessionEventMap`。

本章的论题是一条运行时不变式：**任何模型可见的内容都必须能从日志重建**。从它倒推，dsh 会话的设计就变得显而易见。

## 模型可见即记录

*model-visible-means-logged* 决策不是风格偏好，而是被强制执行的。任何到达模型请求的内容——系统提示词片段、工具 schema、用户消息、之前的助手 turn——都必须能从会话日志派生。把日志想成**法庭庭审记录**：如果记录里没有这件事，模型就从未见过它。这就是为什么新的模型可见输入需要新的 session 事件：你扩展 `SessionEventMap` 并从日志渲染，而不是直接把上下文注入请求。

替代方案很诱人——直接把上下文注入模型请求，又便宜又方便——但它会制造第二条未记录的到达模型的路径。回放被破坏、遥测看不见它、持久化存不了它、审计查不到它。不变式让所有模型可见输入都留在同一条路上。

要带进任何 dsh 功能的实际问题：这个内容如何到达模型——它是否在日志上？

## 无损、块级保真

两种事件承载模型输出。原始 `assistant/chunk` 事件保留 **token 级回放保真**——可以想成**逐字稿**——UI 从这些块渲染，遥测需要 token 流。组装后的 `assistant/message` 在其上携带用量。*lossless-replay* 决策两者都保留：每个事件都是无损 JSON，序号保持连续，因此持久化可以逐字存储规范日志。

为什么不只持久化组装后的消息？日志会变小，但 UI 和遥测消费的是原始流——有损日志会在回放时迫使重建原始流，而"回放"也就不再意味着"精确重现发生过的事"。

## 一条日志，多个投影

*derive-not-store* 是每个消费者的规则。fork、resume、转写、遥测和持久化都从同一条流派生。`deriveMessages()` 投影模型历史；UI 投影自己的视图；未来的功能投影另一个。想象一份庭审记录，以及根据它写出的不同报告：记录是唯一真相，每份报告都是它的一个投影。没有人拥有第二份私有的历史副本，所以没有任何人的历史会与别人的不一致。

代价是读历史是投影，不是查找。收益是结构性的：对"发生了什么"只有一种描述，每个消费者渲染相同的事实。当某个功能似乎需要自己的历史存储时，就是该问"它实际上是日志的哪个投影"的时刻。

## 阅读指引

- `docs/subsystems/session.md`——日志、不变式、`deriveMessages()`。
- `packages/core/session/src/types.ts`——`SessionEventMap`；扩展它，看新的模型可见输入如何进入系统。
- 然后重读 `docs/architecture.md` § *Session log*——不变式此时应当读起来像显而易见的推论。