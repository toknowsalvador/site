// Validates Google Ads RSA copy written by the offer-copywriter skill.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LIMITS = { headlines: [3, 15, 30], descriptions: [2, 4, 90] };
const SUPERLATIVES = /(\bbest\b|#1|\bnumber one\b|\bcheapest\b|\btop-rated\b)/i;

export function checkAdCopy(markdown) {
  const groups = [];
  let group = null;
  let section = null;
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    const g = line.match(/^## Ad group:\s*(.+)$/);
    if (g) {
      group = { name: g[1], headlines: [], descriptions: [], paths: [] };
      groups.push(group);
      section = null;
      continue;
    }
    const s = line.match(/^### (Headlines|Descriptions|Paths)$/);
    if (s) { section = s[1].toLowerCase(); continue; }
    if (group && section && line.startsWith('- ')) group[section].push(line.slice(2).trim());
  }

  const errors = [];
  if (groups.length === 0) errors.push('no "## Ad group:" sections found');
  for (const grp of groups) {
    for (const [kind, [min, max, len]] of Object.entries(LIMITS)) {
      const items = grp[kind];
      if (items.length < min || items.length > max) {
        errors.push(`[${grp.name}] needs ${min}–${max} ${kind}, has ${items.length}`);
      }
      const singular = kind.slice(0, -1);
      for (const t of items) {
        if (t.length > len) errors.push(`[${grp.name}] ${singular} over ${len} chars (${t.length}): ${t}`);
        if (SUPERLATIVES.test(t)) errors.push(`[${grp.name}] unproven superlative in ${singular}: ${t}`);
      }
    }
    if (grp.paths.length > 2) errors.push(`[${grp.name}] max 2 paths, has ${grp.paths.length}`);
    for (const p of grp.paths) {
      if (p.length > 15) errors.push(`[${grp.name}] path over 15 chars (${p.length}): ${p}`);
    }
  }
  return { errors, groups };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node tools/check-ad-copy.mjs <ads-file.md>'); process.exit(2); }
  const { errors, groups } = checkAdCopy(readFileSync(file, 'utf8'));
  for (const e of errors) console.log(e);
  if (errors.length) process.exit(1);
  console.log(`OK — ${groups.length} ad group(s)`);
}
