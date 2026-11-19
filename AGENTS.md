# AGENTS.md

> 本文件供 AI 编码代理（Codex / Claude Code / Cursor 等）自动读取。
> 人工读者请直接看 [`README.md`](README.md)。

## 这是什么项目

**飞针设备制造 · 业务流程分析** —— 一个面向求职展示的业务分析作品：
把一家自动化设备公司（飞针测试机）的全线业务，拆到「谁在哪个系统里做什么、产出什么记录、哪里会断、哪里能被系统或 AI 替掉」的粒度，做成可交互网页。

- 仓库：`deruienjie/flying-probe-business-process`（公开）
- 线上：https://deruienjie.github.io/flying-probe-business-process/ （GitHub Pages，`main` 分支根目录）
- 技术栈：纯 HTML / CSS / 原生 JS，**无构建、无框架、无依赖**

## 当前状态（V2 已完成）

| 能力 | 状态 |
|---|---|
| 9 个业务阶段 / 13 个业务段 / 75 个微环节 | ✅ 数据在 `data.js` |
| 三层下钻：阶段 → 段（表格+抽屉）→ 微环节详情 | ✅ `app.js` |
| 财务阶段 P9：7 段 36 微环节 + 金蝶模块列 + 模块×环节矩阵 | ✅ |
| 移动端（≤820px 侧滑目录 / 表格转卡片 / 底部弹层） | ✅ |
| 深链、OG 分享卡片、favicon | ✅ |

## 下一步：V3（要做的活）

**完整需求与实施约束见 [`docs/V3-开工说明书.md`](docs/V3-开工说明书.md)，开工前必须先读它。**

一句话：新增「业务全景」入口（P1–P8 横向卡片 + P9 财务横贯泳道 + 关键单据流 + 一张带分支的核心流程图），并与现有三层下钻联动。

### 开工前必须先问用户 3 个问题

1. **P8 命名冲突**：`S19 回款与项目核算`（P8）与 `G1–G6 应收`（P9）职责重叠。
   推荐 A：P8 改名「交付后服务」，S19 移入 P9。
2. **顶部导航**先上 2 个（业务全景 / 流程拆解）还是直接 4 个。
3. 是否需要一个**极简首页**给 HR（一屏 + 3 个亮点 + 进入按钮）。

## 必须遵守的硬约束

1. **`data.js` 是唯一数据源**，不要新建平行数据；全景的新内容也写进 `data.js`。
2. **不虚构**：真实成果 / 个人研究 / 示意流程必须在页面上区分并标注；KPI 没真实数据就只写名称，不编改善比例和金额。
3. **先本地截图确认，再推送线上**。不要未经用户确认就 push 或覆盖 Pages。
4. **不引入框架/构建工具**，继续纯静态。
5. **不破坏现有深链**：`#phase:Pn`、`#seg:X`、`#step:ID`、`#ID`（focus）、`?pick=ID`。

## 代码结构速查

```
index.html    骨架（顶部栏 / 阶段条 / 左树 / main）
styles.css    设计令牌 + 组件 + 移动端断点
data.js       MODEL（9 阶段）+ PHASE_IO + BILL_FLOW + CORE_FLOW
app.js        state / render() / go() / resolve()，约 500 行
docs/         日志、设计规范、V3 开工说明书
```

### 数据模型（`MODEL[]`）

```js
{ id:"P1", name:"市场与销售", color:"#2563eb", goal:"…",
  crossCutting?: true,          // P9 财务横贯
  matrix?: {...},               // P9 模块×环节矩阵
  segments?: [{ id:"A", name, goal, steps:[…] }],  // P1/P9 有段
  steps?: […]                   // P2–P8 只有环节
}
```

微环节字段：`id name who[] inputs[] actions[] outputs[] systems[] judge ai aiNote kpis[] risks[] module?`

### 路由

| hash | 页面 | state |
|---|---|---|
| `#phase:P4` | 阶段 | `{kind:"phase"}` |
| `#seg:A` | 段（表格+抽屉） | `{kind:"segment"}` |
| `#A3` | 段 + 抽屉定位 | `{kind:"focus"}` |
| `#step:A3` | 微环节详情 | `{kind:"step"}` |

V3 新增建议：`#overview` / `#sysmap` / `#about`，在 `resolve()` 与 `go()` 各加一个分支，别动上面四个。

## 设计规范（已固化，别自创）

- 字阶：12 / 13 / 14 / 16 / 20 / 26
- 圆角：6 / 10 / 14
- 主色 `#2563eb`；阶段色各自固定（见 `MODEL[].color`）
- 卡片：白底 + 1px 边 + 悬停上浮 2px
- 不许：背景大图、粒子、玻璃拟态、大面积动效
- 详见 [`docs/设计规范.md`](docs/设计规范.md)

## 发布流程

```bash
# 1) 本地验证（截图 1440 / 768 / 390）
# 2) 提交
git add -A && git commit -m "feat(v3): …"
# 3) 推送（本机 git 配了代理 127.0.0.1:7890，没开代理时要绕过）
git -c http.proxy= -c https.proxy= push origin main
# 4) 等 Pages 构建成 built，再验证线上 URL
```

## 语言与风格

- 面向中文用户，注释、提交信息、页面文案都用中文
- 提交信息格式：`feat(v3): …` / `fix(mobile): …` / `docs: …`
