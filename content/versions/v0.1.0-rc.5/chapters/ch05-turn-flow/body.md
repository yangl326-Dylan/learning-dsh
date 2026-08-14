<!-- @locale:en -->
## Orienting in the repo

The loop lives in `packages/core/agent-loop`, and its lifecycle is documented in `docs/agent-lifecycle.md` (sequence diagram) and `docs/architecture.md` § *Turn flow*. Read this chapter as "how one model request becomes a step, how steps become turns, and where you can intercept".

Two names carry the whole structure: a **step** is one model request plus the tools it calls; a **turn** is zero or more steps. Think of a step as **one round of Q&A** (ask the model, maybe call a tool), and a turn as **a whole conversation** — it opens before its first input is claimed and closes once nothing is owed.

## Steps inside turns

The *step-turn-hierarchy* decision is the shape of the loop. The loop repeatedly:

1. Claims the next-step input (a user message, or the continuation a tool result implies).
2. Runs a step: append the input as `user/message`, derive model history from the log, assemble the prompt, stream the model, execute any tool calls.
3. Loops until the turn is owed nothing.

Why not treat every model call as one flat unit? Because "one user question with several follow-up tool rounds" would fragment into unrelated records, and tool-driven continuation could not express that it belongs to the same turn. The step/turn split gives tool-driven work a container. The turn closes when nothing is owed — no pending input, no running step. *(Imagine a conversation that keeps going because the assistant keeps calling tools to finish an answer — all those rounds belong to one turn.)*

## Derivation, not assembly

Each step appends entered messages as `user/message` and derives the model history from the log (`deriveMessages()`), never maintaining a parallel in-memory array. The *history-derived-from-log* decision is the session chapter's principle applied inside the loop: the same log renders history, fork, resume, telemetry, and UI consistently. If a step's input is not on the log, the loop cannot see it — which is exactly the invariant that keeps model-visible input on the log (chapter 6).

Streaming is where the loop meets `ctx.llm`: the response flows through `llm/stream`, chunks are appended as `assistant/chunk`, and the assembled message arrives as `assistant/message` with usage.

## Where the loop can be intercepted

The loop is all events, and the events are all waterfall — except one. `agent/pre-step` and `agent/request` are waterfalls: a listener can wrap the step or the model request, transform the value, or short-circuit. The `tools/*` events (pre-execute, execute, post-execute) are waterfalls around tool calls, so policy on tools lives in listeners, not in the loop.

`agent/turn-stopping` is deliberately different: it is **serial and has no `next()`**. Think of it as a **stop button**: a listener either stops the turn or lets it continue — it owns the decision without delegating. The *turn-stopping* decision explains why: stopping is a single decision, not a value transform. Making it a waterfall would let a downstream listener silently override an upstream stop; serial-without-next makes the stop decision atomic and explicit.

## Reading guide

- `docs/agent-lifecycle.md` — the sequence diagram first; it is the chapter in one image.
- `docs/architecture.md` § *Turn flow* — the loop's step/turn definitions and each extension point.
- `packages/core/agent-loop/src/index.ts` — the driver implementing the loop as a plugin.

<!-- @locale:zh -->
## 在仓库中定位

循环在 `packages/core/agent-loop`，生命周期记录在 `docs/agent-lifecycle.md`（时序图）和 `docs/architecture.md` § *Turn flow*。把这一章读作"一次模型请求如何成为 step、step 如何组成 turn、以及你在哪里可以拦截"。

两个名字承载整个结构：**step** 是一次模型请求加上它调用的工具；**turn** 是零或多个 step。可以把 step 想成**一轮问答**（问模型一次，可能调个工具），把 turn 想成**一整场对话**——它在首个输入被认领前开启，在不再欠任何东西时关闭。

## Turn 之内是 Step

*step-turn-hierarchy* 决策就是循环的形状。循环反复：

1. 认领下一步输入（用户消息，或工具结果暗示的延续）。
2. 运行一个 step：把输入作为 `user/message` 追加，从日志派生模型历史，组装提示词，流式获取模型输出，执行任何工具调用。
3. 循环，直到 turn 不再欠任何东西。

为什么不把每次模型调用当作一个扁平单元？因为"一个用户问题带多轮工具跟进"会碎成互不相关的记录，工具驱动的延续也无法表达它属于同一个 turn。step/turn 划分给工具驱动的工作提供了一个容器。turn 在不再欠任何东西时关闭——没有待处理输入，没有运行中的 step。*（想象一场对话因为助手不停调工具来完成回答而一直进行——那些轮次都属于同一个 turn。）*

## 派生，而不是拼装

每个 step 把进入的消息作为 `user/message` 追加，并从日志派生模型历史（`deriveMessages()`），绝不维护并行的内存数组。*history-derived-from-log* 决策是会话章节的原则在循环内部的应用：同一份日志让历史、fork、resume、遥测和 UI 保持一致。如果 step 的输入不在日志上，循环就看不见它——这正是让模型可见输入留在日志上的不变式（第 6 章）。

流式输出是循环与 `ctx.llm` 相遇的地方：响应经 `llm/stream` 流动，块被追加为 `assistant/chunk`，组装后的消息作为带用量的 `assistant/message` 到达。

## 循环在哪里可以被拦截

循环全是事件，而事件全是 waterfall——除一个之外。`agent/pre-step` 和 `agent/request` 是 waterfall：监听者可以包装 step 或模型请求、变换值、或短路。`tools/*` 事件（pre-execute、execute、post-execute）是工具调用周围的 waterfall，因此工具上的策略存在于监听者中，而不是循环里。

`agent/turn-stopping` 刻意不同：它是**串行的且没有 `next()`**。可以把它想成**停车按钮**：监听者要么停止 turn，要么让它继续——它拥有决策而无须委托。*turn-stopping* 决策解释了原因：停止是单一决策，不是值变换。把它做成 waterfall 会让下游监听者悄悄覆盖上游的停止决定；无 `next()` 的串行让停止决策原子且显式。

## 阅读指引

- `docs/agent-lifecycle.md`——先看时序图；它是一图版的本章。
- `docs/architecture.md` § *Turn flow*——循环的 step/turn 定义与每个扩展点。
- `packages/core/agent-loop/src/index.ts*——把循环实现为插件的驱动。