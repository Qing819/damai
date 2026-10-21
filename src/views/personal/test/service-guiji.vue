<template>
  <div class="page-container">
    <!-- 1. 页面标题 Header -->
    <div class="header-section">
      <h2 class="title">权益轨迹</h2>
      <p class="subtitle">查询客户服务权益的使用记录，服务使用后实时扣减次数，次数用尽自动限制再次申请与使用</p>
    </div>

    <!-- 2. 查询表单卡片 -->
    <el-card class="box-card search-card" shadow="never">
      <el-form :model="queryForm" ref="queryFormRef" label-width="110px" label-position="right" size="small">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="客户号：" prop="custId">
              <el-input v-model="queryForm.custId" placeholder="请输入客户号" clearable />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="客户姓名：" prop="custName">
              <el-input v-model="queryForm.custName" placeholder="请输入客户姓名" clearable />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="证件类型：" prop="idType">
              <el-select v-model="queryForm.idType" placeholder="请选择证件类型" clearable style="width: 100%;">
                <el-option label="居民身份证" value="身份证" />
                <el-option label="中国护照" value="护照" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="证件号码：" prop="idNo">
              <el-input v-model="queryForm.idNo" placeholder="请输入证件号码" clearable />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="服务归属机构：" prop="orgName">
              <el-select v-model="queryForm.orgName" placeholder="请选择归属机构" clearable style="width: 100%;">
                <el-option label="天津分公司" value="天津分公司" />
                <el-option label="北京分公司" value="北京分公司" />
                <el-option label="江苏分公司" value="江苏分公司" />
                <el-option label="上海分公司" value="上海分公司" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="权益动作：" prop="action">
              <el-select v-model="queryForm.action" placeholder="请选择权益动作" clearable style="width: 100%;">
                <el-option label="等级变动调整" value="GRADE_CHANGE" />
                <el-option label="人工调整" value="MANUAL_ADJUST" />
                <el-option label="使用扣减" value="USE_DEDUCT" />
                <el-option label="失效扣减" value="EXPIRE_DEDUCT" />
                <el-option label="扣减回退" value="DEDUCT_ROLLBACK" />
                <el-option label="转出" value="TRANSFER_OUT" />
                <el-option label="转入" value="TRANSFER_IN" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="权益编码：" prop="benefitCode">
              <el-input v-model="queryForm.benefitCode" placeholder="请输入权益编码" clearable />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="次数状态：" prop="countStatus">
              <el-select v-model="queryForm.countStatus" placeholder="请选择次数状态" clearable style="width: 100%;">
                <el-option label="正常" value="NORMAL" />
                <el-option label="已用尽" value="EXHAUSTED" />
                <el-option label="已失效" value="EXPIRED" />
                <el-option label="已转出" value="TRANSFERRED" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 日期范围 -->
          <el-col :xs="24" :sm="12" :md="10" :lg="8">
            <el-form-item label="时间：" prop="dateRange">
              <el-date-picker
                  v-model="queryForm.dateRange"
                  type="daterange"
                  range-separator="~"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%;"
              />
            </el-form-item>
          </el-col>

          <!-- 按钮组 -->
          <el-col :xs="24" :sm="12" :md="14" :lg="16" class="btn-group">
            <el-form-item label-width="0px">
              <el-button type="primary" icon="el-icon-search" :loading="loading" @click="handleSearch">查询</el-button>
              <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
              <el-button icon="el-icon-download" :loading="exportLoading" @click="handleExport">导出</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 3. 统计指标卡片 (对接 getBenefitTraceStatsApi) -->
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="12" :sm="8" :md="3" v-for="(card, index) in statCards" :key="index">
        <el-card shadow="hover" class="stat-card" :style="{ borderTopColor: card.color }">
          <div class="stat-title">{{ card.title }}</div>
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. 权益明细数据表格 (对接 getBenefitTracePageApi) -->
    <el-card class="box-card table-card" shadow="never">
      <div class="table-header">
        <span class="table-title">权益使用明细</span>
        <span class="table-subtitle">次数用尽后系统自动限制该服务项目的再次申请与使用</span>
      </div>

      <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          stripe
          size="medium"
          :header-cell-style="{ background: '#fafafa', color: '#333', fontWeight: 'bold' }"
      >
        <el-table-column prop="traceNo" label="轨迹流水号" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.traceNo }}</span>
            <el-tag v-if="scope.row.annualFlag" size="mini" type="warning" style="margin-left: 5px;">年初台账</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客户" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.custName ? `${scope.row.custName} (${scope.row.custId})` : scope.row.custId }}
          </template>
        </el-table-column>
        <el-table-column prop="idType" label="证件类型" min-width="110"></el-table-column>
        <el-table-column prop="idNo" label="证件号码" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column prop="orgName" label="服务归属机构" min-width="120" show-overflow-tooltip></el-table-column>
        <el-table-column label="权益动作" min-width="120" align="center">
          <template slot-scope="scope">
            <span class="custom-badge" :class="getActionBadgeClass(scope.row.action)">
              {{ formatActionText(scope.row.action) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="benefitCode" label="权益编码" min-width="100"></el-table-column>
        <el-table-column prop="benefitName" label="权益名称" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="supplier" label="服务供应商" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="kind" label="服务种类" min-width="100"></el-table-column>
        <el-table-column prop="validTo" label="有效期" min-width="110" align="center"></el-table-column>
        <el-table-column prop="actionTime" label="动作时间" min-width="160" align="center"></el-table-column>
        <el-table-column label="次数" width="70" align="center">
          <template slot-scope="scope">
            <span :class="scope.row.countChange > 0 ? 'text-plus' : (scope.row.countChange < 0 ? 'text-minus' : '')">
              {{ scope.row.countChange > 0 ? '+' + scope.row.countChange : scope.row.countChange }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="已使用/剩余" min-width="110" align="center">
          <template slot-scope="scope">
            {{ scope.row.usedCount }} / {{ scope.row.remainCount !== null && scope.row.remainCount !== undefined ? scope.row.remainCount : '不限' }}
          </template>
        </el-table-column>
        <el-table-column label="次数状态" width="90" align="center">
          <template slot-scope="scope">
            <span class="custom-badge" :class="getStatusBadgeClass(scope.row.countStatus)">
              {{ formatStatusText(scope.row.countStatus) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleViewDetail(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination-box">
        <el-pagination
            background
            layout="total, prev, pager, next, sizes, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 5. 详情查看弹窗 (对接 getBenefitTraceDetailApi) -->
    <el-dialog
        title="权益使用详情"
        :visible.sync="detailVisible"
        width="680px"
        custom-class="detail-dialog"
        :close-on-click-modal="false"
        append-to-body
    >
      <div v-loading="detailLoading" v-if="currentDetail" class="dialog-body">
        <!-- 权益信息 -->
        <div class="detail-section">
          <div class="section-header">权益信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">轨迹流水号：</span>
              <span class="val">{{ currentDetail.traceNo }}</span>
              <el-tag v-if="currentDetail.annualFlag" size="mini" type="warning" style="margin-left: 5px;">年初台账</el-tag>
            </div>
            <div class="info-item"><span class="label">客户：</span><span class="val">{{ currentDetail.custName ? `${currentDetail.custName} (${currentDetail.custId})` : currentDetail.custId }}</span></div>
            <div class="info-item"><span class="label">证件类型：</span><span class="val">{{ currentDetail.idType || '-' }}</span></div>
            <div class="info-item"><span class="label">证件号码：</span><span class="val">{{ currentDetail.idNo || '-' }}</span></div>
            <div class="info-item"><span class="label">服务归属机构：</span><span class="val">{{ currentDetail.orgName || '-' }}</span></div>
            <div class="info-item"><span class="label">权益编码：</span><span class="val">{{ currentDetail.benefitCode }}</span></div>
            <div class="info-item"><span class="label">权益名称：</span><span class="val">{{ currentDetail.benefitName }}</span></div>
            <div class="info-item"><span class="label">服务供应商：</span><span class="val">{{ currentDetail.supplier || '-' }}</span></div>
            <div class="info-item"><span class="label">服务类型：</span><span class="val">{{ currentDetail.kind || '-' }}</span></div>
            <div class="info-item"><span class="label">有效期：</span><span class="val">{{ currentDetail.validTo || '-' }}</span></div>
            <div class="info-item"><span class="label">关联申请单号：</span><span class="val">{{ currentDetail.applyNo || '-' }}</span></div>
            <div class="info-item"><span class="label">操作人：</span><span class="val">{{ currentDetail.operator || '-' }}</span></div>
            <div class="info-item">
              <span class="label">次数状态：</span>
              <span class="custom-badge" :class="getStatusBadgeClass(currentDetail.countStatus)">
                {{ formatStatusText(currentDetail.countStatus) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 本次使用 -->
        <div class="detail-section">
          <div class="section-header">本次使用</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">权益动作：</span>
              <span class="custom-badge" :class="getActionBadgeClass(currentDetail.action)">
                {{ formatActionText(currentDetail.action) }}
              </span>
            </div>
            <div class="info-item"><span class="label">动作时间：</span><span class="val">{{ currentDetail.actionTime }}</span></div>
            <div class="info-item">
              <span class="label">本次次数：</span>
              <span :class="currentDetail.countChange > 0 ? 'text-plus' : (currentDetail.countChange < 0 ? 'text-minus' : '')" style="font-weight: bold;">
                {{ currentDetail.countChange > 0 ? '+' + currentDetail.countChange : currentDetail.countChange }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">已使用/剩余：</span>
              <span class="val">{{ currentDetail.usedCount }} / {{ currentDetail.remainCount !== null && currentDetail.remainCount !== undefined ? currentDetail.remainCount : '不限' }}</span>
            </div>
          </div>
        </div>

        <!-- 规则底部面板 -->
        <div class="rule-box">
          <span class="rule-tag">权益规则</span>
          <span class="rule-content">服务使用后次数实时扣减并回传；次数用尽后系统自动限制该服务项目的再次申请与使用。</span>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="detailVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getBenefitAnnualPageApi, // 4.16.31 年初台账接口（已导入，按需要使用）
  exportBenefitTraceApi, // 4.16.30 轨迹导出 Excel
  getBenefitTraceStatsApi, // 4.16.28 本期统计
  getBenefitTracePageApi, // 4.16.27 轨迹分页
  getBenefitTraceDetailApi // 4.16.29 轨迹详情
} from '@/api/test/index.js'

export default {
  name: 'EquityTrack',
  data() {
    return {
      loading: false,
      exportLoading: false,
      detailLoading: false,
      queryForm: {
        custId: '',
        custName: '',
        idType: '',
        idNo: '',
        orgName: '',
        action: '',
        benefitCode: '',
        countStatus: '',
        dateRange: []
      },
      statCards: [
        { title: '总轨迹数', value: '0', color: '#2b58f0' },
        { title: '等级变动调整', value: '0', color: '#18a058' },
        { title: '人工调整', value: '0', color: '#303133' },
        { title: '使用扣减', value: '0', color: '#d03050' },
        { title: '失效扣减', value: '0', color: '#e6a23c' },
        { title: '扣减回退', value: '0', color: '#18a058' },
        { title: '转出', value: '0', color: '#909399' },
        { title: '转入', value: '0', color: '#2b58f0' }
      ],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      tableData: [],
      detailVisible: false,
      currentDetail: null
    };
  },
  created() {
    this.fetchData();
    this.fetchStats();
  },
  methods: {
    // 构造请求参数
    buildQueryParams() {
      const { dateRange, ...rest } = this.queryForm;
      const params = {
        ...rest,
        pageNum: this.currentPage,
        pageSize: this.pageSize
      };
      if (dateRange && dateRange.length === 2) {
        params.dateFrom = dateRange[0];
        params.dateTo = dateRange[1];
      }
      return params;
    },

    // 1. 获取列表数据 (4.16.27 权益轨迹分页)
    async fetchData() {
      this.loading = true;
      try {
        const params = this.buildQueryParams();
        const res = await getBenefitTracePageApi(params);
        if (res) {
          const { list, total } = res.data;
          this.tableData = list || [];
          this.total = total || 0;
        }
      } catch (error) {
        console.error('获取权益轨迹列表失败', error);
      } finally {
        this.loading = false;
      }
    },

    // 2. 获取统计数据 (4.16.28 权益轨迹本期统计)
    async fetchStats() {
      try {
        const params = {};
        if (this.queryForm.dateRange && this.queryForm.dateRange.length === 2) {
          params.dateFrom = this.queryForm.dateRange[0];
          params.dateTo = this.queryForm.dateRange[1];
        }
        const res = await getBenefitTraceStatsApi(params);
        if (res) {
          const { total, byAction } = res.data;
          const actions = byAction || {};
          this.statCards[0].value = total || 0;
          this.statCards[1].value = actions.GRADE_CHANGE || 0;
          this.statCards[2].value = actions.MANUAL_ADJUST || 0;
          this.statCards[3].value = actions.USE_DEDUCT || 0;
          this.statCards[4].value = actions.EXPIRE_DEDUCT || 0;
          this.statCards[5].value = actions.DEDUCT_ROLLBACK || 0;
          this.statCards[6].value = actions.TRANSFER_OUT || 0;
          this.statCards[7].value = actions.TRANSFER_IN || 0;
        }
      } catch (error) {
        console.error('获取权益统计失败', error);
      }
    },

    // 3. 导出文件 (4.16.30 权益轨迹导出)
    async handleExport() {
      this.exportLoading = true;
      try {
        const params = this.buildQueryParams();
        delete params.pageNum;
        delete params.pageSize;

        const res = await exportBenefitTraceApi(params);

        const blob = new Blob([res], { type: 'application/vnd.ms-excel' });
        const downloadElement = document.createElement('a');
        const href = window.URL.createObjectURL(blob);
        downloadElement.href = href;
        downloadElement.download = `权益轨迹明细_${new Date().getTime()}.xlsx`;
        document.body.appendChild(downloadElement);
        downloadElement.click();
        document.body.removeChild(downloadElement);
        window.URL.revokeObjectURL(href);
        this.$message.success('导出成功');
      } catch (error) {
        console.error('导出失败', error);
        this.$message.error('导出失败，请重试');
      } finally {
        this.exportLoading = false;
      }
    },

    // 4. 查看详情 (4.16.29 轨迹详情)
    async handleViewDetail(row) {
      this.currentDetail = { ...row };
      this.detailVisible = true;
      this.detailLoading = true;
      try {
        console.log('id', row.id)
        const res = await getBenefitTraceDetailApi(row.id || row.traceNo);
        if (res) {
          this.currentDetail = res.data;
        }
      } catch (error) {
        console.error('获取轨迹详情失败', error);
      } finally {
        this.detailLoading = false;
      }
    },

    handleSearch() {
      this.currentPage = 1;
      this.fetchData();
      this.fetchStats();
    },

    handleReset() {
      this.$refs.queryFormRef.resetFields();
      this.queryForm.dateRange = [];
      this.currentPage = 1;
      this.fetchData();
      this.fetchStats();
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.fetchData();
    },

    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchData();
    },

    formatActionText(action) {
      const map = {
        GRADE_CHANGE: '等级变动调整',
        MANUAL_ADJUST: '人工调整',
        USE_DEDUCT: '使用扣减',
        EXPIRE_DEDUCT: '失效扣减',
        DEDUCT_ROLLBACK: '消减回退',
        TRANSFER_OUT: '转出',
        TRANSFER_IN: '转入'
      };
      return map[action] || action;
    },

    formatStatusText(status) {
      const map = {
        NORMAL: '正常',
        EXHAUSTED: '已用尽',
        EXPIRED: '已失效',
        TRANSFERRED: '已转出'
      };
      return map[status] || status;
    },

    getActionBadgeClass(actionText) {
      switch (actionText) {
        case 'GRADE_CHANGE':
        case 'DEDUCT_ROLLBACK':
        case 'TRANSFER_IN':
        case '等级变动调整':
        case '消减回退':
          return 'badge-green';
        case 'USE_DEDUCT':
        case 'EXPIRE_DEDUCT':
        case 'TRANSFER_OUT':
        case '使用扣减':
        case '失效扣减':
        case '使用消减':
        case '失效消减':
          return 'badge-red';
        case 'MANUAL_ADJUST':
        case '人工调整':
          return 'badge-blue';
        default:
          return 'badge-gray';
      }
    },

    getStatusBadgeClass(status) {
      switch (status) {
        case 'NORMAL':
        case '正常':
          return 'badge-outline-green';
        case 'EXHAUSTED':
        case 'EXPIRED':
        case '已用尽':
        case '已失效':
          return 'badge-outline-red';
        default:
          return 'badge-gray';
      }
    }
  }
};
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 顶部标题 */
.header-section {
  margin-bottom: 16px;
}

.header-section .title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 6px 0;
}

.header-section .subtitle {
  font-size: 13px;
  color: #8c92a4;
  margin: 0;
}

/* 表单卡片 */
.box-card {
  border: none;
  border-radius: 4px;
}

.search-card {
  margin-bottom: 12px;
}

.search-card ::v-deep .el-card__body {
  padding: 16px 16px 0px 16px;
}

.search-card ::v-deep .el-form-item__label {
  font-weight: 500;
  color: #606266;
  font-size: 13px;
}

.btn-group {
  display: flex;
  justify-content: flex-end;
}

/* 统计卡片 */
.stat-row {
  margin-bottom: 12px;
}

.stat-card {
  border-radius: 4px;
  border-top: 3px solid #2b58f0;
  transition: transform 0.2s;
  margin-bottom: 8px;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card ::v-deep .el-card__body {
  padding: 12px 10px;
  text-align: center;
}

.stat-title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  white-space: nowrap;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
}

/* 表格卡片 */
.table-card ::v-deep .el-card__body {
  padding: 20px;
}

.table-header {
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.table-subtitle {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

/* 增减文字设置 */
.text-plus {
  color: #18a058;
  font-weight: 600;
}

.text-minus {
  color: #d03050;
  font-weight: 600;
}

/* 自定义 Tag 标签 */
.custom-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 12px;
  line-height: 18px;
  text-align: center;
}

.badge-green {
  background-color: #e8f7f0;
  color: #18a058;
}

.badge-red {
  background-color: #fdebee;
  color: #d03050;
}

.badge-blue {
  background-color: #eef3fe;
  color: #2b58f0;
}

.badge-gray {
  background-color: #f4f4f5;
  color: #909399;
}

.badge-outline-green {
  background-color: #e8f7f0;
  color: #18a058;
  border: 1px solid #b7eb8f;
}

.badge-outline-red {
  background-color: #fdebee;
  color: #d03050;
  border: 1px solid #ffa39e;
}

/* 分页 */
.pagination-box {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情 Dialog */
.dialog-body {
  padding: 0 4px;
}

.detail-section {
  margin-bottom: 18px;
}

.section-header {
  font-size: 14px;
  font-weight: bold;
  color: #1a365d;
  padding-left: 8px;
  border-left: 3px solid #2b58f0;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  background-color: #fafafa;
  padding: 12px;
  border-radius: 4px;
}

.info-item {
  font-size: 13px;
  line-height: 1.5;
}

.info-item .label {
  color: #8c92a4;
}

.info-item .val {
  color: #303133;
  font-weight: 500;
}

/* 规则提示 */
.rule-box {
  margin-top: 16px;
  background-color: #eef3fe;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  align-items: flex-start;
}

.rule-tag {
  font-size: 12px;
  font-weight: bold;
  color: #2b58f0;
  margin-right: 12px;
  white-space: nowrap;
}

.rule-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}
</style>