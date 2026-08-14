<!-- @locale:en -->
## Orienting in the repo

The mechanism map is `docs/architecture.md` § *Where new behavior goes*. The baseline bundle that ships with every profile is `packages/bundle/base` — a working demonstration of the map: read it to see what "attaching to a documented extension point" looks like in practice.

This chapter answers one question: **where does new behavior go?** dsh's answer is a map, and the rule is register-don't-edit.

## New behavior attaches to a documented extension point

dsh maintains a **mechanism map** — think of it as a **city map with landmarks**. Each landmark is a documented extension point: adding a model provider means registering its adapter on `ctx.llm`; adding a model-facing capability means registering on `ctx.tools`; adding shell execution means registering a `ctx.shell` backend. Changing the loop itself updates the map.

The *extension-points-over-editing* decision makes the alternative explicit: you could edit whichever package seems closest — fast for one change, but every edit forks upstream behavior and breaks on the next upgrade. A documented map keeps the extension surface stable and reviewable.

The map is a contract, and the *insight* is the test: **if your goal is not on the map, you are probably changing the loop — or should be.**

## Add a capability by registering, never by patching

*add-by-registering* is the discipline. Adding a tool means registering it in the scoped registry — its schema joins prompt assembly automatically. Adding an LLM adapter means registering on `ctx.llm`. The loop code never changes for a new capability; the product's behavior grows by composition.

Editing the loop to special-case a new capability is the tempting shortcut: it works once and is never safe again. Registration keeps every behavior addition additive and reversible — attach it, and it participates; detach it, and nothing else moves. *(Like plugging in a new appliance: the wiring in the wall stays untouched.)*

## Why the map (and this page) locks to a version

*preview-versioning* is the honest admission that dsh is in developer preview: compatibility-breaking changes will come, and they are expected. The learning content responds by locking to source commits (`sourceRef`) — a chapter always points at the exact code it describes. When the next version lands, content for it is added alongside, never overwriting the old.

The alternative — following master continuously — is always current, but it describes a moving target: older readers lose the version that matched their checkout. Version-pinned content stays stable even as upstream breaks.

**This learning page is itself the worked example** of every decision in this chapter: it pins content to a `sourceRef` commit, adds versions incrementally, and shows what "extend by registering, not by editing" produces.

## Reading guide

- `docs/architecture.md` § *Where new behavior goes* — the mechanism map.
- `packages/bundle/base` — the baseline bundle: read it as a demonstration of the map.
- `README.md` — the developer preview statement; reread it now that the map's logic is clear.

<!-- @locale:zh -->
## 在仓库中定位

机制地图在 `docs/architecture.md` § *新行为放哪*。随每个 profile 一起发布的基线 bundle 是 `packages/bundle/base`——地图的一次实操演示：读它，看"挂接到文档化扩展点"在实践里长什么样。

这一章回答一个问题：**新行为放哪里？** dsh 的答案是一张地图，规则是"注册而非修改"。

## 新行为挂接到文档化的扩展点

dsh 维护着一张**机制地图**——可以想成**一张标了地标的城市地图**。每个地标是一个文档化的扩展点：添加模型 provider = 在 `ctx.llm` 注册适配器；添加模型面对能力 = 注册到 `ctx.tools`；添加 shell 执行 = 注册 `ctx.shell` 后端。修改循环本身要更新这张地图。

*extension-points-over-editing* 决策把替代做法说得很清楚：你可以修改看似最接近的包——单次改动很快，但每次修改都分叉了上游行为，下次升级就会破坏。文档化地图让扩展面稳定且可审查。

这张地图是契约，*insight* 就是检验：**如果你的目标不在上面，你很可能在改循环本身——或者本该如此。**

## 通过注册添加能力，绝不靠修补

*add-by-registering* 是纪律。添加工具 = 注册到作用域注册表——它的 schema 自动加入提示词组装。添加 LLM 适配器 = 注册到 `ctx.llm`。新能力到来时循环代码从不修改；产品行为靠组合增长。

修改循环为某个新能力特判是诱人的捷径：它成功一次，就再也不安全。注册让每次行为添加都是增量式、可逆的——挂上它，它就参与；摘下它，别的东西都不动。*（像插上一个新电器：墙里的电线保持原样。）*

## 为什么地图（和这个页面）锁定版本

*preview-versioning* 是诚实的承认：dsh 处于 developer preview，破坏性兼容变更随时会来，而且这是预期内的。学习内容以锁定源码 commit（`sourceRef`）回应——章节总是指向它所描述的精确代码。新版本发布时，为新版本新增内容，而不是覆盖旧内容。

替代方案——持续跟随 master——永远最新，但它描述的是移动靶：旧读者会失去与他们的 checkout 匹配的版本。锁定版本的内容即使上游破坏也保持稳定。

**这个学习页面本身就是本章每个决策的实例**：它把内容锁定到 `sourceRef` commit，版本增量添加，并展示"靠注册而非修改来扩展"会产出什么。

## 阅读指引

- `docs/architecture.md` § *新行为放哪*——机制地图。
- `packages/bundle/base`——基线 bundle：把它当作地图的演示来读。
- `README.md`——developer preview 声明；现在地图的逻辑清楚了，再读一遍。