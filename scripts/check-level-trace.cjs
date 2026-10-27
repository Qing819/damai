const assert = require('assert')
const axios = require('axios')
const { loadFile, loadComponent } = require('./test-utils.cjs')

const calls = []
const responses = {}
let live = false
async function request(config) {
  calls.push(config)
  if (!live) {
    const value = responses[config.url]
    return typeof value === 'function' ? value(config) : value || { data: [] }
  }
  assert.strictEqual(config.method, 'get', 'Verification must remain read-only')
  const response = await axios({
    ...config, baseURL: 'http://localhost:8002', timeout: 15000,
    responseType: config.responseType === 'blob' ? 'arraybuffer' : 'json'
  })
  if (config.responseType === 'blob') return response
  assert.strictEqual(response.data.header.statusCode, '000000')
  return response.data.body
}
const api = loadFile('src/api/test/index.js', () => request)
const { component, template } = loadComponent('src/views/personal/test/level-change.vue', () => api)
const columns = Array.from(template.content.matchAll(/<el-table-column[^>]*label="([^"]+)"/g), match => match[1])
assert.deepStrictEqual(columns, [
  '变化记录号', '客户', '证件类型', '证件号码', '服务归属机构', '业务渠道', '变化类型',
  '变化前等级', '变化后等级', '变化时积分', '变化原因', '变化时间', '操作'
])
const messages = []
function makeVM() {
  const vm = { ...component.data(), $message: {
    error: text => messages.push(text),
    warning: text => messages.push(text),
    success: text => messages.push(text)
  } }
  for (const [name, method] of Object.entries(component.methods)) vm[name] = method.bind(vm)
  return vm
}
async function run() {
  const vm = makeVM()
  vm.queryForm = {
    custId: '1001', custName: '张伟', idType: '身份证', idNo: '1101',
    orgName: '天津分公司', channel: '个险', changeType: 'UPGRADE',
    dateFrom: '2026-08-01', dateTo: '2026-08-31'
  }
  responses['/platform/grade/trace/page'] = { data: { total: 1, list: [{
    id: 1, trace_no: 'LV1', cust_id: '1001', cust_name: '张伟', id_type: '身份证',
    change_point: 0, change_type: 'UPGRADE', grade_before: 'SANXING', grade_after: 'SIXING'
  }] } }
  responses['/platform/grade/trace/summary'] = { data: { up_total: 5, down_total: 3, invalid_total: 2, total: 96 } }
  vm.pagination.pageNo = 4
  await vm.handleQuery()
  const query = calls.find(item => item.url.endsWith('/page')).params
  assert.strictEqual(query.pageNum, 1)
  assert.strictEqual(query.idType, '身份证')
  assert.strictEqual(query.dateFrom, '2026-08-01')
  assert.strictEqual(query.dateTo, '2026-08-31')
  assert.ok(!('pageNo' in query || 'startDate' in query || 'endDate' in query))
  assert.deepStrictEqual(calls.find(item => item.url.endsWith('/summary')).params, {
    dateFrom: '2026-08-01', dateTo: '2026-08-31'
  })
  assert.deepStrictEqual(vm.summaryData, { upgradeCount: 5, downgradeCount: 3, invalidCount: 2, totalCount: 96 })
  assert.strictEqual(vm.tableData[0].custName, '张伟')
  assert.strictEqual(vm.formatPoint(vm.tableData[0].changePoint), '0')
  assert.strictEqual(vm.formatPoint(86500), '86,500')
  assert.strictEqual(vm.formatChangeType('UPGRADE'), '升级')
  assert.strictEqual(vm.getGradeClass('SANXING'), 'badge-blue')
  assert.strictEqual(vm.getGradeClass('SIXING'), 'badge-gold')
  assert.strictEqual(vm.getGradeClass('WUXING'), 'badge-orange')
  assert.strictEqual(vm.getGradeClass('INVALID'), 'badge-gray')
  assert.strictEqual(vm.formatGradeCode('四星（新V）'), '四星（新V）')

  responses['/platform/grade/trace/detail/LV1'] = { data: { id: 1, traceNo: 'LV1', changePoint: 0, note: '详情说明' } }
  await vm.handleDetail(vm.tableData[0])
  assert.strictEqual(vm.currentDetail.custName, '张伟', 'Partial detail must preserve list customer fields')
  assert.strictEqual(vm.currentDetail.idType, '身份证')
  assert.strictEqual(vm.currentDetail.note, '详情说明')
  assert.strictEqual(vm.currentDetail.changePoint, 0)
  await vm.handleCurrentChange(3)
  assert.strictEqual(calls[calls.length - 1].params.pageNum, 3)
  await vm.handleSizeChange(20)
  assert.strictEqual(calls[calls.length - 1].params.pageNum, 1)
  assert.strictEqual(calls[calls.length - 1].params.pageSize, 20)

  const count = calls.length
  vm.queryForm.dateFrom = '2026-09-01'
  await vm.handleQuery()
  await vm.handleExport()
  assert.strictEqual(calls.length, count, 'Invalid date range must not query or export')
  await vm.handleReset()
  assert.strictEqual(vm.queryForm.idType, '')
  assert.strictEqual(vm.queryForm.dateFrom, '2026-07-01')
  assert.strictEqual(vm.queryForm.dateTo, '2026-08-25')
  responses['/platform/grade/trace/page'] = { data: null }
  await vm.fetchData()
  assert.deepStrictEqual(vm.tableData, [])
  assert.strictEqual(vm.pagination.total, 0)

  let resolveOld
  responses['/platform/grade/trace/page'] = () => new Promise(resolve => { resolveOld = resolve })
  const oldRequest = vm.fetchData()
  responses['/platform/grade/trace/page'] = { data: { total: 1, list: [{ traceNo: 'NEW' }] } }
  await vm.fetchData()
  resolveOld({ data: { total: 1, list: [{ traceNo: 'OLD' }] } })
  await oldRequest
  assert.strictEqual(vm.tableData[0].traceNo, 'NEW', 'Stale query response must not overwrite newer data')
  console.log('PASS: fields, query/summary parameters, pagination, detail fallback, zero points, badge mappings, reset, empty and stale responses')

  if (!process.argv.includes('--live')) return
  live = true
  const actual = makeVM()
  actual.queryForm.dateFrom = ''
  actual.queryForm.dateTo = ''
  await Promise.all([actual.fetchData(), actual.fetchSummary(), actual.fetchOptions()])
  assert.ok(actual.pagination.total > 0)
  assert.ok(actual.tableData.length > 0)
  assert.ok(actual.summaryData.totalCount > 0)
  assert.ok(actual.orgOptions.length && actual.idTypeOptions.length && actual.channelOptions.length)
  const row = actual.tableData.find(item => item.custName) || actual.tableData[0]
  await actual.handleDetail(row)
  assert.strictEqual(actual.currentDetail.traceNo, row.traceNo)
  actual.queryForm.custId = row.custId
  await actual.handleQuery()
  assert.ok(actual.tableData.length && actual.tableData.every(item => item.custId === row.custId))
  actual.queryForm.custId = ''
  actual.queryForm.idType = actual.idTypeOptions[0]
  await actual.handleQuery()
  assert.ok(actual.tableData.length && actual.tableData.every(item => item.idType === actual.queryForm.idType))
  actual.queryForm.idType = ''
  actual.queryForm.changeType = 'UPGRADE'
  await actual.handleQuery()
  assert.ok(actual.tableData.length && actual.tableData.every(item => item.changeType === 'UPGRADE'))
  actual.queryForm.changeType = ''
  actual.queryForm.dateFrom = '2099-01-01'
  actual.queryForm.dateTo = '2099-01-02'
  await actual.handleQuery()
  assert.strictEqual(actual.tableData.length, 0)
  assert.strictEqual(actual.summaryData.totalCount, 0)
  const exported = await api.exportGradeTraceApi({ custId: row.custId })
  const bytes = Buffer.from(exported.data)
  assert.strictEqual(bytes.slice(0, 2).toString(), 'PK', 'Export must be an XLSX ZIP file')
  assert.ok(bytes.length > 100)
  console.log('PASS: read-only live backend list, detail, customer/certificate/date filters, summary, business dictionaries and XLSX export')
  const pages = await Promise.all([1, 2].map(pageNum => api.getGradeTracePageApi({
    ...component.data().queryForm, dateFrom: undefined, dateTo: undefined, pageNum, pageSize: 10
  })))
  const firstIds = pages[0].data.list.map(item => item.traceNo)
  const duplicates = pages[1].data.list.map(item => item.traceNo).filter(id => firstIds.includes(id))
  if (duplicates.length) {
    console.error('FAIL: backend pagination repeats records across pages:', duplicates.join(', '))
    process.exitCode = 1
  } else {
    console.log('PASS: first two backend pages contain no duplicate records')
  }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
