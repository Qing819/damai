<template>
  <div class="page-container">
    <!-- 页面标题区 -->
    <div class="header-section">
      <h2 class="title">权益调整审批</h2>
      <p class="subtitle">对待审批的权益调整申请进行审批处理，审批通过后权益派发至客户</p>
    </div>

    <!-- 顶部查询表单卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" ref="queryFormRef" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="证件类型" prop="idType">
              <el-select v-model="queryForm.idType" placeholder="请选择证件类型" clearable style="width: 100%">
                <el-option label="全部证件类型" value="all"></el-option>
                <el-option label="居民身份证" value="1"></el-option>
                <el-option label="中国护照" value="2"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="证件号码" prop="idCard">
              <el-input v-model="queryForm.idCard" placeholder="请输入证件号码" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="queryForm.customerName" placeholder="请输入客户姓名" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="客户号" prop="customerNo">
              <el-input v-model="queryForm.customerNo" placeholder="请输入客户号" clearable></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="服务归属机构" prop="org">
              <el-select v-model="queryForm.org" placeholder="请选择服务归属机构" clearable style="width: 100%">
                <el-option label="全部服务归属机构" value="all"></el-option>
                <el-option label="天津分公司" value="tj"></el-option>
                <el-option label="北京分公司" value="bj"></el-option>
                <el-option label="江苏分公司" value="js"></el-option>
                <el-option label="上海分公司" value="sh"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="调整权益" prop="benefit">
              <el-select v-model="queryForm.benefit" placeholder="请选择调整权益" clearable style="width: 100%">
                <el-option label="全部调整权益" value="all"></el-option>
                <el-option label="视频医生服务" value="1"></el-option>
                <el-option label="专家问诊服务" value="2"></el-option>
                <el-option label="体检服务" value="3"></el-option>
                <el-option label="重疾关怀服务" value="4"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryForm.status" placeholder="请选择状态" clearable style="width: 100%">
                <el-option label="全部状态" value=""></el-option>
                <el-option label="待审核" value="PENDING"></el-option>
                <el-option label="已通过" value="APPROVED"></el-option>
                <el-option label="已驳回" value="REJECTED"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="申请人" prop="applicant">
              <el-select v-model="queryForm.applicant" placeholder="请选择申请人" clearable style="width: 100%">
                <el-option label="全部申请人" value=""></el-option>
                <el-option label="张三" value="zhangsan"></el-option>
                <el-option label="李四" value="lisi"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
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
          <el-col :span="18" class="btn-col">
            <el-form-item class="form-btn-group">
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
              <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 数据列表卡片 -->
    <el-card class="main-card" shadow="never">
      <div class="table-title">申请列表</div>

      <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%"
          border
          stripe
          :header-cell-style="{ background: '#f8f9fa', color: '#606266', fontWeight: 'bold' }"
      >
        <el-table-column prop="customer" label="客户" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column prop="idType" label="证件类型" min-width="110"></el-table-column>
        <el-table-column prop="idCard" label="证件号码" min-width="170"></el-table-column>
        <el-table-column prop="org" label="服务归属机构" min-width="120"></el-table-column>
        <el-table-column prop="benefitId" label="服务权益ID" min-width="130"></el-table-column>
        <el-table-column prop="benefitName" label="调整权益" min-width="170" show-overflow-tooltip></el-table-column>
        <el-table-column prop="reason" label="调整原因" min-width="120"></el-table-column>
        <el-table-column prop="policyNo" label="关联保单号" min-width="130">
          <template slot-scope="scope">
            {{ scope.row.policyNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="oaSn" label="OA流水号" min-width="150"></el-table-column>
        <el-table-column prop="applicant" label="申请人" width="90" align="center"></el-table-column>
        <el-table-column prop="applyTime" label="申请时间" min-width="160" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 'pending'" type="warning" size="small" effect="plain">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'approved' || scope.row.status === 'APPROVED'" type="success" size="small" effect="plain">已通过</el-tag>
            <el-tag v-else-if="scope.row.status === 'rejected' || scope.row.status === 'REJECTED'" type="danger" size="small" effect="plain">已驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approveTime" label="审批通过时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ scope.row.approveTime || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button v-if="scope.row.status === 'pending'" type="text" size="small" @click="handleApprove(scope.row)">审批</el-button>
            <el-button v-else type="text" size="small" @click="handleView(scope.row)">查看</el-button>
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

    <!-- 审批 / 查看详情弹窗 -->
    <el-dialog
        title="审批详情"
        :visible.sync="dialogVisible"
        width="800px"
        :close-on-click-modal="false"
        append-to-body
        v-loading="dialogLoading"
    >
      <div class="dialog-content" v-if="currentDetail">
        <!-- 基础信息面板 -->
        <el-descriptions :column="2" class="detail-descriptions">
          <el-descriptions-item label="申请单号">{{ currentDetail.applyNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentDetail.customer }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ currentDetail.idType }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ currentDetail.idCard }}</el-descriptions-item>
          <el-descriptions-item label="服务归属机构">{{ currentDetail.org }}</el-descriptions-item>
          <el-descriptions-item label="调整原因">{{ currentDetail.reason }}</el-descriptions-item>
          <el-descriptions-item label="关联保单号">{{ currentDetail.policyNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="OA流水号">{{ currentDetail.oaSn }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentDetail.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentDetail.applicant }}</el-descriptions-item>
        </el-descriptions>

        <!-- 调整权益表格区块 -->
        <div class="section-block">
          <div class="section-title">调整权益</div>
          <el-table :data="benefitTableData" border style="width: 100%" size="small">
            <el-table-column prop="benefitCode" label="服务权益ID" width="100"></el-table-column>
            <el-table-column prop="kind" label="服务种类" width="100"></el-table-column>
            <el-table-column prop="benefitName" label="服务权益" width="120"></el-table-column>
            <el-table-column prop="supplier" label="服务商" width="110"></el-table-column>
            <el-table-column prop="signOrg" label="签约机构" width="100"></el-table-column>
            <el-table-column prop="regionsJson" label="适用地区" width="100"></el-table-column>
            <el-table-column prop="identitiesJson" label="适用身份" width="180"></el-table-column>
            <el-table-column prop="itemCount" label="项目数" width="80" align="center"></el-table-column>
          </el-table>

          <!-- 嵌套服务项目明细 -->
          <div class="sub-table-wrapper" v-if="projectTableData && projectTableData.length">
            <div class="sub-table-title">服务项目</div>
            <el-table :data="projectTableData" border style="width: 100%" size="mini">
              <el-table-column prop="category" label="服务类别" min-width="120"></el-table-column>
              <el-table-column prop="itemName" label="服务项目名称" min-width="140"></el-table-column>
              <el-table-column prop="frequency" label="服务频次" min-width="120"></el-table-column>
              <el-table-column prop="needOrder" label="是否需订单申请" min-width="130" align="center"></el-table-column>
              <el-table-column prop="orderChannel" label="订单申请途径" min-width="120" align="center">
                <template slot-scope="scope">
                  {{ scope.row.orderChannel || '—' }}
                </template>
              </el-table-column>
              <el-table-column prop="needAudit" label="是否审核" min-width="100" align="center"></el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 详细说明 -->
        <div class="section-block">
          <div class="section-title">详细说明</div>
          <div class="detail-text">{{ currentDetail.remark || currentDetail.description || '无' }}</div>
        </div>

        <!-- 附件 -->
        <div class="section-block" v-if="currentDetail.attachment">
          <div class="section-title">附件</div>
          <div class="file-list">
            <el-link type="primary" icon="el-icon-document" :underline="false" :href="currentDetail.attachment" target="_blank">查看/下载附件</el-link>
          </div>
        </div>

        <!-- 审批历史/信息（查看模式下展示） -->
        <div class="section-block" v-if="!isApproveMode && currentDetail.auditor">
          <div class="section-title">审批信息</div>
          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="审批人">{{ currentDetail.auditor }}</el-descriptions-item>
            <el-descriptions-item label="审批时间">{{ currentDetail.auditTime }}</el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2">{{ currentDetail.auditOpinion || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 审批意见区（仅在待审批模式或有审批操作时展示） -->
        <div class="section-block" v-if="isApproveMode">
          <div class="section-title">审批意见 <span class="sub-hint">(驳回时必填)</span></div>
          <el-input
              type="textarea"
              :rows="3"
              placeholder="请输入审批意见"
              v-model="approvalRemark"
          >
          </el-input>
        </div>
      </div>

      <!-- 弹窗底部按钮栏 -->
      <span slot="footer" class="dialog-footer">
        <template v-if="isApproveMode">
          <el-button type="danger" plain :loading="submitLoading" @click="handleAudit('REJECTED')">驳 回</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleAudit('APPROVED')">审批通过</el-button>
        </template>
        <template v-else>
          <el-button @click="dialogVisible = false">关 闭</el-button>
        </template>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getBenefitAdjustDetailApi, getBenefitAdjustPageApi, passBenefitAdjustApi } from '@/api/test';

export default {
  name: 'BenefitAdjustmentApproval',
  data() {
    return {
      queryForm: {
        idType: '',
        idCard: '',
        customerName: '',
        customerNo: '',
        org: '',
        benefit: '',
        status: '',
        applicant: '',
        dateRange: []
      },
      total: 0,
      currentPage: 1,
      pageSize: 10,
      tableData: [],
      loading: false,

      // 弹窗相关控制变量
      dialogVisible: false,
      dialogLoading: false,
      submitLoading: false,
      isApproveMode: false,
      currentDetail: null,
      approvalRemark: '',

      // 详情弹窗内部权益明细数据
      benefitTableData: [],
      projectTableData: []
    };
  },
  mounted() {
    this.fetchTableData();
  },
  methods: {
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          pageNum: this.currentPage,
          pageSize: this.pageSize,
          idType: this.queryForm.idType || undefined,
          idNo: this.queryForm.idCard || undefined,
          custName: this.queryForm.customerName || undefined,
          custId: this.queryForm.customerNo || undefined,
          orgName: this.queryForm.org || undefined,
          benefitCode: this.queryForm.benefit || undefined,
          status: this.queryForm.status || undefined,
          applicant: this.queryForm.applicant || undefined,
          dateFrom: this.queryForm.dateRange[0] || undefined,
          dateTo: this.queryForm.dateRange[1] || undefined
        };
        const res = await getBenefitAdjustPageApi(params);
        const data = res?.body?.data || res?.data || {};
        this.tableData = (data.list || []).map(item => ({
          ...item,
          customer: `${item.custName || '-'} (${item.custId || '-'})`,
          idCard: item.idNo || '-',
          org: item.orgName || '-',
          benefitId: item.benefitCodes || '-',
          benefitName: item.benefitNames || '-',
          reason: item.reasonName || '-',
          policyNo: item.policyNo || '',
          oaSn: item.oaNo || '-',
          applicant: item.applicant || '-',
          status: String(item.status || '').toLowerCase(),
          approveTime: item.auditTime || ''
        }));
        this.total = data.total || 0;
      } catch (error) {
        this.tableData = [];
        this.total = 0;
        this.$message.error('获取权益审批列表失败');
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
      this.currentPage = 1;
      this.fetchTableData();
    },
    // 打开审批弹窗
    async handleApprove(row) {
      this.isApproveMode = true;
      this.approvalRemark = '';
      this.dialogVisible = true;
      await this.fetchDetail(row);
    },
    // 打开查看详情弹窗
    async handleView(row) {
      this.isApproveMode = false;
      this.approvalRemark = '';
      this.dialogVisible = true;
      await this.fetchDetail(row);
    },
    // 调用详情接口
    async fetchDetail(row) {
      this.dialogLoading = true;
      // 先用当前行数据保底兜底
      this.currentDetail = { ...row };
      this.benefitTableData = [];
      this.projectTableData = [];

      try {
        const res = await getBenefitAdjustDetailApi(row.id || row.applyNo);
        // 根据实际后端返回格式适配（若返回数据在 res.body.data 或 res.data）
        const resData = res?.body?.data || res?.data || res;
        if (resData) {
          this.currentDetail = {
            ...row,
            ...resData
          };
          // 适配接口返回的 benefitDetails 数组
          this.benefitTableData = resData.benefitDetails || [];
          this.projectTableData = resData.projectDetails || [];
        }
      } catch (error) {
        console.error('获取详情失败:', error);
      } finally {
        this.dialogLoading = false;
      }
    },
    // 统一处理审核（通过 / 驳回）
    async handleAudit(result) {
      if (result === 'REJECTED' && !this.approvalRemark.trim()) {
        this.$message.warning('驳回时请输入审批意见！');
        return;
      }

      const params = {
        id: this.currentDetail.id,
        result, // 'APPROVED' 或 'REJECTED'
        opinion: this.approvalRemark // 驳回时必填意见
      };

      this.submitLoading = true;
      try {
        const res = await passBenefitAdjustApi(params);
        if (res?.header?.statusCode === '000000' || res?.code === 200 || res?.success) {
          this.$message.success(result === 'APPROVED' ? '审批通过！' : '已成功驳回！');

          // 更新本地数据行状态
          this.currentDetail.status = result.toLowerCase();
          if (result === 'APPROVED') {
            const auditData = res?.body?.data;
            this.currentDetail.approveTime = auditData?.auditTime || new Date().toLocaleString();
          }
          this.dialogVisible = false;
          await this.fetchTableData();
        } else {
          this.$message.error(res?.header?.message || '操作失败');
        }
      } catch (error) {
        console.error('提交失败:', error);
      } finally {
        this.submitLoading = false;
      }
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchTableData();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchTableData();
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

/* 按钮居右对齐 */
.btn-col {
  display: flex;
  justify-content: flex-end;
}

.form-btn-group {
  margin-bottom: 0 !important;
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

/* 审批详情弹窗内部样式 */
.detail-descriptions {
  margin-bottom: 16px;
}

.section-block {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  padding-left: 8px;
  border-left: 3px solid #409eff;
  margin-bottom: 12px;
}

.sub-hint {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.sub-table-wrapper {
  margin-top: 10px;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px dashed #e4e7ed;
  border-radius: 4px;
}

.sub-table-title {
  font-size: 13px;
  font-weight: bold;
  color: #606266;
  margin-bottom: 8px;
}

.detail-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.file-list {
  padding: 4px 0;
}
</style>
