import axios from 'axios'

export const fetchRSS = async (url) => {
  try {
    const encodedUrl = encodeURIComponent(url)
    const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`

    const response = await axios.get(proxyUrl, {
      timeout: 10000,
    })

    if (response.status !== 200) {
      throw new Error('networkError')
    }

    if (!response.data?.contents) {
      throw new Error('invalidResponse')
    }

    return response.data.contents
  }
 catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('networkError')
    }

    if (error.response?.status === 404) {
      throw new Error('networkError')
    }

    if (error.response?.status) {
      throw new Error('networkError')
    }

    throw new Error('networkError')
  }
}

// Добавляем функцию checkForUpdates
export const checkForUpdates = async (url) => {
  try {
    return await fetchRSS(url)
  }
 catch {
    return null
  }
}
