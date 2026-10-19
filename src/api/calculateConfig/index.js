import fetch from 'utils/fetch';

// 积分计算列表查询
export function getIntegrationCalcList(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationCalc/getIntegrationCalcList',
    method: 'get',
    params
  })
}

// 删除积分计算信息
export function deleteIntegrationCalcInfo(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationCalc/deleteIntegrationCalcInfo',
    method: 'post',
    data
  })
}

// 查询标签库
export function getPageLabrary(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/getPageLabrary',
    method: 'get',
    params
  })
}

// 根据标签库id查询数值类型标签
export function getNumLabelInfoByLabraryId(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationCalc/getNumLabelInfoByLabraryId',
    method: 'get',
    params
  })
}


// 校验积分计算配置的唯一性
export function checkIntegralTypeName(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationCalc/checkIntegralTypeName',
    method: 'post',
    data
  })
}

// 积分计算配置的新增/修改-保存
export function editIntegrationCalcFormula(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationCalc/editIntegrationCalcFormula',
    method: 'post',
    data
  })
}