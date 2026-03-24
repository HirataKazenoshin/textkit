/**
 * unit-price.js — 単価比較ロジック（pure functions・DOM操作禁止）
 */

const UNIT_CONFIG = {
  // 重量系（基準: g）
  mg:    { category: 'weight', factor: 0.001 },
  g:     { category: 'weight', factor: 1 },
  kg:    { category: 'weight', factor: 1000 },
  // 容量系（基準: ml）
  ml:    { category: 'volume', factor: 1 },
  L:     { category: 'volume', factor: 1000 },
  // 個数系（基準: 1個）
  個:    { category: 'count', factor: 1 },
  本:    { category: 'count', factor: 1 },
  枚:    { category: 'count', factor: 1 },
  足:    { category: 'count', factor: 1 },
  袋:    { category: 'count', factor: 1 },
  パック: { category: 'count', factor: 1 },
  セット: { category: 'count', factor: 1 },
};

const COMPARE_CONFIG = {
  '100gあたり':  { category: 'weight', base: 100 },
  '1kgあたり':   { category: 'weight', base: 1000 },
  '100mlあたり': { category: 'volume', base: 100 },
  '1Lあたり':    { category: 'volume', base: 1000 },
  '1つあたり':   { category: 'count',  base: 1 },
};

/**
 * 単位の変換係数を返す（基準単位への倍率）
 * @param {string} unit
 * @returns {number|null}
 */
export function getConversionFactor(unit) {
  return UNIT_CONFIG[unit]?.factor ?? null;
}

/**
 * 単位カテゴリを返す
 * @param {string} unit
 * @returns {'weight'|'volume'|'count'|null}
 */
export function getUnitCategory(unit) {
  return UNIT_CONFIG[unit]?.category ?? null;
}

/**
 * 単位カテゴリに対する推奨比較単位を返す
 * @param {string} category
 * @returns {string}
 */
export function getDefaultCompareUnit(category) {
  if (category === 'weight') return '100gあたり';
  if (category === 'volume') return '100mlあたり';
  return '1つあたり';
}

/**
 * 1商品の比較単位あたり金額を計算
 * @param {number} price 金額（円）
 * @param {number} quantity 数量
 * @param {string} unit 単位
 * @param {string} compareUnit 比較基準単位
 * @returns {{ valid: boolean, unitPrice?: number, displayUnit?: string, error?: string }}
 */
export function calcUnitPrice(price, quantity, unit, compareUnit) {
  const unitCfg = UNIT_CONFIG[unit];
  const cmpCfg = COMPARE_CONFIG[compareUnit];

  if (!unitCfg) return { valid: false, error: `不明な単位: ${unit}` };
  if (!cmpCfg)  return { valid: false, error: `不明な比較単位: ${compareUnit}` };
  if (unitCfg.category !== cmpCfg.category) {
    return { valid: false, error: `単位の種類が比較基準と一致しません（${unit} と ${compareUnit}）` };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { valid: false, error: '金額は0より大きい値を入力してください' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { valid: false, error: '数量は0より大きい値を入力してください' };
  }

  const baseAmount = quantity * unitCfg.factor; // 基準単位換算量
  const unitPrice  = (price / baseAmount) * cmpCfg.base;

  return { valid: true, unitPrice, displayUnit: compareUnit };
}

/**
 * 全商品を比較して最安値・差額・差率を返す
 * @param {{ name: string, price: number, quantity: number, unit: string }[]} products
 * @param {string} compareUnit
 * @returns {{ name: string, unitPrice?: number, isCheapest: boolean, diffAmount?: number, diffRate?: number, valid: boolean, error?: string }[]}
 */
export function compareProducts(products, compareUnit) {
  const results = products.map((p, i) => {
    const r = calcUnitPrice(p.price, p.quantity, p.unit, compareUnit);
    return { name: p.name || `商品${i + 1}`, ...r };
  });

  const validResults = results.filter(r => r.valid);
  if (validResults.length === 0) {
    return results.map(r => ({ ...r, isCheapest: false, diffAmount: null, diffRate: null }));
  }

  const minPrice = Math.min(...validResults.map(r => r.unitPrice));

  return results.map(r => {
    if (!r.valid) return { ...r, isCheapest: false, diffAmount: null, diffRate: null };
    const isCheapest = Math.abs(r.unitPrice - minPrice) < Number.EPSILON;
    const diffAmount = r.unitPrice - minPrice;
    const diffRate   = minPrice > 0 ? (diffAmount / minPrice) * 100 : 0;
    return { ...r, isCheapest, diffAmount, diffRate };
  });
}
