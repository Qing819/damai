const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { execFileSync } = require('child_process')
const axios = require('axios')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')

// Only run against the disposable backend explicitly started with the verification database.
const pid = execFileSync('lsof', ['-t', '-iTCP:8003', '-sTCP:LISTEN'], { encoding: 'utf8' }).trim()
const command = execFileSync('ps', ['-p', pid, '-o', 'command='], { encoding: 'utf8' })
assert.ok(command.includes('/bxm_grade_verify_20261026?'), 'An isolated verification database is required')
const root = path.join(__dirname, '..')
const transform = text => babel.transformSync(text, {
  babelrc: false, configFile: false,
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
}).code
const requests = []
async function request(config) {
  const response = await axios({ ...config, baseURL: 'http://localhost:8003', timeout: 15000 })
  const result = response.data
  requests.push({ method: config.method, url: config.url, status: result.header && result.header.statusCode })
  if (!result.header || result.header.statusCode !== '000000') {
    console.error('Backend rejected request:', JSON.stringify({ url: config.url, result }))
    throw Error(JSON.stringify({ url: config.url, result }))
  }
  return result.body
}
function load(text, requireStub) {
  const moduleObject = { exports: {} }
  new Function('require', 'module', 'exports', transform(text))(
    requireStub, moduleObject, moduleObject.exports
  )
  return moduleObject.exports
}
const api = load(fs.readFileSync(path.join(root, 'src/api/test/index.js'), 'utf8'), () => request)
const source = compiler.parseComponent(fs.readFileSync(path.join(root, 'src/views/personal/test/point-level-manage.vue'), 'utf8'))
const component = load(source.script.content, () => api).default
const messages = []
const vm = Object.assign(component.data(), component.methods, {
  $message: {
    warning: text => { throw Error(`Validation rejected: ${text}`) },
    error: text => { throw Error(text) },
    success: text => messages.push(text)
  },
  $confirm: async () => {}
})
for (const [name, getter] of Object.entries(component.computed)) {
  Object.defineProperty(vm, name, { get: () => getter.call(vm) })
}
async function originalSnapshot() {
  const baseURL = 'http://localhost:8002/platform/grade/config'
  const versions = (await axios.get(`${baseURL}/versions`)).data.body.data
  const bands = await Promise.all(versions.map(async version => ({
    versionId: version.id,
    bands: (await axios.get(`${baseURL}/bands`, { params: { versionId: version.id } })).data.body.data
  })))
  return { versions, bands }
}
async function run() {
  const original = await originalSnapshot()
  await vm.initData()
  const old = vm.currentVersionObj
  assert.ok(old.id && !old.expireDate)
  vm.openObsoleteDialog(old)
  await vm.handleConfirmObsolete()
  assert.strictEqual(vm.versionData.find(row => row.id === old.id).expireDate, vm.getLocalToday())
  console.log('PASS: void existing version in disposable database and read expiry back')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const effectiveDate = [tomorrow.getFullYear(), String(tomorrow.getMonth() + 1).padStart(2, '0'), String(tomorrow.getDate()).padStart(2, '0')].join('-')
  vm.openVersionDialog()
  vm.versionForm = { versionNo: 'VERIFY_20261026', effectiveDate, expireDate: null }
  await vm.handleCreateVersion()
  const version = vm.versionData.find(row => row.versionNo === 'VERIFY_20261026')
  assert.ok(version && vm.getVersionState(version) === 'PENDING_EFFECTIVE')
  vm.currentVersionId = version.id
  await vm.fetchBands(version.id)
  assert.strictEqual(vm.bandData.length, 6)
  console.log('PASS: create pending version and verify six copied bands')

  const last = vm.bandData.find(row => row.maxPoint == null)
  vm.handleEditSingle(last)
  vm.batchRows[0].maxPoint = '2000000'
  vm.batchRows.push({
    gradeName: 'CODEX_TEST_GRADE', displayGradeName: '联调临时等级',
    minPoint: '2000000', minBoundary: '含', maxPoint: '', maxBoundary: '不含'
  })
  await vm.handleSaveBatchBands()
  let added = vm.bandData.find(row => row.gradeCode === 'CODEX_TEST_GRADE')
  assert.ok(added && added.maxPoint == null)
  assert.strictEqual(vm.bandData.find(row => row.id === last.id).gradeCode, last.gradeCode)
  console.log('PASS: atomic batch insert/update, null upper bound and original grade code')

  vm.handleEditSingle(added)
  vm.batchRows[0].displayGradeName = '联调临时等级（已编辑）'
  await vm.handleSaveBatchBands()
  added = vm.bandData.find(row => row.id === added.id)
  assert.strictEqual(added.displayGradeName, '联调临时等级（已编辑）')
  console.log('PASS: edit band from frontend model and verify persisted display name')

  await api.deleteGradeConfigBandApi(added.id)
  await vm.fetchBands(version.id)
  assert.ok(!vm.bandData.some(row => row.id === added.id))
  console.log('PASS: delete temporary band and verify it no longer exists')

  const lastSaved = vm.bandData.find(row => row.id === last.id)
  await api.saveGradeConfigBandsBatchApi([{
    ...lastSaved, gradeName: lastSaved.displayGradeName, maxPoint: null
  }])
  await vm.fetchBands(version.id)
  const limitations = []
  if (vm.bandData.find(row => row.id === last.id).maxPoint != null) {
    limitations.push('Backend reports success but does not clear existing maxPoint when null is submitted')
    console.log('FAIL: changing an existing upper bound to unlimited was not persisted')
  }
  await vm.handleDeleteVersion(version)
  assert.ok(!vm.versionData.some(row => row.id === version.id))
  const deletedBands = await api.getGradeConfigBandsApi({ versionId: version.id })
  assert.strictEqual(deletedBands.data.length, 0)
  console.log('PASS: delete pending version and verify cascading band removal')
  assert.deepStrictEqual(await originalSnapshot(), original)
  console.log('PASS: original 8002 version and band data remain unchanged')
  console.log(JSON.stringify({ requests, messages, limitations }, null, 2))
  if (limitations.length) process.exitCode = 1
}
run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
