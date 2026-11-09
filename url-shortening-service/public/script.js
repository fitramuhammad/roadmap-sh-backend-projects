const STORAGE_KEY = "url-shortener:codes";
const CODE_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;
const COPY_FEEDBACK_MS = 1200;

const API_ERROR_MESSAGES = {
  INVALID_URL: "URL must be a valid http or https URL.",
  INVALID_CUSTOM_CODE:
    "Custom code must be 3-30 characters using letters, numbers, hyphens, or underscores.",
  SHORT_CODE_EXISTS: "This custom code is already taken.",
  RATE_LIMITED: "Too many requests, try again shortly.",
};

const form = document.getElementById("shorten-form");
const input = document.getElementById("url-input");
const customCodeInput = document.getElementById("custom-code-input");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");
const resultLink = document.getElementById("result-link");
const resultCopy = document.getElementById("result-copy");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history");
const emptyMessage = document.getElementById("empty-history");

if (
  !form ||
  !input ||
  !customCodeInput ||
  !errorBox ||
  !resultBox ||
  !resultLink ||
  !resultCopy ||
  !historySection ||
  !historyList ||
  !emptyMessage
) {
  throw new Error("Page elements are missing");
}

const codes = loadCodes();

init();

form.addEventListener("submit", (event) => {
  void handleSubmit(event);
});

resultCopy.addEventListener("click", () =>
  copyToClipboard(resultLink.href, resultCopy),
);

async function init() {
  for (const code of [...codes]) {
    let response;

    try {
      response = await fetch(urlForCode("api/shorten", code));
    } catch {
      showError(
        "Could not reach the server. Make sure the backend is running, then reload the page.",
      );
      break;
    }

    if (response.status === 404) {
      removeCode(code);
      continue;
    }

    if (response.ok) {
      const record = await response.json();
      if (record && typeof record.shortCode === "string") {
        prependHistoryElement(record);
      }
    }
  }

  updateHistoryVisibility();
}

async function handleSubmit(event) {
  event.preventDefault();
  const value = input.value.trim();

  if (!value) {
    showError("URL must not be empty.");
    return;
  }
  if (!isValidUrl(value)) {
    showError("Enter a valid URL starting with http:// or https://");
    return;
  }

  clearError();
  const submitButton = form.querySelector("button[type=submit]");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Shortening...";
  }

  try {
    const payload = { url: value };
    const customCode = customCodeInput.value.trim();
    if (customCode) {
      payload.customCode = customCode;
    }

    const response = await fetch(urlForCode("api/shorten"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      showError(describeApiError(data));
      return;
    }

    if (
      !data ||
      typeof data.shortCode !== "string" ||
      !validCode(data.shortCode)
    ) {
      showError("The server response was not recognized. Try again.");
      return;
    }

    addCode(data.shortCode);
    showResult(shortUrlFor(data.shortCode));
    prependHistoryElement(data);
    updateHistoryVisibility();

    input.value = "";
    customCodeInput.value = "";
    input.focus();
  } catch {
    showError("Could not reach the server. Make sure the backend is running.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Shorten";
    }
  }
}

async function deleteUrl(shortCode, element, button) {
  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const response = await fetch(urlForCode("api/shorten", shortCode), {
      method: "DELETE",
    });

    if (response.status === 204) {
      removeCode(shortCode);
      element.remove();
      updateHistoryVisibility();
      return;
    }

    if (response.status === 404) {
      removeCode(shortCode);
      element.remove();
      updateHistoryVisibility();
      return;
    }

    const data = await response.json().catch(() => null);
    showError(describeApiError(data));
  } catch {
    showError("Could not reach the server. Try deleting again.");
  } finally {
    button.disabled = false;
    button.textContent = "Delete";
  }
}

function urlForCode(base, code) {
  if (code === undefined) {
    return `/${base}`;
  }
  return `/${base}/${encodeURIComponent(code)}`;
}

function shortUrlFor(code) {
  return `${window.location.origin}/${encodeURIComponent(code)}`;
}

function validCode(code) {
  return CODE_PATTERN.test(code);
}

function loadCodes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (code) => typeof code === "string" && CODE_PATTERN.test(code),
    );
  } catch {
    return [];
  }
}

function saveCodes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // localStorage full or blocked: ignore
  }
}

function addCode(code) {
  if (!codes.includes(code)) {
    codes.unshift(code);
    saveCodes();
  }
}

function removeCode(code) {
  const index = codes.indexOf(code);
  if (index !== -1) {
    codes.splice(index, 1);
    saveCodes();
  }
}

function prependHistoryElement(record) {
  if (!validCode(record.shortCode)) {
    return null;
  }

  const shortUrl = shortUrlFor(record.shortCode);

  const li = document.createElement("li");
  li.className = "history-item";

  const texts = document.createElement("div");
  texts.className = "history-texts";

  const short = document.createElement("a");
  short.className = "short";
  short.href = shortUrl;
  short.target = "_blank";
  short.rel = "noopener";
  short.textContent = shortUrl;

  const original = document.createElement("span");
  original.className = "original";
  original.textContent = typeof record.url === "string" ? record.url : "";
  original.title = original.textContent;

  texts.append(short, original);

  const actions = document.createElement("div");
  actions.className = "history-actions";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "ghost";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", () =>
    copyToClipboard(shortUrl, copyButton),
  );

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "ghost danger";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => {
    void deleteUrl(record.shortCode, li, deleteButton);
  });

  actions.append(copyButton, deleteButton);
  li.append(texts, actions);
  historyList.prepend(li);
  return li;
}

function updateHistoryVisibility() {
  const empty = historyList.children.length === 0;
  historySection.hidden = empty;
  emptyMessage.hidden = !empty;
}

function showResult(shortUrl) {
  resultLink.textContent = shortUrl;
  resultLink.href = shortUrl;
  resultBox.hidden = false;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function describeApiError(data) {
  const code = data?.error?.code;
  if (typeof code === "string" && API_ERROR_MESSAGES[code]) {
    return API_ERROR_MESSAGES[code];
  }
  if (typeof data?.error?.message === "string" && data.error.message) {
    return data.error.message;
  }
  return "Something went wrong. Try again.";
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function copyToClipboard(text, button) {
  let copied = false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }
  }

  if (!copied) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
  }

  if (copied && button) {
    const original = button.textContent;
    button.textContent = "Copied";
    button.disabled = true;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, COPY_FEEDBACK_MS);
  }
}
