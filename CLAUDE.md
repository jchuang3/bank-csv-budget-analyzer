# CLAUDE.md — AI 助手專案說明書

> 這份檔案是給 AI 編碼助手（Claude Code / Cursor / ChatGPT 等）看的。
> 開始任何開發工作前，請先讀完這份文件與 `docs/spec.md`。

## 專案是什麼

一個**個人記帳分析網站**，只有我自己使用，不需要登入系統、不需要伺服器後端。
用途：上傳從銀行下載的交易明細 CSV（目前有 AMEX、Chase 兩種格式），
自動解析、去重、分類，並提供全部交易檢視與月報表。

## 技術選型（已定案，不要隨意更換）

- 純前端：HTML + CSS + Vanilla JS（不用框架，保持輕量、好維護）
- 資料儲存：瀏覽器 `localStorage`（無資料庫，CSV 內容只留在使用者自己的裝置上，不會上傳到任何伺服器）
- 部署：GitHub Pages（免費、靜態、只有知道網址的人看得到，不會被搜尋引擎索引）
- 檔案結構：`js/csv-parser.js`（解析）、`js/categorizer.js`（分類引擎）、`app.js`（UI 邏輯）

## 目前狀態

- [x] v0.1 基本記帳功能（已淘汰，改為 v0.2）
- [x] v0.2 CSV 上傳與解析（AMEX、Chase）、自動分類、學習記憶、全部交易檢視、月報表
- [ ] 之後可能加：更多銀行格式、月對月趨勢比較、匯出結果 CSV

## 重要：新增銀行格式的方法

在 `js/csv-parser.js` 的 `BANK_FORMATS` 陣列新增一筆物件，包含：
`name`（銀行名稱）、`matchHeader(header)`（怎麼從 CSV 標頭辨識這是哪家銀行）、
`parseRow(cols, headerIdx)`（怎麼把一列資料轉成統一格式，記得 `amount` 要統一成「支出負、收入正」）。

## 開發規則

1. 每次修改前先讀 `docs/spec.md` 確認規格沒有衝突
2. 完成一個功能就 commit 一次，commit message 用中文簡短說明做了什麼
3. 不要引入需要付費 API 或帳號的服務（這是純本機專案）
4. UI 風格：見 `docs/spec.md` 的設計章節，維持一致的視覺語言

## 如何切換 AI 工具接手這個專案

把整個 repo clone 下來或用該工具的「開資料夾」功能打開，
AI 讀到這份 `CLAUDE.md` 跟 `docs/spec.md` 後就能接續開發，
不需要重新解釋專案背景。
