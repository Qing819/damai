import fetch from 'utils/fetch';

/**
 * 积分管理 API
 */

// 1. 客户积分列表（分页）
export function getCustPointListApi(params) {
  return fetch({
    url: '/platform/point/cust/list',
    method: 'get',
    params
  });
}

// 2. 客户积分详情（含三类轨迹）
export function getCustPointDetailApi(custId) {
  return fetch({
    url: `/platform/point/cust/detail/${custId}`,
    method: 'get'
  });
}

// 3. 积分轨迹分页查询
export function getPointTracePageApi(params) {
  return fetch({
    url: '/platform/point/trace/page',
    method: 'get',
    params
  });
}

// 4. 积分轨迹本期统计
export function getPointTraceSummaryApi(params) {
  return fetch({
    url: '/platform/point/trace/summary',
    method: 'get',
    params
  });
}

// 5. 提交积分调整申请
export function submitPointAdjustApi(data) {
  return fetch({
    url: '/platform/point/adjust/submit',
    method: 'post',
    data
  });
}

// 6. 申请列表分页
export function getPointAdjustPageApi(params) {
  return fetch({
    url: '/platform/point/adjust/page',
    method: 'get',
    params
  });
}

// 7. 申请详情
export function getPointAdjustDetailApi(id) {
  return fetch({
    url: `/platform/point/adjust/detail/${id}`,
    method: 'get'
  });
}

// 8. 修改并重新提交（仅已驳回）
export function modifyPointAdjustApi(data) {
  return fetch({
    url: '/platform/point/adjust/modify',
    method: 'put',
    data
  });
}

// 9. 删除申请（仅已驳回）
export function deletePointAdjustApi(id) {
  return fetch({
    url: `/platform/point/adjust/${id}`,
    method: 'delete'
  });
}

// 10. 审核（通过/驳回）
export function auditPointAdjustApi(data) {
  return fetch({
    url: '/platform/point/adjust/audit',
    method: 'post',
    data
  });
}

// 11. 查询客户当前积分
export function getCustCurrentPointApi(custId) {
  return fetch({
    url: `/platform/point/adjust/current/${custId}`,
    method: 'get'
  });
}

// 12. 客户积分流水分页（前台）
export function getPointDetailV2Api(custId, params) {
  return fetch({
    url: `/point/v2/detail/${custId}`,
    method: 'get',
    params
  });
}

// 13. 客户积分汇总（前台）
export function getPointSummaryV2Api(custId) {
  return fetch({
    url: `/point/v2/summary/${custId}`,
    method: 'get'
  });
}

// 51. 附件上传（jpg/png/pdf，≤5MB）
export function uploadAttachmentApi(data) {
  return fetch({
    url: '/platform/attachment/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  });
}

// 52. 附件下载
export function downloadAttachmentApi(params) {
  return fetch({
    url: '/platform/attachment/download',
    method: 'get',
    params,
    responseType: 'blob' // 对应文件下载处理
  });
}

// 53. 客户积分列表导出（Excel）
export function exportCustListApi(params) {
  return fetch({
    url: '/platform/point/export/custList',
    method: 'get',
    params,
    responseType: 'blob'
  });
}

// 54. 积分轨迹导出（Excel）
export function exportTraceApi(params) {
  return fetch({
    url: '/platform/point/export/trace',
    method: 'get',
    params,
    responseType: 'blob'
  });
}

// 56. 实收记录明细分页查询
export function getPayDetailPageApi(params) {
  return fetch({
    url: '/platform/point/pay-detail/page',
    method: 'get',
    params
  });
}

// 57. 实收记录详情
export function getPayDetailApi(payNo) {
  return fetch({
    url: `/platform/point/pay-detail/${payNo}`,
    method: 'get'
  });
}

// 60. 积分变动记录详情
export function getPointTraceDetailApi(traceId) {
  return fetch({
    url: `/platform/point/trace/detail/${traceId}`,
    method: 'get'
  });
}

// 61. 同保单近期积分变动
export function getPointTraceByPolicyApi(policyNo) {
  return fetch({
    url: `/platform/point/trace/by-policy/${policyNo}`,
    method: 'get'
  });
}