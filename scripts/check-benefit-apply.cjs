const assert = require('assert')
const axios = require('axios')
const { loadFile, loadComponent } = require('./test-utils.cjs')

const model = loadFile('src/views/personal/test/benefit-adjust-model.js', () => {})
const calls = []
let handler = async config => ({ data: config.url.endsWith('/page') ? { list: [], total: 0 } : [] })
async function request(config) { calls.push(config); return handler(config) }
const api = loadFile('src/api/test/index.js', () => request)
const point = loadFile('src/api/test/point.js', () => request)
const components = {}
for (const file of ['service-apply.vue', 'components/benefit-adjust-form.vue', 'components/benefit-adjust-rights.vue']) {
  components[file] = loadComponent(`src/views/personal/test/${file}`, name => name === '@/api/test' ? api : name === '@/api/test/point' ? point : name.includes('benefit-adjust-model') ? model : {}).component
}
const messages = []
function vmFor(component = components['service-apply.vue']) {
  const vm = {
    ...component.data(),
    $route: { path: '/personal/serviceApply', query: {} },
    $router: { push(route) { vm.lastRoute = route } },
    $message: Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => messages.push({ type, text })])),
    $nextTick: fn => fn(), $confirm: async () => {},
    $refs: { pickerTable: { clearSelection() {} } },
    $emit(event, value) { vm.emitted = { event, value } }
  }
  Object.entries(component.methods).forEach(([name, method]) => { vm[name] = method.bind(vm) })
  Object.entries(component.computed || {}).forEach(([name, getter]) => Object.defineProperty(vm, name, { get: () => getter.call(vm) }))
  return vm
}
function deferred() { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
async function run() {
  const vm = vmFor()
  vm.queryForm = { ...vm.queryForm, custId: ' 1001 ', idType: '身份证', dateFrom: '2026-01-01', dateTo: '2026-12-31' }
  vm.currentPage = 3
  await vm.handleSearch()
  assert.deepStrictEqual(calls.pop().params, { custId: '1001', idType: '身份证', dateFrom: '2026-01-01', dateTo: '2026-12-31', pageNum: 1, pageSize: 100 })
  vm.queryForm.dateTo = '2025-01-01'
  const countBefore = calls.length
  vm.handleSearch()
  assert.strictEqual(calls.length, countBefore)
  await vm.handleReset()
  assert.strictEqual(vm.activeQuery.custId, '')
  // A multi-benefit filter unions all server pages before local pagination.
  const many = Array.from({ length: 101 }, (_, i) => ({ id: i + 1, custId: i % 2 ? '1001' : '1002', applyTime: '2026-10-01' }))
  handler = async config => {
    const p = config.params
    const data = p.benefitCode === 'QY0001' ? many : [many[0], { id: 102, custId: '1003', applyTime: '2026-10-02' }]
    return { data: { list: data.slice((p.pageNum - 1) * p.pageSize, p.pageNum * p.pageSize), total: data.length } }
  }
  vm.queryForm.benefitCodes = ['QY0001', 'QY0002']
  await vm.handleSearch()
  assert.strictEqual(vm.total, 102)
  assert.strictEqual(vm.tableData[0].id, 102)
  assert.strictEqual(vm.tableData.length, 10)
  assert.ok(calls.some(call => call.params.benefitCode === 'QY0001' && call.params.pageNum === 2))
  await vm.handleCurrentChange(11)
  assert.strictEqual(vm.tableData.length, 2)
  assert.strictEqual(vm.customerOptions.length, 3)
  vm.selectListCustomer('1003')
  assert.strictEqual(vm.total, 1)
  assert.strictEqual(vm.tableData[0].custId, '1003')
  assert.strictEqual(vm.currentPage, 1)
  vm.selectListCustomer('')
  assert.strictEqual(vm.total, 102)
  assert.ok(!calls.some(call => call.params && String(call.params.benefitCode).includes(',')))
  // Input starts searching immediately; old requests cannot overwrite newer results.
  const first = deferred(), second = deferred()
  handler = config => config.params.keyword === '1' ? first.promise : second.promise
  const searchingOne = vm.searchCustomers('1')
  const searchingTwo = vm.searchCustomers('6')
  const selected = { custId: '1001', custName: '张伟' }
  second.resolve({ data: [selected, { custId: '1006', custName: '第二位客户' }] })
  await searchingTwo
  first.resolve({ data: [{ custId: 'old' }] })
  await searchingOne
  assert.strictEqual(vm.candidates.length, 2)
  vm.selectedCustomer = selected
  assert.strictEqual(vm.showCandidates, true)
  assert.strictEqual(vm.candidates.length, 2)
  handler = async () => ({ data: {
    customer: { ...selected, currentGrade: 'PUXING', idType: '身份证' },
    currentBenefits: [
      { benefit_code: 'QY0001', unlimited: 0, grant_sum: 2, used_sum: 2, remain_sum: 0 },
      { benefit_code: 'QY0002', unlimited: 1, used_sum: 0 }
    ], traces: [{ benefitCode: 'QY0001', usedCount: 0, remainCount: 0 }]
  } })
  await vm.confirmCustomer()
  assert.strictEqual(vm.showCandidates, false)
  assert.strictEqual(vm.applyForm.custId, '1001')
  assert.strictEqual(vm.currentBenefits[0].remain, 0)
  assert.strictEqual(vm.currentBenefits[1].grant, '不限')
  assert.strictEqual(vm.currentBenefits[1].used, 0)
  assert.strictEqual(vm.traceRemain(vm.traces[0]), 0)
  assert.strictEqual(vm.traceRemain({ benefitCode: 'unknown', remainCount: null }), '—')
  assert.ok(vm.customerFields.some(field => field[1] === '普星（新V）'))
  vm.applyForm.oaNo = 'reset'
  vm.resetAdjustment()
  assert.strictEqual(vm.customer.custId, '1001')
  assert.strictEqual(vm.currentBenefits.length, 2)
  assert.strictEqual(vm.applyForm.oaNo, '')
  assert.strictEqual(vm.applyForm.custId, '1001')
  assert.strictEqual(model.validateForm(model.newForm()), '请先选择客户并点击「确认」带入')
  const benefit = model.normalizeBenefit({ benefitCode: 'QY0001', benefitName: '体检', itemsJson: '[{"cat":"体检","name":"套餐"}]' }, [], [], [], true)
  assert.strictEqual(benefit.items[0].freqCount, 1)
  assert.deepStrictEqual(benefit.items[0].orderChannels, ['WECHAT'])
  assert.deepStrictEqual(benefit.identities, ['POLICYHOLDER'])
  const existing = model.normalizeBenefit({ benefitCode: 'QY0001' }, [benefit])
  assert.strictEqual(existing.items[0].freqYears, null)
  assert.strictEqual(existing.items[0].needOrder, null)
  vm.applyForm.selectedBenefits = [benefit]
  vm.applyForm.oaNo = ' OA-TEST '
  assert.strictEqual(model.validateForm(vm.applyForm), '')
  assert.ok(model.validateForm({ ...vm.applyForm, validEndDate: '2020-01-01' }))
  assert.ok(model.validateForm({ ...vm.applyForm, reasonCode: 'invalid' }))
  // 与交付 SQL 的 sys_dict_v2 及接口文档 2.4 一致，不能将 03/05 对调。
  assert.strictEqual(model.payloadFor({ ...vm.applyForm, reasonCode: 'REASON03' }).reasonName, '权益派发错误')
  assert.strictEqual(model.payloadFor({ ...vm.applyForm, reasonCode: 'REASON05' }).reasonName, '历史权益修正')
  // No write occurs before the confirmation, or after cancel. A failed write stays retryable.
  const writesBefore = calls.filter(call => call.method !== 'get').length
  vm.openConfirmation(false)
  assert.strictEqual(vm.confirmVisible, true)
  assert.strictEqual(calls.filter(call => call.method !== 'get').length, writesBefore)
  assert.strictEqual(vm.confirmation.payload.oaNo, 'OA-TEST')
  vm.confirmVisible = false
  await vm.submitConfirmed()
  assert.strictEqual(calls.filter(call => call.method !== 'get').length, writesBefore)
  vm.openConfirmation(false)
  handler = async () => { throw new Error('test failure') }
  await vm.submitConfirmed()
  assert.strictEqual(vm.confirmVisible, true)
  assert.strictEqual(vm.submitting, false)
  assert.strictEqual(vm.applyForm.oaNo, ' OA-TEST ')
  const pending = deferred()
  handler = () => pending.promise
  const submitting = vm.submitConfirmed()
  const afterStart = calls.length
  await vm.submitConfirmed()
  assert.strictEqual(calls.length, afterStart)
  pending.resolve({ data: {} })
  await submitting
  assert.strictEqual(vm.confirmVisible, false)
  assert.strictEqual(vm.applyForm.selectedBenefits.length, 1)
  const editPayload = model.payloadFor({ ...vm.applyForm, id: 5 }, true)
  assert.strictEqual(editPayload.id, 5)
  assert.ok(!('custId' in editPayload))
  assert.deepStrictEqual(Object.keys(editPayload).sort(), ['id', 'benefitCodes', 'validEndDate', 'policyNo', 'oaNo', 'reasonCode', 'reasonName', 'remark', 'attachment'].sort())
  handler = async () => ({ data: { ...selected, id: 5, status: 'REJECTED', applyTime: 1790127346000, benefitDetails: [benefit] } })
  await vm.handleView({ id: 5 })
  assert.strictEqual(vm.currentDetail.id, 5)
  assert.ok(model.formatTime(vm.currentDetail.applyTime).startsWith('2026-09-23'))
  await vm.handleEdit({ id: 5, status: 'REJECTED' })
  assert.strictEqual(vm.editVisible, true)
  assert.strictEqual(vm.editForm.id, 5)
  assert.strictEqual(vm.editForm.reasonCode, '', 'Missing historical reasons must not silently become the new-application default')
  vm.editForm = { ...vm.editForm, ...model.newForm(), id: 5, custId: '1001', selectedBenefits: [benefit], oaNo: 'EDIT-OA' }
  const beforeEditSave = calls.length
  await vm.saveEdit()
  const editCall = calls.slice(beforeEditSave).find(call => call.method === 'put')
  assert.ok(editCall, 'Edit saves directly, matching the prototype')
  assert.strictEqual(editCall.data.id, 5)
  assert.ok(!('custId' in editCall.data))
  const beforeGuard = calls.length
  await vm.handleEdit({ id: 5, status: 'PENDING' })
  await vm.handleDelete({ id: 5, status: 'APPROVED' })
  assert.strictEqual(calls.length, beforeGuard)
  vm.$confirm = async () => { throw 'cancel' } // Element UI rejects cancellation with this string.
  await vm.handleDelete({ id: 5, status: 'REJECTED', applyNo: 'TEST' })
  assert.strictEqual(calls.length, beforeGuard)
  vm.$confirm = async () => {}
  handler = async config => ({ data: config.method === 'get' ? { list: [], total: 0 } : {} })
  await vm.handleDelete({ id: 5, status: 'REJECTED', applyNo: 'TEST' })
  assert.ok(calls.slice(beforeGuard).some(call => call.method === 'delete' && call.url === '/benefit/adjust/5'))
  handler = async () => { throw new Error('not available') }
  await vm.handleView({ id: 5 })
  assert.strictEqual(vm.currentDetail, null)
  assert.strictEqual(vm.detailVisible, false)
  const form = { attachment: 'keep.pdf' }
  const beforeUpload = calls.length
  await vm.uploadFile({ name: 'bad.exe', size: 2 }, form)
  await vm.uploadFile({ name: 'large.pdf', size: 6 * 1024 * 1024 }, form)
  assert.strictEqual(calls.length, beforeUpload)
  global.FormData = class { append() {} }
  await vm.uploadFile({ name: 'good.pdf', size: 2 }, form)
  assert.strictEqual(form.attachment, 'keep.pdf')
  handler = async () => ({ data: { filePath: 'group1/path/new.pdf', fileName: 'good.pdf' } })
  await vm.uploadFile({ name: 'good.pdf', size: 2 }, form)
  assert.strictEqual(form.attachment, 'group1/path/new.pdf')
  const rights = vmFor(components['components/benefit-adjust-rights.vue'])
  Object.assign(rights, { value: [benefit], catalog: [benefit, { ...benefit, benefitCode: 'QY0002' }], identities: [], channels: [] })
  rights.selection = rights.catalog
  rights.addSelection()
  assert.strictEqual(rights.emitted.value.length, 2)
  rights.keyword = 'QY0002'
  assert.strictEqual(rights.filteredCatalog.length, 1)
  rights.value = rights.emitted.value
  rights.expandAll(true)
  assert.strictEqual(rights.expandedKeys.length, 2)
  rights.expandAll(false)
  assert.strictEqual(rights.expandedKeys.length, 0)
  // Logged-in multipart uploads must retain multipart encoding in the shared interceptor.
  let interceptRequest
  const fakeAxios = { create: () => ({
    interceptors: {
      request: { use: fn => { interceptRequest = fn } },
      response: { use() {} }
    }
  }) }
  loadFile('src/utils/fetch.js', name => {
    if (name === 'axios') return fakeAxios
    if (name === 'crypto') return require('crypto')
    if (name === 'utils/auth') return { getToken: () => 'test-token' }
    if (name === 'utils/index') return { random: () => 'test-random' }
    return {}
  })
  const multipart = interceptRequest({ data: new FormData(), headers: { 'Content-Type': 'multipart/form-data' }, params: {} })
  assert.strictEqual(multipart.headers['Content-Type'], 'multipart/form-data')
  const json = interceptRequest({ data: { id: 5 }, headers: {}, params: {} })
  assert.strictEqual(json.headers['Content-Type'], 'application/json')
  console.log('PASS: templates; filter contract and multi-benefit pagination; stale searches; selection/confirmation; zero/unlimited; validation; rejected-only edits; two-stage submission; failure/retry; upload guards; rights selection')
  if (!process.argv.includes('--live')) return
  // Live checks are explicitly GET-only; never mutate the 8002 business database.
  handler = async config => {
    assert.strictEqual(config.method, 'get', 'Live verification must be read-only')
    const response = await axios({ ...config, baseURL: 'http://localhost:8002', timeout: 15000 })
    assert.strictEqual(response.data.header.statusCode, '000000')
    return response.data.body
  }
  const liveVM = vmFor()
  liveVM.resourcesPromise = liveVM.loadResources()
  await liveVM.resourcesPromise
  assert.ok(liveVM.catalog.length)
  assert.ok(liveVM.identities.length)
  await liveVM.fetchList()
  assert.ok(liveVM.total > 0)
  for (const row of liveVM.tableData) {
    const detail = await liveVM.readDetail(row)
    assert.strictEqual(detail.id, row.id)
    assert.ok(Array.isArray(detail.benefitDetails))
  }
  await liveVM.searchCustomers('1')
  assert.ok(liveVM.candidates.length)
  liveVM.selectedCustomer = liveVM.candidates.find(row => row.custId === '1001') || liveVM.candidates[0]
  await liveVM.confirmCustomer()
  assert.ok(liveVM.customer)
  assert.strictEqual(liveVM.showCandidates, false)
  liveVM.queryForm.benefitCodes = ['QY0001', 'QY0003']
  await liveVM.handleSearch()
  assert.ok(liveVM.tableData.every(row => row.benefitCodes.split(',').some(code => ['QY0001', 'QY0003'].includes(code))))
  console.log(`PASS: live dictionaries/catalog; all ${liveVM.total} matching applications and original list details; customer search/workbench. No live writes.`)
}
run().catch(error => { console.error(error); process.exitCode = 1 })
