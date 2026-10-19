// 积分类型配置store
const pointTypeStore = {
  state: {
    // 积分类型所有要素
    pointTypeElements: []
  },
  mutations: {
    SET_POINTTYPE_ELEMENTS: (state, data) => {
      state.pointTypeElements = data
    }
  },
  actions: {
    setPointTypeElements: ({ commit }, data) => {
      commit('SET_POINTTYPE_ELEMENTS', data)
    }
  }
}
export default pointTypeStore
