import axios from "axios";

export const fetchRSS = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxyUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;

  return axios
    .get(proxyUrl, { timeout: 10000 })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error("network");
      }
      if (!response.data?.contents) {
        throw new Error("invalid");
      }
      return response.data.contents;
    })
    .catch((error) => {
      if (error.code === "ECONNABORTED") {
        throw new Error("timeout");
      }
      if (error.response?.status === 404) {
        throw new Error("notFound");
      }
      throw new Error("network");
    });
};
