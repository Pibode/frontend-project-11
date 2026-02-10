import './style.css';
import axios from 'axios';

const app = () => {
  const state = {
    feeds: [],
    posts: [],
    ui: {
      form: {
        state: 'filling', // filling, sending, success, error
        error: null,
        url: '',
        valid: true,
      },
      posts: {
        viewedIds: new Set(),
      },
      language: 'ru',
    },
  };

  const elements = {
    form: document.getElementById('rss-form'),
    input: document.getElementById('url-input'),
    feedback: document.getElementById('url-feedback'),
    submit: document.getElementById('submit-btn'),
    feedsContainer: document.getElementById('feeds-container'),
    postsContainer: document.getElementById('posts-container'),
    languageSwitcher: document.getElementById('language-switcher'),
  };

  const i18n = {
    ru: {
      appTitle: 'RSS агрегатор',
      formLabel: 'RSS ссылка',
      formPlaceholder: 'https://example.com/rss',
      formHelp: 'Пример: https://ru.hexlet.io/lessons.rss',
      formSubmit: 'Добавить',
      feedsTitle: 'Фиды',
      postsTitle: 'Посты',
      feedsEmpty: 'Пока нет фидов',
      postsEmpty: 'Пока нет постов',
      feedback: {
        success: 'RSS успешно загружен',
        required: 'Не должно быть пустым',
        url: 'Ссылка должна быть валидным URL',
        duplicate: 'RSS уже существует',
        network: 'Ошибка сети',
        parse: 'Ресурс не содержит валидный RSS',
        invalid: 'Ресурс не содержит валидный RSS',
        unknown: 'Неизвестная ошибка',
      },
      status: {
        loading: 'Загрузка...',
      },
      viewButton: 'Просмотр',
    },
    en: {
      appTitle: 'RSS Aggregator',
      formLabel: 'RSS link',
      formPlaceholder: 'https://example.com/rss',
      formHelp: 'Example: https://ru.hexlet.io/lessons.rss',
      formSubmit: 'Add',
      feedsTitle: 'Feeds',
      postsTitle: 'Posts',
      feedsEmpty: 'No feeds yet',
      postsEmpty: 'No posts yet',
      feedback: {
        success: 'RSS successfully loaded',
        required: 'Should not be empty',
        url: 'Link must be a valid URL',
        duplicate: 'RSS already exists',
        network: 'Network error',
        parse: 'The resource does not contain valid RSS',
        invalid: 'The resource does not contain valid RSS',
        unknown: 'Unknown error',
      },
      status: {
        loading: 'Loading...',
      },
      viewButton: 'View',
    },
  };

  // Валидация URL
  const validateUrl = (url) => {
    if (!url.trim()) {
      return 'required';
    }
    
    try {
      new URL(url);
    } catch {
      return 'url';
    }
    
    if (state.feeds.some(feed => feed.url === url)) {
      return 'duplicate';
    }
    
    return null;
  };

  // Парсинг RSS
  const parseRSS = (content) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    
    const error = doc.querySelector('parsererror');
    if (error) {
      throw new Error('parse');
    }
    
    const channel = doc.querySelector('channel');
    if (!channel) {
      throw new Error('parse');
    }
    
    const getText = (el, selector) => {
      const found = el.querySelector(selector);
      return found ? found.textContent.trim() : '';
    };
    
    const feedId = `feed-${Date.now()}`;
    const feed = {
      id: feedId,
      title: getText(channel, 'title') || 'Без названия',
      description: getText(channel, 'description') || '',
      url: state.ui.form.url,
    };
    
    const items = Array.from(doc.querySelectorAll('item'));
    const posts = items.map((item, index) => {
      const title = getText(item, 'title') || 'Без названия';
      const link = getText(item, 'link') || '#';
      const description = getText(item, 'description') || '';
      
      return {
        id: `post-${feedId}-${index}`,
        feedId,
        title,
        link,
        description,
        viewed: false,
      };
    });
    
    return { feed, posts };
  };

  // Загрузка RSS через прокси
  const fetchRSS = async (url) => {
    try {
      const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl, { timeout: 5000 });
      
      if (response.status !== 200 || !response.data?.contents) {
        throw new Error('network');
      }
      
      return response.data.contents;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.response?.status) {
        throw new Error('network');
      }
      throw new Error('unknown');
    }
  };

  // Обновление UI формы
  const renderForm = () => {
    const t = i18n[state.ui.language];
    
    elements.input.placeholder = t.formPlaceholder;
    elements.submit.textContent = t.formSubmit;
    
    // Обработка состояний формы
    switch (state.ui.form.state) {
      case 'filling':
        elements.submit.disabled = false;
        elements.submit.innerHTML = t.formSubmit;
        break;
        
      case 'sending':
        elements.submit.disabled = true;
        elements.submit.innerHTML = `
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ${t.status.loading}
        `;
        break;
        
      case 'success':
        elements.submit.disabled = false;
        elements.submit.textContent = t.formSubmit;
        break;
        
      case 'error':
        elements.submit.disabled = false;
        elements.submit.textContent = t.formSubmit;
        break;
    }
    
    // Обработка ошибок/успеха
    if (state.ui.form.error) {
      elements.input.classList.remove('is-valid');
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.remove('text-success', 'text-info');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = t.feedback[state.ui.form.error];
    } else if (state.ui.form.state === 'success') {
      elements.input.classList.remove('is-invalid');
      elements.input.classList.add('is-valid');
      elements.feedback.classList.remove('text-danger', 'text-info');
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = t.feedback.success;
    } else {
      elements.input.classList.remove('is-invalid', 'is-valid');
      elements.feedback.classList.remove('text-danger', 'text-success', 'text-info');
      elements.feedback.textContent = '';
    }
  };

  // Рендер фидов
  const renderFeeds = () => {
    const t = i18n[state.ui.language];
    const container = elements.feedsContainer;
    
    if (!container) return;
    
    if (state.feeds.length === 0) {
      container.innerHTML = `<p class="text-muted">${t.feedsEmpty}</p>`;
      return;
    }
    
    const list = document.createElement('div');
    list.className = 'list-group';
    
    state.feeds.forEach(feed => {
      const item = document.createElement('div');
      item.className = 'list-group-item';
      item.innerHTML = `
        <h5 class="mb-1">${feed.title}</h5>
        <p class="mb-1 text-muted small">${feed.description}</p>
      `;
      list.appendChild(item);
    });
    
    container.innerHTML = '';
    container.appendChild(list);
  };

  // Рендер постов
  const renderPosts = () => {
    const t = i18n[state.ui.language];
    const container = elements.postsContainer;
    
    if (!container) return;
    
    if (state.posts.length === 0) {
      container.innerHTML = `<p class="text-muted">${t.postsEmpty}</p>`;
      return;
    }
    
    const list = document.createElement('div');
    list.className = 'list-group';
    
    state.posts.forEach(post => {
      const isViewed = state.ui.posts.viewedIds.has(post.id);
      const feed = state.feeds.find(f => f.id === post.feedId);
      
      const item = document.createElement('div');
      item.className = 'list-group-item';
      item.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-start">
          <div class="me-3 flex-grow-1">
            <a href="${post.link}" target="_blank" rel="noopener noreferrer" 
               class="text-decoration-none post-link" data-post-id="${post.id}">
              <h6 class="mb-1 ${isViewed ? 'fw-bold' : 'fw-normal'}">${post.title}</h6>
            </a>
            <p class="mb-1 small text-muted">${post.description.substring(0, 100)}${post.description.length > 100 ? '...' : ''}</p>
            <small class="text-muted">${feed ? feed.title : ''}</small>
          </div>
          <button type="button" class="btn btn-outline-primary btn-sm view-btn" data-post-id="${post.id}">
            ${t.viewButton}
          </button>
        </div>
      `;
      list.appendChild(item);
    });
    
    container.innerHTML = '';
    container.appendChild(list);
    
    // Обработчики для постов
    container.querySelectorAll('.post-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = e.currentTarget.dataset.postId;
        state.ui.posts.viewedIds.add(postId);
        renderPosts();
      });
    });
    
    container.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.dataset.postId;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          state.ui.posts.viewedIds.add(postId);
          renderPosts();
          
          // Показываем модальное окно
          const modal = new bootstrap.Modal(document.getElementById('postModal') || createModal());
          const modalTitle = document.getElementById('postModalLabel');
          const modalBody = document.querySelector('#postModal .modal-body');
          
          if (modalTitle) modalTitle.textContent = post.title;
          if (modalBody) modalBody.textContent = post.description;
          
          modal.show();
        }
      });
    });
  };

  // Создание модального окна
  const createModal = () => {
    const modalHTML = `
      <div class="modal fade" id="postModal" tabindex="-1" aria-labelledby="postModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="postModalLabel"></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('postModal');
  };

  // Обновление заголовков
  const updateTitles = () => {
    const t = i18n[state.ui.language];
    
    // Заголовок приложения
    const appTitle = document.getElementById('app-title');
    if (appTitle) appTitle.textContent = t.appTitle;
    
    // Заголовок формы
    const formLabel = document.getElementById('form-label');
    if (formLabel) formLabel.textContent = t.formLabel;
    
    // Подсказка формы
    const formHelp = document.getElementById('form-help');
    if (formHelp) formHelp.textContent = t.formHelp;
    
    // Заголовки разделов
    const feedsTitle = document.getElementById('feeds-title') || createSectionTitle('feeds-section', 'feeds-title', t.feedsTitle);
    const postsTitle = document.getElementById('posts-title') || createSectionTitle('posts-section', 'posts-title', t.postsTitle);
    
    if (feedsTitle) feedsTitle.textContent = t.feedsTitle;
    if (postsTitle) postsTitle.textContent = t.postsTitle;
  };

  const createSectionTitle = (sectionId, titleId, text) => {
    const section = document.getElementById(sectionId);
    if (!section) return null;
    
    const title = document.createElement('h3');
    title.className = 'h5';
    title.id = titleId;
    title.textContent = text;
    section.prepend(title);
    
    return title;
  };

  // Инициализация
  const init = () => {
    // Создаем модальное окно
    createModal();
    
    // Обновляем UI
    updateTitles();
    renderForm();
    renderFeeds();
    renderPosts();
    
    // Обработчик формы
    elements.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const url = elements.input.value.trim();
      state.ui.form.url = url;
      state.ui.form.state = 'sending';
      renderForm();
      
      // Валидация
      const error = validateUrl(url);
      if (error) {
        state.ui.form.state = 'error';
        state.ui.form.error = error;
        renderForm();
        return;
      }
      
      try {
        // Загрузка RSS
        const content = await fetchRSS(url);
        
        // Парсинг
        const { feed, posts } = parseRSS(content);
        
        // Обновление состояния
        state.feeds.push(feed);
        state.posts.push(...posts);
        state.ui.form.state = 'success';
        state.ui.form.error = null;
        
        // Очистка формы
        elements.input.value = '';
        
        // Обновление UI
        renderForm();
        renderFeeds();
        renderPosts();
        
        // Для тестов: не скрываем сообщение об успехе
        // setTimeout(() => {
        //   if (state.ui.form.state === 'success') {
        //     state.ui.form.state = 'filling';
        //     renderForm();
        //   }
        // }, 5000);
        
      } catch (error) {
        state.ui.form.state = 'error';
        state.ui.form.error = error.message;
        renderForm();
      }
    });
    
    // Очистка ошибки при вводе
    elements.input.addEventListener('input', () => {
      if (state.ui.form.state === 'error') {
        state.ui.form.state = 'filling';
        state.ui.form.error = null;
        renderForm();
      }
    });
    
    // Переключатель языка
    if (elements.languageSwitcher) {
      elements.languageSwitcher.addEventListener('change', (e) => {
        state.ui.language = e.target.value;
        updateTitles();
        renderForm();
        renderFeeds();
        renderPosts();
      });
    }
  };

  // Запуск
  init();
};

// Запуск при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', app);
} else {
  app();
}