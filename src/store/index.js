import Vue from 'vue'
import Vuex from 'vuex'
import commonStore from './modules/common'
import pointType from './modules/pointType'
import rankType from './modules/rankType'
import getters from './getters'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    commonStore,
    pointType,
    rankType
  },
  getters
})
