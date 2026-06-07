const storageKey = "choiae-invest.entries.v1";
const form = document.querySelector("#entryForm");
const titleInput = document.querySelector("#titleInput");
const amountInput = document.querySelector("#amountInput");
const stockInput = document.querySelector("#stockInput");
const dateInput = document.querySelector("#dateInput");
const totalAmount = document.querySelector("#totalAmount");
const todayAmount = document.querySelector("#todayAmount");
const monthAmount = document.querySelector("#monthAmount");
const dailyAverage = document.querySelector("#dailyAverage");
const entryCount = document.querySelector("#entryCount");
const entryList = document.querySelector("#entryList");
const emptyState = document.querySelector("#emptyState");
const sampleButton = document.querySelector("#sampleButton");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");

const sampleTitles = ["앨범 1장 참기", "포카 양도 참기", "굿즈 배송비 아끼기"];
let entries = loadEntries();

dateInput.value = toDateInputValue(new Date());
render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value.replace(/[^\d]/g, ""));
  if (!amount) return;

  entries.push({
    id: crypto.randomUUID(),
    title: titleInput.value.trim() || "앨범 1장 참기",
    amount,
    stockName: stockInput.value.trim() || "주식 계좌",
    date: dateInput.value || toDateInputValue(new Date())
  });

  saveEntries();
  titleInput.value = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
  amountInput.value = "";
  render();
});

amountInput.addEventListener("input", () => {
  amountInput.value = amountInput.value.replace(/[^\d]/g, "");
});

sampleButton.addEventListener("click", () => {
  const today = new Date();
  entries = [
    {
      id: crypto.randomUUID(),
      title: "앨범 1장 참기",
      amount: 24000,
      stockName: "S&P 500 ETF",
      date: toDateInputValue(today)
    },
    {
      id: crypto.randomUUID(),
      title: "응원봉 파우치 참기",
      amount: 18000,
      stockName: "삼성전자",
      date: toDateInputValue(addDays(today, -3))
    },
    {
      id: crypto.randomUUID(),
      title: "랜덤 포카 2팩 참기",
      amount: 12000,
      stockName: "나스닥 ETF",
      date: toDateInputValue(addDays(today, -10))
    }
  ];
  saveEntries();
  render();
});

exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `choiae-invest-${toDateInputValue(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!Array.isArray(imported)) throw new Error("Invalid backup");
    entries = imported
      .filter((entry) => entry.title && Number(entry.amount) >= 0 && entry.date)
      .map((entry) => ({
        id: entry.id || crypto.randomUUID(),
        title: String(entry.title),
        amount: Number(entry.amount),
        stockName: String(entry.stockName || "주식 계좌"),
        date: String(entry.date)
      }));
    saveEntries();
    render();
  } catch {
    alert("백업 파일을 읽지 못했어요.");
  } finally {
    importInput.value = "";
  }
});

function render() {
  const now = new Date();
  const total = sum(entries);
  const today = sum(entries.filter((entry) => isSameDay(parseDate(entry.date), now)));
  const month = sum(entries.filter((entry) => isSameMonth(parseDate(entry.date), now)));
  const average = Math.floor(month / Math.max(now.getDate(), 1));

  totalAmount.textContent = formatWon(total);
  todayAmount.textContent = formatWon(today);
  monthAmount.textContent = formatWon(month);
  dailyAverage.textContent = formatWon(average);
  entryCount.textContent = `${entries.length}개`;

  const sorted = [...entries].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  entryList.innerHTML = "";
  emptyState.hidden = sorted.length > 0;

  sorted.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "entry-card";
    item.innerHTML = `
      <div>
        <h3></h3>
        <p></p>
      </div>
      <strong class="entry-amount"></strong>
      <button class="delete-button" type="button" aria-label="기록 삭제">×</button>
    `;
    item.querySelector("h3").textContent = entry.title;
    item.querySelector("p").textContent = `${entry.stockName}로 옮기기 · ${formatDate(entry.date)}`;
    item.querySelector(".entry-amount").textContent = formatWon(entry.amount);
    item.querySelector(".delete-button").addEventListener("click", () => {
      entries = entries.filter((current) => current.id !== entry.id);
      saveEntries();
      render();
    });
    entryList.append(item);
  });
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function sum(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWon(amount) {
  return `${Number(amount).toLocaleString("ko-KR")}원`;
}

function formatDate(value) {
  return parseDate(value).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric"
  });
}
