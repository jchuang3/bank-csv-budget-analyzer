// csv-parser.js
// 負責：把原始 CSV 文字轉成統一格式的交易物件陣列
// 之後如果有第三種銀行格式，只要在 BANK_FORMATS 陣列新增一個定義即可

/** 手寫 CSV parser，處理含逗號/換行的引號欄位（AMEX 的 Extended Details 會跨行） */
function parseCSVText(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && next === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.some(f => f.trim() !== ""));
}

function mdyToISO(mdy) {
  const [m, d, y] = mdy.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function makeId(bank, date, description, amount) {
  const raw = `${bank}|${date}|${description}|${amount}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return `t_${Math.abs(hash)}_${raw.length}`;
}

/** 每種銀行格式的定義：怎麼辨認 header、怎麼把一列資料轉成統一格式 */
const BANK_FORMATS = [
  {
    name: "AMEX",
    matchHeader: (header) =>
      header.includes("Appears On Your Statement As") && header.includes("Category"),
    parseRow: (cols, headerIdx) => {
      const date = cols[headerIdx["Date"]];
      const description = cols[headerIdx["Description"]].trim();
      const amount = -1 * parseFloat(cols[headerIdx["Amount"]]); 
      // AMEX: 正數=刷卡消費(對使用者來說是支出) -> 統一成「支出為負數」，故取負號
      const rawCategory = cols[headerIdx["Category"]] || "";
      return {
        bank: "AMEX",
        date: mdyToISO(date),
        description,
        amount,
        rawCategory,
        type: ""
      };
    }
  },
  {
    name: "Chase",
    matchHeader: (header) =>
      header.includes("Posting Date") && header.includes("Details"),
    parseRow: (cols, headerIdx) => {
      const date = cols[headerIdx["Posting Date"]];
      const description = cols[headerIdx["Description"]].trim();
      const amount = parseFloat(cols[headerIdx["Amount"]]);
      // Chase: 已經是正負號正確（CREDIT正/DEBIT負）-> 直接使用
      const type = cols[headerIdx["Type"]] || cols[headerIdx["Details"]] || "";
      return {
        bank: "Chase",
        date: mdyToISO(date),
        description,
        amount,
        rawCategory: "",
        type
      };
    }
  },
  {
    name: "Chase 信用卡",
    matchHeader: (header) =>
      header.includes("Transaction Date") && header.includes("Post Date"),
    parseRow: (cols, headerIdx) => {
      const date = cols[headerIdx["Transaction Date"]];
      const description = cols[headerIdx["Description"]].trim();
      const amount = parseFloat(cols[headerIdx["Amount"]]);
      // Chase 信用卡：跟支票帳戶一樣，負=刷卡消費，正=繳款/退款
      const rawCategory = cols[headerIdx["Category"]] || "";
      const type = cols[headerIdx["Type"]] || "";
      return {
        bank: "Chase 信用卡",
        date: mdyToISO(date),
        description,
        amount,
        rawCategory,
        type
      };
    }
  }
];

/** 主要進入點：吃 CSV 文字，回傳 { bank, transactions, errors } */
function parseBankCSV(text, fileName) {
  const rows = parseCSVText(text);
  if (rows.length < 2) {
    return { bank: null, transactions: [], errors: [`${fileName}：檔案內容為空或格式錯誤`] };
  }
  const header = rows[0].map(h => h.trim());
  const format = BANK_FORMATS.find(f => f.matchHeader(header));

  if (!format) {
    return {
      bank: null,
      transactions: [],
      errors: [`${fileName}：無法辨識的 CSV 格式（不是目前支援的銀行格式）`]
    };
  }

  const headerIdx = {};
  header.forEach((h, i) => { headerIdx[h] = i; });

  const transactions = [];
  const errors = [];

  for (let i = 1; i < rows.length; i++) {
    try {
      const parsed = format.parseRow(rows[i], headerIdx);
      if (!parsed.date || isNaN(parsed.amount)) continue;
      parsed.id = makeId(parsed.bank, parsed.date, parsed.description, parsed.amount);
      parsed.sourceFile = fileName;
      transactions.push(parsed);
    } catch (e) {
      errors.push(`${fileName} 第 ${i + 1} 列解析失敗：${e.message}`);
    }
  }

  return { bank: format.name, transactions, errors };
}
