<template>
  <div class="page-container benefit-approval">
    <div class="page-heading">
      <h2>权益调整审批</h2>
      <p>对待审批的权益调整申请进行审批处理，审批通过后权益派发至客户</p>
    </div>
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" class="query-form" @submit.native.prevent="handleSearch">
        <el-form-item><el-select v-model="queryForm.idType" placeholder="全部证件类型" clearable class="query-medium"><el-option v-for="item in idTypes" :key="item" :label="formatIdType(item)" :value="item" /></el-select></el-form-item>
        <el-form-item><el-input v-model="queryForm.idNo" placeholder="证件号码" clearable class="query-number" /></el-form-item>
        <el-form-item><el-input v-model="queryForm.custName" placeholder="客户姓名" clearable class="query-medium" /></el-form-item>
        <el-form-item><el-input v-model="queryForm.custId" placeholder="客户号" clearable class="query-medium" /></el-form-item>
        <el-form-item><el-select v-model="queryForm.orgName" placeholder="全部服务归属机构" clearable class="query-org"><el-option v-for="item in orgs" :key="item" :label="item" :value="item" /></el-select></el-form-item>
        <el-form-item>
          <el-popover placement="bottom-start" width="290" trigger="click">
            <el-input v-model="benefitKeyword" size="small" placeholder="搜索服务权益ID或名称" clearable />
            <div class="approval-benefit-options">
              <el-checkbox :value="allBenefitsSelected" :indeterminate="queryForm.benefitCodes.length > 0 && !allBenefitsSelected" @change="toggleAllBenefits">全部</el-checkbox>
              <el-checkbox-group v-model="queryForm.benefitCodes">
                <el-checkbox v-for="item in filteredBenefits" :key="item.benefitCode" :label="item.benefitCode">{{ item.benefitCode }} {{ item.benefitName }}</el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-footer">已选 {{ queryForm.benefitCodes.length }} 项<el-button type="text" @click="queryForm.benefitCodes = []">清空</el-button></div>
            <el-button slot="reference" class="benefit-filter"><span>{{ selectedBenefitNames }}</span><i class="el-icon-arrow-down" /></el-button>
          </el-popover>
        </el-form-item>
        <el-form-item><el-select v-model="queryForm.status" placeholder="全部状态" clearable class="query-medium"><el-option v-for="item in statuses" :key="item" :label="statusText(item)" :value="item" /></el-select></el-form-item>
        <el-form-item class="query-dates">
          <el-date-picker v-model="queryForm.dateFrom" type="date" value-format="yyyy-MM-dd" placeholder="开始日期" />
          <span class="date-separator">~</span>
          <el-date-picker v-model="queryForm.dateTo" type="date" value-format="yyyy-MM-dd" placeholder="结束日期" />
        </el-form-item>
        <el-form-item><el-input v-model="queryForm.applicant" placeholder="申请人" clearable class="query-medium" /></el-form-item>
        <el-form-item class="query-actions"><el-button type="primary" native-type="submit">查询</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="main-card">
      <div slot="header" class="card-title">申请列表</div>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="客户" min-width="155"><template slot-scope="{ row }">{{ customerText(row) }}</template></el-table-column>
        <el-table-column label="证件类型" width="110"><template slot-scope="{ row }">{{ formatIdType(row.idType) }}</template></el-table-column>
        <el-table-column prop="idNo" label="证件号码" min-width="170" />
        <el-table-column prop="orgName" label="服务归属机构" min-width="130" />
        <el-table-column label="服务权益ID" min-width="130"><template slot-scope="{ row }">{{ separated(row.benefitCodes) }}</template></el-table-column>
        <el-table-column prop="benefitNames" label="调整权益" min-width="160" show-overflow-tooltip />
        <el-table-column label="调整原因" min-width="120"><template slot-scope="{ row }">{{ row.reasonName || '—' }}</template></el-table-column>
        <el-table-column label="关联保单号" min-width="130"><template slot-scope="{ row }">{{ row.policyNo || '—' }}</template></el-table-column>
        <el-table-column prop="oaNo" label="OA流水号" min-width="150" />
        <el-table-column label="申请人" width="90"><template slot-scope="{ row }">{{ row.applicant || '—' }}</template></el-table-column>
        <el-table-column label="申请时间" min-width="160"><template slot-scope="{ row }">{{ formatTime(row.applyTime) }}</template></el-table-column>
        <el-table-column label="状态" width="90"><template slot-scope="{ row }"><span :class="['status-badge', row.status]">{{ statusText(row.status) }}</span></template></el-table-column>
        <el-table-column label="审批通过时间" min-width="160"><template slot-scope="{ row }">{{ row.status === 'APPROVED' ? formatTime(row.auditTime) : '—' }}</template></el-table-column>
        <el-table-column label="操作" width="80" fixed="right"><template slot-scope="{ row }">
          <el-button v-if="row.status === 'PENDING'" type="text" size="small" @click="handleApprove(row)">审批</el-button>
          <el-button v-else type="text" size="small" @click="handleView(row)">查看</el-button>
        </template></el-table-column>
      </el-table>
      <div class="pagination-container"><el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange" @current-change="handleCurrentChange" /></div>
    </el-card>

    <el-dialog title="审批详情" :visible.sync="dialogVisible" width="1040px" top="4vh" append-to-body :custom-class="isApproveMode ? 'benefit-approval-dialog' : 'benefit-approval-dialog approval-readonly'" :close-on-click-modal="false" :close-on-press-escape="!submitLoading" :show-close="!submitLoading" :before-close="beforeClose" @close="invalidateDetail">
      <div v-loading="dialogLoading">
        <template v-if="currentDetail">
          <div class="detail-fields"><div v-for="field in detailFields" :key="field[0]"><span>{{ field[0] }}</span><strong>{{ field[1] }}</strong></div></div>
          <div class="section-title">调整权益</div>
          <benefit-adjust-rights :value="detailBenefits" :catalog="catalog" :identities="identities" :channels="channels" :valid-end-date="currentDetail.validEndDate" readonly />
          <hr class="section-divider">
          <div class="section-title">详细说明</div><div class="detail-text">{{ currentDetail.remark || '—' }}</div>
          <div class="section-title">附件</div><el-button v-if="currentDetail.attachment" type="text" class="attachment-link" @click="downloadAttachment(currentDetail.attachment)">{{ attachmentName(currentDetail.attachment) }}</el-button><span v-else class="detail-text">无</span>
          <div class="section-title">审批意见<span class="sub-hint">（驳回时必填）</span></div>
          <div v-if="!isApproveMode" class="detail-fields review-result"><div><span>审批结果</span><strong>{{ statusText(currentDetail.status) }}</strong></div></div>
          <el-input ref="opinionInput" v-model="approvalRemark" class="approval-opinion" :class="{ 'has-error': opinionInvalid }" type="textarea" :rows="3" placeholder="请输入审批意见" :readonly="!isApproveMode" :disabled="submitLoading" @input="opinionInvalid = false" />
        </template>
      </div>
      <div v-if="isApproveMode && currentDetail && !dialogLoading" slot="footer">
        <el-button class="reject-button" size="medium" :disabled="submitLoading" :loading="submitLoading && submittingResult === 'REJECTED'" @click="handleAudit('REJECTED')">驳回</el-button>
        <el-button type="primary" size="medium" :disabled="submitLoading" :loading="submitLoading && submittingResult === 'APPROVED'" @click="handleAudit('APPROVED')">审批通过</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getBenefitAdjustPageApi, getBenefitAdjustDetailApi, passBenefitAdjustApi,
  getBenefitItemsApi, getPlatformIdTypesApi, getPlatformOrgApi, getServiceRuleIdentitiesApi, getPlatformOrderChannelApi
} from '@/api/test'
import { downloadAttachmentApi } from '@/api/test/point'
import { normalizeBenefit, formatIdType, formatTime, statusText } from './benefit-adjust-model'
import BenefitAdjustRights from './components/benefit-adjust-rights'

function newQuery() {
  return { idType: '', idNo: '', custName: '', custId: '', orgName: '', benefitCodes: [], status: '', dateFrom: '', dateTo: '', applicant: '' }
}
export default {
  name: 'BenefitAdjustmentApproval',
  components: { BenefitAdjustRights },
  data() {
    return {
      queryForm: newQuery(), activeQuery: newQuery(), statuses: ['PENDING', 'APPROVED', 'REJECTED'],
      catalog: [], idTypes: [], orgs: [], identities: [], channels: [], benefitKeyword: '', resourcesPromise: null,
      tableData: [], total: 0, currentPage: 1, pageSize: 10, loading: false, listRequest: 0,
      dialogVisible: false, dialogLoading: false, isApproveMode: false, currentDetail: null, detailBenefits: [],
      approvalRemark: '', opinionInvalid: false, submitLoading: false, submittingResult: '', detailRequest: 0
    }
  },
  computed: {
    filteredBenefits() {
      const keyword = this.benefitKeyword.trim().toLowerCase()
      return this.catalog.filter(item => `${item.benefitCode} ${item.benefitName}`.toLowerCase().includes(keyword))
    },
    allBenefitsSelected() { return this.catalog.length > 0 && this.catalog.every(item => this.queryForm.benefitCodes.includes(item.benefitCode)) },
    selectedBenefitNames() {
      return this.queryForm.benefitCodes.map(code => {
        const item = this.catalog.find(value => value.benefitCode === code)
        return item ? item.benefitName : code
      }).join('、') || '全部调整权益'
    },
    detailFields() {
      const d = this.currentDetail || {}
      return [
        ['申请单号', d.applyNo || '—'], ['客户', this.customerText(d)], ['证件类型', formatIdType(d.idType)], ['证件号码', d.idNo || '—'],
        ['服务归属机构', d.orgName || '—'], ['调整原因', d.reasonName || '—'], ['关联保单号', d.policyNo || '—'], ['OA流水号', d.oaNo || '—'],
        ['申请时间', formatTime(d.applyTime)], ['申请人', d.applicant || '—']
      ]
    }
  },
  created() {
    this.resourcesPromise = this.loadResources()
    this.fetchTableData()
  },
  beforeDestroy() { this.listRequest++; this.detailRequest++ },
  methods: {
    formatIdType, formatTime, statusText,
    customerText(row) { return `${row.custName || '—'}（${row.custId || '—'}）` },
    separated(value) { return String(value || '—').split(',').join('、') },
    async loadResources() {
      const results = await Promise.allSettled([getBenefitItemsApi(), getPlatformIdTypesApi(), getPlatformOrgApi(), getServiceRuleIdentitiesApi(), getPlatformOrderChannelApi()])
      const keys = ['catalog', 'idTypes', 'orgs', 'identities', 'channels']
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = result.value.data
          this[keys[index]] = Array.isArray(data) ? data : (data && data.list) || []
        }
      })
      if (results.some(result => result.status === 'rejected')) this.$message.error('部分权益或筛选字典加载失败，请刷新后重试')
    },
    toggleAllBenefits(checked) { this.queryForm.benefitCodes = checked ? this.catalog.map(item => item.benefitCode) : [] },
    queryParams() {
      return Object.fromEntries(Object.entries(this.activeQuery)
        .filter(([key, value]) => key !== 'benefitCodes' && value != null && String(value).trim() !== '')
        .map(([key, value]) => [key, String(value).trim()]))
    },
    async fetchBenefitPages(params, benefitCode) {
      const rows = []
      for (let pageNum = 1; ; pageNum++) {
        const res = await getBenefitAdjustPageApi({ ...params, benefitCode, pageNum, pageSize: 100 })
        const page = res.data
        const batch = page.list || []
        rows.push(...batch)
        if (!batch.length || rows.length >= Number(page.total)) return rows
      }
    },
    async fetchTableData() {
      const request = ++this.listRequest
      this.loading = true
      try {
        const params = this.queryParams()
        const codes = this.activeQuery.benefitCodes
        let rows, total
        if (codes.length > 1) {
          const groups = await Promise.all(codes.map(code => this.fetchBenefitPages(params, code)))
          const merged = Array.from(new Map([].concat(...groups).map(row => [row.id, row])).values())
            .sort((a, b) => String(b.applyTime).localeCompare(String(a.applyTime)) || Number(b.id) - Number(a.id))
          total = merged.length
          rows = merged.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize)
        } else {
          const res = await getBenefitAdjustPageApi({ ...params, ...codes.length ? { benefitCode: codes[0] } : {}, pageNum: this.currentPage, pageSize: this.pageSize })
          rows = res.data.list || []
          total = Number(res.data.total) || 0
        }
        if (request !== this.listRequest) return
        this.tableData = rows
        this.total = total
      } catch (error) {
        if (request === this.listRequest) { this.tableData = []; this.total = 0; this.$message.error('权益审批列表加载失败，请重试') }
      } finally { if (request === this.listRequest) this.loading = false }
    },
    handleSearch() {
      if (this.queryForm.dateFrom && this.queryForm.dateTo && this.queryForm.dateFrom > this.queryForm.dateTo) return this.$message.warning('开始日期不能晚于结束日期')
      this.activeQuery = { ...this.queryForm, benefitCodes: [...this.queryForm.benefitCodes] }
      this.currentPage = 1
      return this.fetchTableData()
    },
    handleReset() { this.queryForm = newQuery(); this.benefitKeyword = ''; return this.handleSearch() },
    handleSizeChange(size) { this.pageSize = size; this.currentPage = 1; return this.fetchTableData() },
    handleCurrentChange(page) { this.currentPage = page; return this.fetchTableData() },
    handleApprove(row) {
      if (row.status !== 'PENDING' || this.submitLoading) return
      return this.openDetail(row, true)
    },
    handleView(row) { if (!this.submitLoading) return this.openDetail(row, false) },
    async openDetail(row, approve) {
      const request = ++this.detailRequest
      this.currentDetail = null; this.detailBenefits = []; this.approvalRemark = ''; this.opinionInvalid = false
      this.isApproveMode = false; this.dialogVisible = true; this.dialogLoading = true
      try {
        if (row.id == null) throw new Error('缺少申请ID')
        await this.resourcesPromise
        const res = await getBenefitAdjustDetailApi(row.id)
        if (request !== this.detailRequest || !this.dialogVisible) return
        const detail = res.data
        if (!detail || detail.id == null || String(detail.id) !== String(row.id)) throw new Error('申请数据不匹配')
        this.currentDetail = detail
        this.detailBenefits = (detail.benefitDetails || []).map(item => normalizeBenefit(item, this.catalog, this.identities, this.channels))
        this.isApproveMode = approve && detail.status === 'PENDING'
        this.approvalRemark = this.isApproveMode ? '' : detail.auditOpinion || ''
        if (approve && !this.isApproveMode) this.$message.warning('该申请已处理，当前展示最新审批结果')
      } catch (error) {
        if (request === this.detailRequest) { this.dialogVisible = false; this.$message.error('审批详情加载失败，请重试') }
      } finally { if (request === this.detailRequest) this.dialogLoading = false }
    },
    invalidateDetail() { this.detailRequest++; this.dialogLoading = false },
    beforeClose(done) { if (!this.submitLoading) done() },
    async handleAudit(result) {
      if (this.submitLoading || this.dialogLoading || !this.dialogVisible || !this.isApproveMode || !this.currentDetail || this.currentDetail.status !== 'PENDING' || this.currentDetail.id == null) return
      if (!['APPROVED', 'REJECTED'].includes(result)) return
      const opinion = this.approvalRemark.trim()
      if (result === 'REJECTED' && !opinion) {
        this.opinionInvalid = true
        this.$message.warning('驳回时审批意见为必填，请填写驳回原因')
        this.$nextTick(() => this.$refs.opinionInput.focus())
        return
      }
      const payload = { id: this.currentDetail.id, result, opinion }
      this.submitLoading = true
      this.submittingResult = result
      try {
        await passBenefitAdjustApi(payload)
        this.$message.success(result === 'APPROVED' ? '审批通过，权益已派发至客户' : '申请已驳回')
        this.dialogVisible = false
        this.isApproveMode = false
        if (this.tableData.length === 1 && this.currentPage > 1 && this.activeQuery.status === 'PENDING') this.currentPage--
        await this.fetchTableData()
      } catch (error) {
        this.$message.error('审批提交失败，请核对申请最新状态后重试')
      } finally { this.submitLoading = false; this.submittingResult = '' }
    },
    attachmentName(value) { return String(value || '').split('/').pop() },
    async downloadAttachment(filePath) {
      try {
        const res = await downloadAttachmentApi({ filePath, fileName: this.attachmentName(filePath) })
        const blob = res instanceof Blob ? res : new Blob([res])
        if (/json|text/.test(blob.type)) throw new Error('附件下载失败')
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url; link.download = this.attachmentName(filePath); link.click()
        URL.revokeObjectURL(url)
      } catch (error) { this.$message.error('附件下载失败，请检查文件服务后重试') }
    }
  }
}
</script>

<style scoped>
.benefit-approval { padding: 20px; color: #333a45; }
.page-heading { margin-bottom: 18px; }
.page-heading h2 { margin: 0 0 8px; font-size: 21px; font-weight: 600; }
.page-heading p { margin: 0; color: #5a6472; font-size: 13px; line-height: 20px; }
.search-card { margin-bottom: 16px; }
.query-form { display: flex; align-items: center; flex-wrap: wrap; gap: 12px 10px; }
.query-form .el-form-item { margin: 0; }
.query-form ::v-deep .el-input__inner { height: 40px; line-height: 40px; font-size: 14px; }
.query-form ::v-deep .el-input__icon { line-height: 40px; }
.query-medium, .query-dates .el-date-editor { width: 140px; }
.query-number { width: 160px; }
.query-org { width: 150px; }
.query-form .el-input.query-number ::v-deep .el-input__inner,
.query-form .el-input.query-medium ::v-deep .el-input__inner { height: 38px; line-height: 38px; }
.date-separator { padding: 0 8px; color: #5a6472; }
.query-actions .el-button { width: 62px; height: 36px; padding: 0; font-size: 14px; }
.query-actions .el-button + .el-button { margin-left: 8px; }
.benefit-filter { width: 190px; height: 32px; padding: 0 10px; font-size: 13px; text-align: left; }
.benefit-filter ::v-deep > span { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.benefit-filter ::v-deep > span > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.approval-benefit-options { max-height: 260px; overflow: auto; margin-top: 12px; }
.approval-benefit-options .el-checkbox { display: block; margin: 0 0 10px; }
.filter-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #edf0f5; color: #5a6472; font-size: 12px; }
.main-card ::v-deep .el-card__header { padding: 13px 18px; }
.card-title { font-size: 15px; font-weight: 600; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 16px; }
.status-badge { display: inline-block; padding: 2px 12px; border-radius: 12px; line-height: 18px; font-size: 12px; }
.PENDING { background: #fdf3e7; color: #e67e22; }
.APPROVED { background: #e8f5e9; color: #2e7d32; }
.REJECTED { background: #fdecea; color: #c62828; }
.detail-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin-bottom: 24px; font-size: 14px; }
.detail-fields > div { display: flex; align-items: baseline; gap: 10px; line-height: 20px; overflow-wrap: anywhere; }
.detail-fields span { flex-shrink: 0; color: #5a6472; font-size: 13px; }
.detail-fields strong { color: #333a45; font-weight: 600; }
.section-title { margin-top: 28px; }
.section-divider { border: 0; border-top: 1px dashed #e0e4ea; margin: 18px 0; }
.section-divider + .section-title { margin-top: 0; }
.detail-text { color: #333a45; font-size: 14px; line-height: 22px; white-space: pre-wrap; overflow-wrap: anywhere; }
.attachment-link { padding: 0; font-size: 14px; }
.sub-hint { margin-left: 6px; color: #98a1ad; font-size: 12px; font-weight: 400; }
.review-result { margin: 12px 0; }
.approval-opinion ::v-deep .el-textarea__inner { min-height: 78px !important; font-size: 14px; line-height: 20px; padding: 8px 10px; color: #333a45; }
.approval-opinion.has-error ::v-deep .el-textarea__inner { border-color: #c62828; }
.reject-button { color: #c62828; border-color: #c62828; }
.reject-button:hover, .reject-button:focus { background: #fdecea; color: #c62828; border-color: #c62828; }
::v-deep .benefit-approval-dialog { display: flex; flex-direction: column; max-height: 92vh; max-width: calc(100vw - 32px); }
::v-deep .benefit-approval-dialog .el-dialog__body { height: auto; min-height: 0; overflow-y: auto; padding: 18px; }
::v-deep .benefit-approval-dialog .el-dialog__header,
::v-deep .benefit-approval-dialog .el-dialog__footer { flex-shrink: 0; }
::v-deep .approval-readonly .el-dialog__footer { display: none; }
</style>
