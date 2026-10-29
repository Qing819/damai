<template>
  <div class="customer-points-container">
    <div class="page-heading">
      <h1>客户积分管理</h1>
      <p>全量客户积分综合管理：按条件筛选客户，查看客户积分汇总与各类型积分明细，追溯积分、等级、权益三类轨迹</p>
    </div>
    <!-- 顶部筛选表单 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryForm" label-width="0" size="small" class="prototype-filter-form">
        <!-- 原型布局：第一行四个下拉 + 客户号/姓名 -->
        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item>
              <el-select v-model="queryForm.pointSystem" placeholder="全部积分体系" clearable style="width: 100%;">
                <el-option label="新积分体系" value="V2_2027" />
                <el-option label="老积分体系" value="V1_LEGACY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-select v-model="queryForm.currentGrade" placeholder="全部客户等级" clearable style="width: 100%;">
                <el-option label="普星" value="PUXING" />
                <el-option label="三星" value="SANXING" />
                <el-option label="四星" value="SIXING" />
                <el-option label="五星" value="WUXING" />
                <el-option label="卓越" value="ZHUOYUE" />
                <el-option label="尊耀" value="ZUNYAO" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-select v-model="queryForm.channel" placeholder="全部所属渠道" clearable style="width: 100%;">
                <el-option label="个险渠道" value="INDIVIDUAL" />
                <el-option label="银保渠道" value="BANCA" />
                <el-option label="经代渠道" value="INTERMEDIARY" />
                <el-option label="电销/网销渠道" value="E_SALES" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-select v-model="queryForm.orgName" placeholder="全部服务机构" clearable style="width: 100%;">
                <el-option label="总公司" value="总公司" />
                <el-option label="天津分公司" value="天津分公司" />
                <el-option label="北京分公司" value="北京分公司" />
                <el-option label="河北分公司" value="河北分公司" />
                <el-option label="山西分公司" value="山西分公司" />
                <el-option label="辽宁分公司" value="辽宁分公司" />
                <el-option label="大连分公司" value="大连分公司" />
                <el-option label="江苏分公司" value="江苏分公司" />
                <el-option label="上海分公司" value="上海分公司" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-input v-model="queryForm.custId" placeholder="客户号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-input v-model="queryForm.custName" placeholder="客户姓名" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 原型布局：第二行证件类型/证件号/手机号 + 操作按钮 -->
        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item>
              <el-select v-model="queryForm.idType" placeholder="全部证件类型" clearable style="width: 100%;">
                <el-option label="居民身份证" value="IDCARD" />
                <el-option label="中国护照" value="PASSPORT" />
                <el-option label="港澳居民来往内地通行证" value="HKMO_PASS" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-input v-model="queryForm.idNo" placeholder="证件号码" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-input v-model="queryForm.mobile" placeholder="手机号码" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12" class="btn-container">
            <el-button class="btn-search" size="mini" type="primary" @click="handleSearch">查询</el-button>
            <el-button class="btn-reset" size="mini" @click="handleReset">重置</el-button>
            <el-button class="btn-export" size="mini" @click="handleExport">导出</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 统计卡片区（ECharts 微图表版本） -->
    <div class="stats-cards-container">
      <!-- 卡片 1：客户总数 -->
      <div class="stat-card border-blue">
        <div class="card-title">客户总数</div>
        <div class="card-value-box">
          <span class="card-value">{{ totalStats.total }}</span>
          <span class="card-unit">人</span>
        </div>
        <div class="chart-wrapper">
          <div ref="totalChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 卡片 2：新积分体系等级分布 -->
      <div class="stat-card border-green">
        <div class="card-title">新积分体系等级分布</div>
        <div class="card-value-box">
          <span class="card-value">{{ totalStats.newSystem.count }}</span>
          <span class="card-unit">人 · 占比 {{ totalStats.newSystem.percent }}%</span>
        </div>
        <div class="chart-wrapper">
          <div ref="newChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 卡片 3：老积分体系等级分布 -->
      <div class="stat-card border-blue-dark">
        <div class="card-title">老积分体系等级分布</div>
        <div class="card-value-box">
          <span class="card-value">{{ totalStats.oldSystem.count }}</span>
          <span class="card-unit">人 · 占比 {{ totalStats.oldSystem.percent }}%</span>
        </div>
        <div class="chart-wrapper">
          <div ref="oldChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- 列表展示区 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <span class="title">客户积分列表</span>
        <span class="subtitle">共 {{ total }} 条； 敏感信息脱敏展示</span>
      </div>

      <el-table
          v-loading="loading"
          :data="tableData"
          border stripe
          style="width: 100%"
          size="mini"
      >
        <el-table-column prop="seq" label="序号" width="55" align="center" />
        <el-table-column prop="pointSystem" label="客户积分体系" width="110" align="center">
          <template slot-scope="scope">
            <span :class="['system-tag', isLegacySystem(scope.row) ? 'system-old' : 'system-new']">
              {{ formatSystem(scope.row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="custId" label="客户号" width="130" />
        <el-table-column prop="coreCustId" label="核心客户号" width="100" />
        <el-table-column prop="custName" label="客户姓名" width="90" />
        <el-table-column prop="idType" label="证件类型" width="100" />
        <el-table-column prop="idNo" label="证件号码" width="170" />
        <el-table-column prop="mobile" label="手机号码" width="120" />
        <el-table-column prop="currentGrade" label="客户等级" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :class="['tag-level', 'tag-' + getLevelCode(scope.row.currentGrade)]" size="small" effect="plain">
              {{ formatGrade(scope.row.currentGrade) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="所属渠道" width="100" show-overflow-tooltip />
        <el-table-column prop="premiumPoint" label="保费积分" width="100" align="right">
          <template slot-scope="scope">
            {{ scope.row.premiumPoint !== null && scope.row.premiumPoint !== undefined ? formatNumber(scope.row.premiumPoint) : '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="loyaltyPoint" label="忠诚积分" width="100" align="right">
          <template slot-scope="scope">
            <span v-if="scope.row.loyaltyPoint !== null && scope.row.loyaltyPoint !== undefined">
              {{ formatNumber(scope.row.loyaltyPoint) }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="manualPoint" label="人工调整积分" width="110" align="right">
          <template slot-scope="scope">
            <span :class="scope.row.manualPoint > 0 ? 'text-success' : scope.row.manualPoint < 0 ? 'text-danger' : ''">
              {{ scope.row.manualPoint > 0 ? '+' : '' }}{{ formatNumber(scope.row.manualPoint) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="currentPoint" label="当前积分" width="110" align="right">
          <template slot-scope="scope">
            <span class="text-bold">{{ formatNumber(scope.row.currentPoint) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orgName" label="服务归属机构" width="110" show-overflow-tooltip />
        <el-table-column prop="org2Name" label="二级机构" width="110" show-overflow-tooltip />
        <el-table-column prop="org3Name" label="三级机构" width="100" show-overflow-tooltip />
        <el-table-column prop="bankName" label="所属银行" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.bankName || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="agentCompany" label="所属经代公司" width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.agentCompany || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="agentName" label="代理人" width="90" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template slot-scope="scope">
            <template v-if="isLegacySystem(scope.row)">
              <el-button type="text" size="small" @click="handlePointDetail(scope.row)">积分详情</el-button>
              <el-button type="text" size="small" @click="handleRightDetail(scope.row)">权益详情</el-button>
            </template>
            <template v-else>
              <el-button type="text" size="small" @click="handleDetail(scope.row)">查看详情</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
            background
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="page.currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="page.pageSize"
            layout="total, prev, pager, next, sizes"
            :total="total"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getCustPointListApi, getCustPointStatsApi, exportCustListApi } from 'api/test/point'
import { assertExportBlob } from '@/utils/exportFile'

export default {
  name: 'CustomerPoints',
  data() {
    return {
      loading: false,
      exportLoading: false,
      listRequest: 0,
      appliedQuery: {},
      // 顶部三个统计卡片的数据
      totalStats: {
        total: 0,
        newSystem: { count: 0, percent: 0 },
        oldSystem: { count: 0, percent: 0 },
        grades: { V2_2027: {}, V1_LEGACY: {} }
      },
      // 保存 ECharts 实例以便后续 dispose 和 resize
      chartInstances: [],
      queryForm: {
        pointSystem: '',
        currentGrade: '',
        channel: '',
        orgName: '',
        custId: '',
        custName: '',
        idType: '',
        idNo: '',
        mobile: ''
      },
      page: {
        currentPage: 1,
        pageSize: 10
      },
      total: 0,
      tableData: []
    }
  },
  mounted() {
    this.appliedQuery = { ...this.queryForm }
    this.fetchTableData()
    // 确保 DOM 挂载完成后初始化图表
    this.$nextTick(() => {
      this.initCharts()
    })
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleWindowResize)
  },
  beforeDestroy() {
    // 销毁监听事件和 ECharts 实例，防止内存泄漏
    window.removeEventListener('resize', this.handleWindowResize)
    this.chartInstances.forEach(instance => instance && instance.dispose())
  },
  methods: {
    // 格式化数字方法
    formatNumber(val) {
      if (val === null || val === undefined || val === '') return '0'
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },

    // 初始化所有图表
    initCharts() {
      this.initTotalChart()
      this.initNewSystemChart()
      this.initOldSystemChart()
    },

    // 1. 卡片: 客户总数
    initTotalChart() {
      if (!this.$refs.totalChartRef) return
      const chart = echarts.init(this.$refs.totalChartRef)
      this.chartInstances.push(chart)

      const totalNum = this.totalStats.total || 1

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1e293b', // 深色背景
          borderColor: '#1e293b',
          padding: [8, 12],
          textStyle: { color: '#ffffff' },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 6px;',
          formatter: params => {
            const percent = ((params.value / totalNum) * 100).toFixed(1)
            return `
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">${params.name}</div>
              <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">人数：${params.value} 人</div>
              <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">占比：${percent}%</div>
            `
          }
        },
        grid: { top: 10, bottom: 20, left: 10, right: 10, containLabel: false },
        xAxis: {
          type: 'category',
          data: ['新积分体系', '老积分体系'],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 11 }
        },
        yAxis: { show: false },
        series: [
          {
            type: 'bar',
            barWidth: 28,
            data: [
              { name: '新积分体系', value: this.totalStats.newSystem.count, itemStyle: { color: '#43a047' } },
              { name: '老积分体系', value: this.totalStats.oldSystem.count, itemStyle: { color: '#4a77e6' } }
            ],
            itemStyle: { borderRadius: [2, 2, 0, 0] }
          }
        ]
      }
      chart.setOption(option)
    },

    // 2. 卡片: 新积分体系等级分布
    initNewSystemChart() {
      if (!this.$refs.newChartRef) return
      const chart = echarts.init(this.$refs.newChartRef)
      this.chartInstances.push(chart)

      const totalNew = this.totalStats.newSystem.count || 1
      const grades = this.totalStats.grades.V2_2027 || {}

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1e293b',
          borderColor: '#1e293b',
          padding: [8, 12],
          textStyle: { color: '#ffffff' },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 6px;',
          formatter: params => {
            const percent = totalNew ? ((params.value / totalNew) * 100).toFixed(1) : '0.0'
            return `
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">${params.name}</div>
              <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">人数：${params.value} 人</div>
              <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">占比：${percent}%</div>
            `
          }
        },
        grid: { top: 10, bottom: 20, left: 10, right: 10, containLabel: false },
        xAxis: {
          type: 'category',
          data: ['普星', '三星', '四星', '五星', '卓越', '尊耀'],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 11 }
        },
        yAxis: { show: false },
        series: [
          {
            type: 'bar',
            barWidth: 20,
            data: [
              { name: '普星', value: grades.PUXING || 0 },
              { name: '三星', value: grades.SANXING || 0 },
              { name: '四星', value: grades.SIXING || 0 },
              { name: '五星', value: grades.WUXING || 0 },
              { name: '卓越', value: grades.ZHUOYUE || 0 },
              { name: '尊耀', value: grades.ZUNYAO || 0 }
            ],
            itemStyle: { color: '#43a047', borderRadius: [2, 2, 0, 0] }
          }
        ]
      }
      chart.setOption(option)
    },

    // 3. 卡片: 老积分体系等级分布
    initOldSystemChart() {
      if (!this.$refs.oldChartRef) return
      const chart = echarts.init(this.$refs.oldChartRef)
      this.chartInstances.push(chart)

      const totalOld = this.totalStats.oldSystem.count || 1
      const grades = this.totalStats.grades.V1_LEGACY || {}

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1e293b',
          borderColor: '#1e293b',
          padding: [8, 12],
          textStyle: { color: '#ffffff' },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 6px;',
          formatter: params => {
            const percent = totalOld ? ((params.value / totalOld) * 100).toFixed(1) : '0.0'
            return `
              <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">${params.name}</div>
              <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">人数：${params.value} 人</div>
              <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">占比：${percent}%</div>
            `
          }
        },
        grid: { top: 10, bottom: 20, left: 10, right: 10, containLabel: false },
        xAxis: {
          type: 'category',
          data: ['普星', '三星', '四星', '五星', '卓越'],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 11 }
        },
        yAxis: { show: false },
        series: [
          {
            type: 'bar',
            barWidth: 20,
            data: [
              { name: '普星', value: grades.PUXING || 0 },
              { name: '三星', value: grades.SANXING || 0 },
              { name: '四星', value: grades.SIXING || 0 },
              { name: '五星', value: grades.WUXING || 0 },
              { name: '卓越', value: grades.ZHUOYUE || 0 }
            ],
            itemStyle: { color: '#4a77e6', borderRadius: [2, 2, 0, 0] }
          }
        ]
      }
      chart.setOption(option)
    },

    // 窗口缩放适配
    handleWindowResize() {
      this.chartInstances.forEach(instance => instance && instance.resize())
    },

    // 获取列表数据
    async fetchTableData() {
      const request = ++this.listRequest
      this.loading = true
      try {
        const query = this.appliedQuery
        const params = {
          ruleVersionTag: query.pointSystem,
          custId: query.custId,
          custName: query.custName,
          grade: query.currentGrade,
          channel: query.channel,
          orgName: query.orgName,
          idType: query.idType,
          idNo: query.idNo,
          mobile: query.mobile,
          pageNum: this.page.currentPage,
          pageSize: this.page.pageSize
        }

        const statsParams = { ...params }
        delete statsParams.pageNum
        delete statsParams.pageSize
        const [res, statsRes] = await Promise.all([
          getCustPointListApi(params),
          getCustPointStatsApi(statsParams).catch(() => null)
        ])
        if (request !== this.listRequest) return

        const stats = statsRes && (statsRes.data || statsRes.body?.data)
        if (stats) {
          const total = Number(stats.total || 0)
          const byVersion = stats.byVersion || {}
          this.totalStats.total = total
          this.totalStats.newSystem.count = Number(byVersion.V2_2027 || 0)
          this.totalStats.oldSystem.count = Number(byVersion.V1_LEGACY || 0)
          this.totalStats.newSystem.percent = total ? (this.totalStats.newSystem.count / total * 100).toFixed(1) : 0
          this.totalStats.oldSystem.percent = total ? (this.totalStats.oldSystem.count / total * 100).toFixed(1) : 0
          this.totalStats.grades = stats.gradeByVersion || { V2_2027: {}, V1_LEGACY: {} }
          this.chartInstances.forEach(instance => instance && instance.dispose())
          this.chartInstances = []
          this.$nextTick(() => this.initCharts())
        } else {
          this.totalStats = {
            total: 0,
            newSystem: { count: 0, percent: 0 },
            oldSystem: { count: 0, percent: 0 },
            grades: { V2_2027: {}, V1_LEGACY: {} }
          }
          this.chartInstances.forEach(instance => instance && instance.dispose())
          this.chartInstances = []
          this.$nextTick(() => this.initCharts())
          this.$message.error('客户积分统计加载失败')
        }

        if (res && res.data) {
          const bodyData = res.data || {}
          this.total = bodyData.total || 0
          this.totalStats.total = this.total

          // 映射计算序号
          const list = bodyData.list || []
          this.tableData = list.map((item, index) => ({
            ...this.normalizeCustomer(item),
            seq: (this.page.currentPage - 1) * this.page.pageSize + index + 1
          }))
        } else {
          this.tableData = []
          this.total = 0
          this.$message.error(res?.header?.message || '获取客户积分列表失败')
        }
      } catch (error) {
        if (request !== this.listRequest) return
        this.tableData = []
        this.total = 0
        console.error('获取列表接口错误:', error)
        this.$message.error('网络请求异常，请稍后再试')
      } finally {
        if (request === this.listRequest) this.loading = false
      }
    },

    normalizeCustomer(item) {
      const row = { ...item }
      row.pointSystem = item.pointSystem || (row.ruleVersionTag === 'V1_LEGACY' ? '老积分体系' : row.ruleVersionTag === 'V2_2027' ? '新积分体系' : '')
      return row
    },

    // 等级映射 CSS class 编码
    getLevelCode(grade) {
      if (!grade) return 'default'
      grade = this.formatGrade(grade)
      if (grade.includes('普星')) return 'puxing'
      if (grade.includes('三星')) return '3star'
      if (grade.includes('四星')) return '4star'
      if (grade.includes('五星')) return '5star'
      if (grade.includes('卓越')) return 'zhuoyue'
      if (grade.includes('尊耀')) return 'zunyao'
      return 'default'
    },

    formatGrade(grade) {
      const gradeMap = {
        PUXING: '普星',
        SANXING: '三星',
        SIXING: '四星',
        WUXING: '五星',
        ZHUOYUE: '卓越',
        ZUNYAO: '尊耀'
      }
      return gradeMap[grade] || grade || '—'
    },

    isLegacySystem(row) {
      return row.pointSystem === '老积分体系' || row.ruleVersionTag === 'V1_LEGACY'
    },

    formatSystem(row) {
      if (this.isLegacySystem(row)) return '老积分体系'
      if (row.pointSystem === '新积分体系' || row.ruleVersionTag === 'V2_2027') return '新积分体系'
      return row.pointSystem || row.ruleVersionTag || '—'
    },

    handleSearch() {
      this.appliedQuery = { ...this.queryForm }
      this.page.currentPage = 1
      this.fetchTableData()
    },

    handleReset() {
      this.queryForm = {
        pointSystem: '',
        currentGrade: '',
        channel: '',
        orgName: '',
        custId: '',
        custName: '',
        idType: '',
        idNo: '',
        mobile: ''
      }
      this.page.currentPage = 1
      this.appliedQuery = { ...this.queryForm }
      this.fetchTableData()
    },

    async handleExport() {
      if (this.exportLoading) return
      this.exportLoading = true
      try {
        const query = this.appliedQuery
        const params = {
          ruleVersionTag: query.pointSystem,
          custId: query.custId,
          custName: query.custName,
          grade: query.currentGrade,
          channel: query.channel,
          orgName: query.orgName,
          idType: query.idType,
          idNo: query.idNo,
          mobile: query.mobile
        }
        const blob = await exportCustListApi(params)
        await assertExportBlob(blob)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '客户积分列表.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (error) {
        this.$message.error('导出失败')
      } finally {
        this.exportLoading = false
      }
    },

    handleDetail(row) {
      this.$router.push({
        path: '/personal/manageDetails',
        query: { custId: row.custId }
      })
    },

    handlePointDetail(row) {
      this.$router.push({
        path: '/personal/oldPointDetail',
        query: { custId: row.custId }
      })
    },

    handleRightDetail(row) {
      this.$router.push({
        path: '/personal/oldBenefitDetail',
        query: { custId: row.custId }
      })
    },

    handleSizeChange(val) {
      this.page.pageSize = val
      this.page.currentPage = 1
      this.fetchTableData()
    },

    handleCurrentChange(val) {
      this.page.currentPage = val
      this.fetchTableData()
    }
  }
}
</script>

<style scoped>
.customer-points-container {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-heading {
  margin: 2px 0 16px;
}
.page-heading h1 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 22px;
  line-height: 1.3;
}
.page-heading p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.filter-card {
  margin-bottom: 16px;
  border: 1px solid #e1e5ec;
  background: #fff;
}

.filter-card ::v-deep .el-card__body {
  padding: 16px 18px 10px;
}
.prototype-filter-form ::v-deep .el-form-item {
  margin-bottom: 12px;
}
.prototype-filter-form ::v-deep .el-input__inner,
.prototype-filter-form ::v-deep .el-select .el-input__inner {
  height: 40px;
  line-height: 40px;
  border-radius: 3px;
  color: #606266;
  border-color: #cfd5df;
  background: #fff;
}
.prototype-filter-form ::v-deep .el-input__inner::placeholder {
  color: #a8afb9;
}
.prototype-filter-form ::v-deep .el-input__inner:hover,
.prototype-filter-form ::v-deep .el-select:hover .el-input__inner {
  border-color: #7f98c6;
}
.prototype-filter-form ::v-deep .el-input.is-focus .el-input__inner,
.prototype-filter-form ::v-deep .el-select .el-input.is-focus .el-input__inner {
  border-color: #4b69a6;
}
.prototype-filter-form ::v-deep .el-form-item__content {
  margin-left: 0 !important;
}

.btn-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  padding-left: 24px;
}
.prototype-filter-form .btn-container .el-button {
  height: 36px;
  line-height: normal;
  width: 62px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 4px;
}

.btn-reset {
  background-color: #fff !important;
  color: #4472c4 !important;
  border-color: #4472c4 !important;
}
.btn-reset:hover {
  background-color: #fff;
}

.btn-export {
  color: #4472c4;
  border-color: #4472c4;
  background: #fff;
}
.btn-container > .el-button:not(.btn-reset):not(.btn-search) {
  color: #526b9f;
  border-color: #8fa6cf;
  background: #fff;
}
.btn-container > .el-button:not(.btn-reset):not(.btn-search):hover {
  color: #3f5b94;
  border-color: #4b69a6;
  background: #f6f8fc;
}

/* 统计卡片栅格样式 */
.stats-cards-container {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background-color: #fff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

/* 顶部不同颜色的边框线 */
.border-blue {
  border-top: 3px solid #3b82f6;
}
.border-green {
  border-top: 3px solid #2e7d32;
}
.border-blue-dark {
  border-top: 3px solid #2563eb;
}

.card-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
}

.card-value-box {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.card-value {
  font-size: 26px;
  font-weight: bold;
  color: #1f2937;
  line-height: 1;
}

.card-unit {
  font-size: 12px;
  color: #9ca3af;
}

/* 图表背景框及容器 */
.chart-wrapper {
  background-color: #f8fafc;
  border-radius: 6px;
  padding: 8px 10px 4px 10px;
}

.chart-container {
  width: 100%;
  height: 65px;
}

/* 列表样式 */
.table-card {
  margin-bottom: 16px;
}

.table-header {
  margin-bottom: 12px;
}

.table-header .title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-right: 8px;
}

.table-header .subtitle {
  font-size: 12px;
  color: #909399;
}

/* 客户积分体系标签 */
.system-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 10px;
}
.system-new {
  background-color: #e8f5e9;
  color: #2e7d32;
}
.system-old {
  background-color: #e8f0fe;
  color: #1a73e8;
}

/* 客户等级标签自定义样式 */
.tag-level {
  border-radius: 12px;
  padding: 0 10px;
}
.tag-puxing {
  background-color: #fef6ec;
  border-color: #fbd8b0;
  color: #e6a23c;
}
.tag-3star {
  background-color: #ebf3ff;
  border-color: #c0dcff;
  color: #3b82f6;
}
.tag-4star {
  background-color: #eef9f2;
  border-color: #c1ebd0;
  color: #43a047;
}
.tag-5star {
  background-color: #fdf6ec;
  border-color: #f5dab1;
  color: #e6a23c;
}
.tag-zhuoyue {
  background-color: #f4ecfb;
  border-color: #dcbbf5;
  color: #8e24aa;
}
.tag-zunyao {
  background-color: #fce4ec;
  border-color: #f8bbd0;
  color: #d81b60;
}

/* 状态文本颜色 */
.text-success {
  color: #67c23a;
  font-weight: bold;
}
.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
.text-bold {
  font-weight: bold;
  color: #303133;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}

/* 给 Tooltip 加上底部小箭头 */
::v-deep .echarts-tooltip {
  position: absolute;
}
::v-deep .echarts-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1e293b; /* 保持与背景颜色一致 */
}
</style>
