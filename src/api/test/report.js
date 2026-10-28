import fetch from 'utils/fetch'

export function getReportCustomers(params) {
  return fetch({ url: '/report/drill/customers', method: 'get', params })
}

export function getReportPolicies(custId) {
  return fetch({ url: '/report/drill/policies', method: 'get', params: { custId } })
}

export function exportReportCustomers(params) {
  return fetch({ url: '/report/drill/export/customers', method: 'get', params, responseType: 'blob' })
}
