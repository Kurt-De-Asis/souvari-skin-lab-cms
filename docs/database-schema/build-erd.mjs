// build-erd.mjs
// Renders souvari-database-schema.dot -> .svg (Graphviz compiled to WASM)
// and -> .png (@resvg/resvg-js, prebuilt native renderer; no system browser).
//
// Usage (from docs/database-schema/):
//   npm install
//   npm run build
//
// The .dot file is the single source of truth; edit it and re-run.
// Also prints a geometry check (node boxes vs. page, node/node overlaps,
// edge label counts) so the diagram can be validated without opening it.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DOT = join(here, "souvari-database-schema.dot");
const SVG = join(here, "souvari-database-schema.svg");
const PNG = join(here, "souvari-database-schema.png");
const PNG_SCALE = 2;

async function loadGraphviz() {
  const { Graphviz } = await import("@hpcc-js/wasm/graphviz");
  return Graphviz.load();
}

// Does the segment (ax,ay)-(bx,by) enter the axis-aligned rectangle?
// Liang-Barsky clipping; a zero-length segment is treated as a point test.
function segmentHitsRect(ax, ay, bx, by, r) {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const p = [-dx, dx, -dy, dy];
  const q = [ax - r.x0, r.x1 - ax, ay - r.y0, r.y1 - ay];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false; // parallel and outside
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
    }
  }
  return t0 <= t1;
}

// Parse Graphviz "plain" output edge lines (inch coords) -> point paths (pt).
function parsePlainEdges(plain) {
  const edges = [];
  for (const line of plain.split("\n")) {
    if (!line.startsWith("edge ")) continue;
    const t = line.trim().split(/\s+/);
    const tail = t[1];
    const head = t[2];
    const n = Number(t[3]);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push([Number(t[4 + i * 2]) * 72, Number(t[5 + i * 2]) * 72]);
    edges.push({ tail, head, pts });
  }
  return edges;
}

function checkGeometry(jsonRaw, plainRaw, expectedNodes, expectedEdges) {
  const g = JSON.parse(jsonRaw);
  const [x0, y0, x1, y1] = g.bb.split(",").map(Number);
  const nodes = g.objects ?? [];
  const edges = g.edges ?? [];
  const problems = [];

  if (nodes.length !== expectedNodes) problems.push(`expected ${expectedNodes} nodes, found ${nodes.length}`);
  if (edges.length !== expectedEdges) problems.push(`expected ${expectedEdges} edges, found ${edges.length}`);

  // Node boxes in point coordinates (Graphviz JSON sizes are in inches; pos is
  // the center in points). Convert inches -> points (x72).
  const boxes = nodes.map((n) => {
    const [cx, cy] = n.pos.split(",").map(Number);
    const w = Number(n.width) * 72;
    const h = Number(n.height) * 72;
    return { name: n.name, x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
  });

  // Every node must sit inside the page bounding box.
  for (const b of boxes) {
    if (b.x0 < x0 - 1 || b.y0 < y0 - 1 || b.x1 > x1 + 1 || b.y1 > y1 + 1) {
      problems.push(`node '${b.name}' is outside the page bounds`);
    }
  }

  // No pair of node boxes may overlap.
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
      if (overlap) problems.push(`nodes '${a.name}' and '${b.name}' overlap`);
    }
  }

  // No edge may cut through a table box other than its own endpoints.
  const inset = 2; // pt; ignore edges that merely graze a box border
  for (const e of parsePlainEdges(plainRaw)) {
    for (let i = 0; i < e.pts.length - 1; i++) {
      const [ax, ay] = e.pts[i];
      const [bx, by] = e.pts[i + 1];
      for (const b of boxes) {
        if (b.name === e.tail || b.name === e.head) continue;
        const r = { x0: b.x0 + inset, y0: b.y0 + inset, x1: b.x1 - inset, y1: b.y1 - inset };
        if (segmentHitsRect(ax, ay, bx, by, r)) {
          problems.push(`edge '${e.tail} -> ${e.head}' crosses table '${b.name}'`);
        }
      }
    }
  }

  const withInfinity = edges.filter((e) => /&#8734;/.test(JSON.stringify(e)) || /∞/.test(JSON.stringify(e))).length;
  return { nodes: nodes.length, edges: edges.length, page: { x0, y0, x1, y1 }, withInfinity, problems };
}

const graphviz = await loadGraphviz();
const dot = await readFile(DOT, "utf8");

const svg = graphviz.dot(dot, "svg");
if (!svg || !svg.includes("<svg")) throw new Error("Graphviz did not return an SVG document.");
await writeFile(SVG, svg, "utf8");

const jsonRaw = graphviz.dot(dot, "json");
const plainRaw = graphviz.dot(dot, "plain");
const expectedNodes = dot.split("\n").filter((l) => /^\s{2}\w+\s*\[label=</.test(l)).length;
const expectedEdges = (dot.match(/->/g) ?? []).length;
const report = checkGeometry(jsonRaw, plainRaw, expectedNodes, expectedEdges);

const { Resvg } = await import("@resvg/resvg-js");
const resvg = new Resvg(svg, {
  fitTo: { mode: "zoom", value: PNG_SCALE },
  font: { loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" },
  background: "#ffffff",
});
const rendered = resvg.render();
await writeFile(PNG, rendered.asPng());

console.log(`[erd] wrote ${SVG}`);
console.log(`[erd] wrote ${PNG} (${rendered.width}x${rendered.height}px @${PNG_SCALE}x)`);
console.log(`[erd] page ${report.page.x1}x${report.page.y1}pt, ${report.nodes} nodes, ${report.edges} edges (${report.withInfinity} with infinity labels)`);
console.log(report.problems.length ? `[erd] PROBLEMS:\n - ${report.problems.join("\n - ")}` : "[erd] geometry check: OK (no overlaps, all nodes inside page)");
if (report.problems.length) process.exitCode = 1;
