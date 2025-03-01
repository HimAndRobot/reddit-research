const axios = require('axios');

const imdbAxios = axios.create({
  baseURL: 'https://imdb.iamidiotareyoutoo.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

const getImdbInfo = async (title) => {
  const response = await imdbAxios.get(`/search?q=${title}`);
  return response.data;
};

module.exports = { getImdbInfo };
