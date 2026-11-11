const assert = require('assert')
const { loadComponent, loadFile } = require('./test-utils.cjs')
const Validator = require('async-validator')
const compiler = require('vue-template-compiler')
const benefitModel = loadFile('src/views/personal/test/benefit-adjust-model.js', () => ({}))
const calls = []
let handler = async () => ({ data: { list: [], total: 0 } })
const api = new Proxy({}, { get: (_, name) => async (...args) => {
  calls.push({ name, args })
  return handler(name, ...args)
} })
function instance(file) {
  const { component, template } = loadComponent(`src/views/personal/test/${file}.vue`, name => {
    if (name.includes('benefit-adjust-model')) return benefitModel
    return api
  })
  const messages = []
  const vm = {
    ...component.data(),
    $message: Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => messages.push({ type, text })])),
    $refs: {}, $nextTick: done => done && done()
  }
  for (const [name, method] of Object.entries(component.methods)) vm[name] = method.bind(vm)
  for (const [name, get] of Object.entries(component.computed || {})) Object.defineProperty(vm, name, { get: () => get.call(vm) })
  return { vm, messages, template: template.content }
}
async function run() {
  const audit = instance('point-sh')
  audit.vm.currentRow = { id: 1, status: 'PENDING' }
  for (const result of ['APPROVED', 'REJECTED']) {
    audit.vm.auditRemark = '审'.repeat(501)
    const before = calls.length
    await audit.vm.handleAuditSubmit(result)
    assert.strictEqual(calls.length, before, `${result}: overlong opinions must not reach the API`)
    assert.strictEqual(audit.vm.auditRemark.length, 501, 'Keep rejected input for correction')
  }
  audit.vm.auditRemark = '审'.repeat(500)
  handler = async () => { throw Object.assign(new Error('isolated failure'), { messageShown: true }) }
  const before = calls.length
  await audit.vm.handleAuditSubmit('REJECTED')
  assert.strictEqual(calls.length, before + 1)
  assert.strictEqual(calls[before].args[0].opinion.length, 500)
  assert.strictEqual(audit.vm.auditRemark.length, 500)
  assert.match(audit.template, /v-model="auditRemark"[\s\S]*?maxlength="500"/)
  console.log('PASS F01: audit opinion 500/501 boundaries, both decisions, failure retains input')
  const application = instance('old-to-new')
  const schema = new Validator(application.vm.addRules)
  const validate = data => new Promise((resolve, reject) => schema.validate(data, errors => errors ? reject(new Error(errors[0].message)) : resolve()))
  const valid = { custName: '名'.repeat(50), idType: 'IDCARD', idNo: '1'.repeat(30), effectiveDate: '2099-01-01' }
  await validate(valid)
  for (const [field, length] of [['custName', 50], ['idNo', 30]]) {
    await assert.rejects(validate({ ...valid, [field]: 'X'.repeat(length + 1) }), `${field}: reject an overlong application`)
  }
  assert.match(application.template, /v-model\.trim="addForm\.custName"[^>]*maxlength="50"/)
  assert.match(application.template, /v-model\.trim="addForm\.idNo"[^>]*maxlength="30"/)
  console.log('PASS F02: switch application name 50/51 and identity 30/31 boundaries')
  const level = instance('level-change')
  handler = async () => ({ data: { list: [], total: 0 } })
  level.vm.queryForm.dateFrom = '2026-01-01'
  level.vm.queryForm.dateTo = '2026-01-02'
  level.vm.pagination.pageNo = 3
  const beforeReset = calls.length
  await level.vm.handleReset()
  assert.strictEqual(level.vm.queryForm.dateFrom, '')
  assert.strictEqual(level.vm.queryForm.dateTo, '')
  assert.strictEqual(level.vm.pagination.pageNo, 1)
  for (const call of calls.slice(beforeReset)) {
    assert.strictEqual(call.args[0].dateFrom, undefined)
    assert.strictEqual(call.args[0].dateTo, undefined)
  }
  console.log('PASS F03: reset clears dates for both list and summary and returns to page one')
  const queryLimits = {
    'point-manage': { 'queryForm.custId': 30, 'queryForm.custName': 100, 'queryForm.idNo': 30, 'queryForm.mobile': 11 },
    'point-apply': { 'searchForm.idNo': 30, 'searchForm.custName': 100, 'searchForm.custId': 30 },
    'point-sh': { 'searchForm.idNo': 30, 'searchForm.custName': 100, 'searchForm.custId': 30, 'searchForm.applicant': 50 },
    'point-guiji': { 'queryParams.custId': 30, 'queryParams.custName': 100, 'queryParams.policyNo': 32 },
    'level-change': { 'queryForm.custId': 30, 'queryForm.custName': 100, 'queryForm.idNo': 30 },
    'service-apply': { 'queryForm.idNo': 30, 'queryForm.custName': 50, 'queryForm.custId': 30 },
    'service-approval': { 'queryForm.idNo': 30, 'queryForm.custName': 50, 'queryForm.custId': 30, 'queryForm.applicant': 50 },
    'service-guiji': { 'queryForm.custId': 30, 'queryForm.custName': 50, 'queryForm.idNo': 30 },
    'old-to-new': { 'queryForm.idNo': 30, 'queryForm.applicant': 50 },
    'guiji-tab': { 'queryForm.custId': 30, 'queryForm.custName': 50, 'queryForm.idNo': 30 },
    'point-calculate': { 'detailQueryForm.custName': 50, 'detailQueryForm.idNo': 30, 'activeTaskQuery.applicant': 20, 'riskQuery.riskCode': 20, 'riskQuery.riskName': 50 }
  }
  for (const [file, fields] of Object.entries(queryLimits)) {
    const found = {}
    function visit(node) {
      if (!node || node.type !== 1) return
      const model = node.attrsMap['v-model'] || node.attrsMap['v-model.trim']
      if (node.tag === 'el-input' && model) found[model] = Number(node.attrsMap.maxlength)
      for (const child of node.children || []) visit(child)
      for (const slot of Object.values(node.scopedSlots || {})) visit(slot)
      for (const condition of (node.ifConditions || []).slice(1)) visit(condition.block)
    }
    visit(compiler.compile(instance(file).template).ast)
    for (const [model, limit] of Object.entries(fields)) {
      assert.strictEqual(found[model], limit, `${file}: ${model} must follow the requirement length`)
    }
  }
  console.log('PASS F05: query length requirements across 11 pages and trial dialogs')
  assert.strictEqual(typeof application.vm.canSelectApplication, 'function')
  for (const status of ['PENDING', 'SWITCHED', 'REMOVED', '', undefined]) {
    assert.strictEqual(application.vm.canSelectApplication({ status }), status === 'PENDING')
  }
  assert.match(application.template, /type="selection"[^>]*:selectable="canSelectApplication"/)
  application.vm.selectedRows = [{ id: 1, status: 'PENDING' }, { id: 2, status: 'SWITCHED' }, { id: 3, status: 'REMOVED' }]
  assert.strictEqual(application.vm.prepareBatch(), true)
  assert.deepStrictEqual(application.vm.batchRows.map(row => row.id), [1])
  console.log('PASS F06: only pending rows selectable, submission still excludes processed records')
  audit.messages.length = 0
  handler = async () => { throw Object.assign(new Error('already reported'), { messageShown: true }) }
  await audit.vm.fetchPageList()
  assert.strictEqual(audit.messages.length, 0, 'Reported list failures must not add another notification')
  handler = async () => { throw new Error('unreported') }
  await audit.vm.fetchPageList()
  assert.strictEqual(audit.messages.length, 1)
  assert.strictEqual(audit.messages[0].text, '获取列表失败')
  assert.strictEqual(audit.vm.loading, false)
  console.log('PASS F07: no duplicate list failure notification, unreported errors keep a fallback')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
