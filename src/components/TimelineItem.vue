<template>
  <div class="relative pb-8">
    <!-- Timeline connector line -->
    <div v-if="!isLastItem" class="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
    
    <div class="relative flex items-start space-x-3">
      <!-- Timeline marker -->
      <div class="relative">
        <span 
          class="flex items-center justify-center w-8 h-8 rounded-full text-white"
          :class="{
            'bg-blue-500': status === 'active',
            'bg-green-500': status === 'completed',
            'bg-red-500': status === 'error',
            'bg-gray-400': status === 'waiting'
          }"
        >
          <i :class="icon"></i>
        </span>
      </div>
      
      <!-- Timeline content -->
      <div class="flex-1">
        <div class="flex justify-between">
          <h3 class="text-base font-medium" :class="{
            'text-blue-600': status === 'active',
            'text-green-600': status === 'completed',
            'text-red-600': status === 'error',
            'text-gray-600': status === 'waiting'
          }">
            {{ title }}
          </h3>
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="{
              'bg-blue-100 text-blue-800': status === 'active',
              'bg-green-100 text-green-800': status === 'completed',
              'bg-red-100 text-red-800': status === 'error',
              'bg-gray-100 text-gray-800': status === 'waiting'
            }"
          >
            {{ statusText }}
          </span>
        </div>
        
        <p class="mt-1 text-sm text-gray-600">{{ message }}</p>
        
        <!-- Details toggle button -->
        <button 
          v-if="$slots.details" 
          @click="toggleDetails" 
          class="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <i :class="showDetails ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="mr-1"></i>
          {{ showDetails ? 'Hide details' : 'View details' }}
        </button>
        
        <!-- Details slot -->
        <div v-if="$slots.details && showDetails" class="mt-2">
          <slot name="details"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'TimelineItem',
  props: {
    step: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: 'waiting',
      validator: (value) => ['waiting', 'active', 'completed', 'error'].includes(value)
    },
    message: {
      type: String,
      default: ''
    },
    isLastItem: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const showDetails = ref(false)
    
    const toggleDetails = () => {
      showDetails.value = !showDetails.value
    }
    
    const statusText = computed(() => {
      switch (props.status) {
        case 'active': return 'In progress';
        case 'completed': return 'Completed';
        case 'error': return 'Error';
        default: return 'Waiting';
      }
    })
    
    return {
      showDetails,
      toggleDetails,
      statusText
    }
  }
}
</script>

<style scoped>
/* Status-specific styles */
.timeline-item.waiting .timeline-marker {
  @apply border-gray-500 bg-gray-100;
}

.timeline-item.waiting .timeline-marker i {
  @apply text-gray-500;
}

.timeline-item.active .timeline-marker {
  @apply border-blue-500 bg-blue-100;
}

.timeline-item.active .timeline-marker i {
  @apply text-blue-500;
}

.timeline-item.completed .timeline-marker {
  @apply border-green-500 bg-green-100;
}

.timeline-item.completed .timeline-marker i {
  @apply text-green-500;
}

.timeline-item.error .timeline-marker {
  @apply border-red-500 bg-red-100;
}

.timeline-item.error .timeline-marker i {
  @apply text-red-500;
}
</style> 