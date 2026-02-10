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

  const getAttribute = (element, selector, attribute) => {
    const el = element.querySelector(selector);
    return el && el.getAttribute(attribute)
      ? el.getAttribute(attribute).trim()
      : "";
  };

  const feed = {
    id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: getText(channel, "title") || "Без названия",
    description: getText(channel, "description") || "",
  };

  // Извлекаем посты
  const items = xmlDoc.querySelectorAll("item");
  const posts = Array.from(items).map((item, index) => {
    const title = getText(item, "title") || "Без названия";

    let link = getText(item, "link");
    if (!link) {
      link = getAttribute(item, "link", "href");
    }
    if (!link) {
      const guid = getText(item, "guid");
      if (guid && guid.startsWith("http")) {
        link = guid;
      }
    }

    const guid = getText(item, "guid");
    const pubDate = getText(item, "pubDate") || getText(item, "dc:date");
    const description =
      getText(item, "description") ||
      getText(item, "content:encoded") ||
      getText(item, "content") ||
      "";

    return {
      id:
        guid ||
        `post-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      feedId: feed.id,
      title,
      link: link || "#",
      description,
      content:
        getText(item, "content:encoded") ||
        getText(item, "content") ||
        description,
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
