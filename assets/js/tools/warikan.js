/**
 * warikan.js — 割り勘計算ロジック（pure functions・DOM操作禁止）
 * 端数は誰かに加算せず、余りとして返す。
 */

/**
 * 金額フォーマット
 * @param {number} value
 * @returns {string} 例: '1,234円'
 */
export function formatCurrency(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('ja-JP').format(value) + '円';
}

/**
 * かんたん割り勘計算
 * @param {number} total 合計金額（正の整数）
 * @param {number} people 人数（2〜20の整数）
 * @returns {{ valid: boolean, perPerson?: number, remainder?: number, error?: string }}
 */
export function calcSimple(total, people) {
  if (!Number.isInteger(total) || total <= 0) {
    return { valid: false, error: '合計金額は1以上の整数で入力してください。' };
  }
  if (!Number.isInteger(people) || people < 2 || people > 20) {
    return { valid: false, error: '人数は2〜20人で入力してください。' };
  }

  const perPerson = Math.floor(total / people);
  const remainder = total % people;

  return { valid: true, perPerson, remainder };
}

/**
 * カスタム割り勘計算
 * @param {number} total 合計金額（正の整数）
 * @param {{ name: string, type: 'ratio'|'fixed', value: number }[]} participants
 * @returns {{ valid: boolean, results?: { name: string, amount: number }[], remainder?: number, error?: string }}
 */
export function calcCustom(total, participants) {
  if (!Number.isInteger(total) || total <= 0) {
    return { valid: false, error: '合計金額は1以上の整数で入力してください。' };
  }
  if (!participants || participants.length < 1) {
    return { valid: false, error: '参加者を1人以上追加してください。' };
  }

  let fixedTotal = 0;
  const fixedParticipants = [];
  const ratioParticipants = [];

  for (const p of participants) {
    if (p.type === 'fixed') {
      if (!Number.isInteger(p.value) || p.value < 0) {
        return { valid: false, error: `${p.name} の固定金額は0以上の整数で入力してください。` };
      }
      fixedTotal += p.value;
      fixedParticipants.push(p);
    } else {
      if (!Number.isFinite(p.value) || p.value <= 0) {
        return { valid: false, error: `${p.name} の口数が無効です（1以上を入力）。` };
      }
      ratioParticipants.push(p);
    }
  }

  if (fixedTotal > total) {
    return { valid: false, error: '固定金額の合計が合計金額を超えています。' };
  }

  const remaining = total - fixedTotal;
  const totalRatio = ratioParticipants.reduce((s, p) => s + p.value, 0);

  const results = [];
  let ratioAllocated = 0;

  // 各割合参加者に切り捨てで分配
  for (const p of ratioParticipants) {
    const amount = Math.floor((remaining * p.value) / totalRatio);
    ratioAllocated += amount;
    results.push({ name: p.name, amount });
  }

  // 余り = 分配しきれなかった端数
  const remainder = remaining - ratioAllocated;

  // 固定金額参加者を追加
  for (const p of fixedParticipants) {
    results.push({ name: p.name, amount: p.value });
  }

  for (const r of results) {
    if (r.amount < 0) {
      return { valid: false, error: `${r.name} の支払い金額が0円未満になります。設定を見直してください。` };
    }
  }

  return { valid: true, results, remainder };
}
