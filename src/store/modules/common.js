// 公共模块
import { getIntegrationType } from 'api/pointRule/index'

const commonStore = {
  state: {
    integrationTypeList: []// 积分类型下拉框内容
  },
  mutations: {
    SET_INTEGRATION_TYPE: (state, data) => {
      state.integrationTypeList = data
    }
  },
  actions: {
    setIntegrationTypeList: async({ commit }) => {
      // await getIntegrationType().then(({ list }) => {
      //   commit('SET_INTEGRATION_TYPE', list)
      // })
    }
  }
}
export default commonStore
