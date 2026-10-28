<template>
  <div class="report-page">
    <div class="page-heading"><h1>报表穿透查询</h1><p>报表数据穿透查询，追溯至具体客户、保单明细</p></div>
    <el-card shadow="never">
      <div slot="header">穿透来源</div>
      <div class="source-grid">
        <div><span>报表类型</span><b>—</b></div>
        <div><span>统计维度</span><b>客户等级分布</b></div>
        <div><span>穿透项</span><b class="grade-badge">{{ gradeName(item) }}</b></div>
        <div><span>统计区间</span><b>当前数据</b></div>
      </div>
    </el-card>
    <div class="notice">此处展示当前等级客户明细，尚不支持按报表统计区间追溯历史数据。</div>
    <el-card shadow="never">
      <el-form :inline="true" :model="query" class="drill-query" @submit.native.prevent="search">
        <el-form-item><el-select v-model="query.orgName" placeholder="全部机构" aria-label="机构" clearable><el-option label="全部机构" value="" /><el-option v-for="org in orgOptions" :key="org" :label="org" :value="org" /></el-select></el-form-item>
        <el-form-item><el-input v-model.trim="query.custId" placeholder="客户号" aria-label="客户号" clearable @keyup.enter.native="search" /></el-form-item>
        <el-form-item><el-input v-model.trim="query.custName" placeholder="姓名" aria-label="姓名" clearable @keyup.enter.native="search" /></el-form-item>
        <el-form-item><div class="query-actions"><el-button type="primary" :disabled="!item" @click="search">查询</el-button><el-button @click="reset">重置</el-button><el-button :disabled="!item" :loading="exporting" @click="exportCustomers">导出</el-button></div></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never">
      <div slot="header">{{ gradeName(item) }}等级客户明细<span class="hint card-hint">共 {{ total }} 户，当前展示 {{ customers.length }} 条</span></div>
      <div v-if="listError" class="notice" role="alert">{{ listError }}</div>
      <el-table v-loading="loading" :data="customers" stripe size="mini">
        <el-table-column prop="cust_id" label="客户号" min-width="120" />
        <el-table-column label="姓名" min-width="90"><template slot-scope="{ row }">{{ maskName(row.cust_name) }}</template></el-table-column>
        <el-table-column label="当前等级" min-width="100"><template slot-scope="{ row }"><span class="grade-badge">{{ gradeName(row.current_grade) }}</span></template></el-table-column>
        <el-table-column prop="org_name" label="服务归属机构" min-width="130" show-overflow-tooltip />
        <el-table-column label="当前积分" min-width="110"><template slot-scope="{ row }">{{ number(row.current_point) }}</template></el-table-column>
        <el-table-column prop="policy_cnt" label="保单数" min-width="80" />
        <el-table-column label="操作" width="120"><template slot-scope="{ row }"><el-button type="text" size="mini" @click="viewPolicies(row)">查看保单明细</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-footer"><el-pagination background :current-page="pageNum" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, prev, pager, next, sizes, jumper" @current-change="changePage" @size-change="changeSize" /></div>
    </el-card>
    <el-card v-if="selected" v-loading="policyLoading" shadow="never">
      <div slot="header">保单明细<span class="hint card-hint">{{ maskName(selected.cust_name) }}（{{ selected.cust_id }}）名下保单</span></div>
      <div v-if="policyError" class="notice" role="alert">{{ policyError }}<el-button type="text" @click="viewPolicies(selected)">重试</el-button></div>
      <el-table :data="policies" stripe size="mini">
        <el-table-column prop="policyNo" label="保单号" min-width="120" />
        <el-table-column label="险种" min-width="150" show-overflow-tooltip><template slot-scope="{ row }">{{ row.riskName || row.riskcode || '—' }}</template></el-table-column>
        <el-table-column label="实收保费" min-width="100"><template slot-scope="{ row }">{{ number(row.premium) }}</template></el-table-column>
        <el-table-column label="积分类型" min-width="100"><template slot-scope="{ row }"><span class="point-badge" :class="pointClass(row.pointType)">{{ pointName(row.pointType) }}</span></template></el-table-column>
        <el-table-column label="积分金额" min-width="100"><template slot-scope="{ row }">{{ number(row.point) }}</template></el-table-column>
        <el-table-column label="保单状态" min-width="100"><template slot-scope="{ row }">{{ row.polState || '—' }}</template></el-table-column>
      </el-table>
      <div class="tip"><b>说明</b><span>报表数据支持多级穿透：统计值 → 客户明细 → 保单明细，追溯至具体业务数据。未提供的险种、保单状态以“—”展示。</span></div>
    </el-card>
    <el-button @click="$router.push('/personal/statistics')">返回统计分析</el-button>
  </div>
</template>

<script>
import { getPlatformOrgApi } from '@/api/test'
import { getReportCustomers, getReportPolicies, exportReportCustomers } from '@/api/test/report'
import { exportFileGet } from '@/utils/exportFile'

export default {
  name: 'ReportDrill',
  data() {
    return {
      query: { orgName: '', custId: '', custName: '' },
      appliedQuery: {}, orgOptions: [], customers: [], total: 0, pageNum: 1, pageSize: 10,
      loading: false, exporting: false, listError: '', listRequest: 0,
      selected: null, policies: [], policyLoading: false, policyError: '', policyRequest: 0
    }
  },
  computed: {
    item() { return typeof this.$route.query.item === 'string' ? this.$route.query.item : '' }
  },
  watch: {
    item() { this.reset() }
  },
  created() {
    this.fetchOptions()
    this.search()
  },
  beforeDestroy() {
    this.listRequest++
    this.policyRequest++
  },
  methods: {
    gradeName(code) { return { PUXING: '普星', SANXING: '三星', SIXING: '四星', WUXING: '五星', ZHUOYUE: '卓越', ZUNYAO: '尊耀' }[code] || code || '—' },
    maskName(name) { return name ? Array.from(String(name))[0] + '*' : '—' },
    number(value) { return value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) },
    pointName(type) { return { PREMIUM: '保费积分', LOYALTY: '忠诚积分', PENSION: '养老险加分' }[type] || type || '—' },
    pointClass(type) { return { LOYALTY: 'loyalty', PENSION: 'pension' }[type] || '' },
    async fetchOptions() {
      try {
        const res = await getPlatformOrgApi()
        this.orgOptions = Array.isArray(res.data) ? res.data : []
      } catch (error) { this.$message.error('机构选项加载失败，请刷新重试') }
    },
    params(paged = true) {
      const params = { dimension: 'GRADE', item: this.item, ...this.appliedQuery }
      Object.keys(params).forEach(key => { if (params[key] === '' || params[key] == null) delete params[key] })
      return paged ? { ...params, pageNum: this.pageNum, pageSize: this.pageSize } : params
    },
    clearPolicies() {
      this.policyRequest++
      this.selected = null
      this.policies = []
      this.policyError = ''
      this.policyLoading = false
    },
    search() {
      this.appliedQuery = { ...this.query }
      this.pageNum = 1
      this.fetchCustomers()
    },
    reset() {
      this.query = { orgName: '', custId: '', custName: '' }
      this.search()
    },
    changePage(page) { this.pageNum = page; this.fetchCustomers() },
    changeSize(size) { this.pageSize = size; this.pageNum = 1; this.fetchCustomers() },
    async fetchCustomers() {
      const request = ++this.listRequest
      this.clearPolicies()
      this.customers = []
      this.total = 0
      this.listError = ''
      if (!this.item) {
        this.loading = false
        this.listError = '缺少穿透项，请返回统计分析选择客户等级'
        return
      }
      this.loading = true
      try {
        const res = await getReportCustomers(this.params())
        if (request !== this.listRequest) return
        if (!res || !res.data || !Array.isArray(res.data.list) || !Number.isFinite(Number(res.data.total)) || Number(res.data.total) < 0) throw new Error('客户明细响应异常')
        this.customers = res.data.list
        this.total = Number(res.data.total)
      } catch (error) {
        if (request === this.listRequest) this.listError = '客户明细加载失败，请点击查询重试'
      } finally {
        if (request === this.listRequest) this.loading = false
      }
    },
    async viewPolicies(row) {
      const request = ++this.policyRequest
      this.selected = row
      this.policies = []
      this.policyError = ''
      this.policyLoading = true
      try {
        const res = await getReportPolicies(row.cust_id)
        if (request !== this.policyRequest) return
        if (!res || !Array.isArray(res.data)) throw new Error('保单明细响应异常')
        this.policies = res.data
      } catch (error) {
        if (request === this.policyRequest) this.policyError = '保单明细加载失败，请重试'
      } finally {
        if (request === this.policyRequest) this.policyLoading = false
      }
    },
    async exportCustomers() {
      if (!this.item || this.exporting) return
      this.exporting = true
      try {
        const blob = await exportReportCustomers(this.params(false))
        if (!blob || !blob.size) throw new Error('导出文件为空')
        const prefix = await blob.slice(0, 100).text()
        if (/^\s*[{[]/.test(prefix) || /json|text\//.test(blob.type)) throw new Error('导出失败，请重试')
        exportFileGet(blob, `${this.gradeName(this.item)}等级客户明细`)
        this.$message.success('导出成功')
      } catch (error) { this.$message.error(error.message || '导出失败，请重试') } finally { this.exporting = false }
    }
  }
}
</script>

<style lang="scss" scoped>
@import './report.scss';
.source-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px 24px; }
.source-grid > div { display: flex; align-items: center; gap: 14px; }
.source-grid > div > span { font-size: 13px; color: #5a6472; }
.source-grid b { font-size: 14px; font-weight: 600; }
.drill-query { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.drill-query ::v-deep .el-form-item { margin: 0; }
.drill-query .el-input { width: 140px; }
.drill-query .el-select { width: 180px; }
@media (max-width: 800px) { .source-grid { grid-template-columns: 1fr; } }
</style>
