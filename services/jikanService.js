const axios = require('axios');

/**
 * Service for integration with the Jikan API (MyAnimeList)
 */

// Axios client configured for the Jikan API
const jikanAxios = axios.create({
  baseURL: 'https://api.jikan.moe/v4',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add a delay between requests to avoid rate limiting
jikanAxios.interceptors.request.use(async (config) => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  return config;
});

/**
 * Searches for detailed information about an anime by title
 * @param {string} title - Title of the anime to search for
 * @returns {Object} Detailed information about the anime
 */
const getAnimeInfo = async (title) => {
  try {
    console.log(`Searching for information about anime: ${title}`);
    
    // Limit search to 1 result to get the most relevant one
    const response = await jikanAxios.get('/anime', {
      params: {
        q: title,
        limit: 1
      }
    });
    
    // Check if any results were found
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    } else {
      console.log(`No results found for: ${title}`);
      return null;
    }
  } catch (error) {
    console.error(`Error searching for anime information ${title}:`, error.message);
    // If there's a rate limit error, wait and try again
    if (error.response && error.response.status === 429) {
      console.log('Rate limit reached, waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return getAnimeInfo(title);
    }
    return null;
  }
};

/**
 * Enriches a list of recommendations with information from the Jikan API
 * @param {Array} recommendations - List of recommendations
 * @returns {Array} Enriched list of recommendations
 */
const enrichRecommendations = async (recommendations) => {
  if (!recommendations || !Array.isArray(recommendations)) {
    return [];
  }
  
  const enrichedRecommendations = [];
  
  // Process each recommendation sequentially to avoid rate limiting
  for (const rec of recommendations) {
    try {
      // Use the title property instead of titulo
      const animeInfo = await getAnimeInfo(rec.title);
      
      if (animeInfo) {
        // Add Jikan information to the recommendation
        enrichedRecommendations.push({
          ...rec,
          jikanInfo: {
            mal_id: animeInfo.mal_id,
            url: animeInfo.url,
            image_url: animeInfo.images.jpg.large_image_url,
            title_english: animeInfo.title_english || animeInfo.title,
            title_japanese: animeInfo.title_japanese,
            type: animeInfo.type,
            episodes: animeInfo.episodes,
            status: animeInfo.status,
            score: animeInfo.score,
            scored_by: animeInfo.scored_by,
            synopsis: animeInfo.synopsis,
            genres: animeInfo.genres.map(g => g.name),
            themes: animeInfo.themes.map(t => t.name),
            studios: animeInfo.studios.map(s => s.name),
            year: animeInfo.year,
            season: animeInfo.season,
            trailer: animeInfo.trailer ? animeInfo.trailer.url : null
          }
        });
      } else {
        // If no information was found, keep only the original data
        enrichedRecommendations.push(rec);
      }
    } catch (error) {
      console.error(`Error enriching recommendation ${rec.title}:`, error);
      enrichedRecommendations.push(rec);
    }
  }
  
  return enrichedRecommendations;
};

module.exports = {
  getAnimeInfo,
  enrichRecommendations
}; 