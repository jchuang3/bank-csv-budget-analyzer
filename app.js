// app.js — UI 邏輯、儲存、渲染

const TX_STORAGE_KEY = "bank-transactions-v1";

let currentMonth = new Date();
currentMonth.setDate(1);
let expandedMonthCategory = null; // 月報表「支出分類佔比」目前展開的分類

/** 找出目前所有交易中最新的月份，把月報表預設定位到那裡（而不是「今天」） */
function jumpToLatestDataMonth() {
  const all = loadTransactions();
  if (all.length === 0) return;
  const latestDateStr = all.reduce((max, t) => (t.date > max ? t.date : max), all[0].date);
  const [y, m] = latestDateStr.split("-").map(Number);
  currentMonth = new Date(y, m - 1, 1);
}

// ---------- 儲存 ----------

function loadTransactions() {
  try { return JSON.parse(localStorage.getItem(TX_STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveTransactions(list) {
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(list));
}

/** 合併新交易，用 id 去重（同一筆重複上傳不會變兩筆） */
function mergeTransactions(existing, incoming) {
  const map = new Map(existing.map(t => [t.id, t]));
  incoming.forEach(t => map.set(t.id, t));
  return Array.from(map.values());
}

function formatMoney(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// ---------- 分頁切換 ----------

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab === "all") renderAllTab();
    if (btn.dataset.tab === "monthly") renderMonthlyTab();
    if (btn.dataset.tab === "transport") renderTransportTab();
  });
});

// ---------- 上傳 ----------

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

["dragover", "dragenter"].forEach(evt =>
  dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add("dragover"); })
);
["dragleave", "drop"].forEach(evt =>
  dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove("dragover"); })
);
dropZone.addEventListener("drop", (e) => {
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
  fileInput.value = "";
});

function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith(".csv"));
  if (files.length === 0) return;

  const resultEl = document.getElementById("uploadResult");
  resultEl.innerHTML = "<p class='upload-progress'>解析中...</p>";

  const readers = files.map(file => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, text: reader.result });
    reader.readAsText(file);
  }));

  Promise.all(readers).then((fileContents) => {
    let allNew = [];
    let allErrors = [];
    let summaryByBank = {};

    fileContents.forEach(({ name, text }) => {
      const { bank, transactions, errors } = parseBankCSV(text, name);
      transactions.forEach(t => { t.category = categorize(t); });
      allNew = allNew.concat(transactions);
      allErrors = allErrors.concat(errors);
      if (bank) summaryByBank[name] = { bank, count: transactions.length };
    });

    const existing = loadTransactions();
    const before = existing.length;
    const merged = mergeTransactions(existing, allNew);
    saveTransactions(merged);
    const added = merged.length - before;

    let html = "<div class='upload-summary'>";
    Object.entries(summaryByBank).forEach(([name, info]) => {
      html += `<p class="upload-line">✓ ${name} — 辨識為 <b>${info.bank}</b>，解析出 ${info.count} 筆交易</p>`;
    });
    if (allErrors.length) {
      html += `<p class="upload-line error">⚠ ${allErrors.join("<br>")}</p>`;
    }
    html += `<p class="upload-line total">共新增 ${added} 筆新交易（重複的已自動略過）</p>`;
    html += "</div>";
    resultEl.innerHTML = html;

    refreshFilterOptions();
    jumpToLatestDataMonth();
    renderMonthlyTab();
    renderAllTab();
    renderTransportTab();
  });
}

document.getElementById("clearAllBtn").addEventListener("click", () => {
  if (confirm("確定要清除所有已匯入的交易資料嗎？此動作無法復原。")) {
    localStorage.removeItem(TX_STORAGE_KEY);
    document.getElementById("uploadResult").innerHTML = "";
    refreshFilterOptions();
    renderAllTab();
    renderMonthlyTab();
  }
});

// ---------- 分類下拉選單（共用） ----------

function buildCategorySelect(tx) {
  const select = document.createElement("select");
  select.className = "cat-select";
  CATEGORIES.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === tx.category) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    saveOverride(tx.description, select.value);
    const all = loadTransactions();
    const target = all.find(t => t.id === tx.id);
    if (target) target.category = select.value;
    // 同商家的其他交易也一起套用新分類，符合「學習」的體驗
    const key = normalizeDescription(tx.description);
    all.forEach(t => {
      if (normalizeDescription(t.description) === key) t.category = select.value;
    });
    saveTransactions(all);
    refreshFilterOptions();
    renderAllTab();
    renderMonthlyTab();
  });
  return select;
}

function renderRow(tx) {
  const tr = document.createElement("tr");

  const tdDate = document.createElement("td");
  tdDate.textContent = tx.date;
  tdDate.className = "col-date";

  const tdBank = document.createElement("td");
  tdBank.textContent = tx.bank;
  tdBank.className = "col-bank";

  const tdDesc = document.createElement("td");
  tdDesc.textContent = tx.description;
  tdDesc.className = "col-desc";
  tdDesc.title = tx.description;

  const tdCat = document.createElement("td");
  tdCat.appendChild(buildCategorySelect(tx));

  const tdAmt = document.createElement("td");
  tdAmt.textContent = formatMoney(tx.amount);
  tdAmt.className = tx.amount >= 0 ? "col-amount positive" : "col-amount negative";

  tr.append(tdDate, tdBank, tdDesc, tdCat, tdAmt);
  return tr;
}

// ---------- 全部交易分頁 ----------

function refreshFilterOptions() {
  const all = loadTransactions();
  const catSel = document.getElementById("filterCategory");
  const bankSel = document.getElementById("filterBank");

  const cats = Array.from(new Set(all.map(t => t.category))).sort();
  catSel.innerHTML = "<option value=''>全部分類</option>" +
    cats.map(c => `<option value="${c}">${c}</option>`).join("");

  const banks = Array.from(new Set(all.map(t => t.bank))).sort();
  bankSel.innerHTML = "<option value=''>全部銀行</option>" +
    banks.map(b => `<option value="${b}">${b}</option>`).join("");
}

function renderAllTab() {
  const all = loadTransactions().sort((a, b) => b.date.localeCompare(a.date));
  const search = document.getElementById("searchBox").value.trim().toLowerCase();
  const catFilter = document.getElementById("filterCategory").value;
  const bankFilter = document.getElementById("filterBank").value;
  const dirFilter = document.getElementById("filterDirection").value;

  const filtered = all.filter(t => {
    if (search && !t.description.toLowerCase().includes(search)) return false;
    if (catFilter && t.category !== catFilter) return false;
    if (bankFilter && t.bank !== bankFilter) return false;
    if (dirFilter === "in" && t.amount < 0) return false;
    if (dirFilter === "out" && t.amount >= 0) return false;
    return true;
  });

  const tbody = document.getElementById("allTableBody");
  tbody.innerHTML = "";
  filtered.forEach(tx => tbody.appendChild(renderRow(tx)));

  document.getElementById("allEmptyState").style.display =
    all.length === 0 ? "block" : "none";
}

["searchBox", "filterCategory", "filterBank", "filterDirection"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderAllTab);
  document.getElementById(id).addEventListener("change", renderAllTab);
});

// ---------- 月報表分頁 ----------

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function renderMonthlyTab() {
  const all = loadTransactions();
  const key = monthKey(currentMonth);
  const monthTx = all.filter(t => t.date.startsWith(key)).sort((a, b) => b.date.localeCompare(a.date));

  document.getElementById("monthLabel").textContent =
    `${currentMonth.getFullYear()} 年 ${currentMonth.getMonth() + 1} 月`;

  const income = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  document.getElementById("monthIncome").textContent = formatMoney(income);
  document.getElementById("monthExpense").textContent = formatMoney(expense);
  document.getElementById("monthNet").textContent = formatMoney(income + expense);

  // 分類長條圖（只看支出）：顯示金額 + 佔當月總支出的百分比，點擊可展開明細
  const byCategory = {};
  const txByCategory = {};
  monthTx.filter(t => t.amount < 0).forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
    (txByCategory[t.category] = txByCategory[t.category] || []).push(t);
  });
  const totalExpense = Object.values(byCategory).reduce((s, v) => s + v, 0) || 1;
  const maxCat = Math.max(1, ...Object.values(byCategory));
  const chartEl = document.getElementById("categoryChart");
  chartEl.innerHTML = "";
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      const pct = ((amt / totalExpense) * 100).toFixed(1);
      const isOpen = expandedMonthCategory === cat;

      const row = document.createElement("div");
      row.className = "chart-row clickable" + (isOpen ? " cell-active" : "");
      row.innerHTML = `
        <span>${cat}</span>
        <span class="chart-bar-track"><span class="chart-bar-fill" style="width:${(amt / maxCat) * 100}%"></span></span>
        <span class="chart-amount">${pct}% <span class="chart-sub">(${formatMoney(amt)})</span></span>
      `;
      row.addEventListener("click", () => {
        expandedMonthCategory = isOpen ? null : cat;
        renderMonthlyTab();
      });
      chartEl.appendChild(row);

      if (isOpen) {
        const detail = document.createElement("div");
        detail.className = "chart-detail";
        const tbl = document.createElement("table");
        tbl.className = "inline-detail-table";
        tbl.innerHTML = "<thead><tr><th>日期</th><th>銀行</th><th>說明</th><th>金額</th></tr></thead>";
        const tbody = document.createElement("tbody");
        txByCategory[cat].sort((a, b) => b.date.localeCompare(a.date)).forEach(t => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td class="col-date">${t.date}</td>
            <td class="col-bank">${t.bank}</td>
            <td class="col-desc" title="${t.description}">${t.description}</td>
            <td class="col-amount negative">${formatMoney(t.amount)}</td>
          `;
          tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        detail.appendChild(tbl);
        chartEl.appendChild(detail);
      }
    });
  if (Object.keys(byCategory).length === 0) {
    chartEl.innerHTML = "<p class='empty'>這個月沒有支出紀錄</p>";
  }

  // 大額交易（收入/支出都算，取絕對值跟門檻比較）
  const threshold = Number(document.getElementById("bigTxThreshold").value) || 0;
  const bigTx = monthTx.filter(t => Math.abs(t.amount) >= threshold);
  const bigTbody = document.getElementById("bigTxTableBody");
  bigTbody.innerHTML = "";
  bigTx
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .forEach(tx => bigTbody.appendChild(renderRow(tx)));
  document.getElementById("bigTxEmpty").style.display = bigTx.length === 0 ? "block" : "none";
  document.getElementById("bigTxTable").style.display = bigTx.length === 0 ? "none" : "table";

  const tbody = document.getElementById("monthTableBody");
  tbody.innerHTML = "";
  monthTx.forEach(tx => tbody.appendChild(renderRow(tx)));
}

document.getElementById("bigTxThreshold").addEventListener("input", renderMonthlyTab);

document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  expandedMonthCategory = null;
  renderMonthlyTab();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  expandedMonthCategory = null;
  renderMonthlyTab();
});

// ---------- 交通分析分頁 ----------

let expandedSub = null; // 頂部卡片目前展開的子分類
let expandedCell = null; // 月度表格目前展開的 {month, sub}

function renderTransportTab() {
  const transportTx = loadTransactions().filter(t => t.category === "交通" && t.amount < 0);

  const cardsEl = document.getElementById("transportCards");
  cardsEl.innerHTML = "";

  if (transportTx.length === 0) {
    document.getElementById("transportEmpty").style.display = "block";
    document.getElementById("transportMonthlyTable").style.display = "none";
    return;
  }
  document.getElementById("transportEmpty").style.display = "none";
  document.getElementById("transportMonthlyTable").style.display = "table";

  // 依子分類分組
  const bySub = {};
  TRANSPORT_SUBCATEGORIES.forEach(s => { bySub[s] = []; });
  transportTx.forEach(t => {
    const sub = getTransportSubcategory(t);
    bySub[sub].push(t);
  });

  TRANSPORT_SUBCATEGORIES.forEach(sub => {
    const list = bySub[sub];
    const total = list.reduce((s, t) => s + Math.abs(t.amount), 0);

    const card = document.createElement("div");
    card.className = "transport-card" + (expandedSub === sub ? " expanded" : "");
    card.innerHTML = `
      <div class="transport-card-head">
        <span class="transport-card-title">${sub}</span>
        <span class="transport-card-amount">${formatMoney(total)}</span>
        <span class="transport-card-count">${list.length} 筆</span>
      </div>
    `;
    card.addEventListener("click", () => {
      expandedSub = expandedSub === sub ? null : sub;
      renderTransportTab();
    });

    if (expandedSub === sub) {
      const detail = document.createElement("div");
      detail.className = "transport-card-detail";
      if (list.length === 0) {
        detail.innerHTML = "<p class='empty'>這個分類沒有交易</p>";
      } else {
        const tbl = document.createElement("table");
        tbl.innerHTML = "<thead><tr><th>日期</th><th>銀行</th><th>說明</th><th>金額</th></tr></thead>";
        const tbody = document.createElement("tbody");
        list.sort((a, b) => b.date.localeCompare(a.date)).forEach(t => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td class="col-date">${t.date}</td>
            <td class="col-bank">${t.bank}</td>
            <td class="col-desc" title="${t.description}">${t.description}</td>
            <td class="col-amount negative">${formatMoney(t.amount)}</td>
          `;
          tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        detail.appendChild(tbl);
      }
      card.appendChild(detail);
    }

    cardsEl.appendChild(card);
  });

  // 每月細項總表（每一格都可以點開看該月+該細項的交易明細）
  const months = Array.from(new Set(transportTx.map(t => t.date.slice(0, 7)))).sort().reverse();
  const monthlyBody = document.getElementById("transportMonthlyBody");
  monthlyBody.innerHTML = "";
  months.forEach(m => {
    const monthTx = transportTx.filter(t => t.date.startsWith(m));
    const sums = {};
    const txBySub = {};
    TRANSPORT_SUBCATEGORIES.forEach(s => { sums[s] = 0; txBySub[s] = []; });
    monthTx.forEach(t => {
      const sub = getTransportSubcategory(t);
      sums[sub] += Math.abs(t.amount);
      txBySub[sub].push(t);
    });
    const total = Object.values(sums).reduce((s, v) => s + v, 0);
    const [y, mm] = m.split("-");

    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="col-date">${y}/${mm}</td>`;
    TRANSPORT_SUBCATEGORIES.forEach(sub => {
      const isOpen = expandedCell && expandedCell.month === m && expandedCell.sub === sub;
      const td = document.createElement("td");
      td.className = "col-amount clickable" + (isOpen ? " cell-active" : "");
      td.textContent = formatMoney(sums[sub]);
      if (sums[sub] > 0) {
        td.addEventListener("click", () => {
          expandedCell = isOpen ? null : { month: m, sub };
          renderTransportTab();
        });
      }
      tr.appendChild(td);
    });
    const totalTd = document.createElement("td");
    totalTd.className = "col-amount";
    totalTd.style.fontWeight = "700";
    totalTd.textContent = formatMoney(total);
    tr.appendChild(totalTd);
    monthlyBody.appendChild(tr);

    if (expandedCell && expandedCell.month === m) {
      const list = txBySub[expandedCell.sub];
      const detailTr = document.createElement("tr");
      detailTr.className = "detail-row";
      const detailTd = document.createElement("td");
      detailTd.colSpan = 7;
      if (list.length === 0) {
        detailTd.innerHTML = "<p class='empty'>沒有交易</p>";
      } else {
        const tbl = document.createElement("table");
        tbl.className = "inline-detail-table";
        tbl.innerHTML = "<thead><tr><th>日期</th><th>銀行</th><th>說明</th><th>金額</th></tr></thead>";
        const tbody = document.createElement("tbody");
        list.sort((a, b) => b.date.localeCompare(a.date)).forEach(t => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td class="col-date">${t.date}</td>
            <td class="col-bank">${t.bank}</td>
            <td class="col-desc" title="${t.description}">${t.description}</td>
            <td class="col-amount negative">${formatMoney(t.amount)}</td>
          `;
          tbody.appendChild(row);
        });
        tbl.appendChild(tbody);
        detailTd.innerHTML = `<div class="detail-caption">${y}/${mm} — ${expandedCell.sub}</div>`;
        detailTd.appendChild(tbl);
      }
      detailTr.appendChild(detailTd);
      monthlyBody.appendChild(detailTr);
    }
  });
}

// ---------- 初始化 ----------

refreshFilterOptions();
jumpToLatestDataMonth();
renderAllTab();
renderMonthlyTab();
renderTransportTab();
