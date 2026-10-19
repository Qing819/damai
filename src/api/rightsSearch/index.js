// 个人客户权益查询api
import fetch from 'utils/fetch';

// 获取所有客户权益列表
export function getEquityPageInfo(data) {
  return fetch({
    url: '/bxmIntegral/bxmIncrementEquity/getEquityPageInfo',
    method: 'post',
    data
  })
}

// 清单导出
export function exportEquityInfo(data) {
  return fetch({
    url: '/bxmIntegral/bxmIncrementEquity/exportEquityInfo',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 查询客户权益详情
export function getEquityDetail(params) {
  return fetch({
    url: '/bxmIntegral/bxmIncrementEquity/getEquityDetail',
    method: 'get',
    params
  })
}

// 查询客户级别
export function getGradeName() {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/getGradeName',
    method: 'get'
  })
}
