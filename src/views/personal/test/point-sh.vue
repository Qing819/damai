<template>
  <div class="audit-page-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h2 class="title">积分调整审核</h2>
      <p class="subtitle">对待审核的积分调整申请进行审批处理，超过阈值的申请需上级审批后生效</p>
    </div>

    <!-- 筛选条件区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="searchForm" size="small" label-width="80px">
        <el-form-item label="证件类型">
          <el-select v-model="searchForm.idType" placeholder="请选择" style="width: 140px" clearable>
            <el-option label="全部证件类型" value="" />
            <el-option label="身份证" value="IDCARD" />
            <el-option label="护照" value="PASSPORT" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="证件号码">
          <el-input v-model="searchForm.idNo" placeholder="请输入证件号码" style="width: 160px" clearable />
        </el-form-item>

        <el-form-item label="客户姓名">
          <el-input v-model="searchForm.custName" placeholder="请输入客户姓名" style="width: 140px" clearable />
        </el-form-item>

        <el-form-item label="客户号">
          <el-input v-model="searchForm.custId" placeholder="请输入客户号" style="width: 140px" clearable />
        </el-form-item>

        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="请选择" style="width: 130px" clearable>
            <el-option label="全部状态" value="" />
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>

        <el-form-item label="申请时间">
          <div class="date-range-wrapper">
            <el-date-picker
                v-model="searchForm.dateFrom"
                type="date"
                placeholder="开始日期"
                value-format="yyyy-MM-dd"
                style="width: 135px"
            />
            <span class="date-separator">~</span>
            <el-date-picker
                v-model="searchForm.dateTo"
                type="date"
                placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 135px"
            />
          </div>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item class="form-btn-item">
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查 询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重 置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 申请列表区 -->
    <el-card shadow="never" class="table-card">
      <div slot="header" class="table-title">
        <span>申请列表</span>
      </div>

      <el-table
          v-loading="loading"
          :data="tableData"
          border
          style="width: 100%"
          size="small"
      >
        <el-table-column min-width="160" label="客户" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.custName }}（{{ scope.row.custId }}）
          </template>
        </el-table-column>

        <el-table-column prop="idType" label="证件类型" width="90" align="center">
          <template slot-scope="scope">
            {{ formatIdType(scope.row.idType) }}
          </template>
        </el-table-column>
        <el-table-column prop="idNo" label="证件号码" width="160" align="center" />

        <el-table-column prop="adjustType" label="调整类型" width="80" align="center">
          <template slot-scope="scope">
            <span :class="isAddAdjust(scope.row.adjustType) ? 'text-success' : 'text-danger'">
              {{ formatAdjustType(scope.row.adjustType) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="adjustAmt" label="调整积分额度" width="110" align="center">
          <template slot-scope="scope">
            <strong :class="isAddAdjust(scope.row.adjustType) ? 'text-success' : 'text-danger'">
              {{ isAddAdjust(scope.row.adjustType) ? '+' : '-' }} {{ scope.row.adjustAmt }}
            </strong>
          </template>
        </el-table-column>

        <el-table-column prop="reasonName" label="调整原因" min-width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="policyNo" label="关联保单号" width="110" align="center">
          <template slot-scope="scope">{{ scope.row.policyNo || '—' }}</template>
        </el-table-column>
        <el-table-column prop="oaNo" label="OA流水号" width="130" align="center" />
        <el-table-column prop="applicant" label="申请人" width="80" align="center" />
        <el-table-column prop="applyTime" label="申请时间" width="140" align="center" />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getTagType(scope.row.status)" size="small" disable-transitions>
              {{ formatStatus(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="auditTime" label="审核通过时间" width="140" align="center">
          <template slot-scope="scope">{{ scope.row.auditTime || '—' }}</template>
        </el-table-column>

        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button
                type="text"
                size="small"
                @click="openAuditModal(scope.row)"
            >
              {{ isPending(scope.row.status) ? '审核' : '查看' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部分页 -->
      <div class="pagination-container">
        <el-pagination
            :current-page="pageNum"
            :page-sizes="[10, 20, 50]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 审核 / 查看详情弹窗 -->
    <el-dialog
        title="审核详情"
        :visible.sync="dialogVisible"
        width="640px"
        append-to-body
    >
      <div v-if="currentRow" v-loading="detailLoading" class="dialog-body">
        <!-- 属性平铺列表 -->
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="申请单号">{{ currentRow.applyNo }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentRow.custName }} ({{ currentRow.custId }})</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ formatIdType(currentRow.idType) }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ currentRow.idNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="调整类型">{{ formatAdjustType(currentRow.adjustType) }}</el-descriptions-item>
          <el-descriptions-item label="调整积分额度">
            <span :class="isAddAdjust(currentRow.adjustType) ? 'text-success' : 'text-danger'">
              {{ isAddAdjust(currentRow.adjustType) ? '+' : '-' }} {{ currentRow.adjustAmt }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="调整原因">{{ currentRow.reasonName }}</el-descriptions-item>
          <el-descriptions-item label="关联保单号">{{ currentRow.policyNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="OA流水号">{{ currentRow.oaNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentRow.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentRow.applicant }}</el-descriptions-item>
          <!-- 修改点：格式化有效期类型，若为自定义日期则拼上截止日 -->
          <el-descriptions-item label="积分有效期">{{ formatValidType(currentRow) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 积分变化示意 -->
        <div class="section-block">
          <div class="section-title">积分变化</div>
          <el-card shadow="never" class="points-card">
            <div class="points-change-wrapper">
              <div>
                <div class="p-label">调整前积分</div>
                <div class="p-val">{{ currentRow.beforePoint != null ? currentRow.beforePoint : '—' }}</div>
              </div>
              <i class="el-icon-right arrow-icon"></i>
              <div>
                <div class="p-label">调整后积分</div>
                <div class="p-val text-success">{{ currentRow.afterPoint != null ? currentRow.afterPoint : '—' }}</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 详细说明 -->
        <div class="section-block">
          <div class="section-title">备注说明</div>
          <p class="desc-text">{{ currentRow.remark || '无' }}</p>
        </div>

        <!-- 附件 -->
        <div v-if="currentRow.attachment" class="section-block">
          <div class="section-title">附件</div>
          <div>
            <el-link type="primary" :underline="false" icon="el-icon-document">{{ currentRow.attachment }}</el-link>
          </div>
        </div>

        <!-- 审核意见 -->
        <div class="section-block">
          <div class="section-title">
            审核意见 <span class="sub-text">（驳回时必填）</span>
          </div>

          <template v-if="isPending(currentRow.status)">
            <el-input
                v-model="auditRemark"
                type="textarea"
                :rows="3"
                placeholder="请输入审核意见"
                resize="none"
            />
          </template>
          <template v-else>
            <div class="audit-result-text">
              审核结果：
              <el-tag :type="getTagType(currentRow.status)" size="mini">
                {{ formatStatus(currentRow.status) }}
              </el-tag>
            </div>
            <el-input
                :value="currentRow.auditOpinion || '无'"
                type="textarea"
                :rows="2"
                disabled
                resize="none"
            />
          </template>
        </div>
      </div>

      <!-- 待审核时显示的底部按钮：按照 1.6 规范传对应编码 -->
      <div v-if="currentRow && isPending(currentRow.status)" slot="footer" class="dialog-footer">
        <el-button type="danger" plain :loading="submitLoading" @click="handleAuditSubmit('REJECTED')">驳 回</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleAuditSubmit('APPROVED')">审核通过</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getPointAdjustPageApi,
  getPointAdjustDetailApi,
  auditPointAdjustApi
} from '@/api/test/point'

export default {
  name: 'PointsAudit',
  data() {
    return {
      loading: false,
      detailLoading: false,
      submitLoading: false,

      // 证件类型字典 (规范 1.8)
      idTypeMap: {
        IDCARD: '身份证',
        PASSPORT: '护照',
        OTHER: '其他'
      },

      // 调整类型字典
      adjustTypeMap: {
        ADD: '加分',
        SUB: '减分'
      },

      // 1.9 有效期类型字典
      validTypeMap: {
        nat: '自然年（年底清零）',
        custom: '自定义截止日'
      },

      // 申请状态编码字典 (规范 1.5)
      statusMap: {
        PENDING: '待审核',
        APPROVED: '已通过',
        REJECTED: '已驳回'
      },

      // 审核接口结果编码字典 (规范 1.6)
      auditResultMap: {
        APPROVED: '通过',
        REJECTED: '驳回'
      },

      searchForm: {
        idType: '',
        idNo: '',
        custName: '',
        custId: '',
        status: '',
        dateFrom: '',
        dateTo: ''
      },
      pageNum: 1,
      pageSize: 10,
      total: 0,
      tableData: [],
      dialogVisible: false,
      currentRow: null,
      auditRemark: ''
    }
  },
  created() {
    this.fetchPageList()
  },
  methods: {
    // 格式化证件类型
    formatIdType(code) {
      if (!code) return '—'
      return this.idTypeMap[code] || code
    },

    // 格式化有效期类型 (规范 1.9)
    formatValidType(row) {
      if (!row || !row.validType) return '—'
      const label = this.validTypeMap[row.validType] || row.validType
      if (row.validType === 'custom') {
        return row.validEndDate ? `${label}（至 ${row.validEndDate}）` : label
      }
      return label
    },

    // 判断是否为加分
    isAddAdjust(code) {
      return code === 'ADD' || code === '加分'
    },

    // 格式化调整类型
    formatAdjustType(code) {
      if (!code) return '—'
      return this.adjustTypeMap[code] || code
    },

    // 格式化状态文本
    formatStatus(status) {
      if (!status) return '—'
      return this.statusMap[status] || status
    },

    // 格式化审核结果文案（接口 1.6 规范专用）
    formatAuditResult(code) {
      if (!code) return ''
      return this.auditResultMap[code] || code
    },

    // 判断是否为待审核
    isPending(status) {
      return status === 'PENDING' || status === '待审核'
    },

    // 4.2.2 加载申请列表
    async fetchPageList() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          pageNum: this.pageNum,
          pageSize: this.pageSize
        }

        const res = await getPointAdjustPageApi(params)
        const pageData = res?.data || res?.body?.data || {}

        this.tableData = pageData.list || []
        this.total = pageData.total || 0
      } catch (err) {
        console.error('获取列表数据异常:', err)
        this.$message.error('获取列表失败')
      } finally {
        this.loading = false
      }
    },

    getTagType(status) {
      switch (status) {
        case 'PENDING':
        case '待审核':
          return 'warning'
        case 'APPROVED':
        case '已通过':
        case '通过':
          return 'success'
        case 'REJECTED':
        case '已驳回':
        case '驳回':
          return 'danger'
        default:
          return 'info'
      }
    },

    handleSearch() {
      this.pageNum = 1
      this.fetchPageList()
    },

    handleReset() {
      this.searchForm = {
        idType: '',
        idNo: '',
        custName: '',
        custId: '',
        status: '',
        dateFrom: '',
        dateTo: ''
      }
      this.pageNum = 1
      this.fetchPageList()
    },

    // 4.2.3 打开弹窗并获取申请详情
    async openAuditModal(row) {
      this.dialogVisible = true
      this.currentRow = { ...row } // 先展示行内部数据
      this.auditRemark = ''
      this.detailLoading = true

      try {
        const res = await getPointAdjustDetailApi(row.id || row.applyNo)
        const detailData = res?.data || res?.body?.data || res
        if (detailData && (detailData.id || detailData.applyNo)) {
          this.currentRow = detailData
        }
      } catch (err) {
        console.error('获取申请详情异常:', err)
      } finally {
        this.detailLoading = false
      }
    },

    // 4.2.6 提交审核 (按 1.6 规范: result 传参支持 APPROVED / REJECTED)
    async handleAuditSubmit(resultCode) {
      const isReject = resultCode === 'REJECTED' || resultCode === '驳回'
      if (isReject && !this.auditRemark.trim()) {
        this.$message.warning('驳回时必须填写审核意见！')
        return
      }

      this.submitLoading = true
      try {
        const payload = {
          id: this.currentRow.id,
          result: resultCode, // 传入规范编码：APPROVED / REJECTED
          opinion: this.auditRemark,
          auditor: '李四' // 默认审核人
        }

        await auditPointAdjustApi(payload)
        const resultText = this.formatAuditResult(resultCode)
        this.$message.success(`审核【${resultText}】处理完成！`)
        this.dialogVisible = false
        // 刷新列表数据
        this.fetchPageList()
      } catch (err) {
        console.error('审核提交异常:', err)
        this.$message.error('提交失败，请重试')
      } finally {
        this.submitLoading = false
      }
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.fetchPageList()
    },

    handlePageChange(page) {
      this.pageNum = page
      this.fetchPageList()
    }
  }
}
</script>

<style scoped>
.audit-page-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 顶部标题区 */
.page-header {
  margin-bottom: 16px;
}

.page-header .title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-header .subtitle {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #909399;
}

/* 筛选区容器与表单项间距调整 */
.filter-card {
  margin-bottom: 16px;
}

.el-form-item {
  margin-right: 28px !important;
  margin-bottom: 16px !important;
}

/* 日期范围分割符 */
.date-range-wrapper {
  display: flex;
  align-items: center;
}

.date-separator {
  margin: 0 8px;
  color: #909399;
}

.form-btn-item {
  margin-left: 10px;
}

/* 列表卡片与标题 */
.table-card {
  margin-bottom: 16px;
}

.table-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

/* 状态与文本颜色辅助 */
.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

/* 分页 */
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 弹窗内容与标题 */
.section-block {
  margin-top: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.sub-text {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

/* 积分变化卡片 Element 风格 */
.points-card {
  background-color: #f8f9fb;
}

.points-change-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-around;
  text-align: center;
}

.p-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.p-val {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.arrow-icon {
  font-size: 20px;
  color: #409eff;
}

.desc-text {
  font-size: 13px;
  color: #606266;
  margin: 0;
  line-height: 1.5;
}

.audit-result-text {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
</style>
