import './style.css';
import initView from './view.js';
import { validateUrl } from './lib/validation.js';

// Инициализация приложения
const app = () => {
  // Получаем DOM элементы
  const elements = {
    form: {
      form: document.getElementById('rss-form'),
      input: document.getElementById('url-input'),
      feedback: document.getElementById('url-feedback'),
      submit: document.querySelector('button[type="submit"]'),
    },
    feedsContainer: document.getElementById('feeds'),
  };

  // Инициализируем состояние
  const state = initView(elements);

  // Обработчик отправки формы
  elements.form.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get('url').trim();

    // Обновляем состояние
    state.form.url = url;
    state.form.state = 'validating';
    state.form.error = null;

    try {
      // Валидируем URL
      await validateUrl(url, state.feeds);

      // Если валидация прошла успешно
      state.form.state = 'success';

      // Добавляем фид в список
      state.feeds.push(url);

      // Через 3 секунды сбрасываем состояние формы
      setTimeout(() => {
        if (state.form.state === 'success') {
          state.form.state = 'filling';
          state.form.error = null;
        }
      }, 3000);
    } catch (error) {
      // Если валидация не прошла
      state.form.state = 'invalid';
      state.form.error = error.message;
    }
  });

  // Обработчик изменения инпута (сброс ошибки при вводе)
  elements.form.input.addEventListener('input', () => {
    if (state.form.state === 'invalid') {
      state.form.state = 'filling';
      state.form.error = null;
    }
  });
};

// Запускаем приложение когда DOM загружен
document.addEventListener('DOMContentLoaded', app);
