<template>
  <div class="customer-point-detail-page" v-loading="loading">
    <div class="page-heading">
      <div class="breadcrumb">积分管理 <span>/</span> 客户积分管理 <span>/</span> 客户积分详情</div>
      <div class="heading-row">
        <div>
          <h1>客户积分详情</h1>
          <p>客户基本信息、权益现状，及积分、等级、权益三类轨迹（敏感信息脱敏展示）</p>
        </div>
        <el-button size="small" icon="el-icon-back" @click="goBack">返回</el-button>
      </div>
    </div>

    <div class="detail-content">
      <!-- 1. 客户基本信息 -->
      <div class="section-card">
        <div class="section-title">客户基本信息</div>
        <el-descriptions :column="3" border class="custom-descriptions">
          <el-descriptions-item label="客户号">{{ userInfo.cust_id || '—' }}</el-descriptions-item>
          <el-descriptions-item label="核心客户号">{{ userInfo.core_cust_id || '—' }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ userInfo.cust_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ userInfo.id_type || '—' }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ userInfo.id_no || '—' }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ userInfo.mobile || '—' }}</el-descriptions-item>
          <el-descriptions-item label="客户级别">
            <el-tag type="warning" size="small">{{ formatGrade(userInfo.current_grade) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属渠道">{{ userInfo.channel || '—' }}</el-descriptions-item>
          <el-descriptions-item label="服务归属机构">{{ userInfo.org_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="二级机构">{{ userInfo.org2_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="三级机构">{{ userInfo.org3_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="代理人">{{ userInfo.agent || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 2. 积分汇总 -->
      <div class="section-card">
        <div class="section-title">积分汇总</div>
        <el-row :gutter="16">
          <el-col :span="6" v-for="(item, index) in pointsSummaryList" :key="index">
            <div class="points-box">
              <div class="box-label">{{ item.label }}</div>
              <div class="box-value" :class="{ highlight: item.highlight }">{{ item.value | formatNumber }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 3. 权益现状 -->
      <div class="section-card">
        <div class="section-title">权益现状</div>
        <el-table :data="benefitsData" header-row-class-name="custom-header" border size="small">
          <el-table-column prop="benefit_name" label="服务项目" align="center" />
          <el-table-column label="可使用次数" align="center">
            <template slot-scope="{row}">
              {{ row.limit_type === 'unlimited' ? '不限' : (row.grant_count || '—') }}
            </template>
          </el-table-column>
          <el-table-column prop="used_count" label="已使用次数" align="center">
            <template slot-scope="{row}">
              {{ row.used_count !== null && row.used_count !== undefined ? row.used_count : 0 }}
            </template>
          </el-table-column>
          <el-table-column label="剩余次数" align="center">
            <template slot-scope="{row}">
              {{ row.limit_type === 'unlimited' ? '不限' : (row.remain_count !== null ? row.remain_count : '—') }}
            </template>
          </el-table-column>
          <el-table-column prop="grant_time" label="获得时间" align="center" />
          <el-table-column prop="expire_time" label="失效时间" align="center" />
        </el-table>
      </div>

      <!-- 4. 客户轨迹 Tab 页 -->
      <div class="section-card border-none">
        <div class="section-title main-title">客户轨迹</div>
        <el-tabs v-model="activeTab" type="card" class="custom-tabs">
          <!-- 积分轨迹 -->
          <el-tab-pane label="积分轨迹" name="points">
            <el-table :data="pointsTrack" header-row-class-name="custom-header" border size="small">
              <el-table-column label="操作类型" width="100" align="center">
                <template slot-scope="{row}">
                  <el-tag size="mini" :type="['SYSTEM', '系统调整'].includes(row.operate_type) ? 'success' : 'info'">
                    {{ formatOperateType(row.operate_type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="积分类型" width="120" align="center">
                <template slot-scope="{row}">
                  <el-tag size="mini" :type="getPointTypeTagType(row.point_type)" effect="light">
                    {{ formatPointType(row.point_type) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="direction" label="方向" width="80" align="center">
                <template slot-scope="{row}">
                  <span :class="isAddDirection(row.direction) ? 'text-green' : 'text-red'">
                    {{ formatDirection(row.direction) }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column label="调整积分额度" width="120" align="center">
                <template slot-scope="{row}">
                  <strong :class="isAddDirection(row.direction) ? 'text-green' : 'text-red'">
                    {{ isAddDirection(row.direction) ? '+' : '-' }}{{ Math.abs(row.point_amt || 0) | formatNumber }}
                  </strong>
                </template>
              </el-table-column>

              <el-table-column prop="policy_no" label="关联保单号" align="center">
                <template slot-scope="{row}">{{ row.policy_no || '—' }}</template>
              </el-table-column>
              <el-table-column prop="valid_end_date" label="积分有效期" align="center" />
              <el-table-column prop="before_point" label="调整前积分" align="right" />
              <el-table-column prop="after_point" label="调整后积分" align="right" />
              <el-table-column prop="oa_no" label="OA流水号" align="center" />
              <el-table-column prop="reason" label="调整原因" align="center" />
              <el-table-column prop="operator" label="操作人" align="center" />
              <el-table-column prop="operate_time" label="操作时间" width="150" align="center" />
              <el-table-column label="操作" width="90" fixed="right" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="handleDetail(scope.row)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 等级变化轨迹 -->
          <el-tab-pane label="等级变化轨迹" name="level">
            <el-table :data="levelTrack" header-row-class-name="custom-header" border size="small">
              <el-table-column prop="trace_no" label="轨迹编号" align="center" />
              <el-table-column prop="cust_name" label="客户姓名" align="center" />
              <el-table-column label="变化类型" align="center">
                <template slot-scope="{row}">
                  <el-tag size="mini" type="info">{{ row.change_type || '—' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="grade_before" label="变化前等级" align="center" />
              <el-table-column prop="grade_after" label="变化后等级" align="center" />
              <el-table-column label="变化时积分" align="center">
                <template slot-scope="{row}">{{ row.change_point | formatNumber }}</template>
              </el-table-column>
              <el-table-column prop="change_time" label="变化时间" align="center" />
            </el-table>
          </el-tab-pane>

          <!-- 权益轨迹 -->
          <el-tab-pane label="权益轨迹" name="benefitTrack">
            <el-table :data="benefitTrackData" header-row-class-name="custom-header" border size="small">
              <el-table-column prop="usage_no" label="使用编号" align="center" />
              <el-table-column prop="benefit_name" label="权益项" align="center" />
              <el-table-column prop="use_time" label="使用时间" align="center" />
              <el-table-column prop="use_count" label="本次使用次数" align="center" />
              <el-table-column prop="use_channel" label="使用渠道" align="center" />
              <el-table-column prop="supplier" label="服务供应商" align="center" />
              <el-table-column label="剩余次数" align="center">
                <template slot-scope="{row}">
                  {{ row.remain_count !== null && row.remain_count !== undefined ? row.remain_count : '不限' }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <div class="page-footer">
      <el-button size="small" @click="goBack">返回</el-button>
      <el-button type="primary" icon="el-icon-download" size="small" @click="handleExport">导出</el-button>
    </div>

    <!-- 6. 轨迹详情二级嵌套弹窗（包含：保单生效日期 & 交费年期） -->
    <el-dialog
        title="轨迹详情"
        :visible.sync="innerTraceDetailVisible"
        width="680px"
        append-to-body
        custom-class="detail-dialog"
    >
      <div class="dialog-content" v-if="traceDetailData">
        <!-- 保单信息区 -->
        <div class="detail-section">
          <div class="section-title">保单信息</div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">客户：<strong>{{ traceDetailData.cust_name || userInfo.cust_name }} ({{ traceDetailData.cust_id || userInfo.cust_id }})</strong></el-col>
            <el-col :span="12">证件类型：<strong>{{ traceDetailData.cert_type || '居民身份证' }}</strong></el-col>
            <el-col :span="12">证件号码：<strong>{{ traceDetailData.cert_no || '—' }}</strong></el-col>
            <el-col :span="12">服务归属机构：<strong>{{ traceDetailData.org_name || '天津分公司' }}</strong></el-col>
            <el-col :span="12" v-if="traceDetailData.policy_no">保单号：<strong class="text-primary">{{ traceDetailData.policy_no }}</strong></el-col>
            <el-col :span="12" v-if="traceDetailData.risk_code">险种号：<strong>{{ traceDetailData.risk_code }}</strong></el-col>
            <el-col :span="12" v-if="traceDetailData.product_name">产品：<strong>{{ traceDetailData.product_name }}</strong></el-col>

            <!-- 【新增1】针对保费积分或养老协同积分展示 保单生效日期 -->
            <el-col :span="12" v-if="isPolicyPointType(traceDetailData.point_type)">
              保单生效日期：<strong>{{ traceDetailData.policy_effective_date || '2024-05-06' }}</strong>
            </el-col>
          </el-row>
        </div>

        <!-- 积分调整信息区 -->
        <div class="detail-section">
          <div class="section-title">积分调整信息</div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">轨迹ID：<strong>{{ traceDetailData.trace_id }}</strong></el-col>
            <el-col :span="12">
              操作类型：
              <el-tag size="mini" :type="['SYSTEM', '系统调整'].includes(traceDetailData.operate_type) ? 'success' : 'primary'" effect="light">
                {{ formatOperateType(traceDetailData.operate_type) }}
              </el-tag>
            </el-col>
            <el-col :span="12">
              积分类型：
              <el-tag size="mini" :type="getPointTypeTagType(traceDetailData.point_type)" effect="light">
                {{ formatPointType(traceDetailData.point_type) }}
              </el-tag>
            </el-col>
            <el-col :span="12">
              调整方向：
              <span :class="isAddDirection(traceDetailData.direction) ? 'text-green' : 'text-red'" class="font-bold">
                {{ formatDirection(traceDetailData.direction) }}
              </span>
            </el-col>
            <el-col :span="12" class="adjustment-amount-row">
              调整积分额度：
              <span :class="isAddDirection(traceDetailData.direction) ? 'text-green' : 'text-red'" class="font-bold">
                {{ isAddDirection(traceDetailData.direction) ? '+' : '-' }} {{ Math.abs(traceDetailData.point_amt || 0) | formatNumber }}
              </span>
            </el-col>
            <el-col :span="12" v-if="traceDetailData.oa_no">OA流水号：<strong>{{ traceDetailData.oa_no }}</strong></el-col>
            <el-col :span="12">调整原因：<strong>{{ traceDetailData.reason || traceDetailData.rule_name || '—' }}</strong></el-col>
            <el-col :span="12">积分有效期：<strong>{{ traceDetailData.valid_end_date ? `自然年 (至当年${traceDetailData.valid_end_date})` : '长期有效' }}</strong></el-col>
            <el-col :span="12">操作人：<strong>{{ traceDetailData.operator || '系统' }}</strong></el-col>
            <el-col :span="12">操作时间：<strong>{{ traceDetailData.operate_time }}</strong></el-col>
          </el-row>
        </div>

        <!-- 积分变化示意卡片 -->
        <div class="detail-section">
          <div class="section-title">积分变化</div>
          <div class="change-card">
            <div class="change-item">
              <div class="change-label">调整前积分</div>
              <div class="change-val">{{ (traceDetailData.before_point || 0) | formatNumber }}</div>
            </div>
            <div class="change-arrow">→</div>
            <div class="change-item">
              <div class="change-label">调整后积分</div>
              <div class="change-val text-green">{{ (traceDetailData.after_point || 0) | formatNumber }}</div>
            </div>
          </div>
        </div>

        <!-- 触发规则区 (系统调整专属，包含交费年期) -->
        <div class="detail-section" v-if="['SYSTEM', '系统调整'].includes(traceDetailData.operate_type)">
          <div class="section-title">
            触发规则 <span class="sub-tip">系统自动调整，无需审批</span>
          </div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">
              积分类型：
              <el-tag size="mini" :type="getPointTypeTagType(traceDetailData.point_type)" effect="light">
                {{ formatPointType(traceDetailData.point_type) }}
              </el-tag>
            </el-col>
            <el-col :span="12">触发规则：<strong>{{ traceDetailData.rule_name || '期交实收保费积分规则 (R-001)' }}</strong></el-col>
            <el-col :span="12">规则版本：<strong>{{ traceDetailData.rule_version || 'V2.0' }}</strong></el-col>
            <el-col :span="12">实收记录：<strong class="text-primary">{{ traceDetailData.pay_record_no || 'SR2026082201' }}</strong></el-col>
            <el-col :span="12">缴费间隔：<strong>{{ traceDetailData.pay_interval || '年交' }}</strong></el-col>

            <!-- 【新增2】触发规则区域新增交费年期 -->
            <el-col :span="12">交费年期：<strong>{{ traceDetailData.pay_years ? `${traceDetailData.pay_years} 年` : '3 年' }}</strong></el-col>

            <el-col :span="12">缴费次数：<strong>{{ traceDetailData.pay_count ? `${traceDetailData.pay_count} 次` : '1 次' }}</strong></el-col>
            <el-col :span="12">交费金额：<strong>{{ (traceDetailData.pay_amt || 10000) | formatNumber }}</strong></el-col>
            <el-col :span="12">计算系数：<strong>{{ traceDetailData.calc_factor || '0.05' }}</strong></el-col>
          </el-row>
        </div>

        <!-- 附件区 -->
        <div class="detail-section" v-if="traceDetailData.attachment_name">
          <div class="section-title">附件</div>
          <el-link type="primary" icon="el-icon-document" :underline="false">
            {{ traceDetailData.attachment_name }}
          </el-link>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="innerTraceDetailVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getCustPointDetailApi, getPointTraceSummaryApi, getPointTraceDetailApi, exportTraceApi } from '@/api/test/point'

export default {
  name: 'CustomerPointDetailDialog',
  filters: {
    formatNumber(val) {
      if (val === null || val === undefined || isNaN(val)) return '0'
      return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    }
  },
  props: {
    custIdParam: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      activeTab: 'points',
      currentCustId: '',

      // 轨迹二级详情弹窗控制
      innerTraceDetailVisible: false,
      traceDetailData: null,

      directionMap: {
        ADD: '加分',
        SUB: '减分'
      },

      traceSummary: {
        add_total: 0,
        reduce_total: 0,
        net_change: 0,
        total: 0
      },
      userInfo: {},
      pointsSummary: {},
      benefitsData: [],
      pointsTrack: [],
      levelTrack: [],
      benefitTrackData: []
    }
  },
  computed: {
    traceSummaryCards() {
      return [
        { title: '本期加分总额', value: this.traceSummary.add_total, color: '#67c23a' },
        { title: '本期减分总额', value: this.traceSummary.reduce_total, color: '#f56c6c' },
        { title: '本期净变化', value: this.traceSummary.net_change, color: '#6383ff' },
        { title: '轨迹总笔数', value: this.traceSummary.total, color: '#909399' }
      ]
    },
    pointsSummaryList() {
      return [
        { label: '当前积分', value: this.pointsSummary.current_point || 0, highlight: true },
        { label: '保费积分', value: this.pointsSummary.premium_point || 0 },
        { label: '忠诚积分', value: this.pointsSummary.loyalty_point || 0 },
        { label: '人工调整积分', value: this.pointsSummary.manual_point || 0 }
      ]
    }
  },
  watch: {
    custIdParam: {
      handler(val) {
        if (val) {
          this.currentCustId = val
        }
      },
      immediate: true
    }
  },
  mounted() {
    const custId = this.$route.query.custId
    if (custId) {
      this.currentCustId = custId
      this.fetchAllData(custId)
    }
  },
  methods: {
    // 判断积分类型是否包含保单生效日期（保费积分/养老协同积分）
    isPolicyPointType(type) {
      const targets = ['PREMIUM', '保费积分', 'PENSION', '养老协同积分']
      return targets.includes(type)
    },

    getPointTypeTagType(type) {
      if (['MANUAL', '人工调整'].includes(type)) return 'warning'
      if (['PENSION', '养老协同积分'].includes(type)) return 'purple'
      return 'primary'
    },

    isAddDirection(direction) {
      return direction === 'ADD' || direction === '加分'
    },

    formatPointType(type) {
      const typeMap = {
        PREMIUM: '保费积分',
        LOYALTY: '忠诚积分',
        PENSION: '养老协同积分',
        MANUAL: '人工调整'
      }
      return typeMap[type] || type || '—'
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

    formatDirection(direction) {
      if (!direction) return '—'
      return this.directionMap[direction] || direction
    },

    formatOperateType(type) {
      const typeMap = {
        MANUAL: '人工调整',
        SYSTEM: '系统调整'
      }
      return typeMap[type] || type || '—'
    },

    open(custId) {
      this.currentCustId = custId || this.custIdParam
      this.fetchAllData(this.currentCustId)
    },

    goBack() {
      this.$router.back()
    },

    async fetchAllData(custId) {
      this.loading = true
      try {
        await Promise.all([
          this.fetchTraceSummary(),
          custId ? this.fetchDetailData(custId) : Promise.resolve()
        ])
      } catch (err) {
        console.error('加载数据失败:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchTraceSummary() {
      try {
        const res = await getPointTraceSummaryApi()
        if (res && res.data) {
          this.traceSummary = res.data || { add_total: 0, reduce_total: 0, net_change: 0, total: 0 }
        }
      } catch (err) {
        console.error('获取积分轨迹统计失败:', err)
      }
    },

    async fetchDetailData(custId) {
      try {
        const res = await getCustPointDetailApi(custId)
        if (res && res.data) {
          const data = res.data || {}
          const profile = data.profile || {}
          const baseInfo = data.custBaseInfo || {}
          this.userInfo = {
            cust_id: profile.cust_id || profile.custId || baseInfo.custId,
            core_cust_id: profile.core_cust_id || profile.coreCustId || baseInfo.coreCustId,
            cust_name: profile.cust_name || profile.custName || baseInfo.custName,
            id_type: profile.id_type || profile.idType || baseInfo.idType,
            id_no: profile.id_no || profile.idNo || baseInfo.idNo,
            mobile: profile.mobile || baseInfo.mobile,
            current_grade: profile.current_grade || profile.currentGrade,
            channel: profile.channel || profile.channelName || baseInfo.channel || baseInfo.channelName,
            org_name: profile.org_name || profile.orgName || baseInfo.orgName,
            org2_name: profile.org2_name || profile.org2Name || baseInfo.org2Name,
            org3_name: profile.org3_name || profile.org3Name || baseInfo.org3Name,
            agent: profile.agent || baseInfo.agent
          }
          this.pointsSummary = data.pointSummary || data.point_summary || {}
          this.pointsTrack = (data.pointTraces || data.point_traces || []).map(item => ({
            ...item,
            trace_id: item.trace_id || item.traceId,
            cust_id: item.cust_id || item.custId,
            operate_type: item.operate_type || item.operateType,
            point_type: item.point_type || item.pointType,
            point_amt: item.point_amt !== undefined ? item.point_amt : item.pointAmt,
            valid_end_date: item.valid_end_date || item.validEndDate,
            policy_no: item.policy_no || item.policyNo,
            rule_code: item.rule_code || item.ruleCode,
            operate_time: item.operate_time || item.operateTime,
            before_point: item.before_point !== undefined ? item.before_point : item.beforePoint,
            after_point: item.after_point !== undefined ? item.after_point : item.afterPoint,
            oa_no: item.oa_no || item.oaNo,
            operator: item.operator
          }))
          this.levelTrack = data.gradeTraces || data.grade_traces || []
          this.benefitsData = data.benefitStatus || data.benefit_status || []
          this.benefitTrackData = data.usageRecords || data.usage_records || []
        } else {
          this.$message.error(res?.header?.message || '获取客户积分详情失败')
        }
      } catch (err) {
        console.error('获取详情接口错误:', err)
      }
    },

    async handleExport() {
      try {
        const blob = await exportTraceApi({ custId: this.currentCustId })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `客户${this.currentCustId || ''}积分轨迹.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (err) {
        this.$message.error('导出失败')
      }
    },

    // 点击轨迹列表的“查看详情”后读取完整轨迹详情
    async handleDetail(row) {
      this.traceDetailData = { ...row }
      this.innerTraceDetailVisible = true
      if (!row.trace_id) return

      try {
        const res = await getPointTraceDetailApi(row.trace_id)
        if (res && res.data) {
          const detail = res.data.trace || res.data
          this.traceDetailData = { ...row, ...detail }
          this.traceDetailData.pay_record_no = detail.pay_no || detail.pay_record_no
          this.traceDetailData.calc_factor = detail.calc_coefficient !== undefined ? detail.calc_coefficient : detail.calc_factor
          this.traceDetailData.attachment_name = detail.attachment || detail.attachment_name
          this.traceDetailData.apply = res.data.apply || null
        }
      } catch (err) {
        console.error('获取积分轨迹详情失败:', err)
        this.$message.error('获取轨迹详情失败，请稍后重试')
      }
    }
  }
}
</script>

<style scoped>
.customer-point-detail-page {
  min-height: 100%;
  padding: 20px 24px 28px;
  background: #f5f7fa;
}

.page-heading {
  margin-bottom: 18px;
}

.breadcrumb {
  margin-bottom: 14px;
  color: #909399;
  font-size: 13px;
}

.breadcrumb span {
  margin: 0 7px;
  color: #c0c4cc;
}

.heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.page-heading h1 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.page-heading p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.detail-content {
  max-width: 1440px;
  margin: 0 auto;
}

.section-card {
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-card:last-child {
  margin-bottom: 0;
}

.border-none {
  padding-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
}

.main-title {
  font-size: 16px;
  border-left: 4px solid #6383ff;
  padding-left: 8px;
  margin-bottom: 16px;
}

.points-box {
  border: 1px solid #dcdfe6;
  border-top: 3px solid #6383ff;
  border-radius: 4px;
  padding: 12px 16px;
  background: #fff;
}

.box-label {
  font-size: 12px;
  color: #909399;
}

.box-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-top: 6px;
}

.box-value.highlight {
  color: #6383ff;
}

.custom-header th {
  background-color: #4f6fae !important;
  color: #ffffff !important;
  font-weight: 500;
}

.text-green { color: #67c23a; }
.text-red { color: #f56c6c; }
.text-primary { color: #6383ff; }
.font-bold { font-weight: bold; }

.page-footer {
  max-width: 1440px;
  margin: 16px auto 0;
  text-align: right;
}

/* 嵌套详情弹窗内样式 */
.detail-section {
  margin-bottom: 20px;
}

.detail-section .section-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  padding-left: 8px;
  border-left: 3px solid #6383ff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.sub-tip {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-left: 8px;
}

.info-row .el-col {
  margin-bottom: 10px;
  font-size: 13px;
  color: #606266;
}

.info-row strong {
  color: #303133;
}

.info-row .adjustment-amount-row {
  clear: left;
}

.change-card {
  background-color: #f4f6fa;
  border-radius: 6px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.change-item {
  display: flex;
  flex-direction: column;
}

.change-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.change-val {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.change-arrow {
  font-size: 20px;
  color: #6383ff;
  margin: 0 32px;
}
</style>
