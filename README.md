# Bank CSV Budget Analyzer

A lightweight, privacy-first personal finance tool that turns raw bank CSV
exports into readable spending insights — entirely in your browser, with
zero backend and zero data collection.

## Why this exists

- **Managing multiple banks is a mess.** AMEX and Chase export CSVs in
  completely different formats. This tool auto-detects the format and
  merges everything into one unified view — no manual reformatting.
- **"Where did my money actually go this month?"** A one-click, adjustable
  threshold (default $100) surfaces every large transaction — income or
  expense — so nothing slips by unnoticed.
- **Transportation spend is hard to track.** Rideshare, car rentals, and
  transit all get lumped into one vague "transportation" line on most
  bank statements. This tool splits it out into Uber/Lyft, Turo, car
  rentals, and public transit, with monthly and per-transaction detail.

  ## Privacy by design

All parsing happens client-side. Your transaction data is stored only in
your browser's localStorage and is never transmitted anywhere — not to a
server, not to the developer, not to anyone. Fork it, self-host it, or
just open `index.html` locally.

# 我的記帳網站

私人記帳工具，純前端、資料存在瀏覽器 localStorage，不上傳任何伺服器。

## 本機使用

直接用瀏覽器打開 `index.html` 即可，不需要安裝任何東西。

## 部署到 GitHub Pages（讓自己隨時隨地能用手機打開）

1. 把這個 repo push 到 GitHub
2. 到 repo 的 `Settings` → `Pages`
3. Source 選 `main` branch，資料夾選 `/ (root)`
4. 存檔後幾分鐘會產生一個網址，例如
   `https://你的帳號.github.io/my-budget-app/`
   只有知道這個網址的人看得到，不會被搜尋引擎收錄

⚠️ 注意：localStorage 資料是**存在瀏覽器裡**的，換裝置或清瀏覽器快取資料會消失。
之後如果想要跨裝置同步，需要另外加雲端儲存（可以之後再請 AI 幫忙擴充）。

## 開發

跨 AI 工具接手開發前，請先讓它讀過 `CLAUDE.md` 和 `docs/spec.md`。
