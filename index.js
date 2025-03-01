require('dotenv').config();
const express = require('express');
const path = require('path');
const orchestratorService = require('./services/orchestratorService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to process JSON with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add CORS headers to allow requests from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Store SSE connections
const sseClients = new Set();

// Global function to send status updates to all connected clients
global.sendStatusUpdate = (data) => {
  const eventData = JSON.stringify(data);
  sseClients.forEach(client => {
    client.write(`data: ${eventData}\n\n`);
  });
};

// SSE endpoint for real-time status updates
app.get('/api/status-updates', (req, res) => {
  // Configure headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send an initial event to confirm connection
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connection established' })}\n\n`);
  
  // Add client to the list of connections
  sseClients.add(res);
  
  // Remove client when connection is closed
  req.on('close', () => {
    sseClients.delete(res);
    console.log('SSE client disconnected, total connections:', sseClients.size);
  });
  
  console.log('New SSE client connected, total connections:', sseClients.size);
});

// Serve static files from Vue.js
app.use(express.static(path.join(__dirname, 'dist')));

// API to get supported subreddits
app.get('/api/subreddits', (req, res) => {
  try {
    const subreddits = orchestratorService.getSupportedSubreddits();
    return res.json({ subreddits });
  } catch (error) {
    console.error('Error getting supported subreddits:', error);
    return res.status(500).json({ error: 'Error getting supported subreddits' });
  }
});

// API to get supported categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = orchestratorService.getSupportedCategories();
    return res.json({ categories });
  } catch (error) {
    console.error('Error getting supported categories:', error);
    return res.status(500).json({ error: 'Error getting supported categories' });
  }
});

// API to search, aggregate and generate summary in a single call
app.post('/api/search-and-summarize', async (req, res) => {
  try {
    const { topic, category = 'anime', language = 'pt' } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'A topic for search is required' });
    }
    
    // Send initial status
    global.sendStatusUpdate({ 
      type: 'status', 
      status: 'starting',
      message: `Starting search for: ${topic} (${category})`,
      progress: 10
    });
    
    // Use orchestratorService to perform the entire process
    const results = await orchestratorService.searchAndGenerateRecommendations(topic, category, language);
    
    // Check if there are results
    if (!results.searchResults || results.searchResults.length === 0) {
      global.sendStatusUpdate({ 
        type: 'status', 
        status: 'no_results',
        message: `No results found for: ${topic} (${category})`,
        progress: 100
      });
      
      return res.status(404).json({ 
        error: 'No results found for this topic',
        topic,
        category,
        searchResults: [],
        summary: null
      });
    }
    
    // Return complete results
    return res.json({
      topic: results.topic,
      category: results.category,
      searchResults: results.searchResults,
      summary: results.summary
    });
  } catch (error) {
    console.error('Error processing search and summary:', error);
    
    global.sendStatusUpdate({ 
      type: 'status', 
      status: 'error',
      message: `Error processing: ${error.message}`,
      progress: 100
    });
    
    return res.status(500).json({ error: 'Error processing search and summary', message: error.message });
  }
});

// API to aggregate comments
app.post('/api/aggregate', async (req, res) => {
  try {
    const { comments } = req.body;
    
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ error: 'Comments are required for aggregation' });
    }
    
    const aggregatedText = redditService.aggregateComments(comments);
    return res.json({ aggregatedText });
  } catch (error) {
    console.error('Error aggregating comments:', error);
    return res.status(500).json({ error: 'Error aggregating comments' });
  }
});

// API to generate summary with AI
app.post('/api/generate-summary', async (req, res) => {
  try {
    const { aggregatedText, topic } = req.body;
    
    if (!aggregatedText) {
      return res.status(400).json({ error: 'Aggregated text is required to generate summary' });
    }
    
    const summary = await redditService.generateAISummary(aggregatedText, topic);
    return res.json({ summary });
  } catch (error) {
    console.error('Error generating summary with AI:', error);
    return res.status(500).json({ error: 'Error generating summary with AI', message: error.message });
  }
});

// Route for all other requests - Serves the Vue.js app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}`);
}); 