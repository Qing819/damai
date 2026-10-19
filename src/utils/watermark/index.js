import fetch from 'utils/fetch'
import { TextWatermark, ImgWatermark, haveWatermark } from './watermark'

export function drawSystemWatermark() {
  // 水印已经存在时，直接return
  if (haveWatermark()) { return }

  let watermarkObj = {}
  // 检查是否开启安全模式
  fetch({
    url: '/auth/bxmHomePage/selectByCode',
    method: 'post',
    params: { code: 'watermark' }
  }).then(res => {
    // 安全模块开启时，才进行水印的渲染
    if (res.result && res.result.isPower === '00') {
      // 获取系统水印
      fetch({
        url: '/bxmSafe/dataSafeWatermark/getWatermarkToRedis',
        method: 'get',
        params: { applicationType: '00' }
      }).then(res => {
        const watermarkDetail = res.watermarkDetail || {}
        // 文本水印
        if (watermarkDetail.watermarkType === '00') {
          watermarkObj = new TextWatermark({
            ...{ text: watermarkDetail.watermarkContent },
            ...watermarkDetail.fontWaterMarkVo
          })
          watermarkObj.set()
          // 图片水印
        } else if (watermarkDetail.watermarkType === '01') {
          const locationOrigin = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://172.16.19.104:8888'
          watermarkObj = new ImgWatermark({
            ...{ imgUrl: watermarkDetail.picPath ? `${locationOrigin}/${watermarkDetail.picPath}` : '' },
            ...watermarkDetail.picWaterMarkVo
          })
          watermarkObj.set()
        }
        return watermarkObj
      }).catch(() => watermarkObj)
    }
  })
}
