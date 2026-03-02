/**
 * Pinkoi Guestbook (Google Sheet) - Web App
 *
 * 使用方式（建議綁定在同一份 Google Sheet 內）：
 * 1) 在 Sheet 內：擴充功能 → Apps Script
 * 2) 把本檔案貼上並儲存
 * 3) 部署 → 新增部署作業 → 網頁應用程式
 *    - 執行身分：我
 *    - 存取權限：任何人
 * 4) 取得 /exec 的 URL，貼到前端環境變數 VITE_GUESTBOOK_API_URL
 */

const SHEET_NAME = 'Messages';
const MAX_AUTHOR_LEN = 20;
const MAX_CONTENT_LEN = 200;
const DEFAULT_LIMIT = 200;
const COOLDOWN_MS = 2500; // 每個 clientId 的冷卻時間

function ensureSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['timestamp', 'id', 'author', 'content']);
  }
  return sheet;
}

function jsonp_(obj, callback) {
  const payload = callback ? `${callback}(${JSON.stringify(obj)});` : JSON.stringify(obj);
  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function clean_(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function tooFast_(clientId) {
  const key = `cooldown_${clientId}`;
  const cache = CacheService.getScriptCache();
  const last = cache.get(key);
  const now = Date.now();
  if (last && now - Number(last) < COOLDOWN_MS) return true;
  cache.put(key, String(now), Math.ceil(COOLDOWN_MS / 1000));
  return false;
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = params.callback;
  const action = (params.action || 'list').toLowerCase();

  try {
    if (action === 'add') {
      const author = clean_(params.author);
      const content = String(params.content || '').trim();
      const clientId = clean_(params.clientId) || 'anonymous';

      if (!author || !content) {
        return jsonp_({ ok: false, error: '暱稱與留言都要填' }, callback);
      }
      if (author.length > MAX_AUTHOR_LEN) {
        return jsonp_({ ok: false, error: `暱稱最多 ${MAX_AUTHOR_LEN} 字` }, callback);
      }
      if (content.length > MAX_CONTENT_LEN) {
        return jsonp_({ ok: false, error: `留言最多 ${MAX_CONTENT_LEN} 字` }, callback);
      }
      if (tooFast_(clientId)) {
        return jsonp_({ ok: false, error: '送出太頻繁，請稍後再試' }, callback);
      }

      const sheet = ensureSheet_();
      const ts = Date.now();
      const id = `${ts}_${Math.floor(Math.random() * 1e6)}`;
      sheet.appendRow([ts, id, author, content]);

      return jsonp_({ ok: true, id, timestamp: ts }, callback);
    }

    // list
    const sheet = ensureSheet_();
    const limit = Math.max(1, Math.min(Number(params.limit || DEFAULT_LIMIT), 500));

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonp_({ ok: true, data: [] }, callback);
    }

    const startRow = Math.max(2, lastRow - limit + 1);
    const range = sheet.getRange(startRow, 1, lastRow - startRow + 1, 4);
    const values = range.getValues();

    const data = values
      .map((row) => ({
        timestamp: Number(row[0]),
        id: String(row[1]),
        author: String(row[2]),
        content: String(row[3]),
      }))
      .filter((m) => m.author && m.content)
      .sort((a, b) => a.timestamp - b.timestamp);

    return jsonp_({ ok: true, data }, callback);
  } catch (err) {
    return jsonp_({ ok: false, error: String(err) }, callback);
  }
}
