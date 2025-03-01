const axios = require('axios');
const fs = require('fs');
const path = require('path');

// List of supported subreddits
const SUPPORTED_SUBREDDITS = [
  'Animesuggest',
  'anime',
  'manga',
  'LightNovels',
  'manhwa',
  'manhua',
  'webtoons',
  'Donghua',
  'AnimeFigures',
  'AnimeART',
  'AnimeWallpaper',
  'AnimeSketch',
  'AnimeRecommendations',
  'AnimeDubs',
  'AnimeNews',
  'AnimeMusicVideos',
  'AnimeMemes',
  'AnimeFunny',
  'AnimeGifs',
  'AnimeWallpapersSFW',
  'kdramarecommends',
  'KDRAMA',
  'koreanvariety',
  'kpophelp'
  // Add more subreddits as needed
];

// Path to store rate limit and token information
const DATA_DIR = path.join(__dirname, '../data');
const RATE_LIMIT_FILE = path.join(DATA_DIR, 'redditRateLimit.json');
const TOKEN_FILE = path.join(DATA_DIR, 'redditTokens.json');

// Rate limit configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 500,
  WINDOW_MINUTES: 10
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize tokens
const loadTokens = () => {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading token file:', error);
  }
  
  return {
    client1: {
      accessToken: null,
      expiresAt: 0
    },
    client2: {
      accessToken: null,
      expiresAt: 0
    }
  };
};

// Save tokens
const saveTokens = (tokens) => {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error saving token file:', error);
  }
};

// Initialize or load rate limit tracking
const initializeRateLimitTracking = () => {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      return JSON.parse(fs.readFileSync(RATE_LIMIT_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading rate limit file:', error);
  }

  // Default structure if file doesn't exist or can't be read
  const defaultTracking = {
    client1: {
      requestCount: 0,
      windowStartTime: Date.now()
    },
    client2: {
      requestCount: 0,
      windowStartTime: Date.now()
    }
  };

  // Save default tracking
  fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(defaultTracking, null, 2));
  return defaultTracking;
};

// Save rate limit tracking to file
const saveRateLimitTracking = (tracking) => {
  try {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(tracking, null, 2));
  } catch (error) {
    console.error('Error saving rate limit file:', error);
  }
};

// Get access token for Reddit API
const getAccessToken = async (clientNumber) => {
  const tokens = loadTokens();
  const clientKey = `client${clientNumber}`;
  const now = Date.now();
  
  // Check if we have a valid token
  if (tokens[clientKey].accessToken && tokens[clientKey].expiresAt > now) {
    return tokens[clientKey].accessToken;
  }
  
  // Need to get a new token
  try {
    const clientId = process.env[`REDDIT_CLIENT_ID_${clientNumber}`];
    const clientSecret = process.env[`REDDIT_CLIENT_SECRET_${clientNumber}`];
    const username = process.env.REDDIT_USERNAME;
    const password = process.env.REDDIT_PASSWORD;
    
    console.log(`Getting new access token for client ${clientNumber}`);
    console.log(`Using credentials: ID=${clientId}, Secret=${clientSecret.substring(0, 3)}***, Username=${username}`);
    
    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'reddit-research-app/1.0.0 (by /u/geanpn0)'
        }
      }
    );
    
    if (!response.data.access_token) {
      console.error('Reddit API response:', response.data);
      throw new Error(`No access token received from Reddit API for client ${clientNumber}`);
    }
    
    const { access_token, expires_in } = response.data;
    
    // Save the new token
    tokens[clientKey] = {
      accessToken: access_token,
      expiresAt: now + (expires_in * 1000) - 60000 // Subtract 1 minute for safety
    };
    
    saveTokens(tokens);
    return access_token;
  } catch (error) {
    console.error(`Error getting access token for client ${clientNumber}:`, error.response ? error.response.data : error.message);
    
    // If client 1 fails and we're trying client 1, try client 2 instead
    if (clientNumber === 1) {
      console.log('Trying to fall back to client 2...');
      return getAccessToken(2);
    }
    
    return null;
  }
};

// Get available client number based on rate limits
const getAvailableClientNumber = () => {
  let tracking = initializeRateLimitTracking();
  const now = Date.now();
  
  // Check if window has reset for client 1
  if (now - tracking.client1.windowStartTime > RATE_LIMIT.WINDOW_MINUTES * 60 * 1000) {
    tracking.client1 = {
      requestCount: 0,
      windowStartTime: now
    };
  }
  
  // Check if window has reset for client 2
  if (now - tracking.client2.windowStartTime > RATE_LIMIT.WINDOW_MINUTES * 60 * 1000) {
    tracking.client2 = {
      requestCount: 0,
      windowStartTime: now
    };
  }
  
  // Try to use client 1 first
  if (tracking.client1.requestCount < RATE_LIMIT.MAX_REQUESTS) {
    tracking.client1.requestCount++;
    saveRateLimitTracking(tracking);
    return 1;
  }
  
  // Fall back to client 2
  if (tracking.client2.requestCount < RATE_LIMIT.MAX_REQUESTS) {
    tracking.client2.requestCount++;
    saveRateLimitTracking(tracking);
    return 2;
  }
  
  // Both clients are exhausted
  return 0;
};

/**
 * Searches for posts on Reddit related to the provided topic
 * @param {string} query - The optimized search query
 * @param {string} subreddit - The subreddit to search (optional)
 * @returns {Object} Search results
 */
const searchReddit = async (query, subreddit = 'Animesuggest') => {
  try {
    // Check if the subreddit is supported
    if (!SUPPORTED_SUBREDDITS.includes(subreddit)) {
      throw new Error(`Unsupported subreddit: ${subreddit}`);
    }

    // Get available client number
    const clientNumber = getAvailableClientNumber();
    
    if (clientNumber === 0) {
      throw new Error('Rate limit exceeded for all Reddit API clients. Please try again later.');
    }

    // Get access token
    const accessToken = await getAccessToken(clientNumber);
    
    if (!accessToken) {
      throw new Error(`Failed to authenticate with Reddit API (client ${clientNumber})`);
    }

    // Search for posts related to the topic
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'searching_posts',
        message: `Searching Reddit posts with query: ${query} (using client ${clientNumber})`,
        progress: 30
      });
    }
    
    const response = await axios.get(`https://oauth.reddit.com/r/${subreddit}/search`, {
      params: {
        q: query,
        sort: 'relevance',
        t: 'all',
        limit: 5,
        restrict_sr: 'on'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'reddit-research-app v1.0.0'
      }
    });

    const posts = response.data.data.children;
    
    if (!posts || posts.length === 0) {
      if (global.sendStatusUpdate) {
        global.sendStatusUpdate({
          type: 'status',
          status: 'no_posts',
          message: 'No posts found on Reddit for this search',
          progress: 100
        });
      }
      
      return {
        searchResults: [],
        allComments: []
      };
    }

    // Array to store all collected comments
    let allComments = [];
    let searchResults = [];
    
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'collecting_comments',
        message: `Collecting comments from ${posts.length} posts found`,
        progress: 35
      });
    }
    
    // For each post found, get the comments
    let processedPosts = 0;
    for (const post of posts) {
      const postData = post.data;
      
      // Add the post to the results
      searchResults.push({
        id: postData.id,
        title: postData.title,
        url: `https://www.reddit.com${postData.permalink}`,
        author: postData.author,
        score: postData.score,
        commentCount: postData.num_comments,
        created: new Date(postData.created_utc * 1000).toISOString()
      });
      
      // Get comments from the post - check rate limits again for each request
      try {
        // Get available client number for this comment request
        const commentClientNumber = getAvailableClientNumber();
        
        if (commentClientNumber === 0) {
          throw new Error('Rate limit exceeded for all Reddit API clients. Please try again later.');
        }
        
        // Get access token for comments
        const commentAccessToken = await getAccessToken(commentClientNumber);
        
        if (!commentAccessToken) {
          throw new Error(`Failed to authenticate with Reddit API for comments (client ${commentClientNumber})`);
        }
        
        const commentsResponse = await axios.get(`https://oauth.reddit.com${postData.permalink}`, {
          headers: {
            'Authorization': `Bearer ${commentAccessToken}`,
            'User-Agent': 'reddit-research-app v1.0.0'
          }
        });
        
        const commentsData = commentsResponse.data[1].data.children;
        
        // Process comments
        commentsData.forEach(commentObj => {
          if (commentObj.kind === 't1') { // t1 is the type for comments
            const comment = commentObj.data;
            
            if (comment.body && comment.body.length > 20) {
              // Store main comment with metadata
              allComments.push({
                type: 'main',
                body: comment.body,
                author: comment.author,
                score: comment.score
              });
              
              // Process replies to the comment (first level only)
              if (comment.replies && comment.replies.data && comment.replies.data.children) {
                comment.replies.data.children.forEach(replyObj => {
                  if (replyObj.kind === 't1') {
                    const reply = replyObj.data;
                    if (reply.body && reply.body.length > 20) {
                      // Store reply with reference to the main comment
                      allComments.push({
                        type: 'reply',
                        body: reply.body,
                        author: reply.author,
                        score: reply.score,
                        parentAuthor: comment.author
                      });
                    }
                  }
                });
              }
            }
          }
        });
        
        // Add the post title to the comments
        allComments.push(`Post title: ${postData.title}`);
        
        // Update progress
        processedPosts++;
        if (global.sendStatusUpdate && processedPosts % 3 === 0) {
          const progress = Math.min(35 + Math.floor((processedPosts / posts.length) * 15), 49);
          global.sendStatusUpdate({
            type: 'status',
            status: 'collecting_comments',
            message: `Collecting comments: ${processedPosts}/${posts.length} posts processed (using client ${commentClientNumber})`,
            progress
          });
        }
      } catch (commentError) {
        console.error(`Error fetching comments for post ${postData.id}:`, commentError);
      }
    }
    
    if (global.sendStatusUpdate) {
      global.sendStatusUpdate({
        type: 'status',
        status: 'comments_collected',
        message: `Collected ${allComments.length} comments from ${posts.length} posts`,
        progress: 50
      });
    }
    
    return {
      searchResults,
      allComments
    };
  } catch (error) {
    console.error('Error fetching data from Reddit:', error);
    throw error;
  }
};

/**
 * Aggregates comments into a coherent text
 * @param {Array} comments - List of comments to be aggregated
 * @returns {string} Aggregated text
 */
const aggregateComments = (comments) => {
  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    return 'No comments found to aggregate.';
  }
  
  // Filter empty or very short comments
  const filteredComments = comments.filter(comment => 
    comment && (
      // Handle object comments
      (typeof comment === 'object' && comment.body && comment.body.length > 20) ||
      // Handle string comments (like post titles)
      (typeof comment === 'string' && comment.length > 0)
    )
  );
  
  if (filteredComments.length === 0) {
    return 'No relevant comments found to aggregate.';
  }
  
  // Extract post titles
  const postTitles = filteredComments.filter(comment => typeof comment === 'string');
  
  // Group comments by main comment and their replies
  const mainComments = filteredComments.filter(comment => typeof comment === 'object' && comment.type === 'main');
  const replyComments = filteredComments.filter(comment => typeof comment === 'object' && comment.type === 'reply');
  
  // Create a structured array with main comments and their nested replies
  const structuredComments = [];
  
  // Add post titles first
  postTitles.forEach(title => {
    structuredComments.push(title);
  });
  
  // Process main comments and their replies
  mainComments.forEach(mainComment => {
    // Find all replies for this main comment
    const replies = replyComments.filter(reply => reply.parentAuthor === mainComment.author);
    
    // Create a copy of the main comment with replies nested inside
    const commentWithReplies = {
      type: mainComment.type,
      body: mainComment.body,
      author: mainComment.author,
      score: mainComment.score,
      replies: replies.map(reply => ({
        body: reply.body,
        author: reply.author,
        score: reply.score
      }))
    };
    
    // Add to the structured comments array
    structuredComments.push(commentWithReplies);
  });
  
  // Convert to JSON string with proper formatting
  return structuredComments;
};

/**
 * Returns the list of supported subreddits
 * @returns {Array} List of supported subreddits
 */
const getSupportedSubreddits = () => {
  return SUPPORTED_SUBREDDITS;
};

/**
 * Returns the current rate limit status
 * @returns {Object} Current rate limit information
 */
const getRateLimitStatus = () => {
  const tracking = initializeRateLimitTracking();
  const now = Date.now();
  
  // Calculate time remaining in current window
  const client1TimeRemaining = Math.max(0, 
    RATE_LIMIT.WINDOW_MINUTES * 60 * 1000 - (now - tracking.client1.windowStartTime)
  );
  
  const client2TimeRemaining = Math.max(0, 
    RATE_LIMIT.WINDOW_MINUTES * 60 * 1000 - (now - tracking.client2.windowStartTime)
  );
  
  return {
    client1: {
      requestCount: tracking.client1.requestCount,
      maxRequests: RATE_LIMIT.MAX_REQUESTS,
      windowStartTime: new Date(tracking.client1.windowStartTime).toISOString(),
      timeRemainingMs: client1TimeRemaining,
      timeRemainingMinutes: Math.ceil(client1TimeRemaining / 60000)
    },
    client2: {
      requestCount: tracking.client2.requestCount,
      maxRequests: RATE_LIMIT.MAX_REQUESTS,
      windowStartTime: new Date(tracking.client2.windowStartTime).toISOString(),
      timeRemainingMs: client2TimeRemaining,
      timeRemainingMinutes: Math.ceil(client2TimeRemaining / 60000)
    }
  };
};

module.exports = {
  searchReddit,
  aggregateComments,
  getSupportedSubreddits,
  getRateLimitStatus
}; 