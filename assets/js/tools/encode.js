/**
 * TextKit – encode.js
 * Pure functions for Base64 and URL encoding/decoding.
 * No side-effects, no DOM dependencies.
 * All processing is client-side only – nothing is sent to any server.
 */

'use strict';

/* -------------------------------------------------------
   Base64  (supports full Unicode via UTF-8 encoding)
------------------------------------------------------- */

/**
 * Encode a Unicode string to Base64.
 * Uses TextEncoder + Uint8Array for proper UTF-8 handling.
 * @param {string} str
 * @returns {{ result: string, error: null } | { result: null, error: string }}
 */
function base64Encode(str) {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return { result: btoa(binary), error: null };
  } catch (e) {
    return { result: null, error: 'エンコードに失敗しました: ' + e.message };
  }
}

/**
 * Decode a Base64 string to Unicode.
 * @param {string} str
 * @returns {{ result: string, error: null } | { result: null, error: string }}
 */
function base64Decode(str) {
  // Remove whitespace and line breaks that may have been inserted
  const cleaned = str.replace(/\s/g, '');
  if (!cleaned) return { result: '', error: null };
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { result: new TextDecoder().decode(bytes), error: null };
  } catch (e) {
    return { result: null, error: '無効なBase64文字列です。' };
  }
}

/**
 * Encode to URL-safe Base64 (RFC 4648 §5: +→-, /→_, no padding).
 * @param {string} str
 * @returns {{ result: string, error: null } | { result: null, error: string }}
 */
function base64UrlEncode(str) {
  const { result, error } = base64Encode(str);
  if (error) return { result: null, error };
  return {
    result: result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    error: null,
  };
}

/**
 * Decode URL-safe Base64.
 * @param {string} str
 * @returns {{ result: string, error: null } | { result: null, error: string }}
 */
function base64UrlDecode(str) {
  // Restore standard Base64
  let standard = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = standard.length % 4;
  if (pad === 2) standard += '==';
  else if (pad === 3) standard += '=';
  return base64Decode(standard);
}

/* -------------------------------------------------------
   URL Encoding
------------------------------------------------------- */

/**
 * URL-encode a string (encodeURIComponent – encodes all non-unreserved chars).
 * @param {string} str
 * @returns {{ result: string, error: null } | { result: null, error: string }}
 */
function urlEncode(str) {
  try {
    return { result: encodeURIComponent(str), error: null };
  } catch (e) {
    return { result: null, error: 'エンコードに失敗しました: ' + e.message };
  }
}

/**
 * URL-decode a string (decodeURIComponent).
 * @param {string} str
 * @returns {{ result: string, error: null } | { result: null, error: string }}
 */
function urlDecode(str) {
  try {
    return { result: decodeURIComponent(str), error: null };
  } catch (e) {
    return { result: null, error: '無効なURLエンコード文字列です。' };
  }
}

/**
 * URL-encode only special characters (preserves letters, digits, - _ . ~ / ? # & = :).
 * Useful for encoding a full URL without breaking its structure.
 * @param {string} str
 * @returns {{ result: string, error: null }}
 */
function urlEncodePartial(str) {
  try {
    // encodeURI preserves URI structure characters
    return { result: encodeURI(str), error: null };
  } catch (e) {
    return { result: null, error: 'エンコードに失敗しました: ' + e.message };
  }
}

/**
 * URL-decode with fallback for malformed sequences (replaces bad % sequences).
 * @param {string} str
 * @returns {{ result: string, error: null }}
 */
function urlDecodeSafe(str) {
  const result = str.replace(/%[0-9A-Fa-f]{2}|%./g, match => {
    try { return decodeURIComponent(match); }
    catch { return match; }
  });
  return { result, error: null };
}

// Export
window.TextKitEncode = {
  base64Encode,
  base64Decode,
  base64UrlEncode,
  base64UrlDecode,
  urlEncode,
  urlDecode,
  urlEncodePartial,
  urlDecodeSafe,
};
