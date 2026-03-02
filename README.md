# pinkoi-guestbook-wretch

這是一個「圖片輪播 + 留言彈幕」的留言板，適合部署到 GitHub Pages（專案頁）。

## 1) 本機啟動
```bash
npm install
npm run dev
```

## 2) 放輪播圖片
1. 把圖片檔放到 `public/slides/`
2. 編輯 `public/slides/slides.json`，把檔名填進去，例如：
```json
["01.jpg","02.png"]
```

## 3) 建立 Google Sheet（共用留言）
### 3-1. 建一份 Sheet
- 新建 Google Sheet（空白即可）

### 3-2. 開 Apps Script
- 在 Sheet 內：`擴充功能 → Apps Script`
- 把專案的 `apps-script/Code.gs` 全部貼上，按儲存

### 3-3. 部署成 Web App
- 右上角 `部署 → 新增部署作業 → 網頁應用程式`
  - 執行身分：`我`
  - 存取權限：`任何人`
- 部署完成後，你會拿到一個 URL（結尾通常是 `/exec`）

## 4) 把 Web App URL 接回前端
### 4-1. 本機測試
建立 `.env.local`：
```bash
VITE_GUESTBOOK_API_URL=你的WebAppURL
```

### 4-2. GitHub Pages 正式環境
到 GitHub Repo：
- `Settings → Secrets and variables → Actions`
- 新增 `Repository secret`
  - Name：`VITE_GUESTBOOK_API_URL`
  - Value：你的 Web App URL

## 5) GitHub Pages 上線
1. Repo `Settings → Pages`
2. Source 選 `GitHub Actions`
3. push 到 `main` 之後，Actions 會自動 build 並部署

## 小提醒
- 這是公開留言板，後端已內建「每個 clientId 冷卻時間」來降低灌留言。
