<template>
  <div class="customer-points-container">
    <!-- 顶部筛选表单 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="queryForm" label-width="80px" size="small">
        <!-- 第一行（4列） -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="积分体系">
              <el-select v-model="queryForm.point_system" placeholder="全部积分体系" clearable style="width: 100%;">
                <el-option label="新积分体系" value="新积分体系" />
                <el-option label="老积分体系" value="老积分体系" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户级别">
              <el-select v-model="queryForm.current_grade" placeholder="全部客户等级" clearable style="width: 100%;">
                <el-option label="普星" value="普星" />
                <el-option label="三星" value="三星" />
                <el-option label="四星" value="四星" />
                <el-option label="五星" value="五星" />
                <el-option label="卓越" value="卓越" />
                <el-option label="尊耀" value="尊耀" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属渠道">
              <el-select v-model="queryForm.channel" placeholder="全部所属渠道" clearable style="width: 100%;">
                <el-option label="个险" value="个险" />
                <el-option label="银保" value="银保" />
                <el-option label="经代" value="经代" />
                <el-option label="网电销" value="网电销" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="服务机构">
              <el-select v-model="queryForm.org_name" placeholder="全部服务机构" clearable style="width: 100%;">
                <el-option label="天津分公司" value="天津分公司" />
                <el-option label="北京分公司" value="北京分公司" />
                <el-option label="江苏分公司" value="江苏分公司" />
                <el-option label="上海分公司" value="上海分公司" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行（4列） -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="客户号">
              <el-input v-model="queryForm.cust_id" placeholder="请输入客户号" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户姓名">
              <el-input v-model="queryForm.cust_name" placeholder="请输入客户姓名" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="证件类型">
              <el-select v-model="queryForm.id_type" placeholder="全部证件类型" clearable style="width: 100%;">
                <el-option label="身份证" value="身份证" />
                <el-option label="护照" value="护照" />
                <el-option label="港澳居民来往内地通行证" value="港澳居民来往内地通行证" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="证件号码">
              <el-input v-model="queryForm.id_no" placeholder="请输入证件号码" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行（1列输入框 + 右侧按钮区） -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="手机号码">
              <el-input v-model="queryForm.mobile" placeholder="请输入手机号码" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="18" class="btn-container">
            <el-button class="btn-reset" size="mini" icon="el-icon-refresh" @click="handleReset">重 置</el-button>
            <el-button class="btn-search" size="mini" type="primary" icon="el-icon-search" @click="handleSearch">搜 索</el-button>
            <el-button icon="el-icon-download" size="mini" @click="handleExport">导 出</el-button>
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
        <el-table-column prop="point_system" label="客户积分体系" width="110" align="center">
          <template slot-scope="scope">
            <span :class="['system-tag', scope.row.point_system === '老积分体系' ? 'system-old' : 'system-new']">
              {{ scope.row.point_system || '新积分体系' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cust_id" label="客户号" width="130" />
        <el-table-column prop="core_cust_id" label="核心客户号" width="100" />
        <el-table-column prop="cust_name" label="客户姓名" width="90" />
        <el-table-column prop="id_type" label="证件类型" width="100" />
        <el-table-column prop="id_no" label="证件号码" width="170" />
        <el-table-column prop="mobile" label="手机号码" width="120" />
        <el-table-column prop="current_grade" label="客户等级" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :class="['tag-level', 'tag-' + getLevelCode(scope.row.current_grade)]" size="small" effect="plain">
              {{ scope.row.current_grade }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="所属渠道" width="100" show-overflow-tooltip />
        <el-table-column prop="premium_point" label="保费积分" width="100" align="right">
          <template slot-scope="scope">
            {{ scope.row.premium_point !== null && scope.row.premium_point !== undefined ? formatNumber(scope.row.premium_point) : '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="loyalty_point" label="忠诚积分" width="100" align="right">
          <template slot-scope="scope">
            <span v-if="scope.row.loyalty_point !== null && scope.row.loyalty_point !== undefined">
              {{ formatNumber(scope.row.loyalty_point) }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="manual_point" label="人工调整积分" width="110" align="right">
          <template slot-scope="scope">
            <span :class="scope.row.manual_point > 0 ? 'text-success' : scope.row.manual_point < 0 ? 'text-danger' : ''">
              {{ scope.row.manual_point > 0 ? '+' : '' }}{{ formatNumber(scope.row.manual_point) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="current_point" label="当前积分" width="110" align="right">
          <template slot-scope="scope">
            <span class="text-bold">{{ formatNumber(scope.row.current_point) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="org_name" label="服务归属机构" width="110" show-overflow-tooltip />
        <el-table-column prop="org2_name" label="二级机构" width="110" show-overflow-tooltip />
        <el-table-column prop="org3_name" label="三级机构" width="100" show-overflow-tooltip />
        <el-table-column prop="bank_name" label="所属银行" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.bank_name || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="agency" label="所属经纪公司" width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.agency || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="agent" label="代理人" width="90" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template slot-scope="scope">
            <template v-if="scope.row.point_system === '老积分体系'">
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
import { getCustPointListApi, exportCustListApi } from 'api/test/point'

export default {
  name: 'CustomerPoints',
  data() {
    return {
      loading: false,
      // 顶部三个统计卡片的数据
      totalStats: {
        total: 0,
        newSystem: { count: 6, percent: 60.0 },
        oldSystem: { count: 4, percent: 40.0 }
      },
      // 保存 ECharts 实例以便后续 dispose 和 resize
      chartInstances: [],
      queryForm: {
        point_system: '',
        current_grade: '',
        channel: '',
        org_name: '',
        cust_id: '',
        cust_name: '',
        id_type: '',
        id_no: '',
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

      const totalNum = 10 // 总人数

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1e293b', // 深色背景
          borderColor: '#1e293b',
          padding: [8, 12],
          textStyle: { color: '#ffffff' },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 6px;',
          formatter: (params) => {
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
              { name: '新积分体系', value: 6, itemStyle: { color: '#43a047' } },
              { name: '老积分体系', value: 4, itemStyle: { color: '#4a77e6' } }
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

      const totalNew = 6 // 新积分体系总人数

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1e293b',
          borderColor: '#1e293b',
          padding: [8, 12],
          textStyle: { color: '#ffffff' },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 6px;',
          formatter: (params) => {
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
              { name: '普星', value: 0 },
              { name: '三星', value: 1 },
              { name: '四星', value: 2 },
              { name: '五星', value: 2 },
              { name: '卓越', value: 1 },
              { name: '尊耀', value: 0 }
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

      const totalOld = 4 // 老积分体系总人数

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1e293b',
          borderColor: '#1e293b',
          padding: [8, 12],
          textStyle: { color: '#ffffff' },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 6px;',
          formatter: (params) => {
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
              { name: '普星', value: 1 },
              { name: '三星', value: 1 },
              { name: '四星', value: 1 },
              { name: '五星', value: 0 },
              { name: '卓越', value: 1 }
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
      this.loading = true
      try {
        const params = {
          pointSystem: this.queryForm.point_system,
          custId: this.queryForm.cust_id,
          custName: this.queryForm.cust_name,
          grade: this.queryForm.current_grade,
          channel: this.queryForm.channel,
          orgName: this.queryForm.org_name,
          idType: this.queryForm.id_type,
          idNo: this.queryForm.id_no,
          mobile: this.queryForm.mobile,
          pageNum: this.page.currentPage,
          pageSize: this.page.pageSize
        }

        const res = await getCustPointListApi(params)

        if (res && res.data) {
          const bodyData = res.data || {}
          this.total = bodyData.total || 0
          this.totalStats.total = this.total

          // 映射计算序号
          const list = bodyData.list || []
          this.tableData = list.map((item, index) => ({
            ...item,
            seq: (this.page.currentPage - 1) * this.page.pageSize + index + 1
          }))
        } else {
          this.$message.error(res?.header?.message || '获取客户积分列表失败')
        }
      } catch (error) {
        console.error('获取列表接口错误:', error)
        this.$message.error('网络请求异常，请稍后再试')
      } finally {
        this.loading = false
      }
    },

    // 等级映射 CSS class 编码
    getLevelCode(grade) {
      if (!grade) return 'default'
      if (grade.includes('普星')) return 'puxing'
      if (grade.includes('三星')) return '3star'
      if (grade.includes('四星')) return '4star'
      if (grade.includes('五星')) return '5star'
      if (grade.includes('卓越')) return 'zhuoyue'
      if (grade.includes('尊耀')) return 'zunyao'
      return 'default'
    },

    handleSearch() {
      this.page.currentPage = 1
      this.fetchTableData()
    },

    handleReset() {
      this.queryForm = {
        point_system: '',
        current_grade: '',
        channel: '',
        org_name: '',
        cust_id: '',
        cust_name: '',
        id_type: '',
        id_no: '',
        mobile: ''
      }
      this.page.currentPage = 1
      this.fetchTableData()
    },

    async handleExport() {
      try {
        const params = {
          pointSystem: this.queryForm.point_system,
          custId: this.queryForm.cust_id,
          custName: this.queryForm.cust_name,
          grade: this.queryForm.current_grade,
          channel: this.queryForm.channel,
          orgName: this.queryForm.org_name,
          idType: this.queryForm.id_type,
          idNo: this.queryForm.id_no,
          mobile: this.queryForm.mobile
        }
        const blob = await exportCustListApi(params)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '客户积分列表.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (error) {
        this.$message.error('导出失败')
      }
    },

    handleDetail(row) {
      this.$router.push({
        path: '/personal/manageDetails',
        query: { custId: row.cust_id }
      })
    },

    handlePointDetail(row) {
      this.$message.info(`查看客户 ${row.cust_name} 的积分详情`)
    },

    handleRightDetail(row) {
      this.$message.info(`查看客户 ${row.cust_name} 的权益详情`)
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

.filter-card {
  margin-bottom: 16px;
}

.filter-card ::v-deep .el-card__body {
  padding: 18px 20px 12px 20px;
}

.btn-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-bottom: 18px;
}

.btn-reset {
  background-color: #eef3fe;
  color: #5b8ff9;
  border-color: #d0e1fd;
}
.btn-reset:hover {
  background-color: #dbe7ff;
}

.btn-search {
  background-color: #5b8ff9;
  border-color: #5b8ff9;
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
