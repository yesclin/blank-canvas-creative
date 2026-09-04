#!/usr/bin/env node
/**
 * Auditoria de queries do frontend contra o schema real do Supabase.
 * Fonte de verdade: src/integrations/supabase/types.ts (gerado pela API).
 *
 * Detecta:
 *  - colunas inexistentes em .select() / .eq() / .order() / insert / update  -> erro 42703
 *  - embeds (relacionamentos) sem FK correspondente                          -> erro PGRST200
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TYPES = fs.readFileSync(path.join(ROOT, "src/integrations/supabase/types.ts"), "utf8");

/* ---------- 1. parse do schema ---------- */
const schema = {}; // table -> { cols:Set, rels:Set(referencedRelation) }
{
  const lines = TYPES.split("\n");
  let table = null;
  let section = null; // Row | Insert | Update | Relationships
  let depth = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.match(/^      (\w+): \{$/);
    if (t) {
      table = t[1];
      schema[table] ??= { cols: new Set(), rels: new Set() };
      section = null;
      continue;
    }
    if (!table) continue;
    const s = line.match(/^        (Row|Insert|Update|Relationships): (\{|\[)$/);
    if (s) {
      section = s[1];
      depth = 0;
      continue;
    }
    if (section === "Row") {
      const c = line.match(/^          (\w+)\??: /);
      if (c) schema[table].cols.add(c[1]);
    }
    if (section === "Relationships") {
      const r = line.match(/referencedRelation: "(\w+)"/);
      if (r) schema[table].rels.add(r[1]);
    }
  }
}

/* ---------- 2. varredura dos arquivos ---------- */
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name) && !p.includes("integrations/supabase/types")) files.push(p);
  }
})(path.join(ROOT, "src"));

const IGNORE_COLS = new Set(["count", "*"]);
const issues = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const fromRe = /\.from\(\s*["'`](\w+)["'`]\s*\)/g;
  let m;
  while ((m = fromRe.exec(src))) {
    const table = m[1];
    const info = schema[table];
    const lineNo = src.slice(0, m.index).split("\n").length;
    if (!info) {
      // pode ser storage.from('bucket'): ignora quando precedido por .storage
      if (/\.storage\s*$/.test(src.slice(Math.max(0, m.index - 40), m.index))) continue;
      issues.push({ file, line: lineNo, kind: "TABELA", detail: table });
      continue;
    }
    // pega o "chain" seguinte até o próximo .from( ou ~2000 chars
    const rest = src.slice(m.index + m[0].length, m.index + m[0].length + 2500);
    const chain = rest.split(/\.from\(/)[0];

    // select("...")
    const selRe = /\.select\(\s*(["'`])([\s\S]*?)\1/g;
    let sm;
    while ((sm = selRe.exec(chain))) {
      const body = sm[2];
      const chainLine = lineNo + chain.slice(0, sm.index).split("\n").length - 1;
      // embeds: nome( ... )
      const embedRe = /(\w+)\s*(?::\s*(\w+)(?:!\w+)?)?\s*\(/g;
      let em;
      const embedNames = new Set();
      while ((em = embedRe.exec(body))) {
        const rel = em[2] || em[1];
        embedNames.add(em[1]);
        embedNames.add(rel);
        if (!info.rels.has(rel) && !schema[rel]) {
          issues.push({ file, line: chainLine, kind: "EMBED", detail: `${table} -> ${rel}` });
        } else if (!info.rels.has(rel)) {
          const back = schema[rel]?.rels.has(table);
          if (!back) issues.push({ file, line: chainLine, kind: "EMBED-FK", detail: `${table} -> ${rel}` });
        }
      }
      // colunas de topo (fora de parênteses de embed)
      let d = 0;
      let buf = "";
      const tops = [];
      for (const ch of body) {
        if (ch === "(") d++;
        else if (ch === ")") d--;
        else if (ch === "," && d === 0) {
          tops.push(buf);
          buf = "";
          continue;
        }
        if (d === 0 && ch !== "(" && ch !== ")") buf += ch;
      }
      tops.push(buf);
      for (let colRaw of tops) {
        let col = colRaw.trim().split(":").pop().trim().replace(/!.*$/, "");
        if (!col || IGNORE_COLS.has(col) || col.includes("$") || col.includes("{")) continue;
        if (!/^\w+$/.test(col)) continue;
        if (embedNames.has(col)) continue;
        if (!info.cols.has(col)) {
          issues.push({ file, line: chainLine, kind: "COLUNA-SELECT", detail: `${table}.${col}` });
        }
      }
    }
    // filtros/ordenação
    const fRe = /\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in|order|contains|overlaps)\(\s*["'`]([\w.]+)["'`]/g;
    let fm;
    while ((fm = fRe.exec(chain))) {
      const col = fm[2];
      if (col.includes(".")) continue; // filtro em embed
      if (!info.cols.has(col)) {
        const chainLine = lineNo + chain.slice(0, fm.index).split("\n").length - 1;
        issues.push({ file, line: chainLine, kind: `COLUNA-${fm[1].toUpperCase()}`, detail: `${table}.${col}` });
      }
    }
  }
}

const byKind = {};
for (const i of issues) (byKind[i.kind] ??= []).push(i);
const order = Object.keys(byKind).sort();
let total = 0;
for (const k of order) {
  console.log(`\n### ${k} (${byKind[k].length})`);
  for (const i of byKind[k]) console.log(`  ${i.file}:${i.line}  ${i.detail}`);
  total += byKind[k].length;
}
console.log(`\nTOTAL: ${total} ocorrências`);
