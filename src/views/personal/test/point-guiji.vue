<template>
  <div class="app-container">
    <!-- 1. 筛选查询表单 -->
    <el-card class="filter-container" shadow="never">
      <el-form
          :inline="true"
          :model="queryParams"
          ref="queryForm"
          size="small"
          label-width="100px"
          label-position="right"
          class="compact-query-form"
      >
        <el-form-item label="客户号" prop="custId">
          <el-input v-model.trim="queryParams.custId" placeholder="请输入客户号" clearable @keyup.enter.native="handleQuery" class="form-item-input" />
        </el-form-item>

        <el-form-item label="客户姓名" prop="custName">
          <el-input v-model.trim="queryParams.custName" placeholder="请输入姓名" clearable @keyup.enter.native="handleQuery" class="form-item-input" />
        </el-form-item>

        <el-form-item label="保单号" prop="policyNo">
          <el-input v-model.trim="queryParams.policyNo" placeholder="请输入保单号" clearable @keyup.enter.native="handleQuery" class="form-item-input" />
        </el-form-item>

        <el-form-item label="服务归属机构" prop="orgName">
          <el-select v-model="queryParams.orgName" placeholder="请选择机构" clearable class="form-item-input">
            <el-option label="天津分公司" value="天津分公司" />
            <el-option label="北京分公司" value="北京分公司" />
            <el-option label="江苏分公司" value="江苏分公司" />
            <el-option label="上海分公司" value="上海分公司" />
          </el-select>
        </el-form-item>

        <el-form-item label="操作类型" prop="operateType">
          <el-select v-model="queryParams.operateType" placeholder="请选择" clearable class="form-item-input">
            <el-option
                v-for="(name, code) in operateTypeMap"
                :key="code"
                :label="`${name} (${code})`"
                :value="code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="积分类型" prop="pointType">
          <el-select v-model="queryParams.pointType" placeholder="请选择" clearable class="form-item-input">
            <el-option
                v-for="(name, code) in pointTypeMap"
                :key="code"
                :label="`${name} (${code})`"
                :value="code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="方向" prop="direction">
          <el-select v-model="queryParams.direction" placeholder="请选择" clearable class="form-item-input">
            <el-option label="加分" value="ADD" />
            <el-option label="减分" value="SUB" />
          </el-select>
        </el-form-item>

        <el-form-item label="操作时间" class="date-form-item">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="~"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              class="form-item-date"
              @change="handleDateChange"
          />
        </el-form-item>

        <!-- 按钮组 -->
        <el-form-item class="search-btn-group">
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查 询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重 置</el-button>
          <el-button icon="el-icon-download" @click="handleExport">导 出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 本期轨迹统计卡片区 -->
    <el-row :gutter="16" class="summary-container">
      <el-col :span="6" v-for="(card, index) in summaryCards" :key="index">
        <div class="summary-box" :style="{ 'border-top-color': card.color }">
          <div class="box-label">{{ card.title }}</div>
          <div class="box-value" :style="{ color: card.color }">{{ card.value | formatNumber }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 3. 轨迹明细表格 -->
    <el-card class="table-container" shadow="never">
      <div slot="header" class="table-header-title">
        <span>轨迹明细</span>
      </div>

      <el-table
          v-loading="loading"
          :data="traceList"
          stripe
          size="small"
          header-row-class-name="custom-header"
          style="width: 100%"
      >
        <el-table-column prop="traceId" label="轨迹ID" min-width="140" align="center" show-overflow-tooltip />

        <el-table-column label="客户" min-width="160" align="center">
          <template slot-scope="{row}">
            {{ row.custName }} {{ row.custId ? `(${row.custId})` : '' }}
          </template>
        </el-table-column>

        <el-table-column prop="certType" label="证件类型" min-width="110" align="center" />
        <el-table-column prop="certNo" label="证件号码" min-width="160" align="center" show-overflow-tooltip />
        <el-table-column prop="orgName" label="服务归属机构" min-width="120" align="center" show-overflow-tooltip />

        <el-table-column label="操作类型" min-width="100" align="center">
          <template slot-scope="{row}">
            <el-tag size="mini" :type="['SYSTEM', '系统调整'].includes(row.operateType) ? 'success' : 'primary'" effect="light">
              {{ formatOperateType(row.operateType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="积分类型" min-width="120" align="center">
          <template slot-scope="{row}">
            <el-tag size="mini" :type="getPointTypeTagType(row.pointType)" effect="light">
              {{ formatPointType(row.pointType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="方向" min-width="70" align="center">
          <template slot-scope="{row}">
            <span :class="isAddDirection(row.direction) ? 'text-green' : 'text-red'" class="font-bold">
              {{ formatDirection(row.direction) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="调整积分额度" min-width="110" align="center">
          <template slot-scope="{row}">
            <strong :class="isAddDirection(row.direction) ? 'text-green' : 'text-red'">
              {{ isAddDirection(row.direction) ? '+' : '-' }} {{ Math.abs(row.pointAmt || row.point_amt || 0) | formatNumber }}
            </strong>
          </template>
        </el-table-column>

        <el-table-column label="调整前积分" min-width="100" align="center">
          <template slot-scope="{row}">{{ row.beforePoint | formatNumber }}</template>
        </el-table-column>

        <el-table-column label="调整后积分" min-width="100" align="center">
          <template slot-scope="{row}">{{ row.afterPoint | formatNumber }}</template>
        </el-table-column>

        <el-table-column prop="validEndDate" label="积分有效期" min-width="110" align="center">
          <template slot-scope="{row}">{{ row.validEndDate || '—' }}</template>
        </el-table-column>

        <el-table-column prop="policyNo" label="关联保单号" min-width="120" align="center">
          <template slot-scope="{row}">{{ row.policyNo || '—' }}</template>
        </el-table-column>

        <el-table-column prop="oaNo" label="OA流水号" min-width="140" align="center" show-overflow-tooltip>
          <template slot-scope="{row}">{{ row.oaNo || '—' }}</template>
        </el-table-column>

        <el-table-column prop="reason" label="调整原因" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" min-width="90" align="center" />
        <el-table-column prop="operateTime" label="操作时间" min-width="140" align="center" />

        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template slot-scope="{row}">
            <el-button type="text" size="small" @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-container">
        <span class="total-tip">每条轨迹可查看详细说明与附件</span>
        <el-pagination
            background
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="queryParams.pageNum"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="queryParams.pageSize"
            layout="total, prev, pager, next, sizes"
            :total="total"
        />
      </div>
    </el-card>

    <!-- 4. 轨迹详情弹窗 -->
    <el-dialog
        title="轨迹详情"
        :visible.sync="detailDialogVisible"
        width="680px"
        append-to-body
        custom-class="detail-dialog"
    >
      <div class="dialog-content" v-if="detailData">
        <!-- 保单信息区 -->
        <div class="detail-section">
          <div class="section-title">保单信息</div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">客户：<strong>{{ detailData.custName }} ({{ detailData.custId }})</strong></el-col>
            <el-col :span="12">证件类型：<strong>{{ detailData.certType || '居民身份证' }}</strong></el-col>
            <el-col :span="12">证件号码：<strong>{{ detailData.certNo }}</strong></el-col>
            <el-col :span="12">服务归属机构：<strong>{{ detailData.orgName }}</strong></el-col>
            <el-col :span="12" v-if="detailData.policyNo">保单号：<strong class="text-primary">{{ detailData.policyNo }}</strong></el-col>
            <el-col :span="12" v-if="detailData.riskCode">险种号：<strong>{{ detailData.riskCode }}</strong></el-col>
            <el-col :span="12" v-if="detailData.productName">产品：<strong>{{ detailData.productName }}</strong></el-col>

            <el-col :span="12" v-if="isPolicyPointType(detailData.pointType)">
              保单生效日期：<strong>{{ detailData.policyEffectiveDate || '—' }}</strong>
            </el-col>
          </el-row>
        </div>

        <!-- 积分调整信息区 -->
        <div class="detail-section">
          <div class="section-title">积分调整信息</div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">轨迹ID：<strong>{{ detailData.traceId }}</strong></el-col>
            <el-col :span="12">
              操作类型：
              <el-tag size="mini" :type="['SYSTEM', '系统调整'].includes(detailData.operateType) ? 'success' : 'primary'" effect="light">
                {{ formatOperateType(detailData.operateType) }}
              </el-tag>
            </el-col>
            <el-col :span="12">
              积分类型：
              <el-tag size="mini" :type="getPointTypeTagType(detailData.pointType)" effect="light">
                {{ formatPointType(detailData.pointType) }}
              </el-tag>
            </el-col>
            <el-col :span="12">
              调整方向：
              <span :class="isAddDirection(detailData.direction) ? 'text-green' : 'text-red'" class="font-bold">
                {{ formatDirection(detailData.direction) }}
              </span>
            </el-col>
            <el-col :span="12" class="adjustment-amount-row">
              调整积分额度：
              <span :class="isAddDirection(detailData.direction) ? 'text-green' : 'text-red'" class="font-bold">
                {{ isAddDirection(detailData.direction) ? '+' : '-' }} {{ Math.abs(detailData.pointAmt || 0) | formatNumber }}
              </span>
            </el-col>
            <el-col :span="12" v-if="detailData.oaNo">OA流水号：<strong>{{ detailData.oaNo }}</strong></el-col>
            <el-col :span="12">调整原因：<strong>{{ detailData.reason || '—' }}</strong></el-col>
            <el-col :span="12" v-if="detailData.detailRemark">详细说明：<span>{{ detailData.detailRemark }}</span></el-col>
            <el-col :span="12">积分有效期：<strong>{{ detailData.validEndDate ? `自然年 (至当年${detailData.validEndDate})` : '长期有效' }}</strong></el-col>
            <el-col :span="12">操作人：<strong>{{ detailData.operator }}</strong></el-col>
            <el-col :span="12">操作时间：<strong>{{ detailData.operateTime }}</strong></el-col>
          </el-row>
        </div>

        <!-- 积分变化示意卡片 -->
        <div class="detail-section">
          <div class="section-title">积分变化</div>
          <div class="change-card">
            <div class="change-item">
              <div class="change-label">调整前积分</div>
              <div class="change-val">{{ detailData.beforePoint | formatNumber }}</div>
            </div>
            <div class="change-arrow">→</div>
            <div class="change-item">
              <div class="change-label">调整后积分</div>
              <div class="change-val text-green">{{ detailData.afterPoint | formatNumber }}</div>
            </div>
          </div>
        </div>

        <!-- 触发规则区 (系统调整专属) -->
        <div class="detail-section" v-if="['SYSTEM', '系统调整'].includes(detailData.operateType)">
          <div class="section-title">
            触发规则 <span class="sub-tip">系统自动调整，无需审批</span>
          </div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">
              积分类型：
              <el-tag size="mini" :type="getPointTypeTagType(detailData.pointType)" effect="light">
                {{ formatPointType(detailData.pointType) }}
              </el-tag>
            </el-col>
            <el-col :span="12">触发规则：<strong>{{ detailData.ruleName || '期交实收保费积分规则 (R-001)' }}</strong></el-col>
            <el-col :span="12">规则版本：<strong>{{ detailData.ruleVersion || 'V2.0' }}</strong></el-col>
            <el-col :span="12">实收记录：<strong class="text-primary">{{ detailData.payRecordNo || 'SR2026082201' }}</strong></el-col>
            <el-col :span="12">缴费间隔：<strong>{{ detailData.payInterval || '年交' }}</strong></el-col>
            <el-col :span="12">交费年期：<strong>{{ detailData.payYears ? `${detailData.payYears} 年` : '3 年' }}</strong></el-col>
            <el-col :span="12">缴费次数：<strong>{{ detailData.payCount ? `${detailData.payCount} 次` : '1 次' }}</strong></el-col>
            <el-col :span="12">交费金额：<strong>{{ (detailData.payAmt || 10000) | formatNumber }}</strong></el-col>
            <el-col :span="12">计算系数：<strong>{{ detailData.calcFactor || '0.05' }}</strong></el-col>
          </el-row>
        </div>

        <!-- 附件区 -->
        <div class="detail-section" v-if="detailData.attachmentName">
          <div class="section-title">附件</div>
          <el-link type="primary" icon="el-icon-document" :underline="false">
            {{ detailData.attachmentName }}
          </el-link>
        </div>

        <!-- 审批信息区 (人工调整专属) -->
        <div class="detail-section" v-if="['MANUAL', '人工调整'].includes(detailData.operateType)">
          <div class="section-title">
            审批信息 <span class="sub-tip">人工调整需审批通过后生效</span>
          </div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">申请单号：<strong>{{ detailData.applyNo || 'ADJ20260823001' }}</strong></el-col>
            <el-col :span="12">审核人：<strong>{{ detailData.approver || '李四' }}</strong></el-col>
            <el-col :span="12" v-if="detailData.approveTime">审核时间：<strong>{{ detailData.approveTime }}</strong></el-col>
            <el-col :span="24" v-if="detailData.approveRemark">审核意见：<strong>{{ detailData.approveRemark }}</strong></el-col>
          </el-row>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="detailDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getPointTracePageApi, getPointTraceSummaryApi, exportTraceApi } from '@/api/test/point'

export default {
  name: 'PointTraceList',
  filters: {
    formatNumber(val) {
      if (val === null || val === undefined || isNaN(val)) return '0'
      return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    }
  },
  data() {
    return {
      loading: false,
      dateRange: [],
      detailDialogVisible: false,
      detailData: null,

      directionMap: {
        ADD: '加分',
        SUB: '减分'
      },

      operateTypeMap: {
        MANUAL: '人工调整',
        SYSTEM: '系统调整'
      },

      pointTypeMap: {
        PREMIUM: '保费积分',
        LOYALTY: '忠诚积分',
        PENSION: '养老协同积分',
        MANUAL: '人工调整'
      },

      queryParams: {
        custId: '',
        custName: '',
        policyNo: '',
        orgName: '',
        operateType: '',
        pointType: '',
        direction: '',
        dateFrom: '',
        dateTo: '',
        pageNum: 1,
        pageSize: 10
      },
      total: 0,
      traceList: [],
      summaryData: {
        add_total: 0,
        reduce_total: 0,
        net_change: 0,
        total: 0
      }
    }
  },
  computed: {
    summaryCards() {
      return [
        { title: '本期加分总额', value: this.summaryData.add_total, color: '#67c23a' },
        { title: '本期减分总额', value: this.summaryData.reduce_total, color: '#f56c6c' },
        { title: '本期净变化', value: this.summaryData.net_change, color: '#6383ff' },
        { title: '轨迹总笔数', value: this.summaryData.total, color: '#909399' }
      ]
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    isPolicyPointType(pointType) {
      const targetTypes = ['PREMIUM', '保费积分', 'PENSION', '养老协同积分']
      return targetTypes.includes(pointType)
    },

    isAddDirection(code) {
      return code === 'ADD' || code === '加分'
    },

    formatDirection(code) {
      if (!code) return '—'
      return this.directionMap[code] || code
    },

    formatOperateType(code) {
      if (!code) return '—'
      return this.operateTypeMap[code] || code
    },

    formatPointType(code) {
      if (!code) return '—'
      const name = this.pointTypeMap[code]
      return name || code
    },

    getPointTypeTagType(code) {
      if (code === 'MANUAL' || code === '人工调整') return 'warning'
      if (code === 'PENSION' || code === '养老协同积分') return 'purple'
      return 'primary'
    },

    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchTracePage(),
          this.fetchTraceSummary()
        ])
      } catch (err) {
        console.error('页面数据加载失败:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchTracePage() {
      try {
        const res = await getPointTracePageApi(this.queryParams)
        if (res && res.data) {
          const data = res.data || {}
          this.traceList = (data.list || []).map(item => ({
            ...item,
            traceId: item.trace_id || item.traceId,
            custId: item.cust_id || item.custId,
            custName: item.cust_name || item.custName,
            certType: item.id_type || item.cert_type || item.certType,
            certNo: item.id_no || item.cert_no || item.certNo,
            orgName: item.org_name || item.orgName,
            operateType: item.operate_type || item.operateType,
            pointType: item.point_type || item.pointType,
            direction: item.direction,
            pointAmt: item.point_amt !== undefined ? item.point_amt : item.pointAmt,
            beforePoint: item.before_point !== undefined ? item.before_point : item.beforePoint,
            afterPoint: item.after_point !== undefined ? item.after_point : item.afterPoint,
            validEndDate: item.valid_end_date || item.validEndDate,
            policyNo: item.policy_no || item.policyNo,
            oaNo: item.oa_no || item.oaNo,
            reason: item.reason,
            operator: item.operator,
            operateTime: item.operate_time || item.operateTime
          }))
          this.total = data.total || 0
        } else {
          this.$message.error(res?.header?.message || '获取积分轨迹列表失败')
        }
      } catch (err) {
        console.error('获取列表发生异常:', err)
      }
    },

    async fetchTraceSummary() {
      try {
        const params = {
          dateFrom: this.queryParams.dateFrom,
          dateTo: this.queryParams.dateTo
        }
        const res = await getPointTraceSummaryApi(params)
        if (res && res.data) {
          this.summaryData = res.data || { add_total: 0, reduce_total: 0, net_change: 0, total: 0 }
        }
      } catch (err) {
        console.error('获取统计数据发生异常:', err)
      }
    },

    handleDateChange(val) {
      if (val && val.length === 2) {
        this.queryParams.dateFrom = val[0]
        this.queryParams.dateTo = val[1]
      } else {
        this.queryParams.dateFrom = ''
        this.queryParams.dateTo = ''
      }
    },

    handleQuery() {
      this.queryParams.pageNum = 1
      this.loadData()
    },

    resetQuery() {
      this.dateRange = []
      this.queryParams = {
        custId: '',
        custName: '',
        policyNo: '',
        orgName: '',
        operateType: '',
        pointType: '',
        direction: '',
        dateFrom: '',
        dateTo: '',
        pageNum: 1,
        pageSize: 10
      }
      this.handleQuery()
    },

    async handleExport() {
      try {
        const blob = await exportTraceApi(this.queryParams)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '积分轨迹列表.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (err) {
        this.$message.error('导出失败')
      }
    },

    handleSizeChange(val) {
      this.queryParams.pageSize = val
      this.fetchTracePage()
    },

    handleCurrentChange(val) {
      this.queryParams.pageNum = val
      this.fetchTracePage()
    },

    handleViewDetail(row) {
      this.detailData = { ...row }
      this.detailDialogVisible = true
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 16px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.filter-container {
  margin-bottom: 16px;
}

.filter-container ::v-deep .el-card__body {
  padding: 16px 20px 4px 20px;
}

/* 紧凑版表单样式 */
.compact-query-form ::v-deep .el-form-item {
  margin-right: 24px !important;
  margin-bottom: 12px !important;
}

.compact-query-form ::v-deep .el-form-item__label {
  font-weight: normal;
  color: #606266;
  padding-right: 8px;
}

/* 固定组件宽度，防止被强行拉伸或挤压 */
.form-item-input {
  width: 180px !important;
}

.form-item-date {
  width: 250px !important;
}

.search-btn-group {
  margin-left: 10px;
}

.summary-container {
  margin-bottom: 16px;
}

.summary-box {
  border: 1px solid #e4e7ed;
  border-top: 3px solid #6383ff;
  border-radius: 4px;
  padding: 14px 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.box-label {
  font-size: 13px;
  color: #909399;
}

.box-value {
  font-size: 22px;
  font-weight: bold;
  margin-top: 8px;
}

.table-container {
  background: #ffffff;
}

.table-header-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
}

.font-bold {
  font-weight: bold;
}

.text-green { color: #67c23a; }
.text-red { color: #f56c6c; }
.text-primary { color: #6383ff; }

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-tip {
  font-size: 12px;
  color: #909399;
}

/* 详情弹窗样式 */
.detail-section {
  margin-bottom: 20px;
}

.section-title {
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

.dialog-footer {
  text-align: right;
}
</style>
