const assert = require('assert')
const { loadFile, loadComponent } = require('./test-utils.cjs')
const benefitModel = loadFile('src/views/personal/test/benefit-adjust-model.js', () => ({}))

const messages = []
let requestFailed
let responseSucceeded
let responseFailed
const fakeAxios = {
  create: () => ({
    interceptors: {
      request: { use: (_, failed) => { requestFailed = failed } },
      response: { use: (succeeded, failed) => { responseSucceeded = succeeded; responseFailed = failed } }
    }
  })
}
loadFile('src/utils/fetch.js', name => {
  if (name === 'axios') return fakeAxios
  if (name === 'element-ui') return { Message: message => messages.push(message) }
  return {}
})

async function run() {
  const body = { data: [{ id: 1 }] }
  assert.strictEqual(await responseSucceeded({ status: 200, data: { header: { statusCode: '000000' }, body } }), body)
  const legacy = { status: 200, list: [] }
  assert.strictEqual(await responseSucceeded({ status: 200, data: legacy }), legacy)
  const binary = Buffer.from('download')
  assert.strictEqual(await responseSucceeded({ status: 200, data: binary }), binary)
  for (const data of [
    { header: { statusCode: '999999', message: '测试：版本日期冲突' } },
    { status: 500, message: '测试：保存失败' },
    { status: 40101 },
    { status: 40301 },
    { status: 40001 },
    { status: 41111 }
  ]) {
    const before = messages.length
    const response = { status: 200, data }
    await assert.rejects(async () => responseSucceeded(response), error => {
      assert.ok(error instanceof Error, 'rejections must preserve an Error, not a generic string')
      assert.strictEqual(error.response, response)
      assert.strictEqual(error.messageShown, true)
      if (data.header) assert.strictEqual(error.message, data.header.message)
      if (data.message) assert.strictEqual(error.message, data.message)
      return true
    })
    assert.strictEqual(messages.length, before + 1)
  }
  await assert.rejects(async () => responseSucceeded({ status: 503, data: { message: '测试：服务暂不可用' } }))
  for (const error of [
    Object.assign(new Error('HTTP 500'), { response: { status: 500, data: { header: { message: '测试：审核状态已变化' } } } }),
    Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }),
    new Error('Network Error')
  ]) {
    const before = messages.length
    await assert.rejects(() => responseFailed(error), rejected => rejected === error)
    assert.strictEqual(error.messageShown, true)
    assert.strictEqual(messages.length, before + 1)
    assert.ok(messages[messages.length - 1].message)
    if (error.response) assert.strictEqual(error.message, '测试：审核状态已变化')
    await assert.rejects(() => responseFailed(error))
    assert.strictEqual(messages.length, before + 1, 'the same failure must not be announced twice')
  }
  await assert.rejects(() => requestFailed(new Error('request setup failed')))

  for (const [file, method, setup, args] of [
    ['point-rule', 'handleAddRule', {}, [{}]],
    ['point-rule', 'handleUpdateRule', {}, [{}]],
    ['point-rule', 'handleDisableRule', {}, [1]],
    ['point-level-manage', 'handleCreateVersion', { versionForm: { versionNo: 'V_TEST', effectiveDate: '2027-01-01' }, versionData: [] }, []],
    ['point-apply', 'saveEdit', { editForm: { id: 1 }, validateAdjust: () => true, buildAdjustPayload: () => ({ id: 1 }) }, []],
    ['point-sh', 'handleAuditSubmit', { currentRow: { id: 1, status: 'PENDING' }, auditRemark: '' }, ['APPROVED']],
    ['point-sh', 'handleAuditSubmit', { currentRow: { id: 1, status: 'PENDING' }, auditRemark: '测试驳回意见' }, ['REJECTED']],
    ['service-apply', 'submitApplication', {}, [{}, false]],
    ['service-apply', 'submitApplication', {}, [{ id: 1 }, true]],
    ['service-apply', 'handleDelete', {}, [{ id: 1, status: 'REJECTED' }]],
    ['service-approval', 'handleAudit', { dialogVisible: true, isApproveMode: true, currentDetail: { id: 1, status: 'PENDING' }, approvalRemark: '' }, ['APPROVED']],
    ['service-approval', 'handleAudit', { dialogVisible: true, isApproveMode: true, currentDetail: { id: 1, status: 'PENDING' }, approvalRemark: '测试驳回意见' }, ['REJECTED']],
    ['service-rule-manage', 'handleDeleteChange', {}, [{ id: 1, status: 'PENDING' }]],
    ['old-to-new', 'submitSingleAdd', { validateEffectiveDate: () => true, $refs: { addFormRef: { validate: async () => true } } }, []]
  ]) {
    let mode = 'reported'
    const api = new Proxy({}, { get: () => async () => {
      if (mode === 'reported') return responseSucceeded({ status: 200, data: { header: { statusCode: '999999', message: '测试：操作被拒绝' } } })
      if (mode === 'plain') throw new Error('unreported failure')
      return { data: [] }
    } })
    const { component } = loadComponent(`src/views/personal/test/${file}.vue`, name => {
      if (name.includes('benefit-adjust-model')) return benefitModel
      return api
    })
    const pageMessages = []
    const vm = Object.assign(component.data(), component.methods, setup, {
      $message: Object.fromEntries(['success', 'error', 'warning'].map(type => [type, message => pageMessages.push({ type, message })])),
      $confirm: async () => {},
      fetchRulePage: async () => {}, initData: async () => {}, fetchPageList: async () => {},
      fetchList: async () => {}, fetchTableData: async () => {}, fetchChangeRecords: async () => {}, fetchPageData: async () => {}
    })
    const before = messages.length
    await vm[method](...args)
    assert.strictEqual(messages.length, before + 1, `${file}.${method}: backend failure needs a visible reason`)
    assert.strictEqual(pageMessages.length, 0, `${file}.${method}: no duplicate toast or false success`)
    mode = 'plain'
    await vm[method](...args)
    assert.strictEqual(pageMessages.filter(message => message.type === 'error').length, 1, `${file}.${method}: unreported failures need a fallback`)
    mode = 'success'
    await vm[method](...args)
    assert.strictEqual(pageMessages.filter(message => message.type === 'success').length, 1, `${file}.${method}: successful mutation needs feedback`)
  }
  console.log('PASS: response contracts, business/HTTP/network failures, one error notification, request rejection, and mutation success/failure feedback')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
