// Pre-compile the JSX sources to plain JS so the browser never runs Babel.
// Each file is wrapped in an IIFE so its top-level declarations stay scoped —
// plain <script>s share one global scope, so unwrapped consts/functions collide
// (e.g. `Sparkline` declared in both charts and app). The IIFE mimics module scope;
// cross-file sharing goes through window.* (window.PU, window.Sparkline, …).
import { transformFileSync } from "@babel/core";
import { writeFileSync } from "fs";

const files = ["prover-charts.jsx", "prover-app.jsx"];
for (const f of files) {
  const out = f.replace(/\.jsx$/, ".js");
  const { code } = transformFileSync(f, { presets: ["@babel/preset-react"], comments: true });
  const wrapped =
    "// AUTO-GENERATED from " + f + " — edit the .jsx, run `npm run build`.\n" +
    "(function () {\n\"use strict\";\n" + code + "\n})();\n";
  writeFileSync(out, wrapped);
  console.log("built", out, "(" + wrapped.length + " bytes, IIFE-wrapped)");
}
