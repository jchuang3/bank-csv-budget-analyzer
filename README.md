# Bank CSV Budget Analyzer

**TL;DR:** Upload your Chase and AMEX transaction CSVs, get automatic categorization, monthly reports, and a transportation spending breakdown — all running 100% in your browser, no data ever uploaded anywhere.

**Two ways to use it:**
1. **Just use it, no GitHub needed** → open the [live demo](https://jchuang3.github.io/bank-csv-budget-analyzer/) and upload your own CSVs. We don't store your data — nothing is ever uploaded or sent to a server, it all stays in your own browser.
2. **Fork it and customize** → add your own bank formats, change categories, restyle it.

**Why this exists:** Managing expenses across Chase and AMEX means dealing with two different CSV formats and no unified view of where your money actually goes.

*(English description further below)*

---

# 記帳分析（中文版）

上傳銀行 CSV 交易明細，自動解析、分類、產生月報表跟交通花費細項分析的個人記帳工具。

## 🔒 隱私設計

**所有資料只存在你自己瀏覽器的 localStorage，不會上傳到任何伺服器。**

- 這是一個純前端網頁，沒有後端、沒有資料庫、沒有任何 API 呼叫會把你的資料送出去
- 你上傳的 CSV 內容只會被瀏覽器讀取、解析、存在本機，換一台電腦或清瀏覽器快取就會消失
- 開發者（包含原作者）看不到任何使用者的交易資料——因為資料從來沒有離開過你的瀏覽器
- 可以打開瀏覽器開發者工具的 Network 分頁自行驗證：上傳 CSV 時不會有任何網路請求送出

## 🌐 這個網站是公開的（Public）

Live demo：**https://jchuang3.github.io/bank-csv-budget-analyzer/**

因為這個 repo 是 Public，這個網址任何人都能打開，不需要 GitHub 帳號、不需要登入。也因為是公開網址，理論上有可能被搜尋引擎索引到（不像私密連結那樣只有拿到連結的人才看得到）。這對使用上沒有影響——因為前面說的隱私設計，任何人打開這個網站上傳自己的 CSV，資料都只留在**他自己的瀏覽器**，彼此看不到對方的任何交易紀錄。

## 兩種使用方式

**方式一：直接用，不用碰 GitHub**
不需要帳號、不需要 clone 程式碼，直接打開上面的網址，上傳自己的銀行 CSV 就能用，跟原作者用的是同一份程式碼、同一個網站。想改功能或加自己的銀行格式沒辦法，但最快最簡單。

**方式二：Fork 一份自己改**
如果想客製化（加新銀行格式、改配色、改分類邏輯），到這個 repo 頁面右上角點 **Fork**，會複製一份完整程式碼到你自己的 GitHub 帳號下，改完之後照著下方「部署到 GitHub Pages」步驟，開自己的 Pages，就會有一個你自己的、獨立的網址（跟原作者的版本互不影響）。也可以直接把 repo clone 下來在自己電腦本機用，不一定要開 Pages。

## 本機使用

直接用瀏覽器打開 `index.html` 即可，不需要安裝任何東西、不需要註冊帳號。

## 部署到 GitHub Pages（讓自己隨時隨地能用手機打開）

1. 把這個 repo push 到 GitHub
2. 到 repo 的 `Settings` → `Pages`
3. Source 選 `main` branch，資料夾選 `/ (root)`
4. 存檔後幾分鐘會產生一個網址，例如
   `https://你的帳號.github.io/my-budget-app/`
   （如果 repo 是 Public，這個網址任何人都能打開，細節見上方「這個網站是公開的」）

⚠️ 注意：localStorage 資料是**存在瀏覽器裡**的，換裝置或清瀏覽器快取資料會消失。

## 目前支援的銀行格式

- AMEX 信用卡
- Chase 支票帳戶
- Chase 信用卡

想加其他銀行格式？看 `CLAUDE.md` 裡「新增銀行格式的方法」，或直接開 issue / PR。

## 想拿去改成自己的版本？

歡迎直接 Fork 這個 repo。修改重點通常在：
- `js/csv-parser.js`：新增/調整銀行 CSV 格式解析
- `js/categorizer.js`：調整分類關鍵字規則、分類清單
- `style.css`：換配色/風格

跨 AI 工具接手開發前，請先讓它讀過 `CLAUDE.md` 和 `docs/spec.md`，可以快速掌握專案脈絡。

---

# Bank CSV Budget Analyzer (English)

A lightweight, privacy-first personal finance tool that turns raw bank CSV exports into readable spending insights — entirely in your browser, with zero backend and zero data collection.

## Why this exists

- **Managing multiple banks is a mess.** AMEX and Chase export CSVs in completely different formats. This tool auto-detects the format and merges everything into one unified view — no manual reformatting.
- **"Where did my money actually go this month?"** A one-click, adjustable threshold (default $100) surfaces every large transaction — income or expense — so nothing slips by unnoticed.
- **Transportation spend is hard to track.** Rideshare, car rentals, and transit all get lumped into one vague "transportation" line on most bank statements. This tool splits it out into Uber/Lyft, Turo, car rentals, and public transit, with monthly and per-transaction detail.

## 🔒 Privacy by design

**All data lives only in your browser's localStorage. Nothing is ever uploaded to a server.**

- This is a pure frontend app — no backend, no database, no API calls that send your data anywhere
- Your uploaded CSV content is read and parsed locally; it disappears if you switch devices or clear your browser cache
- The developer (including the original author) cannot see anyone's transaction data — it never leaves your browser
- You can verify this yourself: open your browser's DevTools → Network tab while uploading a CSV — no network requests will fire

## 🌐 This site is public

Live demo: **https://jchuang3.github.io/bank-csv-budget-analyzer/**

Because this repo is public, anyone with the link can open it — no GitHub account or login required. Being public also means it could theoretically be indexed by search engines (unlike a private link only accessible to those who have it). This doesn't affect privacy in practice: thanks to the design above, every visitor's uploaded data stays in their own browser only — no one can see anyone else's transactions.

## Two ways to use it

**Option 1: Just use it, no GitHub required**
No account, no cloning code — just open the link above and upload your own bank CSVs. You're using the exact same code and site as the original author. You can't customize categories or add new bank formats this way, but it's the fastest option.

**Option 2: Fork it and make it your own**
Want to customize it (add a new bank format, change the color scheme, tweak categorization logic)? Click **Fork** at the top right of this repo page to copy the full codebase to your own GitHub account. After making changes, follow the "Deploy to GitHub Pages" steps below to get your own independent URL (completely separate from the original). You can also just clone it and run it locally without deploying to Pages at all.

## Running locally

Just open `index.html` in your browser. No installation, no account required.

## Deploying to GitHub Pages

1. Push this repo to GitHub
2. Go to repo `Settings` → `Pages`
3. Under Source, select the `main` branch and `/ (root)` folder
4. After saving, a URL will appear in a few minutes, e.g.
   `https://your-username.github.io/my-budget-app/`
   (If the repo is public, this URL is accessible to anyone — see "This site is public" above)

⚠️ Note: localStorage data lives **in the browser**. It will be lost if you switch devices or clear your browser cache.

## Currently supported bank formats

- AMEX credit card
- Chase checking account
- Chase credit card

Want to add another bank format? See "How to add a new bank format" in `CLAUDE.md`, or open an issue/PR.

## Want to customize your own version?

Feel free to fork this repo. The main files to touch are:
- `js/csv-parser.js`: add/adjust bank CSV format parsing
- `js/categorizer.js`: adjust categorization keyword rules and category list
- `style.css`: change colors/styling

Before handing this off to any AI coding tool, have it read `CLAUDE.md` and `docs/spec.md` first to get up to speed on the project.

## License

MIT — free to use, modify, and distribute. See [LICENSE](./LICENSE).
