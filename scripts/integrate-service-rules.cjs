// Opt-in real integration: create/update/delete only records tagged with this run ID.
const assert = require('assert')
const { execFileSync } = require('child_process')
const axios = require('axios')
const FormData = require('form-data')
const { loadFile, loadComponent } = require('./test-utils.cjs')
const baseURL = process.env.SERVICE_RULE_API || 'http://192.168.137.235:8002'
const runId = `SERVICE-RULE-IT-${Date.now()}`
const results = []
const requests = []
const http = axios.create({ baseURL, timeout: 20000 })
global.FormData = FormData
let allowWrites = false
async function request(config) {
  if (config.method !== 'get') assert.ok(allowWrites, 'Use --write-test-record to enable integration writes')
  requests.push({ method: config.method, url: config.url })
  const response = await http({ ...config, headers: config.data instanceof FormData ? config.data.getHeaders() : undefined,
    responseType: config.responseType === 'blob' ? 'arraybuffer' : 'json' })
  if (config.responseType === 'blob') {
    assert.match(response.headers['content-type'], /spreadsheetml/)
    assert.ok(response.headers['content-disposition'])
    assert.strictEqual(Buffer.from(response.data).slice(0, 2).toString(), 'PK')
    return response.data
  }
  if (!response.data.header || response.data.header.statusCode !== '000000') {
    throw new Error((response.data.header || {}).message || '接口未返回成功结果')
  }
  return response.data.body
}
const api = loadFile('src/api/test/index.js', () => request)
const { component } = loadComponent('src/views/personal/test/service-rule-manage.vue', () => api)
const messages = []
const vm = { ...component.data(), $message: Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => messages.push({ type, text })])),
  $nextTick: callback => callback(), $confirm: async () => {}, $refs: { editTableRef: { toggleRowExpansion() {} } } }
Object.entries(component.methods).forEach(([key, value]) => { vm[key] = value.bind(vm) })
Object.entries(component.computed).forEach(([key, get]) => Object.defineProperty(vm, key, { get: () => get.call(vm) }))
async function check(name, action) {
  try { await action(); results.push({ name, pass: true }); console.log(`PASS ${name}`) } catch (error) {
    results.push({ name, pass: false, error: error.message }); console.error(`FAIL ${name}: ${error.message}`)
  }
}
async function mustReject(action, label = 'Invalid write') {
  let rejected = false
  try { await action() } catch (error) { rejected = true }
  assert.ok(rejected, `${label} was accepted`)
}
function workbookRows(buffer) {
  // Parse XLSX in memory with the standard library, without installing spreadsheet dependencies.
  const program = `import io,json,sys,zipfile,xml.etree.ElementTree as E
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
n={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
shared=[]
if 'xl/sharedStrings.xml' in z.namelist():
 for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',n):
  shared.append(''.join(t.text or '' for t in x.findall('.//s:t',n)))
out=[]
for row in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:row',n):
 cells=[]
 for cell in row.findall('s:c',n):
  v=cell.find('s:v',n)
  value=v.text if v is not None else ''.join(t.text or '' for t in cell.findall('.//s:t',n))
  cells.append(shared[int(value)] if cell.get('t')=='s' else value)
 out.append(cells)
print(json.dumps(out,ensure_ascii=False))`
  return JSON.parse(execFileSync('python3', ['-c', program], { input: buffer, encoding: 'utf8' }))
}
async function run() {
  allowWrites = process.argv.includes('--write-test-record')
  await vm.initPageData()
  assert.ok(vm.selectedVersion && vm.tableData.length)
  const versionTag = vm.selectedVersion
  const snapshot = await Promise.all(vm.tableData.map(row => api.getRuleViewApi({ versionTag, gradeCode: row.grade_code })))
  const beforeRecords = (await api.getServiceRuleModListApi()).data
  const template = workbookRows(await api.exportRuleApi())
  const exported = workbookRows(await api.exportBenefitRuleApi(versionTag))
  await check('接口1~4/9：版本、等级汇总/状态、整包详情、权益库和字典', async () => {
    assert.ok(vm.versionOptions.some(item => item.version_tag === versionTag && vm.flag(item.current_flag)))
    assert.ok(vm.gradeConfigList.length)
    await vm.fetchBenefitItems()
    assert.ok(vm.allRightsList.length)
    assert.deepStrictEqual(vm.orderChannelOptions.map(item => item.code), ['00', '01', '02'])
    for (const response of snapshot) assert.ok(response.data.items.length)
  })
  await check('接口6/8：Excel响应头、14列表头和模板/导出数据', async () => {
    assert.strictEqual(template[0].length, 14)
    assert.deepStrictEqual(template[0], exported[0])
    assert.ok(template[0].includes('订单申请途径'))
    assert.ok(template.length >= 2 && exported.length >= 2)
  })
  await check('接口10/11：真实修改记录与可发起等级', async () => {
    await vm.handleStartModification()
    assert.ok(vm.editDialogVisible && vm.formGradeOptions.length)
    assert.ok(vm.formGradeOptions.every(grade => vm.gradeConfigList.some(item => item.gradeCode === grade.gradeCode && Number(item.configured) === 1)))
  })
  if (!allowWrites) {
    console.log('Read-only complete. Use --write-test-record for future-record write tests.')
    if (results.some(item => !item.pass)) process.exitCode = 1
    return
  }
  const grade = vm.formGradeOptions.find(item => Number(item.pendingMod) !== 1)
  assert.ok(grade, 'No grade is available for a new pending test record')
  const baseRecordIds = new Set(beforeRecords.map(record => record.id))
  let recordId
  try {
    await check('接口12：前端创建未来待生效修改并刷新真实列表', async () => {
      vm.editForm.gradeCode = grade.gradeCode
      vm.editForm.effectiveDate = '2099-12-30'
      vm.editForm.description = runId
      const right = vm.allRightsList.find(item => item.benefitCode === 'QY0005')
      vm.selectedRightsFromDialog = [right]
      vm.confirmSelectRights()
      const selected = vm.editForm.rightsList[0]
      selected.regions = ['全国']
      selected.identities = ['POLICYHOLDER', 'INSURED']
      Object.assign(selected.items[0], { freqUnlimited: false, freqYears: 3, freqAvgYears: 1, freqCount: 2, needOrder: true, orderChannels: ['00', '02'], needAudit: false })
      Object.assign(selected.items[1], { freqUnlimited: true, needOrder: false, orderChannels: [], needAudit: true })
      await vm.handleSaveRule()
      const record = (await api.getServiceRuleModListApi()).data.find(item => item.description === runId)
      assert.ok(record, messages.slice(-1).map(item => item.text).join())
      recordId = record.id
      assert.strictEqual(record.statusCode, 'PENDING')
      assert.strictEqual(vm.editDialogVisible, false)
      assert.ok(vm.changeRecords.some(item => item.id === recordId))
    })
    if (recordId == null) throw new Error('Creation did not return a verifiable test record')
    await check('接口15：快照完整回显00/01、中文途径和逐项目独立配置', async () => {
      const detail = (await api.getServiceRuleModViewApi(recordId)).data
      assert.strictEqual(detail.gradeCode, grade.gradeCode)
      assert.strictEqual(detail.effectiveDate, '2099-12-30')
      const rules = JSON.parse(detail.items[0].itemRulesJson)
      assert.strictEqual(rules[0].freqUnlimited, '01')
      assert.strictEqual(rules[0].needOrder, '00')
      assert.strictEqual(rules[0].needAudit, '01')
      assert.deepStrictEqual(rules[0].orderChannels, ['官微', '客服电话95348'])
      assert.strictEqual(rules[1].freqUnlimited, '00')
      assert.strictEqual(rules[1].needAudit, '00')
      await vm.handleViewChange(vm.normalizeChange(detail))
      assert.ok(vm.viewData.itemList.length, messages.slice(-2).map(item => item.text).join('; '))
      assert.strictEqual(vm.viewData.itemList[0].frequency, '3年内平均1年使用2次')
      assert.strictEqual(vm.viewData.itemList[0].orderChannel, '官微、客服电话95348')
      assert.strictEqual(vm.viewData.itemList[0].needAudit, '否')
      assert.strictEqual(vm.viewData.itemList[1].frequency, '不限次')
      assert.strictEqual(vm.viewData.itemList[1].needOrder, '否')
      assert.strictEqual(vm.viewData.itemList[1].needAudit, '是')
    })
    await check('接口11/12：已有待生效修改等级禁选，后端也拒绝重复创建', async () => {
      await vm.loadFormGradeOptions(versionTag)
      assert.strictEqual(Number(vm.formGradeOptions.find(item => item.gradeCode === grade.gradeCode).pendingMod), 1)
      const detail = (await api.getServiceRuleModViewApi(recordId)).data
      await mustReject(() => api.createServiceRuleModApi({ versionTag, gradeCode: grade.gradeCode, effectiveDate: '2099-12-31', description: runId,
        items: [{ benefitCode: detail.items[0].benefitCode }] }))
    })
    await check('接口13：编辑真实快照、锁定版本等级并持久化', async () => {
      const record = vm.changeRecords.find(item => item.id === recordId)
      await vm.handleEditChange(record)
      assert.ok(vm.isEditMode && vm.editForm.id === recordId)
      assert.ok(vm.editForm.rightsList[0].items[1], messages.slice(-2).map(item => item.text).join('; '))
      assert.strictEqual(vm.editForm.rightsList[0].items[1].freqUnlimited, true)
      vm.editForm.description = `${runId}-UPDATED`
      vm.editForm.effectiveDate = '2099-12-31'
      vm.editForm.rightsList[0].items[0].freqCount = 5
      await vm.handleSaveRule()
      const detail = (await api.getServiceRuleModViewApi(recordId)).data
      assert.strictEqual(detail.description, `${runId}-UPDATED`)
      assert.strictEqual(detail.effectiveDate, '2099-12-31')
      assert.strictEqual(JSON.parse(detail.items[0].itemRulesJson)[0].freqCount, 5)
      assert.strictEqual(detail.versionTag, versionTag)
      assert.strictEqual(detail.gradeCode, grade.gradeCode)
    })
    await check('接口13：非未来日期、变更等级和超长描述均被拒绝', async () => {
      const payload = { id: recordId, versionTag, gradeCode: grade.gradeCode, effectiveDate: '2099-12-31', description: runId, items: [{ benefitCode: 'QY0005' }] }
      await mustReject(() => api.updateServiceRuleModApi({ ...payload, effectiveDate: '2000-01-01' }), 'Past date')
      await mustReject(() => api.updateServiceRuleModApi({ ...payload, gradeCode: 'PUXING' }), 'Changed grade')
      await mustReject(() => api.updateServiceRuleModApi({ ...payload, description: '测'.repeat(201) }), '201-character description')
      assert.strictEqual((await api.getServiceRuleModViewApi(recordId)).data.description, `${runId}-UPDATED`)
    })
    await check('接口13：非法布尔值应按清单返回业务失败', async () => {
      const payload = { id: recordId, versionTag, gradeCode: grade.gradeCode, effectiveDate: '2099-12-31', description: `${runId}-UPDATED`,
        items: [{ benefitCode: 'QY0005', needOrder: 'BAD' }] }
      await mustReject(() => api.updateServiceRuleModApi(payload), 'needOrder=BAD')
    })
    await check('接口5/7：无效保存与无效Excel导入返回业务失败，现行规则不改变', async () => {
      await mustReject(() => api.saveRuleApi({ versionTag: '', gradeCode: '', items: [] }))
      const file = Buffer.from('not an Excel workbook')
      // Use multipart with a deliberately invalid workbook to verify the error contract.
      const form = new FormData()
      form.append('file', file, { filename: 'invalid.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      form.append('versionTag', versionTag)
      await mustReject(() => request({ url: '/platform/benefit/rule/import', method: 'post', data: form }))
    })
  } finally {
    // Locate our uniquely tagged record even when an assertion failed after creation.
    const records = (await api.getServiceRuleModListApi()).data
    const own = records.filter(item => !baseRecordIds.has(item.id) && (item.id === recordId || (item.description || '').startsWith(runId)))
    for (const record of own) {
      assert.strictEqual(record.statusCode, 'PENDING', 'Test record is no longer pending; refusing cleanup')
      await vm.handleDeleteChange(vm.normalizeChange(record))
    }
    await check('接口14：仅删除本轮记录，列表与现行规则恢复原状', async () => {
      const after = (await api.getServiceRuleModListApi()).data
      assert.deepStrictEqual(after, beforeRecords)
      const afterSnapshot = await Promise.all(vm.tableData.map(row => api.getRuleViewApi({ versionTag, gradeCode: row.grade_code })))
      assert.deepStrictEqual(afterSnapshot, snapshot)
    })
  }
  console.log(JSON.stringify({ baseURL, runId, recordId, results, endpoints: [...new Set(requests.map(item => `${item.method.toUpperCase()} ${item.url}`))] }, null, 2))
  if (results.some(item => !item.pass)) process.exitCode = 1
}
run().catch(error => { console.error(error); process.exitCode = 1 })
