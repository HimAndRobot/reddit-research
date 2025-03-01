const jikanService = require('./jikanService');
const imdbService = require('./imdb');
const mdlService = require('./mdlService');

/**
 * Enrichment service that coordinates the enrichment of recommendations
 * based on the selected category
 */

/**
 * Enriches a list of recommendations with additional data
 * @param {Array} recommendations - List of recommendations to be enriched
 * @param {string} category - Category of recommendations (anime, kdrama, etc.)
 * @returns {Array} Enriched list of recommendations
 */
const enrichRecommendations = async (recommendations, category = 'anime') => {
  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  try {
    console.log(`Enriching ${recommendations.length} recommendations for category: ${category}`);
    
    // Use the appropriate service based on the category
    switch (category.toLowerCase()) {
      case 'anime':
        // Use Jikan service to enrich anime recommendations
        const enrichedRecommendations = [];
        
        // Process each recommendation sequentially to avoid rate limiting
        for (const rec of recommendations) {
          
          const animeInfo = await jikanService.getAnimeInfo(rec.title);
          
          if (animeInfo) {
            // Atualizar o status com a imagem encontrada
            if (global.sendStatusUpdate && animeInfo.images && animeInfo.images.jpg) {
              global.sendStatusUpdate({
                type: 'status',
                status: 'enriquecendo_dados',
                message: `Informações encontradas para: ${rec.title}`,
                progress: 85 + (enrichedRecommendations.length / recommendations.length * 15),
                currentItem: {
                  title: rec.title,
                  image: animeInfo.images.jpg.large_image_url,
                  category: 'anime'
                }
              });
            }
            
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
                themes: animeInfo.themes ? animeInfo.themes.map(t => t.name) : [],
                studios: animeInfo.studios ? animeInfo.studios.map(s => s.name) : [],
                year: animeInfo.year,
                season: animeInfo.season,
                trailer: animeInfo.trailer ? animeInfo.trailer.url : null
              }
            });
          } else {
            // If no information was found, keep only the original data
            enrichedRecommendations.push(rec);
          }
        }
        
        return enrichedRecommendations;
      
      case 'kdrama':
        // Processamento sequencial para kdramas (um por vez)
        const enrichedKdramas = [];
        for (const rec of recommendations) {
          // Emitir evento de status para atualizar a UI com o item atual
          if (global.sendStatusUpdate) {
            global.sendStatusUpdate({
              type: 'status',
              status: 'enriquecendo_dados',
              message: `Buscando informações para: ${rec.title}`,
              progress: 85 + (enrichedKdramas.length / recommendations.length * 15),
              currentItem: {
                title: rec.title,
                image: null,
                category: 'kdrama'
              }
            });
          }
          
          const mdlInfo = await mdlService.searchDrama(rec.title);
          const info = mdlInfo[0] ?? {};
          console.log(info);
          
          // Atualizar o status com a imagem encontrada
          if (global.sendStatusUpdate && info.poster) {
            global.sendStatusUpdate({
              type: 'status',
              status: 'enriquecendo_dados',
              message: `Informações encontradas para: ${rec.title}`,
              progress: 85 + (enrichedKdramas.length / recommendations.length * 15),
              currentItem: {
                title: rec.title,
                image: info.poster,
                category: 'kdrama'
              }
            });
          }
          
          // Aguarda 1 segundo entre cada requisição
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          enrichedKdramas.push({
            ...rec,
            kdramaInfo: {
              title: rec.title,
              image_url: info.poster ?? null,
              year: null,
              episodes: null,
              genres: [],
              synopsis: null,
            }
          });
        }
        return enrichedKdramas;
      
      default:
        // For unknown categories, return recommendations without modification
        console.warn(`Unknown category for enrichment: ${category}`);
        return recommendations;
    }
  } catch (error) {
    console.error(`Error enriching recommendations for category ${category}:`, error);
    // In case of error, return original recommendations
    return recommendations;
  }
};

/**
 * Normalizes enriched data to a standard format
 * regardless of the data source
 * @param {Array} enrichedRecommendations - List of enriched recommendations
 * @param {string} category - Category of recommendations
 * @returns {Array} Normalized list of recommendations
 */
const normalizeEnrichedData = (enrichedRecommendations, category = 'anime') => {
  if (!enrichedRecommendations || !Array.isArray(enrichedRecommendations)) {
    return [];
  }

  return enrichedRecommendations.map(rec => {
    console.log(rec.relevanceScore)
    // Base object with common properties
    const normalized = {
      id: rec.id || generateId(rec.title),
      title: rec.title,
      reasons: rec.reasons || [],
      category: category,
      score: rec.relevanceScore ?? null,
      image: null,
      year: null,
      episodes: null,
      genres: [],
      synopsis: null,
      score: null,
      type: null,
      url: null
    };

    // Add specific properties based on category
    switch (category.toLowerCase()) {
      case 'anime':
        if (rec.jikanInfo) {
          normalized.image = rec.jikanInfo.image_url || null;
          normalized.year = rec.jikanInfo.year || null;
          normalized.episodes = rec.jikanInfo.episodes || null;
          normalized.genres = rec.jikanInfo.genres || [];
          normalized.synopsis = rec.jikanInfo.synopsis || null;
          normalized.score = rec.jikanInfo.score || null;
          normalized.type = rec.jikanInfo.type || null;
          normalized.url = rec.jikanInfo.url || null;
          normalized.alternative_title = rec.jikanInfo.title_english || rec.title;
          normalized.japanese_title = rec.jikanInfo.title_japanese || null;
          normalized.studio = rec.jikanInfo.studios ? rec.jikanInfo.studios.join(', ') : null;
          normalized.status = rec.jikanInfo.status || null;
        }
        break;
      
      case 'kdrama':
        if (rec.kdramaInfo) {
          normalized.image = rec.kdramaInfo.image_url || null;
          normalized.year = rec.kdramaInfo.year || null;
          normalized.episodes = rec.kdramaInfo.episodes || null;
          normalized.genres = rec.kdramaInfo.genres || [];
          normalized.synopsis = rec.kdramaInfo.synopsis || null;
          normalized.alternative_title = rec.kdramaInfo.title_english || rec.title;
          normalized.korean_title = rec.kdramaInfo.title_korean || null;
          normalized.network = rec.kdramaInfo.network || null;
          normalized.status = rec.kdramaInfo.status || null;
          normalized.score = rec.relevanceScore || null;
        }
        break;
      
      default:
        // Do nothing for unknown categories
        break;
    }

    return normalized;
  });
};

/**
 * Generates a unique ID based on the title
 * @param {string} title - Title to generate ID from
 * @returns {string} Generated ID
 */
const generateId = (title) => {
  if (!title) return `rec_${Date.now()}`;
  return `rec_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
};

module.exports = {
  enrichRecommendations,
  normalizeEnrichedData,
  generateId
}; 