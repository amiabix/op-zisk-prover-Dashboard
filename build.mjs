// Pre-compile the JSX sources to plain JS so the browser never runs Babel.
import { transformFileSync } from "@babel/core";
import { writeFileSync } from "fs";
const files = ["prover-charts.jsx", "prover-app.jsx"];
for (const f of files) {
  const out = f.replace(/\.jsx$/, ".js");
  const { code } = transformFileSync(f, { presets: ["@babel/preset-react"], comments: true });
  writeFileSync(out, "// AUTO-GENERATED from " + f + " — edit the .jsx, run `npm run build`.\n" + code);
  console.log("built", out, "(" + code.length + " bytes)");
}
