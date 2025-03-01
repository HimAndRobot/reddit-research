import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './assets/tailwind.css'

// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

// Global axios configuration
axios.defaults.baseURL = window.location.origin

const app = createApp(App)
app.use(router)
app.config.globalProperties.$axios = axios
app.mount('#app') 