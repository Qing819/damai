// 个人客户分级api
import fetch from 'utils/fetch';

// 等级规则查询
export function getGradeType() {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/getGradeType',
    method: 'get'
  })
}

// 新增页面要素回显内容
export function customerGradeElementContentInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/customerGradeElementContentInfo',
    method: 'post',
    params
  })
}

// 编辑要素内容回显
export function customerGradeElementContentDefaultInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/customerGradeElementContentDefaultInfo',
    method: 'post',
    params
  })
}

// 客户分级分页查询
export function customerGradePageInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/customerGradePageInfo',
    method: 'post',
    params
  })
}

// 客户分级分页查询表头项
export function customerGradeFieldValueList(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/customerGradeFieldValueList',
    method: 'post',
    params
  })
}

// 删除客户分级规则
export function delCustomerGradeRule(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/delCustomerGradeRule',
    method: 'post',
    params
  })
}

// 保存分级规则（新增、修改）
export function editCustomerGrade(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/editCustomerGrade',
    method: 'post',
    data
  })
}

// 【保存】校验唯一性与主键
export function checkEditCustomerGrade(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralCustomerGrade/checkEditCustomerGrade',
    method: 'post',
    data
  })
}
