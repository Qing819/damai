import Cookies from 'js-cookie'
import { getUserTokenApi } from 'api/auth'
import { drawSystemWatermark } from 'utils/watermark/index'

const TokenKey = 'main-Token';
const userToken = 'COOKIE_CURRENT_LOGIN_USER_STATUS';
const token = '7970A7DF80FF7766A7587A2AF33EE5F23CE3596227962724CBFE9E8C6243AC2E6A7769EDE8868F6A4E35D84E60BEA850007111C033A037FB'
// const token = 'DAFB6D00D90EA62F2A431557FC8C629CDFF7F5D21F145E75F5F8EF20ABCE5AF6A1195262B6382EDF815835A63996528B2432796D380AD8E4'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function setUserToken() {
  if (process.env.NODE_ENV === 'production') return
  return Cookies.set(userToken, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export async function getUserToken() {
  setUserToken()
  // token
  const res = await getUserTokenApi()
  setToken(res.token)
  if (process.env.NODE_ENV === 'development') return
  // 水印
  drawSystemWatermark()
}



