<template>
  <div class="points-management-app">
    <!-- View 1: 积分轨迹列表页 / 我的申请记录 -->
    <div v-if="currentView === 'list'" class="page-container">
      <!-- 搜索筛选栏 -->
      <el-card class="filter-card" shadow="never">
        <el-form :model="searchForm" size="small" label-width="100px" class="custom-filter-form">
          <!-- 第一行：客户号、客户姓名、保单号、操作类型 -->
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="客户号">
                <el-input v-model="searchForm.custId" placeholder="请输入客户号" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="客户姓名">
                <el-input v-model="searchForm.custName" placeholder="请输入客户姓名（模糊）" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="保单号">
                <el-input v-model="searchForm.policyNo" placeholder="请输入保单号" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="操作类型">
                <el-select v-model="searchForm.operateType" placeholder="全部操作类型" clearable style="width: 100%">
                  <el-option label="系统调整" value="SYSTEM" />
                  <el-option label="人工调整" value="MANUAL" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第二行：积分类型、方向、服务归属机构、操作时间范围 -->
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="积分类型">
                <el-select v-model="searchForm.pointType" placeholder="全部积分类型" clearable style="width: 100%">
                  <el-option label="保费积分" value="PREMIUM" />
                  <el-option label="忠诚积分" value="LOYALTY" />
                  <el-option label="养老积分" value="PENSION" />
                  <el-option label="人工积分" value="MANUAL" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="方向">
                <el-select v-model="searchForm.direction" placeholder="全部方向" clearable style="width: 100%">
                  <el-option label="加分" value="ADD" />
                  <el-option label="减分" value="SUB" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="服务归属机构">
                <el-select v-model="searchForm.orgName" placeholder="全部服务归属机构" clearable style="width: 100%">
                  <el-option label="天津分公司" value="天津分公司" />
                  <el-option label="北京分公司" value="北京分公司" />
                  <el-option label="江苏分公司" value="江苏分公司" />
                  <el-option label="上海分公司" value="上海分公司" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="起始日期">
                <el-date-picker
                    v-model="searchForm.dateFrom"
                    type="date"
                    placeholder="选择开始日期"
                    value-format="yyyy-MM-dd"
                    style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第三行：结束日期与查询重置按钮 -->
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="结束日期">
                <el-date-picker
                    v-model="searchForm.dateTo"
                    type="date"
                    placeholder="选择结束日期"
                    value-format="yyyy-MM-dd"
                    style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="18" class="btn-group-right">
              <el-button type="primary" size="small" class="btn-search" icon="el-icon-search" @click="handleSearchTrace">查 询</el-button>
              <el-button size="small" class="btn-reset" icon="el-icon-refresh" @click="resetTraceQuery">重 置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 新增调整按钮 -->
      <div style="margin: 16px 0;">
        <el-button type="primary" size="small" class="btn-add-adjust" icon="el-icon-plus" @click="currentView = 'workspace'">
          新增积分调整
        </el-button>
      </div>

      <!-- 我的申请记录表格（完全保留原表格列结构与字段映射） -->
      <el-card shadow="never" class="table-card">
        <div slot="header" class="card-header">
          <span class="header-title">我的申请记录</span>
        </div>

        <el-table v-loading="loading" :data="recordList" border style="width: 100%" size="small">
          <!-- 轨迹ID -->
          <el-table-column prop="traceId" label="轨迹ID" width="140" />

          <!-- 客户 -->
          <el-table-column label="客户" min-width="140" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.custName }} ({{ scope.row.cust_id }})
            </template>
          </el-table-column>

          <!-- 证件类型 -->
          <el-table-column prop="idType" label="证件类型" width="110" />

          <!-- 证件号码 -->
          <el-table-column prop="idNo" label="证件号码" width="160" />

          <!-- 服务归属机构 -->
          <el-table-column prop="orgName" label="服务归属机构" width="110" />

          <!-- 操作类型 -->
          <el-table-column prop="operateType" label="操作类型" width="90" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.operateType === 'SYSTEM' ? 'info' : 'success'">
                {{ scope.row.operateType === 'SYSTEM' ? '系统' : '人工' }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 调整类型/方向 -->
          <el-table-column prop="direction" label="调整类型" width="90" align="center">
            <template slot-scope="scope">
              <span :class="scope.row.direction === 'ADD' ? 'tag-type-add' : 'tag-type-sub'">
                {{ scope.row.direction === 'ADD' ? '加分' : '减分' }}
              </span>
            </template>
          </el-table-column>

          <!-- 调整积分额度 -->
          <el-table-column prop="pointAmt" label="调整积分额度" width="120" align="right">
            <template slot-scope="scope">
              <strong :class="scope.row.direction === 'ADD' ? 'text-success' : 'text-danger'">
                {{ scope.row.direction === 'ADD' ? '+' : '-' }} {{ scope.row.pointAmt | formatNumber }}
              </strong>
            </template>
          </el-table-column>

          <!-- 调整原因 -->
          <el-table-column prop="reason" label="调整原因" width="140" show-overflow-tooltip />

          <!-- 关联保单号 -->
          <el-table-column prop="policyNo" label="关联保单号" width="120">
            <template slot-scope="scope">
              {{ scope.row.policyNo || '-' }}
            </template>
          </el-table-column>

          <!-- OA流水号 -->
          <el-table-column prop="oaNo" label="OA流水号" width="140">
            <template slot-scope="scope">
              {{ scope.row.oaNo || '-' }}
            </template>
          </el-table-column>

          <!-- 申请人/操作人 -->
          <el-table-column prop="operator" label="操作人" width="90" />

          <!-- 申请时间/操作时间 -->
          <el-table-column prop="operateTime" label="操作时间" width="150" />

          <!-- 状态 -->
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template slot-scope="scope">
              <span :class="['status-tag', getStatusClass(scope.row.status)]">
                {{ scope.row.status || '已通过' }}
              </span>
            </template>
          </el-table-column>

          <!-- 操作 -->
          <el-table-column label="操作" min-width="120" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" class="btn-action" @click="openDetail(scope.row)">查看</el-button>
              <template v-if="scope.row.operateType === 'MANUAL'">
                <span class="action-split">|</span>
                <el-button type="text" size="mini" class="btn-action" @click="handleEdit(scope.row)">修改</el-button>
                <span class="action-split">|</span>
                <el-button type="text" size="mini" class="btn-action text-danger-btn" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
              :current-page="searchForm.pageNum"
              :page-sizes="[10, 20, 50]"
              :page-size="searchForm.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="searchForm.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- View 2: 积分调整工作台 -->
    <div v-else-if="currentView === 'workspace'" class="page-container">
      <div class="page-header">
        <div>
          <h2 class="title">积分调整工作台</h2>
          <span class="subtitle">支持业务人员对客户积分进行人工调整，所有操作记录完整轨迹与原因</span>
        </div>
        <el-button size="small" @click="currentView = 'list'">返回积分调整申请列表</el-button>
      </div>

      <!-- 客户查询区 -->
      <el-card shadow="never" class="section-card">
        <div slot="header" class="card-header">
          <span class="header-title">客户查询区</span>
        </div>
        <el-form :inline="true" size="small" @submit.native.prevent>
          <el-form-item label="客户号">
            <el-input v-model="customerSearchKey" placeholder="请输入客户号（如: 1001）" style="width: 260px" clearable
                      @keyup.enter.native="handleSearchCustomer"/>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleSearchCustomer">查询积分</el-button>
          </el-form-item>
          <span class="tip-text">精确输入客户号查询，获取客户当前积分总额并进行二次确认调整</span>
        </el-form>
      </el-card>

      <!-- 客户信息卡片 -->
      <el-card v-if="hasSearchedCustomer" shadow="never" class="section-card">
        <div slot="header" class="card-header">
          <span class="header-title">客户积分概览</span>
        </div>
        <el-row :gutter="20" class="customer-info-row">
          <el-col :span="8">客户号：<strong>{{ adjustForm.custId }}</strong></el-col>
          <el-col :span="16">
            当前积分总额：<span class="points-badge">{{ currentCustomerPoint | formatNumber }}</span> 积分
          </el-col>
        </el-row>
      </el-card>

      <!-- 积分调整表单 -->
      <el-card v-if="hasSearchedCustomer" shadow="never" class="section-card" style="margin-top: 16px;">
        <div slot="header" class="card-header">
          <span class="header-title">积分调整表单</span>
        </div>

        <el-form
            ref="adjustForm"
            :model="adjustForm"
            :rules="adjustRules"
            label-width="120px"
            label-position="right"
            size="small"
            class="aligned-form"
            style="max-width: 700px;"
        >
          <el-form-item label="调整方向" prop="direction" required>
            <el-radio-group v-model="adjustForm.direction">
              <el-radio label="ADD">加分</el-radio>
              <el-radio label="SUB">减分</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="调整积分额度" prop="pointAmt" required>
            <div class="form-inline-content">
              <el-input-number v-model="adjustForm.pointAmt" :min="1" :precision="0" placeholder="积分额度" style="width: 220px"/>
              <span class="form-tip">必须大于 0 的数值</span>
            </div>
          </el-form-item>

          <el-form-item label="积分类型" prop="pointType" required>
            <el-select v-model="adjustForm.pointType" style="width: 260px">
              <el-option label="保费积分" value="PREMIUM"/>
              <el-option label="忠诚积分" value="LOYALTY"/>
              <el-option label="养老积分" value="PENSION"/>
              <el-option label="人工积分" value="MANUAL"/>
            </el-select>
          </el-form-item>

          <el-form-item label="有效期截止日" prop="validEndDate">
            <el-date-picker
                v-model="adjustForm.validEndDate"
                type="date"
                placeholder="选择有效期截止日"
                value-format="yyyy-MM-dd"
                style="width: 260px"
            />
          </el-form-item>

          <el-form-item label="关联保单号" prop="policyNo">
            <el-input v-model="adjustForm.policyNo" placeholder="选填，与特定保单相关时填写" style="width: 100%"/>
          </el-form-item>

          <el-form-item label="OA流水号" prop="oaNo" required>
            <el-input v-model="adjustForm.oaNo" placeholder="请输入OA审批流程流水号" style="width: 100%"/>
          </el-form-item>

          <el-form-item label="调整原因" prop="reason">
            <el-input v-model="adjustForm.reason" type="textarea" :rows="3" placeholder="请输入调整原因详细说明"/>
          </el-form-item>

          <el-form-item label="附件上传">
            <div class="upload-custom-container">
              <input type="file" ref="workspaceFileInput" style="display: none;" @change="handleWorkspaceFileChange" />
              <el-button size="small" icon="el-icon-upload2" @click="$refs.workspaceFileInput.click()">选择文件</el-button>
              <span v-if="adjustForm.attachment" class="file-name"><i class="el-icon-document"/> {{ adjustForm.attachment }}</span>
              <span class="upload-tip">支持 jpg / png / pdf</span>
            </div>
          </el-form-item>

          <el-form-item class="form-action-item">
            <el-button icon="el-icon-check" type="primary" :loading="submitting" @click="submitAdjust">提交调整</el-button>
            <el-button icon="el-icon-refresh" @click="resetAdjust">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- ==================== 弹窗 1：申请详情弹窗 ==================== -->
    <el-dialog title="申请详情" :visible.sync="detailDialogVisible" width="600px" custom-class="custom-dialog">
      <div v-if="activeRow" class="dialog-body-content">
        <div class="detail-section">
          <div class="section-title">申请内容</div>
          <div class="detail-grid">
            <div class="grid-item"><span class="label">轨迹ID</span><span class="value bold">{{ activeRow.traceId }}</span></div>
            <div class="grid-item"><span class="label">客户</span><span class="value bold">{{ activeRow.custName }}（{{ activeRow.cust_id }}）</span></div>
            <div class="grid-item"><span class="label">证件类型</span><span class="value bold">{{ activeRow.idType || '-' }}</span></div>
            <div class="grid-item"><span class="label">证件号码</span><span class="value bold">{{ activeRow.idNo || '-' }}</span></div>
            <div class="grid-item"><span class="label">服务归属机构</span><span class="value bold">{{ activeRow.orgName || '-' }}</span></div>
            <div class="grid-item"><span class="label">操作类型</span><span class="value bold">{{ activeRow.operateType }}</span></div>
            <div class="grid-item"><span class="label">调整类型</span><span class="value bold">{{ activeRow.direction === 'ADD' ? '加分' : '减分' }}</span></div>
            <div class="grid-item">
              <span class="label">调整积分额度</span>
              <span class="value bold">{{ activeRow.direction === 'ADD' ? '+' : '-' }}{{ activeRow.pointAmt | formatNumber }}</span>
            </div>
            <div class="grid-item"><span class="label">调整原因</span><span class="value bold">{{ activeRow.reason }}</span></div>
            <div class="grid-item"><span class="label">关联保单号</span><span class="value bold">{{ activeRow.policyNo || '-' }}</span></div>
            <div class="grid-item"><span class="label">OA流水号</span><span class="value bold">{{ activeRow.oaNo || '-' }}</span></div>
            <div class="grid-item"><span class="label">操作人</span><span class="value">{{ activeRow.operator || '-' }}</span></div>
            <div class="grid-item full-width"><span class="label">操作时间</span><span class="value bold">{{ activeRow.operateTime }}</span></div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">积分变化</div>
          <div class="point-change-box">
            <div class="change-col">
              <div class="change-label">调整前积分</div>
              <div class="change-val bold">{{ activeRow.before_point | formatNumber }}</div>
            </div>
            <div class="change-arrow">→</div>
            <div class="change-col">
              <div class="change-label">调整后积分</div>
              <div class="change-val green bold">{{ activeRow.after_point | formatNumber }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="activeRow.attachment">
          <div class="section-title">附件</div>
          <div class="attachment-link"><i class="el-icon-document" /> {{ activeRow.attachment }}</div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" class="btn-dialog-close" @click="detailDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- ==================== 弹窗 2：修改申请弹窗 ==================== -->
    <el-dialog title="修改申请" :visible.sync="editDialogVisible" width="580px" custom-class="custom-dialog">
      <div v-if="editForm" class="dialog-body-content">
        <div class="readonly-info-card">
          <div class="info-row">
            <span>轨迹ID <strong>{{ editForm.traceId }}</strong></span>
            <span>客户 <strong>{{ editForm.custName }}（{{ editForm.cust_id }}）</strong></span>
          </div>
          <div class="info-row" style="margin-top: 8px;">
            <span>服务归属机构 <strong>{{ editForm.orgName }}</strong></span>
          </div>
        </div>

        <div class="section-title" style="margin-top: 16px;">
          调整内容 <span class="sub-tip">客户信息不可修改，仅可调整积分申请内容</span>
        </div>

        <el-form ref="editFormRef" :model="editForm" :rules="adjustRules" label-width="110px" size="small" class="edit-dialog-form">
          <el-form-item label="调整方向" prop="direction" required>
            <el-radio-group v-model="editForm.direction">
              <el-radio label="ADD">加分</el-radio>
              <el-radio label="SUB">减分</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="调整积分额度" prop="pointAmt" required>
            <el-input-number v-model="editForm.pointAmt" :min="1" :precision="0" style="width: 220px;" />
          </el-form-item>

          <el-form-item label="积分类型" prop="point_type" required>
            <el-select v-model="editForm.point_type" style="width: 220px;">
              <el-option label="保费积分" value="PREMIUM" />
              <el-option label="忠诚积分" value="LOYALTY" />
              <el-option label="养老积分" value="PENSION" />
              <el-option label="人工积分" value="MANUAL" />
            </el-select>
          </el-form-item>

          <el-form-item label="关联保单号" prop="policyNo">
            <el-input v-model="editForm.policyNo" placeholder="选填，与特定保单相关时填写" style="width: 100%" />
          </el-form-item>

          <el-form-item label="OA流水号" prop="oaNo" required>
            <el-input v-model="editForm.oaNo" placeholder="请输入OA流水号" style="width: 100%" />
          </el-form-item>

          <el-form-item label="调整原因" prop="reason" required>
            <el-input v-model="editForm.reason" type="textarea" :rows="3" placeholder="请输入调整原因" />
          </el-form-item>

          <el-form-item label="附件上传">
            <div class="upload-custom-container">
              <input type="file" ref="editFileInput" style="display: none;" @change="handleEditFileChange" />
              <el-button size="small" class="btn-select-file" @click="$refs.editFileInput.click()">选择文件</el-button>
              <span class="file-name-gray">{{ editForm.attachment || '未选择文件' }}</span>
              <span class="upload-tip">支持 jpg / png / pdf</span>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" class="btn-dialog-cancel" @click="editDialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" class="btn-dialog-submit" @click="submitEdit">保存并重新提交</el-button>
      </div>
    </el-dialog>

    <!-- ==================== 弹窗 3：删除确认弹窗 ==================== -->
    <el-dialog title="删除确认" :visible.sync="deleteDialogVisible" width="440px" custom-class="custom-dialog delete-dialog">
      <div class="delete-msg-body">
        确定删除记录 <strong>{{ deletingRow ? deletingRow.traceId : '' }}</strong> 吗？删除后不可恢复。
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" class="btn-dialog-cancel" @click="deleteDialogVisible = false">取 消</el-button>
        <el-button size="small" class="btn-dialog-delete-danger" @click="confirmDelete">确认删除</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getCustCurrentPointApi,
  submitPointAdjustApi,
  getPointTracePageApi
} from "@/api/test/point"

export default {
  name: 'PointsManagement',
  filters: {
    formatNumber(val) {
      if (val === null || val === undefined || val === '') return '0'
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  },
  data() {
    return {
      currentView: 'list',
      hasSearchedCustomer: false,
      customerSearchKey: '1001',
      currentCustomerPoint: 12500,
      loading: false,
      submitting: false,

      // 完美适配 4.1.3 积分轨迹分页查询请求参数
      searchForm: {
        custId: '',
        custName: '',
        policyNo: '',
        operateType: '',
        pointType: '',
        direction: '',
        orgName: '',
        dateFrom: '',
        dateTo: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      },

      recordList: [],

      // 工作台提交表单
      adjustForm: {
        custId: '',
        direction: 'ADD',
        pointAmt: undefined,
        pointType: 'PREMIUM',
        validEndDate: '',
        policyNo: '',
        oaNo: '',
        reason: '',
        attachment: ''
      },
      adjustRules: {
        direction: [{required: true, message: '请选择调整方向', trigger: 'change'}],
        pointAmt: [{required: true, message: '请输入积分额度', trigger: 'blur'}],
        pointType: [{required: true, message: '请选择积分类型', trigger: 'change'}],
        oaNo: [{required: true, message: '请输入OA流水号', trigger: 'blur'}]
      },

      // 弹窗状态管理
      detailDialogVisible: false,
      editDialogVisible: false,
      deleteDialogVisible: false,

      activeRow: null,
      editForm: null,
      deletingRow: null
    }
  },
  mounted() {
    this.handleSearchTrace()
  },
  methods: {
    getStatusClass(status) {
      if (status === '待审核') return 'status-pending'
      if (status === '已通过') return 'status-success'
      if (status === '已驳回') return 'status-rejected'
      return 'status-success'
    },

    async handleSearchTrace() {
      this.loading = true
      try {
        const params = { ...this.searchForm }
        const res = await getPointTracePageApi(params)
        if (res && res.data) {
          this.recordList = res.data.list || []
          this.searchForm.total = res.data.total || 0
        }
      } catch (err) {
        console.error("获取积分轨迹列表失败:", err)
      } finally {
        this.loading = false
      }
    },

    resetTraceQuery() {
      this.searchForm = {
        custId: '',
        custName: '',
        policyNo: '',
        operateType: '',
        pointType: '',
        direction: '',
        orgName: '',
        dateFrom: '',
        dateTo: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      }
      this.handleSearchTrace()
    },

    handleSizeChange(val) {
      this.searchForm.pageSize = val
      this.handleSearchTrace()
    },
    handleCurrentChange(val) {
      this.searchForm.pageNum = val
      this.handleSearchTrace()
    },

    async handleSearchCustomer() {
      if (!this.customerSearchKey) {
        this.$message.warning("请输入客户号")
        return
      }
      const custId = this.customerSearchKey.trim()
      try {
        const res = await getCustCurrentPointApi(custId)
        if (res && res.data) {
          const pointData = res.data
          this.currentCustomerPoint = typeof pointData === 'number'
            ? pointData
            : Number(pointData.currentPoint ?? pointData.current_point ?? 0)
          this.adjustForm.custId = custId
          this.hasSearchedCustomer = true
        } else {
          this.adjustForm.custId = custId
          this.hasSearchedCustomer = true
        }
      } catch (e) {
        console.error("获取当前积分失败:", e)
      }
    },

    submitAdjust() {
      this.$refs.adjustForm.validate(async (valid) => {
        if (!valid) return
        const changeSymbol = this.adjustForm.direction === 'ADD' ? '+' : '-'
        const changeTxt = `${changeSymbol}${this.adjustForm.pointAmt}`

        this.$confirm(
            `客户当前积分：${this.currentCustomerPoint}，确认要调整 【${changeTxt}】 积分吗？`,
            '二次确认',
            {confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'warning'}
        ).then(async () => {
          this.submitting = true
          try {
            const res = await submitPointAdjustApi(this.adjustForm)
            if (res) {
              this.$message.success('提交成功！')
              this.currentView = 'list'
              this.handleSearchTrace()
            }
          } finally {
            this.submitting = false
          }
        }).catch(() => {})
      })
    },

    resetAdjust() {
      this.$refs.adjustForm.resetFields()
      this.adjustForm.attachment = ''
      if (this.$refs.workspaceFileInput) {
        this.$refs.workspaceFileInput.value = ''
      }
    },

    handleWorkspaceFileChange(e) {
      const file = e.target.files[0]
      if (file) {
        this.adjustForm.attachment = file.name
      }
    },

    openDetail(row) {
      this.activeRow = { ...row }
      this.detailDialogVisible = true
    },

    handleEdit(row) {
      this.editForm = { ...row }
      this.editDialogVisible = true
    },

    handleEditFileChange(e) {
      const file = e.target.files[0]
      if (file && this.editForm) {
        this.$set(this.editForm, 'attachment', file.name)
      }
    },

    submitEdit() {
      this.$refs.editFormRef.validate((valid) => {
        if (!valid) return
        this.$message.success('修改申请保存成功并重新提交！')
        this.editDialogVisible = false
        this.handleSearchTrace()
      })
    },

    handleDelete(row) {
      this.deletingRow = row
      this.deleteDialogVisible = true
    },

    confirmDelete() {
      this.$message.success(`成功删除记录 ${this.deletingRow.traceId}`)
      this.deleteDialogVisible = false
      this.handleSearchTrace()
    }
  }
}
</script>

<style scoped>
.points-management-app {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-container {
  max-width: 100%;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header .title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.page-header .subtitle {
  font-size: 12px;
  color: #909399;
}

.filter-card, .table-card, .section-card {
  margin-bottom: 16px;
}

.custom-filter-form .el-form-item {
  margin-bottom: 12px !important;
}

.btn-group-right {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.btn-search {
  background-color: #4678e7;
  border-color: #4678e7;
  padding: 8px 20px;
}

.btn-reset {
  color: #4678e7;
  border-color: #4678e7;
  padding: 8px 20px;
}

.btn-add-adjust {
  background-color: #4678e7;
  border-color: #4678e7;
  padding: 9px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.tag-type-add { color: #43a047; font-weight: bold; }
.tag-type-sub { color: #e53935; font-weight: bold; }

.text-success { color: #2e7d32; }
.text-danger { color: #c62828; }
.red { color: #c62828; }
.green { color: #2e7d32; }

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}
.status-pending { background-color: #fff7e6; color: #fa8c16; border: 1px solid #ffe58f; }
.status-success { background-color: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.status-rejected { background-color: #fff2f0; color: #ff4d4f; border: 1px solid #ffccc7; }

.btn-action { color: #1890ff; padding: 0; }
.text-danger-btn { color: #ff4d4f; }
.action-split { margin: 0 4px; color: #e8e8e8; }

.customer-info-row .el-col { margin-bottom: 8px; font-size: 13px; color: #606266; }
.points-badge { font-size: 18px; font-weight: bold; color: #409eff; }
.form-tip, .tip-text { font-size: 12px; color: #909399; margin-left: 10px; }

.pagination-container { display: flex; justify-content: flex-end; margin-top: 16px; }

/* 弹窗样式适配 */
::v-deep .custom-dialog .el-dialog__header {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
}
::v-deep .custom-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
::v-deep .custom-dialog .el-dialog__body {
  padding: 20px;
}
::v-deep .custom-dialog .el-dialog__footer {
  border-top: 1px solid #f0f0f0;
  padding: 12px 20px;
}

.detail-section {
  margin-bottom: 20px;
}
.section-title {
  position: relative;
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  padding-left: 10px;
  margin-bottom: 12px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background-color: #2f54eb;
  border-radius: 2px;
}
.section-title .sub-tip {
  font-weight: normal;
  font-size: 12px;
  color: #86909c;
  margin-left: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 12px;
  column-gap: 20px;
  font-size: 13px;
}
.grid-item {
  display: flex;
  align-items: center;
}
.grid-item.full-width {
  grid-column: span 2;
}
.grid-item .label {
  color: #86909c;
  width: 100px;
  flex-shrink: 0;
}
.grid-item .value {
  color: #1d2129;
}
.grid-item .value.bold {
  font-weight: 600;
}

.point-change-box {
  background-color: #f2f5fc;
  border-radius: 4px;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 30px;
}
.change-col .change-label {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 4px;
}
.change-col .change-val {
  font-size: 18px;
  color: #1d2129;
}
.change-arrow {
  font-size: 18px;
  color: #2f54eb;
  font-weight: bold;
}
.attachment-link {
  font-size: 13px;
  color: #2f54eb;
  cursor: pointer;
}

.readonly-info-card {
  background-color: #f2f3f8;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 13px;
  color: #4e5969;
}
.readonly-info-card .info-row {
  display: flex;
  justify-content: space-between;
}
.readonly-info-card strong {
  color: #1d2129;
}

.edit-dialog-form .el-form-item {
  margin-bottom: 16px;
}
.btn-select-file {
  color: #2f54eb;
  border-color: #2f54eb;
}
.file-name-gray {
  font-size: 13px;
  color: #86909c;
}
.delete-msg-body {
  font-size: 14px;
  color: #1d2129;
  padding: 12px 0;
}
.btn-dialog-close, .btn-dialog-cancel {
  border-color: #2f54eb;
  color: #2f54eb;
}
.btn-dialog-submit {
  background-color: #4678e7;
  border-color: #4678e7;
}
.btn-dialog-delete-danger {
  color: #f53f3f;
  border-color: #f53f3f;
  background-color: #fff;
}
.btn-dialog-delete-danger:hover {
  background-color: #ffece0;
}
</style>
