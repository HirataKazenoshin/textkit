/**
 * bulk-replace.js — 一括テキスト置換ロジック（pure functions・DOM操作禁止）
 */

/**
 * 1つのルールを適用して置換件数を返す
 * @param {string} text
 * @param {string} searchStr
 * @param {string} replaceStr
 * @param {{ caseSensitive?: boolean }} options
 * @returns {{ result: string, count: number }}
 */
export function applyRule(text, searchStr, replaceStr, options = {}) {
  const { caseSensitive = true } = options;

  if (!searchStr) return { result: text, count: 0 };

  const flags = caseSensitive ? 'g' : 'gi';
  const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, flags);

  let count = 0;
  const result = text.replace(re, () => { count++; return replaceStr; });

  return { result, count };
}

/**
 * 全ルールを順番に適用
 * @param {string} text
 * @param {{ search: string, replace: string, enabled: boolean }[]} rules
 * @param {{ caseSensitive?: boolean }} options
 * @returns {{ result: string, counts: { ruleIndex: number, count: number, skipped?: boolean }[] }}
 */
export function applyAllRules(text, rules, options = {}) {
  let current = text;
  const counts = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule.enabled) {
      counts.push({ ruleIndex: i, count: 0, skipped: true });
      continue;
    }
    const { result, count } = applyRule(current, rule.search, rule.replace, options);
    current = result;
    counts.push({ ruleIndex: i, count });
  }

  return { result: current, counts };
}