import fetch from 'utils/fetch';
// 获取登陆token
export function getUserTokenApi() {
  return fetch({
    url: '/auth/login/getUserToken',
    method: 'get'
  })
}

// 机构字典
export function getBaseDictByType(params) {
  return fetch({
    url: '/auth/baseDict/baseDict/getBaseDictByType',
    method: 'get',
    params
  })
}


// 用户信息
export function getUserInfo() {
  return fetch({
    url: '/auth/user/getUserInfo',
    method: 'post'
  })
}

// 渠道
export function getChannelById(params) {
  return fetch({
    url: '/auth/user/getChannelById',
    method: 'get',
    params
  })
}

