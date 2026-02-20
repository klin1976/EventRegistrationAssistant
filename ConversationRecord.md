# 活動報到小幫手 - 專案對話紀錄

---

### [2026-02-18] 專案初始化與核心功能實作
- **確立架構**：Node.js + Express + SQLite (Backend) / React + Vite (Frontend)。
- **完成核心功能**：CSV 上傳、UUID/QR Code 生成、掃碼報到、後台統計儀表板。

---

### [2026-02-19] 環境穩定化與基礎文件
- **解決環境問題**：將專案從 Google Drive (I:) 移至本地 C:\temp_dev 開發，解決 npm 失敗問題。
- **產出 README.md**：包含功能說明、技術棧與安裝指南。
- **修復漏洞**：修正 CSV BOM 編碼問題、優化掃描器多重視窗問題、修復 API 500 錯誤。

---

### [2026-02-20] 功能升級 (v2.0)：Email 功能、HTTPS 與行動端優化
- **實作 Email 寄送**：新增 Nodemailer 整合，支援自動寄送報到 QR Code 到參加者信箱。
- **優化行動裝置連線**：
  - 調整 Vite 設定 (host: 0.0.0.0) 允許手機連入。
  - 整合 @vitejs/plugin-basic-ssl 實作 HTTPS，解決瀏覽器相機權限限制。
- **介面與功能強化**：
  - 增加 CSV 匯出、SVG 進度環形圖、拖放上傳、載入骨架 (Skeleton)。
  - 實作手機版 RWD（漢堡選單、表格卡片化）。
- **新增 GUIDE.md**：產出完整電腦/手機操作流程指南。

---

### [2026-02-20] 通知系統遷移 (Teams Webhook)
- **依據使用者需求**，將通知機制由 Email 寄送改為 MS Teams Webhook 觸發。
- **實作 `routes/teams.js`**，將包含 QR Code 的參加者資料打包成 JSON，發送至 Power Automate Webhook URL。
- **更新前端介面**與 `GUIDE.md` 說明文件。
- **全新代碼**已推送到 GitHub 儲存庫。

---

### [2026-02-20] 通知系統除錯與 Power Automate 整合完畢
- **修復 Teams Webhook Payload 格式**：
  - 解決 `AdaptiveCards.AdaptiveSerializationException: Property 'type' must be 'AdaptiveCard'` 錯誤。
  - 配合 Microsoft Power Automate 的「Incoming Webhook Replacement」範本，將 payload 調整為純粹的 Adaptive Card 結構。
- **系統穩定性修復**：
  - 徹底解決 Node.js 行程殘留導致的 `EADDRINUSE (Port 3001)` 衝突問題。
  - 修復因 JSON 格式解析失敗（curl 脫逸字元問題）造成的 Check-in API 指向虛假 500 錯誤。
- **自動化與同步**：
  - 完成本地 `C:\temp_dev` 與雲端硬碟 `I:\` 的代碼雙向同步。
  - 所有修復代碼（包含 server.js 內的錯誤處理與 teams.js 的 payload 包裝）已全數推送至 GitHub。
