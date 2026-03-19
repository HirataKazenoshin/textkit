/**
 * TxConv – salesforce.js
 * Pure functions for Salesforce API name formatting and validation.
 * No side-effects, no DOM dependencies, no AI calls (those live in the HTML page).
 */

'use strict';

/* -------------------------------------------------------
   Sanitize & format helpers
------------------------------------------------------- */

/**
 * Remove all characters that are not ASCII letters, digits, or spaces.
 * Keeps hyphens and underscores as word separators, then normalises them to spaces.
 * @param {string} str
 * @returns {string}
 */
function sanitizeEnglish(str) {
  return str
    .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')  // strip invalid chars
    .replace(/[\-_]+/g, ' ')               // hyphens/underscores → space
    .replace(/\s+/g, ' ')                  // collapse whitespace
    .trim();
}

/**
 * Split a sanitized English string into an array of lowercase word tokens.
 * @param {string} str
 * @returns {string[]}
 */
function tokenize(str) {
  return sanitizeEnglish(str)
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
}

/* -------------------------------------------------------
   Core formatters  (all return the base name WITHOUT suffix)
------------------------------------------------------- */

/**
 * Convert to Snake_Case  →  Customer_Order_Date
 * @param {string[]} words
 * @returns {string}
 */
function toSnakeParts(words) {
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('_');
}

/**
 * Convert to CamelCase  →  CustomerOrderDate
 * @param {string[]} words
 * @returns {string}
 */
function toCamelParts(words) {
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Convert to SCREAMING_SNAKE  →  CUSTOMER_ORDER_DATE
 * @param {string[]} words
 * @returns {string}
 */
function toScreamingParts(words) {
  return words.join('_').toUpperCase();
}

/* -------------------------------------------------------
   API name builders  (add suffix + truncate + validate)
------------------------------------------------------- */

const MAX_API_NAME_LEN = 40; // Salesforce limit before suffix

/**
 * Truncate words array so the joined base name fits within maxLen characters
 * including the separators.
 * @param {string[]} words
 * @param {number} maxLen
 * @param {string} sep – separator used between words ('_' or '')
 * @returns {string[]}
 */
function truncateWords(words, maxLen, sep) {
  let result = [];
  let len = 0;
  const sepLen = sep.length;
  for (const w of words) {
    const add = (result.length === 0 ? 0 : sepLen) + w.length;
    if (len + add > maxLen) break;
    result.push(w);
    len += add;
  }
  return result.length ? result : [words[0].slice(0, maxLen)];
}

/**
 * Build a complete Salesforce API name.
 * @param {string} englishText  – translated / raw English string
 * @param {'snake'|'camel'|'screaming'} style
 * @param {string} suffix  – e.g. '__c', '__mdt', '__e', ''
 * @returns {string}
 */
function buildApiName(englishText, style, suffix) {
  const words = tokenize(englishText);
  if (!words.length) return '';

  const sep = style === 'camel' ? '' : '_';
  const truncated = truncateWords(words, MAX_API_NAME_LEN, sep);

  let base;
  if (style === 'snake')     base = toSnakeParts(truncated);
  else if (style === 'camel') base = toCamelParts(truncated);
  else                        base = toScreamingParts(truncated);

  return base + suffix;
}

/**
 * Generate all four standard Salesforce API name variants at once.
 * @param {string} englishText
 * @returns {{ snake: string, camel: string, screaming: string, mdt: string }}
 */
function generateApiNames(englishText) {
  return {
    snake:    buildApiName(englishText, 'snake',    '__c'),
    camel:    buildApiName(englishText, 'camel',    '__c'),
    screaming:buildApiName(englishText, 'screaming','__c'),
    mdt:      buildApiName(englishText, 'snake',    '__mdt'),
  };
}

/* -------------------------------------------------------
   Validation
------------------------------------------------------- */

/**
 * Validate a Salesforce API name (the full string including suffix).
 * Returns { valid: boolean, errors: string[] }
 * @param {string} name
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateApiName(name) {
  const errors = [];
  // Strip known suffixes for length check
  const base = name.replace(/__(c|mdt|e|b|x|kav|ka|feed|history|share|tag)$/i, '');

  if (!name)                         errors.push('名前が空です');
  if (!/^[a-zA-Z]/.test(name))      errors.push('先頭は英字にしてください');
  if (/[^a-zA-Z0-9_]/.test(base))   errors.push('使用できる文字は英数字とアンダースコアのみです');
  if (/_{2,}/.test(base))            errors.push('連続したアンダースコアは使用できません');
  if (/_$/.test(base))               errors.push('アンダースコアで終わる名前は使用できません');
  if (base.length > MAX_API_NAME_LEN)
    errors.push(`基本名は${MAX_API_NAME_LEN}文字以内にしてください（現在${base.length}文字）`);

  return { valid: errors.length === 0, errors };
}

/* -------------------------------------------------------
   Export
------------------------------------------------------- */
window.TxConvSalesforce = {
  generateApiNames,
  buildApiName,
  validateApiName,
  sanitizeEnglish,
  tokenize,
};
