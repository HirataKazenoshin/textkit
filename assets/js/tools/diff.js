/**
 * TxConv – diff.js
 * Line-by-line diff using Myers LCS algorithm.
 * Pure functions, no DOM dependencies.
 */

'use strict';

/* -------------------------------------------------------
   LCS (Longest Common Subsequence) core
------------------------------------------------------- */

/**
 * Build LCS length table.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number[][]}
 */
function buildLCSTable(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

/**
 * Backtrack LCS table to produce diff hunks.
 * @param {number[][]} dp
 * @param {string[]} a  – original lines
 * @param {string[]} b  – modified lines
 * @param {number} i
 * @param {number} j
 * @returns {Array<{type:'equal'|'delete'|'insert', line:string, lineA:number|null, lineB:number|null}>}
 */
function backtrack(dp, a, b, i, j) {
  if (i === 0 && j === 0) return [];
  if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
    return [...backtrack(dp, a, b, i - 1, j - 1),
      { type: 'equal', line: a[i - 1], lineA: i, lineB: j }];
  }
  if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
    return [...backtrack(dp, a, b, i, j - 1),
      { type: 'insert', line: b[j - 1], lineA: null, lineB: j }];
  }
  return [...backtrack(dp, a, b, i - 1, j),
    { type: 'delete', line: a[i - 1], lineA: i, lineB: null }];
}

/* -------------------------------------------------------
   Public API
------------------------------------------------------- */

/**
 * Compute line-by-line diff between two texts.
 * @param {string} textA  – original
 * @param {string} textB  – modified
 * @returns {Array<{type:'equal'|'delete'|'insert', line:string, lineA:number|null, lineB:number|null}>}
 */
function computeDiff(textA, textB) {
  const a = textA.split('\n');
  const b = textB.split('\n');

  // For large inputs, fall back to simple O(n) heuristic to avoid stack overflow
  if (a.length * b.length > 200_000) {
    return simpleDiff(a, b);
  }

  const dp = buildLCSTable(a, b);
  return backtrack(dp, a, b, a.length, b.length);
}

/**
 * Simple O(n) diff fallback for large texts (line-by-line sequential).
 * @param {string[]} a
 * @param {string[]} b
 * @returns {Array<{type:string, line:string, lineA:number|null, lineB:number|null}>}
 */
function simpleDiff(a, b) {
  const result = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < a.length && i < b.length) {
      if (a[i] === b[i]) {
        result.push({ type: 'equal',  line: a[i], lineA: i + 1, lineB: i + 1 });
      } else {
        result.push({ type: 'delete', line: a[i], lineA: i + 1, lineB: null });
        result.push({ type: 'insert', line: b[i], lineA: null,  lineB: i + 1 });
      }
    } else if (i < a.length) {
      result.push({ type: 'delete', line: a[i], lineA: i + 1, lineB: null });
    } else {
      result.push({ type: 'insert', line: b[i], lineA: null,  lineB: i + 1 });
    }
  }
  return result;
}

/**
 * Count added and deleted lines in a diff result.
 * @param {Array} hunks
 * @returns {{ added: number, deleted: number }}
 */
function countChanges(hunks) {
  let added = 0, deleted = 0;
  for (const h of hunks) {
    if (h.type === 'insert') added++;
    else if (h.type === 'delete') deleted++;
  }
  return { added, deleted };
}

/**
 * Build a standalone HTML document for the diff result.
 * @param {Array} hunks
 * @param {{ added:number, deleted:number }} counts
 * @returns {string}  – full HTML string
 */
function buildDiffHtml(hunks, counts) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const escHtml = s => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/ /g, '&nbsp;')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

  const rows = hunks.map(h => {
    const lineA = h.lineA != null ? h.lineA : '';
    const lineB = h.lineB != null ? h.lineB : '';
    const prefix = h.type === 'insert' ? '+' : h.type === 'delete' ? '−' : ' ';
    const cls = h.type === 'insert' ? 'ins' : h.type === 'delete' ? 'del' : 'eq';
    return `<tr class="${cls}"><td class="ln">${lineA}</td><td class="ln">${lineB}</td><td class="pfx">${prefix}</td><td class="code">${escHtml(h.line)}</td></tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>差分レポート – TxConv</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;background:#f8f9fa;color:#1a1a1a}
  header{background:#fff;border-bottom:2px solid #6366f1;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
  header h1{font-size:16px;font-weight:700;color:#6366f1}
  .meta{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#666}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:99px;font-weight:600;font-size:11px}
  .badge-add{background:#dcfce7;color:#15803d}
  .badge-del{background:#fee2e2;color:#b91c1c}
  .badge-date{background:#f1f5f9;color:#475569}
  .wrap{padding:16px 24px}
  table{width:100%;border-collapse:collapse;font-family:'Consolas','Courier New',monospace;font-size:12px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  td{padding:2px 6px;white-space:pre;vertical-align:top}
  .ln{width:40px;min-width:40px;text-align:right;color:#94a3b8;user-select:none;background:#f8fafc;border-right:1px solid #e2e8f0}
  .pfx{width:20px;text-align:center;user-select:none;font-weight:700}
  .code{width:100%}
  tr.ins{background:#f0fdf4}
  tr.ins .pfx{color:#16a34a}
  tr.del{background:#fef2f2}
  tr.del .pfx{color:#dc2626}
  tr.eq{background:#fff}
  tr:hover td{filter:brightness(.97)}
</style>
</head>
<body>
<header>
  <h1>差分レポート</h1>
  <div class="meta">
    <span class="badge badge-date">🕒 ${dateStr}</span>
    <span class="badge badge-add">＋ 追加 ${counts.added} 行</span>
    <span class="badge badge-del">－ 削除 ${counts.deleted} 行</span>
  </div>
</header>
<div class="wrap">
<table>
<colgroup><col style="width:44px"><col style="width:44px"><col style="width:24px"><col></colgroup>
<thead><tr style="background:#f1f5f9;font-family:sans-serif;font-size:11px;color:#64748b">
  <td class="ln" style="text-align:center">変更前</td>
  <td class="ln" style="text-align:center">変更後</td>
  <td class="pfx"></td>
  <td class="code" style="padding-left:8px">内容</td>
</tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>
</body>
</html>`;
}

/* -------------------------------------------------------
   Export
------------------------------------------------------- */
window.TxConvDiff = {
  computeDiff,
  countChanges,
  buildDiffHtml,
};
