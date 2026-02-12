// Чистая функция для парсинга RSS
const parseRSS = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Проверяем на ошибки парсинга
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('parseError');
  }

  // Извлекаем данные фида
  const channel = xmlDoc.querySelector('channel');
  if (!channel) {
    throw new Error('parseError');
  }

  const getText = (element, selector) => {
    try {
      // Обрабатываем селекторы с двоеточиями (как content:encoded)
      if (selector.includes(':')) {
        // Для namespace селекторов ищем через getElementsByTagNameNS
        const parts = selector.split(':');
        if (parts.length === 2) {
          const [namespace, tagName] = parts;
          let elements;

          // Пробуем разные namespace
          if (namespace === 'content') {
            elements = element.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded');
          } else if (namespace === 'dc') {
            elements = element.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', tagName);
          }

          if (elements && elements.length > 0) {
            return elements[0].textContent.trim();
          }
        }
      }

      // Стандартный поиск
      const el = element.querySelector(selector);
      return el ? el.textContent.trim() : '';
    } catch {
      return '';
    }
  };

  const feed = {
    id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: getText(channel, 'title') || 'Без названия',
    description: getText(channel, 'description') || '',
  };

  // Извлекаем посты
  const items = xmlDoc.querySelectorAll('item');
  const posts = Array.from(items).map((item, index) => {
    const title = getText(item, 'title') || 'Без названия';

    let link = getText(item, 'link');
    if (!link) {
      // Пробуем получить ссылку из атрибута
      const linkElement = item.querySelector('link');
      if (linkElement) {
        link = linkElement.getAttribute('href') || linkElement.textContent.trim();
      }
    }

    const guid = getText(item, 'guid');
    const pubDate = getText(item, 'pubDate') || getText(item, 'dc:date');

    // Получаем описание (пробуем разные селекторы)
    let description = getText(item, 'description');
    if (!description) {
      description = getText(item, 'content\\:encoded')
        || getText(item, 'content')
        || '';
    }

    return {
      id: guid || `post-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      feedId: feed.id,
      title,
      link: link || '#',
      description,
      content: description,
      pubDate: pubDate || new Date().toISOString(),
    };
  });

  return { feed, posts };
};

// Функция для извлечения только новых постов
export const getNewPosts = (parsedData, existingPosts) => {
  const existingPostIds = new Set(existingPosts.map((post) => post.id));
  return parsedData.posts.filter((post) => !existingPostIds.has(post.id));
};

export default parseRSS;
