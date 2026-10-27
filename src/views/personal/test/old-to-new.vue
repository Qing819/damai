<template>
  <div class="app-container old-to-new-page">
    <template v-if="currentView === 'list'">
      <div class="page-heading">
        <h1>老切新申请</h1>
        <p>收集老客户转新规则申请，支持单条录入与批量导入；设定切换生效日期后，到生效当天系统自动跑批重新计算，客户自生效日起看到新积分</p>
      </div>
      <div class="notice">
        <b>切换生效规则</b>
        <span>切换生效日期即客户看到新积分的日期，可选次日及以后；申请提交后无需人工切换，到生效当天系统自动跑批重新计算并生效。生效后规则类型锁定、不可逆。</span>
      </div>
      <el-card shadow="never" class="toolbar-card">
        <div class="toolbar">
          <el-button type="primary" icon="el-icon-plus" @click="openSingleAdd">单条申请</el-button>
          <el-button :loading="templateLoading" @click="handleDownloadTemplate">模板下载</el-button>
          <el-button :loading="importLoading" @click="$refs.importInput.click()">批量导入</el-button>
          <el-button :loading="exportLoading" @click="handleExport">申请数据导出</el-button>
          <el-button @click="openBatchEdit">批量修改生效日期</el-button>
          <el-button @click="openBatchRemove">批量移除</el-button>
          <span class="hint">切换生效日期可选次日及以后；到生效当天系统自动跑批重新计算</span>
        </div>
        <input ref="importInput" class="import-input" type="file" accept=".csv" aria-label="导入切换申请 CSV" :disabled="importLoading" @change="handleImportFile">
      </el-card>
      <el-card shadow="never" class="table-card">
        <div slot="header" class="card-title">切换申请列表</div>
        <el-form :inline="true" :model="queryForm" class="query-form" size="small" @submit.native.prevent="handleSearch">
          <el-form-item>
            <el-select v-model="queryForm.idType" aria-label="证件类型" placeholder="全部证件类型" clearable>
              <el-option label="全部证件类型" value="" />
              <el-option v-for="item in idTypeOptions" :key="item.code" :label="formatIdType(item.name)" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item class="certificate-filter">
            <el-input v-model.trim="queryForm.idNo" aria-label="证件号码" placeholder="证件号码" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.orgName" aria-label="服务归属机构" placeholder="全部服务归属机构" clearable>
              <el-option label="全部服务归属机构" value="" />
              <el-option v-for="item in orgOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model.trim="queryForm.applicant" aria-label="申请人" placeholder="申请人" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.status" aria-label="切换状态" placeholder="全部切换状态" clearable>
              <el-option label="全部切换状态" value="" />
              <el-option label="待生效" value="PENDING" />
              <el-option label="已生效" value="SWITCHED" />
            </el-select>
          </el-form-item>
          <span class="filter-label">申请时间</span>
          <el-form-item>
            <el-date-picker v-model="queryForm.applyDateFrom" aria-label="申请开始日期" type="date" placeholder="开始日期" value-format="yyyy-MM-dd" />
          </el-form-item>
          <span class="hint">~</span>
          <el-form-item>
            <el-date-picker v-model="queryForm.applyDateTo" aria-label="申请结束日期" type="date" placeholder="结束日期" value-format="yyyy-MM-dd" />
          </el-form-item>
          <span class="filter-label">切换生效日期</span>
          <el-form-item>
            <el-date-picker v-model="queryForm.effectDateFrom" aria-label="生效开始日期" type="date" placeholder="开始日期" value-format="yyyy-MM-dd" />
          </el-form-item>
          <span class="hint">~</span>
          <el-form-item>
            <el-date-picker v-model="queryForm.effectDateTo" aria-label="生效结束日期" type="date" placeholder="结束日期" value-format="yyyy-MM-dd" />
          </el-form-item>
          <el-form-item class="query-actions">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table ref="applyTable" v-loading="loading" :data="tableData" stripe size="mini" row-key="id" @selection-change="selectedRows = $event">
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column prop="applyNo" label="申请单号" min-width="165" align="center" />
          <el-table-column label="客户" min-width="180" align="center" show-overflow-tooltip>
            <template slot-scope="{ row }">{{ maskName(row.custName) }}（{{ value(row.custId) }}）</template>
          </el-table-column>
          <el-table-column label="证件类型" min-width="110" align="center">
            <template slot-scope="{ row }">{{ formatIdType(row.idType) }}</template>
          </el-table-column>
          <el-table-column prop="idNo" label="证件号" min-width="160" align="center" show-overflow-tooltip />
          <el-table-column prop="orgName" label="服务归属机构" min-width="130" align="center" show-overflow-tooltip />
          <el-table-column label="申请人" min-width="90" align="center">
            <template slot-scope="{ row }">{{ value(row.operator) }}</template>
          </el-table-column>
          <el-table-column label="申请时间" min-width="160" align="center">
            <template slot-scope="{ row }">{{ formatTime(row.applyTime) }}</template>
          </el-table-column>
          <el-table-column prop="effectiveDate" label="切换生效日期" min-width="120" align="center" />
          <el-table-column label="切换状态" min-width="90" align="center">
            <template slot-scope="{ row }"><span class="status-tag" :class="statusClass(row.status)">{{ formatStatus(row.status) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template slot-scope="{ row }">
              <el-button v-if="row.status === 'SWITCHED'" type="text" size="mini" @click="goTrackDetail(row)">查看轨迹</el-button>
              <el-button v-else type="text" size="mini" @click="goDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-footer">
          <el-pagination background layout="total, prev, pager, next, sizes, jumper" :total="total" :page-size="pageSize" :current-page="currentPage" :page-sizes="[10, 20, 50]" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
          <span class="hint">到期系统自动跑批重新计算，客户自生效日起看到新积分；生效后规则类型锁定、不可逆</span>
        </div>
      </el-card>
    </template>

    <div v-else v-loading="detailLoading">
      <div class="page-heading">
        <h1>切换申请详情</h1>
        <p>查看切换申请完整信息与切换生效信息（按切换状态区分展示口径）</p>
      </div>
      <el-card v-for="section in detailSections" :key="section.title" shadow="never" class="detail-card">
        <div slot="header" class="card-title">{{ section.title }}<span v-if="section.title === '客户信息'" class="hint">敏感信息脱敏展示</span></div>
        <div class="info-grid">
          <div v-for="field in section.fields" :key="field.label" class="info-item"><span class="info-label">{{ field.label }}</span><span class="info-value">{{ value(field.value) }}</span></div>
        </div>
      </el-card>
      <el-card shadow="never" class="detail-card">
        <div slot="header" class="card-title">切换生效信息</div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">切换状态</span><span class="status-tag" :class="statusClass(detailData.status)">{{ formatStatus(detailData.status) }}</span></div>
          <div class="info-item"><span class="info-label">切换生效日期</span><span class="info-value">{{ value(detailData.effectiveDate) }}</span></div>
          <div v-if="detailData.status === 'SWITCHED'" class="info-item"><span class="info-label">跑批生效时间</span><span class="info-value">{{ formatTime(detailData.executeTime) }}</span></div>
          <div v-if="detailData.status === 'REMOVED'" class="info-item"><span class="info-label">移除时间</span><span class="info-value">{{ formatTime(detailData.removeTime) }}</span></div>
        </div>
        <div class="section-title">切换数据对比</div>
        <div class="comparison">
          <div>
            <div class="info-label">{{ detailData.status === 'PENDING' ? '当前（老规则）' : '切换前（老规则）' }}</div>
            <div class="comparison-value">等级：{{ oldGrade }}&emsp;积分：{{ formatNumber(snapshot.prePoint) }}</div>
          </div>
          <span class="comparison-arrow">→</span>
          <div v-if="detailData.status === 'PENDING'" class="pending-comparison">
            <div class="info-label">新规则 · 待核算</div>
            <div>到 {{ value(detailData.effectiveDate) }} 生效日期当天，系统自动跑批核算后展示</div>
          </div>
          <div v-else-if="detailData.status === 'SWITCHED'">
            <div class="info-label">切换后（新规则）</div>
            <div class="comparison-value green">等级：{{ newGrade }}&emsp;积分：{{ formatNumber(snapshot.postPoint) }}</div>
          </div>
          <div v-else class="pending-comparison">申请已移除，原切换计划已取消</div>
        </div>
        <template v-if="detailData.status === 'PENDING'">
          <div class="notice"><b>待生效说明</b><span>切换生效前新系统积分等级尚未核算，无法展示实际对比，可前往「积分等级试算」预估新规则下的积分与等级。</span><el-button size="small" @click="$router.push('/personal/pointCalculated')">前往积分等级试算</el-button></div>
          <div class="notice"><b>自动生效说明</b><span>无需人工切换；到切换生效日期当天，系统自动跑批重新计算，客户自生效日起看到新积分。</span></div>
        </template>
        <div v-else-if="detailData.status === 'SWITCHED'" class="notice"><b>数据口径说明</b><span>切换后积分为该次跑批的核算结果，不随客户后续业绩与业务状态变动而更新；如需查看客户当前积分与等级，请前往「客户积分管理」查询。</span><el-button size="small" @click="goTrackDetail(detailData)">查看切换轨迹</el-button></div>
        <div class="notice orange"><b>不可逆提醒</b><span>客户完成新规则切换后，系统锁定规则类型，禁止再次切换回老规则（后台支持特殊情况处理）。</span></div>
      </el-card>
      <el-card shadow="never" class="detail-card">
        <div class="detail-footer"><el-button @click="closeDetail">关闭</el-button><span class="hint">到期系统自动跑批重新计算，无需人工切换；生效后规则类型锁定，不可逆</span></div>
      </el-card>
    </div>

    <el-dialog title="新增切换申请" :visible.sync="addDialogVisible" width="520px" custom-class="switch-dialog" :close-on-click-modal="false" :close-on-press-escape="!addLoading" :show-close="!addLoading">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="122px" label-position="left" class="dialog-form">
        <el-form-item label="客户姓名" prop="custName"><el-input v-model.trim="addForm.custName" placeholder="请输入客户姓名" /></el-form-item>
        <el-form-item label="证件类型" prop="idType">
          <el-select v-model="addForm.idType" placeholder="请选择证件类型"><el-option v-for="item in idTypeOptions" :key="item.code" :label="formatIdType(item.name)" :value="item.code" /></el-select>
        </el-form-item>
        <el-form-item label="证件号" prop="idNo" class="certificate-field"><el-input v-model.trim="addForm.idNo" placeholder="请输入证件号" /></el-form-item>
        <el-form-item label="服务归属机构" prop="orgName">
          <el-select v-model="addForm.orgName" placeholder="请选择服务归属机构" clearable><el-option v-for="item in orgOptions" :key="item" :label="item" :value="item" /></el-select>
        </el-form-item>
        <el-form-item label="切换生效日期" prop="effectiveDate">
          <el-date-picker v-model="addForm.effectiveDate" type="date" placeholder="选择生效日期" value-format="yyyy-MM-dd" :picker-options="pickerOptions" />
        </el-form-item>
        <div class="hint">客户看到新积分的日期，可选次日及以后；到期系统自动跑批重新计算</div>
      </el-form>
      <div class="notice"><b>提示</b><span>提交后无需人工切换；到切换生效日期当天系统自动跑批重新计算，客户自生效日起看到新积分。生效后规则类型锁定、不可逆。</span></div>
      <span slot="footer"><el-button :disabled="addLoading" @click="addDialogVisible = false">取消</el-button><el-button type="primary" :loading="addLoading" @click="submitSingleAdd">提交申请</el-button></span>
    </el-dialog>

    <el-dialog title="批量修改切换生效日期" :visible.sync="batchEditVisible" width="520px" custom-class="switch-dialog" :close-on-click-modal="false" :close-on-press-escape="!batchLoading" :show-close="!batchLoading">
      <el-form label-width="122px" label-position="left" class="dialog-form">
        <el-form-item label="切换生效日期" required><el-date-picker v-model="batchEffectiveDate" type="date" placeholder="选择生效日期" value-format="yyyy-MM-dd" :picker-options="pickerOptions" /></el-form-item>
      </el-form>
      <div class="hint">只能选择次日及以后的日期</div>
      <p class="hint">已选择 {{ batchSelectionCount }} 条申请，其中 {{ batchRows.length }} 条待生效</p>
      <div class="notice"><b>说明</b><span>批量修改仅调整「切换生效日期」，到期由系统自动跑批重新计算，客户自生效日起看到新积分；已生效的申请不会被修改。</span></div>
      <span slot="footer"><el-button :disabled="batchLoading" @click="batchEditVisible = false">取消</el-button><el-button type="primary" :loading="batchLoading" @click="submitBatchEdit">确认修改</el-button></span>
    </el-dialog>

    <el-dialog title="确认移除切换申请" :visible.sync="batchRemoveVisible" width="460px" custom-class="switch-dialog" :close-on-click-modal="false" :close-on-press-escape="!batchLoading" :show-close="!batchLoading">
      <div class="hint">已选择 {{ batchSelectionCount }} 条申请，其中 {{ batchRows.length }} 条待生效</div>
      <div class="notice red-notice"><b>提示</b><span>移除后该申请的切换计划将被取消，客户不会按原定日期切换到新规则；如需恢复需重新提交申请。已生效的申请不可移除。</span></div>
      <span slot="footer"><el-button :disabled="batchLoading" @click="batchRemoveVisible = false">取消</el-button><el-button class="remove-button" :loading="batchLoading" @click="submitBatchRemove">确认移除</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
import {
  switchApplyApi, importCsvApi, exportSwitchApplyApi, switchApplyExportApi, preUpdateEffectApi,
  switchApplyBatchRemoveApi, getSwitchApplyPageApi, switchApplyDetailApi, getSwitchIdTypesApi, getPlatformOrgApi
} from '@/api/test'
import { getCustPointDetailApi } from '@/api/test/point'
import { formatIdType, formatTime } from './benefit-adjust-model'

const newQuery = () => ({ idType: '', idNo: '', orgName: '', applicant: '', status: '', applyDateFrom: '', applyDateTo: '', effectDateFrom: '', effectDateTo: '' })
function tomorrow() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const newApplication = () => ({ custName: '', idType: 'IDCARD', idNo: '', orgName: '', effectiveDate: tomorrow() })

export default {
  name: 'OldToNewApply',
  data() {
    return {
      currentView: 'list', loading: false, listRequestId: 0, detailRequestId: 0,
      queryForm: newQuery(), appliedQuery: newQuery(), tableData: [], total: 0, currentPage: 1, pageSize: 10,
      selectedRows: [], idTypeOptions: [], orgOptions: [],
      templateLoading: false, exportLoading: false, importLoading: false,
      addDialogVisible: false, addLoading: false, addForm: newApplication(),
      addRules: {
        custName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
        idType: [{ required: true, message: '请选择证件类型', trigger: 'change' }],
        idNo: [{ required: true, message: '请输入证件号', trigger: 'blur' }],
        effectiveDate: [{ required: true, message: '请选择切换生效日期', trigger: 'change' }]
      },
      pickerOptions: { disabledDate(date) {
        const min = new Date()
        min.setDate(min.getDate() + 1)
        min.setHours(0, 0, 0, 0)
        return date.getTime() < min.getTime()
      } },
      batchEditVisible: false, batchRemoveVisible: false, batchLoading: false,
      batchRows: [], batchSelectionCount: 0, batchEffectiveDate: '',
      detailLoading: false, detailData: {}, customerInfo: {}
    }
  },
  computed: {
    snapshot() { return this.detailData.snapshot || {} },
    oldGrade() { return this.formatGrade(this.snapshot.preGrade) },
    newGrade() { return this.formatGrade(this.snapshot.postGrade) },
    detailSections() {
      const row = this.detailData
      const customer = this.customerInfo
      return [
        { title: '申请信息', fields: [
          { label: '申请单号', value: row.applyNo }, { label: '申请人', value: row.operator },
          { label: '申请时间', value: formatTime(row.applyTime) }
        ] },
        { title: '客户信息', fields: [
          { label: '客户号', value: row.custId }, { label: '核心客户号', value: customer.coreCustId },
          { label: '客户姓名', value: this.maskName(row.custName) }, { label: '证件类型', value: formatIdType(row.idType) },
          { label: '证件号码', value: row.idNo }, { label: '手机号码', value: customer.mobile },
          { label: '所属渠道', value: customer.channel }, { label: '服务归属机构', value: row.orgName },
          { label: '二级机构', value: customer.org2Name }, { label: '三级机构', value: customer.org3Name },
          { label: '代理人', value: customer.agentName }
        ] }
      ]
    }
  },
  created() {
    this.fetchOptions()
    this.fetchPageData()
  },
  beforeDestroy() {
    this.listRequestId++
    this.detailRequestId++
  },
  methods: {
    formatIdType,
    formatTime,
    value(data) { return data == null || data === '' ? '-' : data },
    maskName(name) { return name ? `${String(name).slice(0, 1)}${'*'.repeat(Math.max(String(name).length - 1, 1))}` : '-' },
    formatNumber(data) { return data == null || data === '' ? '-' : Number(data).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) },
    formatGrade(data) { return { YIXING: '一星', ERXING: '二星', SANXING: '三星', SIXING: '四星', WUXING: '五星', PUXING: '普星', ZHUOYUE: '卓越', ZUNYAO: '尊耀' }[data] || this.value(data) },
    formatStatus(data) { return { PENDING: '待生效', SWITCHED: '已生效', REMOVED: '已移除' }[data] || this.value(data) },
    statusClass(data) { return { PENDING: 'tag-orange', SWITCHED: 'tag-green' }[data] || 'tag-gray' },
    async fetchOptions() {
      const results = await Promise.allSettled([getSwitchIdTypesApi(), getPlatformOrgApi()])
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value.data)) this[['idTypeOptions', 'orgOptions'][index]] = result.value.data
      })
      if (results.some(result => result.status === 'rejected')) this.$message.error('部分下拉选项加载失败，请刷新重试')
    },
    queryParams(paginated = true) {
      const params = { ...this.appliedQuery }
      delete params.applicant
      Object.keys(params).forEach(key => { if (params[key] == null || params[key] === '') delete params[key] })
      return paginated ? { ...params, pageNum: this.currentPage, pageSize: this.pageSize } : params
    },
    async fetchPageData() {
      const requestId = ++this.listRequestId
      this.loading = true
      this.selectedRows = []
      if (this.$refs.applyTable) this.$refs.applyTable.clearSelection()
      try {
        const res = await getSwitchApplyPageApi(this.queryParams())
        if (requestId !== this.listRequestId) return
        this.tableData = res.data.list || []
        this.total = res.data.total || 0
        if (this.currentPage > 1 && !this.tableData.length && this.total > 0) {
          this.currentPage = Math.ceil(this.total / this.pageSize)
          return this.fetchPageData()
        }
      } catch (error) {
        if (requestId !== this.listRequestId) return
        this.tableData = []
        this.total = 0
        this.$message.error('获取切换申请列表失败，请重试')
      } finally {
        if (requestId === this.listRequestId) this.loading = false
      }
    },
    handleSearch() {
      // 当前接口不识别 applicant/operator；不能把未筛选的结果当成查询成功。
      if (this.queryForm.applicant) {
        this.$message.warning('当前后端接口暂不支持申请人筛选，请清空申请人后查询')
        return
      }
      for (const prefix of ['applyDate', 'effectDate']) {
        if (this.queryForm[`${prefix}From`] && this.queryForm[`${prefix}To`] && this.queryForm[`${prefix}From`] > this.queryForm[`${prefix}To`]) {
          this.$message.warning(`${prefix === 'applyDate' ? '申请' : '生效'}开始日期不能晚于结束日期`)
          return
        }
      }
      this.appliedQuery = { ...this.queryForm }
      this.currentPage = 1
      return this.fetchPageData()
    },
    handleReset() { this.queryForm = newQuery(); return this.handleSearch() },
    handleSizeChange(size) { this.pageSize = size; this.currentPage = 1; return this.fetchPageData() },
    handleCurrentChange(page) { this.currentPage = page; return this.fetchPageData() },
    validateEffectiveDate(date) {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < tomorrow()) {
        this.$message.warning('切换生效日期须为次日及以后')
        return false
      }
      const parsed = new Date(`${date}T00:00:00`)
      if (Number.isNaN(parsed.getTime()) || parsed.getMonth() + 1 !== Number(date.slice(5, 7)) || parsed.getDate() !== Number(date.slice(8))) {
        this.$message.warning('请选择有效的切换生效日期')
        return false
      }
      return true
    },
    openSingleAdd() {
      this.addForm = newApplication()
      this.addDialogVisible = true
      this.$nextTick(() => { if (this.$refs.addFormRef) this.$refs.addFormRef.clearValidate() })
    },
    async submitSingleAdd() {
      if (this.addLoading) return
      const valid = await this.$refs.addFormRef.validate().catch(() => false)
      if (!valid || this.addLoading || !this.validateEffectiveDate(this.addForm.effectiveDate)) return
      this.addLoading = true
      try {
        await switchApplyApi({ ...this.addForm })
        this.$message.success('新增切换申请成功')
        this.addDialogVisible = false
        await this.fetchPageData()
      } catch (error) {
        this.$message.error('新增切换申请失败，请核对客户信息后重试')
      } finally {
        this.addLoading = false
      }
    },
    async handleImportFile(event) {
      if (this.importLoading) return
      const input = event.target
      const file = input.files && input.files[0]
      if (!file) return
      if (!/\.csv$/i.test(file.name)) {
        input.value = ''
        this.$message.warning('请选择 CSV 格式文件')
        return
      }
      this.importLoading = true
      try {
        const res = await importCsvApi(file)
        const data = res.data || {}
        const success = data.inserted == null ? data.success || 0 : data.inserted
        const fail = data.skippedInvalid == null ? data.fail || 0 : data.skippedInvalid
        const duplicate = data.skippedDup || 0
        const text = `共 ${data.total || 0} 条，成功 ${success} 条，失败 ${fail} 条${duplicate ? `，重复跳过 ${duplicate} 条` : ''}`
        this.$message[fail || duplicate ? 'warning' : 'success'](`导入完成：${text}`)
        this.currentPage = 1
        await this.fetchPageData()
      } catch (error) {
        this.$message.error('导入失败，请检查模板格式与客户信息后重试')
      } finally {
        this.importLoading = false
        input.value = ''
      }
    },
    async downloadBlob(blob, filename) {
      if (blob.type && blob.type.includes('json')) {
        const data = JSON.parse(await blob.text())
        throw new Error((data.header || {}).message || data.message || '下载失败')
      }
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)
    },
    async handleDownloadTemplate() {
      if (this.templateLoading) return
      this.templateLoading = true
      try { await this.downloadBlob(await exportSwitchApplyApi(), '老切新申请导入模板.csv') } catch (error) {
        this.$message.error(error.message || '下载模板失败')
      } finally { this.templateLoading = false }
    },
    async handleExport() {
      if (this.exportLoading) return
      this.exportLoading = true
      try { await this.downloadBlob(await switchApplyExportApi(this.queryParams(false)), '切换申请数据.csv') } catch (error) {
        this.$message.error(error.message || '申请数据导出失败')
      } finally { this.exportLoading = false }
    },
    prepareBatch() {
      this.batchRows = this.selectedRows.filter(row => row.status === 'PENDING')
      this.batchSelectionCount = this.selectedRows.length
      if (!this.batchRows.length) {
        this.$message.warning('请至少勾选一条待生效申请')
        return false
      }
      if (this.batchRows.some(row => !Number.isInteger(row.id) || row.id <= 0)) {
        this.$message.error('申请记录缺少有效主键，请刷新后重试')
        return false
      }
      return true
    },
    openBatchEdit() {
      if (!this.prepareBatch()) return
      this.batchEffectiveDate = tomorrow()
      this.batchEditVisible = true
    },
    openBatchRemove() {
      if (this.prepareBatch()) this.batchRemoveVisible = true
    },
    async submitBatchEdit() {
      if (this.batchLoading || !this.validateEffectiveDate(this.batchEffectiveDate)) return
      return this.submitBatch('edit')
    },
    async submitBatchRemove() {
      if (this.batchLoading) return
      return this.submitBatch('remove')
    },
    async submitBatch(action) {
      if (!this.batchRows.length) return
      this.batchLoading = true
      const ids = this.batchRows.map(row => row.id)
      try {
        const res = action === 'edit'
          ? await preUpdateEffectApi({ ids, effectiveDate: this.batchEffectiveDate })
          : await switchApplyBatchRemoveApi({ ids })
        const affected = res.data || 0
        this.$message[affected < ids.length ? 'warning' : 'success'](`已${action === 'edit' ? '修改' : '移除'} ${affected} 条申请`)
        this.batchEditVisible = false
        this.batchRemoveVisible = false
        this.batchRows = []
        await this.fetchPageData()
      } catch (error) {
        this.$message.error(`批量${action === 'edit' ? '修改' : '移除'}失败，请刷新申请状态后重试`)
      } finally { this.batchLoading = false }
    },
    async goDetail(row) {
      const requestId = ++this.detailRequestId
      this.currentView = 'detail'
      this.detailLoading = true
      this.detailData = {}
      this.customerInfo = {}
      try {
        const res = await switchApplyDetailApi(row.applyNo)
        if (requestId !== this.detailRequestId) return
        const data = res.data.apply || res.data
        if (!data || !data.applyNo) throw new Error('申请不存在')
        this.detailData = { ...row, ...data, snapshot: res.data.snapshot || data.snapshot }
        if (data.custId) {
          try {
            const customer = await getCustPointDetailApi(data.custId)
            if (requestId === this.detailRequestId) this.customerInfo = customer.data.custBaseInfo || {}
          } catch (error) {
            if (requestId === this.detailRequestId) this.$message.warning('客户补充信息加载失败，已保留申请原始信息')
          }
        }
      } catch (error) {
        if (requestId !== this.detailRequestId) return
        this.currentView = 'list'
        this.$message.error('获取切换申请详情失败，请重试')
      } finally {
        if (requestId === this.detailRequestId) this.detailLoading = false
      }
    },
    closeDetail() {
      this.detailRequestId++
      this.detailLoading = false
      this.currentView = 'list'
    },
    goTrackDetail(row) {
      this.$router.push({ path: '/personal/guiJiTab', query: { applyNo: row.applyNo, from: 'switchApply' } })
    }
  }
}
</script>

<style scoped>
.old-to-new-page { padding: 16px; min-height: calc(100vh - 84px); background: #f5f7fa; color: #333a45; }
.page-heading { margin: 2px 0 16px; }
.page-heading h1 { margin: 0 0 8px; font-size: 21px; line-height: 1.3; font-weight: 700; }
.page-heading p { margin: 0; color: #5a6472; font-size: 13px; }
.notice { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin: 14px 0; padding: 13px 20px; border: 1px solid #c5d5f0; border-radius: 4px; background: #ebf1fa; color: #333a45; font-size: 13px; line-height: 1.6; }
.notice b { color: #2f5496; flex-shrink: 0; }
.notice > span { flex: 1; min-width: 160px; }
.notice.orange { border-color: #f2c791; background: #fdf3e7; }
.notice.orange b { color: #e67e22; }
.notice.red-notice { border-color: #f5c6c0; background: #fdecea; }
.notice.red-notice b { color: #c62828; }
.toolbar-card, .table-card, .detail-card { border: 1px solid #e0e4ea; border-radius: 4px; margin-bottom: 16px; }
.toolbar-card ::v-deep .el-card__body, .table-card ::v-deep .el-card__body, .detail-card ::v-deep .el-card__body { padding: 16px 18px; }
.table-card ::v-deep .el-card__header, .detail-card ::v-deep .el-card__header { padding: 13px 18px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.toolbar ::v-deep .el-button + .el-button { margin-left: 10px; }
.toolbar ::v-deep .el-button, .detail-footer ::v-deep .el-button { height: 36px; padding: 0 16px; font-size: 14px; font-weight: 400; }
.import-input { display: none; }
.hint, .filter-label { font-size: 13px; color: #5a6472; line-height: 1.5; }
.card-title { font-size: 15px; font-weight: 600; }
.card-title .hint { margin-left: 8px; font-weight: 400; }
.query-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
.query-form ::v-deep .el-form-item { margin: 0; }
.query-form ::v-deep .el-form-item__content { display: flex; align-items: center; line-height: normal; }
.query-form ::v-deep .el-input, .query-form ::v-deep .el-select { width: 140px; }
.query-form .certificate-filter ::v-deep .el-input { width: 160px; }
.query-form ::v-deep .el-input__inner, .dialog-form ::v-deep .el-input__inner { height: 40px; line-height: 40px; padding: 0 10px; color: #333a45; border-color: #c9cfd8; border-radius: 4px; font-family: inherit; font-size: 14px; }
.query-form ::v-deep .el-input__icon, .dialog-form ::v-deep .el-input__icon { line-height: 40px; }
.query-form ::v-deep .el-date-editor .el-input__inner, .dialog-form ::v-deep .el-date-editor .el-input__inner { padding-left: 30px; padding-right: 23px; }
.query-form ::v-deep .el-button { width: 62px; height: 36px; padding: 0 16px; font-size: 14px; font-weight: 400; line-height: normal; }
.query-actions ::v-deep .el-form-item__content { gap: 12px; }
.query-actions ::v-deep .el-button + .el-button { margin-left: 0; }
.status-tag { display: inline-block; padding: 2px 12px; border-radius: 10px; font-size: 12px; line-height: normal; white-space: nowrap; }
.tag-orange { color: #e67e22; background: #fdf3e7; }
.tag-green { color: #2e7d32; background: #e8f5e9; }
.tag-gray { color: #5a6472; background: #eef0f2; }
.table-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
.info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 24px; }
.info-item { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.info-label { flex-shrink: 0; color: #5a6472; font-size: 13px; }
.info-value { color: #333a45; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.section-title { margin: 28px 0 8px; padding-left: 9px; border-left: 3px solid #4472c4; font-size: 14px; line-height: 20px; font-weight: 600; color: #2f5496; }
.comparison { display: flex; align-items: center; flex-wrap: wrap; gap: 28px; margin: 14px 0; padding: 14px 20px; background: #ebf1fa; border-radius: 4px; }
.comparison-value { margin-top: 4px; font-size: 18px; font-weight: 700; }
.comparison-arrow { color: #4f6fae; font-size: 18px; font-weight: 700; }
.pending-comparison { max-width: 500px; font-size: 14px; line-height: 1.6; color: #5a6472; }
.green { color: #2e7d32; }
.detail-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
::v-deep .switch-dialog { max-width: calc(100vw - 32px); border-radius: 8px; }
::v-deep .switch-dialog .el-dialog__body { height: auto; max-height: calc(100vh - 240px); padding: 18px; overflow-y: auto; font-size: 14px; color: #333a45; }
::v-deep .switch-dialog .el-dialog__footer .el-button { height: 36px; padding: 0 16px; font-size: 14px; font-weight: 400; }
.dialog-form ::v-deep .el-form-item { margin-bottom: 16px; }
.dialog-form ::v-deep .el-form-item__label { padding-right: 12px; font-size: 14px; line-height: 40px; color: #5a6472; }
.dialog-form ::v-deep .el-input, .dialog-form ::v-deep .el-select { width: 200px; }
.dialog-form .certificate-field ::v-deep .el-input { width: 240px; }
.remove-button { border-color: #c62828; color: #c62828; background: #fff; }
@media (max-width: 800px) { .info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 550px) {
  .info-grid { grid-template-columns: 1fr; }
  .dialog-form ::v-deep .el-input, .dialog-form ::v-deep .el-select, .dialog-form .certificate-field ::v-deep .el-input { width: 100%; }
}
</style>
