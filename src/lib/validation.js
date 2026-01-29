import * as yup from 'yup';

// Схема валидации RSS URL
const rssUrlSchema = yup
  .string()
  .required('Не должно быть пустым')
  .url('Ссылка должна быть валидным URL')
  .test('is-rss', 'Ссылка должна быть на RSS ленту', (value) => {
    // Проверяем что это RSS/XML ссылка
    const rssPattern = /\.(rss|xml)$/i;
    const containsRss = /rss/i.test(value);
    return rssPattern.test(value) || containsRss;
  });

// Функция валидации URL
export const validateUrl = (url, feeds) => rssUrlSchema
  .test('unique', 'RSS уже существует', (value) => !feeds.includes(value))
  .validate(url);
