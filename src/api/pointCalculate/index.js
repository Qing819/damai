// 积分测算接口
import fetch from 'utils/fetch';

// 获取积分类型要素信息
export function getIntegralTypeElements(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/integralCalculationResult',
    method: 'get',
    params
  })
}

// 方案测算测算结果表头
export function getPlanCalculateListHeader(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/integralCalculationFieldValueListFa',
    method: 'post',
    params
  })
}

// 方案测算测算结果
export function getPlanCalculateData(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/integralCalculationInfoFa',
    method: 'post',
    data
  })
}

// 测算积分：测算结果表头
export function getIntegralCalculateListHeader(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/integralCalculationFieldValueListJf',
    method: 'post',
    data
  })
}

// 测算积分：测算结果数据
export function getIntegralCalculateData(data, type) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/integralCalculationInfoJf/' + type,
    method: 'post',
    data
  })
}

// 获取积分类型的积分规则列表
export function getIntegralRuleList(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/integralRuleInfoJf',
    method: 'post',
    params
  })
}

// 获取保费积分某条数据对应的规则：用于校验规则是否重复
export function getRuleCode(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/integralCalcRuleInfoJf',
    method: 'post',
    data
  })
}

// 显示特殊字段
export function showSpecialFields(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCalculation/showSpecialFields',
    method: 'post',
    data
  })
}


