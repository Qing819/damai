// 个人规则api
import fetch from 'utils/fetch';
// 机构获取业务人员机构
export function getUserOrgName() {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/getUserOrgName',
    method: 'get'
  })
}
// 查看客户信息---可去掉
export function getUser(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/getUser',
    method: 'post',
    params
  })
}
// 机构轨迹查询表格内容
export function selectIntegralRedistributionTrajectory(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/selectIntegralRedistributionTrajectory',
    method: 'post',
    params
  })
}


// 机构导入
export function importIntegrationRule(data, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/importIntegrationRule',
    method: 'post',
    data,
    onUploadProgress: progressEvent => {
      onUploadProgress && onUploadProgress(progressEvent)
    }
  })
}
// 查询机构初始Deptfile列表
export function seletFileList(params, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/seletFileList',
    method: 'post',
    params
  })
}
// 查询机构初始Deptfile列表
export function sureFileListUp(params, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/sureFileListUp',
    method: 'post',
    params
  })
}


// 查询机构初始历史轨迹表
export function orgCodesInformation(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/orgCodesInformation',
    method: 'post',
    params
  })
}

// 获取机构导入模板
export function getImportTemplate(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/getImportTemplate',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

// 机构点击返回按钮删除所有fileId信息
export function deleteFileList(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/deleteFileList',
    method: 'post',
    params
  })
}
// 机构点击提交
export function sureFileList(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/sureFileList',
    method: 'post',
    params
  })
}


// 机构轨迹查询表格内容
export function selectIntegralRedistributionTrajectoryAgent(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/selectIntegralRedistributionTrajectory',
    method: 'post',
    params
  })
}


// 机构导入
export function importIntegrationRuleAgent(data, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/importIntegrationRule',
    method: 'post',
    data,
    onUploadProgress: progressEvent => {
      onUploadProgress && onUploadProgress(progressEvent)
    }
  })
}
// 查询机构初始Deptfile列表
export function seletFileListAgent(params, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/seletFileList',
    method: 'post',
    params
  })
}

// 查询代理人客户数
export function selectAgentCnt(params, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/selectAgentCnt',
    method: 'post',
    params
  })
}

// 查询机构初始历史轨迹表
export function orgCodesInformationAgent(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/orgCodesInformation',
    method: 'post',
    params
  })
}

// 获取机构导入模板
export function getImportTemplateAgent(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/getImportTemplate',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

// 机构点击返回按钮删除所有fileId信息
export function deleteFileListAgent(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/deleteFileList',
    method: 'post',
    params
  })
}
// 机构点击提交
export function sureFileListAgent(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/sureFileList',
    method: 'post',
    params
  })
}

// 查询机构初始Deptfile列表
export function sureFileListUpAgent(params, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/sureFileListUp',
    method: 'post',
    params
  })
}
export function getImportNotallocDetail(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistributionAgent/getImportNotAllocDetail',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

export function getImportNotAllocDetail(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/getImportNotallocDetil',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

export function selectDeptCnt(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/selectDeptCnt',
    method: 'post',
    params
  })
}

export function cancelFileList(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/cancelFileList',
    method: 'post',
    params
  })
}

// 根据机构权限获取导出有效纯孤单客户明细的URL
export function getExportPureGedUrl(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralRedistribution/getExportPureGedUrl',
    method: 'post',
    params
  })
}
