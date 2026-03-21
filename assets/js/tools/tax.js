export function normalizeNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  const normalized = String(value ?? '')
    .replace(/[，,\s]/g, '')
    .replace(/％/g, '%')
    .trim();

  if (!normalized) {
    return NaN;
  }

  return Number(normalized);
}

export function clampRate(rate) {
  if (!Number.isFinite(rate)) {
    return NaN;
  }

  if (rate < 0) return 0;
  if (rate > 100) return 100;
  return rate;
}

export function applyRounding(value, mode = 'floor') {
  if (!Number.isFinite(value)) {
    return NaN;
  }

  switch (mode) {
    case 'ceil':
      return Math.ceil(value);
    case 'round':
      return Math.round(value);
    case 'floor':
    default:
      return Math.floor(value);
  }
}

export function calculateTax({ amount, rate, direction, rounding }) {
  const safeAmount = normalizeNumber(amount);
  const safeRate = clampRate(normalizeNumber(rate));

  if (!Number.isFinite(safeAmount) || !Number.isFinite(safeRate)) {
    return {
      valid: false,
      amountExcludingTax: 0,
      amountIncludingTax: 0,
      taxAmount: 0,
      rate: Number.isFinite(safeRate) ? safeRate : 0,
    };
  }

  const multiplier = 1 + (safeRate / 100);
  let amountExcludingTax = 0;
  let amountIncludingTax = 0;

  if (direction === 'inclusive-to-exclusive') {
    amountIncludingTax = applyRounding(safeAmount, rounding);
    amountExcludingTax = applyRounding(safeAmount / multiplier, rounding);
  } else {
    amountExcludingTax = applyRounding(safeAmount, rounding);
    amountIncludingTax = applyRounding(safeAmount * multiplier, rounding);
  }

  const taxAmount = Math.max(0, amountIncludingTax - amountExcludingTax);

  return {
    valid: true,
    amountExcludingTax,
    amountIncludingTax,
    taxAmount,
    rate: safeRate,
  };
}

export function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('ja-JP').format(value);
}