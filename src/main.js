import "./style.css";
import initI18n, { loadTranslations } from "./lib/i18n.js";
import initView from "./view.js";
import { validateUrl } from "./lib/validation.js";

// Инициализация приложения
const app = async () => {
  // Инициализируем i18next
  const i18nInstance = initI18n();
  await loadTranslations(i18nInstance);

  // Получаем DOM элементы
  const elements = {
    appTitle: document.querySelector("h1"),
    form: {
      form: document.getElementById("rss-form"),
      label: document.querySelector('label[for="url-input"]'),
      input: document.getElementById("url-input"),
      help: document.querySelector(".form-text"),
      feedback: document.getElementById("url-feedback"),
      submit: document.getElementById("submit-btn"),
    },
    feeds: {
      container: document.getElementById("feeds"),
      title: document.querySelector("#feeds h3"),
    },
    languageSwitcher: document.getElementById("language-switcher"),
  };

  // Инициализируем состояние с i18n
  const state = initView(elements, i18nInstance);

  // Сохраняем ссылку на state в elements для view
  elements.state = state;

  // Обработчик отправки формы
  elements.form.form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get("url").trim();

    // Обновляем состояние
    state.form.url = url;
    state.form.state = "validating";
    state.form.error = null;

    try {
      // Валидируем URL с помощью i18n
      await validateUrl(url, state.feeds, i18nInstance);

      // Если валидация прошла успешно
      state.form.state = "success";

      // Добавляем фид в список
      state.feeds.push(url);

      // Через 3 секунды сбрасываем состояние формы
      setTimeout(() => {
        if (state.form.state === "success") {
          state.form.state = "filling";
          state.form.error = null;
        }
      }, 3000);
    } catch (error) {
      // Определяем код ошибки для i18next
      let errorCode = "unknown";

      if (error.message.includes("required")) errorCode = "required";
      else if (error.message.includes("URL")) errorCode = "url";
      else if (error.message.includes("RSS")) errorCode = "rss";
      else if (
        error.message.includes("already exists") ||
        error.message.includes("unique")
      )
        errorCode = "duplicate";

      // Если валидация не прошла
      state.form.state = "invalid";
      state.form.error = errorCode;
    }
  });

  // Обработчик изменения инпута (сброс ошибки при вводе)
  elements.form.input.addEventListener("input", () => {
    if (state.form.state === "invalid") {
      state.form.state = "filling";
      state.form.error = null;
    }
  });

  // Обработчик переключения языка (если добавим переключатель)
  if (elements.languageSwitcher) {
    elements.languageSwitcher.addEventListener("change", (e) => {
      state.language = e.target.value;
    });
  }
};

// Запускаем приложение когда DOM загружен
document.addEventListener("DOMContentLoaded", app);
