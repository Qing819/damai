<template>
  <div class="old-benefit-detail">
    <div class="page-header">
      <h2>老积分体系 - 权益详情</h2>
      <p>查询客户老积分体系下当前权益及使用情况</p>
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
        <span>权益清单</span>
        <el-button size="small" @click="goBack">返回客户积分管理</el-button>
      </div>
      <el-table v-loading="loading" :data="benefitList" border stripe size="small">
        <el-table-column prop="seq" label="序号" width="70" align="center" />
        <el-table-column prop="rule_name" label="权益规则" min-width="180" />
        <el-table-column prop="benefit_name" label="权益名称" min-width="180" />
        <el-table-column prop="benefit_desc" label="权益说明" min-width="260" show-overflow-tooltip />
        <el-table-column prop="usable_count" label="可用次数" width="110" align="center" />
        <el-table-column prop="used_count" label="已使用次数" width="110" align="center" />
        <el-table-column prop="gain_time" label="获得时间" width="130" align="center" />
        <el-table-column prop="expire_time" label="失效时间" width="130" align="center" />
      </el-table>
      <div class="total">共 {{ total }} 条权益</div>
    </el-card>
  </div>
</template>

<script>
import { getOldBenefitListApi } from '@/api/test/point'

export default {
  name: 'OldBenefitDetail',
  data() {
    return {
      custId: this.$route.query.custId || '',
      customer: {},
      benefitList: [],
      total: 0,
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
        const res = await getOldBenefitListApi(this.custId)
        const data = res?.data || res?.body?.data || {}
        this.customer = data.customer_info || {}
        this.benefitList = data.benefit_list || []
        this.total = Number(data.total || this.benefitList.length)
      } catch (err) {
        this.$message.error('获取老积分权益详情失败')
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
.old-benefit-detail { min-height: 100vh; padding: 20px; background: #f5f7fa; }
.page-header h2 { margin: 0; color: #303133; }
.page-header p { color: #909399; font-size: 13px; }
.customer-card, .table-card { margin-top: 16px; }
.table-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
.total { margin-top: 16px; color: #909399; text-align: right; font-size: 13px; }
</style>
