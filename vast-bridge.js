#!/usr/bin/env node
/**
 * vast-bridge — honest OP-ZisK proving monitor.
 *
 * Polls the proof loop's real artifacts once per second and writes feed.json,
 * the single snapshot the dashboard renders. Every value is derived from a real
 * source; anything unknown is emitted as 0 / null and shown as "—". Nothing is
 * fabricated.
 *
 * Sources
 *   - chain heads / chain id ........ JSON-RPC (L1_RPC, L2_RPC from .env)
 *   - host + GPU utilisation ........ nvidia-smi
 *   - gas / txs per range ........... summed from eth_getBlockByNumber
 *   - per-phase durations ........... logs/proof-loop-mainnet/{witness,range,agg}-*.log
 *   - proven history ................ durable append-only ledger (ledger.jsonl)
 *   - live active job ............... the running GPU `multi --prove` process + its log
 *   - witness-cache backlog ......... data/10/witness-cache/*.bin
 *
 * Pipelines
 *   range : Witness → Setup → Execute → Contributions → Inner proofs
 *   agg   : Setup → Execute → Contributions → Inner → SNARK wrap   (PLONK, every N ranges)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
const ROOT = "/root/op-zisk";
const LOGS = path.join(ROOT, "logs/proof-loop-mainnet"); // loop tees every run here
const WCACHE = path.join(ROOT, "data/10/witness-cache"); // prefetched witness stdins
const PROOF_DIRS = ["data/10/proofs/range", "data/10/proofs/range-0.19-backup"]
  .map((d) => path.join(ROOT, d));

const OUT = path.join(__dirname, "feed.json"); // snapshot the dashboard reads
const LEDGER = path.join(__dirname, "ledger.jsonl"); // durable proven-range store
const PHASEDIR = path.join(__dirname, "phases"); // live per-phase timing sidecars
const POLL_MS = 1000;

const CHAINS = { "0xa": "OP Mainnet", "0xaa37dc": "OP Sepolia", "0x1": "Ethereum" };

try { fs.mkdirSync(PHASEDIR); } catch {}

// ----------------------------------------------------------------------------
// Small utilities
// ----------------------------------------------------------------------------
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

/** Run a shell command, returning stdout (empty string on failure). */
function sh(cmd) {
  try { return cp.execSync(cmd, { maxBuffer: 8 << 20 }).toString(); }
  catch { return ""; }
}

/** Read a key from the loop's .env file. */
function env(key) {
  try {
    const line = fs.readFileSync(path.join(ROOT, ".env.vast-mainnet"), "utf8")
      .split("\n").find((l) => l.startsWith(key + "="));
    return line ? line.slice(key.length + 1).trim() : null;
  } catch { return null; }
}

const L1_RPC = env("L1_RPC");
const L2_RPC = env("L2_RPC");

/** Minimal JSON-RPC call; returns `result` or null on any failure. */
async function rpc(url, method, params) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params: params || [], id: 1 }),
      signal: AbortSignal.timeout(6000),
    });
    return (await res.json()).result;
  } catch { return null; }
}

/** Sum gasUsed + tx count over the blocks a range proves: (s, e]. */
async function rangeGasTxs(s, e) {
  let gas = 0, txs = 0, ok = false;
  for (let b = s; b < e; b++) {
    const blk = await rpc(L2_RPC, "eth_getBlockByNumber", ["0x" + b.toString(16), false]);
    if (blk && blk.gasUsed) {
      gas += parseInt(blk.gasUsed, 16) || 0;
      txs += blk.transactions ? blk.transactions.length : 0;
      ok = true;
    }
  }
  return ok ? { gas, txs } : null;
}

// Host label, resolved once at startup from nvidia-smi (e.g. "2x RTX 5090").
let HOST = "unknown";
{
  const gpus = sh("nvidia-smi --query-gpu=name --format=csv,noheader")
    .trim().split("\n").filter(Boolean);
  if (gpus.length) HOST = `${gpus.length}x ${gpus[0].replace(/NVIDIA GeForce /, "")}`;
}

// ----------------------------------------------------------------------------
// Log parsing — range-proof phases
// ----------------------------------------------------------------------------
// [key, label, reached-regex, done-regex (captures ms)]. Markers verified against
// real logs/proof-loop-mainnet/{witness,range}-*.log.
const PIPE = [
  ["witness", "Witness gen", /Starting witness preimage server|Generated witness|INITIALIZING_PROOFMAN/, /Generated witness.*?elapsed_ms[=\s]+(\d+)/],
  ["setup", "Prover setup", />>> INITIALIZING_PROOFMAN/, /<<< INITIALIZING_PROOFMAN \((\d+)ms\)/],
  ["execute", "Execute", />>> (EXECUTE|STARTING_ASM_MICROSERVICES|COMPUTE_MINIMAL_TRACE)/, /<<< EXECUTE \((\d+)ms\)/],
  ["contrib", "Contributions", />>> CALCULATING_CONTRIBUTIONS/, /<<< CALCULATING_CONTRIBUTIONS \((\d+)ms\)/],
  ["inner", "Inner proofs", />>> GENERATING_(INNER_)?PROOFS/, /<<< GENERATING_INNER_PROOFS \((\d+)ms\)|Range proof saved to/],
];
const RANGE_DONE_RE = /Range proof saved to|RANGE_STATUS=0/;

/** Concatenated witness + range logs for one range (durable, complete). */
function rangeLog(s, e) {
  let txt = "";
  for (const name of [`witness-${s}-${e}.log`, `range-${s}-${e}.log`]) {
    try { txt += fs.readFileSync(path.join(LOGS, name), "utf8"); } catch {}
  }
  return txt;
}

/** Parse the real phases (status + duration) from run output. */
function parsePhases(txt, forceAllDone) {
  txt = stripAnsi(txt);
  const allDone = forceAllDone || RANGE_DONE_RE.test(txt);
  let reached = -1;
  PIPE.forEach((p, i) => { if (p[2].test(txt)) reached = Math.max(reached, i); });
  return PIPE.map((p, i) => {
    const [key, name, , doneRe] = p;
    const dm = txt.match(doneRe);
    let status;
    if (allDone) status = "done";
    else if (i < reached) status = "done";
    else if (i === reached) status = dm ? "done" : "active";
    else status = "pending";
    const dur = dm && dm[1] ? +dm[1] : 0;
    return { key, name, status, durationMs: dur, elapsedMs: dur };
  });
}

const stageIndexOf = (stages) => stages.filter((s) => s.status === "done").length;

/** ZisK proof-instance counts (the available execution-size metric; raw steps aren't logged). */
function parseInstances(txt) {
  txt = stripAnsi(txt);
  const total = txt.match(/Total global instances:\s*(\d+)/);
  const main = txt.match(/\bMain:\s*(\d+)/);
  return { instances: total ? +total[1] : 0, main: main ? +main[1] : 0 };
}

/** Epoch ms of the most recent ">>> PHASE" line mapping to the active stage. */
function activePhaseStart(txt, activeKey) {
  const reach = (PIPE.find((p) => p[0] === activeKey) || [])[2];
  let ts = 0;
  for (const line of txt.split("\n")) {
    if (reach && reach.test(line)) {
      const m = line.match(/^(\d{4}-\d\d-\d\dT[\d:.]+Z)/);
      if (m) ts = Date.parse(m[1]);
    }
  }
  return ts;
}

// ----------------------------------------------------------------------------
// Live phase sidecars — persist per-phase durations as we observe a running job,
// so finished ranges keep honest timing even if their log rotates away.
// ----------------------------------------------------------------------------
const scPath = (s, e) => path.join(PHASEDIR, `${s}-${e}.json`);

function readSidecar(s, e) {
  try {
    const r = JSON.parse(fs.readFileSync(scPath(s, e), "utf8"));
    return r.phases || r.stats
      ? { phases: r.phases || {}, stats: r.stats || {} }
      : { phases: r, stats: {} }; // migrate old flat format
  } catch { return null; }
}

function mergeSidecar(s, e, stages, stats) {
  const prev = readSidecar(s, e) || { phases: {}, stats: {} };
  stages.forEach((st) => {
    if (st.durationMs > 0) prev.phases[st.key] = Math.max(prev.phases[st.key] || 0, st.durationMs);
  });
  if (stats) Object.assign(prev.stats, stats);
  try { fs.writeFileSync(scPath(s, e), JSON.stringify(prev)); } catch {}
}

// ----------------------------------------------------------------------------
// Durable ledger — one frozen record per proven range, written once.
// Survives proof-file cleanup, log rotation and restarts. (Node 18: no sqlite,
// so an append-only JSONL is the fit.) Only rewritten to backfill real missing
// chain data — never to fabricate.
// ----------------------------------------------------------------------------
function loadLedger() {
  const map = new Map();
  try {
    for (const line of fs.readFileSync(LEDGER, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      map.set(r.s + "-" + r.e, r);
    }
  } catch {}
  return map;
}

function appendLedger(rec) {
  try { fs.appendFileSync(LEDGER, JSON.stringify(rec) + "\n"); } catch {}
}

function rewriteLedger(map) {
  try {
    fs.writeFileSync(LEDGER, [...map.values()].map((r) => JSON.stringify(r)).join("\n") + "\n");
  } catch {}
}

// ----------------------------------------------------------------------------
// Range proofs — finalise new proofs into the ledger, then build history.
// ----------------------------------------------------------------------------
async function proven(aggs) {
  const ledger = loadLedger();

  // Finalise any proof file not yet in the ledger (freeze it once).
  const seen = new Set();
  for (const dir of PROOF_DIRS) {
    let files = [];
    try { files = fs.readdirSync(dir); } catch { continue; }
    for (const f of files) {
      const m = f.match(/^(\d+)-(\d+)\.bin$/);
      if (!m) continue;
      const key = m[1] + "-" + m[2];
      if (seen.has(key)) continue;
      seen.add(key);
      if (ledger.has(key)) continue; // already frozen

      const st = fs.statSync(path.join(dir, f));
      const s = +m[1], e = +m[2];
      const log = rangeLog(s, e);
      const stages = parsePhases(log, true);

      // Backfill any phase missing from the log with the live sidecar capture.
      const sidecar = readSidecar(s, e);
      const scPhases = sidecar ? sidecar.phases : {};
      stages.forEach((x) => { if (!x.durationMs && scPhases[x.key]) x.durationMs = scPhases[x.key]; });

      const phases = {};
      stages.forEach((x) => { phases[x.key] = x.durationMs; });

      const gt = await rangeGasTxs(s, e); // gas/txs from chain (not in logs)
      const inst = parseInstances(log);

      const rec = {
        s, e, blocks: e - s, host: HOST, proofBytes: st.size, phases,
        totalMs: sum(stages.map((x) => x.durationMs)),
        gas: gt ? gt.gas : 0, txs: gt ? gt.txs : 0,
        instances: inst.instances, main: inst.main, steps: 0, // raw steps not logged in loop mode
        finishedAt: st.mtimeMs,
      };
      appendLedger(rec);
      ledger.set(key, rec);
    }
  }

  // Bounded repair: backfill up to 2 records that froze at gas=0 (transient RPC fail).
  let budget = 2, repaired = false;
  for (const r of ledger.values()) {
    if (budget <= 0) break;
    if ((r.gas || 0) === 0 && r.e - r.s > 0) {
      budget--;
      const gt = await rangeGasTxs(r.s, r.e);
      if (gt && gt.gas > 0) { r.gas = gt.gas; r.txs = gt.txs; repaired = true; }
    }
  }
  if (repaired) rewriteLedger(ledger);

  const recs = [...ledger.values()];
  const history = recs
    .slice()
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, 60)
    .map((r) => {
      const stages = PIPE.map((p) => ({
        key: p[0], name: p[1], status: "done",
        durationMs: (r.phases && r.phases[p[0]]) || 0,
        elapsedMs: (r.phases && r.phases[p[0]]) || 0,
      }));
      return {
        id: "B-" + r.s, rangeStart: r.s, rangeEnd: r.e, blocks: r.blocks,
        host: r.host || HOST, status: "proven", stageIndex: stages.length, stages,
        gas: r.gas || 0, txs: r.txs || 0, instances: r.instances || 0, main: r.main || 0,
        proofBytes: r.proofBytes, txHash: null,
        startedAt: r.finishedAt - (r.totalMs || 0), finishedAt: r.finishedAt,
        elapsedMs: r.totalMs || 0, etaMs: 0, note: "range-proof-only",
        _mt: r.finishedAt, _dur: r.totalMs || 0,
      };
    });

  // Full proven-key set (not the 60-capped history) so the queue never lists an
  // already-proven older range that fell out of the recent window.
  return { history, metrics: computeMetrics(recs, aggs || []), provenKeys: new Set(ledger.keys()) };
}

// ----------------------------------------------------------------------------
// Aggregations — PLONK batches of range proofs (agg-*.log).
// ----------------------------------------------------------------------------
const AGG_PIPE = [
  ["setup", "Prover setup", /<<< INITIALIZING_PROOFMAN \((\d+)ms\)/],
  ["execute", "Execute", /<<< EXECUTE \((\d+)ms\)/],
  ["contrib", "Contributions", /<<< CALCULATING_CONTRIBUTIONS \((\d+)ms\)/],
  ["inner", "Inner proofs", /<<< GENERATING_INNER_PROOFS \((\d+)ms\)/],
  ["snark", "SNARK wrap", /<<< GENERATING_WRAPPER_SNARK_PROOF \((\d+)ms\)/],
];

function aggRecords() {
  let files = [];
  try { files = fs.readdirSync(LOGS); } catch {}
  const out = [];
  for (const f of files) {
    // agg-<firstStart>-<firstEnd>-to-<lastStart>-<lastEnd>.log
    const m = f.match(/^agg-(\d+)-(\d+)-to-(\d+)-(\d+)\.log$/);
    if (!m) continue;
    let txt = "";
    try { txt = stripAnsi(fs.readFileSync(path.join(LOGS, f), "utf8")); } catch { continue; }

    const firstStart = +m[1], firstEnd = +m[2], lastEnd = +m[4];
    const rangeSize = firstEnd - firstStart || 5;
    const ranges = Math.max(1, Math.round((lastEnd - firstStart) / rangeSize));

    const stages = AGG_PIPE.map((p) => {
      const mm = txt.match(p[2]);
      const d = mm ? +mm[1] : 0;
      return { key: p[0], name: p[1], status: "done", durationMs: d, elapsedMs: d };
    });
    let totalMs = 0;
    for (const mm of txt.matchAll(/<<< [A-Z_]+ \((\d+)ms\)/g)) totalMs += +mm[1];
    const snarkM = txt.match(/<<< GENERATING_WRAPPER_SNARK_PROOF \((\d+)ms\)/);
    const done = /Aggregation proof generated|Proof artifacts saved/i.test(txt);
    const st = fs.statSync(path.join(LOGS, f));

    out.push({
      first: firstStart, last: lastEnd, blocks: lastEnd - firstStart, ranges,
      totalMs, snarkMs: snarkM ? +snarkM[1] : 0, stages, done, finishedAt: st.mtimeMs,
    });
  }
  return out.sort((a, b) => b.finishedAt - a.finishedAt);
}

/** Shape an agg record as a clickable dashboard job (kind: "agg"). */
function aggJob(a) {
  return {
    id: "AGG-" + a.first, kind: "agg",
    rangeStart: a.first, rangeEnd: a.last, blocks: a.blocks, ranges: a.ranges,
    host: HOST, status: "proven", stages: a.stages, stageIndex: a.stages.length,
    gas: 0, txs: 0, instances: 0, proofBytes: 0, snarkMs: a.snarkMs, txHash: null,
    startedAt: a.finishedAt - a.totalMs, finishedAt: a.finishedAt,
    elapsedMs: a.totalMs, etaMs: 0, note: "plonk-agg",
  };
}

// ----------------------------------------------------------------------------
// Metrics — aggregates over the full ledger. Each average is taken ONLY over
// records that actually carry the datum, so missing-data rows never drag it down.
// ----------------------------------------------------------------------------
function avgPhaseDurations(recs) {
  const out = {};
  for (const p of PIPE) {
    const key = p[0];
    const vals = recs.map((r) => (r.phases && r.phases[key]) || 0).filter((x) => x > 0);
    out[key] = Math.round(avg(vals));
  }
  return out;
}

function computeMetrics(recs, aggs) {
  aggs = aggs || [];
  const aggDone = aggs.filter((a) => a.totalMs > 0);

  const timed = recs.filter((r) => r.totalMs > 0);
  const timedBlocks = sum(timed.map((r) => r.blocks));
  const timedMs = sum(timed.map((r) => r.totalMs));
  const secPerBlock = timedBlocks ? timedMs / 1000 / timedBlocks : 0;
  const blocksPerHour = timedMs ? timedBlocks / (timedMs / 3.6e6) : 0;

  const withInst = recs.filter((r) => r.instances > 0);
  const withMain = recs.filter((r) => r.main > 0);
  const withGas = recs.filter((r) => r.gas > 0);
  const withSteps = recs.filter((r) => r.steps > 0);

  const witnessMs = recs.map((r) => (r.phases && r.phases.witness) || 0).filter((x) => x > 0);
  const proveMs = timed.map((r) => r.totalMs - ((r.phases && r.phases.witness) || 0)).filter((x) => x > 0);
  const totalMs = recs.map((r) => r.totalMs || 0).filter((x) => x > 0);
  const sizes = recs.map((r) => r.proofBytes || 0).filter((x) => x > 0);

  const gasBlocks = sum(withGas.map((r) => r.blocks));
  const stepBlocks = sum(withSteps.map((r) => r.blocks));

  return {
    blocksProven: sum(recs.map((r) => r.blocks)),
    rangesProven: recs.length,
    avgRangeBlocks: avg(recs.map((r) => r.blocks)),

    totalGas: sum(recs.map((r) => r.gas || 0)),
    avgGasPerBlock: gasBlocks ? sum(withGas.map((r) => r.gas)) / gasBlocks : 0,
    totalSteps: sum(recs.map((r) => r.steps || 0)),
    avgStepsPerBlock: stepBlocks ? sum(withSteps.map((r) => r.steps)) / stepBlocks : 0,

    avgWitnessMs: avg(witnessMs),
    avgProveMs: avg(proveMs),
    avgTotalMs: avg(totalMs),
    avgProofBytes: avg(sizes),
    measuredCount: totalMs.length,
    gasCount: withGas.length,

    avgPhases: avgPhaseDurations(recs), // per-phase historical avg (live ETA/gantt)
    secPerBlock,
    blocksPerHour,

    avgInstances: avg(withInst.map((r) => r.instances)),
    avgMain: avg(withMain.map((r) => r.main)),
    instancesAvailable: withInst.length > 0,
    stepsAvailable: false,

    aggCount: aggs.length,
    avgAggMs: avg(aggDone.map((a) => a.totalMs)),
    avgAggSnarkMs: avg(aggDone.map((a) => a.snarkMs).filter((x) => x > 0)),
    rangesPerAgg: aggs.length ? aggs[0].ranges : 2,
    aggNote: "PLONK aggregation",
  };
}

// ----------------------------------------------------------------------------
// Queue — witness-cached ranges that are prefetched but not yet proven.
// ----------------------------------------------------------------------------
function witnessQueue(provenKeys, activeKey) {
  let files = [];
  try { files = fs.readdirSync(WCACHE); } catch {}
  const q = [];
  for (const f of files) {
    const m = f.match(/^(\d+)-(\d+)-stdin\.bin$/);
    if (!m) continue;
    const s = +m[1], e = +m[2], key = s + "-" + e;
    if (provenKeys.has(key) || key === activeKey) continue;
    q.push({
      id: "B-" + s, rangeStart: s, rangeEnd: e, blocks: e - s, status: "queued", host: HOST,
      stageIndex: 0,
      stages: PIPE.map((p) => ({ key: p[0], name: p[1], status: "pending", durationMs: 0, elapsedMs: 0 })),
      gas: 0, proofBytes: 0, note: "witness cached",
    });
  }
  return q.sort((a, b) => a.rangeStart - b.rangeStart);
}

// ----------------------------------------------------------------------------
// Active job — the live GPU `--prove` run (NOT a `--witness-only` prefetch).
// ----------------------------------------------------------------------------
function provingStatus() {
  const ps = sh("ps -eo args");
  if (/release\/multi --start/.test(ps)) return "proving";
  if (/cargo build.*--bin (multi|agg|proposer)/.test(ps)) return "building";
  if (/release\/proposer/.test(ps)) return "proposer-running";
  return "idle";
}

/** Capture the tmux pane running the job (fallback when the log hasn't flushed). */
function smokePane() {
  for (const s of sh("tmux ls -F '#{session_name}'").split("\n").filter(Boolean)) {
    if (s === "dash" || s === "dashsrv") continue;
    const pane = sh(`tmux capture-pane -t ${s} -p -S -3000`);
    if (/multi --start \d+ --end \d+|>>> (EXECUTE|CALCULATING_CONTRIBUTIONS|GENERATING)/.test(pane)) return pane;
  }
  return "";
}

function activeJob(avgPh) {
  // Pick the GPU `--prove` job, not one of the concurrent `--witness-only` prefetches.
  const lines = sh("ps -eo args").split("\n")
    .filter((l) => /release\/multi --start \d+ --end \d+/.test(l));
  const line = lines.find((l) => /--prove/.test(l) && !/--witness-only/.test(l))
    || lines.find((l) => !/--witness-only/.test(l));
  if (!line) return null;
  const m = line.match(/--start (\d+) --end (\d+)/);
  if (!m) return null;

  const s = +m[1], e = +m[2];
  const txt = stripAnsi(rangeLog(s, e) || smokePane());
  const stages = parsePhases(txt, false);
  mergeSidecar(s, e, stages, null); // persist live durations so they reach history

  avgPh = avgPh || {};
  const ai = stages.findIndex((x) => x.status === "active");
  const activeKey = ai >= 0 ? stages[ai].key : null;
  const now = Date.now();
  const startTs = activeKey ? activePhaseStart(txt, activeKey) : 0;
  const activeElapsed = startTs ? Math.max(0, now - startTs) : 0;
  const doneMs = sum(stages.filter((x) => x.status === "done").map((x) => x.durationMs));

  // Expected (historical) widths + live elapsed per stage.
  stages.forEach((x, i) => {
    x.expectedMs = avgPh[x.key] || 0;
    x.elapsedMs = x.status === "done" ? x.durationMs : i === ai ? activeElapsed : 0;
  });

  // Elapsed = completed phases + the active phase's live elapsed. NOT wall-clock:
  // witness is prefetched ahead, so its log timestamps would be stale.
  const elapsedMs = doneMs + activeElapsed;
  const estTotal = doneMs + sum(stages.filter((x) => x.status !== "done")
    .map((x) => Math.max(x.elapsedMs || 0, x.expectedMs || 0)));
  const etaMs = Math.max(0, estTotal - elapsedMs);
  const progress = estTotal ? Math.min(99, Math.round((elapsedMs / estTotal) * 100)) : 0;

  // Stall: active phase running far past its historical average (GPU likely hung).
  const activeExp = ai >= 0 ? stages[ai].expectedMs || 0 : 0;
  const stalled = activeElapsed > Math.max(activeExp * 4, 900000); // >4x expected or >15min

  return {
    id: "B-" + s, rangeStart: s, rangeEnd: e, blocks: e - s, host: HOST, status: "proving",
    stageIndex: stageIndexOf(stages), stages,
    gas: 0, txs: 0, instances: 0, main: 0, proofBytes: 0, txHash: null,
    startedAt: null, finishedAt: null, elapsedMs, estimatedTotalMs: estTotal, etaMs, progress,
    stalled, stallPhase: stalled && ai >= 0 ? stages[ai].key : null,
  };
}

// ----------------------------------------------------------------------------
// Main cycle — assemble + write the snapshot.
// ----------------------------------------------------------------------------
async function cycle() {
  const status = provingStatus();
  const aggs = aggRecords(); // read agg logs once per cycle
  const { history, metrics, provenKeys } = await proven(aggs);
  const active = status === "proving" ? activeJob(metrics.avgPhases) : null;

  const [cid, l1, l2] = await Promise.all([
    rpc(L2_RPC, "eth_chainId"),
    rpc(L1_RPC, "eth_blockNumber"),
    rpc(L2_RPC, "eth_blockNumber"),
  ]);

  const recentDurations = history.filter((j) => j._dur > 0).map((j) => j._dur);
  const frontier = provenKeys.size
    ? Math.max(...[...provenKeys].map((k) => +k.split("-")[1]))
    : null;

  const activeKey = active ? active.rangeStart + "-" + active.rangeEnd : null;
  const queue = witnessQueue(provenKeys, activeKey);
  metrics.backlogRanges = queue.length;
  metrics.backlogBlocks = sum(queue.map((j) => j.blocks));

  const aggregations = aggs.slice(0, 40).map(aggJob);
  history.forEach((j) => { delete j._mt; delete j._dur; });

  const gpu = sh("nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits")
    .split("\n").map((x) => parseInt(x)).filter((x) => !isNaN(x));
  const gpuUtil = gpu.length ? Math.round(avg(gpu)) : null;

  // connected = monitor is alive + writing this feed; the prover's own state is
  // provingStatus. The client flips connected false only on a failed fetch.
  const l2Head = l2 ? parseInt(l2, 16) : 0;
  const snap = {
    connected: true,
    chain: CHAINS[cid] || (cid ? "chain " + cid : "unknown"),
    l1Head: l1 ? parseInt(l1, 16) : 0,
    l2Head,
    l2ProvenFrontier: frontier,
    provingStatus: status,
    active, queue, history, aggregations, metrics, recentDurations,
    failedCount: 0, gpuUtil,
    source: `${metrics.rangesProven} ranges · ${metrics.blocksProven} blocks proven · frontier ${frontier ?? "—"} · head ${l2Head || "?"}`,
  };
  fs.writeFileSync(OUT, JSON.stringify(snap));

  const where = active
    ? `${active.id}@${active.stages[active.stageIndex] ? active.stages[active.stageIndex].key : "done"}`
    : "idle";
  process.stdout.write(`\r[vast] ${status} active=${where} proven=${history.length} head=${l2Head || "?"}   `);
}

// Single-flight loop: never let a slow cycle (gas backfill / RPC) overlap the next tick.
console.log("[vast-bridge] host", HOST);
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try { await cycle(); }
  catch (e) { process.stderr.write("\n[vast-bridge] cycle error: " + e.message + "\n"); }
  finally { running = false; }
}
tick();
setInterval(tick, POLL_MS);
