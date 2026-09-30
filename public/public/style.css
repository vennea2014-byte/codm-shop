const $ = (selector) => document.querySelector(selector);

let accounts = [];

/* -------------------------
   API Helper
------------------------- */

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "خطایی رخ داد");
  }

  return data;
}

/* -------------------------
   Escape HTML
------------------------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------------
   Load Settings
------------------------- */

async function loadSettings() {
  try {
    const settings = await api("/api/settings");

    const siteName = $("#siteName");
    const siteTitle = $("#siteTitle");

    if (siteName) {
      siteName.textContent = settings.site_name || "CODM SHOP";
    }

    if (siteTitle) {
      siteTitle.textContent = settings.site_name || "CODM SHOP";
    }

    if (settings.background) {
      document.body.style.backgroundImage =
        `url("${settings.background}")`;

      document.body.classList.add("custom-background");
    }
  } catch (error) {
    console.error(error);
  }
}

/* -------------------------
   Load Accounts
------------------------- */

async function loadAccounts() {
  const container =
    $("#accountsList") ||
    $("#accounts");

  if (!container) return;

  try {
    accounts = await api("/api/accounts");

    renderAccounts(container);
  } catch (error) {
    container.innerHTML = `
      <div class="error-box">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

/* -------------------------
   Render Accounts
------------------------- */

function renderAccounts(container) {
  if (accounts.length === 0) {
    container.innerHTML = `
      <div class="empty-box">
        هنوز هیچ اکانتی برای فروش قرار نگرفته است.
      </div>
    `;

    return;
  }

  container.innerHTML = accounts
    .map((account) => {
      const sold = account.status === "sold";

      return `
        <div class="account-card">

          ${
            account.image
              ? `
                <div class="account-image">
                  <img
                    src="${escapeHtml(account.image)}"
                    alt="${escapeHtml(account.title)}"
                    loading="lazy"
                  >
                </div>
              `
              : `
                <div class="account-image no-image">
                  CODM
                </div>
              `
          }

          <div class="account-content">

            <h2>
              ${escapeHtml(account.title)}
            </h2>

            <p class="description">
              ${escapeHtml(
                account.description || "بدون توضیحات"
              )}
            </p>

            <div class="account-bottom">

              <div class="price">
                ${Number(account.price).toLocaleString("fa-IR")}
                <span>تومان</span>
              </div>

              <div class="availability ${
                sold ? "sold" : "available"
              }">
                ${sold ? "فروخته شد" : "موجود"}
              </div>

            </div>

            ${
              !sold
                ? `
                  <button
                    class="buy-button"
                    onclick="openRegister(${account.id})"
                  >
                    درخواست خرید
                  </button>
                `
                : `
                  <button
                    class="buy-button disabled"
                    disabled
                  >
                    فروخته شده
                  </button>
                `
            }

          </div>

        </div>
      `;
    })
    .join("");
}

/* -------------------------
   Registration Modal
------------------------- */

window.openRegister = function (accountId) {
  const modal = $("#registerModal");

  if (!modal) return;

  const selectedAccount = $("#selectedAccount");

  if (selectedAccount) {
    selectedAccount.value = accountId;
  }

  modal.classList.add("show");

  document.body.classList.add("modal-open");
};

window.closeRegister = function () {
  const modal = $("#registerModal");

  if (!modal) return;

  modal.classList.remove("show");

  document.body.classList.remove("modal-open");
};

/* -------------------------
   Registration Form
------------------------- */

const registerForm = $("#registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const firstName = $("#firstName").value.trim();
    const lastName = $("#lastName").value.trim();
    const phone = $("#phone").value.trim();
    const email = $("#email").value.trim();

    if (!firstName || !lastName || !phone || !email) {
      showMessage(
        "لطفاً همه اطلاعات را وارد کنید.",
        "error"
      );

      return;
    }

    const button = registerForm.querySelector(
      'button[type="submit"]'
    );

    if (button) {
      button.disabled = true;
      button.textContent = "در حال ثبت...";
    }

    try {
      await api("/api/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          email
        })
      });

      showMessage(
        "اطلاعات شما با موفقیت ثبت شد.",
        "success"
      );

      registerForm.reset();

      setTimeout(() => {
        closeRegister();
      }, 1200);

    } catch (error) {
      showMessage(
        error.message,
        "error"
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "ثبت درخواست";
      }
    }
  });
}

/* -------------------------
   Message
------------------------- */

function showMessage(message, type = "success") {
  let box = $("#messageBox");

  if (!box) {
    box = document.createElement("div");

    box.id = "messageBox";

    document.body.appendChild(box);
  }

  box.textContent = message;

  box.className = `message-box ${type}`;

  setTimeout(() => {
    box.className = "message-box";
  }, 3500);
}

/* -------------------------
   Close Modal
------------------------- */

document.addEventListener("click", (event) => {
  const modal = $("#registerModal");

  if (!modal) return;

  if (event.target === modal) {
    closeRegister();
  }
});

/* -------------------------
   Language
------------------------- */

const languageSelect = $("#languageSelect");

if (languageSelect) {
  languageSelect.addEventListener(
    "change",
    () => {
      const language =
        languageSelect.value;

      document.documentElement.lang =
        language;

      if (language === "fa") {
        document.documentElement.dir = "rtl";
      } else {
        document.documentElement.dir = "ltr";
      }

      localStorage.setItem(
        "codm-language",
        language
      );
    }
  );

  const savedLanguage =
    localStorage.getItem(
      "codm-language"
    );

  if (savedLanguage) {
    languageSelect.value =
      savedLanguage;

    document.documentElement.lang =
      savedLanguage;

    document.documentElement.dir =
      savedLanguage === "fa"
        ? "rtl"
        : "ltr";
  }
}

/* -------------------------
   Search
------------------------- */

const searchInput = $("#searchInput");

if (searchInput) {
  searchInput.addEventListener(
    "input",
    () => {
      const query =
        searchInput.value
          .trim()
          .toLowerCase();

      const filtered =
        accounts.filter((account) => {
          return (
            account.title
              .toLowerCase()
              .includes(query) ||
            (account.description || "")
              .toLowerCase()
              .includes(query)
          );
        });

      const container =
        $("#accountsList") ||
        $("#accounts");

      if (container) {
        const oldAccounts =
          accounts;

        accounts = filtered;

        renderAccounts(container);

        accounts =
          oldAccounts;
      }
    }
  );
}

/* -------------------------
   Start
------------------------- */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await loadSettings();
    await loadAccounts();
  }
);
