<template>
  <div class="page-container">
    <!-- 页面标题区 -->
    <div class="header-section">
      <h2 class="title">权益调整申请</h2>
      <p class="subtitle">
        我的权益调整申请记录；待审核、已通过的申请可查看申请内容与审批信息，已驳回的申请可修改后重新提交或删除
      </p>
    </div>

    <!-- 顶部查询表单卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" ref="queryFormRef" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="证件类型" prop="idType">
              <el-select v-model="queryForm.idType" placeholder="请选择证件类型" clearable style="width: 100%">
                <el-option label="居民身份证" value="身份证"></el-option>
                <el-option label="中国护照" value="护照"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="证件号码" prop="idNo">
              <el-input v-model="queryForm.idNo" placeholder="请输入证件号码" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户名称" prop="custName">
              <el-input v-model="queryForm.custName" placeholder="请输入客户名称" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户号" prop="custId">
              <el-input v-model="queryForm.custId" placeholder="请输入客户号" clearable></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="归属机构" prop="orgName">
              <el-input v-model="queryForm.orgName" placeholder="请输入服务归属机构" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="申请时间" prop="dateRange">
              <el-date-picker
                  v-model="queryForm.dateRange"
                  type="daterange"
                  range-separator="~"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="调整权益" prop="benefitCode">
              <el-input v-model="queryForm.benefitCode" placeholder="请输入权益编码" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryForm.status" placeholder="请选择状态" clearable style="width: 100%">
                <el-option label="待审核" value="PENDING"></el-option>
                <el-option label="已通过" value="APPROVED"></el-option>
                <el-option label="已驳回" value="REJECTED"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row type="flex" justify="end">
          <el-form-item class="form-btn-group">
            <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
            <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作按钮区 -->
    <div class="action-bar">
      <el-button type="primary" icon="el-icon-plus" size="medium" @click="handleOpenApplyDialog">新增权益调整</el-button>
    </div>

    <!-- 数据列表卡片 -->
    <el-card class="main-card" shadow="never">
      <div class="table-title">我的申请记录</div>

      <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          border
          stripe
          :header-cell-style="{ background: '#f8f9fa', color: '#606266', fontWeight: 'bold' }"
      >
        <el-table-column prop="idNo" label="证件号码" min-width="170"></el-table-column>
        <el-table-column prop="orgName" label="服务归属机构" min-width="120"></el-table-column>
        <el-table-column prop="benefitCodes" label="服务权益ID" min-width="130"></el-table-column>
        <el-table-column prop="benefitNames" label="调整权益" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="reasonName" label="调整原因" min-width="120"></el-table-column>
        <el-table-column prop="policyNo" label="关联保单号" min-width="130">
          <template slot-scope="scope">
            {{ scope.row.policyNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="oaNo" label="OA流水号" min-width="150"></el-table-column>
        <el-table-column prop="applicant" label="申请人" width="90" align="center"></el-table-column>
        <el-table-column prop="applyTime" label="申请时间" min-width="160" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 'PENDING'" type="warning" size="small">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'APPROVED'" type="success" size="small">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === 'REJECTED'" type="danger" size="small">已驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
            <template v-if="scope.row.status === 'REJECTED'">
              <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button type="text" size="small" class="danger-btn" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-container">
        <el-pagination
            background
            layout="total, prev, pager, next, sizes, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        >
        </el-pagination>
      </div>
    </el-card>

    <!-- 1. 查看详情弹窗 (调用 4.16.25 getBenefitAdjustDetailApi) -->
    <el-dialog title="申请详情" :visible.sync="detailVisible" width="950px" append-to-body>
      <div v-if="currentDetail">
        <div class="detail-section-title">申请内容</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="申请单号">{{ currentDetail.applyNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentDetail.custName }} ({{ currentDetail.custId }})</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ currentDetail.idType }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ currentDetail.idNo }}</el-descriptions-item>
          <el-descriptions-item label="服务归属机构">{{ currentDetail.orgName }}</el-descriptions-item>
          <el-descriptions-item label="调整原因">{{ currentDetail.reasonName }}</el-descriptions-item>
          <el-descriptions-item label="关联保单号">{{ currentDetail.policyNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="OA流水号">{{ currentDetail.oaNo }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentDetail.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentDetail.applicant }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section-title" style="margin-top: 20px;">调整权益</div>
        <el-table
            :data="currentDetail.benefitDetails || []"
            border
            size="small"
            style="width: 100%"
            row-key="benefitCode"
        >
          <el-table-column prop="benefitCode" label="服务权益ID" width="110"></el-table-column>
          <el-table-column prop="kind" label="服务种类" width="110"></el-table-column>
          <el-table-column prop="benefitName" label="服务权益" width="130"></el-table-column>
          <el-table-column prop="supplier" label="服务商" width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="signOrg" label="签约机构" width="100"></el-table-column>
          <el-table-column prop="regionsJson" label="适用地区" width="100"></el-table-column>
          <el-table-column prop="identitiesJson" label="适用身份" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="itemCount" label="项目数" width="80" align="center"></el-table-column>
          <el-table-column label="有效期" width="110">
            <template>
              {{ currentDetail.validEndDate }}
            </template>
          </el-table-column>
        </el-table>

        <div class="detail-section-title" style="margin-top: 20px;">详细说明</div>
        <div class="detail-text">{{ currentDetail.remark || '暂无详细说明' }}</div>

        <div class="detail-section-title" style="margin-top: 20px;">附件</div>
        <div class="file-link" v-if="currentDetail.attachment">
          <i class="el-icon-document"></i> {{ currentDetail.attachment }}
        </div>
        <div class="detail-text" v-else>无附件</div>

        <div class="detail-section-title" style="margin-top: 20px;">审批信息</div>
        <div v-if="currentDetail.auditor">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="审批人">{{ currentDetail.auditor }}</el-descriptions-item>
            <el-descriptions-item label="审批时间">{{ currentDetail.auditTime }}</el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2">{{ currentDetail.auditOpinion || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <p v-else class="detail-text" style="color: #909399;">该申请尚未完成审批，暂无审批结果。</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <!-- 2. 新增申请弹窗 (调用 4.16.20 serviceAdjustApplyApi) -->
    <el-dialog title="提交权益调整申请" :visible.sync="applyVisible" width="1000px" append-to-body>
      <el-form :model="applyForm" ref="applyFormRef" label-width="100px" size="small">
        <el-form-item label="客户号" required>
          <el-input v-model="applyForm.custId" placeholder="请输入客户号" style="width: 280px;" @blur="fetchWorkbenchData"></el-input>
          <span class="form-tip-inline">输入客户号后失焦自动联动查询客户信息及工作台数据</span>
        </el-form-item>

        <div class="edit-top-info" v-if="workbenchCustomer">
          <span>客户姓名: <strong>{{ workbenchCustomer.custName }}</strong></span>
          <span>证件号: <strong>{{ workbenchCustomer.idNo }}</strong></span>
          <span>服务归属机构: <strong>{{ workbenchCustomer.orgName }}</strong></span>
        </div>

        <el-form-item label="服务权益" required class="benefit-form-item">
          <div class="benefit-header">
            <span class="tip-text">
              已选 <strong>{{ applyForm.selectedBenefits.length }}</strong> 条
            </span>
            <div class="btn-group">
              <el-button size="mini" type="primary" plain icon="el-icon-plus" @click="openSelectBenefit('apply')">选择权益</el-button>
            </div>
          </div>

          <el-table :data="applyForm.selectedBenefits" border size="small" style="width: 100%; margin-top: 8px;" row-key="benefitCode">
            <el-table-column prop="benefitCode" label="服务权益编码" width="120"></el-table-column>
            <el-table-column prop="benefitName" label="服务权益名称" min-width="150"></el-table-column>
            <el-table-column prop="kind" label="服务种类" width="120"></el-table-column>
            <el-table-column prop="supplier" label="服务商" min-width="150" show-overflow-tooltip></el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" class="danger-btn" @click="removeBenefit('apply', scope.$index)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item label="权益有效期" required>
          <el-date-picker v-model="applyForm.validEndDate" type="date" value-format="yyyy-MM-dd" placeholder="选择截止日期" style="width: 200px;"></el-date-picker>
          <span class="form-tip-inline">须 ≥ 当日</span>
        </el-form-item>

        <el-form-item label="关联保单号">
          <el-input v-model="applyForm.policyNo" placeholder="选填" style="width: 280px;"></el-input>
        </el-form-item>

        <el-form-item label="OA流水号" required>
          <el-input v-model="applyForm.oaNo" placeholder="请输入OA审批流水号" style="width: 280px;"></el-input>
        </el-form-item>

        <el-form-item label="调整原因">
          <el-select v-model="applyForm.reasonCode" style="width: 280px;" @change="(v) => handleReasonChange(v, 'apply')">
            <el-option label="等级权益补发" value="REASON01"></el-option>
            <el-option label="系统故障补发" value="REASON02"></el-option>
            <el-option label="历史权益修正" value="REASON03"></el-option>
            <el-option label="客户投诉补偿" value="REASON04"></el-option>
            <el-option label="权益派发错误" value="REASON05"></el-option>
            <el-option label="其他原因" value="REASON06"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="详细说明">
          <el-input type="textarea" :rows="3" v-model="applyForm.remark" placeholder="请输入详细说明"></el-input>
        </el-form-item>

        <el-form-item label="附件名称">
          <el-input v-model="applyForm.attachment" placeholder="请输入附件文件名" style="width: 280px;"></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="applyVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSaveApply">提交申请</el-button>
      </span>
    </el-dialog>

    <!-- 3. 编辑申请弹窗 (调用 4.16.22 benefitAdjustModifyApi) -->
    <el-dialog title="修改权益调整申请" :visible.sync="editVisible" width="1000px" append-to-body>
      <div class="edit-top-info">
        <span>申请单号 <strong>{{ editForm.applyNo }}</strong></span>
        <span>客户 <strong>{{ editForm.custName }} ({{ editForm.custId }})</strong></span>
      </div>

      <el-form :model="editForm" ref="editFormRef" label-width="100px" size="small">
        <el-form-item label="服务权益" required class="benefit-form-item">
          <div class="benefit-header">
            <span class="tip-text">
              客户信息不可修改，仅可调整权益申请内容；已选 <strong>{{ editForm.selectedBenefits.length }}</strong> 条
            </span>
            <div class="btn-group">
              <el-button size="mini" type="primary" plain icon="el-icon-plus" @click="openSelectBenefit('edit')">选择权益</el-button>
            </div>
          </div>

          <el-table :data="editForm.selectedBenefits" border size="small" style="width: 100%; margin-top: 8px;" row-key="benefitCode">
            <el-table-column prop="benefitCode" label="服务权益编码" width="120"></el-table-column>
            <el-table-column prop="benefitName" label="服务权益名称" min-width="150"></el-table-column>
            <el-table-column prop="kind" label="服务种类" width="120"></el-table-column>
            <el-table-column prop="supplier" label="服务商" min-width="150" show-overflow-tooltip></el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" class="danger-btn" @click="removeBenefit('edit', scope.$index)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item label="权益有效期" required>
          <el-date-picker v-model="editForm.validEndDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width: 200px;"></el-date-picker>
          <span class="form-tip-inline">仅支持选择当日及以后的日期</span>
        </el-form-item>

        <el-form-item label="关联保单号">
          <el-input v-model="editForm.policyNo" placeholder="选填" style="width: 280px;"></el-input>
        </el-form-item>

        <el-form-item label="OA流水号" required>
          <el-input v-model="editForm.oaNo" style="width: 280px;"></el-input>
        </el-form-item>

        <el-form-item label="调整原因" required>
          <el-select v-model="editForm.reasonCode" style="width: 280px;" @change="(v) => handleReasonChange(v, 'edit')">
            <el-option label="等级权益补发" value="REASON01"></el-option>
            <el-option label="系统故障补发" value="REASON02"></el-option>
            <el-option label="历史权益修正" value="REASON03"></el-option>
            <el-option label="客户投诉补偿" value="REASON04"></el-option>
            <el-option label="权益派发错误" value="REASON05"></el-option>
            <el-option label="其他原因" value="REASON06"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="详细说明">
          <el-input type="textarea" :rows="3" v-model="editForm.remark" placeholder="请输入详细说明"></el-input>
        </el-form-item>

        <el-form-item label="附件名称">
          <el-input v-model="editForm.attachment" placeholder="请输入附件文件名" style="width: 280px;"></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSaveEdit">保存并重新提交</el-button>
      </span>
    </el-dialog>

    <!-- 4. 二级弹窗：选择权益 -->
    <el-dialog title="选择权益" :visible.sync="selectBenefitVisible" width="850px" append-to-body>
      <div class="search-benefit-bar">
        <el-input
            v-model="searchBenefitKey"
            placeholder="搜索服务权益ID / 服务权益"
            prefix-icon="el-icon-search"
            size="small"
            clearable
            style="width: 360px;"
        ></el-input>
        <span class="search-tip">勾选后点击「添加所选权益」</span>
      </div>

      <el-table
          :data="filteredAvailableBenefits"
          border
          size="small"
          style="width: 100%; margin-top: 12px;"
          @selection-change="handleSelectBenefitChange"
      >
        <el-table-column type="selection" width="45" align="center" :selectable="checkSelectable"></el-table-column>
        <el-table-column prop="benefitCode" label="服务权益ID" width="120"></el-table-column>
        <el-table-column prop="benefitName" label="服务权益" width="150"></el-table-column>
        <el-table-column prop="kind" label="服务种类" width="120"></el-table-column>
        <el-table-column prop="supplier" label="服务商" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="isAlreadyAdded(scope.row.benefitCode)" type="info" size="mini">已添加</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <span slot="footer" class="dialog-footer">
        <el-button @click="selectBenefitVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmAddBenefits">添加所选权益</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  serviceAdjustApplyApi, // 4.16.20 提交权益调整申请
  getBenefitAdjustPageApi, // 4.16.21 权益调整申请分页
  benefitAdjustModifyApi, // 4.16.22 修改并重新提交
  deleteBenefitAdjustApi, // 4.16.23 删除申请
  getBenefitAdjustWorkbenchApi, // 4.16.24 前台权益调整工作台
  getBenefitAdjustDetailApi, // 4.16.25 申请详情
  getBenefitItemsApi
} from 'api/test';

export default {
  name: 'BenefitAdjustmentApply',
  data() {
    return {
      loading: false,
      submitLoading: false,
      queryForm: {
        idType: '',
        idNo: '',
        custName: '',
        custId: '',
        orgName: '',
        dateRange: [],
        benefitCode: '',
        status: ''
      },
      total: 0,
      currentPage: 1,
      pageSize: 10,
      tableData: [],

      // 1. 查看详情弹窗
      detailVisible: false,
      currentDetail: null,

      // 2. 新增申请弹窗 (4.16.20)
      applyVisible: false,
      applyForm: {
        custId: '',
        validEndDate: '',
        policyNo: '',
        oaNo: '',
        reasonCode: '',
        reasonName: '',
        remark: '',
        attachment: '',
        selectedBenefits: []
      },
      workbenchCustomer: null, // 从工作台接口查出的客户卡片信息

      // 3. 修改申请弹窗 (4.16.22)
      editVisible: false,
      editForm: {
        id: null,
        applyNo: '',
        custId: '',
        custName: '',
        validEndDate: '',
        policyNo: '',
        oaNo: '',
        reasonCode: '',
        reasonName: '',
        remark: '',
        attachment: '',
        selectedBenefits: []
      },

      reasonMap: {
        REASON01: '等级权益补发',
        REASON02: '系统故障补发',
        REASON03: '历史权益修正',
        REASON04: '客户投诉补偿',
        REASON05: '权益派发错误',
        REASON06: '其他原因'
      },

      // 4. 二级选择权益弹窗
      currentSelectMode: 'apply', // 'apply' | 'edit'
      selectBenefitVisible: false,
      searchBenefitKey: '',
      selectedBenefitsToAdd: [],
      availableBenefits: []
    };
  },
  computed: {
    filteredAvailableBenefits() {
      if (!this.searchBenefitKey) return this.availableBenefits;
      const k = this.searchBenefitKey.toLowerCase();
      return this.availableBenefits.filter(item =>
        item.benefitCode.toLowerCase().includes(k) ||
          item.benefitName.toLowerCase().includes(k)
      );
    }
  },
  mounted() {
    this.fetchTableData();
  },
  methods: {
    // 【4.16.21】查询数据列表
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          pageNum: this.currentPage,
          pageSize: this.pageSize,
          custId: this.queryForm.custId || undefined,
          custName: this.queryForm.custName || undefined,
          idType: this.queryForm.idType || undefined,
          idNo: this.queryForm.idNo || undefined,
          orgName: this.queryForm.orgName || undefined,
          benefitCode: this.queryForm.benefitCode || undefined,
          status: this.queryForm.status || undefined,
          dateFrom: this.queryForm.dateRange && this.queryForm.dateRange[0] ? this.queryForm.dateRange[0] : undefined,
          dateTo: this.queryForm.dateRange && this.queryForm.dateRange[1] ? this.queryForm.dateRange[1] : undefined
        };
        const res = await getBenefitAdjustPageApi(params);
        if (res && res.data) {
          this.tableData = res.data.list || [];
          this.total = res.data.total || 0;
        }
      } catch (error) {
        this.$message.error('获取权益调整申请列表失败');
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.currentPage = 1;
      this.fetchTableData();
    },
    handleReset() {
      this.$refs.queryFormRef.resetFields();
      this.queryForm.dateRange = [];
      this.handleSearch();
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchTableData();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchTableData();
    },

    // 【4.16.25】查看详情
    async handleView(row) {
      try {
        const res = await getBenefitAdjustDetailApi(row.id || row.applyNo);
        if (res && res.data) {
          this.currentDetail = res.data;
        } else {
          this.currentDetail = row;
        }
        this.detailVisible = true;
      } catch (error) {
        this.currentDetail = row;
        this.detailVisible = true;
      }
    },

    // 打开【新增】申请弹窗
    handleOpenApplyDialog() {
      this.applyForm = {
        custId: '',
        validEndDate: '',
        policyNo: '',
        oaNo: '',
        reasonCode: '',
        reasonName: '',
        remark: '',
        attachment: '',
        selectedBenefits: []
      };
      this.workbenchCustomer = null;
      this.applyVisible = true;
    },

    // 【4.16.24】调用工作台接口联动客户信息
    async fetchWorkbenchData() {
      if (!this.applyForm.custId) return;
      try {
        const res = await getBenefitAdjustWorkbenchApi(this.applyForm.custId);
        if (res && res.body && res.body.data) {
          this.workbenchCustomer = res.body.data.customer || null;
        }
      } catch (error) {
        console.warn('获取工作台数据失败或该客户无卡片数据');
      }
    },

    // 【4.16.20】提交新增申请
    async handleSaveApply() {
      if (!this.applyForm.custId) {
        this.$message.warning('请输入客户号');
        return;
      }
      if (!this.applyForm.selectedBenefits.length) {
        this.$message.warning('请选择至少一项权益');
        return;
      }
      if (!this.applyForm.validEndDate) {
        this.$message.warning('请选择权益有效期截止日');
        return;
      }
      if (!this.applyForm.oaNo) {
        this.$message.warning('请输入OA审批流水号');
        return;
      }

      this.submitLoading = true;
      try {
        const payload = {
          custId: this.applyForm.custId,
          benefitCodes: this.applyForm.selectedBenefits.map(b => b.benefitCode).join(','),
          validEndDate: this.applyForm.validEndDate,
          policyNo: this.applyForm.policyNo,
          oaNo: this.applyForm.oaNo,
          reasonCode: this.applyForm.reasonCode,
          reasonName: this.applyForm.reasonName,
          remark: this.applyForm.remark,
          attachment: this.applyForm.attachment
        };
        await serviceAdjustApplyApi(payload);
        this.$message.success('权益调整申请提交成功！');
        this.applyVisible = false;
        this.fetchTableData();
      } catch (error) {
        this.$message.error('提交权益调整申请失败');
      } finally {
        this.submitLoading = false;
      }
    },

    // 打开【修改/重提】申请弹窗
    async handleEdit(row) {
      try {
        const res = await getBenefitAdjustDetailApi(row.id || row.applyNo);
        const data = res && res.body && res.body.data ? res.body.data : row;

        this.editForm.id = data.id || row.id;
        this.editForm.applyNo = data.applyNo || row.applyNo;
        this.editForm.custId = data.custId;
        this.editForm.custName = data.custName;
        this.editForm.validEndDate = data.validEndDate;
        this.editForm.policyNo = data.policyNo || '';
        this.editForm.oaNo = data.oaNo;
        this.editForm.reasonCode = data.reasonCode;
        this.editForm.reasonName = data.reasonName;
        this.editForm.remark = data.remark || '';
        this.editForm.attachment = data.attachment || '';

        // 解析权益列表
        if (data.benefitDetails && data.benefitDetails.length > 0) {
          this.editForm.selectedBenefits = data.benefitDetails.map(item => ({
            benefitCode: item.benefitCode,
            benefitName: item.benefitName,
            kind: item.kind,
            supplier: item.supplier
          }));
        } else if (data.benefitCodes) {
          const codes = data.benefitCodes.split(',');
          const names = data.benefitNames ? data.benefitNames.split('、') : [];
          this.editForm.selectedBenefits = codes.map((code, idx) => ({
            benefitCode: code,
            benefitName: names[idx] || code,
            kind: '-',
            supplier: '-'
          }));
        } else {
          this.editForm.selectedBenefits = [];
        }

        this.editVisible = true;
      } catch (error) {
        this.$message.error('获取申请详情失败');
      }
    },

    // 【4.16.22】修改并重新提交
    async handleSaveEdit() {
      if (!this.editForm.selectedBenefits.length) {
        this.$message.warning('请至少选择一项权益');
        return;
      }
      if (!this.editForm.validEndDate) {
        this.$message.warning('请选择权益有效期截止日');
        return;
      }
      if (!this.editForm.oaNo) {
        this.$message.warning('请输入OA流水号');
        return;
      }

      this.submitLoading = true;
      try {
        const payload = {
          id: this.editForm.id,
          benefitCodes: this.editForm.selectedBenefits.map(b => b.benefitCode).join(','),
          validEndDate: this.editForm.validEndDate,
          policyNo: this.editForm.policyNo,
          oaNo: this.editForm.oaNo,
          reasonCode: this.editForm.reasonCode,
          reasonName: this.editForm.reasonName,
          remark: this.editForm.remark,
          attachment: this.editForm.attachment
        };

        await benefitAdjustModifyApi(payload);
        this.$message.success('修改并重新提交成功！');
        this.editVisible = false;
        this.fetchTableData();
      } catch (error) {
        this.$message.error('提交修改失败');
      } finally {
        this.submitLoading = false;
      }
    },

    // 【4.16.23】删除申请
    handleDelete(row) {
      this.$confirm('确定要删除该申请记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          await deleteBenefitAdjustApi(row.id || row.applyNo);
          this.$message.success('删除成功');
          this.fetchTableData();
        } catch (error) {
          this.$message.error('删除失败');
        }
      }).catch(() => {
      });
    },

    // 原因切换联动 Name
    handleReasonChange(val, mode) {
      if (mode === 'apply') {
        this.applyForm.reasonName = this.reasonMap[val] || '';
      } else {
        this.editForm.reasonName = this.reasonMap[val] || '';
      }
    },

    // 选择权益辅助弹窗控制
    async openSelectBenefit(mode) {
      this.currentSelectMode = mode;
      this.searchBenefitKey = '';
      try {
        const res = await getBenefitItemsApi({ keyword: '' });
        this.availableBenefits = res?.body?.data || res?.data || [];
      } catch (error) {
        this.availableBenefits = [];
        this.$message.error('获取权益字典失败');
      }
      this.selectBenefitVisible = true;
    },
    removeBenefit(mode, index) {
      if (mode === 'apply') {
        this.applyForm.selectedBenefits.splice(index, 1);
      } else {
        this.editForm.selectedBenefits.splice(index, 1);
      }
    },
    isAlreadyAdded(code) {
      const targetList = this.currentSelectMode === 'apply' ? this.applyForm.selectedBenefits : this.editForm.selectedBenefits;
      return targetList.some(b => b.benefitCode === code);
    },
    checkSelectable(row) {
      return !this.isAlreadyAdded(row.benefitCode);
    },
    handleSelectBenefitChange(val) {
      this.selectedBenefitsToAdd = val;
    },
    confirmAddBenefits() {
      if (!this.selectedBenefitsToAdd.length) {
        this.$message.warning('请先勾选需要添加的权益！');
        return;
      }
      const targetList = this.currentSelectMode === 'apply' ? this.applyForm.selectedBenefits : this.editForm.selectedBenefits;
      this.selectedBenefitsToAdd.forEach(item => {
        if (!this.isAlreadyAdded(item.benefitCode)) {
          targetList.push({ ...item });
        }
      });
      this.$message.success(`成功添加 ${this.selectedBenefitsToAdd.length} 项权益`);
      this.selectBenefitVisible = false;
    }
  }
};
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f4f6f9;
  min-height: 100vh;
}

/* 顶部标题区 */
.header-section {
  margin-bottom: 16px;
}

.header-section .title {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-section .subtitle {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
}

.search-card ::v-deep .el-form-item {
  margin-bottom: 12px;
}

.form-btn-group {
  margin-bottom: 0 !important;
}

/* 独立操作按钮区 */
.action-bar {
  margin-bottom: 16px;
}

/* 数据卡片 */
.main-card {
  border: 1px solid #e4e7ed;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.danger-btn {
  color: #f56c6c;
}

.danger-btn:hover {
  color: #f78989;
}

/* 详情弹窗样式 */
.detail-section-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  padding-left: 8px;
  border-left: 3px solid #6383ff;
  margin-bottom: 12px;
}

.detail-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.file-link {
  font-size: 13px;
  color: #6383ff;
  cursor: pointer;
}

/* 编辑/新增弹窗样式 */
.edit-top-info {
  background-color: #f5f7fa;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
  display: flex;
  gap: 30px;
}

.benefit-form-item ::v-deep .el-form-item__content {
  margin-left: 0 !important;
}

.benefit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip-text {
  font-size: 12px;
  color: #909399;
}

.form-tip-inline {
  font-size: 12px;
  color: #909399;
  margin-left: 12px;
}

/* 选择权益弹窗 */
.search-benefit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-tip {
  font-size: 12px;
  color: #909399;
}
</style>
