import fetch from 'utils/fetch';

// 分页查询
export function customerIntegrationPageInfo(data) {
  return fetch({
    url: '/bxmIntegral/appCustPoint/customerIntegrationPageInfo',
    method: 'post',
    data
  })
}

export function customerIntegrationFieldValue(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerIntegration/customerIntegrationFieldValue',
    method: 'post',
    data
  })
}
// 积分调整
export function integralAdjustment(data) {
  return fetch({
    url: '/bxmIntegral/appCustPoint/integralAdjustment',
    method: 'post',
    data
  })
}
// 轨迹查询
export function customerIntegrationTrajectoryInfo(data) {
  return fetch({
    url: '/bxmIntegral/appCustPoint/customerIntegrationTrajectoryInfo',
    method: 'post',
    data
  })
}

// 上传文件
export function importCustomerIntegration(data, onUploadProgress) {
  return fetch({
    url: '/bxmIntegral/appCustPoint/importCustomerIntegration',
    method: 'post',
    data,
    onUploadProgress: progressEvent => {
      onUploadProgress && onUploadProgress(progressEvent)
    }
  })
}
// 导出清单
export function exportCustomerIntegration(data) {
  return fetch({
    url: '/bxmIntegral/appCustPoint/exportCustomerIntegration',
    method: 'post',
    data,
    responseType: 'blob'
  })
}
// 下载模板
export function getImportTemplate(data) {
  return fetch({
    url: '/bxmIntegral/appCustPoint/getImportTemplate',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 轨迹导出
export function exportCustomerIntegrationTrajectory(data) {
  return fetch({
    url: '/bxmIntegral/appCustPoint/exportCustomerIntegrationTrajectory',
    method: 'post',
    data,
    responseType: 'blob'
  })
}
// 查询客户级别
export function getGradeName() {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/getGradeName',
    method: 'get'
  })
}
