// 默认运行组件回归；--live 只执行真实 GET，不新增、审批、修改或删除业务记录。
const assert = require('assert')
const axios = require('axios')
const { loadComponent, loadFile } = require('./test-utils.cjs')
const exportUtils = loadFile('src/utils/exportFile.js', () => undefined)
const calls = []
const results = []
let handler
const api = new Proxy({}, { get: (_, name) => (...args) => {
  calls.push({ name, args })
  return handler(name, ...args)
} })
function model(file) {
  const { component } = loadComponent(`src/views/personal/test/${file}.vue`, name => name.includes('utils/exportFile') ? exportUtils : api)
  const vm = {
    ...component.data(), $options: component, $nextTick: () => undefined,
    $message: Object.fromEntries(['error', 'warning', 'success', 'info'].map(key => [key, () => undefined]))
  }
  Object.entries(component.methods).forEach(([key, method]) => { vm[key] = method.bind(vm) })
  return vm
}
function deferred() {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}
async function check(name, fn) {
  try { await fn(); results.push({ name, pass: true }); console.log(`PASS ${name}`) } catch (error) {
    results.push({ name, pass: false }); console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1
  }
}
async function components() {
  const empty = { data: { list: [], total: 0 } }
  for (const [file, formKey, fetch, search, reset, rows] of [
    ['point-manage', 'queryForm', 'fetchTableData', 'handleSearch', 'handleReset', 'tableData'],
    ['point-apply', 'searchForm', 'fetchPageList', 'handleQuery', 'resetQuery', 'recordList'],
    ['point-sh', 'searchForm', 'fetchPageList', 'handleSearch', 'handleReset', 'tableData'],
    ['point-guiji', 'queryParams', 'fetchTracePage', 'handleQuery', 'resetQuery', 'traceList']
  ]) {
    await check(`${file}：查询快照、重置、分页、异步覆盖`, async() => {
      const vm = model(file)
      const key = file === 'point-manage' ? 'custId' : 'custId'
      handler = async() => empty
      vm[formKey][key] = '1001'
      vm[search]()
      vm[formKey][key] = 'draft'
      await vm[fetch]()
      const last = calls.filter(call => !call.name.includes('Stats') && !call.name.includes('Summary')).pop()
      assert.strictEqual(last.args[0].custId, '1001')
      vm[reset]()
      assert.strictEqual(vm.appliedQuery[key], '')
      if (vm.page) vm.page.currentPage = 3
      else if (vm.pageNum) vm.pageNum = 3
      else vm[formKey].pageNum = 3
      vm.handleSizeChange(20)
      assert.strictEqual(vm.page ? vm.page.currentPage : vm.pageNum || vm[formKey].pageNum, 1)
      await Promise.resolve()
      await Promise.resolve()
      const old = deferred(), latest = deferred()
      handler = name => name.includes('Stats') ? Promise.resolve({ data: {} }) : old.promise
      const first = vm[fetch]()
      handler = name => name.includes('Stats') ? Promise.resolve({ data: {} }) : latest.promise
      const second = vm[fetch]()
      latest.resolve({ data: { list: [{ id: 2 }], total: 1 } })
      await second
      old.resolve({ data: { list: [{ id: 1 }], total: 1 } })
      await first
      assert.strictEqual(vm[rows][0].id, 2)
    })
  }
  await check('客户列表：驼峰字段、零值、代理、体系与等级', async() => {
    const vm = model('point-manage')
    const row = vm.normalizeCustomer({ custId: '1001', currentPoint: 0, ruleVersionTag: 'V1_LEGACY', agentCompany: '测试经代', agentName: '测试代理' })
    assert.strictEqual(row.custId, '1001')
    assert.strictEqual(row.currentPoint, 0)
    assert.strictEqual(row.agentCompany, '测试经代')
    assert.strictEqual(row.agentName, '测试代理')
    assert.ok(vm.isLegacySystem(row))
    assert.strictEqual(vm.getLevelCode('SANXING'), '3star')
    assert.strictEqual(vm.normalizeCustomer({ currentPoint: 0 }).currentPoint, 0)
  })
  await check('新驼峰契约：客户列表全部18字段及mobile/channel', async() => {
    const vm = model('point-manage')
    const data = {
      custId: '1001', ruleVersionTag: 'V2_2027', coreCustId: 'CORE1',
      custName: '测试客户', idType: 'IDCARD', idNo: 'TEST',
      currentGrade: 'SANXING', currentPoint: 0, premiumPoint: 12,
      loyaltyPoint: 3, manualPoint: -15, orgName: '机构',
      org2Name: '二级机构', org3Name: '三级机构', bankName: '银行',
      agentCompany: '经代公司', agentName: '代理人', traceCnt: 0,
      mobile: 'TEST', channel: 'AGENT'
    }
    handler = async() => ({ data: { list: [data], total: 1 } })
    await vm.fetchTableData()
    const row = vm.tableData[0]
    Object.keys(data).forEach(key => assert.strictEqual(row[key], data[key]))
    assert.ok(Object.keys(row).every(key => !key.includes('_')))
    const request = calls.filter(call => call.name === 'getCustPointListApi').pop()
    assert.ok(Object.keys(request.args[0]).every(key => !key.includes('_')))
    let route
    vm.$router = { push: value => { route = value } }
    vm.handleDetail(row)
    assert.strictEqual(route.query.custId, data.custId)
  })
  await check('新驼峰契约：两处轨迹统计的零值、负数与总数', async() => {
    for (const file of ['point-guiji', 'point-manage-detail']) {
      const vm = model(file)
      for (const data of [
        { addTotal: 0, reduceTotal: 15, netChange: -15, total: 2 },
        { addTotal: 0, reduceTotal: 0, netChange: 0, total: 0 }
      ]) {
        handler = async() => ({ data })
        await vm.fetchTraceSummary()
        assert.deepStrictEqual(vm.summaryData || vm.traceSummary, {
          addTotal: data.addTotal, reduceTotal: data.reduceTotal,
          netChange: data.netChange, total: data.total
        })
      }
    }
  })
  await check('新驼峰契约：详情7项积分与6项权益字段、零次数和不限次数', async() => {
    const vm = model('point-manage-detail')
    const pointSummary = {
      custId: '1001', currentGrade: 'SANXING', currentPoint: 0,
      premiumPoint: 12, loyaltyPoint: 3, manualPoint: -15, traceCnt: 0
    }
    const benefitStatus = [
      { benefitCode: 'B1', benefitName: '有限权益', limitType: 'limited', grantCount: 0, usedCount: 0, remainCount: 0 },
      { benefitCode: 'B2', benefitName: '不限权益', limitType: 'unlimited', grantCount: null, usedCount: 0, remainCount: null }
    ]
    handler = async() => ({ data: { pointSummary, benefitStatus } })
    await vm.fetchDetailData('1001')
    for (const [source, actual] of [[pointSummary, vm.pointsSummary],
      ...benefitStatus.map((item, index) => [item, vm.benefitsData[index]])]) {
      Object.entries(source).forEach(([key, value]) => {
        assert.strictEqual(actual[key], value)
      })
    }
  })
  await check('申请与审核：详情失败关闭、缺主键不请求、旧详情不覆盖新详情', async() => {
    for (const [file, method, visible, detail] of [
      ['point-apply', 'openDetail', 'detailDialogVisible', 'detailData'],
      ['point-sh', 'openAuditModal', 'dialogVisible', 'currentRow']
    ]) {
      const vm = model(file)
      handler = async() => ({ data: null })
      await vm[method]({ id: 1 })
      assert.strictEqual(vm[visible], false)
      const before = calls.length
      await vm[method]({ applyNo: 'not-primary-key' })
      assert.strictEqual(calls.length, before)
      const old = deferred(), latest = deferred()
      handler = () => old.promise
      const first = vm[method]({ id: 1 })
      handler = () => latest.promise
      const second = vm[method]({ id: 2 })
      latest.resolve({ data: { id: 2 } }); await second
      old.resolve({ data: { id: 1 } }); await first
      assert.strictEqual(vm[detail].id, 2)
    }
  })
  await check('积分审核：必填意见、状态限制、重复提交与正确入参', async() => {
    const vm = model('point-sh')
    vm.currentRow = { id: 1, status: 'PENDING' }
    let before = calls.length
    await vm.handleAuditSubmit('REJECTED')
    assert.strictEqual(calls.length, before)
    const pending = deferred()
    handler = name => name === 'auditPointAdjustApi' ? pending.promise : Promise.resolve(empty)
    const first = vm.handleAuditSubmit('APPROVED')
    before = calls.length
    await vm.handleAuditSubmit('APPROVED')
    assert.strictEqual(calls.length, before)
    assert.deepStrictEqual(calls[before - 1].args[0], { id: 1, result: 'APPROVED', opinion: '' })
    pending.resolve({ data: {} }); await first
    vm.currentRow.status = 'APPROVED'
    before = calls.length
    await vm.handleAuditSubmit('REJECTED')
    assert.strictEqual(calls.length, before)
  })
  await check('积分轨迹：嵌套 trace/apply、证件、实收、零系数、关闭不回填', async() => {
    const vm = model('point-guiji')
    handler = async() => ({ data: {
      trace: { traceId: 'T1', idType: 'IDCARD', idNo: 'test', payNo: 'PAY1', calcCoefficient: 0 },
      apply: { applyNo: 'A1', auditor: '测试审批人', auditOpinion: '测试意见' }
    } })
    await vm.handleViewDetail({ traceId: 'T1' })
    assert.strictEqual(vm.detailData.certType, 'IDCARD')
    assert.strictEqual(vm.detailData.payRecordNo, 'PAY1')
    assert.strictEqual(vm.detailData.calcFactor, 0)
    assert.strictEqual(vm.detailData.approver, '测试审批人')
    const pending = deferred()
    handler = () => pending.promise
    const request = vm.handleViewDetail({ traceId: 'T2' })
    vm.detailDialogVisible = false
    pending.resolve({ data: { trace: { traceId: 'T2' } } }); await request
    assert.strictEqual(vm.detailData, null)
  })
  await check('工作台：真实轨迹筛选、全量分页、草稿隔离、负值和零值', async() => {
    const vm = model('point-apply')
    vm.customerInfo = { custId: '1001' }
    vm.detailFilter = { startDate: '2026-01-01', endDate: '2026-12-31', operationType: 'SYSTEM', pointType: 'PREMIUM' }
    handler = async() => ({ data: { total: 21, list: [{ operateType: 'SYSTEM', pointType: 'PREMIUM', pointAmt: 0, direction: 'ADD' }] } })
    await vm.loadCustomerPoints()
    assert.deepStrictEqual(calls[calls.length - 1].args[0], {
      custId: '1001', pageNum: 1, pageSize: 20, dateFrom: '2026-01-01', dateTo: '2026-12-31', operateType: 'SYSTEM', pointType: 'PREMIUM'
    })
    assert.strictEqual(vm.pointsDetailTotal, 21)
    assert.strictEqual(vm.pointsDetailList[0].amount, '+ 0')
    assert.strictEqual(vm.normalizeCustomerPoint({ direction: 'SUB', pointAmt: 5 }).amount, '- 5')
    await vm.openMorePoints()
    assert.strictEqual(vm.morePointsTotal, 21)
    vm.moreDetailFilter.source = 'MANUAL'
    await vm.changeMorePage(2)
    assert.strictEqual(calls[calls.length - 1].args[0].operateType, 'SYSTEM')
    await vm.changeMoreSize(20)
    assert.strictEqual(vm.morePageNum, 1)
    assert.strictEqual(vm.validateAdjust({ adjustAmt: -1 }), false)
    assert.strictEqual(vm.validateAdjust({ adjustAmt: 1.234 }), false)
    assert.strictEqual(vm.validateAdjust({ adjustAmt: 1.23, oaNo: 'OA1', reasonCode: 'REASON01' }), true)
  })
  await check('客户详情：积分汇总/权益驼峰映射、权益轨迹不误用使用记录', async() => {
    const vm = model('point-manage-detail')
    handler = async() => ({ data: {
      pointSummary: { currentPoint: 200, manualPoint: 0 },
      benefitStatus: [{ benefitName: '测试权益', limitType: 'unlimited', usedCount: 0 }],
      benefitTraces: [{ id: 1, action: 'GRADE_CHANGE' }], usageRecords: [{ id: 9 }]
    } })
    await vm.fetchDetailData('1001')
    assert.strictEqual(vm.pointsSummary.currentPoint, 200)
    assert.strictEqual(vm.pointsSummary.manualPoint, 0)
    assert.strictEqual(vm.benefitsData[0].benefitName, '测试权益')
    assert.strictEqual(vm.benefitsData[0].limitType, 'unlimited')
    assert.strictEqual(vm.benefitTrackData[0].id, 1)
    assert.strictEqual(vm.benefitBalance({ beforeRemain: 0 }, true), 0)
    assert.strictEqual(vm.benefitBalance({ remainCount: 0 }, false), 0)
    assert.strictEqual(vm.benefitBalance({}, true), '—')
    assert.strictEqual(vm.benefitBalance({ remainCount: null }, false), '不限')
    assert.strictEqual(vm.formatBenefitAction('USE_DEDUCT'), '使用消减')
  })
  await check('实收钻取：40项字段、零值、详情参数、请求隔离及失败关闭', async() => {
    const vm = model('pay-detail-dialog')
    assert.strictEqual(vm.fields.length, 40)
    handler = async() => ({ data: { payNo: 'PAY1', sumActuPay: 0 } })
    await vm.open('PAY1')
    assert.strictEqual(calls[calls.length - 1].name, 'getPayDetailApi')
    assert.deepStrictEqual(calls[calls.length - 1].args, ['PAY1'])
    assert.strictEqual(vm.display('sumActuPay'), 0)
    assert.strictEqual(vm.display('policyTypeNo'), '—')
    const old = deferred(), latest = deferred()
    handler = () => old.promise
    const first = vm.open('PAY1')
    handler = () => latest.promise
    const second = vm.open('PAY2')
    latest.resolve({ data: { payNo: 'PAY2' } }); await second
    old.resolve({ data: { payNo: 'PAY1' } }); await first
    assert.strictEqual(vm.record.payNo, 'PAY2')
    handler = async() => ({ data: null })
    await vm.open('MISSING')
    assert.strictEqual(vm.visible, false)
  })
  await check('导出：仅使用已查询条件，JSON业务错误不下载为Excel', async() => {
    const errorBlob = { type: 'application/json', text: async() => '{"header":{"statusCode":"999999","message":"测试业务失败"}}' }
    await assert.rejects(() => exportUtils.assertExportBlob(errorBlob), /测试业务失败/)
    await exportUtils.assertExportBlob({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    for (const file of ['point-manage', 'point-guiji']) {
      const vm = model(file)
      vm.appliedQuery = file === 'point-manage' ? { custId: '1001' } : { custId: '1001', pageNum: 1, pageSize: 10 }
      handler = async() => errorBlob
      await vm.handleExport()
      assert.strictEqual(calls[calls.length - 1].args[0].custId, '1001')
      assert.strictEqual(calls[calls.length - 1].args[0].pageNum, undefined)
      assert.strictEqual(vm.exportLoading, false)
    }
  })
  await check('工作台：客户检索竞态、选择后保留候选、清空取消旧请求', async() => {
    const vm = model('point-apply')
    vm.customerSearchKey = '1'
    const old = deferred(), latest = deferred()
    handler = () => old.promise
    const first = vm.handleCustomerKeyword()
    vm.customerSearchKey = '6'
    handler = () => latest.promise
    const second = vm.handleCustomerKeyword()
    latest.resolve({ data: [{ custId: '1006', cust_name: '测试客户', id_type: 'PASSPORT' }] }); await second
    old.resolve({ data: [{ custId: '1001' }] }); await first
    assert.strictEqual(vm.customerCandidates[0].custId, '1006')
    assert.strictEqual(vm.customerCandidates[0].idType, 'PASSPORT')
    vm.selectCustomerResult(vm.customerCandidates[0])
    assert.strictEqual(vm.customerCandidates.length, 1)
    assert.strictEqual(vm.selectedCustomerId, '1006')
    const pending = deferred()
    handler = () => pending.promise
    const search = vm.handleCustomerKeyword()
    vm.resetCustomerSearch()
    pending.resolve({ data: [{ custId: '1001' }] }); await search
    assert.deepStrictEqual(vm.customerCandidates, [])
    assert.strictEqual(vm.customerLoading, false)
  })
  await check('积分附件：扩展名/大小校验，提交存储路径，同文件可重选', async() => {
    const vm = model('point-apply')
    const before = calls.length
    await vm.uploadAdjustFile({ name: 'test.exe', size: 1 }, vm.adjustForm)
    await vm.uploadAdjustFile({ name: 'test.pdf', size: 6 * 1024 * 1024 }, vm.adjustForm)
    assert.strictEqual(calls.length, before)
    const original = global.FormData
    global.FormData = class {
      append(key, file) { assert.strictEqual(key, 'file'); assert.strictEqual(file.name, 'test.pdf') }
    }
    try {
      handler = async() => ({ data: { fileName: 'test.pdf', filePath: 'group1/M00/test.pdf' } })
      const target = { files: [{ name: 'test.pdf', size: 100 }], value: 'test.pdf' }
      await vm.handleWorkspaceFileChange({ target })
      assert.strictEqual(vm.adjustForm.attachment, 'group1/M00/test.pdf')
      assert.strictEqual(target.value, '')
      assert.strictEqual(vm.attachmentUploading, false)
      assert.strictEqual(vm.buildAdjustPayload(vm.adjustForm, false).attachment, 'group1/M00/test.pdf')
    } finally {
      global.FormData = original
    }
  })
}
async function live() {
  const http = axios.create({ baseURL: process.env.MENU_AUDIT_API || 'http://localhost:7001/api', timeout: 20000 })
  async function get(path, params) {
    const response = await http.get(path, { params })
    assert.strictEqual(response.data.header.statusCode, '000000')
    return response.data.body.data
  }
  const groups = [
    ['/platform/point/cust/list', 'custId', 'custId'],
    ['/platform/point/adjust/page', 'custId', 'custId'],
    ['/platform/point/trace/page', 'custId', 'custId'],
    ['/platform/grade/trace/page', 'custId', 'custId'],
    ['/benefit/adjust/page', 'custId', 'custId'],
    ['/benefit/trace/page', 'custId', 'custId'],
    ['/switch/apply/page', 'idType', 'idType'],
    ['/switch/record/page', 'custId', 'custId']
  ]
  for (const [path, param, field] of groups) {
    await check(`真实列表、单字段筛选及不存在结果 ${path}`, async() => {
      const all = await get(path, { pageNum: 1, pageSize: 100 })
      assert.ok(Array.isArray(all.list) && all.list.length)
      const row = all.list.find(row => row[field])
      const value = row && row[field]
      assert.ok(value)
      const filtered = await get(path, { [param]: value, pageNum: 1, pageSize: 100 })
      assert.ok(filtered.list.length && filtered.list.every(row => row[field] === value))
      if (param === 'custId') {
        const empty = await get(path, { custId: '__AUDIT_NO_CUSTOMER__', pageNum: 1, pageSize: 10 })
        assert.strictEqual(empty.total, 0)
      }
      console.log(`  total=${all.total}, filtered=${filtered.total}`)
    })
  }
  for (const [path, params] of [
    ['/platform/point/cust/stats'], ['/platform/point/trace/summary'],
    ['/rule/v2/page'], ['/platform/grade/config/versions'], ['/platform/grade/config/current'],
    ['/platform/grade/config/bands', { versionId: 1 }], ['/platform/grade/trace/summary'],
    ['/platform/benefit/rule/versions'], ['/platform/benefit/rule/gradeList', { versionTag: 'V2_2027' }],
    ['/platform/benefit/rule/view', { versionTag: 'V2_2027', gradeCode: 'SANXING' }],
    ['/platform/benefit/rule/mod/list'], ['/platform/benefit/rule/mod/gradeOptions', { versionTag: 'V2_2027' }],
    ['/platform/benefit/items'], ['/benefit/trace/stats'], ['/switch/trial/task/page'],
    ['/switch/trial/item/page'], ['/switch/trial/risk/page'],
    ['/report/drill/customers', { dimension: 'GRADE', item: 'SANXING' }],
    ['/report/drill/policies', { custId: '1001' }],
    ['/profile/v2/search', { keyword: '1' }], ['/platform/point/adjust/current/1001'],
    ['/platform/point/cust/detail/1001'], ['/benefit/adjust/workbench/1001']
  ]) {
    await check(`真实只读契约 ${path}`, async() => {
      const data = await get(path, { pageNum: 1, pageSize: 10, ...params })
      assert.ok(data && typeof data === 'object')
    })
  }
}
(async() => {
  if (process.argv.includes('--live')) await live()
  else await components()
  console.log(`结果：${results.filter(item => item.pass).length}/${results.length} 通过`)
})().catch(error => { console.error(error); process.exitCode = 1 })
