import axios from 'axios'
import crypto from 'crypto'
import { Message } from 'element-ui'
import { getToken } from 'utils/auth'
import { random } from 'utils/index'
// 创建axios实例
const service = axios.create({
  baseURL: '/api', // api的base_url
  timeout: 120000 // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  config => {
    if (getToken()) {
      config.headers.Authorization = getToken()
      if (!(typeof FormData !== 'undefined' && config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }
      const timestamp = new Date().getTime()
      const rand = random(10)
      const signKey = 'boncsingkey!@#$%^&*(((()'
      const md5 = crypto.createHash('md5')
      md5.update(timestamp + rand + signKey)
      config.params = {
        timestamp,
        random: rand,
        sign: md5.digest('hex'),
        ...config.params
      }
    }
    return config
  },
  error => {
    Promise.reject(error)
  }
)

// respone拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    if (response.status === 401 || (res.status === 40101)) {
      return Promise.reject('error')
    }
    if (res.status === 40301) {
      Message({
        message: '当前用户无相关操作权限！',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject('error')
    }
    if (res.status === 40001) {
      Message({
        message: '账户或密码错误！',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject('error')
    }
    if (res.status === 41111) {
      Message({
        message: '账户已被锁定，请联系管理员进行解锁！',
        type: 'warning'
      })
      return Promise.reject('error')
    }
    if (response.status !== 200 && res.status !== 200) {
      Message({
        message: res.message,
        type: 'error',
        duration: 5 * 1000
      })
    } else {
      if (response.data.header) {
        if (response.data.header.statusCode === '000000') {
          return response.data.body
        } else {
          Message({
            message: response.data.header.message
              ? response.data.header.message
              : response.data.body.message,
            type: 'warning'
          })
          return Promise.reject('error')
        }
      }
      return response.data
    }
  },
  error => {
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
