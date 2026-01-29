import onChange from 'on-change';

// Инициализация состояния приложения
const initialState = {
  form: {
    state: 'filling', // 'filling', 'validating', 'invalid', 'success'
    error: null, // теперь храним код ошибки, а не текст
    url: '',
  },
  feeds: [],
  language: 'ru', // текущий язык
};

// Создание представления
export default (elements, i18nInstance) => {
  const state = onChange(initialState, (path, value) => {
    switch (path) {
      case 'form.state':
        updateFormState(elements, value, state.form.error, i18nInstance);
        break;
      case 'form.error':
        updateFormError(elements, value, i18nInstance);
        break;
      case 'feeds':
        updateFeeds(elements, value, i18nInstance);
        break;
      case 'language':
        updateLanguage(elements, value, i18nInstance);
        break;
      default:
        break;
    }
  });

  return state;
};

// Обновление состояния формы
const updateFormState = (elements, state, errorCode, i18n) => {
  const { input, feedback, submit } = elements.form;
  
  // Сбрасываем классы
  input.classList.remove('is-invalid', 'is-valid');
  feedback.classList.remove('text-danger', 'text-success');
  feedback.textContent = '';
  
  switch (state) {
    case 'validating':
      input.setAttribute('readonly', true);
      submit.disabled = true;
      submit.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${i18n.t('form.loading')}`;
      break;
      
    case 'invalid':
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = i18n.t(`feedback.errors.${errorCode}`, errorCode);
      input.removeAttribute('readonly');
      submit.disabled = false;
      submit.textContent = i18n.t('form.submit');
      break;
      
    case 'success':
      input.classList.add('is-valid');
      feedback.classList.add('text-success');
      feedback.textContent = i18n.t('feedback.success');
      input.removeAttribute('readonly');
      submit.disabled = false;
      submit.textContent = i18n.t('form.submit');
      input.value = '';
      input.focus();
      break;
      
    default:
      input.removeAttribute('readonly');
      submit.disabled = false;
      submit.textContent = i18n.t('form.submit');
      break;
  }
};

// Обновление ошибки формы (теперь храним код ошибки)
const updateFormError = (elements, errorCode, i18n) => {
  if (errorCode) {
    elements.form.feedback.textContent = i18n.t(`feedback.errors.${errorCode}`, errorCode);
  }
};

// Обновление списка фидов
const updateFeeds = (elements, feeds, i18n) => {
  const { container, title } = elements.feeds;
  container.innerHTML = '';
  
  // Обновляем заголовок
  title.textContent = i18n.t('feeds.title');
  
  if (feeds.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-muted';
    emptyMessage.textContent = i18n.t('feeds.empty');
    container.appendChild(emptyMessage);
    return;
  }
  
  const list = document.createElement('ul');
  list.className = 'list-group';
  
  feeds.forEach((feed) => {
    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    const text = document.createElement('span');
    text.textContent = feed;
    
    const badge = document.createElement('span');
    badge.className = 'badge bg-primary rounded-pill';
    badge.textContent = '✓';
    
    item.appendChild(text);
    item.appendChild(badge);
    list.appendChild(item);
  });
  
  container.appendChild(list);
};

// Обновление языка интерфейса
const updateLanguage = (elements, language, i18n) => {
  i18n.changeLanguage(language);
  
  // Обновляем все тексты интерфейса
  elements.appTitle.textContent = i18n.t('app.title');
  elements.form.label.textContent = i18n.t('form.label');
  elements.form.input.placeholder = i18n.t('form.placeholder');
  elements.form.help.textContent = i18n.t('form.help');
  elements.form.submit.textContent = i18n.t('form.submit');
  elements.feeds.title.textContent = i18n.t('feeds.title');
  
  // Обновляем список фидов
  updateFeeds(elements, elements.state.feeds, i18n);
};