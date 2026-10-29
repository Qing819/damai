export const reasons = [
  { code: 'REASON01', name: '等级权益补发' },
  { code: 'REASON02', name: '系统故障补发' },
  { code: 'REASON03', name: '权益派发错误' },
  { code: 'REASON04', name: '客户投诉补偿' },
  { code: 'REASON05', name: '历史权益修正' },
  { code: 'REASON06', name: '其他' }
]

export function parseList(value) {
  if (Array.isArray(value)) return value
  try {
    const data = JSON.parse(value || '[]')
    return Array.isArray(data) ? data : []
  } catch (e) {
    return []
  }
}

export function flag(value) {
  return value === true || value === 1 || value === '1'
}

export function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function newForm() {
  return {
    custId: '', validEndDate: `${new Date().getFullYear()}-12-31`, policyNo: '', oaNo: '',
    reasonCode: 'REASON01', reasonName: reasons[0].name, remark: '', attachment: '',
    attachmentName: '', selectedBenefits: []
  }
}

export function formatIdType(value) {
  return { 身份证: '居民身份证', IDCARD: '居民身份证', 护照: '中国护照', PASSPORT: '中国护照' }[value] || value || '—'
}

export function formatGrade(value) {
  return { PUXING: '普星（新V）', SANXING: '三星（新V）', SIXING: '四星（新V）', WUXING: '五星（新V）', ZHUOYUE: '卓越（新V）', ZUNYAO: '尊耀（新V）' }[value] || value || '—'
}

export function formatTime(value) {
  if (value == null || value === '') return '—'
  if (typeof value !== 'number') return String(value).replace('T', ' ').slice(0, 19)
  const date = new Date(value)
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function statusText(value) {
  return { PENDING: '待审核', APPROVED: '已通过', REJECTED: '已驳回' }[value] || value || '—'
}

function codes(values, options) {
  return parseList(values).map(value => {
    const found = options.find(option => option.code === value || option.name === value)
    return found ? found.code : value
  })
}

export function normalizeBenefit(item, catalog = [], identities = [], channels = [], isNew = false) {
  const library = catalog.find(value => value.benefitCode === item.benefitCode) || {}
  const data = { ...library, ...item }
  const rules = parseList(data.itemRulesJson)
  const projects = parseList(data.itemsJson)
  const fallback = (rule, key, initial) => rule[key] !== undefined ? rule[key]
    : data[key] !== undefined ? data[key] : isNew ? initial : null
  const result = {
    ...data,
    regions: parseList(data.regionsJson),
    identities: codes(data.identitiesJson, identities),
    items: projects.map(project => {
      const rule = rules.find(value => value.cat === project.cat && value.name === project.name) || {}
      return {
        cat: project.cat, name: project.name,
        freqUnlimited: fallback(rule, 'freqUnlimited', false) == null ? null : flag(fallback(rule, 'freqUnlimited', false)),
        freqYears: fallback(rule, 'freqYears', 1),
        freqAvgYears: fallback(rule, 'freqAvgYears', 1),
        freqCount: fallback(rule, 'freqCount', 1),
        needOrder: fallback(rule, 'needOrder', false) == null ? null : flag(fallback(rule, 'needOrder', false)),
        needAudit: fallback(rule, 'needAudit', false) == null ? null : flag(fallback(rule, 'needAudit', false)),
        orderChannels: codes(rule.orderChannels || data.orderChannelsJson || (isNew ? ['WECHAT'] : []), channels)
      }
    })
  }
  if (isNew && !result.identities.length) result.identities = ['POLICYHOLDER']
  return result
}

export function validateForm(form) {
  if (!form.custId) return '请先选择客户并点击「确认」带入'
  if (!form.selectedBenefits.length) return '请至少选择一项服务权益'
  if (!form.validEndDate || form.validEndDate < today()) return '权益有效期只能选择当日及以后的日期'
  if (!String(form.oaNo || '').trim()) return '请输入OA流水号'
  if (!reasons.some(reason => reason.code === form.reasonCode)) return '请选择调整原因'
  return ''
}

export function payloadFor(form, editing = false) {
  const reason = reasons.find(item => item.code === form.reasonCode)
  return {
    ...editing ? { id: form.id } : { custId: form.custId },
    benefitCodes: Array.from(new Set(form.selectedBenefits.map(item => item.benefitCode))).join(','),
    validEndDate: form.validEndDate,
    policyNo: String(form.policyNo || '').trim(), oaNo: String(form.oaNo || '').trim(),
    reasonCode: form.reasonCode, reasonName: reason ? reason.name : '',
    remark: form.remark || '', attachment: form.attachment || ''
  }
}
