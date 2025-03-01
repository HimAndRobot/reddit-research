const axios = require('axios');

/**
 * Service for integration with the custom MDL API
 */

// Axios client configured for the MDL API
const mdlAxios = axios.create({
  baseURL: 'https://mdl-scrapping.geanpedro.com.br/api/dramas',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add a delay between requests to avoid rate limiting
mdlAxios.interceptors.request.use(async (config) => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  return config;
});

/**
 * Searches for drama information by title
 * @param {string} title - Title of the drama to search for
 * @returns {Object} Information about the drama
 */
const searchDrama = async (title) => {
  try {
    console.log(`Searching for drama with title: ${title}`);
    const response = await mdlAxios.get(`/search?query=${encodeURIComponent(title)}`);
    
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data;
    } else {
      console.log(`No results found for drama: ${title}`);
      return null;
    }
  } catch (error) {
    console.error(`Error searching for drama ${title}:`, error.message);
    return null;
  }
};

/**
 * Gets detailed information about a drama by its MDL ID
 * @param {string} id - MDL ID of the drama
 * @returns {Object} Detailed information about the drama
 */
const getDramaDetails = async (id) => {
  try {
    console.log(`Getting details for drama with ID: ${id}`);
    const response = await mdlAxios.get(`/drama/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting drama details for ID ${id}:`, error.message);
    return null;
  }
};

/**
 * Gets recommendations for a drama by its MDL ID
 * @param {string} id - MDL ID of the drama
 * @returns {Array} List of recommended dramas
 */
const getDramaRecommendations = async (id) => {
  try {
    console.log(`Getting recommendations for drama with ID: ${id}`);
    const response = await mdlAxios.get(`/drama/${id}/recommendations`);
    return response.data;
  } catch (error) {
    console.error(`Error getting recommendations for drama ID ${id}:`, error.message);
    return null;
  }
};

/**
 * Enriches a list of dramas with detailed information
 * @param {Array} dramas - List of dramas with basic information
 * @returns {Array} Enriched list of dramas with detailed information
 */
const enrichDramaList = async (dramas) => {
  if (!dramas || !Array.isArray(dramas)) {
    return [];
  }
  
  const enrichedDramas = [];
  
  for (const drama of dramas) {
    try {
      if (drama.id) {
        const detailedInfo = await getDramaDetails(drama.id);
        
        if (detailedInfo) {
          enrichedDramas.push({
            ...drama,
            details: detailedInfo
          });
        } else {
          enrichedDramas.push(drama);
        }
      } else {
        enrichedDramas.push(drama);
      }
    } catch (error) {
      console.error(`Error enriching drama ${drama.title || drama.id}:`, error);
      enrichedDramas.push(drama);
    }
  }
  
  return enrichedDramas;
};

module.exports = {
  searchDrama,
  getDramaDetails,
  getDramaRecommendations,
  enrichDramaList
};
