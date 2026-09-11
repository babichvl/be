// URL твоего бэкенда на Replit. Без слеша в конце.
const API_URL = "https://800e0b0b-6d96-4276-a72c-b340b4999393-00-ix1byurrxpf0.sisko.replit.dev";

const tg = window.Telegram?.WebApp;

const $status     = document.getElementById("status");
const $inTg       = document.getElementById("in-tg");
const $initLength = document.getElementById("init-length");
const $initRaw    = document.getElementById("init-raw");
const $result     = document.getElementById("result");
const $resultJson = document.getElementById("result-json");

function setStatus(text, kind = "info") {
  $status.textContent = text;
  $status.className = "status " + kind;
}

async function main() {
  if (!tg) {
    setStatus("Открой это окно через Telegram-бота, а не в браузере.", "error");
    return;
  }

  tg.ready();
  tg.expand();

  const initData = tg.initData;

  $inTg.textContent = "да";
  $initLength.textContent = String(initData.length);
  $initRaw.value = initData;

  if (!initData) {
    setStatus(
      "initData пуст. Открой Mini App через кнопку в боте, а не в браузере.",
      "error"
    );
    return;
  }

  setStatus("Проверяем подпись и логинимся...", "info");

  try {
    const resp = await fetch(API_URL + "/api/auth", {
      method: "POST",
      headers: {
        "X-Init-Data": initData,
      },
    });

    const data = await resp.json();

    if (!resp.ok) {
      setStatus("Бэкенд вернул ошибку: " + (data.detail || resp.status), "error");
      $resultJson.textContent = JSON.stringify(data, null, 2);
      $result.hidden = false;
      return;
    }

    setStatus("Авторизован как " + (data.user?.first_name || "?"), "ok");
    $resultJson.textContent = JSON.stringify(data, null, 2);
    $result.hidden = false;
  } catch (e) {
    setStatus("Ошибка сети: " + e.message, "error");
  }
}

main();
