// categorizer.js
// 負責：幫每一筆交易決定分類。
// 順序：使用者手動覆寫的記憶 > AMEX 原生分類對應 > 關鍵字規則 > 預設值

const CATEGORIES = [
  "薪資", "轉帳", "信用卡還款", "房貸", "社區管理費",
  "水電瓦斯", "稅務", "餐飲", "交通", "購物", "日用雜貨",
  "娛樂", "訂閱服務", "醫療", "退款", "其他"
];

const OVERRIDE_KEY = "category-overrides-v1";

/** 把描述文字中會變動的數字/ID去掉，取得比較穩定的「商家關鍵字」 */
function normalizeDescription(desc) {
  return desc
    .toUpperCase()
    .replace(/WEB ID:\s*\S+/g, "")
    .replace(/PPD ID:\s*\S+/g, "")
    .replace(/CCD ID:\s*\S+/g, "")
    .replace(/TRANSACTION#:\s*\S+/g, "")
    .replace(/REFERENCE#:\s*\S+/g, "")
    .replace(/#\s*\d+/g, "")
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, "")
    .replace(/\d{4,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {}; }
  catch { return {}; }
}

function saveOverride(desc, category) {
  const overrides = loadOverrides();
  overrides[normalizeDescription(desc)] = category;
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
}

/** 銀行自帶分類 -> 我們的分類（AMEX、Chase 信用卡都適用） */
function mapRawCategory(rawCategory) {
  const c = rawCategory.toLowerCase();
  if (c.includes("restaurant") || c.includes("dining") || c.includes("food & drink") || c.includes("food and drink")) return "餐飲";
  if (c.includes("grocery") || c.includes("groceries")) return "日用雜貨";
  if (c.includes("merchandise") || c.includes("retail") || c.includes("shopping")) return "購物";
  if (c.includes("entertainment")) return "娛樂";
  if (c.includes("bills & utilities") || c.includes("utilities")) return "水電瓦斯";
  if (c.includes("travel") || c.includes("transportation") || c.includes("fuel") || c.includes("gas") || c.includes("automotive")) return "交通";
  if (c.includes("medical") || c.includes("health")) return "醫療";
  if (c.includes("subscription") || c.includes("business services-internet")) return "訂閱服務";
  if (c.includes("payment") || c.includes("credit")) return "信用卡還款";
  return null;
}

/** 關鍵字規則（依序比對，符合第一條就採用） */
const KEYWORD_RULES = [
  { re: /PAYROLL/, category: "薪資" },
  { re: /ZELLE|VENMO|QUICKPAY|ACCT_XFER|ONLINE TRANSFER|ONLINE REALTIME TRANSFER/, category: "轉帳" },
  { re: /PAYMENT TO CHASE CARD|AMERICAN EXPRESS ACH PMT|CHASE CREDIT CRD AUTOPAY|LOAN_PMT/, category: "信用卡還款" },
  { re: /WF HOME MTG|MORTGAGE/, category: "房貸" },
  { re: /HOA/, category: "社區管理費" },
  { re: /PGANDE|PG&E|UTILIT/, category: "水電瓦斯" },
  { re: /\bIRS\b|USATAXPYMT|FRANCHISE TAX/, category: "稅務" },
  { re: /REFUND|REIMB/, category: "退款" },
  { re: /PIZZA|CAFE|COFFEE|RESTAURANT|GRILL|KITCHEN|DIN TAI FUNG/, category: "餐飲" },
  { re: /ARCO|SHELL|CHEVRON|\bGAS\b|UBER|LYFT|TURO|HERTZ|ENTERPRISE RENT|\bAVIS\b|BUDGET RENT|NATIONAL CAR|\bALAMO\b|\bSIXT\b|BART|\bMUNI\b|CLIPPER|CALTRAIN|AMTRAK|PARKING|\bTOLL\b/, category: "交通" }
];

/** 交通類別的細項分組（只用在已經被分類為「交通」的交易上） */
const TRANSPORT_SUBCATEGORIES = ["Uber / Lyft", "Turo", "租車", "大眾運輸", "其他交通"];

const TRANSPORT_SUB_RULES = [
  { re: /UBER|LYFT/, sub: "Uber / Lyft" },
  { re: /TURO/, sub: "Turo" },
  { re: /HERTZ|ENTERPRISE RENT|\bAVIS\b|BUDGET RENT|NATIONAL CAR|\bALAMO\b|\bSIXT\b/, sub: "租車" },
  { re: /BART|\bMUNI\b|CLIPPER|CALTRAIN|AMTRAK|TRANSIT/, sub: "大眾運輸" }
];

function getTransportSubcategory(tx) {
  const haystack = tx.description.toUpperCase();
  for (const rule of TRANSPORT_SUB_RULES) {
    if (rule.re.test(haystack)) return rule.sub;
  }
  return "其他交通";
}
function categorize(tx) {
  const overrides = loadOverrides();
  const key = normalizeDescription(tx.description);

  if (overrides[key]) return overrides[key];

  if (tx.rawCategory) {
    const mapped = mapRawCategory(tx.rawCategory);
    if (mapped) return mapped;
  }

  const haystack = `${tx.description} ${tx.type || ""}`.toUpperCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(haystack)) return rule.category;
  }

  return "其他";
}
