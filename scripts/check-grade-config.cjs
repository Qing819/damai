const fs = require('fs')
const path = require('path')
const assert = require('assert')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')

const file = path.join(__dirname, '../src/views/personal/test/point-level-manage.vue')
const source = compiler.parseComponent(fs.readFileSync(file, 'utf8'))
const template = compiler.compile(source.template.content)
assert.deepStrictEqual(template.errors, [])
const code = babel.transformSync(source.script.content, {
  babelrc: false,
  configFile: false,
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
}).code
const calls = []
const responses = {}
const api = new Proxy({}, {
  get: (_, name) => async (...args) => {
    calls.push({ name, args })
    return responses[name] || { data: [] }
  }
})
const moduleObject = { exports: {} }
new Function('require', 'module', 'exports', code)(
  () => api, moduleObject, moduleObject.exports
)
const component = moduleObject.exports.default
const messages = []
const vm = Object.assign(component.data(), component.methods, {
  $message: {
    warning: text => messages.push(text),
    success: text => messages.push(text),
    error: text => { throw Error(text) }
  },
  $confirm: async () => {}
})
for (const [name, getter] of Object.entries(component.computed)) {
  Object.defineProperty(vm, name, { get: () => getter.call(vm) })
}
const band = (gradeName, minPoint, maxPoint, extra = {}) => ({
  gradeName, displayGradeName: `${gradeName}（新V）`,
  minPoint, maxPoint, minBoundary: '含', maxBoundary: '不含', ...extra
})
async function run() {
  vm.currentVersionId = 2
  vm.bandData = []
  vm.openBatchAddDialog()
  assert.strictEqual(vm.batchRows.length, 3)
  assert.ok(vm.batchRows.every(row => row.minPoint === ''))
  vm.addBatchRow()
  vm.removeBatchRow(3)
  assert.strictEqual(vm.batchRows.length, 3)
  assert.ok(vm.validateBandRows([band('普星', 0, 20), band('三星', 10, 30)]).includes('重叠'))
  assert.ok(vm.validateBandRows([band('普星', 0, 20), band('三星', 21, 30)]).includes('缺口'))
  assert.ok(vm.validateBandRows([band('普星', 0, 20, { maxBoundary: '含' }), band('三星', 20, 30)]).includes('重叠'))
  assert.ok(vm.validateBandRows([band('普星', 0, 20), band('三星', 20, 30, { minBoundary: '不含' })]).includes('缺口'))
  assert.ok(vm.validateBandRows([band('普星', 0, 20), band('普星', 20, 30)]).includes('重复'))
  assert.ok(vm.validateBandRows([band('普星', 0, 0)]))
  assert.ok(vm.validateBandRows([band('普星', 0, 'Infinity')]))
  const rows = [band('普星', 0, 20, { id: 1, gradeOrder: 1 }), band('三星', 20, '')]
  assert.strictEqual(vm.validateBandRows(rows), '')
  vm.batchRows = rows
  await vm.handleSaveBatchBands()
  const batch = calls.find(call => call.name === 'saveGradeConfigBandsBatchApi')
  assert.strictEqual(batch.args[0].length, 2)
  assert.strictEqual(batch.args[0][0].gradeCode, 'PUXING')
  assert.strictEqual(batch.args[0][0].gradeName, '普星（新V）')
  assert.strictEqual(batch.args[0][0].gradeOrder, 1)
  assert.strictEqual(batch.args[0][1].maxPoint, null)
  assert.ok(Number.isInteger(batch.args[0][1].gradeOrder))
  assert.strictEqual(batch.args[0][1].status, '1')
  vm.bandData = rows
  assert.strictEqual(vm.validateBandRows([rows[0]]), '')
  const row = vm.normalizeBand({ id: 1, gradeCode: 'PUXING', gradeName: '普星（新V）', minPoint: 0, maxPoint: 20 })
  vm.handleEditSingle(row)
  assert.strictEqual(vm.batchRows[0].gradeName, '普星')
  assert.strictEqual(vm.batchRows[0].displayGradeName, '普星（新V）')
  assert.strictEqual(vm.getBandCode(vm.normalizeBand({ gradeCode: '普星', gradeName: '普星（新V）' })), '普星')
  vm.bandData = [row]
  vm.handleEditSingle(row)
  vm.batchRows[0].maxPoint = ''
  vm.dialogBatchVisible = true
  responses.getGradeConfigBandsApi = { data: [{ ...row, gradeName: '普星（新V）' }] }
  const originalError = vm.$message.error
  vm.$message.error = text => messages.push(text)
  const previousSuccessCount = messages.filter(text => text === '保存成功！').length
  await vm.handleSaveBatchBands()
  assert.ok(messages.includes('后端未保存“无上限”设置，请联系后端处理后重试'))
  assert.strictEqual(vm.dialogBatchVisible, true)
  assert.strictEqual(messages.filter(text => text === '保存成功！').length, previousSuccessCount)
  vm.$message.error = originalError
  delete responses.getGradeConfigBandsApi
  assert.strictEqual(vm.formatPointBoundary(0, '不含', true), '0（不含边界以下）')
  const pending = { id: 3, versionNo: 'V3', status: '1', displayStatus: 'PENDING_EFFECTIVE' }
  assert.strictEqual(vm.formatVersionOption(pending), 'V3（待生效）')
  assert.strictEqual(vm.getVersionTagType(pending), 'warning')
  assert.strictEqual(vm.formatVersionStatus({ status: '1', displayStatus: 'EXPIRED' }), '已失效')
  vm.bandData = Array.from({ length: 25 }, (_, id) => ({ id }))
  vm.bandPage = 3
  assert.strictEqual(vm.pagedBandData.length, 5)
  vm.handleBandPageSizeChange(20)
  assert.strictEqual(vm.bandPage, 1)
  assert.strictEqual(vm.pagedBandData.length, 20)
  vm.activeTab = 'versionConfig'
  component.watch.userRole.call(vm, 'user')
  assert.strictEqual(vm.activeTab, 'bandConfig')
  const originalInit = vm.initData
  vm.initData = async () => {}
  vm.openVersionDialog()
  assert.deepStrictEqual(vm.versionForm, { versionNo: '', effectiveDate: '', expireDate: null })
  vm.versionData = [{ versionNo: 'V2', expireDate: null }]
  vm.versionForm = { versionNo: 'V3', effectiveDate: '2026-11-01' }
  await vm.handleCreateVersion()
  assert.strictEqual(calls.filter(call => call.name === 'addGradeConfigVersionApi').length, 0)
  vm.versionData[0].expireDate = '2026-10-31'
  vm.versionForm.effectiveDate = '2026-11-02'
  await vm.handleCreateVersion()
  assert.strictEqual(calls.filter(call => call.name === 'addGradeConfigVersionApi').length, 0)
  vm.versionForm.effectiveDate = '2026-11-01'
  await vm.handleCreateVersion()
  assert.deepStrictEqual(calls.find(call => call.name === 'addGradeConfigVersionApi').args[0], {
    versionNo: 'V3', effectiveDate: '2026-11-01', expireDate: null
  })
  vm.openObsoleteDialog({ id: 2, versionNo: 'V2', effectiveDate: '2026-08-01' })
  assert.strictEqual(vm.obsoleteForm.expireDate, vm.getLocalToday())
  vm.obsoleteForm.expireDate = '2000-01-01'
  await vm.handleConfirmObsolete()
  assert.ok(!calls.some(call => call.name === 'voidGradeConfigVersionApi'))
  vm.obsoleteForm.expireDate = vm.getLocalToday()
  await vm.handleConfirmObsolete()
  assert.deepStrictEqual(calls.find(call => call.name === 'voidGradeConfigVersionApi').args, [2, { voidDate: vm.getLocalToday() }])
  vm.initData = originalInit
  responses.getGradeConfigVersionsApi = { data: [] }
  await vm.initData()
  assert.strictEqual(vm.currentVersionId, null)
  assert.strictEqual(vm.bandData.length, 0)
  console.log('PASS: grade config template, intervals, batch payload, edit, pagination, roles and version dates')
}
run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
