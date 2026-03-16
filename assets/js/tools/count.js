/**
 * TextKit – count.js
 * Pure functions for character / word counting.
 * No side-effects, no DOM dependencies.
 */

'use strict';

/**
 * Count UTF-8 bytes for a string.
 * @param {string} str
 * @returns {number}
 */
function countBytes(str) {
  return new TextEncoder().encode(str).length;
}

/**
 * Count lines (newline-separated).
 * Empty string = 0 lines, single line without newline = 1 line.
 * @param {string} str
 * @returns {number}
 */
function countLines(str) {
  if (str === '') return 0;
  return str.split('\n').length;
}

/**
 * Count lines (empty string counts as 1 for UI display purposes).
 * @param {string} str
 * @returns {number}
 */
function countLinesUI(str) {
  return str === '' ? 0 : str.split('\n').length;
}

/**
 * Count words (whitespace-delimited tokens).
 * @param {string} str
 * @returns {number}
 */
function countWords(str) {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Count sentences (approximate: split on ., !, ?, 。, ！, ？).
 * @param {string} str
 * @returns {number}
 */
function countSentences(str) {
  if (!str.trim()) return 0;
  const matches = str.match(/[.!?。！？]+/g);
  return matches ? matches.length : (str.trim() ? 1 : 0);
}

/**
 * Count paragraphs (double newline-separated, or single block).
 * @param {string} str
 * @returns {number}
 */
function countParagraphs(str) {
  if (!str.trim()) return 0;
  return str.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
}

/**
 * Count kanji characters (CJK Unified Ideographs range).
 * @param {string} str
 * @returns {number}
 */
function countKanji(str) {
  const matches = str.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g);
  return matches ? matches.length : 0;
}

/**
 * Count hiragana characters.
 * @param {string} str
 * @returns {number}
 */
function countHiragana(str) {
  const matches = str.match(/[\u3041-\u3096]/g);
  return matches ? matches.length : 0;
}

/**
 * Count katakana characters (full-width + half-width).
 * @param {string} str
 * @returns {number}
 */
function countKatakana(str) {
  const matches = str.match(/[\u30A1-\u30FC\uFF65-\uFF9F]/g);
  return matches ? matches.length : 0;
}

/**
 * Count ASCII letters (a-z, A-Z) and full-width equivalents.
 * @param {string} str
 * @returns {number}
 */
function countAlpha(str) {
  const matches = str.match(/[a-zA-Z\uFF21-\uFF3A\uFF41-\uFF5A]/g);
  return matches ? matches.length : 0;
}

/**
 * Count digits (0-9) and full-width equivalents.
 * @param {string} str
 * @returns {number}
 */
function countDigits(str) {
  const matches = str.match(/[0-9\uFF10-\uFF19]/g);
  return matches ? matches.length : 0;
}

/**
 * Count whitespace characters (spaces, tabs, newlines).
 * @param {string} str
 * @returns {number}
 */
function countWhitespace(str) {
  const matches = str.match(/\s/g);
  return matches ? matches.length : 0;
}

/**
 * Compute all statistics at once.
 * @param {string} str
 * @returns {Object}
 */
function analyzeText(str) {
  return {
    total:       str.length,
    noSpaces:    str.replace(/\s/g, '').length,
    noNewlines:  str.replace(/\n/g, '').length,
    bytes:       countBytes(str),
    lines:       countLinesUI(str),
    words:       countWords(str),
    sentences:   countSentences(str),
    paragraphs:  countParagraphs(str),
    kanji:       countKanji(str),
    hiragana:    countHiragana(str),
    katakana:    countKatakana(str),
    alpha:       countAlpha(str),
    digits:      countDigits(str),
    whitespace:  countWhitespace(str),
  };
}

// Export
window.TextKitCount = {
  analyzeText,
  countBytes,
  countLines,
  countLinesUI,
  countWords,
  countSentences,
  countParagraphs,
  countKanji,
  countHiragana,
  countKatakana,
  countAlpha,
  countDigits,
  countWhitespace,
};
