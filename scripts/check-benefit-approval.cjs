const assert = require('assert')
const axios = require('axios')
const { loadFile, loadComponent } = require('./test-utils.cjs')

const calls = []
const messages = []
let handler = async config => ({ data: config.url.endsWith('/page') ? { list: [], total: 0 } : [] })
async function request(config) { calls.push(config); return handler(config) }
const api = loadFile('src/api/test/index.js', () => request)
const point = loadFile('src/api/test/point.js', () => request)
const model = loadFile('src/views/personal/test/benefit-adjust-model.js', () => {})
const { component } = loadComponent('src/views/personal/test/service-approval.vue', name => name === '@/api/test' ? api : name === '@/api/test/point' ? point : name.includes('benefit-adjust-model') ? model : {})
function makeVM() {
  const vm = {
    ...component.data(), focused: false,
    $message: Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => messages.push({ type, text })])),
    $nextTick: callback => callback(), $refs: { opinionInput: { focus() { vm.focused = true } } }
  }
  Object.entries(component.methods).forEach(([name, method]) => { vm[name] = method.bind(vm) })
  Object.entries(component.computed).forEach(([name, getter]) => Object.defineProperty(vm, name, { get: () => getter.call(vm) }))
  return vm
}
function deferred() { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
const pending = { id: 6, applyNo: 'BEN-TEST', custId: '1001', custName: '测试客户', status: 'PENDING', applyTime: 1790127346000, benefitDetails: [{ benefitCode: 'QY0001', regionsJson: '["全国"]', identitiesJson: '["有效保单被保险人"]', freqCount: 2 }] }
async function run() {
  const vm = makeVM()
  handler = async () => ({ data: [] })
  await vm.loadResources()
  vm.queryForm = {
    idType: '身份证', idNo: ' 110101 ', custName: ' 张伟 ', custId: '1001', orgName: '天津分公司',
    benefitCodes: ['QY0001'], status: 'PENDING', dateFrom: '2026-01-01', dateTo: '2026-12-31', applicant: ' zhang '
  }
  handler = async () => ({ data: { list: [], total: 0 } })
  vm.currentPage = 4
  await vm.handleSearch()
  assert.deepStrictEqual(calls[calls.length - 1].params, {
    idType: '身份证', idNo: '110101', custName: '张伟', custId: '1001', orgName: '天津分公司',
    benefitCode: 'QY0001', status: 'PENDING', dateFrom: '2026-01-01', dateTo: '2026-12-31', applicant: 'zhang', pageNum: 1, pageSize: 10
  })
  vm.queryForm.custId = 'unsubmitted-change'
  await vm.handleCurrentChange(2)
  assert.strictEqual(calls[calls.length - 1].params.custId, '1001', 'Pagination uses the last submitted filters')
  await vm.handleSizeChange(20)
  assert.strictEqual(vm.currentPage, 1)
  vm.queryForm.dateFrom = '2027-01-01'
  const beforeInvalid = calls.length
  vm.handleSearch()
  assert.strictEqual(calls.length, beforeInvalid)
  await vm.handleReset()
  assert.deepStrictEqual(calls[calls.length - 1].params, { pageNum: 1, pageSize: 20 })
  assert.deepStrictEqual(vm.queryForm.benefitCodes, [])
  // Multi-select must union every matching server page before paginating.
  const rows = Array.from({ length: 101 }, (_, index) => ({ id: index + 1, applyTime: '2026-10-01' }))
  handler = async config => {
    const p = config.params
    const data = p.benefitCode === 'QY0001' ? rows : [rows[0], { id: 102, applyTime: '2026-10-02' }]
    return { data: { list: data.slice((p.pageNum - 1) * p.pageSize, p.pageNum * p.pageSize), total: data.length } }
  }
  vm.pageSize = 10
  vm.queryForm.benefitCodes = ['QY0001', 'QY0002']
  await vm.handleSearch()
  assert.strictEqual(vm.total, 102)
  assert.strictEqual(vm.tableData[0].id, 102)
  await vm.handleCurrentChange(11)
  assert.strictEqual(vm.tableData.length, 2)
  assert.ok(calls.some(call => call.params && call.params.benefitCode === 'QY0001' && call.params.pageNum === 2))
  assert.ok(!calls.some(call => call.params && String(call.params.benefitCode).includes(',')))
  // Slower requests cannot replace the current search or detail.
  const listOld = deferred(), listNew = deferred()
  vm.activeQuery.benefitCodes = []
  handler = () => listOld.promise
  const firstList = vm.fetchTableData()
  handler = () => listNew.promise
  const secondList = vm.fetchTableData()
  listNew.resolve({ data: { list: [{ id: 2 }], total: 1 } })
  await secondList
  listOld.resolve({ data: { list: [{ id: 1 }], total: 1 } })
  await firstList
  assert.strictEqual(vm.tableData[0].id, 2)
  vm.catalog = [{ benefitCode: 'QY0001', itemsJson: '[{"cat":"体检","name":"体检套餐"}]' }]
  vm.identities = [{ code: 'INSURED', name: '有效保单被保险人' }]
  handler = async () => ({ data: { ...pending } })
  await vm.handleApprove(pending)
  assert.strictEqual(vm.dialogVisible, true)
  assert.strictEqual(vm.isApproveMode, true)
  assert.strictEqual(vm.detailBenefits[0].items[0].name, '体检套餐')
  assert.strictEqual(vm.detailBenefits[0].items[0].freqYears, null)
  assert.deepStrictEqual(vm.detailBenefits[0].identities, ['INSURED'])
  assert.ok(vm.detailFields.some(field => field[0] === '申请时间' && field[1].startsWith('2026-09-23')))
  assert.strictEqual(vm.approvalRemark, '')
  const beforeReject = calls.length
  vm.approvalRemark = '   '
  await vm.handleAudit('REJECTED')
  assert.strictEqual(calls.length, beforeReject)
  assert.strictEqual(vm.opinionInvalid, true)
  assert.strictEqual(vm.focused, true)
  await vm.handleAudit('invalid')
  assert.strictEqual(calls.length, beforeReject)
  // The fetch client resolves {data}, not a second header envelope. Do not misreport success.
  handler = async config => ({ data: config.method === 'post' ? { status: 'REJECTED' } : { list: [], total: 0 } })
  vm.approvalRemark = '  驳回原因  '
  await vm.handleAudit('REJECTED')
  const rejection = calls.slice(beforeReject).find(call => call.method === 'post')
  assert.deepStrictEqual(rejection.data, { id: 6, result: 'REJECTED', opinion: '驳回原因' })
  assert.strictEqual(vm.dialogVisible, false)
  assert.strictEqual(vm.submitLoading, false)
  assert.ok(messages.some(message => message.type === 'success' && message.text === '申请已驳回'))
  // Approving allows an empty opinion; double clicks/closing are blocked until the response.
  handler = async () => ({ data: { ...pending } })
  await vm.handleApprove(pending)
  const post = deferred()
  handler = config => config.method === 'post' ? post.promise : Promise.resolve({ data: { list: [], total: 0 } })
  const approve = vm.handleAudit('APPROVED')
  const afterStart = calls.length
  await vm.handleAudit('APPROVED')
  await vm.handleAudit('REJECTED')
  assert.strictEqual(calls.length, afterStart)
  let closed = false
  vm.beforeClose(() => { closed = true })
  assert.strictEqual(closed, false)
  assert.deepStrictEqual(calls[afterStart - 1].data, { id: 6, result: 'APPROVED', opinion: '' })
  post.resolve({ data: { status: 'APPROVED' } })
  await approve
  assert.strictEqual(vm.dialogVisible, false)
  assert.ok(messages.some(message => message.text === '审批通过，权益已派发至客户'))
  // A rejected request retains the opinion and does not modify list status locally.
  handler = async () => ({ data: { ...pending } })
  await vm.handleApprove(pending)
  vm.approvalRemark = '保留此意见'
  handler = async () => { throw new Error('offline') }
  await vm.handleAudit('APPROVED')
  assert.strictEqual(vm.dialogVisible, true)
  assert.strictEqual(vm.approvalRemark, '保留此意见')
  assert.strictEqual(vm.currentDetail.status, 'PENDING')
  assert.strictEqual(vm.submitLoading, false)
  handler = async () => ({ data: { ...pending, status: 'APPROVED', auditor: null, auditOpinion: '已同意' } })
  await vm.handleApprove(pending)
  assert.strictEqual(vm.isApproveMode, false)
  assert.strictEqual(vm.approvalRemark, '已同意')
  const beforeReadOnly = calls.length
  await vm.handleAudit('APPROVED')
  await vm.handleApprove({ ...pending, status: 'REJECTED' })
  assert.strictEqual(calls.length, beforeReadOnly)
  handler = async () => { throw new Error('detail failed') }
  await vm.handleView(pending)
  assert.strictEqual(vm.currentDetail, null)
  assert.strictEqual(vm.dialogVisible, false)
  const slow = deferred()
  handler = () => slow.promise
  const opening = vm.handleApprove(pending)
  await Promise.resolve()
  vm.dialogVisible = false
  vm.invalidateDetail()
  slow.resolve({ data: { ...pending } })
  await opening
  assert.strictEqual(vm.currentDetail, null)
  assert.strictEqual(vm.dialogVisible, false)
  const oldDetail = deferred(), newDetail = deferred()
  handler = config => config.url.endsWith('/6') ? oldDetail.promise : newDetail.promise
  const oldOpen = vm.handleApprove(pending)
  const newOpen = vm.handleView({ id: 3, status: 'APPROVED' })
  await Promise.resolve()
  newDetail.resolve({ data: { ...pending, id: 3, status: 'APPROVED', auditOpinion: '最新详情' } })
  await newOpen
  oldDetail.resolve({ data: { ...pending } })
  await oldOpen
  assert.strictEqual(vm.currentDetail.id, 3)
  assert.strictEqual(vm.approvalRemark, '最新详情')
  assert.strictEqual(vm.isApproveMode, false)
  handler = async () => ({ data: { ...pending, id: 999 } })
  await vm.handleApprove(pending)
  assert.strictEqual(vm.dialogVisible, false)
  assert.strictEqual(vm.currentDetail, null)
  console.log('PASS: template; all query parameters and snapshots; dates/reset/page size; multi-benefit union/dedup across pages; stale list/detail requests; missing detail fails closed; pending-only audit; rejection validation; unwrapped success; empty approval opinion; duplicate/close guards; failure retains input; completed application is readonly')
  if (!process.argv.includes('--live')) return
  // Live verification never sends an approval or rejection to the business database.
  handler = async config => {
    assert.strictEqual(config.method, 'get', 'Live checks are read-only')
    const response = await axios({ ...config, baseURL: 'http://localhost:8002', timeout: 15000 })
    assert.strictEqual(response.data.header.statusCode, '000000')
    return response.data.body
  }
  const live = makeVM()
  live.resourcesPromise = live.loadResources()
  await live.resourcesPromise
  assert.ok(live.catalog.length)
  assert.ok(live.idTypes.length)
  await live.fetchTableData()
  const applications = [...live.tableData]
  assert.ok(applications.length)
  for (const row of applications) {
    await (row.status === 'PENDING' ? live.handleApprove(row) : live.handleView(row))
    assert.strictEqual(live.currentDetail.id, row.id)
    assert.strictEqual(live.isApproveMode, row.status === 'PENDING')
  }
  for (const status of ['PENDING', 'APPROVED', 'REJECTED']) {
    live.queryForm.status = status
    await live.handleSearch()
    assert.ok(live.tableData.every(row => row.status === status))
  }
  await live.handleReset()
  live.queryForm.applicant = 'zhang'
  await live.handleSearch()
  assert.ok(live.tableData.every(row => (row.applicant || '').includes('zhang')))
  await live.handleReset()
  live.queryForm.benefitCodes = ['QY0001', 'QY0003']
  await live.handleSearch()
  assert.ok(live.tableData.every(row => row.benefitCodes.split(',').some(code => ['QY0001', 'QY0003'].includes(code))))
  console.log(`PASS: live catalog/dictionaries, ${applications.length} original application details, pending/approved/rejected filtering, applicant text filter and multi-benefit matching. No live writes.`)
}
run().catch(error => { console.error(error); process.exitCode = 1 })
