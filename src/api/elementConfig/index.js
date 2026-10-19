import fetch from 'utils/fetch';

// 要素信息列表
export function getIntegralElementInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/getIntegralElementInfo',
    method: 'get',
    params
  })
}

// 删除要素
export function delIntegralElementInfo(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/delIntegralElementInfo',
    method: 'post',
    params
  })
}

// 检验要素是否可删除
export function checkIntegralDelete(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/checkIntegralDelete',
    method: 'post',
    params
  })
}

// 查询标签库
export function getPageLabrary(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/getPageLabrary',
    method: 'get',
    params
  })
}

// 查询标签库下的标签
export function getLabelInfoByLabraryId(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/getLabelInfoByLabraryId',
    method: 'get',
    params
  })
}


// 校验要素名称是否唯一
export function checkIntegralElementName(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/checkIntegralElementName',
    method: 'post',
    params
  })
}

// 新建要素-保存
export function addIntegralElementInfo(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/addIntegralElementInfo',
    method: 'post',
    data
  })
}

// 编辑要素-回显
export function getIntegralElementDetail(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/getIntegralElementDetail',
    method: 'get',
    params
  })
}

// 编辑要素-保存
export function updIntegralElementInfo(data) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/updIntegralElementInfo',
    method: 'post',
    data
  })
}

// 查询维表信息
export function getDimTableData(params) {
  return fetch({
    url: '/bxmIntegral/bxmIntegralElements/getDimTableData',
    method: 'get',
    params
  })
}
