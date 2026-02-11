import "./style.css";
import axios from "axios";
import { fetchRSS, checkForUpdates } from "./lib/rssService.js";
import parseRSS, { getNewPosts } from "./lib/parser/rssParser.js";

// Простые переводы
const translations = {
  ru: {
    appTitle: "RSS агрегатор",
    formLabel: "RSS ссылка",
    formPlaceholder: "https://example.com/rss",
    formHelp: "Пример: https://ru.hexlet.io/lessons.rss",
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
      network: "Ошибка сети",
      parse: "Ресурс не содержит валидный RSS",
      invalid: "Ресурс не содержит валидный RSS",
      unknown: "Неизвестная ошибка",
    },
    status: {
      loading: "Загрузка...",
    },
    viewButton: "Просмотр",
  },
  en: {
    appTitle: "RSS Aggregator",
    formLabel: "RSS link",
    formPlaceholder: "https://example.com/rss",
    formHelp: "Example: https://ru.hexlet.io/lessons.rss",
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
      network: "Network error",
      parse: "The resource does not contain valid RSS",
      invalid: "The resource does not contain valid RSS",
      unknown: "Unknown error",
    },
    status: {
      loading: "Loading...",
    },
    viewButton: "View",
  },
};

let currentLang = "ru";
let feeds = [];
let posts = [];
let updateTimeout = null;
let viewedPostIds = new Set();

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
    if (feeds.length === 0) {
      scheduleNextUpdate();
      return;
    }

    console.log("Checking for RSS updates...");
    let hasNewPosts = false;

    for (const feed of feeds) {
      try {
        const rssContent = await checkForUpdates(feed.url);
        if (!rssContent) continue;

        const parsedData = parseRSS(rssContent);
        const newPosts = getNewPosts(parsedData, posts);

        if (newPosts.length > 0) {
          console.log(`Found ${newPosts.length} new posts in ${feed.title}`);

          const postsWithFeedId = newPosts.map((post) => ({
            ...post,
            feedId: feed.id,
          }));

          posts.unshift(...postsWithFeedId);
          hasNewPosts = true;
        }
      } catch (error) {
        console.warn(`Error updating feed ${feed.url}:`, error.message);
      }
    }

    if (hasNewPosts) {
      posts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
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
      `;
      list.appendChild(item);
    });

    container.innerHTML = "";
    container.appendChild(list);
  };

  // Открытие ссылки поста
  const openPostLink = (post) => {
    viewedPostIds.add(post.id);

    const postLink = document.querySelector(`a[data-post-id="${post.id}"]`);
    if (postLink) {
      postLink.className = "fw-bold";
    }

    if (post.link && post.link !== "#") {
      window.open(post.link, "_blank", "noopener,noreferrer");
    }
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
      const isViewed = viewedPostIds.has(post.id);

      const item = document.createElement("div");
      item.className = "list-group-item";
      item.dataset.postId = post.id;
      item.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-start">
          <div class="me-3 flex-grow-1">
            <a href="${post.link}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="fw-bold"
               data-post-id="${post.id}">
              ${post.title}
            </a>
            <button type="button" class="btn btn-outline-primary btn-sm view-post-btn" data-post-id="${post.id}">
              ${t.viewButton}
            </button>
            <p class="mb-1 small text-muted mt-1">${post.description ? post.description.substring(0, 150) + (post.description.length > 150 ? "..." : "") : ""}</p>
          </div>
        </div>
      `;

      list.appendChild(item);
    });

    container.innerHTML = "";
    container.appendChild(list);

    // Добавляем обработчики кликов на кнопки просмотра
    container.querySelectorAll(".view-post-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const postId = e.currentTarget.dataset.postId;
        const post = posts.find((p) => p.id === postId);
        if (post) {
          openPostLink(post);
        }
      });
    });

    // Добавляем обработчики кликов на ссылки
    container.querySelectorAll("a[data-post-id]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const postId = e.currentTarget.dataset.postId;
        const post = posts.find((p) => p.id === postId);
        if (post) {
          openPostLink(post);
        }
      });
    });
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
      elements.urlFeedback.textContent = "";
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

        posts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        showSuccess(t.feedback.success);
        elements.urlInput.value = "";
        elements.urlInput.focus();

        updateUI();
      } catch (error) {
        console.error("Error:", error.message);

        let errorKey = "unknown";
        const errorMsg = error.message.toLowerCase();

        if (
          errorMsg.includes("network") ||
          errorMsg.includes("timeout") ||
          errorMsg.includes("notfound")
        ) {
          errorKey = "network";
        } else if (
          errorMsg.includes("parse") ||
          errorMsg.includes("nochannel")
        ) {
          errorKey = "parse";
        } else if (
          errorMsg.includes("invalid") ||
          errorMsg.includes("response")
        ) {
          errorKey = "invalid";
        } else if (
          errorMsg.includes("duplicate") ||
          errorMsg.includes("already exists")
        ) {
          errorKey = "duplicate";
        } else if (
          errorMsg.includes("required") ||
          errorMsg.includes("empty")
        ) {
          errorKey = "required";
        } else if (errorMsg.includes("url") || errorMsg.includes("valid")) {
          errorKey = "url";
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
