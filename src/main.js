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
      unknown: "Неизвестная ошибка"
    },
    status: {
      loading: "Загрузка..."
    }
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
      unknown: "Unknown error"
    },
    status: {
      loading: "Loading..."
    }
  }
};

let currentLang = 'ru';
let feeds = [];
let posts = [];
let updateTimeout = null;

const app = () => {
  // Получаем элементы
  const elements = {
    appTitle: document.getElementById('app-title'),
    formLabel: document.getElementById('form-label'),
    urlInput: document.getElementById('url-input'),
    formHelp: document.getElementById('form-help'),
    submitBtn: document.getElementById('submit-btn'),
    urlFeedback: document.getElementById('url-feedback'),
    rssForm: document.getElementById('rss-form'),
    languageSwitcher: document.getElementById('language-switcher'),
    feedsContainer: null,
    postsContainer: null
  };
  
  // Функция обновления всех RSS потоков
  const updateAllFeeds = async () => {
    if (feeds.length === 0) {
      // Если нет фидов, просто планируем следующее обновление
      scheduleNextUpdate();
      return;
    }
    
    console.log('Checking for RSS updates...');
    
    let hasNewPosts = false;
    
    // Проверяем каждый фид
    for (const feed of feeds) {
      try {
        // Получаем обновленное содержимое RSS
        const rssContent = await checkForUpdates(feed.url);
        if (!rssContent) continue;
        
        // Парсим RSS
        const parsedData = parseRSS(rssContent);
        
        // Находим новые посты
        const newPosts = getNewPosts(parsedData, posts);
        
        if (newPosts.length > 0) {
          console.log(`Found ${newPosts.length} new posts in ${feed.title}`);
          
          // Добавляем feedId к новым постам
          const postsWithFeedId = newPosts.map(post => ({
            ...post,
            feedId: feed.id
          }));
          
          // Добавляем новые посты в начало списка
          posts.unshift(...postsWithFeedId);
          hasNewPosts = true;
        }
      } catch (error) {
        console.warn(`Error updating feed ${feed.url}:`, error.message);
        // Продолжаем проверять другие фиды даже если один с ошибкой
      }
    }
    
    // Если нашли новые посты, обновляем интерфейс
    if (hasNewPosts) {
      // Сортируем посты (новые сверху)
      posts.sort((a, b) => b.id.localeCompare(a.id));
      renderPosts();
      
      // Показываем уведомление о новых постах (опционально)
      showUpdateNotification();
    }
    
    // Планируем следующее обновление
    scheduleNextUpdate();
  };
  
  // Функция планирования следующего обновления
  const scheduleNextUpdate = () => {
    // Очищаем предыдущий таймаут
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    // Планируем следующее обновление через 5 секунд
    updateTimeout = setTimeout(() => {
      updateAllFeeds();
    }, 5000);
  };
  
  // Показать уведомление о новых постах
  const showUpdateNotification = () => {
    const t = translations[currentLang];
    const notification = document.createElement('div');
    notification.className = 'alert alert-info alert-dismissible fade show mt-3';
    notification.innerHTML = `
      <span>${currentLang === 'ru' ? 'Обновлены RSS ленты' : 'RSS feeds updated'}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Вставляем уведомление после формы
    const form = document.getElementById('rss-form');
    if (form && form.parentNode) {
      form.parentNode.insertBefore(notification, form.nextSibling);
      
      // Автоматически скрываем через 3 секунды
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 3000);
    }
  };
  
  // Остальной код (updateUI, renderFeeds, renderPosts и т.д.)
  // ... [остальной код остается без изменений] ...
  
  // Функция обновления интерфейса
  const updateUI = () => {
    const t = translations[currentLang];
    
    // Обновляем статические тексты
    if (elements.appTitle) elements.appTitle.textContent = t.appTitle;
    if (elements.formLabel) elements.formLabel.textContent = t.formLabel;
    if (elements.urlInput) {
      elements.urlInput.placeholder = t.formPlaceholder;
      elements.urlInput.title = currentLang === 'ru' 
        ? 'Пожалуйста, заполните это поле' 
        : 'Please fill out this field';
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
    let feedsTitleEl = document.getElementById('feeds-title');
    const feedsSection = document.getElementById('feeds-section');
    
    if (feedsSection) {
      if (!feedsTitleEl) {
        feedsTitleEl = document.createElement('h3');
        feedsTitleEl.className = 'h5';
        feedsTitleEl.id = 'feeds-title';
        feedsSection.prepend(feedsTitleEl);
      }
      feedsTitleEl.textContent = t.feedsTitle;
    }
    
    // Обновляем или создаем заголовок постов
    let postsTitleEl = document.getElementById('posts-title');
    const postsSection = document.getElementById('posts-section');
    
    if (postsSection) {
      if (!postsTitleEl) {
        postsTitleEl = document.createElement('h3');
        postsTitleEl.className = 'h5';
        postsTitleEl.id = 'posts-title';
        postsSection.prepend(postsTitleEl);
      }
      postsTitleEl.textContent = t.postsTitle;
    }
  };
  
  // Функция обновления контейнеров
  const createContainers = () => {
    const feedsSection = document.getElementById('feeds-section');
    const postsSection = document.getElementById('posts-section');
    
    if (feedsSection && !elements.feedsContainer) {
      let container = document.getElementById('feeds-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'feeds-container';
        container.className = 'mt-3';
        feedsSection.appendChild(container);
      }
      elements.feedsContainer = container;
    }
    
    if (postsSection && !elements.postsContainer) {
      let container = document.getElementById('posts-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'posts-container';
        container.className = 'mt-3';
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
    
    const list = document.createElement('div');
    list.className = 'list-group';
    
    feeds.forEach(feed => {
      const item = document.createElement('div');
      item.className = 'list-group-item';
      item.innerHTML = `
        <h5 class="mb-1">${feed.title}</h5>
        <p class="mb-1 text-muted small">${feed.description}</p>
        <small class="text-muted">${feed.url}</small>
      `;
      list.appendChild(item);
    });
    
    container.innerHTML = '';
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
    
    const list = document.createElement('div');
    list.className = 'list-group';
    
    posts.forEach(post => {
      const item = document.createElement('a');
      item.href = post.link;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
      item.className = 'list-group-item list-group-item-action';
      item.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h6 class="mb-1">${post.title}</h6>
          <small class="text-muted">${feeds.find(f => f.id === post.feedId)?.title || ''}</small>
        </div>
        <p class="mb-1 small text-muted">${post.description.substring(0, 100)}${post.description.length > 100 ? '...' : ''}</p>
      `;
      list.appendChild(item);
    });
    
    container.innerHTML = '';
    container.appendChild(list);
  };
  
  // Обработчик переключения языка
  if (elements.languageSwitcher) {
    elements.languageSwitcher.addEventListener('change', (e) => {
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
    elements.rssForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const url = elements.urlInput.value.trim();
      const t = translations[currentLang];
      
      // Сбрасываем предыдущие состояния
      elements.urlInput.classList.remove('is-invalid', 'is-valid');
      elements.urlFeedback.classList.remove('text-danger', 'text-success', 'text-info');
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
      if (feeds.some(feed => feed.url === url)) {
        showError(t.feedback.duplicate);
        resetButton();
        return;
      }
      
      try {
        // Показываем статус загрузки
        elements.urlFeedback.classList.add('text-info');
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
        elements.urlInput.value = '';
        elements.urlInput.focus();
        
        // Обновляем интерфейс
        updateUI();
        
      } catch (error) {
        // Определяем тип ошибки
        let errorKey = 'unknown';
        if (error.message === 'networkError' || error.message === 'timeoutError' || error.message === 'notFound') {
          errorKey = 'network';
        } else if (error.message === 'parseError' || error.message === 'noChannel') {
          errorKey = 'parse';
        } else if (error.message === 'invalidResponse') {
          errorKey = 'invalid';
        }
        
        showError(t.feedback[errorKey]);
        
      } finally {
        resetButton();
      }
    });
  }
  
  // Функции показа сообщений
  function showError(message) {
    elements.urlInput.classList.add('is-invalid');
    elements.urlFeedback.classList.add('text-danger');
    elements.urlFeedback.textContent = message;
  }
  
  function showSuccess(message) {
    elements.urlInput.classList.add('is-valid');
    elements.urlFeedback.classList.add('text-success');
    elements.urlFeedback.textContent = message;
    
    setTimeout(() => {
      elements.urlInput.classList.remove('is-valid');
      elements.urlFeedback.classList.remove('text-success');
      elements.urlFeedback.textContent = '';
    }, 3000);
  }
  
  function resetButton() {
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = translations[currentLang].formSubmit;
  }
  
  // Сброс ошибки при вводе
  if (elements.urlInput) {
    elements.urlInput.addEventListener('input', () => {
      if (elements.urlInput.classList.contains('is-invalid')) {
        elements.urlInput.classList.remove('is-invalid');
        elements.urlFeedback.classList.remove('text-danger');
        elements.urlFeedback.textContent = '';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', app);