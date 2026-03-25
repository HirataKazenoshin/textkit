/**
 * excel-to-md.js — ExcelテーブルをMarkdownテーブルに変換するロジック（pure functions・DOM操作禁止）
 */

/**
 * TSVテキストを行・列の2次元配列に分解する
 * Excel貼り付け時の引用符付きセル（セル内改行・タブ含む）に対応
 * @param {string} text
 * @returns {string[][]}
 */
export function parseTsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuote = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // エスケープされた " ("" → ")
          cell += '"';
          i += 2;
        } else {
          inQuote = false;
          i++;
        }
      } else {
        cell += ch;
        i++;
      }
    } else {
      if (ch === '"' && cell.length === 0) {
        inQuote = true;
        i++;
      } else if (ch === '\t') {
        row.push(cell);
        cell = '';
        i++;
      } else if (ch === '\r') {
        i++; // \r\n の \r をスキップ
      } else if (ch === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        i++;
      } else {
        cell += ch;
        i++;
      }
    }
  }

  // 末尾の残り
  if (row.length > 0 || cell.length > 0) {
    row.push(cell);
    if (row.some(c => c !== '')) rows.push(row);
  }

  return rows;
}

/**
 * 整列指定から区切り行のセル文字列を返す
 * @param {'none'|'left'|'center'|'right'} align
 * @returns {string}
 */
function alignSep(align) {
  if (align === 'left')   return ':---';
  if (align === 'center') return ':---:';
  if (align === 'right')  return '---:';
  return '---';
}

/**
 * Markdown用にセル内の | をエスケープし、改行を <br> に変換する
 * @param {string} cell
 * @returns {string}
 */
function escapeCell(cell) {
  return cell.replace(/\r/g, '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

/**
 * ヘッダー行とデータ行からMarkdownテーブルを生成する
 * @param {string} headerText - タブ区切りのヘッダー行（1行）
 * @param {string} dataText   - タブ区切りのデータ行（複数行可）
 * @param {('none'|'left'|'center'|'right')[]} [alignments] - 各列の整列指定
 * @returns {{ markdown: string, colCount: number, rowCount: number, headers: string[], parsedRows: string[][], error: string|null }}
 */
export function convertToMarkdown(headerText, dataText, alignments = []) {
  const headerLine = headerText.trim();
  if (!headerLine) {
    return { markdown: '', colCount: 0, rowCount: 0, headers: [], parsedRows: [], error: 'ヘッダーを入力してください。' };
  }

  const headerRows = parseTsv(headerLine);
  const headers = headerRows.length > 0 ? headerRows[0] : [];
  const colCount = headers.length;

  if (colCount === 0) {
    return { markdown: '', colCount: 0, rowCount: 0, headers: [], parsedRows: [], error: 'ヘッダーを正しく認識できませんでした。' };
  }

  // ヘッダー行
  const headerRow = '| ' + headers.map(escapeCell).join(' | ') + ' |';

  // 区切り行（整列情報付き）
  const separatorRow = '| ' + Array.from({ length: colCount }, (_, i) =>
    alignSep(alignments[i] || 'none')
  ).join(' | ') + ' |';

  // データ行
  const parsedRows = parseTsv(dataText);
  const mdDataRows = parsedRows.map(cells => {
    const padded = cells.slice();
    while (padded.length < colCount) padded.push('');
    return '| ' + padded.map(escapeCell).join(' | ') + ' |';
  });

  const markdown = [headerRow, separatorRow, ...mdDataRows].join('\n');

  return { markdown, colCount, rowCount: parsedRows.length, headers, parsedRows, error: null };
}
