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

function rejectResponse(response, message, type = 'error') {
  const error = new Error(message || '请求失败，请稍后重试')
  error.response = response
  error.messageShown = true
  Message({ message: error.message, type, duration: 5 * 1000 })
  return Promise.reject(error)
}

function handleRequestError(error) {
  if (!error.messageShown) {
    const response = error.response
    const data = response && response.data
    const message = data && ((data.header || {}).message || data.message)
    error.message = message || (error.code === 'ECONNABORTED'
      ? '请求超时，请稍后重试'
      : response && response.status === 401
        ? '登录已失效，请重新登录'
        : response && response.status === 403
          ? '当前用户无相关操作权限！'
          : response ? '请求失败，请稍后重试' : '网络连接失败，请稍后重试')
    error.messageShown = true
    Message({ message: error.message, type: 'error', duration: 5 * 1000 })
  }
  return Promise.reject(error)
}

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
  handleRequestError
)

// respone拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    if (response.status < 200 || response.status >= 300) {
      return rejectResponse(response, res && ((res.header || {}).message || res.message))
    }
    if (!res) return res
    if (res.status === 40101) {
      return rejectResponse(response, '登录已失效，请重新登录')
    }
    if (res.status === 40301) {
      return rejectResponse(response, '当前用户无相关操作权限！')
    }
    if (res.status === 40001) {
      return rejectResponse(response, '账户或密码错误！')
    }
    if (res.status === 41111) {
      return rejectResponse(response, '账户已被锁定，请联系管理员进行解锁！', 'warning')
    }
    if (res.header) {
      if (res.header.statusCode === '000000') return res.body
      return rejectResponse(response, res.header.message || (res.body || {}).message)
    }
    if (typeof res.status === 'number' && res.status !== 200) {
      return rejectResponse(response, res.message)
    }
    return res
  },
  handleRequestError
)

export default service
