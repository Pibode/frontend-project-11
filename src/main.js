import "./style.css";
import { fetchRSS, checkForUpdates } from "./lib/rssService.js";
import parseRSS, { getNewPosts } from "./lib/parser/rssParser.js";

// Простые переводы
const translations = {
  ru: {
    appTitle: "RSS агрегатор",
    formLabel: "RSS ссылка",
    formPlaceholder: "https://example.com/rss",
    formHelp: "Введите URL RSS-ленты",
    formSubmit: "Добавить",
    feedsTitle: "Фиды",
    postsTitle: "Посты",
    feedsEmpty: "Пока нет фидов",
    postsEmpty: "Пока нет постов",
    feedback: {
      success: "RSS успешно загружен",
      required: "Не должно быть пустым",
      url: "Ссылка должна быть валидным URL",
      duplicate: "RSS уже существует",
      network: "Ошибка сети. Проверьте подключение",
      parse: "Ошибка парсинга RSS",
      invalid: "Неверный RSS формат",
      unknown: "Неизвестная ошибка",
    },
    status: {
      loading: "Загрузка...",
    },
  },
  en: {
    appTitle: "RSS Aggregator",
    formLabel: "RSS link",
    formPlaceholder: "https://example.com/rss",
    formHelp: "Enter RSS feed URL",
    formSubmit: "Add",
    feedsTitle: "Feeds",
    postsTitle: "Posts",
    feedsEmpty: "No feeds yet",
    postsEmpty: "No posts yet",
    feedback: {
      success: "RSS successfully loaded",
      required: "Should not be empty",
      url: "Link must be a valid URL",
      duplicate: "RSS already exists",
      network: "Network error. Check your connection",
      parse: "RSS parsing error",
      invalid: "Invalid RSS format",
      unknown: "Unknown error",
    },
    status: {
      loading: "Loading...",
    },
  },
};

let currentLang = "ru";
let feeds = [];
let posts = [];
let updateTimeout = null;

const app = () => {
  // Получаем элементы
  const elements = {
    appTitle: document.getElementById("app-title"),
    formLabel: document.getElementById("form-label"),
    urlInput: document.getElementById("url-input"),
    formHelp: document.getElementById("form-help"),
    submitBtn: document.getElementById("submit-btn"),
    urlFeedback: document.getElementById("url-feedback"),
    rssForm: document.getElementById("rss-form"),
    languageSwitcher: document.getElementById("language-switcher"),
    feedsContainer: null,
    postsContainer: null,
  };

  // Функция обновления всех RSS потоков
  const updateAllFeeds = async () => {
    // Логи убраны - они мешают тестам

    if (feeds.length === 0) {
      scheduleNextUpdate();
      return;
    }

    let hasNewPosts = false;

    // Проверяем каждый фид
    for (const feed of feeds) {
      try {
        const rssContent = await checkForUpdates(feed.url);
        if (!rssContent) continue;

        const parsedData = parseRSS(rssContent);
        const newPosts = getNewPosts(parsedData, posts);

        if (newPosts.length > 0) {
          // Логи убраны - они мешают тестам

          const postsWithFeedId = newPosts.map((post) => ({
            ...post,
            feedId: feed.id,
          }));

          posts.unshift(...postsWithFeedId);
          hasNewPosts = true;
        }
      } catch (error) {
        // Логи убраны - они мешают тестам
      }
    }

    if (hasNewPosts) {
      posts.sort((a, b) => b.id.localeCompare(a.id));
      renderPosts();
    }

    scheduleNextUpdate();
  };

  // Функция планирования следующего обновления
  const scheduleNextUpdate = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
      updateAllFeeds();
    }, 5000);
  };

  // Функция обновления интерфейса
  const updateUI = () => {
    const t = translations[currentLang];

    if (elements.appTitle) elements.appTitle.textContent = t.appTitle;
    if (elements.formLabel) elements.formLabel.textContent = t.formLabel;
    if (elements.urlInput) {
      elements.urlInput.placeholder = t.formPlaceholder;
      elements.urlInput.title =
        currentLang === "ru"
          ? "Пожалуйста, заполните это поле"
          : "Please fill out this field";
    }
    if (elements.formHelp) elements.formHelp.textContent = t.formHelp;
    if (elements.submitBtn) elements.submitBtn.textContent = t.formSubmit;

    updateSectionTitles();
    renderFeeds();
    renderPosts();
  };

  // Функция обновления заголовков разделов
  const updateSectionTitles = () => {
    const t = translations[currentLang];

    let feedsTitleEl = document.getElementById("feeds-title");
    const feedsSection = document.getElementById("feeds-section");

    if (feedsSection) {
      if (!feedsTitleEl) {
        feedsTitleEl = document.createElement("h3");
        feedsTitleEl.className = "h5";
        feedsTitleEl.id = "feeds-title";
        feedsSection.prepend(feedsTitleEl);
      }
      feedsTitleEl.textContent = t.feedsTitle;
    }

    let postsTitleEl = document.getElementById("posts-title");
    const postsSection = document.getElementById("posts-section");

    if (postsSection) {
      if (!postsTitleEl) {
        postsTitleEl = document.createElement("h3");
        postsTitleEl.className = "h5";
        postsTitleEl.id = "posts-title";
        postsSection.prepend(postsTitleEl);
      }
      postsTitleEl.textContent = t.postsTitle;
    }
  };

  // Функция обновления контейнеров
  const createContainers = () => {
    const feedsSection = document.getElementById("feeds-section");
    const postsSection = document.getElementById("posts-section");

    if (feedsSection && !elements.feedsContainer) {
      let container = document.getElementById("feeds-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "feeds-container";
        container.className = "mt-3";
        feedsSection.appendChild(container);
      }
      elements.feedsContainer = container;
    }

    if (postsSection && !elements.postsContainer) {
      let container = document.getElementById("posts-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "posts-container";
        container.className = "mt-3";
        postsSection.appendChild(container);
      }
      elements.postsContainer = container;
    }
  };

  // Рендер фидов
  const renderFeeds = () => {
    createContainers();
    const container = elements.feedsContainer;
    if (!container) return;

    const t = translations[currentLang];

    if (feeds.length === 0) {
      container.innerHTML = `<p class="text-muted">${t.feedsEmpty}</p>`;
      return;
    }

    const list = document.createElement("div");
    list.className = "list-group";

    feeds.forEach((feed) => {
      const item = document.createElement("div");
      item.className = "list-group-item";
      item.innerHTML = `
        <h5 class="mb-1">${feed.title}</h5>
        <p class="mb-1 text-muted small">${feed.description}</p>
        <small class="text-muted">${feed.url}</small>
      `;
      list.appendChild(item);
    });

    container.innerHTML = "";
    container.appendChild(list);
  };

  // Рендер постов
  const renderPosts = () => {
    createContainers();
    const container = elements.postsContainer;
    if (!container) return;

    const t = translations[currentLang];

    if (posts.length === 0) {
      container.innerHTML = `<p class="text-muted">${t.postsEmpty}</p>`;
      return;
    }

    const list = document.createElement("div");
    list.className = "list-group";

    posts.forEach((post) => {
      const item = document.createElement("a");
      item.href = post.link;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
      item.className = "list-group-item list-group-item-action";
      item.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h6 class="mb-1">${post.title}</h6>
          <small class="text-muted">${feeds.find((f) => f.id === post.feedId)?.title || ""}</small>
        </div>
        <p class="mb-1 small text-muted">${post.description.substring(0, 100)}${post.description.length > 100 ? "..." : ""}</p>
      `;
      list.appendChild(item);
    });

    container.innerHTML = "";
    container.appendChild(list);
  };

  // Обработчик переключения языка
  if (elements.languageSwitcher) {
    elements.languageSwitcher.addEventListener("change", (e) => {
      currentLang = e.target.value;
      updateUI();
    });
  }

  // Инициализация UI
  updateUI();

  // Запускаем автообновление
  scheduleNextUpdate();

  // Обработчик формы
  if (elements.rssForm) {
    elements.rssForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const url = elements.urlInput.value.trim();
      const t = translations[currentLang];

      elements.urlInput.classList.remove("is-invalid", "is-valid");
      elements.urlFeedback.classList.remove(
        "text-danger",
        "text-success",
        "text-info",
      );
      elements.submitBtn.disabled = true;
      elements.submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${t.status.loading}
      `;

      if (!url) {
        showError(t.feedback.required);
        resetButton();
        return;
      }

      try {
        new URL(url);
      } catch {
        showError(t.feedback.url);
        resetButton();
        return;
      }

      if (feeds.some((feed) => feed.url === url)) {
        showError(t.feedback.duplicate);
        resetButton();
        return;
      }

      try {
        elements.urlFeedback.classList.add("text-info");
        elements.urlFeedback.textContent = t.status.loading;

        const rssContent = await fetchRSS(url);
        const parsedData = parseRSS(rssContent);

        const feedWithUrl = {
          ...parsedData.feed,
          url,
        };

        feeds.push(feedWithUrl);
        posts.push(...parsedData.posts);
        posts.sort((a, b) => b.id.localeCompare(a.id));

        showSuccess(t.feedback.success);
        elements.urlInput.value = "";
        elements.urlInput.focus();

        updateUI();
      } catch (error) {
        let errorKey = "unknown";
        if (
          error.message === "networkError" ||
          error.message === "timeoutError" ||
          error.message === "notFound"
        ) {
          errorKey = "network";
        } else if (
          error.message === "parseError" ||
          error.message === "noChannel"
        ) {
          errorKey = "parse";
        } else if (error.message === "invalidResponse") {
          errorKey = "invalid";
        }

        showError(t.feedback[errorKey]);
      } finally {
        resetButton();
      }
    });
  }

  function showError(message) {
    elements.urlInput.classList.add("is-invalid");
    elements.urlFeedback.classList.add("text-danger");
    elements.urlFeedback.textContent = message;
  }

  function showSuccess(message) {
    elements.urlInput.classList.add("is-valid");
    elements.urlFeedback.classList.add("text-success");
    elements.urlFeedback.textContent = message;

    setTimeout(() => {
      elements.urlInput.classList.remove("is-valid");
      elements.urlFeedback.classList.remove("text-success");
      elements.urlFeedback.textContent = "";
    }, 3000);
  }

  function resetButton() {
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = translations[currentLang].formSubmit;
  }

  if (elements.urlInput) {
    elements.urlInput.addEventListener("input", () => {
      if (elements.urlInput.classList.contains("is-invalid")) {
        elements.urlInput.classList.remove("is-invalid");
        elements.urlFeedback.classList.remove("text-danger");
        elements.urlFeedback.textContent = "";
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", app);
