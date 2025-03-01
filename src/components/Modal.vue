<template>
  <transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true"></div>
        
        <!-- Modal panel -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div 
            v-if="show" 
            class="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6"
            @click.stop
          >
            <div class="absolute top-0 right-0 pt-4 pr-4">
              <button 
                type="button" 
                class="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                @click="close"
              >
                <span class="sr-only">Close</span>
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div class="sm:flex sm:items-start">
              <div class="w-full mt-3 text-center sm:mt-0 sm:text-left">
                <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                  <slot name="title">Modal Title</slot>
                </h3>
                
                <div class="mt-4">
                  <slot>Modal Content</slot>
                </div>
              </div>
            </div>
            
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <slot name="footer"></slot>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<script>
import { onUnmounted } from 'vue'

export default {
  name: 'Modal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // Close the modal
    const close = () => {
      emit('close');
    };
    
    // Close on escape key
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && props.show) {
        close();
      }
    };
    
    // Add event listener for escape key
    document.addEventListener('keydown', handleKeydown);
    
    // Remove event listener on unmount
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown);
    });
    
    return {
      close
    };
  }
}
</script> 