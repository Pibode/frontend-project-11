import onChange from 'on-change';

// Инициализация состояния приложения
const initialState = {
  form: {
    state: 'filling', // 'filling', 'validating', 'invalid', 'success'
    error: null,
    url: '',
  },
  feeds: [],
};

// Создание представления
export default (elements) => {
  const state = onChange(initialState, (path, value) => {
    switch (path) {
      case 'form.state':
        updateFormState(elements, value, state.form.error);
        break;
      case 'form.error':
        updateFormError(elements, value);
        break;
      case 'feeds':
        updateFeeds(elements, value);
        break;
      default:
        break;
    }
  });

  return state;
};

// Обновление состояния формы
const updateFormState = (elements, state, error) => {
  const { input, feedback } = elements.form;

  // Сбрасываем классы
  input.classList.remove('is-invalid', 'is-valid');
  feedback.classList.remove('text-danger', 'text-success');
  feedback.textContent = '';

  switch (state) {
    case 'validating':
      input.setAttribute('readonly', true);
      break;
    case 'invalid':
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = error;
      input.removeAttribute('readonly');
      break;
    case 'success':
      input.classList.add('is-valid');
      feedback.classList.add('text-success');
      feedback.textContent = 'RSS успешно добавлен';
      input.removeAttribute('readonly');
      input.value = '';
      input.focus();
      break;
    default:
      input.removeAttribute('readonly');
      break;
  }
};

// Обновление ошибки формы
const updateFormError = (elements, error) => {
  if (error) {
    elements.form.feedback.textContent = error;
  }
};

// Обновление списка фидов
const updateFeeds = (elements, feeds) => {
  const container = elements.feedsContainer;
  container.innerHTML = '';

  if (feeds.length === 0) {
    container.innerHTML = '<p class="text-muted">Пока нет добавленных RSS лент</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'list-group';

  feeds.forEach((feed) => {
    const item = document.createElement('li');
    item.className = 'list-group-item';
    item.textContent = feed;
    list.appendChild(item);
  });

  container.appendChild(list);
};
