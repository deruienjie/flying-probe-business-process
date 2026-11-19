/* v2 渲染层：阶段 → 段 → 微环节，段用表格+抽屉，微环节用补满详情 */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tag = ai => ai ? `<span class="tag ${ai === "可自动" ? "auto" : ai === "可辅助" ? "help" : "human"}">${esc(ai)}</span>` : "";

  /* ---------- 扁平化 ---------- */
  const leaves = [];
  MODEL.forEach(ph => {
    if (ph.segments) ph.segments.forEach(seg => seg.steps.forEach(st => leaves.push({ phase: ph, seg, step: st })));
    else ph.steps.forEach(st => leaves.push({ phase: ph, seg: null, step: st }));
  });
  const findLeaf = id => leaves.find(l => l.step.id === id);
  const idxOf = id => leaves.findIndex(l => l.step.id === id);
  const findSeg = id => MODEL.find(p => p.segments && p.segments.some(s => s.id === id))?.segments.find(s => s.id === id);
  const phaseOfSeg = id => MODEL.find(p => p.segments && p.segments.some(s => s.id === id));

  const stats = {
    phases: MODEL.length,
    segs: MODEL.reduce((n, p) => n + (p.segments ? p.segments.length : 0), 0),
    steps: leaves.length
  };
  $("#countLine").textContent = `${stats.phases} 阶段 · ${stats.segs} 业务段 · ${stats.steps} 微环节`;

  /* ---------- 顶部 ---------- */
  $("#ribbon").innerHTML = MODEL.map((p, i) =>
    `${i ? '<span class="ra">→</span>' : ""}<button class="rp ${p.crossCutting ? "cross" : ""}" data-phase="${p.id}" title="${esc(p.goal)}">${esc(p.name)}</button>`).join("");

  /* ---------- 状态 ---------- */
  let state = { kind: "step", id: "C2" };   // kind: phase | segment | step
  let drawerId = null;                       // 段视图里抽屉显示的微环节
  const expanded = new Set(["P1"]);


  /* ---------- 可拖拽宽度 ---------- */
  function attachSplit(el) {
    const isSide = el.dataset.split === "side";
    const varName = isSide ? "--side-w" : "--drawer-w";
    const key = isSide ? "modao:sideW" : "modao:drawerW";
    const min = isSide ? 150 : 230, max = isSide ? 460 : 560;

    el.addEventListener("pointerdown", e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const ref = el.previousElementSibling;
      const startW = ref ? ref.getBoundingClientRect().width : 200;
      document.body.classList.add("dragging");

      const move = ev => {
        const dx = (isSide ? 1 : -1) * (ev.clientX - startX);
        const w = Math.min(max, Math.max(min, startW + dx));
        document.documentElement.style.setProperty(varName, w + "px");
      };
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        document.body.classList.remove("dragging");
        const w = Math.round(parseFloat(getComputedStyle(el.previousElementSibling).width));
        try { localStorage.setItem(key, String(w)); } catch (_) {}
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
    });

    el.addEventListener("dblclick", () => {
      document.documentElement.style.removeProperty(varName);
      try { localStorage.removeItem(key); } catch (_) {}
    });
  }

  function restoreWidths() {
    try {
      const s = localStorage.getItem("modao:sideW");
      const d = localStorage.getItem("modao:drawerW");
      if (s) document.documentElement.style.setProperty("--side-w", s + "px");
      if (d) document.documentElement.style.setProperty("--drawer-w", d + "px");
    } catch (_) {}
  }

  /* ---------- 左树 ---------- */
  function renderTree() {
    const html = MODEL.map(ph => {
      const open = expanded.has(ph.id);
      const isOn = state.kind === "phase" && state.id === ph.id;
      let h = `<button class="tn ${isOn ? "on" : ""}" data-kind="phase" data-id="${ph.id}">
          <span class="d" style="background:${ph.color}"></span>${esc(ph.name)}
          <span class="n">${ph.segments ? ph.segments.length + " 段" : ph.steps.length + " 步"}</span>
        </button>`;
      if (ph.segments && open) {
        ph.segments.forEach(seg => {
          const segOn = state.kind === "segment" && state.id === seg.id;
          h += `<button class="tn l2 ${segOn ? "on" : ""}" data-kind="segment" data-id="${seg.id}">${seg.id} ${esc(seg.name)}<span class="n">${seg.steps.length}</span></button>`;
          seg.steps.forEach(st => {
            const on = (state.kind === "step" || state.kind === "focus") && state.id === st.id;
            h += `<button class="tn l3 ${on ? "on" : ""}" data-kind="step" data-id="${st.id}" title="${st.id} ${esc(st.name)}">${st.id} ${esc(st.name)}</button>`;
          });
        });
      } else if (!ph.segments) {
        ph.steps.forEach(st => {
          const on = state.kind === "step" && state.id === st.id;
          h += `<button class="tn l2 ${on ? "on" : ""}" data-kind="step" data-id="${st.id}" title="${st.id} ${esc(st.name)}">${st.id} ${esc(st.name)}</button>`;
        });
      }
      return h;
    }).join("");
    $("#tree").innerHTML = html;
    $("#tree").querySelectorAll(".tn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.kind === "phase") {
          const p = MODEL.find(x => x.id === btn.dataset.id);
          expanded.has(p.id) ? expanded.delete(p.id) : expanded.add(p.id);
          go({ kind: "phase", id: p.id });
        } else {
          go({ kind: btn.dataset.kind, id: btn.dataset.id });
        }
      });
    });
  }

  /* ---------- 面包屑 ---------- */
  function crumb(items) {
    return `<div class="crumb">${items.map((it, i) =>
      (i ? "<i>›</i>" : "") + (it.to
        ? `<button data-go="${it.to}">${esc(it.label)}</button>`
        : `<span style="color:var(--ink2)">${esc(it.label)}</span>`)).join("")}</div>`;
  }

  /* ---------- 阶段视图 ---------- */
  function viewPhase(ph) {
    const all = ph.segments ? ph.segments.flatMap(s => s.steps) : ph.steps;
    const cards = ph.segments
      ? ph.segments.map(seg => `
        <button class="card" data-go="${seg.id}">
          <div class="ct"><span class="sq" style="background:${ph.color}1f;color:${ph.color}">${seg.id}</span>${esc(seg.name)}</div>
          <div class="cg">${esc(seg.goal)}</div>
          <div class="pre">${seg.steps.slice(0, 4).map(s => `<i>${s.id} ${esc(s.name)}</i>`).join("")}${seg.steps.length > 4 ? `<i>+${seg.steps.length - 4}</i>` : ""}</div>
          <div class="cc">${seg.steps.length} 个微环节 →</div>
        </button>`).join("")
      : ph.steps.map(st => `
        <button class="card" data-go="${st.id}">
          <div class="ct">${esc(st.name)}</div>
          <div class="cg">${esc((st.who || []).join(" · "))}</div>
          <div class="pre">${(st.outputs || []).map(o => `<i>${esc(o)}</i>`).join("")}</div>
          <div class="cc">${esc((st.systems || []).join(" / "))} →</div>
        </button>`).join("");

    return crumb([{ label: "飞针设备制造" }, { label: ph.name }]) + `
      <h2 class="title"><span class="ab" style="background:${ph.color}">${ph.id}</span>${esc(ph.name)}</h2>
      <div class="goal">${esc(ph.goal)}</div>
      ${strip(all, ph, ph.segments ? `${ph.segments.length} 个业务段` : `${ph.steps.length} 个环节`)}
      ${ph.matrix ? matrix(ph) : ""}
      <div class="cards">${cards}</div>`;
  }


  function matrix(ph) {
    const m = ph.matrix;
    const mark = v => v === "full" ? `<span class="full">●</span>` : v === "part" ? `<span class="part">○</span>` : `<span class="none">–</span>`;
    return `<div class="box" style="margin-bottom:14px">
      <h4>金蝶云星空模块 × 环节矩阵</h4>
      <table class="matrix">
        <thead><tr><th>模块</th>${m.segs.map(id => `<th>${id} ${esc(findSeg(id)?.name || "")}</th>`).join("")}</tr></thead>
        <tbody>
          ${m.modules.map(mod => `<tr><td>${esc(mod)}</td>${(m.marks[mod] || []).map(v => `<td>${mark(v)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
      <div class="legend">
        <span><b class="full">●</b> 该段主责产生单据</span>
        <span><b class="part">○</b> 只读取 / 被引用</span>
        <span><b class="none">–</b> 不涉及</span>
      </div>
    </div>`;
  }

  function strip(steps) {
    const roles = new Set(steps.flatMap(s => s.who || []));
    const sys = new Set(steps.flatMap(s => s.systems || []));
    const ai = { auto: 0, help: 0, human: 0 };
    steps.forEach(s => { if (s.ai === "可自动") ai.auto++; else if (s.ai === "可辅助") ai.help++; else if (s.ai) ai.human++; });
    return `<div class="strip">
      <span><b>${steps.length}</b> 个环节</span>
      <span><b>${roles.size}</b> 个角色</span>
      <span><b>${sys.size}</b> 个系统</span>
      ${(() => { const mods = new Set(steps.map(x => x.module).filter(Boolean)); return mods.size ? `<span><b>${mods.size}</b> 个金蝶模块</span>` : ""; })()}
      ${ai.auto ? `<span>可自动 <b>${ai.auto}</b></span>` : ""}
      ${ai.help ? `<span>可辅助 <b>${ai.help}</b></span>` : ""}
      ${ai.human ? `<span>只能人做 <b>${ai.human}</b></span>` : ""}
    </div>`;
  }


  function insights(seg) {
    const roles = [...new Set(seg.steps.flatMap(s => s.who || []))];
    const sys = [...new Set(seg.steps.flatMap(s => s.systems || []))];
    const c = { auto: 0, help: 0, human: 0 };
    seg.steps.forEach(s => { if (s.ai === "可自动") c.auto++; else if (s.ai === "可辅助") c.help++; else if (s.ai) c.human++; });
    const total = seg.steps.length || 1;
    const pct = n => Math.round((n / total) * 100);
    return `<div class="insights">
      <div class="box"><h4>涉及角色（${roles.length}）</h4><div class="chips">${roles.map(r => `<span class="chip">${esc(r)}</span>`).join("")}</div></div>
      <div class="box"><h4>系统落位（${sys.length}）</h4><div class="chips">${sys.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div></div>
      <div class="box"><h4>AI 化分布</h4>
        <div class="bar">
          ${c.auto ? `<i style="width:${pct(c.auto)}%;background:#10b981"></i>` : ""}
          ${c.help ? `<i style="width:${pct(c.help)}%;background:#f59e0b"></i>` : ""}
          ${c.human ? `<i style="width:${pct(c.human)}%;background:#cbd5e1"></i>` : ""}
        </div>
        <div class="legend">
          <span style="--c:#10b981"><b>${c.auto}</b> 可自动</span>
          <span><b>${c.help}</b> 可辅助</span>
          <span><b>${c.human}</b> 人做</span>
        </div>
      </div>
    </div>`;
  }


  function advice(seg) {
    const auto = seg.steps.filter(s => s.ai === "可自动");
    const help = seg.steps.filter(s => s.ai === "可辅助");
    const human = seg.steps.filter(s => s.ai && s.ai !== "可自动" && s.ai !== "可辅助");
    const list = arr => arr.map(s => `${s.id} ${esc(s.name)}`).join(" · ");
    return `<div class="box" style="margin-top:12px">
      <h4>线上化与 AI 落地建议</h4>
      <div class="kv">
        <em>先做（规则明确、可自动）</em>：${auto.length ? list(auto) : "本段无"}<br>
        <em>再做（人机配合）</em>：${help.length ? list(help) : "本段无"}${human.length ? `<br><em>最后动（依赖判断与关系）</em>：${list(human)}` : ""}
      </div>
    </div>`;
  }

  /* ---------- 段视图：表格 + 抽屉 ---------- */
  function viewSegment(ph, seg) {
    if (!drawerId || !seg.steps.some(s => s.id === drawerId)) drawerId = seg.steps[0].id;
    const hasModule = seg.steps.some(s => s.module);
    const rows = seg.steps.map(s => `
      <tr class="${s.id === drawerId ? "on" : ""}" data-pick="${s.id}">
        <td class="id">${s.id}</td>
        <td class="nm">${esc(s.name)}</td>
        <td class="trunc" title="${esc((s.who || []).join(" · "))}">${esc((s.who || []).join(" · "))}</td>
        <td class="trunc" title="${esc((s.inputs || []).join(" · "))}">${esc((s.inputs || []).join(" · "))}</td>
        <td class="trunc" title="${esc((s.outputs || []).join(" · "))}">${esc((s.outputs || []).join(" · "))}</td>
        <td class="trunc" title="${esc((s.systems || []).join(" / "))}">${esc((s.systems || []).join(" / "))}</td>
        ${hasModule ? `<td>${s.module ? `<span class="syschip">${esc(s.module)}</span>` : "—"}</td>` : ""}
        <td class="trunc" title="${esc(s.judge || "")}">${esc(s.judge || "—")}</td>
        <td>${tag(s.ai === "只能人做" ? "人做" : s.ai)}</td>
      </tr>`).join("");

    return crumb([{ label: "飞针设备制造" }, { label: ph.name, to: ph.id }, { label: `${seg.id} ${seg.name}` }]) + `
      <h2 class="title"><span class="ab" style="background:${ph.color}">${seg.id}</span>${esc(seg.name)}</h2>
      <div class="goal">${esc(seg.goal)} · ${seg.steps.length} 个微环节</div>
      ${strip(seg.steps)}
      <table>
        ${hasModule
          ? `<colgroup><col style="width:46px"><col style="width:20%"><col style="width:10%"><col style="width:14%">
             <col style="width:12%"><col style="width:10%"><col style="width:11%"><col style="width:17%"><col style="width:66px"></colgroup>`
          : `<colgroup><col style="width:46px"><col style="width:21%"><col style="width:11%"><col style="width:16%">
             <col style="width:13%"><col style="width:10%"><col style="width:20%"><col style="width:70px"></colgroup>`}
        <thead><tr><th>编号</th><th>微环节</th><th>谁来做</th><th>输入</th><th>产出</th><th>系统</th>${hasModule ? "<th>金蝶模块</th>" : ""}<th>判定 / 卡点</th><th>AI</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${insights(seg)}
      ${advice(seg)}`;
  }

  function viewDrawer(seg) {
    const s = seg.steps.find(x => x.id === drawerId) || seg.steps[0];
    const blk = (k, v) => v ? `<div class="dr"><div class="k">${k}</div><div class="v">${v}</div></div>` : "";
    const chips = arr => (arr && arr.length) ? `<div class="chips">${arr.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>` : "";

    return `
      <h3>${s.id} ${esc(s.name)}</h3>
      <div class="dg">${esc(s.judge || "")}</div>
      ${blk("谁来做", esc((s.who || []).join(" · ")))}
      ${blk("输入", esc((s.inputs || []).join("、")))}
      ${blk("处理动作", esc((s.actions || []).join("；")))}
      ${blk("产出记录", esc((s.outputs || []).join("、")))}
      ${blk("承载系统", chips(s.systems))}
      ${blk("金蝶模块", s.module ? `<span class="syschip">${esc(s.module)}</span>` : "")}
      ${blk("判定 / 卡点", esc(s.judge || ""))}
      ${blk("AI 化", (s.ai ? tag(s.ai) + " " : "") + esc(s.aiNote || ""))}
      <button class="more" data-detail="${s.id}">查看完整详情 →</button>`;
  }


  function segmap(seg, cur) {
    if (!seg) return "";
    return `<div class="box" style="margin-top:12px">
      <h4>本段位置（${seg.id} ${esc(seg.name)}）</h4>
      <div class="chips">
        ${seg.steps.map(x => `<button class="chip" data-detail="${x.id}" style="${x.id === cur.id ? "border-color:var(--accent);color:var(--accent);font-weight:600;background:#f5f9ff" : ""}">${x.id} ${esc(x.name)}</button>`).join("")}
      </div>
    </div>`;
  }

  function handoff(ph, seg) {
    if (!ph.segments || !seg) return "";
    const i = ph.segments.findIndex(s => s.id === seg.id);
    const prev = ph.segments[i - 1], next = ph.segments[i + 1];
    return `<div class="duo" style="grid-template-columns:1fr 1fr">
      <div class="box"><h4>上游交接</h4><div class="kv">${prev
        ? `从「${prev.id} ${esc(prev.name)}」拿到：${esc(prev.steps.slice(-1)[0].outputs.join("、"))}`
        : `本阶段起点：接收上一阶段的输出（合同 / 订单）`}</div></div>
      <div class="box"><h4>下游交接</h4><div class="kv">${next
        ? `交付给「${next.id} ${esc(next.name)}」：${esc(next.steps[0].inputs.join("、"))}`
        : `本阶段终点：交付给下一阶段`}</div></div>
    </div>`;
  }

  /* ---------- 微环节详情：纵向补满 ---------- */
  function viewStep(ph, seg, st) {
    const i = idxOf(st.id);
    const prev = leaves[i - 1], next = leaves[i + 1];
    const cell = (k, v) => v ? `<div><div class="k">${k}</div><div class="v">${v}</div></div>` : "";
    const chips = arr => (arr && arr.length) ? `<div class="chips">${arr.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>` : "";

    const chain = seg ? `
      <div class="chain">
        ${prev ? `<button class="cn" data-detail="${prev.step.id}">← ${prev.step.id} ${esc(prev.step.name)}</button>` : `<span class="cn dim">上游：—</span>`}
        <span class="cs">→</span>
        <span class="cn cur">${st.id} ${esc(st.name)}</span>
        <span class="cs">→</span>
        ${next ? `<button class="cn" data-detail="${next.step.id}">${next.step.id} ${esc(next.step.name)} →</button>` : `<span class="cn dim">下游：—</span>`}
      </div>` : "";

    const aside = `
      <div class="box"><h4>同段其他环节</h4><div class="kv">
        ${(seg ? seg.steps.filter(x => x.id !== st.id) : []).map(x =>
          `<button class="linkish" data-detail="${x.id}">${x.id} ${esc(x.name)}</button>`).join("<br>") || "—"}
      </div></div>
      <div class="box"><h4>翻页</h4><div class="kv">
        ${prev ? `<button class="linkish" data-detail="${prev.step.id}">← ${esc(prev.step.name)}</button><br>` : ""}
        ${next ? `<button class="linkish" data-detail="${next.step.id}">${esc(next.step.name)} →</button><br>` : ""}
        ${seg ? `<button class="linkish" data-go="${seg.id}">回到「${esc(seg.name)}」</button>` : ""}
      </div></div>`;

    return {
      main: crumb([{ label: "飞针设备制造" }, { label: ph.name, to: ph.id }, ...(seg ? [{ label: `${seg.id} ${seg.name}`, to: seg.id }] : []), { label: `${st.id} ${st.name}` }]) + `
        <h2 class="title"><span class="ab" style="background:${ph.color}">${st.id}</span>${esc(st.name)}${st.ai ? " " + tag(st.ai) : ""}
          ${seg ? `<button class="back" data-focus="${st.id}">← 返回列表</button>` : ""}</h2>
        <div class="goal">${esc(st.judge || "")}${st.aiNote ? " ｜ AI：" + esc(st.aiNote) : ""}</div>
        <div class="attr">
          ${cell("谁来做", esc((st.who || []).join(" · ")))}
          ${cell("输入", esc((st.inputs || []).join("、")))}
          ${cell("产出记录", esc((st.outputs || []).join("、")))}
          ${cell("承载系统", esc((st.systems || []).join(" / ")))}
          ${cell("金蝶模块", st.module ? `<span class="syschip">${esc(st.module)}</span>` : "")}
          ${cell("处理动作", esc((st.actions || []).join("；")))}
          ${cell("指标", esc((st.kpis || []).join(" · ")))}
          ${cell("常见风险", esc((st.risks || []).join("；")))}
          ${cell("AI 化", st.ai ? tag(st.ai) + " " + esc(st.aiNote || "") : "—")}
        </div>
        ${chain}
        <div class="trio">
          <div class="box"><h4>关联单据与字段</h4>${chips(st.outputs) || '<div class="kv">—</div>'}</div>
          <div class="box"><h4>AI 可以做</h4><div class="kv">${st.aiNote ? "· " + esc(st.aiNote) : "—"}</div></div>
          <div class="box"><h4>判定与风险</h4><div class="kv">
            <em>判定</em>：${esc(st.judge || "—")}<br>
            <em>风险</em>：${esc((st.risks || []).join("；") || "—")}
          </div></div>
        </div>
        ${segmap(seg, st)}
        ${handoff(ph, seg)}`,
      aside
    };
  }

  /* ---------- 渲染 ---------- */
  function render() {
    const main = $("#main");
    let ribbonPhase = "";

    if (state.kind === "phase") {
      const ph = MODEL.find(p => p.id === state.id);
      main.innerHTML = `<div class="content">${viewPhase(ph)}</div>`;
      ribbonPhase = ph.id;
      expanded.add(ph.id);
    } else if (state.kind === "focus") {
      const l = findLeaf(state.id);
      drawerId = state.id;
      main.innerHTML = `<div class="content">${viewSegment(l.phase, l.seg)}</div><div class="splitter" data-split="drawer"></div><aside class="drawer">${viewDrawer(l.seg)}</aside>`;
      ribbonPhase = l.phase.id;
      expanded.add(l.phase.id);
    } else if (state.kind === "segment") {
      const ph = phaseOfSeg(state.id), seg = findSeg(state.id);
      main.innerHTML = `<div class="content">${viewSegment(ph, seg)}</div><div class="splitter" data-split="drawer"></div><aside class="drawer">${viewDrawer(seg)}</aside>`;
      ribbonPhase = ph.id;
    } else {
      const l = findLeaf(state.id);
      const v = viewStep(l.phase, l.seg, l.step);
      main.innerHTML = `<div class="content">${v.main}</div><div class="splitter" data-split="drawer"></div><aside class="aside">${v.aside}</aside>`;
      ribbonPhase = l.phase.id;
      expanded.add(l.phase.id);
      drawerId = l.step.id;
    }

    document.querySelectorAll(".rp").forEach(b => b.classList.toggle("on", b.dataset.phase === ribbonPhase));
    renderTree();
    bind();
  }

  function bind() {
    document.querySelectorAll("[data-split]").forEach(el => { if (!el.dataset.bound) { attachSplit(el); el.dataset.bound = "1"; } });
    $("#main").querySelectorAll("[data-split]").forEach(el => { if (!el.dataset.bound) { attachSplit(el); el.dataset.bound = "1"; } });
    $("#main").querySelectorAll("[data-focus]").forEach(el =>
      el.addEventListener("click", e => { e.stopPropagation(); go({ kind: "focus", id: el.dataset.focus }); }));
    $("#main").querySelectorAll("[data-detail]").forEach(el =>
      el.addEventListener("click", e => { e.stopPropagation(); go({ kind: "step", id: el.dataset.detail }); }));
    $("#main").querySelectorAll("[data-go]").forEach(el =>
      el.addEventListener("click", e => { e.stopPropagation(); go(resolve(el.dataset.go)); }));
    $("#main").querySelectorAll("[data-pick]").forEach(tr =>
      tr.addEventListener("click", () => {
        drawerId = tr.dataset.pick;
        render();
      }));
  }

  function resolve(token) {
    if (!token) return null;
    if (token.startsWith("phase:")) return { kind: "phase", id: token.slice(6) };
    if (token.startsWith("seg:")) return { kind: "segment", id: token.slice(4) };
    if (token.startsWith("step:")) return { kind: "step", id: token.slice(5) };
    if (/^P\d$/.test(token)) return { kind: "phase", id: token };
    if (/^[A-F]$/.test(token)) return { kind: "segment", id: token };
    if (idxOf(token) >= 0) return { kind: "focus", id: token };
    return null;
  }

  function go(s) {
    if (!s) return;
    state = s;
    render();
    $("#main").scrollTop = 0;
    const hash = s.kind === "step" ? "step:" + s.id : s.kind === "segment" ? "seg:" + s.id
      : s.kind === "focus" ? s.id : "phase:" + s.id;
    history.replaceState(null, "", "#" + hash);
    if (s.kind === "segment") {
      const seg = findSeg(s.id);
      drawerId = seg.steps[0].id;
      render();
    }
  }

  /* 顶部条、密度切换 */
  document.querySelectorAll(".rp").forEach(b => b.addEventListener("click", () => go({ kind: "phase", id: b.dataset.phase })));
  $("#density").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    document.querySelectorAll("#density button").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    document.body.classList.toggle("only-main", b.dataset.mode === "main");
  });

  /* 深链 */
  restoreWidths();
  const h = decodeURIComponent(location.hash.replace("#", ""));
  const initial = h ? resolve(h) : { kind: "segment", id: "A" };
  go(initial || { kind: "segment", id: "A" });
})();
