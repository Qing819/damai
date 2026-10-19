// 等级类型配置store
const rankTypeStore = {
  state: {
    // 等级类型所有要素
    rankTypeElements: []
  },
  mutations: {
    SET_RANKTYPE_ELEMENTS: (state, data) => {
      state.rankTypeElements = data
    }
  },
  actions: {
    setRankTypeElements: ({ commit }, data) => {
      commit('SET_RANKTYPE_ELEMENTS', data)
    }
  }
}
export default rankTypeStore