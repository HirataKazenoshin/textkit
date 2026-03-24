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
   Salesforce 標準オブジェクト・標準項目 日本語名 → API名辞書
------------------------------------------------------- */

const SF_STANDARD_MAP = {
  // ── 主要標準オブジェクト ──────────────────────────────────
  '取引先':                       'Account',
  '取引先責任者':                  'Contact',
  '商談':                         'Opportunity',
  'リード':                        'Lead',
  'ケース':                        'Case',
  '行動':                         'Event',
  'ToDo':                         'Task',
  'タスク':                        'Task',
  'キャンペーン':                   'Campaign',
  '製品':                         'Product2',
  '価格表':                        'Pricebook2',
  '価格表エントリ':                 'PricebookEntry',
  '注文':                         'Order',
  '注文商品':                      'OrderItem',
  '契約':                         'Contract',
  '資産':                         'Asset',
  'ユーザ':                        'User',
  'ユーザー':                      'User',
  'グループ':                      'Group',
  'レポート':                      'Report',
  'ダッシュボード':                 'Dashboard',
  'ドキュメント':                   'Document',
  '添付ファイル':                   'Attachment',
  'メモ':                         'Note',

  // ── 商談・取引先関連 ─────────────────────────────────────
  '商談商品':                      'OpportunityLineItem',
  '商談の取引先責任者の役割':        'OpportunityContactRole',
  '商談チームメンバー':             'OpportunityTeamMember',
  '取引先チームメンバー':           'AccountTeamMember',
  '取引先と取引先責任者の関係':      'AccountContactRelation',
  'キャンペーンメンバー':           'CampaignMember',
  '見積':                         'Quote',
  '見積品目':                      'QuoteLineItem',
  'ソリューション':                 'Solution',

  // ── コンテンツ・ファイル ─────────────────────────────────
  'コンテンツドキュメント':          'ContentDocument',
  'コンテンツバージョン':            'ContentVersion',
  'コンテンツドキュメントリンク':     'ContentDocumentLink',
  'コンテンツライブラリ':            'ContentWorkspace',

  // ── 組織・ユーザ管理 ────────────────────────────────────
  'ロール':                        'UserRole',
  'プロファイル':                   'Profile',
  '権限セット':                     'PermissionSet',
  '権限セット割り当て':              'PermissionSetAssignment',
  'レコードタイプ':                 'RecordType',
  '組織':                         'Organization',
  'キュー':                        'Queue',
  'グループメンバー':               'GroupMember',

  // ── 活動 ─────────────────────────────────────────────
  '活動':                         'Activity',

  // ── 開発関連 ─────────────────────────────────────────
  'Apexクラス':                    'ApexClass',
  'Apexトリガ':                    'ApexTrigger',
  'Visualforceページ':             'ApexPage',

  // ── 共通標準項目 ─────────────────────────────────────
  'ID':                           'Id',
  '名前':                         'Name',
  '作成日':                        'Created Date',
  '作成日付':                      'Created Date',
  '作成日時':                      'Created Date Time',
  '最終更新日':                     'Last Modified Date',
  '更新日':                        'Modified Date',
  '更新日付':                      'Modified Date',
  '更新日時':                      'Modified Date Time',
  '所有者':                        'Owner Id',
  '説明':                         'Description',
  'アイコン':                      'Icon',
  '画像':                         'Image',
  'フラグ':                        'Flag',
  '区分':                         'Category',
  'コード':                        'Code',
  'ステータス':                     'Status',
  'カテゴリ':                      'Category',
  'タイプ':                        'Type',
  'ラベル':                        'Label',

  // ── 取引先（Account）項目 ────────────────────────────
  '取引先名':                      'Name',
  '取引先番号':                     'AccountNumber',
  '親取引先':                      'ParentId',
  '電話':                         'Phone',
  'ウェブサイト':                   'Website',
  '業種':                         'Industry',
  '従業員数':                      'NumberOfEmployees',
  '年間売上':                      'AnnualRevenue',
  '取引先種別':                     'Type',
  '評価':                         'Rating',
  '請求先住所':                     'BillingAddress',
  '郵送先住所':                     'ShippingAddress',

  // ── 取引先責任者（Contact）項目 ─────────────────────
  '姓':                           'LastName',
  '名':                           'FirstName',
  '姓（カナ）':                     'LastNameKana',
  '名（カナ）':                     'FirstNameKana',
  '役職':                         'Title',
  '部署':                         'Department',
  'メール':                        'Email',
  '携帯':                         'MobilePhone',
  '誕生日':                        'Birthdate',
  'リード発生元':                   'LeadSource',

  // ── 商談（Opportunity）項目 ─────────────────────────
  '商談名':                        'Name',
  '金額':                         'Amount',
  '完了予定日':                     'CloseDate',
  'フェーズ':                      'StageName',
  '確度':                         'Probability',
  '商談種別':                      'Type',
  '次のステップ':                   'NextStep',

  // ── リード（Lead）項目 ──────────────────────────────
  '会社名':                        'Company',
  'リード状況':                     'Status',
  '取引開始済み':                   'IsConverted',
  '取引開始日':                     'ConvertedDate',

  // ── ケース（Case）項目 ──────────────────────────────
  'ケース番号':                     'CaseNumber',
  '件名':                         'Subject',
  '状況':                         'Status',
  '優先度':                        'Priority',
  '発生源':                        'Origin',
  '種別':                         'Type',
  '理由':                         'Reason',

  // ── ToDo / 行動 共通項目 ────────────────────────────
  '期日':                         'ActivityDate',
  '開始日時':                      'StartDateTime',
  '終了日時':                      'EndDateTime',
  '場所':                         'Location',
};

/**
 * 日本語名が標準オブジェクト・標準項目辞書に完全一致するか確認して英語API名を返す。
 * 一致しない場合は null を返す。
 * @param {string} jaText
 * @returns {string|null}
 */
function lookupStandardName(jaText) {
  return SF_STANDARD_MAP[jaText.trim()] ?? null;
}

/**
 * 入力テキスト中の標準語句を英語に置換して返す（部分一致）。
 * 長い語句を優先してマッチ（例: 「取引先責任者」を「取引先」より先にマッチ）。
 * 変化がなければ元の文字列をそのまま返す。
 * @param {string} jaText
 * @returns {string}
 */
function substituteStandardTerms(jaText) {
  // 2文字未満のキーは部分置換から除外（誤マッチ防止）
  // 長い順にソートして短い語句への誤マッチを防ぐ（例: 取引先責任者 > 取引先）
  const keys = Object.keys(SF_STANDARD_MAP)
    .filter(k => k.length >= 2)
    .sort((a, b) => b.length - a.length);
  let result = jaText;
  for (const key of keys) {
    if (result.includes(key)) {
      // 英語に置換時、前後にスペースを入れて単語境界を確保
      result = result.split(key).join(' ' + SF_STANDARD_MAP[key] + ' ');
    }
  }
  // 連続空白を正規化
  return result.replace(/\s+/g, ' ').trim();
}

/* -------------------------------------------------------
   Post-processing for AI translation output
------------------------------------------------------- */

/**
 * AI翻訳結果をAPI名に適した英語に整形する。
 * - 冠詞・前置詞・接続詞を除去
 * - 記号・括弧を除去
 * - 余分な空白を正規化
 * @param {string} englishText – AI翻訳後の英語テキスト
 * @returns {string}
 */
function cleanForApiName(englishText) {
  let result = englishText
    .replace(/\b(the|a|an|of|for|in|at|on|by|to|and|or|with|from|into|about|as|its|is|are|be|been)\b/gi, ' ')
    .replace(/[^\w\s]/g, ' ')   // 記号・括弧を除去
    // CamelCase / PascalCase を分割（例: CreatedDate → Created Date）
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')       // 連続空白を1つに
    .trim();
  // 連続する同一単語を除去（AI翻訳のゴミ出力対策）
  result = result.split(' ').filter((w, i, arr) =>
    i === 0 || w.toLowerCase() !== arr[i - 1].toLowerCase()
  ).join(' ');
  return result;
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
  lookupStandardName,
  substituteStandardTerms,
  cleanForApiName,
};
