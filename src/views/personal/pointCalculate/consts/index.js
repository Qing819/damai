// 可以用于测算的积分规则名
export const integralNamesOfCalculate = ['保费积分', '忠诚积分', '活动积分', '特殊项目积分']


// 粗略计算表单label宽度, 传入列配置columnSetting
export function getLabelWidth(columnSetting) {
  if (!Array.isArray(columnSetting)) { return }

  let textNum = 4 // 默认从4个文字开始
  columnSetting.forEach(item => {
    item.elementName.length > textNum ? textNum = item.elementName.length : ''
  })
  return Math.ceil(textNum * 14 + 30) + 'px'
}