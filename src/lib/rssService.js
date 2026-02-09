import axios from "axios";

const getProxiedUrl = (url) => {
  const encodedUrl = encodeURIComponent(url);
  return `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;
};

export const fetchRSS = async (url) => {
  try {
    const proxiedUrl = getProxiedUrl(url);
    const response = await axios.get(proxiedUrl, {
      timeout: 5000,
    });

    if (response.status !== 200) {
      throw new Error("networkError");
    }

    if (!response.data?.contents) {
      throw new Error("invalidResponse");
    }

    return response.data.contents;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("timeoutError");
    }
    if (error.response?.status === 404) {
      throw new Error("notFound");
    }
    if (error.response?.status) {
      throw new Error("networkError");
    }
    throw new Error("networkError");
  }
};

export const checkForUpdates = async (url) => {
  try {
    return await fetchRSS(url);
  } catch (error) {
    console.warn(`Update failed: ${error.message}`);
    return null;
  }
};
