<template>
  <div 
    class="recommendation-card bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
    :class="{ 
      'flex flex-row': viewMode === 'list',
      'flex-col': viewMode === 'grid'
    }"
  >
    <!-- Image -->
    <div 
      class="recommendation-image bg-gray-200 overflow-hidden"
      :class="{
        'w-1/4 min-w-[120px]': viewMode === 'list',
        'w-full aspect-[3/4]': viewMode === 'grid'
      }"
    >
      <img 
        v-if="imageUrl" 
        :src="imageUrl" 
        :alt="recommendation.title"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
        <i class="fas fa-image text-gray-400 text-4xl"></i>
      </div>
    </div>
    
    <!-- Content -->
    <div 
      class="recommendation-content p-4"
      :class="{
        'flex-1': viewMode === 'list'
      }"
    >
      <!-- Header -->
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-lg font-bold text-gray-900 line-clamp-2">{{ recommendation.title }}</h3>
        <div v-if="score" class="ml-2 flex items-center">
          <span class="text-sm font-medium text-amber-500">{{ formatNumber(score) }}</span>
          <i class="fas fa-star text-amber-500 ml-1"></i>
        </div>
      </div>
      
      <!-- Metadata -->
      <div class="text-sm text-gray-500 mb-3">
        <span v-if="type" class="mr-2">
          <i class="fas fa-tag mr-1"></i> {{ type }}
        </span>
        <span v-if="episodes" class="mr-2">
          <i class="fas fa-film mr-1"></i> {{ episodes }} ep
        </span>
        <span v-if="year">
          <i class="fas fa-calendar-alt mr-1"></i> {{ year }}
        </span>
      </div>
      
      <!-- Genres -->
      <div v-if="genres && genres.length" class="mb-3">
        <div class="flex flex-wrap gap-1">
          <span 
            v-for="(genre, index) in limitedGenres" 
            :key="index"
            class="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
          >
            {{ genre }}
          </span>
          <span 
            v-if="hasMoreGenres" 
            class="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
          >
            +{{ genres.length - limitedGenres.length }}
          </span>
        </div>
      </div>
      
      <!-- Reasons -->
      <div v-if="reasons && reasons.length" class="mt-3">
        <h4 class="text-sm font-semibold text-gray-700 mb-1">Why we recommend:</h4>
        <ul class="text-sm text-gray-600 pl-5 list-disc">
          <li v-for="(reason, index) in limitedReasons" :key="index" class="mb-1">
            {{ reason }}
          </li>
          <li v-if="hasMoreReasons" class="text-sm text-gray-500 italic">
            And {{ reasons.length - limitedReasons.length }} more reasons...
          </li>
        </ul>
      </div>
      
      <!-- User Recommendations -->
      <div v-if="recommendation.recommendedBy && recommendation.recommendedBy.length" class="mt-3 pt-2 border-t border-gray-200">
        <p class="text-xs text-gray-500">
          <i class="fas fa-users mr-1"></i> Recommended by 
          <span class="font-medium">{{ recommendation.recommendedBy.length }}</span> 
          {{ recommendation.recommendedBy.length === 1 ? 'user' : 'users' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'RecommendationCard',
  props: {
    recommendation: {
      type: Object,
      required: true
    },
    viewMode: {
      type: String,
      default: 'grid',
      validator: (value) => ['grid', 'list'].includes(value)
    }
  },
  setup(props) {
    // Computed properties to map normalized data
    const imageUrl = computed(() => {
      return props.recommendation.image || null;
    });
    
    const score = computed(() => {
      return props.recommendation.score || null;
    });
    
    const type = computed(() => {
      return props.recommendation.type || null;
    });
    
    const episodes = computed(() => {
      return props.recommendation.episodes || null;
    });
    
    const year = computed(() => {
      return props.recommendation.year || null;
    });
    
    const genres = computed(() => {
      return props.recommendation.genres || [];
    });
    
    const reasons = computed(() => {
      return props.recommendation.reasons || [];
    });
    
    // Limit genres to show
    const limitedGenres = computed(() => {
      if (!genres.value || !genres.value.length) return []
      return props.viewMode === 'list' 
        ? genres.value.slice(0, 3) 
        : genres.value.slice(0, 2)
    })
    
    // Check if there are more genres
    const hasMoreGenres = computed(() => {
      if (!genres.value || !genres.value.length) return false
      return genres.value.length > limitedGenres.value.length
    })
    
    // Limit reasons to show
    const limitedReasons = computed(() => {
      if (!reasons.value || !reasons.value.length) return []
      return reasons.value.slice(0, 2)
    })
    
    // Check if there are more reasons
    const hasMoreReasons = computed(() => {
      if (!reasons.value || !reasons.value.length) return false
      return reasons.value.length > limitedReasons.value.length
    })
    
    // Format number (for scores)
    const formatNumber = (num) => {
      if (typeof num !== 'number') return num
      return num.toFixed(1)
    }
    
    return {
      imageUrl,
      score,
      type,
      episodes,
      year,
      genres,
      reasons,
      limitedGenres,
      hasMoreGenres,
      limitedReasons,
      hasMoreReasons,
      formatNumber
    }
  }
}
</script>

<style scoped>
.recommendation-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.recommendation-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.recommendation-header {
  background-color: #212529;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.recommendation-image {
  height: 200px;
  width: 100%;
  overflow: hidden;
}

.recommendation-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.recommendation-title-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.recommendation-point {
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 5px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommendation-meta {
  font-size: 14px;
  color: #ced4da;
  margin-bottom: 10px;
}

.recommendation-score {
  font-size: 16px;
  color: #ffc107;
  margin-bottom: 10px;
}

.recommendation-score i {
  margin-right: 5px;
}

.recommendation-genres {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
}

.recommendation-explanation {
  padding: 15px;
  background-color: #f8f9fa;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.motivos-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 10px;
  color: #495057;
}

.motivos-list {
  padding-left: 20px;
  margin-top: 0;
  margin-bottom: 0;
  flex: 1;
}

.motivos-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.motivos-list li:last-child {
  margin-bottom: 0;
}

/* List view styles */
.recommendation-item.list-item {
  flex-direction: row;
  max-height: 250px;
}

.recommendation-item.list-item .recommendation-header {
  flex-direction: row;
  width: 60%;
  border-radius: 10px 0 0 10px;
}

.recommendation-item.list-item .recommendation-image {
  flex: 0 0 150px;
  max-width: 150px;
  height: 100%;
}

.recommendation-item.list-item .recommendation-explanation {
  flex: 0 0 40%;
  max-width: 40%;
  border-radius: 0 10px 10px 0;
  height: 100%;
  overflow-y: auto;
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive styles */
@media (max-width: 992px) {
  .recommendation-item.list-item {
    flex-direction: column;
    max-height: none;
  }
  
  .recommendation-item.list-item .recommendation-header {
    width: 100%;
    border-radius: 10px 10px 0 0;
  }
  
  .recommendation-item.list-item .recommendation-explanation {
    max-width: 100%;
    border-radius: 0 0 10px 10px;
  }
}
</style> 