// Чистая функция для парсинга RSS
const parseRSS = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Проверяем на ошибки парсинга
  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("parseError");
  }

  // Извлекаем данные фида
  const channel = xmlDoc.querySelector("channel");
  if (!channel) {
    throw new Error("parseError");
  }

  const getText = (element, selector) => {
    const el = element.querySelector(selector);
    return el ? el.textContent.trim() : "";
  };

  const feed = {
    id: `feed-${Date.now()}`,
    title: getText(channel, "title") || "Без названия",
    description: getText(channel, "description") || "",
  };

  // Извлекаем посты
  const items = xmlDoc.querySelectorAll("item");
  const posts = Array.from(items).map((item, index) => {
    const title = getText(item, "title") || "Без названия";

    let link = getText(item, "link");
    if (!link) {
      const linkElement = item.querySelector("link");
      if (linkElement && linkElement.getAttribute("href")) {
        link = linkElement.getAttribute("href");
      }
    }

    return {
      id: `post-${Date.now()}-${index}`,
      feedId: feed.id,
      title,
      link: link || "#",
      description: getText(item, "description") || "",
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
