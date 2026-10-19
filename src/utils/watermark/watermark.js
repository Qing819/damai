/**
 * 使用方法
 * 文本水印示例：let obj = new TextWatermark(水印参数); obj.set()
 * Created by zhangyajing on 2021/04/15.
 */
// 绘制文本水印
function drawTextWatermark(cans, canvasWidth, canvasHeight, params) {
  // 修改canvas的原点坐标
  cans.translate(canvasWidth / 2, canvasHeight / 2);
  // 旋转角度
  cans.rotate(params.rotate * Math.PI / 180);
  // 字号 字体
  cans.font = `${params.fontSize}px ${params.fontFamily}`;
  // 设置填充绘画的颜色、渐变或者模式
  cans.fillStyle = params.color;
  // 设置文本内容的当前对齐方式
  cans.textAlign = params.textAlign;
  // 设置在绘制文本时使用的当前文本基线
  cans.textBaseline = params.textBaseline;
  // 透明度
  cans.globalAlpha = params.opacity / 100;
  // 在画布上绘制填色的文本（输出的文本，开始绘制文本的X坐标位置，开始绘制文本的Y坐标位置）
  const textContentWidth = cans.measureText(params.text).width
  let startX = 0
  let startY = 0
  switch (params.alignX) {
    case 'left': startX = (-canvasWidth + textContentWidth) / 2; break;
    case 'center': startX = 0; break;
    case 'right': startX = canvasWidth / 2 - (textContentWidth / 2); break;
    default: break;
  }
  switch (params.alignY) {
    case 'top': startY = -canvasHeight / 2 + params.fontSize / 2; break;
    case 'middle': startY = 0; break;
    case 'bottom': startY = canvasHeight / 2 - (params.fontSize / 2); break;
    default: break;
  }
  cans.fillText(params.text, startX, startY);
  return cans
}

// 计算字符串的宽度
function computeStrLength(str, fontSize = 14) {
  const strArr = str.split('')
  let strLength = 0
  strArr.forEach(item => {
    if (/^[\u4e00-\u9fa5]*$/.test(item)) { // 检测汉字
      strLength = strLength + fontSize
    } else if (/^[a-zA-Z]*$/.test(item)) { // 检测字母 0.62
      strLength = strLength + fontSize * 0.62
    } else if (/^[0-9]*$/.test(item)) { // 检测数字 0.59
      strLength = strLength + fontSize * 0.59
    } else if (/^[~!@#$%^&*()/|,.<>?"'();:_+-=[\]{}]/.test(item)) {
      strLength = strLength + fontSize * 0.92
    } else {
      strLength = strLength + fontSize
    }
  })
  return strLength
}

// 计算文本水印canvas宽度（根据旋转角度计算宽高）：最小120
function computeCanvasSize(str, fontSize, rotate) {
  const textWidth = computeStrLength(str, fontSize)
  const height = Math.abs(Math.ceil(Math.sin(Math.PI / 180 * rotate) * textWidth))
  const width = Math.abs(Math.ceil(Math.cos(Math.PI / 180 * rotate) * textWidth))
  return {
    width: width < 120 ? 120 : width,
    height: height < 120 ? 120 : height
  }
}

// 文字水印
export class TextWatermark {
  constructor(config) {
    this.params = {
      ...{
        rotate: 20, // 旋转角度（0到360）
        opacity: 20, // 透明度（0到100）
        alignX: 'center', // 水平对齐方式 left center right
        alignY: 'middle', // 垂直对齐方式 top middle bottom
        text: '', // 文本内容
        fontFamily: 'Microsoft YaHei', // 字体
        fontSize: 18, // 字号
        color: 'rgb(200,200,200)', // 颜色
        textAlign: 'center', // 文本相对基线的位置
        textBaseline: 'middle' // 文本相对基线的位置
      }, ...config
    }
    // canvas对象
    this.cans = null;
    // 水印div的id
    this.id = '1.23452384164.987654321';
    // 避免某些数字类型的参数传进来的是String类型 这里先统一处理一遍
    Number.isFinite(this.params.rotate) || (this.params.rotate = parseFloat(this.params.rotate))
    Number.isFinite(this.params.opacity) || (this.params.opacity = parseFloat(this.params.opacity))
    Number.isFinite(this.params.fontSize) || (this.params.fontSize = parseFloat(this.params.fontSize))
    // canvas的宽高
    const canvasSize = computeCanvasSize(this.params.text, this.params.fontSize, this.params.rotate)
    this.canvasWidth = canvasSize.width
    this.canvasHeight = canvasSize.height
  }
  set() {
    if (window.parent.document.getElementById(this.id) !== null) {
      window.parent.document.body.removeChild(window.parent.document.getElementById(this.id));
    }

    // 创建一个画布
    const can = document.createElement('canvas');
    // 设置画布的长宽
    can.width = this.canvasWidth;
    can.height = this.canvasHeight;
    const cans = can.getContext('2d');
    this.cans = cans
    drawTextWatermark(cans, this.canvasWidth, this.canvasHeight, this.params)
    const div = document.createElement('div');
    div.id = this.id;
    div.style.pointerEvents = 'none';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.position = 'absolute';
    div.style.zIndex = '100000';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.background = 'url(' + can.toDataURL('image/png') + ') left top repeat';
    window.parent.document.body.appendChild(div);
    // return id;
  }
  // 重绘
  reset() {
    this.cans.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.set()
  }
  // 关闭水印
  close() {
    window.parent.document.getElementById(this.id).remove()
  }
}

// 图片水印
export class ImgWatermark {
  constructor(config) {
    this.params = {
      ...{
        canvasWidth: 120, // canvas单元格的宽度
        canvasHeight: 120, // canvas单元格的高度
        rotate: 20, // 旋转角度
        opacity: 1, // 透明度
        alignX: 'center', // 水平对齐方式 left center right
        alignY: 'middle', // 垂直对齐方式 top middle bottom
        imgUrl: '', // 图片水印中图片的地址
        zoom: 1 // 图片缩放
      }, ...config
    }
    // 水印div的id
    this.id = '1.23452384164.0987654321';
    // 避免某些数字类型的参数传进来的是String类型 这里先统一处理一遍
    Number.isFinite(this.params.rotate) || (this.params.rotate = parseFloat(this.params.rotate))
    Number.isFinite(this.params.opacity) || (this.params.opacity = parseFloat(this.params.opacity))
    Number.isFinite(this.params.zoom) || (this.params.zoom = parseFloat(this.params.zoom))
    Number.isFinite(this.params.canvasWidth) || (this.params.canvasWidth = parseFloat(this.params.canvasWidth))
    Number.isFinite(this.params.canvasHeight) || (this.params.canvasHeight = parseFloat(this.params.canvasHeight))
  }
  set() {
    if (window.parent.document.getElementById(this.id) !== null) {
      window.parent.document.body.removeChild(window.parent.document.getElementById(this.id));
    }

    const div = document.createElement('div');
    div.id = this.id;
    div.style.pointerEvents = 'none';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.position = 'absolute';
    div.style.zIndex = '100000';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.backgroundImage = 'url(' + this.params.imgUrl + ')';
    div.style.backgroundRepeat = 'no-repeat';
    this.params.alignY === 'middle' && (this.params.alignY = 'center')
    div.style.backgroundPosition = `${this.params.alignX} ${this.params.alignY}`;
    div.style.backgroundSize = `${this.params.zoom * 100}% auto`;
    div.style.transform = `rotate(${this.params.rotate}deg)`
    div.style.opacity = `${this.params.opacity / 100}`
    window.parent.document.body.appendChild(div);
  }
  // 重绘
  reset() {
    this.set()
  }
  // 关闭水印
  close() {
    window.parent.document.getElementById(this.id).remove()
  }
}

// 检查水印是否已经存在
export function haveWatermark() {
  if (window.parent.document.getElementById('1.23452384164.987654321') || window.parent.document.getElementById('1.23452384164.0987654321')) {
    return true
  } else {
    return false
  }
}
