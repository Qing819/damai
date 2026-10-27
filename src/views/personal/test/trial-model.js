export function parseTrialCsv(text, idTypes) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false
  let quoteClosed = false
  const source = text.replace(/^\uFEFF/, '')
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { value += '"'; index++ } else if (!quoted && value) {
        throw new Error('CSV 引号格式不正确')
      } else {
        if (quoteClosed) throw new Error('CSV 引号格式不正确')
        quoted = !quoted
        quoteClosed = !quoted
      }
    } else if (!quoted && (char === ',' || char === '\r' || char === '\n')) {
      row.push(value.trim())
      value = ''
      quoteClosed = false
      if (char !== ',') {
        if (row.some(cell => cell)) rows.push(row)
        row = []
        if (char === '\r' && source[index + 1] === '\n') index++
      }
    } else {
      if (quoteClosed && !/\s/.test(char)) throw new Error('CSV 引号后只能是分隔符')
      value += char
    }
  }
  if (quoted) throw new Error('CSV 引号未闭合')
  row.push(value.trim())
  if (row.some(cell => cell)) rows.push(row)
  if (!rows.length || rows[0].join(',') !== '客户姓名,证件类型,证件号') throw new Error('CSV 表头须为：客户姓名,证件类型,证件号')
  if (rows.length === 1) throw new Error('导入名单不能为空')
  return rows.slice(1).map((cells, index) => {
    if (cells.length !== 3 || cells.some(cell => !cell)) throw new Error(`第 ${index + 2} 行须填写客户姓名、证件类型和证件号`)
    const type = idTypes.find(item => item.code === cells[1] || item.name === cells[1] ||
      (item.code === 'IDCARD' && cells[1] === '居民身份证') || (item.code === 'PASSPORT' && cells[1] === '中国护照'))
    if (!type) throw new Error(`第 ${index + 2} 行证件类型不在当前字典中`)
    return { custName: cells[0], idType: type.code, idNo: cells[2] }
  })
}

export function trialCsv(rows) {
  return '\uFEFF客户姓名,证件类型,证件号\r\n' + rows.map(row => {
    const cells = [row.custName, row.idType, row.idNo]
    if (cells.some(value => /[,"\r\n]/.test(String(value)))) {
      throw new Error('当前批量接口不支持字段包含逗号、双引号或换行，请核对导入名单')
    }
    return cells.join(',')
  }).join('\r\n')
}

export function trialNumber(value) {
  if (value == null || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : '—'
}

export function trialGrade(value, isNew = false) {
  if (value == null || value === '') return '—'
  const name = { YIXING: '一星', ERXING: '二星', SANXING: '三星', SIXING: '四星', WUXING: '五星', PUXING: '普星', ZHUOYUE: '卓越', ZUNYAO: '尊耀' }[value] || value
  return isNew && !String(name).includes('新V') ? `${name}（新V）` : name
}
