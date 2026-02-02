import axios from "axios";

// Список доступных прокси
const PROXIES = [
  {
    name: "allorigins",
    url: (url) =>
      `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`,
    extract: (data) => data.contents || data,
  },
  {
    name: "allorigins_raw",
    url: (url) =>
      `https://allorigins.hexlet.app/raw?url=${encodeURIComponent(url)}`,
    extract: (data) => data,
  },
  {
    name: "corsproxy",
    url: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    extract: (data) => data,
  },
  {
    name: "thingproxy",
    url: (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
    extract: (data) => data,
  },
];

export const fetchRSS = async (url) => {
  console.log(`Trying to fetch: ${url}`);

  // Пробуем каждый прокси по очереди
  for (const proxy of PROXIES) {
    try {
      console.log(`Trying proxy: ${proxy.name}`);
      const proxyUrl = proxy.url(url);

      const response = await axios.get(proxyUrl, {
        timeout: 10000,
        headers: {
          Accept: "application/xml, text/xml, */*",
          "User-Agent": "Mozilla/5.0",
        },
      });

      console.log(`Proxy ${proxy.name} succeeded, status: ${response.status}`);

      // Извлекаем данные в зависимости от прокси
      const content = proxy.extract(response.data);

      if (
        content &&
        (typeof content === "string" ||
          content.includes?.("<?xml") ||
          content.includes?.("<rss"))
      ) {
        console.log(`Successfully got content from ${proxy.name}`);
        return content;
      }
    } catch (error) {
      console.warn(`Proxy ${proxy.name} failed:`, error.message);
      // Пробуем следующий прокси
    }
  }

  // Если все прокси не работают, пробуем прямой запрос (только для CORS разрешенных)
  try {
    console.log("Trying direct request (may fail due to CORS)");
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        Accept: "application/xml, text/xml",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (response.data) {
      console.log("Direct request succeeded");
      return response.data;
    }
  } catch (directError) {
    console.warn("Direct request also failed:", directError.message);
  }

  throw new Error("networkError");
};

export const checkForUpdates = async (url, existingPosts) => {
  try {
    const content = await fetchRSS(url);
    return content;
  } catch (error) {
    console.warn(`Failed to update RSS feed ${url}:`, error.message);
    return null;
  }
};
