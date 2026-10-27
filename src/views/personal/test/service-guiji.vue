<template>
  <div class="app-container benefit-trace-page">
    <div class="page-heading">
      <h1>权益轨迹</h1>
      <p>查询客户服务权益的使用记录，服务使用后实时扣减次数，次数用尽自动限制再次申请与使用</p>
    </div>
    <el-card shadow="never" class="filter-container">
      <el-form :inline="true" :model="queryForm" size="small" class="trace-query-form" @submit.native.prevent="handleSearch">
        <div class="filter-row">
          <el-form-item>
            <el-input v-model.trim="queryForm.custId" aria-label="客户号" placeholder="客户号" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-input v-model.trim="queryForm.custName" aria-label="客户姓名" placeholder="客户姓名" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.idType" aria-label="证件类型" placeholder="全部证件类型" clearable>
              <el-option label="全部证件类型" value="" />
              <el-option v-for="item in idTypeOptions" :key="item" :label="formatIdType(item)" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item class="wide-filter">
            <el-input v-model.trim="queryForm.idNo" aria-label="证件号码" placeholder="证件号码" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item class="org-filter">
            <el-select v-model="queryForm.orgName" aria-label="服务归属机构" placeholder="全部服务归属机构" clearable>
              <el-option label="全部服务归属机构" value="" />
              <el-option v-for="item in orgOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item class="wide-filter">
            <el-select v-model="queryForm.action" aria-label="权益动作" placeholder="全部权益动作" clearable>
              <el-option label="全部权益动作" value="" />
              <el-option v-for="item in actionOptions" :key="item" :label="formatActionText(item)" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item class="wide-filter">
            <el-select v-model="queryForm.benefitCode" aria-label="服务类型" placeholder="全部服务类型" clearable>
              <el-option label="全部服务类型" value="" />
              <el-option v-for="item in benefitOptions" :key="item.benefitCode" :label="`${item.benefitCode} ${item.benefitName}`" :value="item.benefitCode" />
            </el-select>
          </el-form-item>
        </div>
        <div class="filter-row">
          <el-form-item class="status-filter">
            <el-select v-model="queryForm.countStatus" aria-label="次数状态" placeholder="全部次数状态" clearable>
              <el-option label="全部次数状态" value="" />
              <el-option label="有剩余次数" value="NORMAL" />
              <el-option label="已用尽" value="EXHAUSTED" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-date-picker v-model="queryForm.dateFrom" aria-label="动作开始日期" type="date" placeholder="开始日期" value-format="yyyy-MM-dd" />
          </el-form-item>
          <span class="date-separator">~</span>
          <el-form-item>
            <el-date-picker v-model="queryForm.dateTo" aria-label="动作结束日期" type="date" placeholder="结束日期" value-format="yyyy-MM-dd" />
          </el-form-item>
          <el-form-item class="query-actions">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button :loading="exportLoading" @click="handleExport">导出</el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <div v-loading="statsLoading" class="summary-container">
      <div v-for="card in statCards" :key="card.title" class="summary-box">
        <div class="summary-label">{{ card.title }}</div>
        <div class="summary-value" :class="card.color">{{ card.value }}</div>
      </div>
    </div>

    <el-card shadow="never" class="table-container">
      <div slot="header" class="table-header">
        <span class="table-title">权益使用明细</span>
        <span class="table-subtitle">次数用尽后系统自动限制该服务项目的再次申请与使用</span>
      </div>
      <el-table v-loading="loading" :data="tableData" stripe size="mini" style="width: 100%;">
        <el-table-column label="客户" min-width="190" align="center" show-overflow-tooltip>
          <template slot-scope="{ row }">
            {{ formatCustomer(row) }}
            <el-tag v-if="row.annualFlag" size="mini" type="warning">年初台账</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="证件类型" min-width="110" align="center">
          <template slot-scope="{ row }">{{ formatIdType(row.idType) }}</template>
        </el-table-column>
        <el-table-column prop="idNo" label="证件号码" min-width="160" align="center" show-overflow-tooltip />
        <el-table-column prop="orgName" label="服务归属机构" min-width="130" align="center" show-overflow-tooltip />
        <el-table-column label="权益动作" min-width="125" align="center">
          <template slot-scope="{ row }">
            <span class="trace-badge" :class="getActionBadgeClass(row.action)">{{ formatActionText(row.action) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="benefitCode" label="服务权益ID" min-width="105" align="center" />
        <el-table-column prop="benefitName" label="权益名称" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="supplier" label="服务供应商" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="kind" label="服务种类" min-width="100" align="center" />
        <el-table-column prop="validTo" label="有效期" min-width="110" align="center" />
        <el-table-column label="动作时间" min-width="160" align="center">
          <template slot-scope="{ row }">{{ formatTime(row.actionTime) }}</template>
        </el-table-column>
        <el-table-column label="次数" width="70" align="center">
          <template slot-scope="{ row }">
            <span :class="row.countChange > 0 ? 'green' : (row.countChange < 0 ? 'red' : '')">{{ formatChange(row.countChange) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已使用/剩余" min-width="110" align="center">
          <template slot-scope="{ row }">{{ displayValue(row.usedCount) }} / {{ formatRemain(row.remainCount) }}</template>
        </el-table-column>
        <el-table-column label="次数状态" min-width="90" align="center">
          <template slot-scope="{ row }">
            <span class="trace-badge" :class="getStatusBadgeClass(row.countStatus)">{{ formatStatusText(row.countStatus) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination background layout="total, prev, pager, next, sizes, jumper" :total="total" :page-size="pageSize" :current-page="currentPage" :page-sizes="[10, 20, 50]" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <el-dialog title="权益使用详情" :visible.sync="detailVisible" width="660px" custom-class="benefit-trace-dialog" :close-on-click-modal="false" append-to-body @close="closeDetail">
      <div v-loading="detailLoading" class="trace-detail-body">
        <template v-if="currentDetail">
          <div v-for="section in detailSections" :key="section.title" class="detail-section">
            <div class="section-title">{{ section.title }}</div>
            <div class="detail-info-grid">
              <div v-for="field in section.fields" :key="field.label" class="info-item">
                <span class="info-label">{{ field.label }}</span>
                <span class="info-value">
                  <span v-if="field.badge" class="trace-badge" :class="field.badge">{{ field.value }}</span>
                  <template v-else>{{ field.value }}</template>
                </span>
              </div>
            </div>
          </div>
          <div class="section-title">次数变化</div>
          <div class="count-change-box">
            <div class="count-change-item"><span class="info-label">变化前剩余</span><span class="count-value">{{ beforeRemain(currentDetail) }}</span></div>
            <span class="count-arrow">→</span>
            <div class="count-change-item"><span class="info-label">变化后剩余</span><span class="count-value green">{{ formatRemain(currentDetail.remainCount) }}</span></div>
          </div>
        </template>
      </div>
      <span slot="footer"><el-button size="small" @click="detailVisible = false">关闭</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
import {
  exportBenefitTraceApi, getBenefitTraceStatsApi, getBenefitTracePageApi,
  getBenefitTraceDetailApi, getPlatformIdTypesApi, getPlatformOrgApi, getBenefitItemsApi
} from '@/api/test/index.js'
import { formatIdType, formatTime } from './benefit-adjust-model'

const newQuery = () => ({
  custId: '', custName: '', idType: '', idNo: '', orgName: '',
  action: '', benefitCode: '', countStatus: '', dateFrom: '', dateTo: ''
})

export default {
  name: 'EquityTrack',
  data() {
    return {
      loading: false, statsLoading: false, exportLoading: false, detailLoading: false,
      queryForm: newQuery(), appliedQuery: newQuery(),
      idTypeOptions: [], orgOptions: [], benefitOptions: [],
      actionOptions: ['GRADE_CHANGE', 'MANUAL_ADJUST', 'USE_DEDUCT', 'EXPIRE_DEDUCT', 'DEDUCT_ROLLBACK'],
      statCards: [
        { title: '权益动作条数', key: 'total', value: 0, color: 'blue' },
        { title: '等级变动调整', key: 'GRADE_CHANGE', value: 0, color: 'green' },
        { title: '人工调整', key: 'MANUAL_ADJUST', value: 0, color: '' },
        { title: '使用消减', key: 'USE_DEDUCT', value: 0, color: 'red' },
        { title: '失效消减', key: 'EXPIRE_DEDUCT', value: 0, color: 'red' },
        { title: '消减回退', key: 'DEDUCT_ROLLBACK', value: 0, color: 'green' }
      ],
      total: 0, currentPage: 1, pageSize: 10, tableData: [],
      detailVisible: false, currentDetail: null,
      listRequestId: 0, statsRequestId: 0, detailRequestId: 0
    }
  },
  computed: {
    detailSections() {
      const row = this.currentDetail
      if (!row) return []
      return [
        { title: '客户信息', fields: [
          { label: '客户', value: this.formatCustomer(row) },
          { label: '证件类型', value: formatIdType(row.idType) },
          { label: '证件号码', value: this.displayValue(row.idNo) },
          { label: '服务归属机构', value: this.displayValue(row.orgName) }
        ] },
        { title: '权益信息', fields: [
          { label: '服务权益ID', value: this.displayValue(row.benefitCode) },
          { label: '服务权益', value: this.displayValue(row.benefitName) },
          { label: '服务项目', value: this.displayValue(row.itemName) },
          { label: '服务供应商', value: this.displayValue(row.supplier) },
          { label: '服务类型', value: this.displayValue(row.kind) },
          { label: '有效期', value: this.displayValue(row.validTo) },
          { label: '次数状态', value: this.formatStatusText(row.countStatus), badge: this.getStatusBadgeClass(row.countStatus) }
        ] },
        { title: '本次使用', fields: [
          { label: '权益动作', value: this.formatActionText(row.action), badge: this.getActionBadgeClass(row.action) },
          { label: '动作时间', value: formatTime(row.actionTime) },
          { label: '本次次数', value: this.formatChange(row.countChange) },
          { label: '已使用 / 剩余', value: `${this.displayValue(row.usedCount)} / ${this.formatRemain(row.remainCount)}` }
        ] }
      ]
    }
  },
  created() {
    this.fetchOptions()
    this.fetchData()
    this.fetchStats()
  },
  beforeDestroy() {
    this.listRequestId++
    this.statsRequestId++
    this.detailRequestId++
  },
  methods: {
    formatIdType,
    formatTime,
    displayValue(value) { return value == null || value === '' ? '-' : value },
    formatCustomer(row) { return row.custName ? `${row.custName}（${row.custId || '-'}）` : this.displayValue(row.custId) },
    formatChange(value) { return value > 0 ? `+${value}` : this.displayValue(value) },
    // 后端序列化会省略 NULL 字段，remainCount 缺省与 NULL 均表示不限。
    formatRemain(value) { return value == null ? '不限' : this.displayValue(value) },
    beforeRemain(row) {
      // 年初重赋无前值；转出会把不限权益记成 -1 / 0，不能据此反推前值。
      if (row.annualFlag || row.action === 'TRANSFER_OUT') return '-'
      if (row.remainCount == null) return '不限'
      if (row.countChange == null) return '-'
      return this.displayValue(Number(row.remainCount) - Number(row.countChange))
    },
    buildQueryParams(paginated = true) {
      const params = { ...this.appliedQuery }
      Object.keys(params).forEach(key => { if (params[key] == null || params[key] === '') delete params[key] })
      return paginated ? { ...params, pageNum: this.currentPage, pageSize: this.pageSize } : params
    },
    validateDates() {
      if (this.queryForm.dateFrom && this.queryForm.dateTo && this.queryForm.dateFrom > this.queryForm.dateTo) {
        this.$message.warning('开始日期不能晚于结束日期')
        return false
      }
      return true
    },
    async fetchOptions() {
      const results = await Promise.allSettled([getPlatformIdTypesApi(), getPlatformOrgApi(), getBenefitItemsApi()])
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value.data)) {
          this[['idTypeOptions', 'orgOptions', 'benefitOptions'][index]] = result.value.data
        }
      })
      if (results.some(result => result.status === 'rejected')) this.$message.error('部分筛选选项加载失败，请刷新重试')
    },
    async fetchData() {
      const requestId = ++this.listRequestId
      this.loading = true
      try {
        const res = await getBenefitTracePageApi(this.buildQueryParams())
        if (requestId !== this.listRequestId) return
        this.tableData = res.data.list || []
        this.total = res.data.total || 0
      } catch (error) {
        if (requestId !== this.listRequestId) return
        this.tableData = []
        this.total = 0
        this.$message.error('获取权益轨迹列表失败，请重试')
      } finally {
        if (requestId === this.listRequestId) this.loading = false
      }
    },
    async fetchStats() {
      const requestId = ++this.statsRequestId
      this.statsLoading = true
      try {
        // 统计接口只接受时间范围，不支持客户、机构等列表筛选条件。
        const { dateFrom, dateTo } = this.buildQueryParams(false)
        const res = await getBenefitTraceStatsApi({ dateFrom, dateTo })
        if (requestId !== this.statsRequestId) return
        this.statCards.forEach(card => { card.value = card.key === 'total' ? res.data.total || 0 : (res.data.byAction || {})[card.key] || 0 })
      } catch (error) {
        if (requestId !== this.statsRequestId) return
        this.statCards.forEach(card => { card.value = '-' })
        this.$message.error('获取权益统计失败，请重试')
      } finally {
        if (requestId === this.statsRequestId) this.statsLoading = false
      }
    },
    async handleExport() {
      if (this.exportLoading) return
      this.exportLoading = true
      try {
        const blob = await exportBenefitTraceApi(this.buildQueryParams(false))
        if (blob.type && blob.type.includes('json')) {
          const error = JSON.parse(await blob.text())
          throw new Error((error.header || {}).message || error.message || '导出失败')
        }
        const href = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = href
        link.download = '权益轨迹明细.xlsx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(href)
        this.$message.success('导出成功')
      } catch (error) {
        this.$message.error(error.message || '导出失败，请重试')
      } finally {
        this.exportLoading = false
      }
    },
    async handleViewDetail(row) {
      const requestId = ++this.detailRequestId
      this.currentDetail = row.annualFlag ? { ...row } : null
      this.detailVisible = true
      this.detailLoading = false
      // 台账主键不属于轨迹表，不能用其主键请求普通轨迹详情。
      if (row.annualFlag) return
      this.detailLoading = true
      try {
        const res = await getBenefitTraceDetailApi(row.id)
        if (requestId !== this.detailRequestId || !this.detailVisible) return
        if (!res.data) throw new Error('轨迹详情不存在')
        // 详情未联查客户证件与机构，沿用当前列表行的客户信息。
        this.currentDetail = { ...row, ...res.data }
      } catch (error) {
        if (requestId !== this.detailRequestId) return
        this.detailVisible = false
        this.$message.error('获取轨迹详情失败，请重试')
      } finally {
        if (requestId === this.detailRequestId) this.detailLoading = false
      }
    },
    closeDetail() {
      this.detailRequestId++
      this.detailLoading = false
      this.currentDetail = null
    },
    handleSearch() {
      if (!this.validateDates()) return
      this.appliedQuery = { ...this.queryForm }
      this.currentPage = 1
      this.fetchData()
      this.fetchStats()
    },
    handleReset() {
      this.queryForm = newQuery()
      this.handleSearch()
    },
    handleSizeChange(value) {
      this.pageSize = value
      this.currentPage = 1
      this.fetchData()
    },
    handleCurrentChange(value) {
      this.currentPage = value
      this.fetchData()
    },
    formatActionText(action) {
      return { GRADE_CHANGE: '等级变动调整', MANUAL_ADJUST: '人工调整', USE_DEDUCT: '使用消减', EXPIRE_DEDUCT: '失效消减', DEDUCT_ROLLBACK: '消减回退', TRANSFER_OUT: '转出', TRANSFER_IN: '转入' }[action] || this.displayValue(action)
    },
    formatStatusText(status) {
      return { NORMAL: '正常', EXHAUSTED: '已用尽', EXPIRED: '已失效', TRANSFERRED: '已转出' }[status] || this.displayValue(status)
    },
    getActionBadgeClass(action) {
      if (['GRADE_CHANGE', 'DEDUCT_ROLLBACK', 'TRANSFER_IN'].includes(action)) return 'badge-green'
      if (['USE_DEDUCT', 'EXPIRE_DEDUCT', 'TRANSFER_OUT'].includes(action)) return 'badge-red'
      return action === 'MANUAL_ADJUST' ? 'badge-blue' : 'badge-gray'
    },
    getStatusBadgeClass(status) {
      if (status === 'NORMAL') return 'badge-green'
      return ['EXHAUSTED', 'EXPIRED', 'TRANSFERRED'].includes(status) ? 'badge-red' : 'badge-gray'
    }
  }
}
</script>

<style scoped>
.benefit-trace-page { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); color: #333a45; }
.page-heading { margin: 2px 0 16px; }
.page-heading h1 { margin: 0 0 8px; font-size: 21px; line-height: 1.3; font-weight: 700; }
.page-heading p { margin: 0; color: #5a6472; font-size: 13px; }
.filter-container, .table-container { border: 1px solid #e1e5ec; border-radius: 4px; }
.filter-container { margin-bottom: 16px; }
.filter-container ::v-deep .el-card__body { padding: 16px 18px; }
.filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.filter-row + .filter-row { margin-top: 16px; }
.trace-query-form ::v-deep .el-form-item { margin: 0; }
.trace-query-form ::v-deep .el-form-item__content { display: flex; align-items: center; line-height: normal; }
.trace-query-form ::v-deep .el-input, .trace-query-form ::v-deep .el-select { width: 140px; }
.trace-query-form .wide-filter ::v-deep .el-input, .trace-query-form .wide-filter ::v-deep .el-select { width: 160px; }
.trace-query-form .org-filter ::v-deep .el-input, .trace-query-form .org-filter ::v-deep .el-select { width: 150px; }
.trace-query-form .status-filter ::v-deep .el-input, .trace-query-form .status-filter ::v-deep .el-select { width: 122px; }
.trace-query-form ::v-deep .el-input__inner { height: 40px; line-height: 40px; padding: 0 10px; color: #333a45; font-family: inherit; font-size: 14px; border-color: #c9cfd8; border-radius: 4px; }
.trace-query-form ::v-deep .el-input__icon { line-height: 40px; }
.trace-query-form ::v-deep .el-date-editor .el-input__inner { padding-left: 30px; padding-right: 23px; }
.trace-query-form ::v-deep .el-button { width: 62px; height: 36px; padding: 0 16px; line-height: normal; font-family: inherit; font-size: 14px; font-weight: 400; border-radius: 4px; }
.query-actions ::v-deep .el-form-item__content { gap: 12px; }
.query-actions ::v-deep .el-button + .el-button { margin-left: 0; }
.date-separator { color: #5a6472; font-size: 13px; }
.summary-container { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.summary-box { padding: 16px 20px 18px; border: 1px solid #e0e4ea; border-radius: 10px; background: #fff; }
.summary-label { margin-bottom: 6px; font-size: 13px; color: #5a6472; white-space: nowrap; }
.summary-value { font-size: 26px; line-height: 1.15; font-weight: 700; }
.blue { color: #4f6fae; }
.green { color: #2e7d32; }
.red { color: #c62828; }
.table-container ::v-deep .el-card__header { padding: 13px 18px; }
.table-container ::v-deep .el-card__body { padding: 16px 18px; }
.table-title { font-size: 15px; font-weight: 600; color: #333a45; }
.table-subtitle { margin-left: 10px; color: #5a6472; font-size: 12px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 16px; }
.trace-badge { display: inline-block; padding: 2px 12px; border-radius: 10px; font-size: 12px; line-height: normal; white-space: nowrap; }
.badge-green { color: #2e7d32; background: #e8f5e9; }
.badge-red { color: #c62828; background: #fdecea; }
.badge-blue { color: #2f5496; background: #ebf1fa; }
.badge-gray { color: #5a6472; background: #eef0f2; }
::v-deep .benefit-trace-dialog { max-width: calc(100vw - 32px); border-radius: 8px; }
::v-deep .benefit-trace-dialog .el-dialog__body { padding: 18px; max-height: calc(100vh - 240px); height: auto; min-height: 80px; overflow-y: auto; color: #333a45; font-size: 14px; }
.trace-detail-body .section-title { margin-top: 28px; }
.detail-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; }
.info-item { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.info-label { flex-shrink: 0; color: #5a6472; font-size: 13px; }
.info-value { color: #333a45; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.count-change-box { display: flex; align-items: center; gap: 28px; margin: 14px 0; padding: 14px 20px; background: #ebf1fa; border-radius: 4px; }
.count-change-item { display: flex; flex-direction: column; }
.count-value { margin-top: 4px; font-size: 18px; font-weight: 700; }
.count-arrow { color: #4f6fae; font-size: 18px; font-weight: 700; }
@media (max-width: 800px) {
  .summary-container { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .summary-container { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-info-grid { grid-template-columns: 1fr; }
}
</style>
