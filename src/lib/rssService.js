import axios from 'axios';

// Получение RSS через All Origins прокси
const getProxiedUrl = (url) => {
  const encodedUrl = encodeURIComponent(url);
  return `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;
};

const fetchRSS = async (url) => {
  try {
    const proxiedUrl = getProxiedUrl(url);
    const response = await axios.get(proxiedUrl, {
      timeout: 10000, // 10 секунд таймаут
    });
    
    if (response.status !== 200) {
      throw new Error('networkError');
    }
    
    if (!response.data?.contents) {
      throw new Error('invalidResponse');
    }
    
    return response.data.contents;
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('timeoutError');
    }
    
    if (error.response?.status === 404) {
      throw new Error('notFound');
    }
    
    if (error.response?.status) {
      throw new Error('networkError');
    }
    
    throw new Error('networkError');
  }
};

export default fetchRSS;