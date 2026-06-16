// AUTO-GENERATED from prover-charts.jsx — edit the .jsx, run `npm run build`.
(function () {
"use strict";
// ==============================================================
// OP-ZiSK Prover — chart components → window.
// Sparkline, Timeline (stage gantt), ProofTrend (proof-time series).
// ==============================================================
const {
  pad: _pad,
  fmtSecs: _fmtSecs,
  fmtClock: _fmtClock,
  fmtBlock: _fmtBlock,
  SHORT: _SHORT
} = window.PU;

// ---------------------- sparkline ----------------------
function Sparkline({
  data,
  w = 150,
  h = 30
}) {
  if (!data || data.length < 2) return /*#__PURE__*/React.createElement("svg", {
    className: "spark-svg",
    viewBox: `0 0 ${w} ${h}`
  });
  const min = Math.min(...data),
    max = Math.max(...data);
  const rng = max - min || 1;
  const n = data.length;
  const x = i => i / (n - 1) * w;
  const y = v => h - 3 - (v - min) / rng * (h - 6);
  const line = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return /*#__PURE__*/React.createElement("svg", {
    className: "spark-svg",
    viewBox: `0 0 ${w} ${h}`,
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: area,
    fill: "rgba(95,114,87,0.14)"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: line,
    fill: "none",
    stroke: "var(--accent)",
    strokeWidth: "1.6",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: x(n - 1),
    cy: y(data[n - 1]),
    r: "2.4",
    fill: "var(--accent)"
  }));
}

// ---------------------- stage timeline ----------------------
function Timeline({
  job,
  showAxis = true
}) {
  // size each stage by its REAL duration if done, else its historical expected width.
  // this stops the in-progress "100% / tiny active sliver" bug.
  const sizeMs = s => s.durationMs > 0 ? s.durationMs : s.expectedMs || 0;
  const total = job.stages.reduce((a, x) => a + sizeMs(x), 0);
  const timed = total > 0;
  // ONE fr array drives BOTH the grid columns AND the playhead position — so the line
  // is always at the active bar's fill edge. true time-proportions (tiny 0.6 floor only
  // so a near-zero phase never collapses to invisible).
  const fr = job.stages.map(s => timed ? Math.max(0.6, sizeMs(s) / total * 100) : 1);
  const totalFr = fr.reduce((a, b) => a + b, 0);
  const cols = fr.map(f => f + "fr").join(" ");
  const isLive = job.status === "proving";
  let headFr = 0;
  for (let i = 0; i < job.stages.length; i++) {
    const st = job.stages[i];
    if (st.status === "done") {
      headFr += fr[i];
      continue;
    }
    if (st.status === "active") {
      const denom = st.durationMs || st.expectedMs || 0;
      headFr += denom ? Math.min(1, st.elapsedMs / denom) * fr[i] : 0;
    }
    break;
  }
  const elapsedPct = totalFr ? Math.min(100, headFr / totalFr * 100) : 0;
  const ticks = [];
  if (timed) {
    const stepS = total / 1000 > 360 ? 120 : 60;
    for (let s = 0; s <= total / 1000 + 1; s += stepS) {
      ticks.push({
        pct: Math.min(100, s / (total / 1000) * 100),
        label: `${Math.floor(s / 60)}:${_pad(s % 60)}`
      });
    }
  }
  const cellState = (st, i) => st.status === "done" || i < job.stageIndex ? "done" : st.status === "active" || i === job.stageIndex && isLive ? "active" : "pending";
  return /*#__PURE__*/React.createElement("div", {
    className: "tl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-labels",
    style: {
      gridTemplateColumns: cols
    }
  }, job.stages.map((st, i) => {
    const cls = cellState(st, i);
    const wide = !timed || sizeMs(st) / total > 0.08; // hide cramped labels entirely (no overlap)
    return /*#__PURE__*/React.createElement("div", {
      key: st.key,
      className: "tl-lab " + cls
    }, wide && /*#__PURE__*/React.createElement("span", {
      className: "ix"
    }, _pad(i + 1)), wide && /*#__PURE__*/React.createElement("span", {
      className: "nm"
    }, _SHORT[st.key]));
  })), /*#__PURE__*/React.createElement("div", {
    className: "tl-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-track",
    style: {
      gridTemplateColumns: cols
    }
  }, job.stages.map((st, i) => {
    const cls = cellState(st, i);
    const denom = st.durationMs || st.expectedMs || 0;
    const pct = cls === "done" ? 100 : denom ? Math.min(98, st.elapsedMs / denom * 100) : cls === "active" ? 40 : 0;
    const wide = !timed || sizeMs(st) / total > 0.07;
    return /*#__PURE__*/React.createElement("div", {
      key: st.key,
      className: "cell " + cls
    }, /*#__PURE__*/React.createElement("span", {
      className: "fill",
      style: {
        width: pct + "%"
      }
    }), cls === "done" && wide && st.durationMs > 0 && /*#__PURE__*/React.createElement("span", {
      className: "cell-dur"
    }, _fmtSecs(st.durationMs)), cls === "active" && wide && st.elapsedMs > 0 && /*#__PURE__*/React.createElement("span", {
      className: "cell-dur"
    }, _fmtSecs(st.elapsedMs)), cls === "pending" && wide && st.expectedMs > 0 && /*#__PURE__*/React.createElement("span", {
      className: "cell-dur"
    }, "~", _fmtSecs(st.expectedMs)));
  })), isLive && /*#__PURE__*/React.createElement("div", {
    className: "playhead",
    style: {
      left: elapsedPct + "%"
    }
  }), showAxis && /*#__PURE__*/React.createElement("div", {
    className: "tl-axis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "base"
  }), ticks.map((tk, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "tick",
    style: {
      left: tk.pct + "%"
    }
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("span", null, tk.label))))));
}

// ---------------------- proof-time trend (interactive time series) ----------------------
// One point per recent range, oldest → newest. Hover anywhere to inspect that range's
// proof time + blocks; click to open it. Median / p95 reference lines for context.
function ProofTrend({
  jobs,
  stats
}) {
  const [hover, setHover] = React.useState(null);
  const pts = (jobs || []).filter(j => j.elapsedMs > 0).slice().reverse() // chronological: oldest → newest
  .map(j => ({
    ms: j.elapsedMs,
    id: j.id,
    s: j.rangeStart,
    e: j.rangeEnd,
    blk: j.blocks
  }));
  if (pts.length < 2 || !stats) return /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "Not enough data yet");

  // wide viewBox ≈ panel aspect so the chart renders near 1:1 (crisp, not 2x-upscaled)
  const W = 1200,
    H = 210;
  const padL = 46,
    padR = 22,
    padT = 18,
    padB = 30;
  const plotW = W - padL - padR,
    plotH = H - padT - padB,
    baseY = padT + plotH;
  const secs = pts.map(p => p.ms / 1000);
  const top = Math.max(...secs, stats.p95 || 0) * 1.08;
  const xFor = i => padL + i / (pts.length - 1) * plotW;
  const yFor = s => baseY - s / (top || 1) * plotH;
  const fmtT = s => `${Math.floor(s / 60)}:${_pad(Math.round(s) % 60)}`;
  const coords = secs.map((s, i) => ({
    x: xFor(i),
    y: yFor(s)
  }));
  const line = coords.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `M${coords[0].x.toFixed(1)} ${baseY} ` + coords.map(p => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + ` L${coords[coords.length - 1].x.toFixed(1)} ${baseY} Z`;
  const refs = [{
    s: stats.p50,
    color: "var(--accent)"
  }, {
    s: stats.p95,
    color: "var(--t3)"
  }];
  const yTicks = [0, stats.p50, top].filter((v, i, a) => v != null && a.indexOf(v) === i);
  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = (e.clientX - r.left) / r.width * W; // mouse x in viewBox units
    const i = Math.round((vx - padL) / plotW * (pts.length - 1));
    setHover(Math.max(0, Math.min(pts.length - 1, i)));
  };
  const hp = hover != null ? {
    ...pts[hover],
    ...coords[hover]
  } : null;
  const lastC = coords[coords.length - 1];
  return /*#__PURE__*/React.createElement("div", {
    className: "hist"
  }, /*#__PURE__*/React.createElement("div", {
    className: "trend-wrap",
    onMouseMove: onMove,
    onMouseLeave: () => setHover(null),
    onClick: () => hp && (window.location.hash = "#/block/" + hp.id)
  }, /*#__PURE__*/React.createElement("svg", {
    className: "hist-svg",
    viewBox: `0 0 ${W} ${H}`,
    style: {
      width: "100%",
      height: "auto",
      display: "block",
      cursor: hp ? "pointer" : "default"
    }
  }, yTicks.map((v, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: padL - 8,
    y: yFor(v) + 3.5,
    textAnchor: "end",
    fill: "var(--t3)",
    style: {
      font: "500 10px var(--mono)"
    }
  }, fmtT(v))), refs.map((r, i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: padL,
    y1: yFor(r.s),
    x2: W - padR,
    y2: yFor(r.s),
    stroke: r.color,
    strokeWidth: "1.4",
    strokeDasharray: "4 4",
    opacity: "0.65"
  })), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: "var(--dark)",
    opacity: "0.05"
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: "var(--dark)",
    strokeWidth: "2",
    strokeLinejoin: "round",
    strokeLinecap: "round",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: lastC.x,
    cy: lastC.y,
    r: "3.4",
    fill: "var(--dark)"
  }), hp && /*#__PURE__*/React.createElement("line", {
    x1: hp.x,
    y1: padT,
    x2: hp.x,
    y2: baseY,
    stroke: "var(--accent)",
    strokeWidth: "1",
    opacity: "0.45"
  }), hp && /*#__PURE__*/React.createElement("circle", {
    cx: hp.x,
    cy: hp.y,
    r: "5",
    fill: "var(--accent)",
    stroke: "#fff",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("text", {
    x: padL,
    y: H - 7,
    textAnchor: "start",
    fill: "var(--t4)",
    style: {
      font: "500 10px var(--mono)"
    }
  }, "older"), /*#__PURE__*/React.createElement("text", {
    x: W - padR,
    y: H - 7,
    textAnchor: "end",
    fill: "var(--t4)",
    style: {
      font: "500 10px var(--mono)"
    }
  }, "latest")), hp && /*#__PURE__*/React.createElement("div", {
    className: "trend-tip",
    style: {
      left: `${hp.x / W * 100}%`,
      top: `${hp.y / H * 100}%`
    }
  }, /*#__PURE__*/React.createElement("b", null, fmtT(hp.ms / 1000)), /*#__PURE__*/React.createElement("span", null, _fmtBlock(hp.s), " \u2192 ", _fmtBlock(hp.e), " \xB7 ", hp.blk, " blk"))), /*#__PURE__*/React.createElement("div", {
    className: "hist-legend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hl-t"
  }, "fastest"), /*#__PURE__*/React.createElement("b", null, fmtT(stats.fastest))), /*#__PURE__*/React.createElement("span", {
    className: "hl"
  }, /*#__PURE__*/React.createElement("i", {
    className: "sw",
    style: {
      background: "var(--accent)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "hl-t"
  }, "median"), /*#__PURE__*/React.createElement("b", null, fmtT(stats.p50))), /*#__PURE__*/React.createElement("span", {
    className: "hl"
  }, /*#__PURE__*/React.createElement("i", {
    className: "sw",
    style: {
      background: "var(--t3)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "hl-t"
  }, "p95"), /*#__PURE__*/React.createElement("b", null, fmtT(stats.p95))), /*#__PURE__*/React.createElement("span", {
    className: "hl grow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hl-t"
  }, "slowest"), /*#__PURE__*/React.createElement("b", null, fmtT(stats.slowest)))));
}
Object.assign(window, {
  Sparkline,
  Timeline,
  ProofTrend
});
})();
