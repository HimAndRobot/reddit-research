<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold">Debug Information</h1>
        <button 
          @click="$router.push('/')" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Back to Results
        </button>
      </div>
      
      <!-- Timeline -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-6">Processing Timeline</h2>
        
        <div class="space-y-6">
          <!-- User Query -->
          <timeline-item 
            icon="search" 
            title="User Query" 
            :status="'completed'"
          >
            <div class="space-y-2">
              <p><strong>Topic:</strong> "{{ topic }}" in category {{ category }}</p>
              <p><strong>Language:</strong> {{ language }}</p>
              <p><strong>Timestamp:</strong> {{ timestamp }}</p>
            </div>
          </timeline-item>
          
          <!-- Reddit Search -->
          <timeline-item 
            icon="reddit" 
            title="Reddit Search" 
            :status="redditStatus"
          >
            <div class="space-y-2">
              <p><strong>Subreddit:</strong> {{ subreddit }}</p>
              <p><strong>Search Query:</strong> "{{ searchQuery }}"</p>
              <p><strong>Posts Found:</strong> {{ searchResults.length }}</p>
              
              <div v-if="searchResults.length > 0">
                <h4 class="font-medium mt-3 mb-2">Search Results:</h4>
                <div class="bg-gray-800 p-3 rounded-md max-h-60 overflow-y-auto">
                  <ul class="list-disc pl-5 space-y-2">
                    <li v-for="(result, index) in searchResults" :key="index">
                      <a 
                        :href="result.url" 
                        target="_blank" 
                        class="text-blue-400 hover:underline"
                      >
                        {{ result.title }}
                      </a>
                      <span class="text-gray-400 text-sm ml-2">
                        ({{ result.commentCount }} comments)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <p v-else class="text-yellow-500">No search results found.</p>
            </div>
          </timeline-item>
          
          <!-- Comment Aggregation -->
          <timeline-item 
            icon="comments" 
            title="Comment Aggregation" 
            :status="aggregateStatus"
          >
            <div class="space-y-2">
              <p><strong>Comments Collected:</strong> {{ commentCount }}</p>
              
              <div v-if="aggregatedComments">
                <div class="flex justify-between items-center mt-3 mb-2">
                  <h4 class="font-medium">Aggregated Text:</h4>
                  <button 
                    @click="copyToClipboard(aggregatedComments)" 
                    class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    {{ copyButtonText }}
                  </button>
                </div>
                <div class="bg-gray-800 p-3 rounded-md max-h-60 overflow-y-auto">
                  <p class="whitespace-pre-wrap text-sm">{{ aggregatedComments }}</p>
                </div>
              </div>
              <p v-else class="text-yellow-500">No comments aggregated.</p>
            </div>
          </timeline-item>
          
          <!-- AI Analysis -->
          <timeline-item 
            icon="robot" 
            title="AI Analysis" 
            :status="aiStatus"
          >
            <div class="space-y-2">
              <p><strong>AI Model:</strong> Gemini Pro</p>
              <p><strong>Recommendations Found:</strong> {{ recommendationsCount }}</p>
              
              <div v-if="recommendations.length > 0">
                <h4 class="font-medium mt-3 mb-2">Identified Recommendations:</h4>
                <div class="bg-gray-800 p-3 rounded-md max-h-60 overflow-y-auto">
                  <ul class="list-disc pl-5 space-y-3">
                    <li v-for="(rec, index) in recommendations" :key="index">
                      <span class="font-medium">{{ rec.title }}</span>
                      <ul class="list-circle pl-5 mt-1 space-y-1">
                        <li v-for="(reason, rIndex) in rec.reasons" :key="rIndex" class="text-sm text-gray-300">
                          {{ reason }}
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <p v-else class="text-yellow-500">No recommendations identified.</p>
            </div>
          </timeline-item>
          
          <!-- External API Enrichment -->
          <timeline-item 
            icon="database" 
            title="External API Enrichment" 
            :status="enrichStatus"
          >
            <div class="space-y-2">
              <p><strong>API:</strong> {{ apiName }}</p>
              <p><strong>Enriched Items:</strong> {{ enrichedCount }}</p>
              
              <div v-if="enrichedRecommendations.length > 0">
                <h4 class="font-medium mt-3 mb-2">Enriched Data:</h4>
                <div class="bg-gray-800 p-3 rounded-md max-h-60 overflow-y-auto">
                  <ul class="list-disc pl-5 space-y-3">
                    <li v-for="(rec, index) in enrichedRecommendations" :key="index">
                      <div class="flex items-start">
                        <img 
                          v-if="rec.image" 
                          :src="rec.image" 
                          :alt="rec.title" 
                          class="w-16 h-auto rounded mr-3"
                        />
                        <div>
                          <span class="font-medium">{{ rec.title }}</span>
                          <div class="text-sm text-gray-300 mt-1">
                            <p v-if="rec.score">Score: {{ rec.score }}</p>
                            <p v-if="rec.year">Year: {{ rec.year }}</p>
                            <p v-if="rec.genres && rec.genres.length">
                              Genres: {{ rec.genres.join(', ') }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <p v-else class="text-yellow-500">No enriched data available.</p>
            </div>
          </timeline-item>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TimelineItem from '@/components/TimelineItem.vue'

export default {
  name: 'Debug',
  components: {
    TimelineItem
  },
  setup() {
    const route = useRoute()
    
    // Data from route params
    const topic = ref(route.query.topic || 'Not specified')
    const category = ref(route.query.category || 'anime')
    const language = ref(route.query.language || 'en')
    const timestamp = ref(new Date().toLocaleString())
    
    // Status states
    const redditStatus = ref('waiting')
    const aggregateStatus = ref('waiting')
    const aiStatus = ref('waiting')
    const enrichStatus = ref('waiting')
    
    // Data
    const subreddit = ref('')
    const searchQuery = ref('')
    const searchResults = ref([])
    const commentCount = ref(0)
    const aggregatedComments = ref('')
    const recommendations = ref([])
    const recommendationsCount = ref(0)
    const apiName = ref('Jikan API (MyAnimeList)')
    const enrichedCount = ref(0)
    const enrichedRecommendations = ref([])
    
    // UI
    const copyButtonText = ref('Copy Text')
    
    // Copy to clipboard function
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text)
        .then(() => {
          copyButtonText.value = 'Copied!'
          setTimeout(() => {
            copyButtonText.value = 'Copy Text'
          }, 2000)
        })
        .catch(err => {
          console.error('Failed to copy text: ', err)
          copyButtonText.value = 'Failed to copy'
          setTimeout(() => {
            copyButtonText.value = 'Copy Text'
          }, 2000)
        })
    }
    
    // Load debug data
    onMounted(() => {
      // In a real implementation, this would load data from an API or local storage
      // For now, we'll use mock data
      
      // Simulate loading data
      setTimeout(() => {
        redditStatus.value = 'completed'
        subreddit.value = 'Animesuggest'
        searchQuery.value = topic.value
        searchResults.value = [
          { title: 'Looking for anime similar to Attack on Titan', url: '#', commentCount: 45 },
          { title: 'What are some good psychological anime?', url: '#', commentCount: 32 },
          { title: 'Recommend me some underrated anime', url: '#', commentCount: 28 }
        ]
        
        aggregateStatus.value = 'completed'
        commentCount.value = 105
        aggregatedComments.value = 'User1: I highly recommend Death Note if you like psychological anime.\n\nUser2: You should check out Steins;Gate, it has a great story and characters.\n\nUser3: Fullmetal Alchemist: Brotherhood is a must-watch for any anime fan.'
        
        aiStatus.value = 'completed'
        recommendations.value = [
          { 
            title: 'Death Note', 
            reasons: [
              'Psychological thriller with complex characters',
              'Strategic mind games similar to what you might enjoy',
              'Highly rated in the community'
            ]
          },
          { 
            title: 'Steins;Gate', 
            reasons: [
              'Intricate plot with time travel elements',
              'Strong character development',
              'Psychological elements that build tension'
            ]
          }
        ]
        recommendationsCount.value = recommendations.value.length
        
        enrichStatus.value = 'completed'
        enrichedRecommendations.value = [
          {
            title: 'Death Note',
            image: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg',
            score: 8.62,
            year: 2006,
            genres: ['Mystery', 'Psychological', 'Supernatural', 'Thriller']
          },
          {
            title: 'Steins;Gate',
            image: 'https://cdn.myanimelist.net/images/anime/5/73199.jpg',
            score: 9.08,
            year: 2011,
            genres: ['Drama', 'Sci-Fi', 'Thriller']
          }
        ]
        enrichedCount.value = enrichedRecommendations.value.length
      }, 1000)
    })
    
    return {
      // Data
      topic,
      category,
      language,
      timestamp,
      redditStatus,
      aggregateStatus,
      aiStatus,
      enrichStatus,
      subreddit,
      searchQuery,
      searchResults,
      commentCount,
      aggregatedComments,
      recommendations,
      recommendationsCount,
      apiName,
      enrichedCount,
      enrichedRecommendations,
      
      // Methods
      copyToClipboard,
      copyButtonText
    }
  }
}
</script>

<style scoped>
.debug-screen {
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style> 