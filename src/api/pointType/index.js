// 积分类型配置api
import fetch from 'utils/fetch';

// 获取积分类型列表
export function getIntegralTypeList(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationType/selBxmIntegralIntegrationElementPageInfo',
    method: 'post',
    data
  })
}

// 删除积分
export function delIntegralType(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationType/delBxmIntegralIntegrationType',
    method: 'post',
    params
  })
}

// 获取某积分类型详细信息
export function getIntegralTypeDetail(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationType/selBxmIntegralIntegrationElementOneInfo',
    method: 'post',
    params
  })
}

// 检查积分类型名是否重复
export function checkIntegralTypeName(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationType/checkIntegralTypeName',
    method: 'post',
    data
  })
}

// 新增/更新积分类型信息
export function saveIntegralTypeData(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationType/editPointsType',
    method: 'post',
    data
  })
}

// 获取要素目录
export function getElementsMenu(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/getCategoryInfo',
    method: 'get',
    params
  })
}