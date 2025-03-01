const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

/**
 * Gemini service that handles interactions with Google's Gemini AI model
 * Provides functions for query optimization and recommendation generation
 */

/**
 * Optimizes a search query for better results on Reddit
 * @param {string} query - The original search query
 * @param {string} sourceLanguage - The source language of the query (default: 'pt')
 * @returns {Object} Object containing the original, translated, and optimized queries
 */
const optimizeSearchQuery = async (query, sourceLanguage = 'pt') => {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured.');
      throw new Error('Gemini API not configured. Check your environment variables.');
    }

    // Build the prompt for AI
    const prompt = `
You are an assistant specialized in optimizing search queries for Reddit.

Original user question: "${query}"

Your task:
1. Translate the question to English (if not already in English) maintaining the EXACT meaning
2. Reformulate the question into an optimized search query for Reddit using ONLY keywords
3. Identify relevant keywords for the search

Return only a JSON object with the following format:
{
  "translatedQuery": "The question translated to English",
  "optimizedQuery": "keyword1 keyword2 keyword3",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Important:
- The translation must be LITERAL and PRECISE, preserving the exact meaning of the original question
- DO NOT add concepts or terms that are not present in the original question
- Correctly translate idiomatic expressions (e.g., "volta no tempo" = "time travel", not "set in the past")
- If the query is about "similar to X" or "like X", keep the focus on similarity to X
- The optimized query should ONLY contain essential keywords separated by spaces (no quotes, no AND/OR operators)
- Format the optimized query like "keyword1 keyword2 keyword3" - this works best with Reddit's search
- Remove all unnecessary words like "recommend me", "I want to know", etc.
- Keep only what's essential for the search
- Return ONLY the JSON, without additional text
- Use the official English or Japanese name of the works, do not translate to Portuguese
- IMPORTANT: Verify that each keyword makes sense in English and is commonly used. For example, "scholar" should be "school" when referring to educational settings
- Correct any mistranslations or uncommon terms to their proper English equivalents that would be used in Reddit discussions
- Use the most common search terms that Reddit users would use when discussing these elements
- If a direct translation creates an uncommon or incorrect term in English, replace it with the proper term that captures the same meaning
- DO NOT add terms like "anime" or "manga" unless they were specifically mentioned in the original query
`;

    try {
      // Prepare the payload for the API
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      };

      // Call to Gemini API
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the generated text
      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Clean the text to ensure it's valid JSON
      const cleanedText = generatedText.trim()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Parse the JSON
      try {
        const result = JSON.parse(cleanedText);
        
        // Check if the JSON has the expected structure
        if (!result.translatedQuery || !result.optimizedQuery || !result.keywords) {
          console.error('Invalid JSON structure received from API');
          throw new Error('Invalid response structure from Gemini API');
        }
        
        return {
          originalQuery: query,
          translatedQuery: result.translatedQuery,
          optimizedQuery: result.optimizedQuery,
          keywords: result.keywords
        };
      } catch (parseError) {
        console.error('Error parsing JSON returned by AI:', parseError);
        console.log('Returned text:', cleanedText);
        throw new Error('Failed to process Gemini API response. Invalid response format.');
      }
    } catch (apiError) {
      console.error('Error in Gemini API call:', apiError);
      console.error('Error details:', apiError.response?.data || apiError.message);
      throw new Error('Failed to optimize query with Gemini API. Please try again.');
    }
  } catch (error) {
    console.error('Error optimizing search query:', error);
    throw error;
  }
};

/**
 * Generates a summary of recommendations based on Reddit comments
 * @param {Array} comments - Array of Reddit comments
 * @param {string} topic - The original search topic
 * @param {string} sourceLanguage - The source language of the query (default: 'pt')
 * @returns {Object} Summary object with recommendations
 */
const generateSummary = async (comments, topic, sourceLanguage = 'pt') => {
  try {
    console.log(Array.isArray(comments));
    // Ensure comments is an array
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return {
        error: true,
        message: 'No comments provided for analysis',
        recommendations: []
      };
    }

    // Map language codes to full names
    const languageNames = {
      'pt': 'português',
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'ja': 'Japanese'
    };
    
    const languageName = languageNames[sourceLanguage] || 'English';
    console.log(languageName);

   
    
    // Prepare comments for the prompt - ensure each comment has a body property and include replies
    const commentsText = comments
      .filter(c => c && (typeof c === 'object' || typeof c === 'string')) // Filter out invalid comments
      .map(c => {
        if (typeof c === 'string') {
          return `## ${c}`; // Format post titles with markdown heading
        } else if (typeof c === 'object') {
          // Format main comment
          let commentText = `- **${c.author}** (${c.score} pontos): ${c.body}`;
          
          // Add replies if they exist
          if (c.replies && Array.isArray(c.replies) && c.replies.length > 0) {
            commentText += '\n' + c.replies.map(reply => 
              `  - **${reply.author}** (${reply.score} pontos): ${reply.body}`
            ).join('\n');
          }
          
          return commentText;
        }
        return '';
      })
      .filter(text => text.length > 0) // Remove empty strings
      .join('\n\n');
    
    if (!commentsText) {
      return {
        error: true,
        message: 'No valid comment content found for analysis',
        recommendations: []
      };
    }
    
    // Build the prompt for AI
    const prompt = `
You are an assistant specialized in analyzing discussions about anime and manga.

Analyze the comments below about "${topic}" and identify the different works (anime/manga) that were recommended by users SPECIFICALLY for this theme.

Create a structured summary in JSON format with the following format reasons in ${languageName}:
{
  "recommendations": [
    {
      "title": "Name of the recommended anime/manga",
      "reasons": [
        "Reason 1 explaining how the work connects to specific elements of the search topic",
        "Reason 2 clearly stating which requested elements are present in this work and which are absent",
        "Reason 3 summarizing the average opinion from commenters about this recommendation minimum 400 characters"
      ],
      "relevanceScore": 0 to 100 based on the work's relevance to the search topic highlighting the most relevant elements
    },
    ... more recommendations
  ]
}

Comments to be analyzed:
${commentsText}

Important:
1. Identify ONLY works that were EXPLICITLY mentioned and recommended in the comments
2. NEVER recommend the anime/manga mentioned in the search itself (${topic})
3. SELECT ONLY works that have a CLEAR CONNECTION to at least one key element of the search topic
4. For each work, EXPLICITLY state which elements from the search topic it contains
5. Each reason should explain HOW the work satisfies specific elements of the user's request
6. Base yourself only on information present in the comments
7. Limit yourself to a maximum of 10 recommendations to ensure a complete response
8. Prioritize works that are mentioned more often or have more upvotes
9. Return ONLY the JSON, without additional text
10. Use the official English or Japanese name of the works, do not translate to Portuguese
11. AVOID generic and repetitive phrases - each reason should be unique and specific
12. If there are not enough relevant comments for the theme, return an empty array of recommendations
13. IMPORTANT: Write all explanations in ${languageName}, but keep the titles of the works in the original language
14. DO NOT just summarize the plot - explain WHY the work is relevant to the search topic
15. Use natural and varied language for each reason, as if you were explaining to a friend
16. Each reason should be between 100-200 characters, being concise but informative
17. ONLY mention elements that were ACTUALLY in the original search query - DO NOT INVENT elements
18. PRIORITIZE works that match MULTIPLE elements from the search topic
19. Each work must have EXACTLY 3 reasons: 
    - First reason: How it connects to specific elements of the search topic
    - Second reason: Clearly state which requested elements from the search topic are present in this work and which are absent
    - Third reason: Summarize the average opinion from commenters about this recommendation
20. Calculate the "relevanceScore" (0-100) STRICTLY based on how many elements of the search topic the work matches:
    - If the work contains ALL elements from the search topic, give it a score of 90-100
    - If the work contains MOST elements from the search topic, give it a score of 70-89
    - If the work contains SOME elements from the search topic, give it a score of 40-69
    - If the work contains FEW elements from the search topic, give it a score of 10-39
21. DO NOT consider commenter opinions when calculating the relevanceScore - base it ONLY on objective matching of requested elements
22. Sort the recommendations array by relevanceScore in descending order (most relevant first)
23. IMPORTANT: For a search topic like "romance and nerdy male protagonist", a work with BOTH romance AND a nerdy male protagonist should score 90-100, while a work with ONLY romance OR ONLY a nerdy protagonist should score 40-69
24. The more elements from the search topic that are present, the higher the score should be
25. When mentioning absent elements, ONLY refer to elements that were ACTUALLY in the original search query
`;

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured.');
      throw new Error('Gemini API not configured. Check your environment variables.');
    }

    try {
      // Prepare the payload for the API
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048
        }
      };

      // Call to Gemini API using the correct format
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the generated text
      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Clean the text to ensure it's valid JSON
      const cleanedText = generatedText.trim()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Parse the JSON
      try {
        // Check if the text appears to be a complete JSON
        if (!cleanedText.endsWith('}')) {
          console.error('Incomplete JSON response received from API');
          throw new Error('Incomplete response from Gemini API');
        }
        
        const summary = JSON.parse(cleanedText);
        
        // Check if the JSON has the expected structure
        if (!summary.recommendations || !Array.isArray(summary.recommendations)) {
          console.error('Invalid JSON structure received from API');
          throw new Error('Invalid response structure from Gemini API');
        }
        
        return summary;
      } catch (parseError) {
        console.error('Error parsing JSON returned by AI:', parseError);
        console.log('Returned text:', cleanedText);
        throw new Error('Failed to process Gemini API response. Invalid response format.');
      }
    } catch (apiError) {
      console.error('Error in Gemini API call:', apiError);
      console.error('Error details:', apiError.response?.data || apiError.message);
      throw new Error('Failed to generate recommendations with Gemini API. Please try again.');
    }
  } catch (error) {
    console.error('Error generating summary with AI:', error);
    throw error;
  }
};

module.exports = {
  optimizeSearchQuery,
  generateSummary
}; 