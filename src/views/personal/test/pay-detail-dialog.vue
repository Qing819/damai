<template>
  <el-dialog title="实收记录明细" :visible.sync="visible" width="660px" append-to-body>
    <div v-loading="loading">
      <div class="section-title">实收记录</div>
      <div class="receive-grid">
        <div v-for="field in fields" :key="field[0]" class="receive-item">
          <span class="receive-label">{{ field[1] }}</span>
          <strong>{{ display(field[0]) }}</strong>
        </div>
      </div>
      <div class="section-title">备注</div>
      <div class="receive-remark">{{ record.remark || '—' }}</div>
    </div>
    <div slot="footer"><el-button size="small" @click="visible = false">关闭</el-button></div>
  </el-dialog>
</template>

<script>
import { getPayDetailApi } from '@/api/test/point'

export default {
  name: 'PayDetailDialog',
  data() {
    return {
      visible: false,
      loading: false,
      requestId: 0,
      record: {},
      fields: [
        ['policyTypeNo', '保单险种号码'], ['payCount', '第几次交费'],
        ['grpContno', '集体合同号码'], ['grpPolno', '集体保单号码'],
        ['contno', '个人合同号码'], ['manageOrg', '管理机构'],
        ['agentOrg', '代理机构'], ['agentSubOrg', '代理机构内部分类'],
        ['riskcode', '险种编码'], ['agentCode', '代理人编码'],
        ['agentGroup', '代理人组别'], ['renewFlag', '续保收费标记'],
        ['appntNo', '投保人客户号码'], ['payReceiptNo', '交费收据号码'],
        ['payPurpose', '交费目的分类'], ['dutyCode', '责任编码'],
        ['payPlanCode', '交费计划编码'], ['sumPremium', '总应交金额'],
        ['sumActuPay', '总实交金额'], ['payInterval', '交费间隔'],
        ['payDate', '交费日期'], ['payType', '交费类型'],
        ['arriveDate', '到帐日期'], ['confDate', '确认日期'],
        ['origPayToDate', '原交至日期'], ['curPayToDate', '现交至日期'],
        ['accountState', '转入保险帐户状态'], ['checkerCode', '复核人编码'],
        ['checkerDate', '复核日期'], ['checkerTime', '复核时间'],
        ['serialNo', '流水号'], ['operator', '操作员'],
        ['inputDate', '入机日期'], ['inputTime', '入机时间'],
        ['noticeNo', '通知书号码'], ['lastModifyDate', '最后一次修改日期'],
        ['lastModifyTime', '最后一次修改时间'], ['mainPolicyYear', '主险保单年度'],
        ['edorBatchNo', '保全批单号'], ['currency', '币别']
      ]
    }
  },
  methods: {
    display(key) {
      const value = this.record[key]
      return value === undefined || value === null || value === '' ? '—' : value
    },
    async open(payNo) {
      if (!payNo) return
      const requestId = ++this.requestId
      this.visible = true
      this.loading = true
      this.record = {}
      try {
        const res = await getPayDetailApi(payNo)
        if (requestId !== this.requestId || !this.visible) return
        if (!res.data || !(res.data.payNo || res.data.pay_no)) throw new Error('实收记录不存在')
        this.record = res.data
      } catch (error) {
        if (requestId !== this.requestId) return
        this.visible = false
        this.$message.error('获取实收记录明细失败，请重试')
      } finally {
        if (requestId === this.requestId) this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.receive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin: 16px 0 24px; }
.receive-item { display: flex; gap: 12px; min-width: 0; align-items: baseline; }
.receive-label { color: #5a6472; font-size: 13px; flex-shrink: 0; }
.receive-item strong, .receive-remark { color: #333a45; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.receive-remark { margin-top: 16px; white-space: pre-wrap; }
</style>
