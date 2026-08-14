<!-- @locale:en -->
## Orienting in the repo

The canonical reference is `docs/capability-seams.md`; the worked example lives in `docs/subsystems/web.md`. `packages/web` is the seam's definition and `packages/fs` is a provider. `docs/architecture.md` § *Capability seams* states the payoff in one paragraph.

A **seam** is a swappable capability. Think of it as a **standard power outlet**: the wall socket has a fixed shape, and any plug that matches works. The shape stays, the plug can change. dsh's seams are the same — the interface stays stable while the implementation behind it can be swapped.

## Three roles, one seam

Every seam has three roles, and the *seam-trio* decision is blunt: **one role alone is not a seam**.

- **Service Definition** — declares the interface. *(The socket's shape and voltage.)*
- **Service Provider** — implements it. *(The plug and the appliance behind it — any vendor's plug that fits.)*
- **Consumer** — uses it, commonly as a model-facing tool. *(The appliance: the thing that decides what the electricity is for.)*

A package may combine roles — dsh's own web definition lives in `packages/web` — but adding a capability means designing all three. A single package that defines, implements, and consumes a capability is the simplest shape, but then a provider swap requires editing the consumer. Splitting the roles lets implementations vary independently behind one interface.

## One provider swap changes the whole product

The *provider-swap* decision is where the design pays off. Filesystem and subprocess providers share one execution world: point them at a remote sandbox and **Bash, PTY, and LSP move with them** — no provider forks, no per-tool re-decisions. Subagent providers vary just as widely behind one interface, from a fresh child agent to a delegated turn in another product.

The alternative — every consumer selecting its own backend — gives finer control but reintroduces coupling: every tool re-decides the execution world. A shared provider keeps the choice in one place, so one swap changes the whole product.

## The consumer owns the model-facing shape

The *consumer-owns-model-face* decision is the subtle one. **Providers register capabilities, not tools.** The model-facing names, schemas, prompt guidance, and presentation all live in the consumer. The web search tool's schema is `dsh-tool-web`'s, not any search provider's — so swapping the search provider does not change how the model asks for a query.

Why does this matter? If providers exposed their own model-facing surface, the model's vocabulary would couple to vendor APIs: switching vendors would change the tool schema the model sees, and every swap would confuse the model. The consumer's single model face keeps the model vocabulary stable across swaps.

*(Put the trio back in the outlet metaphor: the definition is the socket spec, the provider is the plug — but the consumer is the appliance that decides how the electricity is used. Swap the plug, and the appliance still works exactly as before.)*

## Reading guide

- `docs/capability-seams.md` — the three roles and the service graph.
- `docs/subsystems/web.md` — the worked example: `dsh-web` definition, `dsh-web-search-*` providers, `dsh-tool-web` consumer.
- Then `docs/architecture.md` § *Capability seams* — the payoff sentence should now read as a consequence.

<!-- @locale:zh -->
## 在仓库中定位

权威参考是 `docs/capability-seams.md`；实例在 `docs/subsystems/web.md`。`packages/web` 是该接缝的定义，`packages/fs` 是一个 provider。`docs/architecture.md` § *Capability seams* 用一段话讲清收益。

**接缝**是一种可替换能力。可以把它想成**标准的墙上插座**：插座有固定形状，任何匹配的插头都能用。形状保持不变，插头可以换。dsh 的接缝与此相同——接口保持稳定，而背后的实现可以替换。

## 三个角色，一条接缝

每条接缝有三个角色，*seam-trio* 决策很直白：**单独一个角色不构成接缝**。

- **服务定义**——声明接口。*（插座的形状和电压。）*
- **服务提供者**——实现它。*（插头和它背后的电器——任何厂商、只要插头匹配。）*
- **消费者**——使用它，通常是模型面对的工具。*（电器本身：决定电用来干什么的东西。）*

一个包可以合并多个角色——dsh 自己的 web 定义就在 `packages/web`——但添加能力意味着设计全部三个角色。一个同时定义、实现、消费能力的包是最简单的形态，但那样替换 provider 就得改消费者。拆分角色让实现能在同一接口后独立变化。

## 一次 Provider 替换改变整个产品

*provider-swap* 决策是这个设计的回报点。文件系统和子进程 provider 共享同一执行世界：把它们指向远程沙箱，**Bash、PTY、LSP 随之整体迁移**——无需 provider 分叉，无需每个工具重新决定。子代理 provider 在同一接口后变化同样巨大：从全新子 agent 到委托给另一个产品的 turn。

替代方案——每个消费者自己选后端——能获得更细的控制，但会重新引入耦合：每个工具都要重新决定执行世界。共享 provider 把选择集中在一处，因此一次替换就改变整个产品。

## 消费者拥有模型面对的形态

*consumer-owns-model-face* 决策是最微妙的一个。**provider 注册能力，而不是工具。**模型面对的名称、schema、提示词引导和展示都在消费者里。web 搜索工具的模式属于 `dsh-tool-web`，不属于任何搜索 provider——因此替换搜索 provider 不会改变模型如何发出查询。

为什么这很重要？如果 provider 暴露自己的模型面对表面，模型的词汇表就会耦合到厂商 API：切换厂商会改变模型看到的工具 schema，每次替换都会让模型困惑。消费者统一的模型面让模型词汇表在替换中保持稳定。

*（把三角放回插座比喻：定义是插座规格，provider 是插头——但消费者是决定电怎么用的电器。换插头，电器照常工作。）*

## 阅读指引

- `docs/capability-seams.md`——三个角色与服务图。
- `docs/subsystems/web.md`——实例：`dsh-web` 定义、`dsh-web-search-*` 提供者、`dsh-tool-web` 消费者。
- 然后读 `docs/architecture.md` § *Capability seams*——收益那句现在应当读起来像推论。