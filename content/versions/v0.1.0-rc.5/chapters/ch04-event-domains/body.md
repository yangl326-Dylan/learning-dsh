<!-- @locale:en -->
## Orienting in the repo

Events are the extension points of dsh. The canonical references are `docs/architecture.md` § *Events* and the catalogue `docs/event-producer-consumer.md`, which lists every event's producers and consumers. The framework semantics — dispatch modes, the `ctx.on` family — come from `vendor/cordis` and are summarized in `docs/cordis-primer.md`.

The mental move this chapter asks for: when you see an event name, classify it. Which domain does it belong to, and what dispatch mode does it declare? Both answers are part of the event's public contract.

## Three domains, three different promises

Session events are **durable facts** — think of them as **ledger entries**. They are appended to the session log and broadcast through `session/event`; when the process reloads, they are still there. Use a session event when the fact must survive a reload — a message was sent, a step ended, a turn closed.

Agent events (`agent/*`) are **live interception** — think of them as **watching a live broadcast**. They carry a live `Agent` and let a plugin observe or intercept work in flight — `agent/pre-step` before a step, `agent/request` around a model call, `agent/turn-stopping` at the end of a turn. They are for the running process, not for history.

Capability events are the **seams** — think of them as **power outlets** — `fs/*`, `tools/*`, `telemetry/*`, and friends. They let a plugin attach policy and adapters to a capability without importing the agent loop or knowing which provider is behind it.

The *durable-vs-live* decision explains why the split exists. One giant event namespace would be easier to grep, but listeners would not know whether a fact survives reload. Splitting the domains makes durability and liveness part of every event's contract — you can tell from the name alone whether this event is a record or a signal.

## Four dispatch modes as a contract

Every event declares exactly one dispatch mode, and the mode is documented with `@mode` so the catalogue can check declarations against dispatch sites:

- **emit** — observe, not awaited. Fire and forget; listeners may react but cannot change the flow. *(Like raising your hand to note something.)*
- **waterfall** — listeners wrap in order, the value passes through, `next()` delegates downstream. *(Like a relay race where each runner can modify the baton.)*
- **parallel** — all listeners run in parallel, awaited before the event resolves. *(Like asking everyone to work at once and waiting for all of them.)*
- **serial** — listeners run in order, awaited, value passes through. *(Like a queue where each person passes the result to the next.)*

The *dispatch-modes* decision is about honesty: observation, fan-out, wrapping, and ordered decision have genuinely different semantics, and collapsing them into one style forces listeners to re-implement the missing semantics — or misbehave silently. Declaring the mode in the contract means the dispatch site and the listeners agree on what "participating" means.

## Waterfall is around-middleware

`ctx.waterfall` deserves its own moment. A waterfall listener receives `(...args, next)`. Call `next()` to delegate the possibly-wrapped result downstream; return without calling `next()` to short-circuit. That is the *waterfall-middleware* decision: pre/post hook pairs can observe but cannot replace the value flowing downstream — only `next()` lets a listener both observe and transform in one registration.

For single-decision events, short-circuiting is the design, not an edge case. A policy listener that wants to own a decision simply does not delegate. You will meet this again in chapter 5's `agent/turn-stopping`, which is deliberately *not* a waterfall — a decision that owns itself without wrapping values.

## Reading guide

- `docs/architecture.md` § *Events* — the three domains, then § *Turn flow* for the dispatch modes in motion.
- `docs/event-producer-consumer.md` — pick one event per domain and trace its producers and consumers.
- `docs/cordis-primer.md` § *Dispatch Modes* — the exact semantics of `emit` / `waterfall` / `parallel` / `serial`.

<!-- @locale:zh -->
## 在仓库中定位

事件是 dsh 的扩展点。权威参考是 `docs/architecture.md` § *Events* 和目录 `docs/event-producer-consumer.md`——后者列出了每个事件的生产者与消费者。框架语义——分发模式、`ctx.on` 家族——来自 `vendor/cordis`，在 `docs/cordis-primer.md` 中有摘要。

这一章要求的心智动作：看到一个事件名，就给它分类。它属于哪个领域？它声明了什么分发模式？两个答案都是事件公共契约的一部分。

## 三个领域，三种不同的承诺

Session 事件是**持久事实**——可以想成**账本上的记录**。它们被追加到会话日志，并通过 `session/event` 广播；进程重载后它们依然存在。当事实必须跨重载存活时使用 session 事件——消息已发送、step 已结束、turn 已关闭。

Agent 事件（`agent/*`）是**实时拦截**——可以想成**在看现场直播**。它们携带实时 `Agent`，让插件观察或拦截进行中的工作——step 之前的 `agent/pre-step`、模型调用周围的 `agent/request`、turn 末尾的 `agent/turn-stopping`。它们服务于运行中的进程，而不是历史。

Capability 事件是**接缝**——可以想成**墙上的插座**——`fs/*`、`tools/*`、`telemetry/*` 等。它们让插件把策略和适配器挂到能力上，而不必 import agent 循环，也不必知道背后是哪个 provider。

*durable-vs-live* 决策解释了这种划分为何存在。单一巨型事件命名空间更容易检索，但监听者无法知道一个事实是否跨重载存活。划分领域让持久性与实时性成为每个事件契约的一部分——仅凭名字就能分辨这个事件是记录还是信号。

## 四种分发模式作为契约

每个事件恰好声明一种分发模式，模式用 `@mode` 记录，使目录生成器能校验声明与分发点一致：

- **emit**——观察，不等待。发出即忘；监听者可以反应但不能改变流程。*（像举手示意一件事。）*
- **waterfall**——监听者按序包装，值传递，`next()` 委托给下游。*（像接力赛，每棒选手都可以改一下接力棒。）*
- **parallel**——所有监听者并行运行，事件解析前全部等待。*（像让大家同时干活，然后等所有人完工。）*
- **serial**——监听者按序运行，等待，值传递。*（像排队，每个人把结果传给下一个人。）*

*dispatch-modes* 决策关乎诚实：观察、扇出、包装、有序决策的语义确实不同，合并成一种风格会迫使监听者重新实现缺失的语义——或者默默出错。在契约中声明模式，意味着分发点和监听者对"参与"的含义达成一致。

## Waterfall 是 around 中间件

`ctx.waterfall` 值得单独一刻。waterfall 监听者收到 `(...args, next)`。调用 `next()` 把可能被包装的结果委托给下游；不调用 `next()` 直接返回即短路。这就是 *waterfall-middleware* 决策：前后钩子对能观察，但不能替换流向 downstream 的值——只有 `next()` 让监听者在一次注册中既能观察也能变换。

对单决策事件，短路是设计，而不是边界情况。想拥有决策的策略监听者，就是不委托。你会在第 5 章再次遇见这一点：`agent/turn-stopping` 刻意*不是* waterfall——一个不包装值、自我拥有的决策。

## 阅读指引

- `docs/architecture.md` § *Events*——三个领域，再读 § *Turn flow* 看分发模式在运动中。
- `docs/event-producer-consumer.md`——每个领域挑一个事件，追踪它的生产者与消费者。
- `docs/cordis-primer.md` § *Dispatch Modes*——`emit` / `waterfall` / `parallel` / `serial` 的精确语义。