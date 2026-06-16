// AUTO-GENERATED from prover-app.jsx — edit the .jsx, run `npm run build`.
// ==============================================================
// OP-ZiSK Prover — app shell + hash router + views.
// Views: dashboard (live) · blocks (list) · block (detail).
// Depends on window.PU (util), window.{Sparkline,Timeline,ProofTrend},
// and window.proverFeed (data).
// ==============================================================
const {
  useState,
  useEffect
} = React;
const {
  pad,
  fmtClock,
  fmtSecs,
  fmtDur,
  fmtNum,
  fmtCompact,
  fmtBlock,
  fmtBytes,
  fmtUSD,
  shortHash,
  timeAgo,
  jobCost,
  jobTotalMs,
  FULL,
  stageStatus
} = window.PU;
const {
  Sparkline,
  Timeline,
  ProofTrend
} = window;
const nav = hash => {
  window.location.hash = hash;
};
function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, "");
  if (h.startsWith("block/")) return {
    name: "block",
    id: decodeURIComponent(h.slice(6))
  };
  if (h.startsWith("blocks")) return {
    name: "blocks"
  };
  return {
    name: "dashboard"
  };
}

// ======================= THEME TOGGLE =======================
function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute("data-theme") === "dark");
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("opzisk-theme", next);
    } catch (e) {}
    setDark(!dark);
  };
  return /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    type: "button",
    title: dark ? "Light mode" : "Dark mode",
    onClick: flip
  }, dark ? /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "19",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 10.2A6.2 6.2 0 1 1 7.8 3a4.8 4.8 0 0 0 7.2 7.2Z"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "19",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "9",
    r: "3.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 1.5v1.8M9 14.7v1.8M1.5 9h1.8M14.7 9h1.8M3.7 3.7l1.3 1.3M13 13l1.3 1.3M3.7 14.3l1.3-1.3M13 5l1.3-1.3"
  })));
}

// ======================= SEARCH (job id · block · host) =======================
function Search({
  snap
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const all = [];
  if (snap.active) all.push(snap.active);
  snap.queue.forEach(j => all.push(j));
  snap.history.forEach(j => all.push(j));
  const query = q.trim().toLowerCase();
  const num = parseInt(query.replace(/[^0-9]/g, ""), 10);
  const results = !query ? [] : all.filter(j => {
    if (j.id.toLowerCase().includes(query)) return true;
    if (j.host.toLowerCase().includes(query)) return true;
    if (!isNaN(num) && num >= j.rangeStart && num <= j.rangeEnd) return true;
    if (String(j.rangeStart).includes(query) || String(j.rangeEnd).includes(query)) return true;
    return false;
  }).slice(0, 7);
  const go = job => {
    if (!job) return;
    setQ("");
    setOpen(false);
    nav(`#/block/${job.id}`);
  };
  const onKey = e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      go(results[hi]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "search-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "search"
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-ico"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "7",
    r: "4.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 11l3 3",
    strokeLinecap: "round"
  }))), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search ranges, JOB id\u2026",
    value: q,
    onChange: e => {
      setQ(e.target.value);
      setOpen(true);
      setHi(0);
    },
    onFocus: () => setOpen(true),
    onBlur: () => setTimeout(() => setOpen(false), 140),
    onKeyDown: onKey
  })), open && query && /*#__PURE__*/React.createElement("div", {
    className: "search-pop"
  }, results.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "sp-empty"
  }, "No match for \u201C", q, "\u201D"), results.map((j, i) => /*#__PURE__*/React.createElement("div", {
    key: j.id,
    className: "sp-row" + (i === hi ? " on" : ""),
    onMouseDown: () => go(j),
    onMouseEnter: () => setHi(i)
  }, /*#__PURE__*/React.createElement("span", {
    className: "sp-dot " + j.status
  }), /*#__PURE__*/React.createElement("div", {
    className: "sp-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sp-range"
  }, fmtBlock(j.rangeStart), /*#__PURE__*/React.createElement("span", {
    className: "arw"
  }, "\u2192"), fmtBlock(j.rangeEnd)), /*#__PURE__*/React.createElement("div", {
    className: "sp-sub"
  }, j.id, " \xB7 ", j.blocks, " blk \xB7 ", j.host)), /*#__PURE__*/React.createElement("span", {
    className: "sp-tag"
  }, j.status)))));
}

// ======================= TOP BAR (greeting + search) =======================
function MainBar({
  title,
  sub,
  snap,
  now,
  back
}) {
  const t = new Date(now);
  const r = parseHash();
  const tabs = [{
    k: "dashboard",
    label: "Live",
    hash: "#/"
  }, {
    k: "blocks",
    label: "Blocks",
    hash: "#/blocks"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "apphead"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ah-left"
  }, back && /*#__PURE__*/React.createElement("button", {
    className: "ah-back",
    onClick: () => nav(back)
  }, "\u2190"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ah-brand",
    onClick: () => nav("#/"),
    title: "OP \xD7 ZisK"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wm-op"
  }, "OP"), /*#__PURE__*/React.createElement("span", {
    className: "wm-x"
  }, "\xD7"), /*#__PURE__*/React.createElement("span", {
    className: "wm-zisk"
  }, "ZisK")), /*#__PURE__*/React.createElement("h1", {
    className: "ah-title"
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    className: "ah-sub"
  }, sub))), /*#__PURE__*/React.createElement("div", {
    className: "ah-right"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "ah-nav"
  }, tabs.map(tb => /*#__PURE__*/React.createElement("a", {
    key: tb.k,
    className: "ah-tab" + (r.name === tb.k ? " on" : ""),
    href: tb.hash,
    onClick: e => {
      e.preventDefault();
      nav(tb.hash);
    }
  }, tb.label))), /*#__PURE__*/React.createElement(Search, {
    snap: snap
  }), /*#__PURE__*/React.createElement("span", {
    className: "conn-pill" + (snap.connected ? "" : " off")
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot" + (snap.connected ? " live" : "")
  }), snap.connected ? "Live" : "Offline"), /*#__PURE__*/React.createElement("span", {
    className: "clock"
  }, pad(t.getUTCHours()), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, ":"), pad(t.getUTCMinutes()), /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, ":"), pad(t.getUTCSeconds()), " UTC"), /*#__PURE__*/React.createElement(ThemeToggle, null), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Notifications"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 2a4 4 0 0 0-4 4c0 4-1.5 5-1.5 5h11S13 10 13 6a4 4 0 0 0-4-4ZM7.5 14.5a1.5 1.5 0 0 0 3 0"
  })), /*#__PURE__*/React.createElement("span", {
    className: "dotred"
  }))));
}

// ======================= METRIC RAIL =======================
function Rail({
  snap
}) {
  const s = snap.stats,
    m = snap.metrics;
  const behind = snap.l2Head && snap.l2ProvenFrontier ? snap.l2Head - snap.l2ProvenFrontier : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Proven"), /*#__PURE__*/React.createElement("span", {
    className: "m-v green"
  }, m ? m.rangesProven : s.provenToday, /*#__PURE__*/React.createElement("span", {
    className: "u"
  }, "ranges \xB7 ", m ? m.blocksProven : 0, " blk"))), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Throughput"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, m && m.blocksPerHour ? m.blocksPerHour.toFixed(1) : "—", /*#__PURE__*/React.createElement("span", {
    className: "u"
  }, "blk/hr"))), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Avg / range"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, fmtDur(s.avgProveMs), /*#__PURE__*/React.createElement("span", {
    className: "u"
  }, "p95 ", fmtDur(s.p95Ms)))), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Proven frontier"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, snap.l2ProvenFrontier ? fmtBlock(snap.l2ProvenFrontier) : "—")), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Behind tip"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, behind ? fmtNum(behind) : "—", /*#__PURE__*/React.createElement("span", {
    className: "u"
  }, "blocks"))), /*#__PURE__*/React.createElement("div", {
    className: "m grow spark"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Range time \xB7 last ", snap.recentDurations.length), /*#__PURE__*/React.createElement(Sparkline, {
    data: snap.recentDurations
  })));
}

// ======================= CURRENT JOB (hero) =======================
function CurrentJob({
  job
}) {
  if (!job) {
    return /*#__PURE__*/React.createElement("div", {
      className: "hero"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sec-t"
    }, "Currently proving"), /*#__PURE__*/React.createElement("span", {
      className: "rule"
    })), /*#__PURE__*/React.createElement("div", {
      className: "hero-card",
      style: {
        cursor: "default"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "empty"
    }, "Idle \u2014 awaiting next range\u2026")));
  }
  // progress + ETA come from the bridge (historical-avg based) — never the 100% done-only bug
  const pct = job.progress != null ? job.progress : Math.min(100, job.elapsedMs / (jobTotalMs(job) || 1) * 100);
  const ai = Math.min(job.stageIndex, job.stages.length - 1);
  const active = job.stages[ai];
  const ss = stageStatus(job, active);
  return /*#__PURE__*/React.createElement("div", {
    className: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Currently proving"), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, job.id), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, "stage ", Math.min(job.stageIndex + 1, job.stages.length), " / ", job.stages.length)), /*#__PURE__*/React.createElement("div", {
    className: "hero-card",
    onClick: () => nav(`#/block/${job.id}`)
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-top"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero-id"
  }, job.stalled ? /*#__PURE__*/React.createElement("span", {
    className: "live-tag stalled"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ld"
  }), "Stalled") : /*#__PURE__*/React.createElement("span", {
    className: "live-tag"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ld"
  }), "Proving"), /*#__PURE__*/React.createElement("span", {
    className: "jid"
  }, job.host), job.stalled && /*#__PURE__*/React.createElement("span", {
    className: "flag"
  }, "\u26A0 no GPU progress \xB7 ", fmtDur(active.elapsedMs), " in ", FULL[active.key])), /*#__PURE__*/React.createElement("h1", {
    className: "hero-range"
  }, fmtBlock(job.rangeStart), /*#__PURE__*/React.createElement("span", {
    className: "arw"
  }, "\u2192"), fmtBlock(job.rangeEnd)), /*#__PURE__*/React.createElement("div", {
    className: "hero-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mi"
  }, /*#__PURE__*/React.createElement("b", null, job.blocks), " block", job.blocks > 1 ? "s" : ""), job.proofBytes > 0 && /*#__PURE__*/React.createElement("span", {
    className: "mi"
  }, /*#__PURE__*/React.createElement("b", null, fmtBytes(job.proofBytes)), " proof"), /*#__PURE__*/React.createElement("span", {
    className: "mi"
  }, "range proof"))), /*#__PURE__*/React.createElement("div", {
    className: "hero-timers"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tmr big"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tl"
  }, "Elapsed"), /*#__PURE__*/React.createElement("span", {
    className: "tv"
  }, fmtDur(job.elapsedMs))), /*#__PURE__*/React.createElement("div", {
    className: "tmr"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tl"
  }, "ETA"), /*#__PURE__*/React.createElement("span", {
    className: "tv eta"
  }, job.stalled ? "—" : fmtDur(job.etaMs))), /*#__PURE__*/React.createElement("div", {
    className: "tmr"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tl"
  }, "Progress"), /*#__PURE__*/React.createElement("span", {
    className: "tv pct" + (job.stalled ? " stall" : "")
  }, job.stalled ? "STALL" : Math.round(pct) + "%")))), /*#__PURE__*/React.createElement(Timeline, {
    job: job
  }), /*#__PURE__*/React.createElement("div", {
    className: "callout"
  }, /*#__PURE__*/React.createElement("span", {
    className: "play"
  }, "\u25B6"), /*#__PURE__*/React.createElement("span", {
    className: "cstage"
  }, FULL[active.key]), /*#__PURE__*/React.createElement("span", {
    className: "cstatus"
  }, /*#__PURE__*/React.createElement("b", null, ss.sub)), /*#__PURE__*/React.createElement("span", {
    className: "cright"
  }, fmtSecs(active.elapsedMs), active.expectedMs > 0 ? ` / ~${fmtSecs(active.expectedMs)} exp` : ""))));
}

// ======================= shared bits =======================
function StatusTag({
  status
}) {
  const label = {
    proven: "Proven",
    failed: "Failed",
    proving: "Proving",
    queued: "Queued",
    agg: "Aggregated"
  }[status] || status;
  return /*#__PURE__*/React.createElement("span", {
    className: "tag " + status
  }, /*#__PURE__*/React.createElement("span", {
    className: "td"
  }), label);
}
function MiniStrip({
  job
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "strip"
  }, job.stages.map((st, i) => /*#__PURE__*/React.createElement("i", {
    key: i,
    className: st.status === "done" ? "done" : st.status === "active" ? "active" : ""
  })));
}

// ======================= QUEUE =======================
const QUEUE_PAGE = 6;
function Queue({
  queue,
  perAgg
}) {
  const [shown, setShown] = useState(QUEUE_PAGE);
  const N = perAgg || 2;
  const visible = queue.slice(0, shown);
  const more = queue.length - visible.length;
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Queue"), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, queue.length), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, "witness-cached \xB7 range proofs")), queue.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "Queue empty"), visible.map((job, i) => {
    // after every N range proofs an aggregation fires — show the divider + which ranges it spans
    const aggBoundary = (i + 1) % N === 0;
    const grp = visible.slice(i - N + 1, i + 1);
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: job.id
    }, /*#__PURE__*/React.createElement("div", {
      className: "qrow",
      onClick: () => nav(`#/block/${job.id}`)
    }, /*#__PURE__*/React.createElement("span", {
      className: "qpos"
    }, pad(i + 1)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "q-range"
    }, fmtBlock(job.rangeStart), /*#__PURE__*/React.createElement("span", {
      className: "arw"
    }, "\u2192"), fmtBlock(job.rangeEnd)), /*#__PURE__*/React.createElement("div", {
      className: "q-sub"
    }, "range proof \xB7 ", job.blocks, " blk")), /*#__PURE__*/React.createElement("div", {
      className: "q-right"
    }, /*#__PURE__*/React.createElement("span", {
      className: "qtag range"
    }, "range"))), aggBoundary && grp.length === N && /*#__PURE__*/React.createElement("div", {
      className: "qagg"
    }, /*#__PURE__*/React.createElement("span", {
      className: "qagg-i"
    }, "\u2295"), /*#__PURE__*/React.createElement("span", {
      className: "qagg-t"
    }, "PLONK agg \xB7 ", N, " ranges \xB7 ", grp.reduce((s, g) => s + g.blocks, 0), " blocks"), /*#__PURE__*/React.createElement("span", {
      className: "qagg-r"
    }, fmtBlock(grp[0].rangeStart), " \u2192 ", fmtBlock(grp[grp.length - 1].rangeEnd))));
  }), more > 0 && /*#__PURE__*/React.createElement("div", {
    className: "qmore",
    onClick: () => setShown(shown + QUEUE_PAGE)
  }, "Load ", Math.min(QUEUE_PAGE, more), " more \xB7 ", more, " hidden"), shown > QUEUE_PAGE && /*#__PURE__*/React.createElement("div", {
    className: "qmore",
    onClick: () => setShown(QUEUE_PAGE)
  }, "Collapse"), /*#__PURE__*/React.createElement("div", {
    className: "qdepth"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ql"
  }, "Backlog depth"), /*#__PURE__*/React.createElement("span", {
    className: "qv"
  }, queue.length, " ranges \xB7 ", queue.reduce((s, j) => s + j.blocks, 0), " blocks witness-cached")));
}

// ======================= DASHBOARD =======================
const STREAM_COLS = "1.5fr 0.55fr 1fr 0.8fr 0.85fr";
function StreamTable({
  history
}) {
  const rows = history.slice(0, 8);
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Proving stream"), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, "live"), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("a", {
    className: "sec-link",
    href: "#/blocks",
    onClick: e => {
      e.preventDefault();
      nav("#/blocks");
    }
  }, "all blocks \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-h",
    style: {
      gridTemplateColumns: STREAM_COLS
    }
  }, /*#__PURE__*/React.createElement("span", null, "Range"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Blocks"), /*#__PURE__*/React.createElement("span", null, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Proof time"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Status")), rows.map(job => /*#__PURE__*/React.createElement("div", {
    key: job.id,
    className: "row",
    style: {
      gridTemplateColumns: STREAM_COLS
    },
    onClick: () => nav(`#/block/${job.id}`)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "c-range"
  }, fmtBlock(job.rangeStart), /*#__PURE__*/React.createElement("span", {
    className: "arw"
  }, "\u2192"), fmtBlock(job.rangeEnd)), /*#__PURE__*/React.createElement("div", {
    className: "c-id"
  }, job.id, " \xB7 ", timeAgo(job.finishedAt))), /*#__PURE__*/React.createElement("div", {
    className: "c-blk"
  }, job.blocks), /*#__PURE__*/React.createElement(MiniStrip, {
    job: job
  }), /*#__PURE__*/React.createElement("div", {
    className: "c-time"
  }, fmtClock(job.elapsedMs)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement(StatusTag, {
    status: job.status
  })))));
}

// ======================= CLUSTER (live worker roster) =======================
function Cluster({
  cluster
}) {
  const ws = cluster.workers || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Cluster"), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, cluster.workersConnected), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, "workers \xB7 ", cluster.activeJobs, " active")), ws.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No worker job records"), ws.map(w => {
    const total = (w.success || 0) + (w.failure || 0);
    const pct = total ? Math.round(w.success / total * 100) : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: w.id,
      className: "qrow",
      style: {
        cursor: "default"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "qpos"
    }, "W", w.id), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "q-range"
    }, "worker ", w.id), /*#__PURE__*/React.createElement("div", {
      className: "q-sub"
    }, w.success, " ok \xB7 ", w.failure, " fail")), /*#__PURE__*/React.createElement("div", {
      className: "q-right"
    }, /*#__PURE__*/React.createElement("span", {
      className: "q-eta"
    }, pct, "% ok")));
  }));
}

// ======================= NETWORK METRICS (real ledger aggregates) =======================
function NetMetrics({
  m
}) {
  if (!m) return null;
  const cell = (l, v, s) => /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, l), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, v), s && /*#__PURE__*/React.createElement("div", {
    className: "ms"
  }, s));
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Network metrics"), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, m.rangesProven, " ranges \xB7 ", m.blocksProven, " blocks \xB7 from ledger")), /*#__PURE__*/React.createElement("div", {
    className: "mgrid det-grid"
  }, cell("Throughput", m.blocksPerHour ? m.blocksPerHour.toFixed(1) : "—", "blocks / hour"), cell("Sec / block", m.secPerBlock ? m.secPerBlock.toFixed(0) + "s" : "—", "proving rate"), cell("Avg range size", m.avgRangeBlocks ? m.avgRangeBlocks.toFixed(1) : "—", "blocks / range"), cell("Avg gas / block", m.avgGasPerBlock ? fmtCompact(m.avgGasPerBlock) : "—", m.gasCount + " measured"), cell("Avg witness gen", fmtDur(m.avgWitnessMs), "kona host"), cell("Avg prove", fmtDur(m.avgProveMs), "after witness"), cell("Avg total / range", fmtDur(m.avgTotalMs), m.measuredCount + " measured"), cell("Avg agg (PLONK)", m.aggCount ? fmtDur(m.avgAggMs) : "—", (m.aggCount || 0) + " batch" + (m.aggCount === 1 ? "" : "es")), cell("Proof instances / range", m.instancesAvailable ? fmtNum(m.avgInstances) : "—", m.avgMain ? "Main " + fmtNum(m.avgMain) : "ZisK segments"), cell("Avg proof size", m.avgProofBytes ? fmtBytes(m.avgProofBytes) : "—", "range STARK"), cell("Backlog", (m.backlogRanges || 0) + " ranges", (m.backlogBlocks || 0) + " blocks witness-cached"), cell("Total gas proven", m.totalGas ? fmtCompact(m.totalGas) : "—", null)));
}
function Dashboard({
  snap,
  now
}) {
  const m = snap.metrics;
  return /*#__PURE__*/React.createElement("div", {
    className: "view"
  }, /*#__PURE__*/React.createElement(MainBar, {
    title: "Live",
    sub: snap.source || "real-time OP range proving",
    snap: snap,
    now: now
  }), /*#__PURE__*/React.createElement(CurrentJob, {
    job: snap.active
  }), /*#__PURE__*/React.createElement(Rail, {
    snap: snap
  }), /*#__PURE__*/React.createElement(NetMetrics, {
    m: m
  }), /*#__PURE__*/React.createElement("div", {
    className: "panel-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Proof-time trend"), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, "last ", snap.stats.dist ? snap.stats.dist.total : 0, " ranges")), /*#__PURE__*/React.createElement(ProofTrend, {
    jobs: snap.history,
    stats: snap.stats.dist
  })), /*#__PURE__*/React.createElement("div", {
    className: "dash-grid"
  }, /*#__PURE__*/React.createElement(Queue, {
    queue: snap.queue,
    perAgg: m && m.rangesPerAgg
  }), /*#__PURE__*/React.createElement(AggList, {
    aggs: snap.aggregations
  })), /*#__PURE__*/React.createElement(StreamTable, {
    history: snap.history
  }));
}

// ======================= AGGREGATIONS =======================
function AggList({
  aggs
}) {
  const [shown, setShown] = useState(5);
  if (!aggs || !aggs.length) return null;
  const visible = aggs.slice(0, shown);
  const more = aggs.length - visible.length;
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Aggregations"), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, aggs.length), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, "PLONK \xB7 batches of range proofs")), visible.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "qrow",
    onClick: () => nav(`#/block/${a.id}`)
  }, /*#__PURE__*/React.createElement("span", {
    className: "qpos agg"
  }, "\u2295"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "q-range"
  }, fmtBlock(a.rangeStart), /*#__PURE__*/React.createElement("span", {
    className: "arw"
  }, "\u2192"), fmtBlock(a.rangeEnd)), /*#__PURE__*/React.createElement("div", {
    className: "q-sub"
  }, a.ranges, " ranges \xB7 ", a.blocks, " blocks", a.snarkMs ? ` · SNARK ${fmtSecs(a.snarkMs)}` : "")), /*#__PURE__*/React.createElement("div", {
    className: "q-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qtag agg"
  }, "agg"), /*#__PURE__*/React.createElement("span", {
    className: "q-eta"
  }, fmtDur(a.elapsedMs))))), more > 0 && /*#__PURE__*/React.createElement("div", {
    className: "qmore",
    onClick: () => setShown(shown + 8)
  }, "Load ", Math.min(8, more), " more \xB7 ", more, " hidden"), shown > 5 && /*#__PURE__*/React.createElement("div", {
    className: "qmore",
    onClick: () => setShown(5)
  }, "Collapse"));
}

// ======================= BLOCKS PAGE =======================
const BLOCKS_COLS = "1.4fr 0.5fr 1fr 0.8fr 0.7fr 0.8fr 0.7fr";
function BlocksPage({
  snap,
  now
}) {
  const [filter, setFilter] = useState("all");
  const all = snap.history;
  const list = all.filter(j => filter === "all" ? true : j.status === filter);
  const s = snap.stats;
  return /*#__PURE__*/React.createElement("div", {
    className: "view"
  }, /*#__PURE__*/React.createElement(MainBar, {
    title: "Blocks",
    sub: "every proven & failed OP range",
    snap: snap,
    now: now
  }), /*#__PURE__*/React.createElement("div", {
    className: "rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Total ranges"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, all.length)), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Blocks proven"), /*#__PURE__*/React.createElement("span", {
    className: "m-v green"
  }, snap.metrics ? fmtNum(snap.metrics.blocksProven) : all.length)), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Median / range"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, fmtDur(s.avgProveMs))), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "p95"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, fmtDur(s.p95Ms))), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Throughput"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, snap.metrics && snap.metrics.blocksPerHour ? snap.metrics.blocksPerHour.toFixed(1) : "—", /*#__PURE__*/React.createElement("span", {
    className: "u"
  }, "blk/hr"))), /*#__PURE__*/React.createElement("div", {
    className: "m grow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "m-l"
  }, "Proven frontier"), /*#__PURE__*/React.createElement("span", {
    className: "m-v"
  }, snap.l2ProvenFrontier ? fmtBlock(snap.l2ProvenFrontier) : "—"))), /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, ["all", "proven", "failed"].map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    className: "chip" + (filter === f ? " on" : ""),
    onClick: () => setFilter(f)
  }, f === "all" ? "All" : f === "proven" ? "Proven" : "Failed", /*#__PURE__*/React.createElement("span", {
    className: "chip-n"
  }, f === "all" ? all.length : all.filter(j => j.status === f).length)))), /*#__PURE__*/React.createElement("div", {
    className: "panel-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tbl-h",
    style: {
      gridTemplateColumns: BLOCKS_COLS
    }
  }, /*#__PURE__*/React.createElement("span", null, "Range"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Blocks"), /*#__PURE__*/React.createElement("span", null, "Prover"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Proof time"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Size"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Status"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "When")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-scroll"
  }, list.map(job => /*#__PURE__*/React.createElement("div", {
    key: job.id,
    className: "row",
    style: {
      gridTemplateColumns: BLOCKS_COLS
    },
    onClick: () => nav(`#/block/${job.id}`)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "c-range"
  }, fmtBlock(job.rangeStart), /*#__PURE__*/React.createElement("span", {
    className: "arw"
  }, "\u2192"), fmtBlock(job.rangeEnd)), /*#__PURE__*/React.createElement("div", {
    className: "c-id"
  }, job.id)), /*#__PURE__*/React.createElement("div", {
    className: "c-blk"
  }, job.blocks), /*#__PURE__*/React.createElement("div", {
    className: "c-cluster"
  }, job.host), /*#__PURE__*/React.createElement("div", {
    className: "c-time"
  }, fmtClock(job.elapsedMs)), /*#__PURE__*/React.createElement("div", {
    className: "c-size"
  }, job.proofBytes > 0 ? fmtBytes(job.proofBytes) : "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement(StatusTag, {
    status: job.status
  })), /*#__PURE__*/React.createElement("div", {
    className: "c-when"
  }, timeAgo(job.finishedAt)))), list.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No ", filter, " ranges"))));
}

// ======================= BLOCK DETAIL =======================
// explains what the proof actually proves — range semantics vs aggregation semantics
function ProofExplainer({
  job
}) {
  const isAgg = job.kind === "agg";
  const s = job.rangeStart,
    e = job.rangeEnd,
    n = job.blocks;
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-b explainer",
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "What this proves"), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, isAgg ? "PLONK aggregation" : "OP validity proof · derivation + execution")), isAgg ? /*#__PURE__*/React.createElement("div", {
    className: "xp"
  }, /*#__PURE__*/React.createElement("p", null, "Proves a batch of range proofs composes into one PLONK proof: every range proof verifies, consecutive roots chain (", /*#__PURE__*/React.createElement("code", null, "range[i].l2PostRoot == range[i+1].l2PreRoot"), "), the rollup config is consistent, the range VK is correct, and each ", /*#__PURE__*/React.createElement("code", null, "l1Head"), " is included in the supplied L1 header chain up to the checkpoint."), /*#__PURE__*/React.createElement("div", {
    className: "xfields"
  }, /*#__PURE__*/React.createElement("span", null, "aggregates"), /*#__PURE__*/React.createElement("b", null, n, " blocks \xB7 ", fmtBlock(s), " \u2192 ", fmtBlock(e)))) : /*#__PURE__*/React.createElement("div", {
    className: "xp"
  }, /*#__PURE__*/React.createElement("p", null, "OP validity proof for the contiguous interval ", /*#__PURE__*/React.createElement("code", null, "(", fmtBlock(s), ", ", fmtBlock(e), "]"), " \u2014 proves blocks ", /*#__PURE__*/React.createElement("b", null, fmtBlock(s + 1), "\u2013", fmtBlock(e)), " (", n, " block", n > 1 ? "s" : "", "). Block ", /*#__PURE__*/React.createElement("b", null, fmtBlock(s)), " is the pre-state anchor (", /*#__PURE__*/React.createElement("code", null, "l2PreRoot"), "), not itself proved."), /*#__PURE__*/React.createElement("p", null, "Inside ZisK, Kona runs the OP derivation pipeline (L1 data \xB7 batches \xB7 blobs \xB7 preimages) \u2192 canonical L2 payloads, then executes them under OP-EVM rules with ZisK precompile routing. The output root computed at block ", fmtBlock(e), " must equal the claimed ", /*#__PURE__*/React.createElement("code", null, "l2PostRoot"), "."), /*#__PURE__*/React.createElement("div", {
    className: "xfields"
  }, /*#__PURE__*/React.createElement("span", null, "publicly commits"), /*#__PURE__*/React.createElement("b", null, "l1Head \xB7 l2PreRoot \xB7 l2PostRoot \xB7 l2BlockNumber \xB7 rollupConfigHash"))));
}
function BlockDetail({
  job,
  snap,
  now
}) {
  if (!job) {
    return /*#__PURE__*/React.createElement("div", {
      className: "view"
    }, /*#__PURE__*/React.createElement(MainBar, {
      title: "Block not found",
      snap: snap,
      now: now,
      back: "#/blocks"
    }), /*#__PURE__*/React.createElement("div", {
      className: "panel-b"
    }, /*#__PURE__*/React.createElement("div", {
      className: "empty"
    }, "This range is no longer in the live window.")));
  }
  const isAgg = job.kind === "agg";
  const done = job.status === "proven" || job.status === "failed";
  const proving = job.status === "proving";
  const witnessMs = job.stages.find(s => s.key === "witness")?.durationMs || 0;
  const snarkMs = job.stages.find(s => s.key === "snark")?.durationMs || job.snarkMs || 0;
  const totalMs = jobTotalMs(job);
  const proveMs = Math.max(0, totalMs - witnessMs); // all cargo-zisk phases combined
  // all phases done but proof not yet written -> final save/verify
  const finalizing = proving && job.stageIndex >= job.stages.length;
  // unavailable-until-proven fields read "pending" while proving, not a bare dash
  const pend = (v, fmt) => v > 0 ? fmt(v) : proving ? /*#__PURE__*/React.createElement("span", {
    className: "mv-pending"
  }, "pending") : "—";
  return /*#__PURE__*/React.createElement("div", {
    className: "view"
  }, /*#__PURE__*/React.createElement(MainBar, {
    title: `${fmtBlock(job.rangeStart)} → ${fmtBlock(job.rangeEnd)}`,
    sub: isAgg ? `PLONK agg · ${job.ranges} ranges · ${snap.chain}` : `proves ${fmtBlock(job.rangeStart + 1)}–${fmtBlock(job.rangeEnd)} · ${snap.chain}`,
    snap: snap,
    now: now,
    back: isAgg ? "#/" : "#/blocks"
  }), /*#__PURE__*/React.createElement("div", {
    className: "det-head"
  }, /*#__PURE__*/React.createElement(StatusTag, {
    status: isAgg ? "agg" : job.status
  }), /*#__PURE__*/React.createElement("span", {
    className: "det-meta"
  }, /*#__PURE__*/React.createElement("b", null, job.blocks), " blocks"), isAgg && /*#__PURE__*/React.createElement("span", {
    className: "det-meta"
  }, /*#__PURE__*/React.createElement("b", null, job.ranges), " ranges"), /*#__PURE__*/React.createElement("span", {
    className: "det-meta"
  }, "prover ", /*#__PURE__*/React.createElement("b", null, job.host)), /*#__PURE__*/React.createElement("span", {
    className: "det-meta"
  }, done ? `finished ${timeAgo(job.finishedAt)}` : finalizing ? "finalizing — writing proof" : proving ? "in progress" : "queued")), isAgg ? /*#__PURE__*/React.createElement("div", {
    className: "mgrid det-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Total agg time"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, fmtDur(job.elapsedMs))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "SNARK wrap"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, snarkMs > 0 ? fmtSecs(snarkMs) : "—")), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Ranges"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, job.ranges)), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Blocks"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, job.blocks)), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Type"), /*#__PURE__*/React.createElement("div", {
    className: "mv",
    style: {
      fontSize: 13
    }
  }, "PLONK aggregation"))) : /*#__PURE__*/React.createElement("div", {
    className: "mgrid det-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Total proof time"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, fmtDur(job.elapsedMs))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Witness gen"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, fmtDur(witnessMs))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Range prove"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, fmtDur(proveMs))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Proof size"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, pend(job.proofBytes, fmtBytes))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Gas proven"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, pend(job.gas, fmtCompact))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Proof instances"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, pend(job.instances, fmtNum))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Transactions"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, pend(job.txs, fmtNum))), /*#__PURE__*/React.createElement("div", {
    className: "mcell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, "Blocks"), /*#__PURE__*/React.createElement("div", {
    className: "mv"
  }, job.blocks))), /*#__PURE__*/React.createElement("div", {
    className: "panel-b",
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-t"
  }, "Pipeline timeline"), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sec-c"
  }, job.stageIndex, " / ", job.stages.length, " stages")), /*#__PURE__*/React.createElement(Timeline, {
    job: job
  })), /*#__PURE__*/React.createElement("div", {
    className: "panel-b",
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mst"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mst-h"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null, "Stage"), /*#__PURE__*/React.createElement("span", null, "Detail"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Duration"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "State")), job.stages.map(st => {
    const cls = st.status === "done" ? "done" : st.status === "active" ? "active" : "pending";
    const denom = st.durationMs || st.expectedMs || 0; // expected width when not yet timed
    const pct = cls === "done" ? 100 : denom ? Math.min(98, st.elapsedMs / denom * 100) : 0;
    const ss = stageStatus(job, st);
    const stateTxt = cls === "done" ? "Done" : cls === "active" ? "● live" : "Pending";
    return /*#__PURE__*/React.createElement("div", {
      key: st.key,
      className: "mstr " + cls
    }, /*#__PURE__*/React.createElement("span", {
      className: "si"
    }), /*#__PURE__*/React.createElement("span", {
      className: "sn"
    }, FULL[st.key]), cls === "pending" ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--t3)",
        fontFamily: "var(--mono)"
      }
    }, ss.sub) : /*#__PURE__*/React.createElement("div", {
      className: "sbar"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: pct + "%"
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "sd"
    }, cls === "done" ? fmtSecs(st.durationMs) : cls === "active" ? st.elapsedMs > 0 ? fmtSecs(st.elapsedMs) + (st.expectedMs ? ` / ~${fmtSecs(st.expectedMs)}` : "") : "…" : `~${fmtSecs(st.expectedMs)}`), /*#__PURE__*/React.createElement("span", {
      className: "ss"
    }, stateTxt));
  }))), /*#__PURE__*/React.createElement(ProofExplainer, {
    job: job
  }), /*#__PURE__*/React.createElement("div", {
    className: "txrow",
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "txl"
  }, "Settlement"), /*#__PURE__*/React.createElement("span", {
    className: "txh"
  }, job.txHash ? shortHash(job.txHash) : job.status === "failed" ? "— failed before settlement" : "— pending"), job.txHash && /*#__PURE__*/React.createElement("span", {
    className: "txb"
  }, "View on explorer \u2197")));
}

// ======================= APP =======================
function App() {
  const [snap, setSnap] = useState(() => window.proverFeed.snapshot());
  const [now, setNow] = useState(Date.now());
  const [route, setRoute] = useState(parseHash());

  // live blocks-proven counter in the browser tab title
  useEffect(() => {
    const n = snap.metrics ? snap.metrics.blocksProven : 0;
    document.title = n ? `${fmtNum(n)} blocks · OP-ZisK Prover` : "OP-ZisK Prover — Live";
  }, [snap.metrics && snap.metrics.blocksProven]);
  useEffect(() => {
    const unsub = window.proverFeed.subscribe(setSnap);
    // Live feed if window.OPZISK_FEED_URL is set (see index.html); else the mock.
    const FEED_URL = window.OPZISK_FEED_URL || "";
    let stop = false,
      timer = null;
    if (FEED_URL) {
      const poll = async () => {
        try {
          const data = await (await fetch(FEED_URL, {
            cache: "no-store"
          })).json();
          window.proverFeed.setConnected(data.connected !== false);
          window.proverFeed.ingest(data);
        } catch (e) {
          window.proverFeed.setConnected(false);
        }
        if (!stop) timer = setTimeout(poll, 1000);
      };
      poll();
    } else {
      window.proverFeed.startSimulation();
    }
    const clk = setInterval(() => setNow(Date.now()), 1000);
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => {
      stop = true;
      if (timer) clearTimeout(timer);
      unsub();
      clearInterval(clk);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  const findJob = id => {
    if (snap.active && snap.active.id === id) return snap.active;
    return snap.queue.find(j => j.id === id) || snap.history.find(j => j.id === id) || (snap.aggregations || []).find(j => j.id === id) || null;
  };
  let content;
  if (route.name === "blocks") content = /*#__PURE__*/React.createElement(BlocksPage, {
    snap: snap,
    now: now
  });else if (route.name === "block") content = /*#__PURE__*/React.createElement(BlockDetail, {
    job: findJob(route.id),
    snap: snap,
    now: now
  });else content = /*#__PURE__*/React.createElement(Dashboard, {
    snap: snap,
    now: now
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "shell"
  }, /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, content));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));