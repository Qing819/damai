import fetch from 'utils/fetch';

// 获取组织机构
export function getOrganizationInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmBaseButton/getOrganizationInfo',
    method: 'get',
    params
  })
}

// 获取角色
export function getRoleInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmBaseButton/getRoleInfo',
    method: 'get',
    params
  })
}

// 获取按钮授权
export function getButtonMenu(params) {
  return fetch({
    url: '/bxmIntegral/bxmBaseButton/getButtonMenu',
    method: 'get',
    params
  })
}

// 保存按钮授权
export function addButtonMenu(data) {
  return fetch({
    url: '/bxmIntegral/bxmBaseButton/addButtonMenu',
    method: 'post',
    data
  })
}

// 获取角色/机构权限
export function getButtonMenuInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmBaseButton/getButtonMenuInfo',
    method: 'get',
    params
  })
}

// 获取页面的权限
export function getPageButtonMenuInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmBaseButton/getPageButtonMenuInfo',
    method: 'get',
    params
  })
}
