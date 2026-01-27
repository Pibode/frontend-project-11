import './style.css';

document.getElementById('rss-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const urlInput = document.getElementById('url-input');
  const url = urlInput.value.trim();

  if (url) {
    // Здесь будет логика добавления RSS
    // console.log('Добавляем RSS:', url); // Убрали console.log
    // Очищаем поле ввода
    urlInput.value = '';
  }
});
