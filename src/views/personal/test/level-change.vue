<template>
  <div class="app-container level-trace-page">
    <div class="page-heading">
      <h1>等级变化轨迹</h1>
      <p>查询客户等级升降级、失效等变动记录，等级评定全过程可追溯</p>
    </div>

    <el-card shadow="never" class="filter-container">
      <el-form :inline="true" :model="queryForm" size="small" class="trace-query-form" @submit.native.prevent="handleQuery">
        <el-form-item>
          <el-input v-model.trim="queryForm.custId" aria-label="客户号" placeholder="客户号" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-input v-model.trim="queryForm.custName" aria-label="客户姓名" placeholder="客户姓名" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.idType" aria-label="证件类型" placeholder="全部证件类型" clearable>
            <el-option label="全部证件类型" value="" />
            <el-option v-for="item in idTypeOptions" :key="item" :label="formatIdType(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item class="certificate-filter">
          <el-input v-model.trim="queryForm.idNo" aria-label="证件号码" placeholder="证件号码" clearable @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.orgName" aria-label="服务归属机构" placeholder="全部服务归属机构" clearable>
            <el-option label="全部服务归属机构" value="" />
            <el-option v-for="item in orgOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.channel" aria-label="业务渠道" placeholder="全部业务渠道" clearable>
            <el-option label="全部业务渠道" value="" />
            <el-option v-for="item in channelOptions" :key="item" :label="formatChannel(item)" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.changeType" aria-label="变化类型" placeholder="全部变化类型" clearable>
            <el-option label="全部变化类型" value="" />
            <el-option label="升级" value="UPGRADE" />
            <el-option label="降级" value="DOWNGRADE" />
            <el-option label="失效" value="INVALID" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="queryForm.dateFrom" aria-label="变化开始日期" type="date" placeholder="开始日期" value-format="yyyy-MM-dd" />
        </el-form-item>
        <span class="date-separator">~</span>
        <el-form-item>
          <el-date-picker v-model="queryForm.dateTo" aria-label="变化结束日期" type="date" placeholder="结束日期" value-format="yyyy-MM-dd" />
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" class="query-button" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button :loading="exportLoading" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-loading="summaryLoading" class="summary-container">
      <div class="summary-box">
        <div class="summary-label">本期升级</div>
        <div class="summary-value green">+ {{ formatPoint(summaryData.upgradeCount) }}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">本期降级</div>
        <div class="summary-value orange">- {{ formatPoint(summaryData.downgradeCount) }}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">本期失效</div>
        <div class="summary-value red">{{ formatPoint(summaryData.invalidCount) }}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">变化总数</div>
        <div class="summary-value">{{ formatPoint(summaryData.totalCount) }}</div>
      </div>
    </div>

    <el-card shadow="never" class="table-container">
      <div slot="header" class="table-header-title">等级变化明细</div>
      <el-table v-loading="tableLoading" :data="tableData" stripe size="mini" style="width: 100%;">
        <el-table-column prop="traceNo" label="变化记录号" min-width="155" align="center" show-overflow-tooltip />
        <el-table-column label="客户" min-width="190" align="center" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ formatCustomer(row) }}</template>
        </el-table-column>
        <el-table-column label="证件类型" min-width="110" align="center" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ formatIdType(row.idType) }}</template>
        </el-table-column>
        <el-table-column prop="idNo" label="证件号码" min-width="170" align="center" show-overflow-tooltip />
        <el-table-column prop="orgName" label="服务归属机构" min-width="130" align="center" show-overflow-tooltip />
        <el-table-column label="业务渠道" min-width="130" align="center" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ formatChannel(row.channel) }}</template>
        </el-table-column>
        <el-table-column label="变化类型" min-width="100" align="center">
          <template slot-scope="{ row }">
            <span class="trace-badge" :class="getChangeClass(row.changeType)">{{ formatChangeType(row.changeType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变化前等级" min-width="130" align="center">
          <template slot-scope="{ row }">
            <span class="trace-badge" :class="getGradeClass(row.gradeBefore)">{{ formatGradeCode(row.gradeBefore) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变化后等级" min-width="130" align="center">
          <template slot-scope="{ row }">
            <span class="trace-badge" :class="getGradeClass(row.gradeAfter)">{{ formatGradeCode(row.gradeAfter) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变化时积分" min-width="110" align="center">
          <template slot-scope="{ row }">{{ formatPoint(row.changePoint) }}</template>
        </el-table-column>
        <el-table-column label="变化原因" min-width="190" align="center" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ formatReason(row.changeReason) }}</template>
        </el-table-column>
        <el-table-column prop="changeTime" label="变化时间" min-width="165" align="center" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="handleDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          :current-page="pagination.pageNo"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
        <span class="table-hint">每条变化记录可查看详情与等级变动说明</span>
      </div>
    </el-card>

    <el-dialog
      title="等级变化详情"
      :visible.sync="dialogVisible"
      width="660px"
      append-to-body
      custom-class="detail-dialog level-trace-dialog"
    >
      <div v-loading="detailLoading" class="trace-detail-body">
        <template v-if="currentDetail">
          <div class="section-title">基本信息</div>
          <div class="detail-info-grid">
            <div class="info-item"><span class="info-label">变化记录号</span><span class="info-value">{{ currentDetail.traceNo || '-' }}</span></div>
            <div class="info-item"><span class="info-label">客户</span><span class="info-value">{{ formatCustomer(currentDetail) }}</span></div>
            <div class="info-item"><span class="info-label">证件类型</span><span class="info-value">{{ formatIdType(currentDetail.idType) }}</span></div>
            <div class="info-item"><span class="info-label">证件号码</span><span class="info-value">{{ currentDetail.idNo || '-' }}</span></div>
            <div class="info-item"><span class="info-label">服务归属机构</span><span class="info-value">{{ currentDetail.orgName || '-' }}</span></div>
            <div class="info-item"><span class="info-label">业务渠道</span><span class="info-value">{{ formatChannel(currentDetail.channel) }}</span></div>
            <div class="info-item"><span class="info-label">变化类型</span><span class="info-value"><span class="trace-badge" :class="getChangeClass(currentDetail.changeType)">{{ formatChangeType(currentDetail.changeType) }}</span></span></div>
            <div class="info-item"><span class="info-label">变化时积分</span><span class="info-value">{{ formatPoint(currentDetail.changePoint) }}</span></div>
            <div class="info-item"><span class="info-label">变化原因</span><span class="info-value">{{ formatReason(currentDetail.changeReason) }}</span></div>
            <div class="info-item"><span class="info-label">变化时间</span><span class="info-value">{{ currentDetail.changeTime || '-' }}</span></div>
            <div class="info-item"><span class="info-label">操作人</span><span class="info-value">{{ currentDetail.operator === 'SYSTEM' ? '系统' : currentDetail.operator || '-' }}</span></div>
            <div class="info-item"><span class="info-label">等级生效日期</span><span class="info-value">{{ currentDetail.effectiveDate || '-' }}</span></div>
          </div>
          <div class="section-title">等级变化</div>
          <div class="grade-change-box">
            <div class="grade-change-item"><span class="grade-label">变化前等级</span><span class="grade-value"><span class="trace-badge" :class="getGradeClass(currentDetail.gradeBefore)">{{ formatGradeCode(currentDetail.gradeBefore) }}</span></span></div>
            <span class="grade-arrow">→</span>
            <div class="grade-change-item"><span class="grade-label">变化后等级</span><span class="grade-value"><span class="trace-badge" :class="getGradeClass(currentDetail.gradeAfter)">{{ formatGradeCode(currentDetail.gradeAfter) }}</span></span></div>
          </div>
          <div class="section-title">变动说明</div>
          <div class="detail-note">{{ currentDetail.note || '-' }}</div>
        </template>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getGradeTracePageApi,
  getGradeTraceSummaryApi,
  getGradeTraceDetailApi,
  exportGradeTraceApi,
  getPlatformOrgApi,
  getPlatformIdTypesApi,
  getPlatformChannelsApi
} from '@/api/test/index'

const defaultQuery = () => ({
  custId: '', custName: '', idType: '', idNo: '', orgName: '',
  channel: '', changeType: '', dateFrom: '2026-07-01', dateTo: '2026-08-25'
})
const emptySummary = () => ({ upgradeCount: 0, downgradeCount: 0, invalidCount: 0, totalCount: 0 })

export default {
  name: 'LevelChangeDetail',
  data() {
    return {
      tableLoading: false,
      summaryLoading: false,
      detailLoading: false,
      exportLoading: false,
      dialogVisible: false,
      currentDetail: null,
      orgOptions: [],
      idTypeOptions: [],
      channelOptions: [],
      queryForm: defaultQuery(),
      pagination: { pageNo: 1, pageSize: 10, total: 0 },
      summaryData: emptySummary(),
      tableData: [],
      listRequestId: 0,
      summaryRequestId: 0,
      detailRequestId: 0
    }
  },
  created() {
    this.fetchData()
    this.fetchSummary()
    this.fetchOptions()
  },
  methods: {
    unpackData(res) {
      if (res && res.body) return res.body.data
      return res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res
    },
    normalizeTrace(row) {
      const normalized = {
        ...row,
        traceNo: row.trace_no || row.traceNo || row.recordNo || row.record_no,
        custId: row.cust_id || row.custId,
        custName: row.cust_name || row.custName,
        idType: row.id_type || row.idType,
        idNo: row.id_no || row.idNo,
        orgName: row.org_name || row.orgName,
        changeType: row.change_type || row.changeType,
        gradeBefore: row.grade_before || row.gradeBefore,
        gradeAfter: row.grade_after || row.gradeAfter,
        changePoint: row.change_point != null ? row.change_point : row.changePoint,
        changeReason: row.change_reason || row.changeReason,
        changeTime: row.change_time || row.changeTime,
        effectiveDate: row.effective_date || row.effectiveDate
      }
      Object.keys(normalized).forEach(key => {
        if (normalized[key] === undefined) delete normalized[key]
      })
      return normalized
    },
    formatCustomer(row) {
      return `${row.custName || '-'}（${row.custId || '-'}）`
    },
    formatIdType(value) {
      return { IDCARD: '居民身份证', 身份证: '居民身份证', PASSPORT: '中国护照', 护照: '中国护照', HKMO_PASS: '港澳居民来往内地通行证' }[value] || value || '-'
    },
    formatChannel(value) {
      return { 个险: '个险渠道', 银保: '银保渠道' }[value] || value || '-'
    },
    formatChangeType(value) {
      return { UPGRADE: '升级', DOWNGRADE: '降级', INVALID: '失效', ANNUAL: '年度评定', SWITCH: '规则切换', 升星: '升级', 降星: '降级' }[value] || value || '-'
    },
    formatReason(value) {
      return { ANNUAL: '年度评定', UPGRADE: '积分达标自动升级', DOWNGRADE: '积分扣减后等级回落', INVALID: '等级失效', SWITCH: '规则切换' }[value] || value || '-'
    },
    formatGradeCode(value) {
      const name = { PUXING: '普星', SANXING: '三星', SIXING: '四星', WUXING: '五星', ZHUOYUE: '卓越', ZUNYAO: '尊耀', INVALID: '失效', SHIXIAO: '失效' }[value] || value
      if (!name) return '-'
      return ['普星', '三星', '四星', '五星', '卓越', '尊耀'].includes(name) ? `${name}（新V）` : name
    },
    getGradeClass(value) {
      const name = this.formatGradeCode(value)
      if (name === '失效' || name === '-') return 'badge-gray'
      if (name.startsWith('四星')) return 'badge-gold'
      if (name.startsWith('五星')) return 'badge-orange'
      return 'badge-blue'
    },
    getChangeClass(value) {
      return { 升级: 'badge-green', 降级: 'badge-orange', 失效: 'badge-red' }[this.formatChangeType(value)] || 'badge-blue'
    },
    formatPoint(value) {
      if (value == null || value === '') return '-'
      const number = Number(value)
      return Number.isFinite(number) ? number.toLocaleString('en-US', { maximumFractionDigits: 4 }) : value
    },
    getQueryParams() {
      return {
        ...this.queryForm,
        dateFrom: this.queryForm.dateFrom || undefined,
        dateTo: this.queryForm.dateTo || undefined
      }
    },
    validateDates() {
      if (this.queryForm.dateFrom && this.queryForm.dateTo && this.queryForm.dateFrom > this.queryForm.dateTo) {
        this.$message.warning('开始日期不能晚于结束日期')
        return false
      }
      return true
    },
    async fetchOptions() {
      const results = await Promise.allSettled([
        getPlatformOrgApi(), getPlatformIdTypesApi(), getPlatformChannelsApi()
      ])
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = this.unpackData(result.value)
          this[['orgOptions', 'idTypeOptions', 'channelOptions'][index]] = Array.isArray(data) ? data : []
        }
      })
      if (results.some(result => result.status === 'rejected')) this.$message.error('部分筛选选项加载失败，请刷新重试')
    },
    async fetchData() {
      const requestId = ++this.listRequestId
      this.tableLoading = true
      try {
        const res = await getGradeTracePageApi({
          ...this.getQueryParams(),
          pageNum: this.pagination.pageNo,
          pageSize: this.pagination.pageSize
        })
        if (requestId !== this.listRequestId) return
        const data = this.unpackData(res)
        const rows = Array.isArray(data) ? data : (data && data.list) || []
        this.tableData = rows.map(this.normalizeTrace)
        this.pagination.total = Array.isArray(data) ? data.length : Number(data && data.total) || 0
      } catch (error) {
        if (requestId !== this.listRequestId) return
        this.tableData = []
        this.pagination.total = 0
        this.$message.error('获取等级变化轨迹失败')
      } finally {
        if (requestId === this.listRequestId) this.tableLoading = false
      }
    },
    async fetchSummary() {
      const requestId = ++this.summaryRequestId
      this.summaryLoading = true
      try {
        const { dateFrom, dateTo } = this.getQueryParams()
        const res = await getGradeTraceSummaryApi({ dateFrom, dateTo })
        if (requestId !== this.summaryRequestId) return
        const data = this.unpackData(res) || {}
        this.summaryData = {
          upgradeCount: data.up_total != null ? data.up_total : data.upgradeCount || 0,
          downgradeCount: data.down_total != null ? data.down_total : data.downgradeCount || 0,
          invalidCount: data.invalid_total != null ? data.invalid_total : data.invalidCount || 0,
          totalCount: data.total != null ? data.total : data.totalCount || 0
        }
      } catch (error) {
        if (requestId !== this.summaryRequestId) return
        this.summaryData = emptySummary()
        this.$message.error('获取等级变化统计失败')
      } finally {
        if (requestId === this.summaryRequestId) this.summaryLoading = false
      }
    },
    async handleDetail(row) {
      const requestId = ++this.detailRequestId
      this.currentDetail = this.normalizeTrace(row)
      this.dialogVisible = true
      this.detailLoading = true
      try {
        const res = await getGradeTraceDetailApi(this.currentDetail.traceNo || row.id)
        if (requestId !== this.detailRequestId) return
        const detail = this.unpackData(res)
        if (!detail) throw Error('详情不存在')
        this.currentDetail = { ...this.currentDetail, ...this.normalizeTrace(detail) }
      } catch (error) {
        if (requestId === this.detailRequestId) this.$message.error('获取完整详情失败，当前展示列表信息')
      } finally {
        if (requestId === this.detailRequestId) this.detailLoading = false
      }
    },
    handleQuery() {
      if (!this.validateDates()) return
      this.pagination.pageNo = 1
      return Promise.all([this.fetchData(), this.fetchSummary()])
    },
    handleReset() {
      this.queryForm = defaultQuery()
      return this.handleQuery()
    },
    async handleExport() {
      if (this.exportLoading || !this.validateDates()) return
      this.exportLoading = true
      try {
        const blob = await exportGradeTraceApi(this.getQueryParams())
        if (blob.type && blob.type.includes('json')) {
          const error = JSON.parse(await blob.text())
          throw Error(error.header && error.header.message || '导出失败')
        }
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '等级变化轨迹.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (error) {
        this.$message.error(error.message || '导出失败')
      } finally {
        this.exportLoading = false
      }
    },
    handleSizeChange(value) {
      this.pagination.pageSize = value
      this.pagination.pageNo = 1
      return this.fetchData()
    },
    handleCurrentChange(value) {
      this.pagination.pageNo = value
      return this.fetchData()
    }
  }
}
</script>

<style scoped>
.level-trace-page {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
  color: #333a45;
}
.page-heading { margin: 2px 0 16px; }
.page-heading h1 { margin: 0 0 8px; font-size: 21px; line-height: 1.3; font-weight: 700; }
.page-heading p { margin: 0; color: #5a6472; font-size: 13px; }
.filter-container, .table-container { border: 1px solid #e1e5ec; border-radius: 4px; }
.filter-container { margin-bottom: 16px; }
.filter-container ::v-deep .el-card__body { padding: 16px 18px; }
.trace-query-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.trace-query-form ::v-deep .el-form-item { margin: 0; }
.trace-query-form ::v-deep .el-form-item__content { display: flex; align-items: center; line-height: normal; }
.trace-query-form ::v-deep .el-input, .trace-query-form ::v-deep .el-select { width: 140px; }
.trace-query-form .certificate-filter ::v-deep .el-input { width: 160px; }
.trace-query-form ::v-deep .el-input__inner { height: 40px; line-height: 40px; padding: 0 10px; color: #333a45; font-family: inherit; font-size: 14px; border-color: #c9cfd8; border-radius: 4px; }
.trace-query-form ::v-deep .el-input__icon { line-height: 40px; }
.trace-query-form ::v-deep .el-date-editor .el-input__inner { padding-left: 30px; padding-right: 23px; }
.trace-query-form ::v-deep .el-button { width: 62px; height: 36px; padding: 0 16px; line-height: normal; font-family: inherit; font-size: 14px; font-weight: 400; border-radius: 4px; }
.query-actions ::v-deep .el-form-item__content { gap: 12px; }
.query-actions ::v-deep .el-button + .el-button { margin-left: 0; }
.date-separator { color: #5a6472; font-size: 13px; }
.summary-container { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.summary-box { padding: 16px 20px 18px; border: 1px solid #e0e4ea; border-radius: 10px; background: #fff; }
.summary-label { margin-bottom: 6px; font-size: 13px; color: #5a6472; }
.summary-value { font-size: 26px; line-height: 1.15; font-weight: 700; }
.green { color: #2e7d32; }
.orange { color: #e67e22; }
.red { color: #c62828; }
.table-container ::v-deep .el-card__header { padding: 13px 18px; }
.table-container ::v-deep .el-card__body { padding: 16px 18px; }
.table-header-title { font-size: 15px; font-weight: 600; color: #333a45; }
.pagination-container { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.table-hint { font-size: 12px; color: #5a6472; }
.trace-badge { display: inline-block; padding: 2px 12px; border-radius: 10px; font-size: 12px; line-height: normal; white-space: nowrap; }
.badge-green { color: #2e7d32; background: #e8f5e9; }
.badge-orange { color: #e67e22; background: #fdf3e7; }
.badge-red { color: #c62828; background: #fdecea; }
.badge-blue { color: #2f5496; background: #ebf1fa; }
.badge-gold { color: #8a6d00; background: #fff6df; }
.badge-gray { color: #5a6472; background: #eef0f2; }
::v-deep .level-trace-dialog { max-width: calc(100vw - 32px); border-radius: 8px; }
::v-deep .level-trace-dialog .el-dialog__body { padding: 18px; max-height: calc(100vh - 240px); height: auto; overflow-y: auto; color: #333a45; font-size: 14px; }
.trace-detail-body .section-title { margin-top: 28px; }
.detail-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; }
.info-item { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.info-label { flex-shrink: 0; color: #5a6472; font-size: 13px; }
.info-value { color: #333a45; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.grade-change-box { display: flex; align-items: center; gap: 28px; margin: 14px 0; padding: 14px 20px; background: #ebf1fa; border-radius: 4px; }
.grade-change-item { display: flex; flex-direction: column; }
.grade-label { color: #5a6472; font-size: 13px; }
.grade-value { margin-top: 4px; font-size: 18px; font-weight: 700; }
.grade-arrow { color: #4472c4; font-size: 18px; font-weight: 700; }
.detail-note { color: #333a45; font-size: 14px; overflow-wrap: anywhere; }
@media (max-width: 600px) {
  .summary-container { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-info-grid { grid-template-columns: 1fr; }
}
</style>
