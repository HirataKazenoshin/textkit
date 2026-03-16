/**
 * TextKit – case.js
 * Pure functions for snake_case ↔ camelCase conversion.
 * No side-effects, no DOM dependencies.
 */

'use strict';

/**
 * Split an input string into a normalized word array.
 * Handles camelCase, PascalCase, snake_case, kebab-case, spaces, etc.
 * @param {string} str
 * @returns {string[]}
 */
function splitWords(str) {
  return str
    // Insert separator before uppercase letter preceded by lowercase
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    // Insert separator before sequence of capitals followed by lowercase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    // Replace hyphens, dots, spaces, slashes with underscores
    .replace(/[-.\s/]+/g, '_')
    // Split on underscores
    .split('_')
    // Remove empty tokens
    .filter(Boolean)
    // Lowercase all
    .map(w => w.toLowerCase());
}

/**
 * Convert to camelCase.
 * @param {string} str
 * @returns {string}
 */
function toCamelCase(str) {
  if (!str) return '';
  const words = splitWords(str);
  return words
    .map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Convert to PascalCase.
 * @param {string} str
 * @returns {string}
 */
function toPascalCase(str) {
  if (!str) return '';
  const words = splitWords(str);
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Convert to snake_case.
 * @param {string} str
 * @returns {string}
 */
function toSnakeCase(str) {
  if (!str) return '';
  return splitWords(str).join('_');
}

/**
 * Convert to SCREAMING_SNAKE_CASE.
 * @param {string} str
 * @returns {string}
 */
function toScreamingSnakeCase(str) {
  if (!str) return '';
  return splitWords(str).join('_').toUpperCase();
}

/**
 * Convert to kebab-case.
 * @param {string} str
 * @returns {string}
 */
function toKebabCase(str) {
  if (!str) return '';
  return splitWords(str).join('-');
}

/**
 * Convert to Title Case.
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  if (!str) return '';
  return splitWords(str)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Process multi-line input: apply converter to each non-empty line.
 * @param {string} text
 * @param {Function} converter
 * @returns {string}
 */
function convertLines(text, converter) {
  return text
    .split('\n')
    .map(line => line.trim() === '' ? '' : converter(line))
    .join('\n');
}

// Export for use in HTML via global scope
window.TextKitCase = {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toScreamingSnakeCase,
  toKebabCase,
  toTitleCase,
  convertLines,
};
