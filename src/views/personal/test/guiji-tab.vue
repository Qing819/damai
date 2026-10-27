<template>
  <div class="track-query-page">
    <div class="page-heading">
      <h1>{{ currentView === 'list' ? '规则切换轨迹查询' : '切换轨迹详情' }}</h1>
      <p v-if="currentView === 'list'">全量记录并展示客户规则切换的全周期轨迹，支持客户与内部工作人员双端查询，敏感信息脱敏展示</p>
      <p v-else>客户规则切换的全周期轨迹：客户信息、切换前后数据（积分、等级与等级权益）与切换时积分计算过程（敏感信息脱敏）</p>
    </div>

    <template v-if="currentView === 'list'">
      <el-card shadow="never" class="query-card">
        <el-form :inline="true" :model="queryForm" class="track-query-form" @submit.native.prevent="handleSearch">
          <el-form-item>
            <el-input v-model.trim="queryForm.custId" aria-label="客户号" placeholder="客户号" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-input v-model.trim="queryForm.custName" aria-label="姓名" placeholder="姓名" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.idType" aria-label="证件类型" placeholder="全部证件类型" clearable>
              <el-option label="全部证件类型" value="" />
              <el-option v-for="item in idTypeOptions" :key="item.code" :label="formatIdType(item.name)" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item class="id-filter">
            <el-input v-model.trim="queryForm.idNo" aria-label="证件号码" placeholder="证件号码" clearable @keyup.enter.native="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.orgName" aria-label="服务归属机构" placeholder="全部服务归属机构" clearable>
              <el-option label="全部服务归属机构" value="" />
              <el-option v-for="item in orgOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryForm.switchStatus" aria-label="切换状态" placeholder="全部切换状态" clearable>
              <el-option label="全部切换状态" value="" />
              <el-option label="已切换" value="SWITCHED" />
              <el-option label="未切换" value="NOT_SWITCHED" />
            </el-select>
          </el-form-item>
          <div class="date-group">
            <el-form-item>
              <el-date-picker v-model="queryForm.switchTimeFrom" aria-label="切换开始日期" type="date" placeholder="开始日期" value-format="yyyy-MM-dd" />
            </el-form-item>
            <span class="date-separator">~</span>
            <el-form-item>
              <el-date-picker v-model="queryForm.switchTimeTo" aria-label="切换结束日期" type="date" placeholder="结束日期" value-format="yyyy-MM-dd" />
            </el-form-item>
          </div>
          <el-form-item class="query-actions">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button :loading="exportLoading" @click="handleExport">导出</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="table-card">
        <div slot="header" class="card-heading">切换轨迹列表</div>
        <el-table v-loading="loading" :data="tableData" stripe size="mini" style="width: 100%;">
          <el-table-column label="客户" min-width="150" align="center" show-overflow-tooltip>
            <template slot-scope="{ row }">{{ maskName(row.cust_name) }}（{{ value(row.cust_id) }}）</template>
          </el-table-column>
          <el-table-column label="证件类型" min-width="100" align="center">
            <template slot-scope="{ row }">{{ formatIdType(row.id_type) }}</template>
          </el-table-column>
          <el-table-column prop="id_no" label="证件号" min-width="150" align="center" show-overflow-tooltip />
          <el-table-column prop="org_name" label="服务归属机构" min-width="120" align="center" show-overflow-tooltip />
          <el-table-column label="实际切换时间" min-width="145" align="center">
            <template slot-scope="{ row }">{{ displayTime(row.execute_time) }}</template>
          </el-table-column>
          <el-table-column label="老系统积分 / 等级" min-width="140" align="center">
            <template slot-scope="{ row }">{{ comparison(row, false) }}</template>
          </el-table-column>
          <el-table-column label="新系统积分 / 等级" min-width="150" align="center">
            <template slot-scope="{ row }">{{ comparison(row, true) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template slot-scope="{ row }"><span class="status-tag" :class="statusClass(row.switch_status)">{{ formatStatus(row.switch_status) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right" align="center">
            <template slot-scope="{ row }"><el-button type="text" size="mini" @click="goTrackDetail(row)">查看轨迹</el-button></template>
          </el-table-column>
        </el-table>
        <div class="pagination-footer">
          <el-pagination background :current-page="currentPage" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, prev, pager, next, sizes, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
          <span class="hint">客户敏感信息脱敏展示</span>
        </div>
      </el-card>
    </template>

    <div v-else v-loading="detailLoading">
      <div class="snapshot-notice">
        <b>提示</b>
        <span>本页积分、等级、等级权益与切换时积分计算过程均为「实际切换时间」时点的核算快照，反映的是切换当刻的计算结果，不随客户后续业绩、业务状态与有效期变动而更新，不能作为客户当前数据参考；如需查看客户当前数据，请前往「客户积分管理」查询。</span>
      </div>
      <el-card shadow="never" class="detail-card">
        <div slot="header" class="card-heading">客户基本信息<span class="hint">敏感信息脱敏展示</span></div>
        <div class="info-grid">
          <div v-for="field in customerFields" :key="field.label" class="info-item"><span class="field-label">{{ field.label }}</span><span class="field-value">{{ value(field.value) }}</span></div>
        </div>
      </el-card>

      <el-card shadow="never" class="detail-card">
        <div slot="header" class="card-heading">切换核心信息</div>
        <div class="info-grid">
          <div v-for="field in switchFields" :key="field.label" class="info-item"><span class="field-label">{{ field.label }}</span><span class="field-value">{{ value(field.value) }}</span></div>
        </div>
        <div class="section-title">切换前后数据</div>
        <div class="comparison">
          <div class="system-panel old-panel">
            <div class="system-heading"><b>老系统数据</b><span>V爱客户管理规则</span></div>
            <div class="system-body">
              <div class="metrics">
                <div><div class="metric-label">整体积分</div><div class="metric-value">{{ formatNumber(oldData.point) }}</div></div>
                <div><div class="metric-label">等级</div><div class="grade-value"><span class="grade-tag">{{ formatGrade(oldData.grade) }}</span></div></div>
              </div>
              <div class="comparison-section">
                <div class="comparison-title">等级权益<span class="hint">老规则下当前享有权益及已使用情况</span></div>
                <el-table :data="oldRightsData" stripe size="mini" style="width: 100%;">
                  <el-table-column prop="rights" label="服务权益" min-width="110" />
                  <el-table-column prop="project" label="服务项目" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="provider" label="服务商" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="available" label="可使用次数" width="95" align="center" />
                  <el-table-column prop="used" label="已使用" width="70" align="center" />
                </el-table>
              </div>
            </div>
          </div>
          <div class="comparison-arrow"><span>→</span><div>老规则→新规则<br>切换后不可逆</div></div>
          <div class="system-panel new-panel">
            <div class="system-heading"><b>新系统数据</b><span>新积分等级体系</span></div>
            <div class="system-body">
              <div class="metrics">
                <div><div class="metric-label">整体积分</div><div class="metric-value">{{ formatNumber(newData.point) }}</div></div>
                <div><div class="metric-label">等级</div><div class="grade-value"><span class="grade-tag">{{ formatGrade(newData.grade, true) }}</span></div></div>
              </div>
              <div class="comparison-section">
                <div class="comparison-title">等级权益<span class="hint">新规则下切换后享有权益</span></div>
                <el-table :data="newRightsData" stripe size="mini" style="width: 100%;">
                  <el-table-column prop="rights" label="服务权益" min-width="110" />
                  <el-table-column prop="project" label="服务项目" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="provider" label="服务商" min-width="100" show-overflow-tooltip />
                  <el-table-column prop="times" label="权益次数" width="95" align="center" />
                </el-table>
              </div>
              <div class="comparison-section">
                <div class="comparison-title">切换时积分计算过程<span class="hint">按保单拆分保费积分与忠诚积分，实际积分为切换跑批核算结果</span></div>
                <el-table :data="calcProcessData" stripe size="mini" show-summary :summary-method="calcSummary" style="width: 100%;">
                  <el-table-column prop="policy_no" label="保单号" min-width="100" show-overflow-tooltip />
                  <el-table-column label="保费积分" min-width="90" align="right"><template slot-scope="{ row }">{{ formatNumber(row.premium) }}</template></el-table-column>
                  <el-table-column label="忠诚积分" min-width="90" align="right"><template slot-scope="{ row }">{{ formatNumber(row.loyalty) }}</template></el-table-column>
                  <el-table-column label="养老协同积分" min-width="100" align="right"><template slot-scope="{ row }">{{ formatNumber(row.pension) }}</template></el-table-column>
                  <el-table-column label="切换时实际积分" min-width="110" align="right"><template slot-scope="{ row }">{{ formatNumber(row.total) }}</template></el-table-column>
                </el-table>
                <div class="hint calc-formula">切换实际积分合计（{{ formatNumber(pointCalcTotal.total) }}）＝ 保费积分 {{ formatNumber(pointCalcTotal.premium) }} + 忠诚积分 {{ formatNumber(pointCalcTotal.loyalty) }} + 养老协同积分 {{ formatNumber(pointCalcTotal.pension) }} ＝ 新系统整体积分。</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="detail-card close-card"><el-button @click="closeDetail">关闭</el-button></el-card>
    </div>
  </div>
</template>

<script>
import { getSwitchRecordPageApi, getSwitchRecordDetailApi, switchRecordExportApi, getSwitchIdTypesApi, getPlatformOrgApi } from '@/api/test'
import { formatIdType, formatTime, parseList } from './benefit-adjust-model'

const newQuery = () => ({ custId: '', custName: '', idType: '', idNo: '', orgName: '', switchStatus: '', switchTimeFrom: '', switchTimeTo: '' })

export default {
  name: 'RuleSwitchTrack',
  data() {
    return {
      currentView: 'list', loading: false, exportLoading: false, detailLoading: false,
      listRequestId: 0, detailRequestId: 0,
      queryForm: newQuery(), appliedQuery: newQuery(), idTypeOptions: [], orgOptions: [],
      tableData: [], total: 0, currentPage: 1, pageSize: 10, detailData: {}
    }
  },
  computed: {
    custInfo() { return this.detailData.custInfo || {} },
    applyInfo() { return this.detailData.apply || {} },
    oldData() { return this.detailData.oldData || {} },
    newData() { return this.applyInfo.status === 'SWITCHED' ? this.detailData.newData || {} : {} },
    oldRightsData() {
      return (this.detailData.oldBenefits || []).map(item => ({
        ...this.benefitFields(item),
        available: item.grant_count === null ? '不限次' : item.grant_count == null ? '—' : `${item.grant_count} 次`,
        used: this.value(item.used_count)
      }))
    },
    newRightsData() {
      if (this.applyInfo.status !== 'SWITCHED') return []
      return (this.detailData.newBenefits || []).map(item => ({
        ...this.benefitFields(item),
        times: item.freq_unlimited === 1 || item.freq_unlimited === true || item.freq_unlimited === '1'
          ? '不限次' : item.freq_count == null ? '—' : `${item.freq_count} 次`
      }))
    },
    calcProcessData() { return this.applyInfo.status === 'SWITCHED' ? this.detailData.pointCalc || [] : [] },
    pointCalcTotal() { return this.applyInfo.status === 'SWITCHED' ? this.detailData.pointCalcTotal || {} : {} },
    customerFields() {
      const data = this.custInfo
      return [
        { label: '客户号', value: data.custId }, { label: '核心客户号', value: data.coreCustId },
        { label: '客户姓名', value: data.custName }, { label: '证件类型', value: formatIdType(data.idType) },
        { label: '证件号码', value: data.idNo }, { label: '手机号码', value: data.mobile },
        { label: '所属渠道', value: data.channel }, { label: '服务归属机构', value: data.orgName },
        { label: '二级机构', value: data.org2Name }, { label: '三级机构', value: data.org3Name },
        { label: '代理人', value: data.agentName }
      ]
    },
    switchFields() {
      const data = this.applyInfo
      return [
        { label: '申请人', value: data.operator }, { label: '申请时间', value: this.displayTime(data.applyTime) },
        { label: '切换生效日期', value: data.effectiveDate }, { label: '实际切换时间', value: this.displayTime(data.executeTime) }
      ]
    }
  },
  created() {
    this.fetchOptions()
    this.openRoute(this.$route.query.applyNo)
  },
  watch: {
    '$route.query.applyNo'(applyNo) { this.openRoute(applyNo) }
  },
  beforeDestroy() {
    this.listRequestId++
    this.detailRequestId++
  },
  methods: {
    formatIdType,
    value(data) { return data == null || data === '' ? '—' : data },
    displayTime(data) { return formatTime(data).slice(0, 16) },
    maskName(name) { return name ? `${String(name).slice(0, 1)}${'*'.repeat(Math.max(String(name).length - 1, 1))}` : '—' },
    formatNumber(data) {
      if (data == null || data === '') return '—'
      const number = Number(data)
      return Number.isFinite(number) ? number.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : '—'
    },
    formatGrade(grade, isNew = false) {
      if (grade == null || grade === '') return '—'
      const name = { YIXING: '一星', ERXING: '二星', SANXING: '三星', SIXING: '四星', WUXING: '五星', PUXING: '普星', ZHUOYUE: '卓越', ZUNYAO: '尊耀' }[grade] || grade
      return isNew && !String(name).includes('新V') ? `${name}（新V）` : name
    },
    formatStatus(status) { return { SWITCHED: '已切换', NOT_SWITCHED: '未切换' }[status] || this.value(status) },
    statusClass(status) { return status === 'SWITCHED' ? 'tag-green' : 'tag-gray' },
    comparison(row, isNew) {
      if (isNew && row.switch_status !== 'SWITCHED') return '—'
      const prefix = isNew ? 'new' : 'old'
      return `${this.formatNumber(row[`${prefix}_point`])} / ${this.formatGrade(row[`${prefix}_grade`], isNew)}`
    },
    benefitFields(item) {
      return {
        rights: this.value(item.benefit_name),
        project: this.value(parseList(item.items_json).map(project => project.name).filter(Boolean).join('、')),
        provider: this.value(item.supplier)
      }
    },
    calcSummary() { return ['积分汇总', '', '', '', this.formatNumber(this.pointCalcTotal.total)] },
    async fetchOptions() {
      const results = await Promise.allSettled([getSwitchIdTypesApi(), getPlatformOrgApi()])
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value.data)) this[['idTypeOptions', 'orgOptions'][index]] = result.value.data
      })
      if (results.some(result => result.status === 'rejected')) this.$message.error('部分下拉选项加载失败，请刷新重试')
    },
    queryParams(paginated = true) {
      const params = { ...this.appliedQuery }
      Object.keys(params).forEach(key => { if (params[key] == null || params[key] === '') delete params[key] })
      return paginated ? { ...params, pageNum: this.currentPage, pageSize: this.pageSize } : params
    },
    async fetchList() {
      const requestId = ++this.listRequestId
      this.loading = true
      try {
        const res = await getSwitchRecordPageApi(this.queryParams())
        if (requestId !== this.listRequestId) return
        this.tableData = res.data.list || []
        this.total = res.data.total || 0
        if (this.currentPage > 1 && !this.tableData.length && this.total > 0) {
          this.currentPage = Math.ceil(this.total / this.pageSize)
          return this.fetchList()
        }
      } catch (error) {
        if (requestId !== this.listRequestId) return
        this.tableData = []
        this.total = 0
        this.$message.error('获取切换轨迹列表失败，请重试')
      } finally {
        if (requestId === this.listRequestId) this.loading = false
      }
    },
    handleSearch() {
      if (this.queryForm.switchTimeFrom && this.queryForm.switchTimeTo && this.queryForm.switchTimeFrom > this.queryForm.switchTimeTo) {
        this.$message.warning('切换开始日期不能晚于结束日期')
        return
      }
      this.appliedQuery = { ...this.queryForm }
      this.currentPage = 1
      return this.fetchList()
    },
    handleReset() { this.queryForm = newQuery(); return this.handleSearch() },
    handleCurrentChange(page) { this.currentPage = page; return this.fetchList() },
    handleSizeChange(size) { this.pageSize = size; this.currentPage = 1; return this.fetchList() },
    async handleExport() {
      if (this.exportLoading) return
      this.exportLoading = true
      try {
        const blob = await switchRecordExportApi(this.queryParams(false))
        if (blob.type && blob.type.includes('json')) {
          const data = JSON.parse(await blob.text())
          throw new Error((data.header || {}).message || data.message || '导出失败')
        }
        const href = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = href
        link.download = '规则切换轨迹.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(href)
      } catch (error) {
        this.$message.error(error.message || '导出切换轨迹失败，请重试')
      } finally { this.exportLoading = false }
    },
    openRoute(applyNo) {
      if (applyNo) {
        this.currentView = 'track'
        return this.fetchDetail(applyNo)
      }
      this.detailRequestId++
      this.detailLoading = false
      this.currentView = 'list'
      return this.fetchList()
    },
    async fetchDetail(applyNo) {
      const requestId = ++this.detailRequestId
      this.detailLoading = true
      this.detailData = {}
      try {
        const res = await getSwitchRecordDetailApi(applyNo)
        if (requestId !== this.detailRequestId) return
        if (!res.data || !res.data.apply || res.data.apply.applyNo !== applyNo) throw new Error('申请详情不存在')
        this.detailData = res.data
      } catch (error) {
        if (requestId !== this.detailRequestId) return
        this.$message.error('获取切换轨迹详情失败，请重试')
        this.closeDetail()
      } finally {
        if (requestId === this.detailRequestId) this.detailLoading = false
      }
    },
    goTrackDetail(row) {
      if (!row.apply_no) {
        this.$message.error('该记录缺少申请单号，请刷新后重试')
        return
      }
      return this.$router.push({ path: '/personal/guiJiTab', query: { ...this.$route.query, applyNo: row.apply_no } })
    },
    closeDetail() {
      this.detailRequestId++
      this.detailLoading = false
      if (this.$route.query.from === 'switchApply') {
        return this.$router.replace({ path: '/personal/otn' })
      }
      if (this.$route.query.applyNo) {
        const query = { ...this.$route.query }
        delete query.applyNo
        return this.$router.replace({ path: '/personal/guiJiTab', query })
      }
      this.currentView = 'list'
      return this.fetchList()
    }
  }
}
</script>

<style scoped>
.track-query-page { padding: 16px; min-height: calc(100vh - 84px); background: #f5f7fa; color: #333a45; }
.page-heading { margin: 2px 0 18px; }
.page-heading h1 { margin: 0 0 6px; font-size: 21px; font-weight: 700; }
.page-heading p { margin: 0; font-size: 13px; color: #5a6472; }
.query-card, .table-card, .detail-card { margin-bottom: 16px; border: 1px solid #e0e4ea; border-radius: 6px; }
.query-card ::v-deep .el-card__body, .table-card ::v-deep .el-card__body, .detail-card ::v-deep .el-card__body { padding: 16px 18px; }
.table-card ::v-deep .el-card__header, .detail-card ::v-deep .el-card__header { padding: 13px 18px; }
.card-heading { color: #333a45; font-size: 15px; font-weight: 600; }
.card-heading .hint { margin-left: 8px; }
.hint { color: #8b95a3; font-size: 12px; font-weight: 400; }
.track-query-form { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.track-query-form ::v-deep .el-form-item { margin: 0; }
.track-query-form ::v-deep .el-form-item__content { line-height: 40px; }
.track-query-form ::v-deep .el-input, .track-query-form ::v-deep .el-select { width: 140px; }
.track-query-form .id-filter ::v-deep .el-input { width: 160px; }
.track-query-form ::v-deep .el-input__inner { height: 40px; line-height: 40px; font-size: 14px; color: #333a45; }
.track-query-form ::v-deep .el-input__icon { line-height: 40px; }
.date-group { display: flex; align-items: center; gap: 12px; }
.date-separator { font-size: 12px; color: #8b95a3; }
.query-actions ::v-deep .el-form-item__content { display: flex; align-items: center; gap: 12px; }
.query-actions ::v-deep .el-button { width: 62px; height: 36px; padding: 0; margin: 0; font-size: 14px; font-weight: 400; }
.pagination-footer { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin-top: 16px; }
.status-tag { display: inline-block; padding: 2px 12px; border-radius: 10px; font-size: 12px; line-height: 1.1; }
.tag-green { background: #e8f5e9; color: #2e7d32; }
.tag-gray { background: #eef0f2; color: #5a6472; }
.snapshot-notice { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; padding: 10px 14px; background: #fdecea; border: 1px solid #f5c6c0; border-left: 3px solid #c62828; border-radius: 6px; }
.snapshot-notice b { flex: none; margin-top: 1px; padding: 2px 7px; border-radius: 3px; background: #c62828; color: white; font-size: 11px; letter-spacing: .5px; }
.snapshot-notice > span { color: #c62828; font-size: 13px; line-height: 1.6; }
.info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 24px; }
.info-item { display: flex; align-items: baseline; gap: 10px; }
.field-label { flex-shrink: 0; font-size: 13px; color: #5a6472; }
.field-value { min-width: 0; font-size: 14px; font-weight: 600; color: #333a45; overflow-wrap: anywhere; }
.section-title { margin: 28px 0 8px; border-left: 3px solid #4472c4; padding-left: 9px; font-size: 14px; line-height: 1.4; font-weight: 600; color: #2f5496; }
.comparison { display: flex; align-items: stretch; gap: 14px; margin-top: 12px; }
.system-panel { flex: 1; min-width: 0; overflow: hidden; border: 1px solid #e0e4ea; border-radius: 10px; background: white; box-shadow: 0 1px 3px rgba(16, 42, 82, .05); }
.new-panel { border-color: #bfd0ea; box-shadow: 0 4px 16px rgba(68, 114, 196, .12); }
.system-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 11px 16px; background: #f2f4f7; border-bottom: 1px solid #e0e4ea; }
.system-heading b { font-size: 14px; color: #5a6472; }
.system-heading > span { padding: 1px 9px; border-radius: 10px; font-size: 11px; color: #8b95a3; background: rgba(0, 0, 0, .05); }
.new-panel .system-heading { background: linear-gradient(90deg, #eaf1fb, #d6e4f7); border-color: #c5d5f0; }
.new-panel .system-heading b { color: #2f5496; }
.new-panel .system-heading > span { background: rgba(255, 255, 255, .7); }
.system-body { padding: 16px 18px; }
.metrics { display: flex; flex-wrap: wrap; gap: 36px; }
.metric-label { font-size: 12px; color: #5a6472; }
.metric-value { margin-top: 3px; font-size: 24px; line-height: 1.1; font-weight: 700; color: #555; }
.new-panel .metric-value { color: #2f5496; }
.grade-value { margin-top: 3px; padding-top: 8px; }
.grade-tag { display: inline-block; padding: 2px 12px; border-radius: 10px; font-size: 12px; line-height: 1.1; font-weight: 700; background: #fff6df; color: #8a6d00; }
.comparison-arrow { flex: 0 0 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
.comparison-arrow > span { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 50%; background: #4f6fae; color: white; font-size: 20px; box-shadow: 0 3px 10px rgba(68, 114, 196, .35); }
.comparison-arrow > div { color: #8b95a3; font-size: 11px; text-align: center; line-height: 1.5; }
.comparison-section { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #c5d5f0; }
.comparison-title { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #2f5496; }
.comparison-section ::v-deep .el-table__footer-wrapper td { background: #f3f6fc; font-weight: 700; }
.comparison-section ::v-deep .el-table__footer-wrapper td:last-child { color: #2f5496; }
.calc-formula { margin-top: 10px; line-height: 1.6; }
.close-card ::v-deep .el-button { height: 36px; padding: 0 16px; font-size: 14px; font-weight: 400; }
@media (max-width: 900px) {
  .info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .comparison { flex-direction: column; }
  .comparison-arrow { flex-basis: auto; padding: 6px 0; }
}
</style>
