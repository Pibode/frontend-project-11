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
let readPostIds = new Set(); // Храним ID прочитанных постов

const app = () => {
  console.log("App starting...");

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
    console.log(
      `[${new Date().toLocaleTimeString()}] Checking for RSS updates...`,
    );

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

  // Пометить пост как прочитанный
  const markPostAsRead = (postId) => {
    console.log(`Marking post as read: ${postId}`);
    readPostIds.add(postId);
    // Перерендериваем посты чтобы обновить стили
    renderPosts();
  };

  // Показать предпросмотр поста в модальном окне
  const showPostPreview = (post) => {
    console.log(`Showing preview for post: ${post.title}`);

    const modalTitle = document.getElementById("postModalTitle");
    const modalBody = document.getElementById("postModalBody");
    const modalLink = document.getElementById("postModalLink");

    if (modalTitle && modalBody && modalLink) {
      modalTitle.textContent = post.title;
      modalBody.innerHTML = post.description || "<em>Нет описания</em>";
      modalLink.href = post.link;

      // Открываем модальное окно
      const modalElement = document.getElementById("postModal");
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        console.error("Modal element not found");
      }
    }
  };

  // Функция обновления интерфейса
  const updateUI = () => {
    const t = translations[currentLang];

    // Обновляем статические тексты
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

    // Обновляем заголовки фидов и постов
    updateSectionTitles();

    // Обновляем списки
    renderFeeds();
    renderPosts();
  };

  // Функция обновления заголовков разделов
  const updateSectionTitles = () => {
    const t = translations[currentLang];

    // Обновляем или создаем заголовок фидов
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

    // Обновляем или создаем заголовок постов
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

  // РЕНДЕР ПОСТОВ С КНОПКАМИ ПРЕДПРОСМОТРА
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

    console.log(`Rendering ${posts.length} posts`);
    console.log("Read posts:", Array.from(readPostIds));

    posts.forEach((post) => {
      // Проверяем прочитан ли пост
      const isRead = readPostIds.has(post.id);
      console.log(`Post ${post.id}: isRead = ${isRead}`);

      const item = document.createElement("div");
      item.className =
        "list-group-item d-flex justify-content-between align-items-start";
      item.style.padding = "15px";

      // Левая часть: ссылка на пост
      const postLink = document.createElement("a");
      postLink.href = post.link;
      postLink.target = "_blank";
      postLink.rel = "noopener noreferrer";
      postLink.className = `text-decoration-none flex-grow-1 me-3 ${isRead ? "fw-normal" : "fw-bold"}`;
      postLink.style.color = isRead ? "#6c757d" : "#000";
      postLink.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <span class="${isRead ? "fw-normal" : "fw-bold"}">${post.title}</span>
          <small class="text-muted">${feeds.find((f) => f.id === post.feedId)?.title || ""}</small>
        </div>
        <p class="mb-1 small text-muted">${post.description.substring(0, 100)}${post.description.length > 100 ? "..." : ""}</p>
      `;

      // Правая часть: кнопка предпросмотра
      const previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "btn btn-outline-primary btn-sm";
      previewButton.style.minWidth = "40px";
      previewButton.title = "Предпросмотр";
      previewButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
        </svg>
      `;

      // Обработчик клика на кнопку предпросмотра
      previewButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`Preview clicked for post: ${post.id}`);

        // Помечаем пост как прочитанный
        markPostAsRead(post.id);

        // Показываем модальное окно
        showPostPreview(post);
      });

      // Обработчик клика по ссылке поста (открывает в новой вкладке)
      postLink.addEventListener("click", (e) => {
        console.log(`Post link clicked: ${post.title}`);
        // Позволяем стандартное поведение - открытие в новой вкладке
        // НЕ помечаем как прочитанный при клике по ссылке
      });

      item.appendChild(postLink);
      item.appendChild(previewButton);
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

      // Сбрасываем предыдущие состояния
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

      // Валидация
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

      // Проверка на дубликаты
      if (feeds.some((feed) => feed.url === url)) {
        showError(t.feedback.duplicate);
        resetButton();
        return;
      }

      try {
        // Показываем статус загрузки
        elements.urlFeedback.classList.add("text-info");
        elements.urlFeedback.textContent = t.status.loading;

        // Скачиваем RSS
        const rssContent = await fetchRSS(url);

        // Парсим RSS
        const parsedData = parseRSS(rssContent);

        // Добавляем URL к фиду
        const feedWithUrl = {
          ...parsedData.feed,
          url,
        };

        // Добавляем фид и посты
        feeds.push(feedWithUrl);
        posts.push(...parsedData.posts);

        // Сортируем посты (новые сверху)
        posts.sort((a, b) => b.id.localeCompare(a.id));

        // Успех
        showSuccess(t.feedback.success);
        elements.urlInput.value = "";
        elements.urlInput.focus();

        // Обновляем интерфейс
        updateUI();
      } catch (error) {
        // Определяем тип ошибки
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

  // Функции показа сообщений
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

  // Сброс ошибки при вводе
  if (elements.urlInput) {
    elements.urlInput.addEventListener("input", () => {
      if (elements.urlInput.classList.contains("is-invalid")) {
        elements.urlInput.classList.remove("is-invalid");
        elements.urlFeedback.classList.remove("text-danger");
        elements.urlFeedback.textContent = "";
      }
    });
  }

  console.log("App fully initialized");
};

document.addEventListener("DOMContentLoaded", app);
