<template>
  <div class="min-h-screen flex flex-col">
    <!-- Hero Section com Background -->
    <div class="flex-1 bg-cover bg-center relative" style="background-image: url('/images/anime-collage-bg.jpg')">
      <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
      
      <div class="container mx-auto px-4 py-16 relative z-10 flex flex-col items-center justify-center min-h-screen">
        <div class="max-w-3xl mx-auto text-center mb-12">
          <h1 class="text-5xl md:text-6xl font-bold mb-4 text-white animate-fade-in">RecommendIt</h1>
          <p class="text-xl md:text-2xl text-white/80 animate-fade-in animation-delay-200">
            Discover new recommendations based on Reddit discussions
          </p>
        </div>
        
        <!-- Search Form -->
        <div class="w-full max-w-2xl mx-auto animate-fade-in animation-delay-400">
          <form @submit.prevent="searchReddit" class="space-y-6">
            <div class="relative">
              <div class="flex items-center bg-white/10 backdrop-blur-md rounded-full overflow-hidden border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-white/30">
                <div class="flex-shrink-0 pl-5">
                  <i class="fas fa-search text-white/70"></i>
                </div>
                <input 
                  type="text" 
                  id="topic" 
                  v-model="topic" 
                  placeholder="What are you looking for?" 
                  class="w-full px-4 py-4 bg-transparent border-none text-white placeholder-white/70 focus:outline-none text-lg"
                  required
                >
                <div class="flex-shrink-0 border-l border-white/20 px-4 py-4 cursor-pointer" @click="toggleCategoryMenu">
                  <div class="flex items-center text-white/80 hover:text-white">
                    <span class="mr-2">{{ getCategoryDisplayName(category) }}</span>
                    <i class="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
                <div class="flex-shrink-0 border-l border-white/20 px-4 py-4 cursor-pointer" @click="toggleLanguageMenu">
                  <div class="flex items-center text-white/80 hover:text-white">
                    <i :class="languageIcon" class="mr-2"></i>
                    <i class="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>
              
              <!-- Category Dropdown -->
              <div 
                v-if="showCategoryMenu" 
                class="absolute left-0 right-0 mt-2 bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 z-20 max-h-60 overflow-y-auto animate-fade-in-down"
              >
                <div class="p-2">
                  <div 
                    v-for="cat in categories" 
                    :key="cat" 
                    @click="selectCategory(cat)"
                    class="px-4 py-2 rounded-lg text-white hover:bg-white/20 cursor-pointer transition-colors"
                    :class="category === cat ? 'bg-white/20' : ''"
                  >
                    {{ getCategoryDisplayName(cat) }}
                  </div>
                </div>
              </div>
              
              <!-- Language Dropdown -->
              <div 
                v-if="showLanguageMenu" 
                class="absolute right-0 mt-2 bg-white/10 backdrop-blur-md rounded-xl shadow-xl border border-white/20 z-20 animate-fade-in-down"
                style="min-width: 180px"
              >
                <div class="p-2">
                  <div 
                    v-for="(lang, code) in languages" 
                    :key="code" 
                    @click="selectLanguage(code)"
                    class="px-4 py-2 rounded-lg text-white hover:bg-white/20 cursor-pointer transition-colors flex items-center"
                    :class="language === code ? 'bg-white/20' : ''"
                  >
                    <i :class="lang.icon" class="mr-3"></i>
                    <span>{{ lang.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <button 
                type="submit" 
                class="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                :disabled="isLoading"
              >
                <span v-if="!isLoading" class="flex items-center">
                  <i class="fas fa-search mr-2"></i>
                  Search Recommendations
                </span>
                <span v-else class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-6"></div>
        <p class="text-xl text-white font-medium mb-2">{{ statusMessage }}</p>
        <div class="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${statusProgress}%` }"></div>
        </div>
        <p class="text-white/70 mb-4">{{ statusDetail }}</p>
        
        <!-- Preview do item atual sendo processado -->
        <div v-if="currentItem && currentItem.title" class="mt-6 bg-black/30 rounded-lg p-4 flex items-center">
          <div class="w-16 h-20 bg-gray-800 rounded-md overflow-hidden flex-shrink-0 mr-4">
            <img v-if="currentItem.image" :src="currentItem.image" :alt="currentItem.title" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center">
              <i class="fas fa-image text-gray-600"></i>
            </div>
          </div>
          <div class="text-left">
            <p class="text-white font-medium">{{ currentItem.title }}</p>
            <p class="text-blue-400 text-sm">
              <i class="fas fa-search mr-1"></i> Buscando informações
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Results Section -->
    <div v-if="showResults" class="min-h-screen bg-gray-900 py-12 animate-fade-in">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">
              Recommendations for you
            </h2>
            <p class="text-gray-400">
              <span class="font-medium">Category:</span> 
              <span>{{ getCategoryDisplayName(category) }}</span> | 
              <span class="font-medium">Language:</span> 
              <span>{{ languages[language]?.name || language }}</span>
            </p>
          </div>
          
          <div class="flex flex-wrap gap-3 mt-4 md:mt-0">
            <!-- Filter by Genre -->
            <div class="relative">
              <button 
                @click="toggleGenreFilter" 
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-gray-300 flex items-center transition-colors"
              >
                <i class="fas fa-filter mr-2"></i> Filter by Genre
                <i class="fas fa-chevron-down ml-2 text-xs"></i>
              </button>
              
              <div 
                v-if="showGenreFilter" 
                class="absolute right-0 mt-2 w-72 bg-gray-800 rounded-xl shadow-xl z-10 p-4 border border-gray-700 animate-fade-in-down"
              >
                <div class="mb-3 pb-3 border-b border-gray-700">
                  <div class="text-sm font-medium text-gray-300 mb-2">Genres</div>
                  <div class="flex flex-wrap gap-2">
                    <button 
                      v-for="genre in genres" 
                      :key="genre"
                      @click="toggleGenre(genre)"
                      class="px-3 py-1 text-xs rounded-full mb-1 transition-colors"
                      :class="selectedGenres.includes(genre) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                    >
                      {{ genre }}
                    </button>
                  </div>
                </div>
                <div class="flex justify-between">
                  <button 
                    @click="clearGenreFilters" 
                    class="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Clear filters
                  </button>
                  <button 
                    @click="applyFilters" 
                    class="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
            
            <!-- View Mode Toggle -->
            <div class="flex rounded-full overflow-hidden border border-gray-700 bg-gray-800">
              <button 
                @click="setViewMode('grid')" 
                class="px-3 py-2 flex items-center justify-center transition-colors"
                :class="viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
              >
                <i class="fas fa-th-large"></i>
              </button>
              <button 
                @click="setViewMode('list')" 
                class="px-3 py-2 flex items-center justify-center transition-colors"
                :class="viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
              >
                <i class="fas fa-list"></i>
              </button>
            </div>
            
            <!-- Debug Mode Button -->
            <button 
              @click="toggleDebugMode" 
              class="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-gray-300 flex items-center transition-colors"
            >
              <i class="fas fa-bug mr-2"></i> {{ showDebugMode ? 'Hide Debug' : 'Debug Mode' }}
            </button>
          </div>
        </div>
        
        <!-- Recommendations Grid/List -->
        <div 
          :class="{ 
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6': viewMode === 'grid',
            'space-y-4': viewMode === 'list'
          }"
          class="animate-fade-in"
        >
          <div v-if="filteredRecommendations.length === 0" class="col-span-full py-16 text-center">
            <div class="inline-block p-6 rounded-full bg-gray-800 mb-6">
              <i class="fas fa-search text-4xl text-gray-500"></i>
            </div>
            <p class="text-xl text-gray-400 mb-4">No recommendations found with the selected filters.</p>
            <button 
              @click="clearGenreFilters" 
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
            >
              Clear filters
            </button>
          </div>
          
          <recommendation-card 
            v-for="(recommendation, index) in filteredRecommendations" 
            :key="recommendation.id || recommendation.title" 
            :recommendation="recommendation"
            :view-mode="viewMode"
            :animation-delay="index * 100"
            @click="showDetails(recommendation)"
            class="cursor-pointer"
          />
        </div>
      </div>
    </div>
    
    <!-- Modal for Recommendation Details -->
    <div v-if="selectedRecommendation" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-800">
        <div class="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 class="text-xl font-bold text-white">Recommendation Details</h3>
          <button @click="selectedRecommendation = null" class="text-gray-400 hover:text-white transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex flex-col md:flex-row gap-8">
            <!-- Image -->
            <div class="w-full md:w-1/3 flex-shrink-0">
              <div class="bg-gray-800 rounded-xl overflow-hidden aspect-[3/4]">
                <img 
                  v-if="selectedRecommendation.image" 
                  :src="selectedRecommendation.image" 
                  :alt="selectedRecommendation.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <i class="fas fa-image text-gray-600 text-4xl"></i>
                </div>
              </div>
              
              <div class="mt-6 space-y-3">
                <div v-if="selectedRecommendation.score" class="flex items-center">
                  <span class="text-amber-400 font-bold text-2xl mr-2">{{ formatNumber(selectedRecommendation.score) }}</span>
                  <div class="flex">
                    <i class="fas fa-star text-amber-400"></i>
                  </div>
                </div>
                
                <div v-if="selectedRecommendation.type" class="text-gray-400">
                  <span class="font-medium text-gray-300">Type:</span> {{ selectedRecommendation.type }}
                </div>
                
                <div v-if="selectedRecommendation.episodes" class="text-gray-400">
                  <span class="font-medium text-gray-300">Episodes:</span> {{ selectedRecommendation.episodes }}
                </div>
                
                <div v-if="selectedRecommendation.year" class="text-gray-400">
                  <span class="font-medium text-gray-300">Year:</span> {{ selectedRecommendation.year }}
                </div>
              </div>
            </div>
            
            <!-- Details -->
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-white mb-6">{{ selectedRecommendation.title }}</h2>
              
              <div v-if="selectedRecommendation.synopsis" class="mb-6">
                <h4 class="text-lg font-medium text-gray-200 mb-2">Synopsis</h4>
                <p class="text-gray-400 leading-relaxed">{{ selectedRecommendation.synopsis }}</p>
              </div>
              
              <div v-if="selectedRecommendation.genres && selectedRecommendation.genres.length" class="mb-6">
                <h4 class="text-lg font-medium text-gray-200 mb-2">Genres</h4>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="(genre, index) in selectedRecommendation.genres" 
                    :key="index"
                    class="px-3 py-1 bg-gray-800 text-blue-400 rounded-full text-sm border border-gray-700"
                  >
                    {{ genre }}
                  </span>
                </div>
              </div>
              
              <div v-if="selectedRecommendation.reasons && selectedRecommendation.reasons.length" class="mb-6">
                <h4 class="text-lg font-medium text-gray-200 mb-2">Why we recommend</h4>
                <ul class="space-y-3">
                  <li v-for="(reason, index) in selectedRecommendation.reasons" :key="index" class="text-gray-400 flex">
                    <i class="fas fa-check-circle text-green-500 mr-3 mt-1 flex-shrink-0"></i>
                    <span>{{ reason }}</span>
                  </li>
                </ul>
              </div>
              
              <div v-if="selectedRecommendation.recommendedBy && selectedRecommendation.recommendedBy.length" class="mb-6">
                <h4 class="text-lg font-medium text-gray-200 mb-2">Recommended by</h4>
                <p class="text-gray-400">
                  This recommendation was mentioned by {{ selectedRecommendation.recommendedBy.length }} 
                  {{ selectedRecommendation.recommendedBy.length === 1 ? 'user' : 'users' }} on Reddit.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-4 border-t border-gray-800 flex justify-end">
          <button 
            @click="selectedRecommendation = null" 
            class="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    
    <!-- Debug Section -->
    <div v-if="showDebugMode" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-auto">
      <div class="bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-800">
        <div class="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 class="text-xl font-bold text-white">Debug Mode - Technical Details</h3>
          <button @click="toggleDebugMode" class="text-gray-400 hover:text-white transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Timeline of processing -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-6 text-white">Processing Timeline</h2>
            
            <div class="timeline space-y-6">
              <!-- Step 1: User Query -->
              <div class="relative pb-8">
                <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-700"></div>
                <div class="relative flex items-start space-x-3">
                  <div class="relative">
                    <span class="flex items-center justify-center w-8 h-8 rounded-full text-white bg-blue-600">
                      <i class="fas fa-search"></i>
                    </span>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between">
                      <h3 class="text-base font-medium text-white">User Query</h3>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                        Completed
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-400">Topic: "{{ topic }}" in category {{ getCategoryDisplayName(category) }}</p>
                    <div class="mt-2 bg-gray-800 rounded-lg p-4 text-gray-300">
                      <p><strong>Language:</strong> {{ languages[language]?.name || language }}</p>
                      <p><strong>Timestamp:</strong> {{ new Date().toISOString() }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Step 2: Search on Reddit -->
              <div class="relative pb-8">
                <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-700"></div>
                <div class="relative flex items-start space-x-3">
                  <div class="relative">
                    <span 
                      class="flex items-center justify-center w-8 h-8 rounded-full text-white"
                      :class="{
                        'bg-blue-600': debugStatus.reddit === 'active',
                        'bg-green-600': debugStatus.reddit === 'completed',
                        'bg-red-600': debugStatus.reddit === 'error',
                        'bg-gray-600': debugStatus.reddit === 'waiting'
                      }"
                    >
                      <i class="fab fa-reddit-alien"></i>
                    </span>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between">
                      <h3 class="text-base font-medium text-white">Search on Reddit</h3>
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="{
                          'bg-blue-900 text-blue-200': debugStatus.reddit === 'active',
                          'bg-green-900 text-green-200': debugStatus.reddit === 'completed',
                          'bg-red-900 text-red-200': debugStatus.reddit === 'error',
                          'bg-gray-700 text-gray-300': debugStatus.reddit === 'waiting'
                        }"
                      >
                        {{ getStatusText(debugStatus.reddit) }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-400">{{ debugMessages.reddit }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Step 3: Comment Aggregation -->
              <div class="relative pb-8">
                <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-700"></div>
                <div class="relative flex items-start space-x-3">
                  <div class="relative">
                    <span 
                      class="flex items-center justify-center w-8 h-8 rounded-full text-white"
                      :class="{
                        'bg-blue-600': debugStatus.aggregate === 'active',
                        'bg-green-600': debugStatus.aggregate === 'completed',
                        'bg-red-600': debugStatus.aggregate === 'error',
                        'bg-gray-600': debugStatus.aggregate === 'waiting'
                      }"
                    >
                      <i class="fas fa-align-left"></i>
                    </span>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between">
                      <h3 class="text-base font-medium text-white">Comment Aggregation</h3>
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="{
                          'bg-blue-900 text-blue-200': debugStatus.aggregate === 'active',
                          'bg-green-900 text-green-200': debugStatus.aggregate === 'completed',
                          'bg-red-900 text-red-200': debugStatus.aggregate === 'error',
                          'bg-gray-700 text-gray-300': debugStatus.aggregate === 'waiting'
                        }"
                      >
                        {{ getStatusText(debugStatus.aggregate) }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-400">{{ debugMessages.aggregate }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Step 4: AI Analysis -->
              <div class="relative pb-8">
                <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-700"></div>
                <div class="relative flex items-start space-x-3">
                  <div class="relative">
                    <span 
                      class="flex items-center justify-center w-8 h-8 rounded-full text-white"
                      :class="{
                        'bg-blue-600': debugStatus.ai === 'active',
                        'bg-green-600': debugStatus.ai === 'completed',
                        'bg-red-600': debugStatus.ai === 'error',
                        'bg-gray-600': debugStatus.ai === 'waiting'
                      }"
                    >
                      <i class="fas fa-robot"></i>
                    </span>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between">
                      <h3 class="text-base font-medium text-white">AI Analysis</h3>
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="{
                          'bg-blue-900 text-blue-200': debugStatus.ai === 'active',
                          'bg-green-900 text-green-200': debugStatus.ai === 'completed',
                          'bg-red-900 text-red-200': debugStatus.ai === 'error',
                          'bg-gray-700 text-gray-300': debugStatus.ai === 'waiting'
                        }"
                      >
                        {{ getStatusText(debugStatus.ai) }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-400">{{ debugMessages.ai }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Step 5: External API Enrichment -->
              <div class="relative">
                <div class="relative flex items-start space-x-3">
                  <div class="relative">
                    <span 
                      class="flex items-center justify-center w-8 h-8 rounded-full text-white"
                      :class="{
                        'bg-blue-600': debugStatus.jikan === 'active',
                        'bg-green-600': debugStatus.jikan === 'completed',
                        'bg-red-600': debugStatus.jikan === 'error',
                        'bg-gray-600': debugStatus.jikan === 'waiting'
                      }"
                    >
                      <i class="fas fa-database"></i>
                    </span>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between">
                      <h3 class="text-base font-medium text-white">External API Enrichment</h3>
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="{
                          'bg-blue-900 text-blue-200': debugStatus.jikan === 'active',
                          'bg-green-900 text-green-200': debugStatus.jikan === 'completed',
                          'bg-red-900 text-red-200': debugStatus.jikan === 'error',
                          'bg-gray-700 text-gray-300': debugStatus.jikan === 'waiting'
                        }"
                      >
                        {{ getStatusText(debugStatus.jikan) }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-400">{{ debugMessages.jikan }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Summary of Recommendations -->
          <div v-if="recommendations.length > 0" class="mt-8">
            <h2 class="text-xl font-semibold mb-6 text-white">Generated Recommendations</h2>
            <div class="bg-gray-800 rounded-lg p-4">
              <p class="text-gray-300 mb-4">Total: {{ recommendations.length }} recommendations</p>
              <div class="space-y-4">
                <div v-for="(rec, index) in recommendations" :key="index" class="border border-gray-700 rounded-md overflow-hidden">
                  <div class="px-4 py-3 bg-gray-700 font-medium text-white">
                    {{ index + 1 }}. {{ rec.title }}
                  </div>
                  <div class="p-4 text-gray-300">
                    <h5 class="text-sm font-semibold mb-2">Reasons for recommendation:</h5>
                    <ul class="list-disc pl-5 space-y-1">
                      <li v-for="(reason, mIndex) in rec.reasons" :key="mIndex" class="text-sm">
                        {{ reason }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-4 border-t border-gray-800 flex justify-end">
          <button 
            @click="toggleDebugMode" 
            class="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-6 border-t border-gray-800">
      <div class="container mx-auto px-4 text-center">
        <p class="text-sm">© 2023 RecommendIt - All rights reserved</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onClickOutside, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import RecommendationCard from '@/components/RecommendationCard.vue'
import axios from 'axios'

export default {
  name: 'Home',
  components: {
    RecommendationCard
  },
  setup() {
    const router = useRouter()
    
    // Form data
    const topic = ref('')
    const category = ref('anime')
    const language = ref('pt')
    const categories = ref(['anime', 'kdrama'])
    
    // Mapeamento de categorias para nomes de exibição
    const categoryDisplayNames = {
      'anime': 'Anime & Manga',
      'kdrama': 'K-Drama'
    }
    
    // Função para obter o nome de exibição da categoria
    const getCategoryDisplayName = (cat) => {
      return categoryDisplayNames[cat] || cat;
    }
    
    // Languages with icons
    const languages = reactive({
      pt: { name: 'Português', icon: 'flag-icon flag-icon-br' },
      en: { name: 'English', icon: 'flag-icon flag-icon-us' },
      es: { name: 'Español', icon: 'flag-icon flag-icon-es' },
      fr: { name: 'Français', icon: 'flag-icon flag-icon-fr' },
      ja: { name: '日本語', icon: 'flag-icon flag-icon-jp' }
    })
    
    // UI state
    const isLoading = ref(false)
    const showResults = ref(false)
    const showGenreFilter = ref(false)
    const showCategoryMenu = ref(false)
    const showLanguageMenu = ref(false)
    const selectedGenres = ref([])
    const viewMode = ref('grid')
    const selectedRecommendation = ref(null)
    const statusMessage = ref('Analyzing Reddit discussions')
    const statusProgress = ref(0)
    const statusDetail = ref('This may take a few seconds')
    const currentItem = ref(null)
    
    // Data
    const recommendations = ref([])
    const genres = computed(() => {
      const allGenres = new Set()
      recommendations.value.forEach(rec => {
        if (rec.genres && Array.isArray(rec.genres)) {
          rec.genres.forEach(genre => allGenres.add(genre))
        }
      })
      return [...allGenres].sort()
    })
    
    // Computed properties
    const filteredRecommendations = computed(() => {
      if (selectedGenres.value.length === 0) {
        return recommendations.value
      }
      
      return recommendations.value.filter(rec => {
        if (!rec.genres || !Array.isArray(rec.genres)) return false
        return selectedGenres.value.some(genre => rec.genres.includes(genre))
      })
    })
    
    const languageIcon = computed(() => {
      return languages[language.value]?.icon || 'fas fa-globe'
    })
    
    // Load categories on mount
    onMounted(() => {
      // Carregar categorias da API
      axios.get('/api/categories')
        .then(response => {
          if (response.data && response.data.categories) {
            categories.value = response.data.categories;
          }
        })
        .catch(error => {
          console.error('Erro ao carregar categorias:', error);
        });
        
      // Close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
          showCategoryMenu.value = false;
          showLanguageMenu.value = false;
          showGenreFilter.value = false;
        }
      });
      
      // Conectar ao SSE para atualizações de status em tempo real
      connectToSSE();
    });
    
    // Limpar conexões ao desmontar o componente
    onBeforeUnmount(() => {
      disconnectSSE();
    });
    
    // Variável para armazenar a conexão SSE
    let eventSource = null;
    
    // Debug mode
    const showDebugMode = ref(false)
    const debugStatus = reactive({
      reddit: 'waiting',
      aggregate: 'waiting',
      ai: 'waiting',
      jikan: 'waiting'
    })
    const debugMessages = reactive({
      reddit: 'Waiting for search to begin...',
      aggregate: 'Waiting for comment aggregation...',
      ai: 'Waiting for AI analysis...',
      jikan: 'Waiting for data enrichment...'
    })
    
    // Conectar ao SSE
    const connectToSSE = () => {
      // Fechar conexão existente se houver
      disconnectSSE();
      
      // Criar nova conexão
      eventSource = new EventSource('/api/status-updates');
      
      // Evento de conexão estabelecida
      eventSource.onopen = () => {
        console.log('Conexão SSE estabelecida');
      };
      
      // Evento de mensagem recebida
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Atualização de status recebida:', data);
          
          // Processar atualizações de status
          if (data.type === 'status') {
            statusMessage.value = data.message || 'Processando...';
            statusProgress.value = data.progress || 0;
            
            // Atualizar o item atual sendo processado
            if (data.currentItem) {
              currentItem.value = data.currentItem;
            }
            
            // Atualizar status de debug com base no status recebido
            updateDebugStatus(data);
            
            // Definir detalhes com base no status
            switch (data.status) {
              case 'iniciando':
                statusDetail.value = 'Preparando para buscar dados...';
                break;
              case 'otimizando':
                statusDetail.value = 'Otimizando sua busca para melhores resultados...';
                debugStatus.reddit = 'active';
                debugMessages.reddit = data.message;
                break;
              case 'buscando':
              case 'buscando_posts':
                statusDetail.value = 'Buscando discussões relevantes no Reddit...';
                debugStatus.reddit = 'active';
                debugMessages.reddit = data.message;
                break;
              case 'sem_posts':
                statusDetail.value = 'Nenhum post encontrado para esta busca.';
                debugStatus.reddit = 'completed';
                debugMessages.reddit = data.message;
                break;
              case 'coletando_comentarios':
                statusDetail.value = 'Coletando comentários dos usuários...';
                debugStatus.reddit = 'active';
                debugMessages.reddit = data.message;
                break;
              case 'comentarios_coletados':
                statusDetail.value = 'Comentários coletados com sucesso.';
                debugStatus.reddit = 'completed';
                debugMessages.reddit = data.message;
                debugStatus.aggregate = 'active';
                debugMessages.aggregate = 'Iniciando agregação de comentários...';
                break;
              case 'agregando':
              case 'agregando_comentarios':
                statusDetail.value = 'Organizando os comentários para análise...';
                debugStatus.aggregate = 'active';
                debugMessages.aggregate = data.message;
                break;
              case 'analisando':
              case 'analisando_ia':
                statusDetail.value = 'A IA está analisando os comentários para encontrar recomendações...';
                debugStatus.aggregate = 'completed';
                debugMessages.aggregate = 'Agregação de comentários concluída.';
                debugStatus.ai = 'active';
                debugMessages.ai = data.message;
                break;
              case 'recomendacoes_identificadas':
                statusDetail.value = 'Recomendações identificadas com sucesso.';
                debugStatus.ai = 'completed';
                debugMessages.ai = data.message;
                break;
              case 'enriquecendo':
              case 'enriquecendo_dados':
                statusDetail.value = 'Buscando informações adicionais sobre as recomendações...';
                debugStatus.jikan = 'active';
                debugMessages.jikan = data.message;
                break;
              case 'concluido':
                statusDetail.value = 'Processamento finalizado com sucesso!';
                debugStatus.jikan = 'completed';
                debugMessages.jikan = 'Enriquecimento de dados concluído.';
                break;
              case 'erro':
                statusDetail.value = 'Ocorreu um erro durante o processamento.';
                // Marcar a etapa atual como erro
                if (debugStatus.jikan === 'active') {
                  debugStatus.jikan = 'error';
                  debugMessages.jikan = data.message;
                } else if (debugStatus.ai === 'active') {
                  debugStatus.ai = 'error';
                  debugMessages.ai = data.message;
                } else if (debugStatus.aggregate === 'active') {
                  debugStatus.aggregate = 'error';
                  debugMessages.aggregate = data.message;
                } else if (debugStatus.reddit === 'active') {
                  debugStatus.reddit = 'error';
                  debugMessages.reddit = data.message;
                }
                break;
              default:
                statusDetail.value = 'Processando sua solicitação...';
            }
          }
        } catch (error) {
          console.error('Erro ao processar atualização de status:', error);
        }
      };
      
      // Evento de erro
      eventSource.onerror = (error) => {
        console.error('Erro na conexão SSE:', error);
        disconnectSSE();
      };
    };
    
    // Atualizar status de debug com base no status recebido
    const updateDebugStatus = (data) => {
      // Atualizar mensagens de debug com base no progresso
      if (data.progress <= 30) {
        // Fase de busca no Reddit
        debugStatus.reddit = 'active';
        debugMessages.reddit = data.message;
      } else if (data.progress <= 50) {
        // Fase de agregação
        debugStatus.reddit = 'completed';
        debugStatus.aggregate = 'active';
        debugMessages.aggregate = data.message;
      } else if (data.progress <= 85) {
        // Fase de análise com IA
        debugStatus.aggregate = 'completed';
        debugStatus.ai = 'active';
        debugMessages.ai = data.message;
      } else if (data.progress < 100) {
        // Fase de enriquecimento
        debugStatus.ai = 'completed';
        debugStatus.jikan = 'active';
        debugMessages.jikan = data.message;
      } else if (data.progress === 100) {
        // Processo concluído
        if (data.status === 'erro') {
          // Marcar a etapa atual como erro
          if (debugStatus.jikan === 'active') {
            debugStatus.jikan = 'error';
          } else if (debugStatus.ai === 'active') {
            debugStatus.ai = 'error';
          } else if (debugStatus.aggregate === 'active') {
            debugStatus.aggregate = 'error';
          } else if (debugStatus.reddit === 'active') {
            debugStatus.reddit = 'error';
          }
        } else {
          // Marcar todas as etapas como concluídas
          debugStatus.reddit = 'completed';
          debugStatus.aggregate = 'completed';
          debugStatus.ai = 'completed';
          debugStatus.jikan = 'completed';
        }
      }
    };
    
    // Desconectar do SSE
    const disconnectSSE = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        console.log('Conexão SSE fechada');
      }
    };
    
    // Obter texto do status
    const getStatusText = (status) => {
      switch (status) {
        case 'active': return 'In progress';
        case 'completed': return 'Completed';
        case 'error': return 'Error';
        default: return 'Waiting';
      }
    };
    
    // Toggle debug mode
    const toggleDebugMode = () => {
      showDebugMode.value = !showDebugMode.value;
    };
    
    // Go to debug page (agora apenas chama toggleDebugMode)
    const goToDebug = () => {
      toggleDebugMode();
    };
    
    // Search Reddit
    const searchReddit = async () => {
      if (!topic.value || !category.value) return

      statusMessage.value = ''
      statusProgress.value = 0
      statusDetail.value = ''
      currentItem.value = null
      
      isLoading.value = true
      showResults.value = false
      
      // Resetar status
      statusMessage.value = 'Starting search...';
      statusProgress.value = 5;
      statusDetail.value = 'Preparing to find recommendations...';
      
      try {
        // Fazer chamada para a API
        const response = await axios.post(`/api/search-and-summarize`, {
          topic: topic.value,
          category: category.value,
          language: language.value
        });
        
        if (response.data && response.data.summary && response.data.summary.recommendations) {
          recommendations.value = response.data.summary.recommendations.sort((a, b) => b.score - a.score);
          showResults.value = true;
          
          // Scroll to results after a short delay to allow for animation
          setTimeout(() => {
            window.scrollTo({
              top: document.querySelector('.min-h-screen').offsetHeight,
              behavior: 'smooth'
            });
          }, 300);
        } else if (response.status === 404 || (response.data && response.data.error)) {
          alert(`No recommendations found for "${topic.value}" in the ${getCategoryDisplayName(category.value)} category. Please try another topic or category.`);
          recommendations.value = [];
          showResults.value = false;
        } else {
          alert('No recommendations found for this search. Try another topic or category.');
          recommendations.value = [];
          showResults.value = false;
        }
      } catch (error) {
        console.error('Error searching Reddit:', error)
        if (error.response && error.response.status === 404) {
          alert(`No recommendations found for "${topic.value}" in the ${getCategoryDisplayName(category.value)} category. Please try another topic or category.`);
        } else {
          alert('An error occurred while searching for recommendations. Please try again.')
        }
        recommendations.value = [];
        showResults.value = false;
      } finally {
        isLoading.value = false
      }
    }
    
    // Toggle dropdowns
    const toggleGenreFilter = (e) => {
      e.stopPropagation();
      showGenreFilter.value = !showGenreFilter.value;
      showCategoryMenu.value = false;
      showLanguageMenu.value = false;
    }
    
    const toggleCategoryMenu = (e) => {
      e.stopPropagation();
      showCategoryMenu.value = !showCategoryMenu.value;
      showGenreFilter.value = false;
      showLanguageMenu.value = false;
    }
    
    const toggleLanguageMenu = (e) => {
      e.stopPropagation();
      showLanguageMenu.value = !showLanguageMenu.value;
      showGenreFilter.value = false;
      showCategoryMenu.value = false;
    }
    
    // Select options
    const selectCategory = (cat) => {
      category.value = cat;
      showCategoryMenu.value = false;
    }
    
    const selectLanguage = (code) => {
      language.value = code;
      showLanguageMenu.value = false;
    }
    
    // Toggle genre selection
    const toggleGenre = (genre) => {
      const index = selectedGenres.value.indexOf(genre)
      if (index === -1) {
        selectedGenres.value.push(genre)
      } else {
        selectedGenres.value.splice(index, 1)
      }
    }
    
    // Clear genre filters
    const clearGenreFilters = () => {
      selectedGenres.value = []
      showGenreFilter.value = false
    }
    
    // Apply filters
    const applyFilters = () => {
      showGenreFilter.value = false
    }

    // Set view mode
    const setViewMode = (mode) => {
      viewMode.value = mode
    }
    
    // Show recommendation details
    const showDetails = (recommendation) => {
      selectedRecommendation.value = recommendation
    }
    
    // Format number
    const formatNumber = (num) => {
      if (typeof num !== 'number') return num
      return num.toFixed(1)
    }
    
    return {
      // Form data
      topic,
      category,
      language,
      categories,
      languages,
      
      // UI state
      isLoading,
      showResults,
      showGenreFilter,
      showCategoryMenu,
      showLanguageMenu,
      selectedGenres,
      viewMode,
      selectedRecommendation,
      statusMessage,
      statusProgress,
      statusDetail,
      currentItem,
      
      // Data
      recommendations,
      genres,
      filteredRecommendations,
      languageIcon,
      
      // Methods
      searchReddit,
      toggleGenreFilter,
      toggleCategoryMenu,
      toggleLanguageMenu,
      selectCategory,
      selectLanguage,
      toggleGenre,
      clearGenreFilters,
      applyFilters,
      setViewMode,
      goToDebug,
      showDetails,
      formatNumber,
      getCategoryDisplayName,
      
      // Debug mode
      showDebugMode,
      debugStatus,
      debugMessages,
      toggleDebugMode,
      getStatusText
    }
  }
}
</script>

<style>
/* Animações */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInDown {
  from { 
    opacity: 0;
    transform: translateY(-10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-fade-in-down {
  animation: fadeInDown 0.3s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}
</style> 