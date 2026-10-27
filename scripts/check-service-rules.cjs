const assert = require('assert')
const axios = require('axios')
const { loadFile, loadComponent } = require('./test-utils.cjs')
// The Node runtime has no browser FormData. Capture multipart fields for contract assertions.
global.FormData = class {
  constructor() { this.fields = {} }
  append(key, value) { this.fields[key] = value }
}

const calls = []
const responses = {}
let live = false
async function request(config) {
  calls.push(config)
  if (!live) return responses[config.url] || { data: [] }
  assert.strictEqual(config.method, 'get', 'Live verification is read-only')
  const response = await axios({
    ...config, baseURL: 'http://localhost:8002', timeout: 15000,
    responseType: config.responseType === 'blob' ? 'arraybuffer' : 'json'
  })
  if (config.responseType === 'blob') {
    assert.strictEqual(Buffer.from(response.data).subarray(0, 2).toString(), 'PK')
    return response.data
  }
  assert.strictEqual(response.data.header.statusCode, '000000')
  return response.data.body
}
const api = loadFile('src/api/test/index.js', () => request)
const { component } = loadComponent('src/views/personal/test/service-rule-manage.vue', () => api)
const messages = []
function makeVM() {
  const vm = {
    ...component.data(),
    $message: Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => messages.push({ type, text })])),
    $nextTick: callback => callback(),
    $refs: { editTableRef: { toggleRowExpansion() {} }, rightsPicker: { clearSelection() {} } }
  }
  for (const [name, method] of Object.entries(component.methods)) vm[name] = method.bind(vm)
  for (const [name, getter] of Object.entries(component.computed)) {
    Object.defineProperty(vm, name, { get: () => getter.call(vm) })
  }
  return vm
}
async function run() {
  const vm = makeVM()
  responses['/platform/dict/IDENTITY'] = { data: [
    { code: 'POLICYHOLDER', name: '投保人' }, { code: 'INSURED', name: '有效保单被保险人' }
  ] }
  responses['/platform/dict/ORDER_CHANNEL'] = { data: [{ code: 'WECHAT', name: '官微' }] }
  responses['/platform/dict/biz/orgs'] = { data: ['天津分公司'] }
  await vm.fetchDictOptions()
  assert.ok(!calls.some(call => call.url.includes('idTypes')))
  assert.deepStrictEqual(vm.orgOptions, ['全国', '天津分公司'])
  assert.strictEqual(vm.flag('0'), false)
  assert.strictEqual(vm.flag('1'), true)
  vm.versionOptions = [{ version_tag: 'V2', current_flag: 1 }, { version_tag: 'V3', current_flag: 0, effectiveDate: '2099-01-01' }]
  vm.selectedVersion = 'V2'
  const start = calls.length
  await vm.handleAddRule()
  assert.strictEqual(vm.editDialogVisible, false)
  await vm.handleStartModification()
  assert.strictEqual(vm.editDialogVisible, true)
  await vm.handleSaveRule()
  assert.ok(!calls.slice(start).some(call => call.method === 'post'))
  assert.strictEqual(vm.canConfigureVersion({ version_tag: 'UNKNOWN', current_flag: 0 }), false)
  assert.strictEqual(vm.canConfigureVersion(vm.versionOptions[1]), true)
  responses['/platform/benefit/rule/grades'] = { data: [
    { gradeCode: 'WUXING', gradeName: '五星（新V）', configured: 1 },
    { gradeCode: 'PUXING', gradeName: '普星（新V）', configured: 0 }
  ] }
  await vm.loadFormGradeOptions('V2')
  assert.deepStrictEqual(vm.formGradeOptions.map(grade => grade.gradeCode), ['WUXING'])
  vm.isModification = false
  vm.selectedVersion = 'V3'
  await vm.handleAddRule()
  assert.strictEqual(vm.editDialogVisible, true)
  assert.strictEqual(vm.editForm.versionTag, 'V3')
  assert.strictEqual(vm.formGradeOptions.length, 2)
  assert.strictEqual(vm.gradeUnavailable(vm.formGradeOptions[0]), true)
  assert.strictEqual(vm.gradeUnavailable(vm.formGradeOptions[1]), false)
  vm.selectedVersion = 'V2'
  vm.isModification = true
  assert.strictEqual(vm.versionExpireText(vm.versionOptions[0]), '—')
  assert.strictEqual(vm.versionExpireText({ expireDate: null }), '长期有效')
  console.log('PASS: current version protected; missing version dates stay unknown; modification does not overwrite active rules')

  const benefit = {
    benefitCode: 'QY1', benefitName: '体检', kind: '健康服务', supplier: '服务商',
    itemsJson: JSON.stringify([{ cat: '体检', name: '套餐A' }, { cat: '体检', name: '套餐B' }]),
    identitiesJson: '["POLICYHOLDER","INSURED"]', regionsJson: '["全国"]',
    needOrder: '1', needAudit: '1', freqUnlimited: '1', orderChannelsJson: '["官微"]',
    itemRulesJson: JSON.stringify([
      { cat: '体检', name: '套餐A', needOrder: '0', needAudit: '0', freqUnlimited: '0', freqYears: 2, freqAvgYears: 1, freqCount: 3 },
      { cat: '体检', name: '套餐B', needOrder: '1', needAudit: '1', freqUnlimited: '1', orderChannels: ['WECHAT'] }
    ])
  }
  responses['/platform/benefit/rule/view'] = { data: { items: [benefit] } }
  await vm.loadRuleDetail('V2', 'WUXING')
  assert.deepStrictEqual(vm.editForm.rightsList[0].identities, ['POLICYHOLDER', 'INSURED'])
  assert.deepStrictEqual(vm.editForm.rightsList[0].items[0].orderChannels, ['WECHAT'])
  assert.strictEqual(vm.editForm.rightsList[0].items[0].needOrder, false)
  assert.strictEqual(vm.editForm.rightsList[0].items[0].freqUnlimited, false)
  await vm.handleView({ grade_code: 'WUXING', gradeName: '五星' })
  assert.strictEqual(vm.viewData.itemList[0].identity, '投保人、有效保单被保险人')
  assert.strictEqual(vm.viewData.itemList[0].frequency, '2年内平均1年使用3次')
  assert.strictEqual(vm.viewData.itemList[0].needOrder, '否')
  assert.strictEqual(vm.viewData.itemList[0].orderChannel, '—')
  assert.strictEqual(vm.viewData.itemList[1].orderChannel, '官微')
  assert.strictEqual(vm.viewData.itemList[1].needAudit, '是')
  console.log('PASS: project overrides, string flags, identity codes and translated detail values')

  const pending = {
    versionTag: 'V2', gradeCode: 'WUXING', gradeName: '五星（新V）',
    effectiveDate: '2099-01-01', status: 'PENDING_EFFECTIVE',
    operator: '核对用户', modifyTime: '2026-10-26 10:00', description: '记录快照',
    items: [benefit]
  }
  const snapshotBefore = JSON.stringify(pending)
  vm.changeRecords = [pending, { ...pending, status: 'ACTIVE' }, { ...pending, status: 'EXPIRED' }]
  vm.handleViewChange(pending)
  assert.strictEqual(vm.viewIsChange, true)
  assert.strictEqual(vm.viewData.itemList[0].frequency, '2年内平均1年使用3次')
  assert.deepStrictEqual(vm.changeDetailFields.map(field => field.label), ['规则版本', '星级', '生效日期', '修改人', '修改时间', '状态'])
  assert.strictEqual(vm.changeStatusText('PENDING_EFFECTIVE'), '待生效')
  assert.strictEqual(vm.changeStatusText('ACTIVE'), '生效中')
  assert.strictEqual(vm.changeStatusText('EXPIRED'), '已失效')
  vm.handleEditChange(pending)
  assert.strictEqual(vm.isEditMode, true)
  assert.strictEqual(vm.editForm.effectiveDate, '2099-01-01')
  assert.strictEqual(vm.editForm.description, '记录快照')
  vm.editForm.rightsList[0].items[0].freqYears = 99
  vm.editForm.rightsList[0].identities.push('TEST')
  assert.strictEqual(JSON.stringify(pending), snapshotBefore, 'Editing must not mutate the record snapshot')
  vm.isEditMode = false
  assert.strictEqual(vm.gradeUnavailable({ gradeCode: 'WUXING' }), true)
  assert.strictEqual(vm.gradeUnavailable({ gradeCode: 'SANXING' }), false)
  vm.handleChangePageSizeChange(20)
  assert.strictEqual(vm.pagedChangeRecords.length, 3)
  const requestsBeforeDelete = calls.length
  vm.handleDeleteChange(pending)
  assert.strictEqual(calls.length, requestsBeforeDelete)
  assert.strictEqual(vm.changeRecords.length, 3)
  console.log('PASS: change detail fields and snapshot, pending edit isolation, duplicate pending grades, pagination and unavailable delete protection')

  vm.editForm.rightsList = []
  vm.selectedRightsFromDialog = [benefit]
  vm.confirmSelectRights()
  vm.confirmSelectRights()
  assert.strictEqual(vm.editForm.rightsList.length, 1)
  assert.deepStrictEqual(vm.editForm.rightsList[0].regions, [])
  assert.deepStrictEqual(vm.editForm.rightsList[0].identities, ['POLICYHOLDER'])
  assert.strictEqual(vm.editForm.rightsList[0].items[0].needOrder, false)
  vm.allRightsList = [benefit]
  vm.rightsKeyword = '服务商'
  assert.strictEqual(vm.filteredRightsList.length, 1)
  vm.rightsKeyword = '不存在'
  assert.strictEqual(vm.filteredRightsList.length, 0)
  assert.strictEqual(vm.rightSelectable(benefit), false)
  console.log('PASS: rights selection deduplicates, default identity is correct, filtering matches supplier')

  vm.isModification = false
  vm.selectedVersion = 'V3'
  vm.editForm.versionTag = 'V3'
  vm.editForm.gradeCode = 'WUXING'
  const saveCount = () => calls.filter(call => call.url.endsWith('/save')).length
  const before = saveCount()
  await vm.handleSaveRule()
  assert.strictEqual(saveCount(), before, 'Missing area must block save')
  vm.editForm.rightsList[0].regions = ['全国']
  await vm.handleSaveRule()
  assert.strictEqual(saveCount(), before + 1)
  const payload = calls.find(call => call.url.endsWith('/save')).data
  assert.deepStrictEqual(payload.items[0].identities, ['POLICYHOLDER'])
  assert.strictEqual(payload.items[0].itemRules.length, 2)
  assert.deepStrictEqual(payload.items[0].itemRules[0].orderChannels, [])
  assert.strictEqual(payload.items[0].itemRules[0].needOrder, 0)
  responses['/platform/benefit/rule/import'] = { data: { total: 3, success: 2, fail: 1 } }
  const fileEvent = { target: { files: [{ name: 'test.xlsx' }], value: 'test.xlsx' } }
  await vm.handleFileChange(fileEvent)
  const multipart = calls.find(call => call.url.endsWith('/import')).data.fields
  assert.strictEqual(multipart.file, fileEvent.target.files[0])
  assert.strictEqual(multipart.versionTag, 'V3')
  assert.ok(messages.some(message => message.type === 'warning' && message.text.includes('成功 2 条，失败 1 条')))
  assert.strictEqual(fileEvent.target.value, '')
  assert.strictEqual(vm.importing, false)
  console.log('PASS: save validation and encoded payload; partial import failure is not reported as full success')

  if (!process.argv.includes('--live')) return
  live = true
  const real = makeVM()
  await real.fetchDictOptions()
  await real.fetchVersions()
  await real.fetchTableData()
  await real.fetchGradeConfigStatus()
  await real.fetchBenefitItems()
  assert.ok(real.selectedVersion && real.tableData.length && real.allRightsList.length)
  assert.ok(real.idTypeOptions.some(option => option.code === 'POLICYHOLDER'))
  for (const row of real.tableData) {
    await real.handleView(row)
    assert.ok(real.viewData.itemList.length)
    assert.ok(!real.viewData.itemList.some(item => /POLICYHOLDER|INSURED/.test(item.identity)))
  }
  await api.exportRuleApi()
  await api.exportBenefitRuleApi(real.selectedVersion)
  console.log('PASS: live versions, grades, rights library, every configured grade detail, identity/channel dictionaries, XLSX template and export')
  console.log('Backend limitation: no rule change records or effective/expiry dates in the available service-rule API')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
