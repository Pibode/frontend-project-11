import "./style.css";

// Простые переводы
const translations = {
  ru: {
    appTitle: "RSS агрегатор",
    formLabel: "RSS ссылка",
    formPlaceholder: "https://example.com/rss",
    formHelp: "Введите URL RSS-ленты",
    formSubmit: "Добавить",
    feedsTitle: "Добавленные RSS ленты",
    feedsEmpty: "Пока нет добавленных RSS лент",
    feedback: {
      success: "RSS успешно добавлен",
      required: "Не должно быть пустым",
      url: "Ссылка должна быть валидным URL",
      duplicate: "RSS уже существует",
    },
  },
  en: {
    appTitle: "RSS Aggregator",
    formLabel: "RSS link",
    formPlaceholder: "https://example.com/rss",
    formHelp: "Enter RSS feed URL",
    formSubmit: "Add",
    feedsTitle: "Added RSS feeds",
    feedsEmpty: "No RSS feeds added yet",
    feedback: {
      success: "RSS successfully added",
      required: "Should not be empty",
      url: "Link must be a valid URL",
      duplicate: "RSS already exists",
    },
  },
};

let currentLang = "ru";

const app = () => {
  console.log("App starting...");

  // Получаем элементы
  const elements = {
    appTitle: document.getElementById("app-title"),
    formLabel: document.getElementById("form-label"),
    urlInput: document.getElementById("url-input"),
    formHelp: document.getElementById("form-help"),
    submitBtn: document.getElementById("submit-btn"),
    feedsTitle: document.getElementById("feeds-title"),
    feedsEmpty: document.getElementById("feeds-empty"),
    urlFeedback: document.getElementById("url-feedback"),
    rssForm: document.getElementById("rss-form"),
    languageSwitcher: document.getElementById("language-switcher"),
    feedsContainer: document.getElementById("feeds"),
  };

  console.log(
    "Elements found:",
    Object.keys(elements).filter((key) => elements[key]),
  );

  let feeds = [];

  // Функция обновления интерфейса
  const updateUI = () => {
    const t = translations[currentLang];

    if (elements.appTitle) elements.appTitle.textContent = t.appTitle;
    if (elements.formLabel) elements.formLabel.textContent = t.formLabel;
    if (elements.urlInput) elements.urlInput.placeholder = t.formPlaceholder;
    if (elements.formHelp) elements.formHelp.textContent = t.formHelp;
    if (elements.submitBtn) elements.submitBtn.textContent = t.formSubmit;
    if (elements.feedsTitle) elements.feedsTitle.textContent = t.feedsTitle;
    if (elements.feedsEmpty) elements.feedsEmpty.textContent = t.feedsEmpty;

    // Обновляем список фидов если он есть
    updateFeedsList();
  };

  // Функция обновления списка фидов
  const updateFeedsList = () => {
    const container = elements.feedsContainer;
    if (!container) return;

    const t = translations[currentLang];

    // Удаляем старый список если есть
    const oldList = container.querySelector("ul");
    if (oldList) oldList.remove();

    // Если нет фидов, показываем сообщение
    if (feeds.length === 0) {
      const emptyMsg =
        elements.feedsEmpty || container.querySelector("p.text-muted");
      if (emptyMsg) {
        emptyMsg.textContent = t.feedsEmpty;
        emptyMsg.style.display = "block";
      }
      return;
    }

    // Скрываем сообщение "нет фидов"
    const emptyMsg =
      elements.feedsEmpty || container.querySelector("p.text-muted");
    if (emptyMsg) emptyMsg.style.display = "none";

    // Создаем новый список
    const list = document.createElement("ul");
    list.className = "list-group mt-3";

    feeds.forEach((feed) => {
      const item = document.createElement("li");
      item.className = "list-group-item";
      item.textContent = feed;
      list.appendChild(item);
    });

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

  // Обработчик формы
  if (elements.rssForm) {
    elements.rssForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const url = elements.urlInput.value.trim();
      const t = translations[currentLang];

      // Сбрасываем предыдущие состояния
      elements.urlInput.classList.remove("is-invalid", "is-valid");
      elements.urlFeedback.classList.remove("text-danger", "text-success");

      // Валидация
      if (!url) {
        elements.urlInput.classList.add("is-invalid");
        elements.urlFeedback.classList.add("text-danger");
        elements.urlFeedback.textContent = t.feedback.required;
        return;
      }

      try {
        new URL(url);
      } catch {
        elements.urlInput.classList.add("is-invalid");
        elements.urlFeedback.classList.add("text-danger");
        elements.urlFeedback.textContent = t.feedback.url;
        return;
      }

      if (feeds.includes(url)) {
        elements.urlInput.classList.add("is-invalid");
        elements.urlFeedback.classList.add("text-danger");
        elements.urlFeedback.textContent = t.feedback.duplicate;
        return;
      }

      // Успех
      elements.urlInput.classList.add("is-valid");
      elements.urlFeedback.classList.add("text-success");
      elements.urlFeedback.textContent = t.feedback.success;

      // Добавляем фид
      feeds.push(url);
      elements.urlInput.value = "";
      elements.urlInput.focus();

      // Обновляем список
      updateFeedsList();

      // Сбрасываем состояние через 3 секунды
      setTimeout(() => {
        elements.urlInput.classList.remove("is-valid");
        elements.urlFeedback.classList.remove("text-success");
        elements.urlFeedback.textContent = "";
      }, 3000);
    });
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
};

// Запускаем приложение
document.addEventListener("DOMContentLoaded", app);
