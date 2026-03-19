/**
 * TextKit – width.js
 * Pure functions for full-width (全角) ↔ half-width (半角) conversion.
 * No side-effects, no DOM dependencies.
 */

'use strict';

/* -------------------------------------------------------
   Half-width katakana → Full-width katakana mapping
   (voiced / semi-voiced marks handled separately)
------------------------------------------------------- */
const HW_KATA_TO_FW = {
  'ｦ':'ヲ','ｧ':'ァ','ｨ':'ィ','ｩ':'ゥ','ｪ':'ェ','ｫ':'ォ',
  'ｬ':'ャ','ｭ':'ュ','ｮ':'ョ','ｯ':'ッ','ｰ':'ー',
  'ｱ':'ア','ｲ':'イ','ｳ':'ウ','ｴ':'エ','ｵ':'オ',
  'ｶ':'カ','ｷ':'キ','ｸ':'ク','ｹ':'ケ','ｺ':'コ',
  'ｻ':'サ','ｼ':'シ','ｽ':'ス','ｾ':'セ','ｿ':'ソ',
  'ﾀ':'タ','ﾁ':'チ','ﾂ':'ツ','ﾃ':'テ','ﾄ':'ト',
  'ﾅ':'ナ','ﾆ':'ニ','ﾇ':'ヌ','ﾈ':'ネ','ﾉ':'ノ',
  'ﾊ':'ハ','ﾋ':'ヒ','ﾌ':'フ','ﾍ':'ヘ','ﾎ':'ホ',
  'ﾏ':'マ','ﾐ':'ミ','ﾑ':'ム','ﾒ':'メ','ﾓ':'モ',
  'ﾔ':'ヤ','ﾕ':'ユ','ﾖ':'ヨ',
  'ﾗ':'ラ','ﾘ':'リ','ﾙ':'ル','ﾚ':'レ','ﾛ':'ロ',
  'ﾜ':'ワ','ﾝ':'ン','ﾞ':'゛','ﾟ':'゜',
  '｡':'。','｢':'「','｣':'」','､':'、','･':'・',
};

// Voiced sound (濁音) combinations
const HW_VOICED = {
  'ｶﾞ':'ガ','ｷﾞ':'ギ','ｸﾞ':'グ','ｹﾞ':'ゲ','ｺﾞ':'ゴ',
  'ｻﾞ':'ザ','ｼﾞ':'ジ','ｽﾞ':'ズ','ｾﾞ':'ゼ','ｿﾞ':'ゾ',
  'ﾀﾞ':'ダ','ﾁﾞ':'ヂ','ﾂﾞ':'ヅ','ﾃﾞ':'デ','ﾄﾞ':'ド',
  'ﾊﾞ':'バ','ﾋﾞ':'ビ','ﾌﾞ':'ブ','ﾍﾞ':'ベ','ﾎﾞ':'ボ',
  'ｳﾞ':'ヴ',
};

// Semi-voiced (半濁音) combinations
const HW_SEMIVOICED = {
  'ﾊﾟ':'パ','ﾋﾟ':'ピ','ﾌﾟ':'プ','ﾍﾟ':'ペ','ﾎﾟ':'ポ',
};

/* Full-width katakana → Half-width katakana (reverse of above) */
const FW_KATA_TO_HW = Object.fromEntries(
  Object.entries(HW_KATA_TO_FW).map(([hw, fw]) => [fw, hw])
);
const FW_VOICED_TO_HW = Object.fromEntries(
  Object.entries(HW_VOICED).map(([hw, fw]) => [fw, hw])
);
const FW_SEMIVOICED_TO_HW = Object.fromEntries(
  Object.entries(HW_SEMIVOICED).map(([hw, fw]) => [fw, hw])
);

/* -------------------------------------------------------
   ASCII ↔ Full-width ASCII (Ａ-Ｚ, ａ-ｚ, ０-９, symbols)
   Unicode offset: U+FF01..U+FF5E ← U+0021..U+007E
------------------------------------------------------- */
const FW_ASCII_OFFSET = 0xFEE0; // 0xFF01 - 0x0021
const FW_SPACE = '\u3000';      // Full-width space

/**
 * Convert ASCII printable characters and half-width katakana to full-width.
 * @param {string} str
 * @returns {string}
 */
function toFullWidth(str) {
  if (!str) return '';

  // Replace voiced/semi-voiced first (they are 2-char sequences)
  let result = str;
  for (const [hw, fw] of Object.entries(HW_SEMIVOICED)) {
    result = result.split(hw).join(fw);
  }
  for (const [hw, fw] of Object.entries(HW_VOICED)) {
    result = result.split(hw).join(fw);
  }

  return result
    .split('')
    .map(ch => {
      const code = ch.charCodeAt(0);
      // Half-width space → full-width space
      if (ch === ' ') return FW_SPACE;
      // ASCII printable (! to ~) → full-width variant
      if (code >= 0x21 && code <= 0x7E) {
        return String.fromCharCode(code + FW_ASCII_OFFSET);
      }
      // Half-width katakana → full-width
      if (HW_KATA_TO_FW[ch]) return HW_KATA_TO_FW[ch];
      return ch;
    })
    .join('');
}

/**
 * Convert full-width characters and full-width katakana to half-width.
 * @param {string} str
 * @returns {string}
 */
function toHalfWidth(str) {
  if (!str) return '';

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = ch.charCodeAt(0);

    // Full-width space → ASCII space
    if (ch === FW_SPACE) { result += ' '; continue; }

    // Full-width ASCII (！ to ～) → ASCII printable
    if (code >= 0xFF01 && code <= 0xFF5E) {
      result += String.fromCharCode(code - FW_ASCII_OFFSET);
      continue;
    }

    // Full-width voiced katakana → 2-char half-width
    if (FW_SEMIVOICED_TO_HW[ch]) { result += FW_SEMIVOICED_TO_HW[ch]; continue; }
    if (FW_VOICED_TO_HW[ch])     { result += FW_VOICED_TO_HW[ch];     continue; }

    // Full-width katakana → half-width
    if (FW_KATA_TO_HW[ch]) { result += FW_KATA_TO_HW[ch]; continue; }

    result += ch;
  }
  return result;
}

/**
 * Convert only ASCII letters/digits between full-width and half-width.
 * (Convenience wrappers for partial conversion options.)
 */
function toFullWidthAlphaNum(str) {
  return str.split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 0x21 && code <= 0x7E) return String.fromCharCode(code + FW_ASCII_OFFSET);
    return ch;
  }).join('');
}

function toHalfWidthAlphaNum(str) {
  return str.split('').map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 0xFF01 && code <= 0xFF5E) return String.fromCharCode(code - FW_ASCII_OFFSET);
    return ch;
  }).join('');
}

// Export
window.TxConvWidth = {
  toFullWidth,
  toHalfWidth,
  toFullWidthAlphaNum,
  toHalfWidthAlphaNum,
};
