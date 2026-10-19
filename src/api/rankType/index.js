// 等级类型配置api
import fetch from 'utils/fetch';

// 获取等级类型列表
export function getRankTypeList(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralGradeType/selBxmIntegralGradeElementPageInfo',
    method: 'post',
    data
  })
}

// 删除积分
export function delRankType(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralGradeType/delBxmIntegralGradeType',
    method: 'post',
    params
  })
}

// 获取某等级类型详细信息
export function getRankTypeDetail(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralGradeType/selBxmIntegralGradeElementOneInfo',
    method: 'post',
    params
  })
}

// 新增/更新等级类型信息
export function saveRankTypeData(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralGradeType/editGradeType',
    method: 'post',
    data
  })
}