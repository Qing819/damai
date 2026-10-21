<template>
  <div class="old-point-detail">
    <div class="page-header">
      <h2>老积分体系 - 积分详情</h2>
      <p>查询客户老积分体系下的级别积分、消费积分和级别变化轨迹</p>
    </div>
    <el-card shadow="never" class="customer-card">
      <el-descriptions :column="4" size="small">
        <el-descriptions-item label="客户号">{{ customer.cust_no || custId }}</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ customer.cust_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="客户等级">{{ customer.cust_grade || '—' }}</el-descriptions-item>
        <el-descriptions-item label="服务归属机构">{{ customer.org_name || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div slot="header" class="table-header">
        <span>积分轨迹</span>
        <div>
          <el-button size="small" @click="goBack">返回客户积分管理</el-button>
        </div>
      </div>
      <el-form inline size="small" class="filter-form">
        <el-form-item label="操作日期">
          <el-date-picker v-model="dateRange" type="daterange" value-format="yyyy-MM-dd" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
      <el-tabs v-model="activeTab" @tab-click="loadData">
        <el-tab-pane label="级别积分" name="GRADE" />
        <el-tab-pane label="消费积分" name="CONSUME" />
        <el-tab-pane label="级别变化" name="GRADE_CHANGE" />
      </el-tabs>
      <el-table v-loading="loading" :data="traceList" border stripe size="small">
        <el-table-column prop="seq" label="序号" width="70" align="center" />
        <el-table-column prop="adjust_type" label="调整类型" min-width="160" />
        <el-table-column prop="point_change" label="积分变动" width="120" align="right" />
        <el-table-column prop="after_grade_point" label="变动后级别积分" width="140" align="right" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="operate_time" label="操作时间" width="170" />
        <el-table-column prop="remark" label="备注" min-width="260" show-overflow-tooltip />
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next, sizes" :total="total" :current-page.sync="pageNum" :page-size.sync="pageSize" :page-sizes="[10, 20, 50]" @current-change="loadData" @size-change="loadData" />
      </div>
    </el-card>
  </div>
</template>

<script>
import { getOldPointTracePageApi } from '@/api/test/point'

export default {
  name: 'OldPointDetail',
  data() {
    return {
      custId: this.$route.query.custId || '',
      activeTab: 'GRADE',
      dateRange: [],
      customer: {},
      traceList: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      loading: false
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      if (!this.custId) return
      this.loading = true
      try {
        const params = {
          custId: this.custId,
          tab: this.activeTab,
          startDate: this.dateRange && this.dateRange[0],
          endDate: this.dateRange && this.dateRange[1],
          pageNum: this.pageNum,
          pageSize: this.pageSize
        }
        const res = await getOldPointTracePageApi(params)
        const data = res?.data || res?.body?.data || {}
        this.customer = data.customer_info || {}
        this.traceList = data.trace_list || []
        this.total = Number(data.total || 0)
      } catch (err) {
        this.$message.error('获取老积分详情失败')
      } finally {
        this.loading = false
      }
    },
    goBack() {
      this.$router.push('/personal/manage')
    }
  }
}
</script>

<style scoped>
.old-point-detail { min-height: 100vh; padding: 20px; background: #f5f7fa; }
.page-header h2 { margin: 0; color: #303133; }
.page-header p { color: #909399; font-size: 13px; }
.customer-card, .table-card { margin-top: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
.filter-form { margin-top: 16px; }
.pagination { margin-top: 16px; text-align: right; }
</style>
