const redditService = require('./redditService');
const geminiService = require('./geminiService');
const enrichmentService = require('./enrichmentService');

/**
 * Orchestrator service that coordinates calls between different services
 * Centralizes business logic and keeps services independent from each other
 */

// Mapping of categories to subreddits
const CATEGORY_SUBREDDIT_MAP = {
  'anime': 'Animesuggest',
  'kdrama': 'kdramarecommends'
};

/**
 * Returns the list of supported categories
 * @returns {Array} List of supported categories
 */
const getSupportedCategories = () => {
  return Object.keys(CATEGORY_SUBREDDIT_MAP);
};

/**
 * Gets the subreddit corresponding to the category
 * @param {string} category - Selected category
 * @returns {string} Corresponding subreddit
 */
const getSubredditForCategory = (category) => {
  return CATEGORY_SUBREDDIT_MAP[category.toLowerCase()] || CATEGORY_SUBREDDIT_MAP['anime'];
};

/**
 * Searches for posts on Reddit and generates recommendations based on the provided topic
 * @param {string} topic - The topic to search for
 * @param {string} category - The selected category (anime, kdrama, etc.)
 * @param {string} language - The source language of the query (default: 'pt')
 * @returns {Object} Search results with recommendations
 */
const searchAndGenerateRecommendations = async (topic, category = 'anime', language = 'pt') => {
  try {
    // Get the subreddit corresponding to the category
    const subreddit = getSubredditForCategory(category);
    
    // Check if the subreddit is supported
    const supportedSubreddits = redditService.getSupportedSubreddits();
    if (!supportedSubreddits.includes(subreddit)) {
      throw new Error(`Unsupported subreddit: ${subreddit}`);
    }

    // Step 1: Optimize the search query using Gemini
    console.log(`Optimizing search query: "${topic}" for category: ${category}`);
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'optimizing',
        message: 'Optimizing search terms to improve results',
        progress: 25
      });
    }
    
    let optimizedQueryData;
    let searchQuery = topic; // Default value if optimization fails
    
    try {
      optimizedQueryData = await geminiService.optimizeSearchQuery(topic, language);
      console.log('Optimized query:', optimizedQueryData);
      searchQuery = optimizedQueryData.optimizedQuery;
    } catch (optimizeError) {
      console.error('Error optimizing query:', optimizeError);
      console.log('Using original query for search');
      
      // Create a basic object to maintain consistency
      optimizedQueryData = {
        originalQuery: topic,
        translatedQuery: topic,
        optimizedQuery: topic,
        keywords: [topic]
      };
    }

    // Step 2: Search for posts on Reddit
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'searching_posts',
        message: `Searching for posts on Reddit with query: ${searchQuery}`,
        progress: 30
      });
    }
    
    const redditResults = await redditService.searchReddit(searchQuery, subreddit);
    
    // If there are no results, return an empty response
    if (!redditResults.searchResults || redditResults.searchResults.length === 0) {
      if (global.sendStatusUpdate) {
        global.sendStatusUpdate({
          type: 'status',
          status: 'no_posts',
          message: 'No posts found on Reddit for this search',
          progress: 100
        });
      }
      
      return {
        topic,
        category,
        originalQuery: topic,
        optimizedQuery: searchQuery,
        translatedQuery: optimizedQueryData.translatedQuery,
        keywords: optimizedQueryData.keywords,
        subreddit,
        searchResults: [],
        allComments: [],
        summary: { recommendations: [] }
      };
    }

    // Step 3: Aggregate comments
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'aggregating_comments',
        message: 'Aggregating comments for analysis',
        progress: 60
      });
    }
    
    // Also create an aggregated text version for debugging
    const aggregatedCommentsText = redditService.aggregateComments(redditResults.allComments);
    
    // Step 4: Generate summary with AI
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'analyzing_ai',
        message: 'Analyzing comments with AI to identify recommendations',
        progress: 70
      });
    }
    
    let summary;
    try {
      // Pass the original comments array to the generateSummary function
      summary = await geminiService.generateSummary(aggregatedCommentsText, topic, language);
    } catch (summaryError) {
      console.error('Error generating summary with AI:', summaryError);
      summary = {
        error: true,
        message: `Failed to generate summary: ${summaryError.message}`,
        recommendations: []
      };
    }
    
    // Step 5: Enrich recommendations with category-specific data
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'enriching_data',
        message: `Enriching recommendations with ${category} data`,
        progress: 85
      });
    }
    
    let enrichedRecommendations = [];
    if (summary && summary.recommendations && summary.recommendations.length > 0) {
      try {
        // Use the enrichment service with the appropriate category
        const rawEnrichedData = await enrichmentService.enrichRecommendations(
          summary.recommendations, 
          category
        );
        
        // Normalize the data to a standard format
        enrichedRecommendations = enrichmentService.normalizeEnrichedData(
          rawEnrichedData,
          category
        );
      } catch (enrichError) {
        console.error('Error enriching recommendations:', enrichError);
        
        // Use the generateId function from enrichmentService
        enrichedRecommendations = summary.recommendations.map(rec => ({
          id: enrichmentService.generateId(rec.title),
          title: rec.title,
          reasons: rec.reasons || [],
          category: category,
          score: rec.score || null
        }));
      }
    }
    
    // Finalize and return complete result
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'completed',
        message: 'Search completed successfully',
        progress: 100
      });
    }
    console.log(enrichedRecommendations)
    
    return {
      topic,
      category,
      originalQuery: topic,
      optimizedQuery: searchQuery,
      translatedQuery: optimizedQueryData.translatedQuery,
      keywords: optimizedQueryData.keywords,
      subreddit,
      searchResults: redditResults.searchResults,
      allComments: redditResults.allComments,
      summary: {
        ...summary,
        recommendations: enrichedRecommendations
      }
    };
  } catch (error) {
    console.error('Error in search and recommendation process:', error);
    throw error;
  }
};

/**
 * Returns the list of supported subreddits
 * @returns {Array} List of supported subreddits
 */
const getSupportedSubreddits = () => {
  return redditService.getSupportedSubreddits();
};

module.exports = {
  searchAndGenerateRecommendations,
  getSupportedSubreddits,
  getSupportedCategories,
  getSubredditForCategory
}; 