const assert = require('assert')
const { loadFile, loadComponent } = require('./test-utils.cjs')

let permissionResponse = { data: { list: [] } }
const permissionCalls = []
const permissions = loadFile('src/mixins/pagePermissions.js', () => ({
  getPlatformPageButtonMenuInfo: async params => {
    permissionCalls.push(params)
    if (permissionResponse instanceof Error) throw permissionResponse
    return permissionResponse
  }
})).default
const benefitModel = loadFile('src/views/personal/test/benefit-adjust-model.js', () => ({}))
const trialModel = loadFile('src/views/personal/test/trial-model.js', () => ({}))
const calls = []
let handler = async () => ({ data: {} })
const api = new Proxy({}, { get: (_, name) => async (...args) => {
  calls.push({ name, args })
  return handler(name, ...args)
} })

function component(file) {
  return loadComponent(`src/views/personal/test/${file}.vue`, name => {
    if (name.includes('pagePermissions')) return permissions
    if (name.includes('benefit-adjust-model')) return benefitModel
    if (name.includes('trial-model')) return trialModel
    return api
  }).component
}

function instance(options, extra = {}) {
  const messages = []
  const vm = {
    ...permissions.data(), ...options.data(),
    ...permissions.methods, ...options.methods,
    $message: Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => messages.push({ type, text })])),
    ...extra
  }
  for (const [key, getter] of Object.entries(options.computed || {})) {
    Object.defineProperty(vm, key, { get: () => getter.call(vm) })
  }
  return { vm, messages }
}

async function loadPermissions(path) {
  const vm = { ...permissions.data(), ...permissions.methods, $route: { path } }
  permissions.created.call(vm)
  await new Promise(resolve => setImmediate(resolve))
  return vm
}

async function run() {
  const pages = {
    manage: 'pointManage', apply: 'pointApply', sh: 'pointSh', guiji: 'pointGuiJi', rule: 'pointRule',
    lc: 'levelChange', srm: 'serviceRuleManage', serviceApply: 'serviceApply', serviceApproval: 'serviceApproval',
    serviceGuiJi: 'serviceGuiJi', otn: 'oldToNew', guiJiTab: 'guiJiTab', pointCalculated: 'pointCalculate',
    'service-apply': 'serviceApply', 'service-approval': 'serviceApproval', 'service-guiji': 'serviceGuiJi'
  }
  for (const [path, pageType] of Object.entries(pages)) {
    const before = permissionCalls.length
    const vm = await loadPermissions(`/personal/${path}`)
    assert.strictEqual(permissionCalls.length, before + 1)
    assert.strictEqual(permissionCalls[before].pageType, pageType)
    assert.strictEqual(vm.permissionsLoaded, true)
    assert.strictEqual(vm.handleIsOwn('导出'), false)
  }
  permissionResponse = { data: { list: [{ name: '查询' }, { buttonName: '编辑' }, '新建', null] } }
  const granted = await loadPermissions('/personal/apply')
  for (const action of ['查询', '编辑', '新建']) assert.strictEqual(granted.handleIsOwn(action), true)
  for (const action of ['删除', '修改', '查']) assert.strictEqual(granted.handleIsOwn(action), false)
  permissionResponse = { data: { list: [] }, list: [{ name: '导出' }] }
  assert.strictEqual((await loadPermissions('/personal/manage')).handleIsOwn('导出'), false)
  permissionResponse = { list: [{ name: '导出' }] }
  assert.strictEqual((await loadPermissions('/personal/manage')).handleIsOwn('导出'), true)
  permissionResponse = new Error('403')
  const failed = await loadPermissions('/personal/manage')
  assert.strictEqual(failed.permissionsLoaded, true)
  assert.strictEqual(failed.handleIsOwn('导出'), false)
  assert.strictEqual(granted.handleIsOwn('编辑'), true, 'Page permission state is isolated')

  const trace = instance(component('service-guiji')).vm
  const pointApply = instance(component('point-apply')).vm
  const pointForm = { adjustAmt: '1', oaNo: 'OA-TEST', reasonCode: 'REASON06', validType: 'nat', policyNo: '', remark: '' }
  let resets = 0
  pointApply.$refs = { adjustForm: { resetFields() { resets++ } } }
  pointApply.adjustForm.attachment = 'existing.pdf'
  pointApply.attachmentUploading = true
  pointApply.resetAdjust()
  assert.strictEqual(resets, 0, 'Reset must wait for an in-flight attachment upload')
  assert.strictEqual(pointApply.adjustForm.attachment, 'existing.pdf')
  pointApply.attachmentUploading = false
  pointApply.submitLoading = true
  pointApply.resetAdjust()
  assert.strictEqual(resets, 0, 'Reset must not mutate a pending submission')
  pointApply.submitLoading = false
  pointApply.resetAdjust()
  assert.strictEqual(resets, 1)
  assert.strictEqual(pointApply.adjustForm.attachment, '')
  assert.strictEqual(pointApply.validateAdjust(pointForm), true)
  for (const [key, length] of [['policyNo', 32], ['oaNo', 30], ['remark', 500]]) {
    assert.strictEqual(pointApply.validateAdjust({ ...pointForm, [key]: 'X'.repeat(length) }), true)
    const invalid = { ...pointForm, [key]: 'X'.repeat(length + 1) }
    assert.strictEqual(pointApply.validateAdjust(invalid), false, `${key}: reject values over the point-adjustment limit`)
    pointApply.hasSearchedCustomer = true
    pointApply.customerInfo = { currentPoint: 100 }
    pointApply.adjustForm = invalid
    pointApply.$refs = { adjustForm: { validate: done => done(true) } }
    pointApply.$confirm = () => { throw new Error('Overlong input must not reach confirmation') }
    const beforeSubmit = calls.length
    pointApply.submitAdjust()
    pointApply.editForm = { ...invalid, id: 'ISOLATED' }
    await pointApply.saveEdit()
    assert.strictEqual(calls.length, beforeSubmit, 'Invalid new and edited applications must not call the API')
  }
  assert.strictEqual(trace.formatCustomer({ custName: '测试客户', custId: 'TEST001' }), '测***（TEST001）')
  assert.strictEqual(trace.formatCustomer({ custName: '测***', custId: 'TEST001' }), '测***（TEST001）')
  assert.strictEqual(trace.formatCustomer({ custId: 'TEST001' }), 'TEST001')
  const track = instance(component('guiji-tab')).vm
  track.detailData = { custInfo: { custName: '测试客户' } }
  assert.strictEqual(track.customerFields.find(field => field.label === '客户姓名').value, '测***')
  const rulesPage = instance(component('service-rule-manage')).vm
  rulesPage.selectedVersion = 'OLD'
  let rejectOldRules
  handler = () => new Promise((resolve, reject) => { rejectOldRules = reject })
  const oldRules = rulesPage.fetchTableData()
  rulesPage.selectedVersion = 'NEW'
  handler = async () => ({ data: [{ grade_code: 'NEW-GRADE' }] })
  await rulesPage.fetchTableData()
  rejectOldRules(new Error('obsolete version failed'))
  await oldRules
  assert.strictEqual(rulesPage.tableData[0].grade_code, 'NEW-GRADE', 'An obsolete version failure must not clear the current list')
  let finishFirst, finishLatest
  handler = () => new Promise(resolve => { finishFirst = resolve })
  const firstRefresh = rulesPage.fetchTableData()
  handler = () => new Promise(resolve => { finishLatest = resolve })
  const latestRefresh = rulesPage.fetchTableData()
  finishFirst({ data: [{ grade_code: 'STALE' }] })
  await firstRefresh
  assert.strictEqual(rulesPage.loading, true, 'The latest list request controls loading')
  finishLatest({ data: [{ grade_code: 'LATEST' }] })
  await latestRefresh
  assert.strictEqual(rulesPage.loading, false)
  assert.strictEqual(rulesPage.tableData[0].grade_code, 'LATEST')
  handler = () => new Promise(resolve => { finishFirst = resolve })
  const firstStatus = rulesPage.fetchGradeConfigStatus()
  handler = async () => ({ data: [{ gradeCode: 'LATEST-STATUS' }] })
  await rulesPage.fetchGradeConfigStatus()
  finishFirst({ data: [{ gradeCode: 'STALE-STATUS' }] })
  await firstStatus
  assert.strictEqual(rulesPage.gradeConfigList[0].gradeCode, 'LATEST-STATUS')

  const customerPage = instance(component('point-apply')).vm
  customerPage.customerSearchKey = 'ISOLATED'
  let finishPoints
  customerPage.loadCustomerPoints = () => new Promise(resolve => { finishPoints = resolve })
  handler = async name => name === 'searchCustomerProfileApi'
    ? { data: [{ custId: 'ISOLATED', custName: '隔离客户' }] }
    : { data: { currentPoint: 100 } }
  const pendingCustomer = customerPage.handleCustomerSearch()
  await new Promise(resolve => setImmediate(resolve))
  assert.strictEqual(typeof finishPoints, 'function')
  customerPage.handleCustomerInput('')
  finishPoints()
  await pendingCustomer
  assert.strictEqual(customerPage.customerInfo, null)
  assert.strictEqual(customerPage.hasSearchedCustomer, false, 'Old point details must not confirm a cleared customer')
  let finishProfile
  customerPage.customerSearchKey = 'ISOLATED'
  handler = () => new Promise(resolve => { finishProfile = resolve })
  const staleProfile = customerPage.handleCustomerSearch()
  customerPage.handleCustomerInput('')
  const beforeProfile = calls.length
  finishProfile({ data: [{ custId: 'ISOLATED' }] })
  await staleProfile
  assert.strictEqual(calls.length, beforeProfile, 'An obsolete profile must not trigger another point request')
  const confirmationPage = instance(component('point-apply')).vm
  confirmationPage.selectedCustomerId = 'OLD'
  confirmationPage.selectedCustomerName = '旧客户'
  let finishConfirmation
  confirmationPage.handleCustomerSearch = () => {
    confirmationPage.customerRequest++
    return new Promise(resolve => { finishConfirmation = resolve })
  }
  const oldConfirmation = confirmationPage.handleCustomerConfirm()
  confirmationPage.customerRequest++
  confirmationPage.hasSearchedCustomer = true
  confirmationPage.customerSearchKey = '新客户（NEW）'
  confirmationPage.selectedCustomerId = 'NEW'
  finishConfirmation()
  await oldConfirmation
  assert.strictEqual(confirmationPage.customerSearchKey, '新客户（NEW）')
  assert.strictEqual(confirmationPage.selectedCustomerId, 'NEW')

  for (const [file, fetch] of [['service-apply', 'fetchList'], ['service-approval', 'fetchTableData']]) {
    const vm = instance(component(file)).vm
    let resolveOld
    const old = new Promise(resolve => { resolveOld = resolve })
    handler = () => old
    const first = vm[fetch]()
    handler = async () => ({ data: { list: [{ id: 2 }], total: 23 } })
    await vm[fetch]()
    resolveOld({ data: { list: [{ id: 1 }], total: 10 } })
    await first
    assert.strictEqual(vm.tableData[0].id, 2)
    assert.strictEqual(vm.total, 23)
  }

  const { vm, messages } = instance(component('point-calculate'))
  vm.calcForm = { custName: '测试客户', idType: 'IDCARD', idNo: 'TEST-ID' }
  vm.idTypeOptions = [{ code: 'IDCARD' }]
  vm.allowBtn = [{ name: '测算' }]
  const before = calls.length
  await vm.handleRunCalc()
  assert.strictEqual(calls.length, before, 'Generic calculation permission cannot authorize a specific scene')
  vm.allowBtn = [{ name: '场景一试算（老客户转新规则）' }]
  handler = async () => { throw Object.assign(new Error('业务拒绝'), { messageShown: true }) }
  await vm.handleRunCalc()
  assert.strictEqual(calls.length, before + 1)
  assert.strictEqual(messages.length, 0, 'Shared request errors must not be shown twice')
  handler = async () => { throw new Error('未返回有效试算结果') }
  await vm.handleRunCalc()
  assert.strictEqual(messages.filter(message => message.type === 'error').length, 1)
  assert.strictEqual(vm.calcLoading, false)
  assert.strictEqual(vm.calcForm.custName, '测试客户')
  vm.currentScene = 1
  const beforeScene2 = calls.length
  await vm.handleRunCalc()
  assert.strictEqual(calls.length, beforeScene2, 'Scene one permission cannot authorize scene two')
  vm.batchRows = [{ custName: '测试客户', idType: 'IDCARD', idNo: 'TEST-ID' }]
  await vm.submitBatch()
  assert.strictEqual(calls.length, beforeScene2, 'Batch submission needs its own permission')
  vm.allowBtn = [{ name: '场景一试算（老客户转新规则）' }]
  vm.currentScene = 0
  for (const [custName, idNo] of [['名'.repeat(51), 'TEST-ID'], ['测试客户', 'X'.repeat(31)]]) {
    vm.calcForm = { custName, idNo, idType: 'IDCARD' }
    await vm.handleRunCalc()
    assert.strictEqual(calls.length, beforeScene2, 'Overlong values must not reach the trial API')
  }
  vm.calcForm = { custName: '名'.repeat(50), idNo: 'X'.repeat(30), idType: 'IDCARD' }
  handler = async () => ({ data: { custId: 'TEST001' } })
  await vm.handleRunCalc()
  assert.strictEqual(calls.length, beforeScene2 + 1, 'Documented maximum lengths are accepted')
  const header = '客户姓名,证件类型,证件号\n'
  const types = [{ code: 'IDCARD', name: '居民身份证' }]
  assert.strictEqual(trialModel.parseTrialCsv(`${header}${'名'.repeat(50)},IDCARD,${'X'.repeat(30)}`, types).length, 1)
  assert.throws(() => trialModel.parseTrialCsv(`${header}${'名'.repeat(51)},IDCARD,TEST-ID`, types), /第 2 行客户姓名/)
  assert.throws(() => trialModel.parseTrialCsv(`${header}测试客户,IDCARD,${'X'.repeat(31)}`, types), /第 2 行证件号码/)
  vm.switchScene(1)
  assert.strictEqual(vm.productList.length, 1, 'Scene two starts with one product')
  vm.removeProduct(0)
  assert.strictEqual(vm.productList.length, 1, 'The last product cannot be removed')
  vm.addProduct()
  vm.productList[0].riskCode = 'KEEP'
  vm.removeProduct(1)
  assert.strictEqual(vm.productList.length, 1)
  assert.strictEqual(vm.productList[0].riskCode, 'KEEP')
  vm.handleReset()
  assert.strictEqual(vm.productList.length, 1)
  assert.strictEqual(vm.productList[0].riskCode, '')
  vm.switchScene(0)
  assert.strictEqual(vm.productList.length, 0)
  console.log('PASS: permission isolation/loading/empty/failure/aliases; scoped name masking; stale list protection; scene and batch permissions; single trial error feedback')
}

run().catch(error => { console.error(error); process.exitCode = 1 })
