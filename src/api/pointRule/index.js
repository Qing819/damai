// 个人规则api
import fetch from 'utils/fetch';

// 获取积分类型
export function getIntegrationType() {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/getIntegrationType',
    method: 'get'
  })
}

// 分页查询表头项
export function integrationRuleFieldValueList(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/integrationRuleFieldValueList',
    method: 'post',
    params
  })
}

// 积分类型规则分页查询
export function integrationRulePageInfo(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/integrationRulePageInfo',
    method: 'post',
    data
  })
}

// 删除规则
export function delIntegralRule(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/delIntegralRule',
    method: 'post',
    params
  })
}

// 获取导入模板
export function getImportTemplate(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/getImportTemplate',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

// 导入
export function importIntegrationRule(data, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/importIntegrationRule',
    method: 'post',
    data,
    onUploadProgress: progressEvent => {
      onUploadProgress && onUploadProgress(progressEvent)
    }
  })
}

// 导出个人积分
export function exportIntegralRule(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/exportIntegralRule',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 新增积分类型元素内容
export function integrationRuleElementContentInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/integrationRuleElementContentInfo',
    method: 'post',
    params
  })
}

// 新增/修改保存
export function editIntegralRule(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/editIntegralRule',
    method: 'post',
    data
  })
}

// 轨迹查询表格内容
export function selectIntegrationRuleTrajectory(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/selectIntegrationRuleTrajectory',
    method: 'post',
    params
  })
}

// 轨迹查询表头项
export function selectIntegrationRuleTrajectoryField(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/selectIntegrationRuleTrajectoryField',
    method: 'post',
    params
  })
}

// 编辑规则详情返回
export function integrationRuleContentDefaultInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/integrationRuleContentDefaultInfo',
    method: 'post',
    params
  })
}

// 【保存】校验唯一性与主键
export function checkEditIntegralRule(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/checkEditIntegralRule',
    method: 'post',
    data
  })
}

// 校验是否可以提交审批修改积分规则
export function checkEditIntegralRuleAudit(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/checkEditIntegralRuleAudit',
    method: 'get',
    params
  })
}

// 获取险种列表
export function getInsuranceTypeInfo(data) {
  return fetch({
    url: '/bxmIntegral/bxmIncrementCodeType/getInsuranceTypeInfo',
    method: 'post',
    data
  })
}

// 保费积分增加查询条件
export function getIntegralRuleSelInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/getIntegralRuleSelInfo',
    method: 'get',
    params
  })
}

// 保费积分增加起止日期校验
export function checkRuleStartAndEndPeriod(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralIntegrationRule/checkRuleStartAndEndPeriod',
    method: 'post',
    data
  })
}
