import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './styles/index.scss'
import ElementUI from 'element-ui'
import FullScreenLoad from './plugin/FullScreenLoad'
import './icons' // icon
import { getUserToken } from 'utils/auth'
import * as echarts from 'echarts'


Vue.use(ElementUI)
Vue.use(FullScreenLoad)

Vue.config.productionTip = false
Vue.prototype.$echarts = echarts
// 路由守卫
router.beforeEach(async (to, from, next) => {
    // try {
        Vue.prototype.$fullScreenLoading.show()
        // await getUserToken()
        try {
            await store.dispatch('setIntegrationTypeList')
        } catch (error) {
            throw error
        }
        next()
    // } catch (error) {
    //     throw error
    // }
})

router.afterEach((to, from) => {
    Vue.prototype.$fullScreenLoading.hide()
})

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#point-system');






