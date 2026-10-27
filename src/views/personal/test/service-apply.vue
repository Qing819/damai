<template>
  <div class="page-container benefit-apply">
    <div class="page-heading">
      <div>
        <h2>{{ inWorkbench ? '权益调整工作台' : '权益调整申请' }}</h2>
        <p>{{ inWorkbench ? '支持业务人员对客户服务权益进行人工调整，所有操作记录完整轨迹与原因' : '我的权益调整申请记录；待审核、已通过的申请可查看申请内容与审批信息，已驳回的申请可修改后重新提交或删除' }}</p>
      </div>
      <el-button v-if="inWorkbench" size="medium" @click="returnToList">返回权益调整申请列表</el-button>
    </div>

    <template v-if="!inWorkbench">
      <el-card shadow="never" class="search-card">
        <el-form :inline="true" class="query-form" @submit.native.prevent="handleSearch">
          <el-form-item><el-select v-model="queryForm.idType" placeholder="全部证件类型" clearable class="query-medium"><el-option v-for="item in idTypes" :key="item" :label="formatIdType(item)" :value="item" /></el-select></el-form-item>
          <el-form-item><el-input v-model="queryForm.idNo" placeholder="证件号码" clearable class="query-number" /></el-form-item>
          <el-form-item><el-input v-model="queryForm.custName" placeholder="客户名称" clearable class="query-medium" /></el-form-item>
          <el-form-item><el-input v-model="queryForm.custId" placeholder="客户号" clearable class="query-medium" /></el-form-item>
          <el-form-item><el-select v-model="queryForm.orgName" placeholder="全部服务归属机构" clearable class="query-org"><el-option v-for="item in orgs" :key="item" :label="item" :value="item" /></el-select></el-form-item>
          <el-form-item class="query-dates">
            <el-date-picker v-model="queryForm.dateFrom" type="date" value-format="yyyy-MM-dd" placeholder="开始日期" />
            <span class="date-separator">~</span>
            <el-date-picker v-model="queryForm.dateTo" type="date" value-format="yyyy-MM-dd" placeholder="结束日期" />
          </el-form-item>
          <el-form-item>
            <el-popover placement="bottom-start" width="290" trigger="click">
              <el-input v-model="benefitKeyword" size="small" placeholder="搜索服务权益ID / 名称" clearable />
              <div class="filter-benefits">
                <el-checkbox :value="allFilterSelected" :indeterminate="queryForm.benefitCodes.length > 0 && !allFilterSelected" @change="toggleAllBenefits">全部</el-checkbox>
                <el-checkbox-group v-model="queryForm.benefitCodes">
                  <el-checkbox v-for="item in filteredBenefits" :key="item.benefitCode" :label="item.benefitCode">{{ item.benefitCode }} {{ item.benefitName }}</el-checkbox>
                </el-checkbox-group>
              </div>
              <div class="filter-footer">已选 {{ queryForm.benefitCodes.length }} 项 <el-button type="text" @click="queryForm.benefitCodes = []">清空</el-button></div>
              <el-button slot="reference" class="benefit-filter"><span>{{ selectedBenefitNames }}</span><i class="el-icon-arrow-down" /></el-button>
            </el-popover>
          </el-form-item>
          <el-form-item><el-select v-model="queryForm.status" placeholder="全部状态" clearable class="query-medium"><el-option v-for="item in statuses" :key="item" :label="statusText(item)" :value="item" /></el-select></el-form-item>
          <el-form-item class="query-actions"><el-button type="primary" native-type="submit">查询</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
        </el-form>
        <div v-if="hasSearched && customerOptions.length > 1" class="list-customer-filter">
          <span>查询到 <b>{{ customerOptions.length }}</b> 位客户，请选择要查看的客户</span>
          <el-popover v-model="listCustomerPickerVisible" placement="bottom-start" width="528" trigger="click">
            <div class="list-customer-row list-customer-header"><span>姓名</span><span>证件类型</span><span>证件号</span><span>客户号</span></div>
            <div :class="['list-customer-row', { 'candidate-selected': !listCustomerId }]" role="button" tabindex="0" @click="selectListCustomer('')" @keydown.enter="selectListCustomer('')"><span>全部客户</span><span>—</span><span>—</span><span>{{ customerOptions.length }} 位</span></div>
            <div v-for="item in customerOptions" :key="item.custId" :class="['list-customer-row', { 'candidate-selected': listCustomerId === item.custId }]" role="button" tabindex="0" @click="selectListCustomer(item.custId)" @keydown.enter="selectListCustomer(item.custId)"><span>{{ item.custName || '—' }}</span><span>{{ formatIdType(item.idType) }}</span><span>{{ item.idNo || '—' }}</span><span>{{ item.custId }}</span></div>
            <el-button slot="reference" class="list-customer-button">{{ listCustomerLabel }} <i class="el-icon-arrow-down" /></el-button>
          </el-popover>
        </div>
      </el-card>
      <div class="action-bar"><el-button type="primary" size="medium" @click="openWorkbench">＋ 新增权益调整</el-button></div>
      <el-card shadow="never" class="main-card">
        <div slot="header" class="card-title">我的申请记录</div>
        <el-table v-loading="loading" :data="tableData" border stripe>
          <el-table-column label="客户" min-width="155"><template slot-scope="{ row }">{{ customerText(row) }}</template></el-table-column>
          <el-table-column label="证件类型" width="110"><template slot-scope="{ row }">{{ formatIdType(row.idType) }}</template></el-table-column>
          <el-table-column prop="idNo" label="证件号码" min-width="170" />
          <el-table-column prop="orgName" label="服务归属机构" min-width="130" />
          <el-table-column label="服务权益ID" min-width="130"><template slot-scope="{ row }">{{ separated(row.benefitCodes) }}</template></el-table-column>
          <el-table-column prop="benefitNames" label="调整权益" min-width="160" show-overflow-tooltip />
          <el-table-column prop="reasonName" label="调整原因" min-width="120" />
          <el-table-column label="关联保单号" min-width="130"><template slot-scope="{ row }">{{ row.policyNo || '—' }}</template></el-table-column>
          <el-table-column prop="oaNo" label="OA流水号" min-width="150" />
          <el-table-column label="申请人" width="90"><template slot-scope="{ row }">{{ row.applicant || '—' }}</template></el-table-column>
          <el-table-column label="申请时间" min-width="160"><template slot-scope="{ row }">{{ formatTime(row.applyTime) }}</template></el-table-column>
          <el-table-column label="状态" width="90"><template slot-scope="{ row }"><span :class="['status-badge', row.status]">{{ statusText(row.status) }}</span></template></el-table-column>
          <el-table-column label="操作" width="150" fixed="right"><template slot-scope="{ row }">
            <el-button type="text" size="small" @click="handleView(row)">查看</el-button>
            <template v-if="row.status === 'REJECTED'"><span class="operation-divider">|</span><el-button type="text" size="small" @click="handleEdit(row)">编辑</el-button><span class="operation-divider">|</span><el-button type="text" size="small" class="danger-button" @click="handleDelete(row)">删除</el-button></template>
          </template></el-table-column>
        </el-table>
        <div class="pagination-container"><el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange" @current-change="handleCurrentChange" /></div>
      </el-card>
    </template>

    <template v-else>
      <el-card shadow="never" class="workspace-card">
        <div slot="header" class="card-title">客户查询区</div>
        <div class="customer-search" v-loading="customerLoading">
          <span>客户号 / 姓名 / 证件号</span>
          <div class="customer-picker">
            <el-input v-model="customerKeyword" @input="searchCustomers" />
            <div v-if="showCandidates" class="customer-candidates">
              <div class="candidate-row candidate-header"><span>姓名</span><span>客户号</span><span>证件类型</span><span>证件号</span></div>
              <div v-for="item in candidates" :key="item.custId" :class="['candidate-row', { 'candidate-selected': selectedCustomer && selectedCustomer.custId === item.custId }]" role="button" tabindex="0" @click="selectedCustomer = item" @keydown.enter="selectedCustomer = item">
                <span>{{ item.custName || '—' }}</span><span>{{ item.custId }}</span><span>{{ formatIdType(item.idType) }}</span><span>{{ item.idNo || '—' }}</span>
              </div>
              <div v-if="!candidates.length" class="candidate-empty">{{ searching ? '查询中…' : '暂无匹配客户' }}</div>
              <div class="candidate-footer"><span>{{ selectedCustomer ? `已选择：${customerText(selectedCustomer)}` : '请选择一位客户，选中后点击「确认」带入' }}</span><el-button type="primary" size="small" :disabled="!selectedCustomer || searching" @click="confirmCustomer">确认</el-button></div>
            </div>
          </div>
          <el-button size="medium" @click="clearCustomer">清空</el-button>
          <span class="muted">边输边查，下拉中选中客户后点击「确认」带入</span>
        </div>
      </el-card>
      <template v-if="customer">
        <el-card shadow="never" class="workspace-card">
          <div slot="header" class="card-title">客户基本信息</div>
          <div class="customer-grid"><div v-for="field in customerFields" :key="field[0]">
            <span>{{ field[0] }}</span>
            <template v-if="field[0] === '当前权益数'"><strong class="benefit-total">{{ currentBenefits.length }}</strong><span class="benefit-unit">项</span></template>
            <span v-else-if="field[0] === '客户等级'" class="status-badge APPROVED">{{ field[1] }}</span>
            <strong v-else>{{ field[1] }}</strong>
          </div></div>
        </el-card>
        <el-card shadow="never" class="workspace-card">
          <div slot="header" class="card-title">权益现状 <small>当前等级对应权益及使用情况；已用尽的权益只要未到失效时间同样展示</small></div>
          <el-table :data="currentBenefits" border>
            <el-table-column prop="benefitCode" label="服务权益ID" min-width="110" /><el-table-column prop="benefitName" label="服务项目" min-width="150" />
            <el-table-column prop="grant" label="可使用次数" min-width="110" /><el-table-column prop="used" label="已使用次数" min-width="110" /><el-table-column prop="remain" label="剩余次数" min-width="100" />
            <el-table-column prop="grantTime" label="获得时间" min-width="150" /><el-table-column prop="validTo" label="失效时间" min-width="120" />
          </el-table>
        </el-card>
        <el-card shadow="never" class="workspace-card">
          <div slot="header" class="card-title">权益轨迹 <small>该客户权益动作记录</small></div>
          <el-table :data="traces" border>
            <el-table-column label="权益动作" min-width="115"><template slot-scope="{ row }">{{ actionText(row.action) }}</template></el-table-column>
            <el-table-column prop="benefitCode" label="服务权益ID" min-width="110" /><el-table-column prop="benefitName" label="权益名称" min-width="140" /><el-table-column prop="supplier" label="服务供应商" min-width="140" /><el-table-column prop="kind" label="服务种类" min-width="100" />
            <el-table-column prop="validTo" label="有效期" min-width="110" /><el-table-column label="动作时间" min-width="155"><template slot-scope="{ row }">{{ formatTime(row.actionTime) }}</template></el-table-column>
            <el-table-column label="次数" width="75"><template slot-scope="{ row }">{{ signedCount(row.countChange) }}</template></el-table-column>
            <el-table-column label="已使用/剩余" min-width="115"><template slot-scope="{ row }">{{ count(row.usedCount) }} / {{ traceRemain(row) }}</template></el-table-column>
            <el-table-column label="次数状态" width="90"><template slot-scope="{ row }">{{ countStatus(row.countStatus) }}</template></el-table-column>
          </el-table>
          <div class="trace-total">共 {{ traces.length }} 条</div>
        </el-card>
        <el-card shadow="never" class="workspace-card">
          <div slot="header" class="card-title">权益调整操作区</div>
          <benefit-adjust-form :form="applyForm" :catalog="catalog" :regions="regions" :identities="identities" :channels="channels" :uploading="uploading" @file-change="uploadFile($event, applyForm)" />
          <el-button type="primary" size="medium" :disabled="uploading" @click="openConfirmation">提交调整</el-button><el-button size="medium" :disabled="uploading" @click="resetAdjustment">重置</el-button>
          <p class="muted submit-hint">提交前弹窗二次确认，展示客户姓名、调整权益及调整原因；确认提交后自动返回权益调整申请列表</p>
        </el-card>
      </template>
    </template>

    <el-dialog title="申请详情" :visible.sync="detailVisible" width="1040px" top="4vh" custom-class="benefit-detail-dialog" append-to-body :close-on-click-modal="false">
      <div v-loading="detailLoading">
        <template v-if="currentDetail">
          <div class="section-title">申请内容</div>
          <div class="detail-fields"><div v-for="field in detailFields" :key="field[0]"><span>{{ field[0] }}</span><strong>{{ field[1] }}</strong></div></div>
          <div class="section-title">调整权益</div>
          <benefit-adjust-rights :value="detailBenefits" :catalog="catalog" :identities="identities" :channels="channels" :valid-end-date="currentDetail.validEndDate" readonly />
          <div class="section-title">详细说明</div><div class="detail-text">{{ currentDetail.remark || '—' }}</div>
          <div class="section-title">附件</div><el-button v-if="currentDetail.attachment" type="text" @click="downloadAttachment(currentDetail.attachment)">{{ attachmentName(currentDetail.attachment) }}</el-button><span v-else>—</span>
          <div class="section-title">审批信息</div>
          <p v-if="currentDetail.status === 'PENDING'" class="muted">该申请尚未完成审批，暂无审批结果。</p>
          <template v-else>
            <div class="detail-fields approval-fields"><div><span>审批结果</span><strong>{{ statusText(currentDetail.status) }}</strong></div><div><span>审批人</span><strong>{{ currentDetail.auditor || '—' }}</strong></div><div><span>审批时间</span><strong>{{ formatTime(currentDetail.auditTime) }}</strong></div></div>
            <div class="section-title">审批意见</div><div class="detail-text">{{ currentDetail.auditOpinion || '—' }}</div>
          </template>
        </template>
      </div>
      <div slot="footer"><el-button size="medium" @click="detailVisible = false">关闭</el-button></div>
    </el-dialog>

    <el-dialog title="编辑申请" :visible.sync="editVisible" width="1280px" top="0" custom-class="benefit-edit-dialog" append-to-body :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" :before-close="closeEdit">
      <p class="edit-customer">申请单号：<strong>{{ editForm.applyNo }}</strong><span>客户：<strong>{{ customerText(editForm) }}</strong></span></p>
      <benefit-adjust-form :form="editForm" :catalog="catalog" :regions="regions" :identities="identities" :channels="channels" :uploading="uploading" editing @file-change="uploadFile($event, editForm)" />
      <div slot="footer"><el-button size="medium" :disabled="submitting" @click="editVisible = false">取消</el-button><el-button type="primary" size="medium" :loading="submitting" :disabled="uploading" @click="saveEdit">保存并重新提交</el-button></div>
    </el-dialog>
    <el-dialog title="确认调整" :visible.sync="confirmVisible" width="520px" append-to-body :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" :before-close="closeConfirmation" custom-class="benefit-confirm-dialog">
      <div v-for="field in confirmationFields" :key="field[0]" class="confirmation-field"><span>{{ field[0] }}</span><strong>{{ field[1] }}</strong></div>
      <div slot="footer"><el-button size="medium" :disabled="submitting" @click="confirmVisible = false">取消</el-button><el-button type="primary" size="medium" :loading="submitting" @click="submitConfirmed">确认提交</el-button></div>
    </el-dialog>
  </div>
</template>

<script>
import {
  serviceAdjustApplyApi, getBenefitAdjustPageApi, benefitAdjustModifyApi, deleteBenefitAdjustApi,
  getBenefitAdjustWorkbenchApi, getBenefitAdjustDetailApi, getBenefitItemsApi,
  getPlatformOrgApi, getPlatformIdTypesApi, getServiceRuleIdentitiesApi, getPlatformOrderChannelApi
} from '@/api/test'
import { searchCustomerProfileApi, uploadAttachmentApi, downloadAttachmentApi } from '@/api/test/point'
import BenefitAdjustRights from './components/benefit-adjust-rights'
import BenefitAdjustForm from './components/benefit-adjust-form'
import { newForm, normalizeBenefit, formatIdType, formatGrade, formatTime, statusText, flag, payloadFor, validateForm, reasons } from './benefit-adjust-model'

function newQuery() {
  return { idType: '', idNo: '', custName: '', custId: '', orgName: '', dateFrom: '', dateTo: '', benefitCodes: [], status: '' }
}
export default {
  name: 'BenefitAdjustmentApply',
  components: { BenefitAdjustRights, BenefitAdjustForm },
  data() {
    return {
      queryForm: newQuery(), activeQuery: newQuery(), statuses: ['PENDING', 'APPROVED', 'REJECTED'],
      hasSearched: false, allMatchingRows: [], listCustomerId: '', listCustomerPickerVisible: false,
      benefitKeyword: '', catalog: [], orgs: [], idTypes: [], identities: [], channels: [],
      tableData: [], total: 0, pageSize: 10, currentPage: 1, loading: false, listRequest: 0,
      customerKeyword: '', candidates: [], selectedCustomer: null, customer: null,
      showCandidates: false, searching: false, customerLoading: false, customerRequest: 0,
      currentBenefits: [], traces: [], applyForm: newForm(), editForm: newForm(),
      detailVisible: false, detailLoading: false, currentDetail: null, detailBenefits: [],
      editVisible: false, confirmVisible: false, submitting: false, uploading: false,
      confirmation: null, resourcesPromise: null, detailRequest: 0
    }
  },
  computed: {
    inWorkbench() { return this.$route.query.view === 'workbench' },
    regions() { return Array.from(new Set(['全国', ...this.orgs])) },
    filteredBenefits() {
      const keyword = this.benefitKeyword.trim().toLowerCase()
      return this.catalog.filter(item => `${item.benefitCode} ${item.benefitName}`.toLowerCase().includes(keyword))
    },
    allFilterSelected() { return this.catalog.length > 0 && this.catalog.every(item => this.queryForm.benefitCodes.includes(item.benefitCode)) },
    selectedBenefitNames() {
      return this.queryForm.benefitCodes.map(code => {
        const item = this.catalog.find(value => value.benefitCode === code)
        return item ? item.benefitName : code
      }).join('、') || '全部调整权益'
    },
    customerOptions() { return Array.from(new Map(this.allMatchingRows.map(row => [row.custId, row])).values()) },
    listCustomerLabel() {
      const customer = this.customerOptions.find(item => item.custId === this.listCustomerId)
      return customer ? this.customerText(customer) : `全部客户（${this.customerOptions.length} 位）`
    },
    customerFields() {
      const c = this.customer || {}
      return [['客户号', c.custId], ['客户姓名', c.custName || '—'], ['证件类型', formatIdType(c.idType)], ['证件号', c.idNo || '—'], ['客户等级', formatGrade(c.currentGrade || c.gradeCode)], ['服务归属机构', c.orgName || '—'], ['当前权益数', `${this.currentBenefits.length} 项`]]
    },
    detailFields() {
      const d = this.currentDetail || {}
      return [['申请单号', d.applyNo || '—'], ['客户', this.customerText(d)], ['证件类型', formatIdType(d.idType)], ['证件号码', d.idNo || '—'], ['服务归属机构', d.orgName || '—'], ['调整原因', d.reasonName || '—'], ['关联保单号', d.policyNo || '—'], ['OA流水号', d.oaNo || '—'], ['申请时间', formatTime(d.applyTime)], ['申请人', d.applicant || '—']]
    },
    confirmationFields() {
      if (!this.confirmation) return []
      const c = this.confirmation
      return [['客户姓名', c.custName || '—'], ['调整权益', c.benefitNames], ['权益有效期', c.payload.validEndDate], ['关联保单号', c.payload.policyNo || '—'], ['OA流水号', c.payload.oaNo], ['调整原因', c.payload.reasonName]]
    }
  },
  watch: {
    '$route.query.view'() {
      this.clearCustomer()
      if (!this.inWorkbench) this.fetchList()
    }
  },
  created() {
    this.resourcesPromise = this.loadResources()
    if (!this.inWorkbench) this.fetchList()
  },
  beforeDestroy() { this.listRequest++; this.customerRequest++; this.detailRequest++ },
  methods: {
    formatIdType, formatTime, statusText,
    customerText(row) { return `${row.custName || '—'}（${row.custId || '—'}）` },
    separated(value) { return String(value || '—').split(',').join('、') },
    count(value) { return value == null ? '—' : value },
    signedCount(value) { return value == null ? '—' : Number(value) > 0 ? `+${value}` : String(value) },
    actionText(value) { return { GRADE_CHANGE: '等级变动调整', DEDUCT_ROLLBACK: '消减回退', USE_DEDUCT: '使用消减', MANUAL_ADJUST: '人工调整', TRANSFER_IN: '转入', TRANSFER_OUT: '转出' }[value] || value || '—' },
    countStatus(value) { return { NORMAL: '正常', EXHAUSTED: '已用尽', USED_UP: '已用尽', EXPIRED: '已失效', TRANSFERRED: '已转出' }[value] || value || '—' },
    traceRemain(row) {
      const benefit = this.currentBenefits.find(item => item.benefitCode === row.benefitCode)
      return row.remainCount == null && benefit && benefit.unlimited ? '不限' : this.count(row.remainCount)
    },
    async loadResources() {
      const results = await Promise.allSettled([getBenefitItemsApi(), getPlatformOrgApi(), getPlatformIdTypesApi(), getServiceRuleIdentitiesApi(), getPlatformOrderChannelApi()])
      const names = ['catalog', 'orgs', 'idTypes', 'identities', 'channels']
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = result.value.data
          this[names[index]] = Array.isArray(data) ? data : (data && data.list) || []
        }
      })
      if (results.some(result => result.status === 'rejected')) this.$message.error('部分筛选或权益字典加载失败，请刷新后重试')
    },
    toggleAllBenefits(checked) { this.queryForm.benefitCodes = checked ? this.catalog.map(item => item.benefitCode) : [] },
    queryParams() {
      return Object.fromEntries(Object.entries(this.activeQuery)
        .filter(([key, value]) => key !== 'benefitCodes' && value !== '' && value != null)
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))
    },
    async fetchAllForBenefit(params, benefitCode) {
      const rows = []
      for (let pageNum = 1; ; pageNum++) {
        const res = await getBenefitAdjustPageApi({ ...params, ...benefitCode ? { benefitCode } : {}, pageNum, pageSize: 100 })
        const page = res.data
        const batch = page.list || []
        rows.push(...batch)
        if (!batch.length || rows.length >= Number(page.total)) return rows
      }
    },
    async fetchList() {
      const request = ++this.listRequest
      this.loading = true
      try {
        const params = this.queryParams()
        const codes = this.activeQuery.benefitCodes
        let rows, total
        if (this.hasSearched || codes.length > 1) {
          const groups = await Promise.all((codes.length ? codes : [null]).map(code => this.fetchAllForBenefit(params, code)))
          const merged = Array.from(new Map([].concat(...groups).map(row => [row.id, row])).values())
            .sort((a, b) => String(b.applyTime).localeCompare(String(a.applyTime)) || Number(b.id) - Number(a.id))
          if (request !== this.listRequest) return
          this.allMatchingRows = merged
          if (!merged.some(row => row.custId === this.listCustomerId)) this.listCustomerId = ''
          const selected = this.listCustomerId ? merged.filter(row => row.custId === this.listCustomerId) : merged
          total = selected.length
          rows = selected.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize)
        } else {
          const res = await getBenefitAdjustPageApi({ ...params, ...codes.length ? { benefitCode: codes[0] } : {}, pageNum: this.currentPage, pageSize: this.pageSize })
          rows = res.data.list || []
          total = Number(res.data.total) || 0
        }
        if (request !== this.listRequest) return
        this.tableData = rows
        this.total = total
      } catch (error) {
        if (request === this.listRequest) { this.tableData = []; this.allMatchingRows = []; this.total = 0; this.$message.error('申请记录加载失败，请重试') }
      } finally { if (request === this.listRequest) this.loading = false }
    },
    handleSearch() {
      if (this.queryForm.dateFrom && this.queryForm.dateTo && this.queryForm.dateFrom > this.queryForm.dateTo) return this.$message.warning('开始日期不能晚于结束日期')
      this.activeQuery = { ...this.queryForm, benefitCodes: [...this.queryForm.benefitCodes] }
      this.hasSearched = true
      this.listCustomerId = ''
      this.currentPage = 1
      return this.fetchList()
    },
    handleReset() {
      this.queryForm = newQuery(); this.activeQuery = newQuery(); this.benefitKeyword = ''
      this.hasSearched = false; this.allMatchingRows = []; this.listCustomerId = ''; this.listCustomerPickerVisible = false
      this.currentPage = 1
      return this.fetchList()
    },
    paginateMatches() {
      const rows = this.listCustomerId ? this.allMatchingRows.filter(row => row.custId === this.listCustomerId) : this.allMatchingRows
      this.total = rows.length
      this.tableData = rows.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize)
    },
    selectListCustomer(id) { this.listCustomerId = id; this.listCustomerPickerVisible = false; this.currentPage = 1; this.paginateMatches() },
    handleSizeChange(size) { this.pageSize = size; this.currentPage = 1; return this.hasSearched ? this.paginateMatches() : this.fetchList() },
    handleCurrentChange(page) { this.currentPage = page; return this.hasSearched ? this.paginateMatches() : this.fetchList() },
    openWorkbench() { this.$router.push({ path: this.$route.path, query: { view: 'workbench' } }) },
    returnToList() { this.$router.push({ path: this.$route.path, query: {} }) },
    clearCustomer() {
      this.customerRequest++
      this.customerKeyword = ''; this.candidates = []; this.selectedCustomer = null
      this.customer = null; this.currentBenefits = []; this.traces = []
      this.showCandidates = false; this.searching = false; this.customerLoading = false
      this.applyForm = newForm()
    },
    async searchCustomers(keyword) {
      this.clearCustomer()
      this.customerKeyword = keyword
      if (!keyword.trim()) return
      const request = this.customerRequest
      this.showCandidates = true; this.searching = true
      try {
        const res = await searchCustomerProfileApi(keyword.trim())
        if (request === this.customerRequest) this.candidates = res.data || []
      } catch (error) {
        if (request === this.customerRequest) this.$message.error('客户查询失败，请重试')
      } finally { if (request === this.customerRequest) this.searching = false }
    },
    async confirmCustomer() {
      if (!this.selectedCustomer || this.customerLoading) return
      const selected = this.selectedCustomer
      const request = ++this.customerRequest
      this.customerLoading = true
      try {
        const res = await getBenefitAdjustWorkbenchApi(selected.custId)
        if (request !== this.customerRequest) return
        const data = res.data
        if (!data || !data.customer || String(data.customer.custId) !== String(selected.custId)) throw new Error('客户数据不匹配')
        this.customer = data.customer
        this.currentBenefits = (data.currentBenefits || []).map(item => {
          const unlimited = flag(item.unlimited)
          return {
            benefitCode: item.benefitCode || item.benefit_code, benefitName: item.benefitName || item.benefit_name,
            unlimited, grant: unlimited ? '不限' : this.count(item.grant_sum == null ? item.grant_count : item.grant_sum),
            used: this.count(item.used_sum == null ? item.used_count : item.used_sum),
            remain: unlimited ? '不限' : this.count(item.remain_sum == null ? item.remain_count : item.remain_sum),
            grantTime: formatTime(item.grantTime || item.grant_time), validTo: item.validTo || item.valid_to || '—'
          }
        })
        this.traces = data.traces || []
        this.customerKeyword = this.customerText(this.customer)
        this.showCandidates = false
        this.resetAdjustment()
      } catch (error) {
        if (request === this.customerRequest) this.$message.error('客户权益信息加载失败，请重试')
      } finally { if (request === this.customerRequest) this.customerLoading = false }
    },
    resetAdjustment() { this.applyForm = { ...newForm(), custId: this.customer ? this.customer.custId : '' } },
    async readDetail(row) {
      if (row.id == null) throw new Error('缺少申请ID')
      await this.resourcesPromise
      const res = await getBenefitAdjustDetailApi(row.id)
      if (!res.data || res.data.id == null) throw new Error('申请详情为空')
      return res.data
    },
    normalizedDetails(detail) { return (detail.benefitDetails || []).map(item => normalizeBenefit(item, this.catalog, this.identities, this.channels)) },
    async handleView(row) {
      const request = ++this.detailRequest
      this.currentDetail = null; this.detailBenefits = []; this.detailVisible = true; this.detailLoading = true
      try {
        const detail = await this.readDetail(row)
        if (request !== this.detailRequest) return
        this.currentDetail = detail
        this.detailBenefits = this.normalizedDetails(detail)
      } catch (error) {
        if (request === this.detailRequest) { this.detailVisible = false; this.$message.error('申请详情加载失败，请重试') }
      } finally { if (request === this.detailRequest) this.detailLoading = false }
    },
    async handleEdit(row) {
      if (row.status !== 'REJECTED') return
      try {
        const detail = await this.readDetail(row)
        if (detail.status !== 'REJECTED') return this.$message.warning('仅已驳回的申请可以编辑，请刷新列表')
        const reason = reasons.find(item => item.name === detail.reasonName)
        this.editForm = {
          ...newForm(), ...detail, reasonCode: detail.reasonCode || (reason ? reason.code : ''),
          attachmentName: this.attachmentName(detail.attachment), selectedBenefits: this.normalizedDetails(detail)
        }
        this.editVisible = true
      } catch (error) { this.$message.error('编辑内容加载失败，请重试') }
    },
    async handleDelete(row) {
      if (row.status !== 'REJECTED') return
      try {
        await this.$confirm(`确定删除申请 ${row.applyNo} 吗？`, '删除申请', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
        await deleteBenefitAdjustApi(row.id)
        this.$message.success('删除成功')
        if (this.tableData.length === 1 && this.currentPage > 1) this.currentPage--
        await this.fetchList()
      } catch (error) { if (error !== 'cancel' && error !== 'close') this.$message.error('删除失败，请重试') }
    },
    openConfirmation() {
      if (this.uploading || this.submitting) return
      const form = this.applyForm
      const error = validateForm(form)
      if (error) return this.$message.warning(error)
      this.confirmation = {
        payload: payloadFor(form),
        custName: this.customer.custName,
        benefitNames: form.selectedBenefits.map(item => item.benefitName).join('、')
      }
      this.confirmVisible = true
    },
    saveEdit() {
      if (this.uploading || this.submitting) return
      const error = validateForm(this.editForm)
      if (error) return this.$message.warning(error)
      return this.submitApplication(payloadFor(this.editForm, true), true)
    },
    closeEdit(done) { if (!this.submitting) done() },
    closeConfirmation(done) { if (!this.submitting) done() },
    async submitConfirmed() {
      if (this.submitting || !this.confirmation || !this.confirmVisible) return
      return this.submitApplication(this.confirmation.payload, false)
    },
    async submitApplication(payload, editing) {
      if (this.submitting) return
      this.submitting = true
      try {
        await (editing ? benefitAdjustModifyApi(payload) : serviceAdjustApplyApi(payload))
        this.$message.success(editing ? '已保存并重新提交' : '权益调整申请提交成功')
        this.confirmVisible = false; this.editVisible = false; this.confirmation = null
        this.currentPage = 1
        if (this.inWorkbench) this.returnToList()
        else await this.fetchList()
      } catch (error) { this.$message.error('提交失败，请重试') } finally { this.submitting = false }
    },
    attachmentName(value) { return String(value || '').split('/').pop() },
    async uploadFile(file, form) {
      if (this.uploading) return
      if (!/\.(jpe?g|png|pdf)$/i.test(file.name)) return this.$message.warning('附件仅支持 jpg / png / pdf')
      if (file.size > 5 * 1024 * 1024) return this.$message.warning('附件大小不能超过5MB')
      this.uploading = true
      try {
        const body = new FormData()
        body.append('file', file)
        const res = await uploadAttachmentApi(body)
        if (!res.data || !res.data.filePath) throw new Error('附件上传未返回路径')
        form.attachment = res.data.filePath
        form.attachmentName = res.data.fileName || file.name
      } catch (error) { this.$message.error('附件上传失败，请检查文件服务后重试') } finally { this.uploading = false }
    },
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
.benefit-apply { padding: 20px; color: #333a45; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.page-heading h2 { margin: 0 0 8px; font-size: 21px; font-weight: 600; }
.page-heading p { margin: 0; font-size: 13px; color: #5a6472; line-height: 20px; }
.query-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 10px; }
.query-form .el-form-item { margin: 0; }
.query-form ::v-deep .el-input__inner { height: 40px; line-height: 40px; font-size: 14px; }
.query-form ::v-deep .el-input__icon { line-height: 40px; }
.query-form .query-number { width: 160px; }
.query-form .query-medium, .query-dates .el-date-editor { width: 140px; }
.query-form .query-org { width: 150px; }
.query-form .el-input.query-number ::v-deep .el-input__inner,
.query-form .el-input.query-medium ::v-deep .el-input__inner { height: 38px; line-height: 38px; }
.date-separator { padding: 0 8px; color: #5a6472; }
.query-actions .el-button { width: 62px; height: 36px; padding: 0; font-size: 14px; }
.query-actions .el-button + .el-button { margin-left: 8px; }
.benefit-filter { width: 190px; height: 32px; padding: 0 10px; font-size: 13px; text-align: left; }
.benefit-filter ::v-deep > span { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.benefit-filter ::v-deep > span > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.benefit-filter i { float: right; margin-top: 2px; }
.list-customer-filter { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 14px; font-size: 13px; color: #5a6472; }
.list-customer-button { width: 250px; height: 35px; padding: 7px 12px; text-align: left; font-size: 13px; }
.list-customer-button i { float: right; }
.list-customer-row { display: grid; grid-template-columns: 84px 100px minmax(0, 178px) 118px; padding: 8px 12px; font-size: 13px; cursor: pointer; }
.list-customer-header { color: #98a1ad; font-size: 12px; background: #f2f4f7; cursor: default; }
.list-customer-row.candidate-selected { color: #2f5496; background: #ebf1fa; font-weight: 600; }
.filter-benefits { max-height: 260px; overflow: auto; margin-top: 12px; }
.filter-benefits .el-checkbox { display: block; margin: 0 0 10px; }
.filter-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #edf0f5; color: #5a6472; font-size: 12px; }
.action-bar { margin: 16px 0; }
.card-title { font-size: 15px; font-weight: 600; }
.main-card ::v-deep .el-card__header, .workspace-card ::v-deep .el-card__header { padding: 13px 18px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 16px; }
.operation-divider { padding: 0 5px; color: #cfd5df; }
.danger-button { color: #c62828; }
.status-badge { display: inline-block; padding: 2px 12px; border-radius: 12px; line-height: 18px; font-size: 12px; }
.PENDING { background: #fdf3e7; color: #e67e22; }
.APPROVED { background: #e8f5e9; color: #2e7d32; }
.REJECTED { background: #fdecea; color: #c62828; }
.workspace-card { margin-bottom: 18px; overflow: visible; }
.workspace-card small { margin-left: 10px; font-size: 12px; font-weight: 400; color: #98a1ad; }
.customer-search { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 14px; }
.customer-picker { position: relative; width: 280px; max-width: 100%; }
.customer-picker ::v-deep .el-input__inner { height: 38px; line-height: 38px; font-size: 14px; padding: 8px 10px; }
.customer-candidates { position: absolute; z-index: 100; top: 44px; left: 0; width: 560px; max-width: calc(100vw - 80px); background: #fff; border: 1px solid #dce2ea; border-radius: 6px; box-shadow: 0 8px 24px #1f29371a; }
.candidate-row { display: grid; grid-template-columns: 92px 124px 108px minmax(0, 1fr); gap: 8px; padding: 8px 12px; border-bottom: 1px solid #edf0f5; cursor: pointer; font-size: 13px; overflow-wrap: anywhere; }
.candidate-header { background: #f2f4f7; color: #98a1ad; cursor: default; font-size: 12px; }
.candidate-row:not(.candidate-header):hover { background: #f7f9fc; }
.candidate-row.candidate-selected, .candidate-row.candidate-selected:hover { background: #ebf1fa; color: #2f5496; font-weight: 600; }
.candidate-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; color: #5a6472; font-size: 12px; }
.candidate-empty { padding: 16px; text-align: center; font-size: 13px; color: #98a1ad; }
.muted { color: #98a1ad; font-size: 12px; }
.customer-grid { display: flex; flex-wrap: wrap; gap: 32px; font-size: 14px; color: #5a6472; }
.customer-grid > div { display: flex; align-items: center; gap: 8px; padding: 7px 0; overflow-wrap: anywhere; }
.customer-grid > div > span:first-child { font-size: 13px; }
.customer-grid .benefit-total { font-size: 24px; font-weight: 700; color: #4472c4; }
.customer-grid .benefit-unit { font-size: 12px; color: #98a1ad; }
.customer-grid span, .detail-fields span { color: #5a6472; }
.customer-grid strong, .detail-fields strong { font-weight: 600; }
.detail-fields strong, .detail-text { color: #333a45; }
.trace-total { margin-top: 12px; color: #98a1ad; font-size: 12px; }
.submit-hint { margin: 12px 0 0; }
.detail-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin: 8px 0 24px; font-size: 14px; }
.detail-fields > div { display: flex; gap: 10px; overflow-wrap: anywhere; line-height: 22px; }
.detail-fields span { font-size: 13px; flex-shrink: 0; }
.approval-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.section-title { margin-top: 28px; }
.section-title:first-child { margin-top: 0; }
.detail-text { margin: 14px 0 22px; font-size: 14px; line-height: 22px; white-space: pre-wrap; overflow-wrap: anywhere; }
.edit-customer { margin: 0 0 20px; font-size: 14px; }
.edit-customer > span { margin-left: 32px; }
.confirmation-field { display: flex; gap: 20px; margin-bottom: 18px; font-size: 14px; line-height: 22px; }
.confirmation-field > span { color: #5a6472; width: 84px; flex-shrink: 0; }
.confirmation-field strong { font-weight: 600; overflow-wrap: anywhere; color: #333a45; }
::v-deep .benefit-detail-dialog, ::v-deep .benefit-edit-dialog, ::v-deep .benefit-confirm-dialog { max-width: calc(100vw - 32px); }
::v-deep .benefit-detail-dialog { display: flex; flex-direction: column; max-height: 92vh; }
::v-deep .benefit-detail-dialog .el-dialog__body { height: auto; min-height: 0; overflow-y: auto; padding: 18px; }
::v-deep .benefit-edit-dialog { display: flex; flex-direction: column; height: 100vh; margin-bottom: 0; }
::v-deep .benefit-edit-dialog .el-dialog__body { flex: 1; min-height: 0; height: auto; overflow-y: auto; padding: 18px; }
::v-deep .el-dialog__header, ::v-deep .el-dialog__footer { flex-shrink: 0; }
</style>
