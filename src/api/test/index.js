import fetch from 'utils/fetch';

/**
 * 等级权益 API
 */

// 14. 等级版本列表
export function getGradeConfigVersionsApi() {
  return fetch({
    url: '/platform/grade/config/versions',
    method: 'get'
  });
}

// 15. 当前生效版本
export function getGradeConfigCurrentApi() {
  return fetch({
    url: '/platform/grade/config/current',
    method: 'get'
  });
}

// 16. 版本下分档列表
export function getGradeConfigBandsApi(params) {
  return fetch({
    url: '/platform/grade/config/bands',
    method: 'get',
    params
  });
}

// 17. 新增版本（自动复制当前分档）
export function addGradeConfigVersionApi(data) {
  return fetch({
    url: '/platform/grade/config/version',
    method: 'post',
    data
  });
}

export function voidGradeConfigVersionApi(id, data) {
  return fetch({
    url: `/platform/grade/config/version/${id}/void`,
    method: 'post',
    data
  });
}

export function deleteGradeConfigVersionApi(id) {
  return fetch({
    url: `/platform/grade/config/version/${id}`,
    method: 'delete'
  });
}

// 18. 保存分档（新增/编辑，校验区间）
export function saveGradeConfigBandApi(data) {
  return fetch({
    url: '/platform/grade/config/band',
    method: 'post',
    data
  });
}

export function saveGradeConfigBandsBatchApi(data) {
  return fetch({
    url: '/platform/grade/config/bands/batch',
    method: 'post',
    data
  });
}

export function deleteGradeConfigBandApi(id) {
  return fetch({
    url: `/platform/grade/config/band/${id}`,
    method: 'delete'
  });
}

export function switchApplyApi(data) {
  return fetch({
    url: '/switch/apply/add',
    method: 'post',
    data
  });
}
export function getSwitchIdTypesApi() {
  return fetch({
    url: '/platform/dict/ID_TYPE',
    method: 'get'
  });
}
export function importCsvApi(file) {
  const formData = new FormData();
  formData.append('file', file);

  return fetch({
    url: '/switch/apply/importCsv',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 20. 按积分试算命中等级
export function getGradeByPointApi(params) {
  return fetch({
    url: '/platform/grade/config/grade-by-point',
    method: 'get',
    params
  });
}

// 21. 等级变化轨迹分页
export function getGradeTracePageApi(params) {
  return fetch({
    url: '/platform/grade/trace/page',
    method: 'get',
    params
  });
}

// 22. 等级变化统计
export function getGradeTraceSummaryApi(params) {
  return fetch({
    url: '/platform/grade/trace/summary',
    method: 'get',
    params
  });
}

// 23. 等级变化详情
export function getGradeTraceDetailApi(id) {
  return fetch({
    url: `/platform/grade/trace/detail/${id}`,
    method: 'get'
  });
}

// 24. 记录等级变化
export function recordGradeTraceApi(data) {
  return fetch({
    url: '/platform/grade/trace/record',
    method: 'post',
    data
  });
}

// 25. 机构+等级信息卡列表
export function getOrgPackageCardsApi(params) {
  return fetch({
    url: '/platform/org/package/cards',
    method: 'get',
    params
  });
}

// 26. 保存机构套餐配置
export function saveOrgPackageConfigApi(data) {
  return fetch({
    url: '/platform/org/package/config',
    method: 'post',
    data
  });
}

// 27. 套餐变更历史分页
export function getOrgPackageChangeLogApi(params) {
  return fetch({
    url: '/platform/org/package/change-log',
    method: 'get',
    params
  });
}

// 28. 按等级查权益配置
export function getBenefitConfigApi(params) {
  return fetch({
    url: '/platform/benefit/config',
    method: 'get',
    params
  });
}

// 29. 保存权益配置
export function saveBenefitConfigApi(data) {
  return fetch({
    url: '/platform/benefit/config',
    method: 'post',
    data
  });
}

// 30. 客户权益现状
export function getCustBenefitStatusApi(custId) {
  return fetch({
    url: `/platform/benefit/cust/status/${custId}`,
    method: 'get'
  });
}

// 31. 权益使用记录分页
export function getBenefitUsagePageApi(params) {
  return fetch({
    url: '/platform/benefit/usage/page',
    method: 'get',
    params
  });
}

// 32. 记录权益使用
export function recordBenefitUsageApi(data) {
  return fetch({
    url: '/platform/benefit/usage',
    method: 'post',
    data
  });
}

// 55. 等级变化轨迹导出（Excel）
export function exportGradeTraceApi(params) {
  return fetch({
    url: '/platform/grade/trace/export',
    method: 'get',
    params,
    responseType: 'blob'
  });
}

// 58. 订单归属机构列表
export function getOrgPackageAttributionPageApi(params) {
  return fetch({
    url: '/platform/org/package/attribution/page',
    method: 'get',
    params
  });
}

// 59. 修改订单归属机构
export function updateOrgPackageAttributionApi(data) {
  return fetch({
    url: '/platform/org/package/attribution/update',
    method: 'post',
    data
  });
}
export function getRuleListApi(params) {
  return fetch({
    url: '/platform/benefit/rule/list',
    method: 'get',
    params
  });
}
export function getRuleViewApi(params) {
  return fetch({
    url: '/platform/benefit/rule/view',
    method: 'get',
    params
  });
}
export function saveRuleApi(data) {
  return fetch({
    url: '/platform/benefit/rule/save',
    method: 'post',
    data
  });
}
export function deleteRuleApi(data) {
  return fetch({
    url: '/platform/benefit/rule/delete',
    method: 'post',
    data
  });
}
export function importRuleApi(params) {
  return fetch({
    url: '/platform/benefit/rule/import',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

/**
 * 导出权益规则 Excel 文件
 * @param {string} versionTag - 版本标识，例如 'V2_2027'
 */
export function exportBenefitRuleApi(versionTag) {
  return fetch({
    url: '/platform/benefit/rule/export',
    method: 'get',
    params: { versionTag },
    responseType: 'blob'
  });
}

/**
 * 导入权益规则 Excel 文件
 * @param {File} file - 上传的 Excel 文件对象
 * @param {string} versionTag - 版本标识，例如 'V2_2027'
 */
export function importBenefitRuleApi(file, versionTag) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('versionTag', versionTag);

  return fetch({
    url: '/platform/benefit/rule/import',
    method: 'post',
    data: formData
  });
}

export function exportRuleApi(params) {
  return fetch({
    url: '/platform/benefit/rule/template',
    method: 'get',
    params,
    responseType: 'blob' // 对应文件下载处理
  });
}
export function getRuleEnabledApi(params) {
  return fetch({
    url: '/platform/benefit/rule/enabled',
    method: 'get',
    params
  });
}
export function getBenefitItemsApi(params) {
  return fetch({
    url: '/platform/benefit/items',
    method: 'get',
    params
  });
}
export function getGradeListApi(params) {
  return fetch({
    url: '/platform/benefit/rule/gradeList',
    method: 'get',
    params
  });
}
export function getRuleVersionsApi() {
  return fetch({
    url: '/platform/benefit/rule/versions',
    method: 'get'
  });
}
export function getBenefitGradeListApi(params) {
  return fetch({
    url: '/platform/benefit/rule/grades',
    method: 'get',
    params
  });
}
export function getServiceRuleModListApi(params) {
  return fetch({ url: '/platform/benefit/rule/mod/list', method: 'get', params });
}
export function getServiceRuleModGradesApi(params) {
  return fetch({ url: '/platform/benefit/rule/mod/gradeOptions', method: 'get', params });
}
export function getServiceRuleModViewApi(id) {
  return fetch({ url: '/platform/benefit/rule/mod/view', method: 'get', params: { id } });
}
export function createServiceRuleModApi(data) {
  return fetch({ url: '/platform/benefit/rule/mod/create', method: 'post', data });
}
export function updateServiceRuleModApi(data) {
  return fetch({ url: '/platform/benefit/rule/mod/update', method: 'post', data });
}
export function deleteServiceRuleModApi(id) {
  return fetch({ url: '/platform/benefit/rule/mod/delete', method: 'post', params: { id } });
}
export function serviceAdjustApplyApi(data) {
  return fetch({
    url: '/benefit/adjust/apply',
    method: 'post',
    data
  });
}
export function getBenefitAdjustPageApi(params) {
  return fetch({
    url: '/benefit/adjust/page',
    method: 'get',
    params
  });
}
export function benefitAdjustModifyApi(data) {
  return fetch({
    url: '/benefit/adjust/modify',
    method: 'put',
    data
  });
}
export function deleteBenefitAdjustApi(id) {
  return fetch({
    url: `/benefit/adjust/${id}`,
    method: 'delete'
  });
}
export function getBenefitAdjustWorkbenchApi(custId) {
  return fetch({
    url: `/benefit/adjust/workbench/${custId}`,
    method: 'get'
  });
}
export function getBenefitAdjustDetailApi(id) {
  return fetch({
    url: `/benefit/adjust/detail/${id}`,
    method: 'get'
  });
}
export function passBenefitAdjustApi(data) {
  return fetch({
    url: '/benefit/adjust/audit',
    method: 'post',
    data
  });
}
export function getBenefitTracePageApi(params) {
  return fetch({
    url: '/benefit/trace/page',
    method: 'get',
    params
  });
}
export function getBenefitTraceStatsApi(params) {
  return fetch({
    url: '/benefit/trace/stats',
    method: 'get',
    params
  });
}
export function exportBenefitTraceApi(params) {
  return fetch({
    url: '/benefit/trace/export',
    method: 'get',
    params,
    responseType: 'blob'
  });
}
export function getBenefitAnnualPageApi(params) {
  return fetch({
    url: '/benefit/trace/annual/page',
    method: 'get',
    params
  });
}
export function getBenefitTraceDetailApi(id) {
  return fetch({
    url: `/benefit/trace/detail/${id}`,
    method: 'get'
  });
} export function getSwitchRecordDetailApi(applyNo) {
  return fetch({
    url: `/switch/record/detail/${applyNo}`,
    method: 'get'
  });
}

export function getSwitchRecordPageApi(params) {
  return fetch({
    url: '/switch/record/page',
    method: 'get',
    params
  });
}
export function switchRecordExportApi(params) {
  return fetch({
    url: '/switch/record/export',
    method: 'get',
    params,
    responseType: 'blob'
  });
}
export function exportSwitchApplyApi(params) {
  return fetch({
    url: '/switch/apply/template',
    method: 'get',
    params,
    responseType: 'blob' // 对应文件下载处理
  });
}
export function preUpdateEffectApi(data) {
  return fetch({
    url: '/switch/apply/batchUpdateEffect',
    method: 'post',
    data
  });
}

export function switchTrialApi(data) {
  return fetch({
    url: '/switch/trial/single',
    method: 'post',
    data
  });
}
export function switchTrialBatchApi(data) {
  return fetch({
    url: '/switch/trial/batch',
    method: 'post',
    data
  });
}
export function switchTrialExtraApi(data) {
  return fetch({
    url: '/switch/trial/extra',
    method: 'post',
    data
  });
}
export function getSwitchApplyPageApi(params) {
  return fetch({
    url: '/switch/apply/page',
    method: 'get',
    params
  });
}
export function getSwitchTrialTaskPageApi(params) {
  return fetch({
    url: '/switch/trial/task/page',
    method: 'get',
    params
  });
}
export function getSwitchTrialItemPageApi(params) {
  return fetch({
    url: '/switch/trial/item/page',
    method: 'get',
    params
  });
}
export function getSwitchTrialRiskPageApi(params) {
  return fetch({
    url: '/switch/trial/risk/page',
    method: 'get',
    params
  });
}
export function getPlatformOrgApi(params) {
  return fetch({
    url: '/platform/dict/biz/orgs',
    method: 'get',
    params
  });
}
export function getPlatformIdTypesApi(params) {
  return fetch({
    url: '/platform/dict/biz/idTypes',
    method: 'get',
    params
  });
}
export function getPlatformChannelsApi(params) {
  return fetch({
    url: '/platform/dict/biz/channels',
    method: 'get',
    params
  });
}
export function getPlatformOrderChannelApi(params) {
  return fetch({
    url: '/platform/dict/ORDER_CHANNEL',
    method: 'get',
    params
  });
}

export function getServiceRuleIdentitiesApi() {
  return fetch({
    url: '/platform/dict/IDENTITY',
    method: 'get'
  });
}
export function switchApplyDetailApi(applyNo) {
  return fetch({
    url: `/switch/apply/detail/${applyNo}`,
    method: 'get'
  });
}
export function switchApplyExportApi(params) {
  return fetch({
    url: '/switch/apply/export',
    method: 'get',
    params,
    responseType: 'blob'
  });
}
export function getRulePageApi(params) {
  return fetch({
    url: '/rule/v2/page',
    method: 'get',
    params
  });
}
export function getRuleDetailApi(id) {
  return fetch({
    url: `/rule/v2/${id}`,
    method: 'get'
  });
}
export function pointRuleAddApi(data) {
  return fetch({
    url: '/rule/v2/add',
    method: 'post',
    data
  });
} export function switchApplyBatchRemoveApi(data) {
  return fetch({
    url: '/switch/apply/batchRemove',
    method: 'post',
    data
  });
}
export function pointRuleUpdateApi(data) {
  return fetch({
    url: '/rule/v2/update',
    method: 'post',
    data
  });
} export function pointRuleDisableApi(id) {
  return fetch({
    url: `/v2/disable/${id}`,
    method: 'post'
  });
}
