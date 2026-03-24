const amountInput = document.getElementById("amount");
const fromCurrencySelect = document.getElementById("from-currency");
const toCurrencySelect = document.getElementById("to-currency");
const convertButton = document.getElementById("convert-button");
const swapButton = document.getElementById("swap-button");
const themeToggleButton = document.getElementById("theme-toggle");

const feedbackBox = document.getElementById("feedback");
const resultBox = document.getElementById("result-box");
const finalResultText = document.getElementById("final-result");
const rateDetailsText = document.getElementById("rate-details");
const lastUpdateText = document.getElementById("last-update");

const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history");

const HISTORY_KEY = "currency_converter_history";
const THEME_KEY = "currency_converter_theme";

let autoRefreshInterval = null;
let lastSuccessfulConversion = null;

function showMessage(message) {
  feedbackBox.textContent = message;
  feedbackBox.classList.remove("hidden");
}

function hideMessage() {
  feedbackBox.classList.add("hidden");
  feedbackBox.textContent = "";
}

function showLoadingState() {
  convertButton.disabled = true;
  convertButton.textContent = "Updating rates...";
}

function hideLoadingState() {
  convertButton.disabled = false;
  convertButton.textContent = "Convert now";
}

function formatMoney(value, currencyCode) {
  if (currencyCode === "BTC") {
    return `₿ ${Number(value).toFixed(8)}`;
  }

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: currencyCode
  });
}

function formatRate(rate, currencyCode) {
  if (currencyCode === "BTC") {
    return Number(rate).toFixed(8);
  }

  return Number(rate).toLocaleString("en-US", {
    maximumFractionDigits: 6
  });
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getHistory() {
  const savedHistory = localStorage.getItem(HISTORY_KEY);
  return savedHistory ? JSON.parse(savedHistory) : [];
}

function saveHistory(historyItems) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems));
}

function addConversionToHistory(item) {
  const currentHistory = getHistory();

  const isSameAsLast =
    currentHistory.length > 0 &&
    currentHistory[0].amount === item.amount &&
    currentHistory[0].from === item.from &&
    currentHistory[0].to === item.to &&
    currentHistory[0].result === item.result;

  if (isSameAsLast) {
    return;
  }

  const updatedHistory = [item, ...currentHistory].slice(0, 8);
  saveHistory(updatedHistory);
  renderHistory();
}

function renderHistory() {
  const history = getHistory();

  if (history.length === 0) {
    historyList.innerHTML = `<li class="empty-history">No conversions yet.</li>`;
    return;
  }

  historyList.innerHTML = history
    .map((item) => {
      return `
        <li>
          <div class="history-top">
            <span>${item.amount} ${item.from} → ${item.to}</span>
            <span>${item.result}</span>
          </div>
          <div class="history-bottom">
            Rate: 1 ${item.from} = ${item.rate} ${item.to} • ${item.time}
          </div>
        </li>
      `;
    })
    .join("");
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggleButton.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeToggleButton.textContent = "🌙";
  }
}

function toggleTheme() {
  const darkModeIsActive = document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, darkModeIsActive ? "dark" : "light");
  themeToggleButton.textContent = darkModeIsActive ? "☀️" : "🌙";
}

function swapCurrencies() {
  const currentFrom = fromCurrencySelect.value;
  fromCurrencySelect.value = toCurrencySelect.value;
  toCurrencySelect.value = currentFrom;
}

function validateForm() {
  const amount = Number(amountInput.value);
  const from = fromCurrencySelect.value;
  const to = toCurrencySelect.value;

  if (!amount || amount <= 0) {
    showMessage("Please enter a valid amount greater than zero.");
    return false;
  }

  if (from === to) {
    showMessage("Choose two different currencies to make the conversion.");
    return false;
  }

  hideMessage();
  return true;
}

async function requestPair(base, quote) {
  const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${base}-${quote}`);

  if (!response.ok) {
    throw new Error("Could not load exchange rate for this currency pair.");
  }

  const data = await response.json();
  const pairKey = `${base}${quote}`;

  if (!data[pairKey] || !data[pairKey].bid) {
    throw new Error("Exchange rate is unavailable at the moment.");
  }

  return Number(data[pairKey].bid);
}

async function fetchExchangeRate(from, to) {
  try {
    return await requestPair(from, to);
  } catch (directError) {
    const tryingToConvertIntoBTC = to === "BTC";
    const tryingToConvertFromBTC = from === "BTC";

    if (tryingToConvertIntoBTC) {
      try {
        const reverseRate = await requestPair("BTC", from);
        return 1 / reverseRate;
      } catch (reverseError) {
        throw new Error(`Conversion from ${from} to ${to} is unavailable right now.`);
      }
    }

    if (tryingToConvertFromBTC) {
      try {
        const reverseRate = await requestPair(to, "BTC");
        return 1 / reverseRate;
      } catch (reverseError) {
        throw new Error(`Conversion from ${from} to ${to} is unavailable right now.`);
      }
    }

    throw directError;
  }
}

async function convertCurrency(options = {}) {
  const { silent = false, saveToHistory = true } = options;

  if (!validateForm()) {
    return;
  }

  const amount = Number(amountInput.value);
  const from = fromCurrencySelect.value;
  const to = toCurrencySelect.value;

  if (!silent) {
    showLoadingState();
  }

  try {
    const rate = await fetchExchangeRate(from, to);
    const convertedValue = amount * rate;

    const formattedResult = formatMoney(convertedValue, to);
    const formattedRate = formatRate(rate, to);
    const formattedTime = formatTimestamp();

    finalResultText.textContent = formattedResult;
    rateDetailsText.textContent = `Current rate: 1 ${from} = ${formattedRate} ${to}`;
    lastUpdateText.textContent = `Last update: ${formattedTime}`;
    resultBox.classList.remove("hidden");

    lastSuccessfulConversion = { amount, from, to };
    hideMessage();

    if (saveToHistory) {
      addConversionToHistory({
        amount,
        from,
        to,
        result: formattedResult,
        rate: formattedRate,
        time: formattedTime
      });
    }
  } catch (error) {
    showMessage(error.message || "Something went wrong while fetching exchange rates.");
  } finally {
    if (!silent) {
      hideLoadingState();
    }
  }
}

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  autoRefreshInterval = setInterval(() => {
    if (!lastSuccessfulConversion) {
      return;
    }

    const { amount, from, to } = lastSuccessfulConversion;
    amountInput.value = amount;
    fromCurrencySelect.value = from;
    toCurrencySelect.value = to;

    convertCurrency({
      silent: true,
      saveToHistory: false
    });
  }, 60000);
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

convertButton.addEventListener("click", () => {
  convertCurrency();
});

swapButton.addEventListener("click", () => {
  swapCurrencies();
});

themeToggleButton.addEventListener("click", toggleTheme);

clearHistoryButton.addEventListener("click", clearHistory);

amountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    convertCurrency();
  }
});

applySavedTheme();
renderHistory();
startAutoRefresh();