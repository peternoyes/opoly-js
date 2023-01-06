import Vue from 'vue'
import App from './App.vue'
import VueNativeSock from 'vue-native-websocket'

Vue.config.productionTip = false
Vue.use(VueNativeSock, 'ws://192.168.1.8:9000', { protocol: 'opoly' })

new Vue({
  render: h => h(App),
}).$mount('#app')
