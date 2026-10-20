<template>
  <div class="points-management-app">
    <!-- View 1: 积分调整申请列表页 -->
    <div v-if="currentView === 'list'" class="page-container">
      <!-- 搜索筛选栏 -->
      <el-card class="filter-card" shadow="never">
        <el-form :inline="true" :model="searchForm" size="small" class="custom-filter-form">
          <el-form-item label="证件类型">
            <el-select v-model="searchForm.idType" placeholder="全部证件类型" clearable style="width: 150px">
              <el-option label="身份证" value="IDCARD" />
              <el-option label="护照" value="PASSPORT" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </el-form-item>
          <el-form-item label="证件号码">
            <el-input v-model.trim="searchForm.idNo" placeholder="请输入证件号码" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input v-model.trim="searchForm.custName" placeholder="请输入客户名称" clearable style="width: 140px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="客户号">
            <el-input v-model.trim="searchForm.custId" placeholder="请输入客户号" clearable style="width: 140px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="申请日期">
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="~"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 240px"
                @change="handleDateChange"
            />
          </el-form-item>
          <el-form-item label="调整类型">
            <el-select v-model="searchForm.adjustType" placeholder="全部调整类型" clearable style="width: 150px">
              <el-option label="加分" value="加分" />
              <el-option label="减分" value="减分" />
            </el-select>
          </el-form-item>

          <!-- 按规范将 value 调整为状态编码 -->
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 130px">
              <el-option label="待审核" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 新增按钮 -->
      <div style="margin: 16px 0;">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="currentView = 'workspace'">
          新增积分调整
        </el-button>
      </div>

      <!-- 我的申请记录表格 (对应 4.2.2 接口) -->
      <el-card shadow="never" class="table-card">
        <div slot="header" class="card-header">
          <span class="header-title">我的申请记录</span>
        </div>

        <el-table v-loading="loading" :data="recordList" border style="width: 100%" size="small">
          <el-table-column label="客户" min-width="160">
            <template slot-scope="scope">
              {{ scope.row.custName || '—' }}（{{ scope.row.custId || '—' }}）
            </template>
          </el-table-column>
          <el-table-column prop="idType" label="证件类型" width="90" align="center">
            <template slot-scope="scope">
              {{ formatIdType(scope.row.idType) }}
            </template>
          </el-table-column>
          <el-table-column prop="idNo" label="证件号码" width="160" show-overflow-tooltip />
          <el-table-column prop="adjustType" label="调整类型" width="90" align="center">
            <template slot-scope="scope">
              <span :class="isAddAdjust(scope.row.adjustType) ? 'text-success' : 'text-danger'">
                {{ formatAdjustType(scope.row.adjustType) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="adjustAmt" label="调整积分额度" width="120" align="right">
            <template slot-scope="scope">
              <strong :class="scope.row.adjustType === '加分' ? 'text-success' : 'text-danger'">
                {{ isAddAdjust(scope.row.adjustType) ? '+' : '-' }} {{ scope.row.adjustAmt | formatNumber }}
              </strong>
            </template>
          </el-table-column>
          <el-table-column prop="reasonName" label="调整原因" width="130" show-overflow-tooltip />
          <el-table-column prop="policyNo" label="关联保单号" width="120">
            <template slot-scope="scope">{{ scope.row.policyNo || '—' }}</template>
          </el-table-column>
          <el-table-column prop="oaNo" label="OA流水号" width="140" show-overflow-tooltip />
          <el-table-column prop="applicant" label="申请人" width="90" align="center" />
          <el-table-column prop="applyTime" label="申请时间" width="150" align="center" />

          <!-- 表格状态展示适配转换 -->
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag
                  size="mini"
                  :type="getStatusTagType(scope.row.status)"
              >
                {{ formatStatus(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 修改/删除的条件适配编码 -->
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="openDetail(scope.row)">查看</el-button>
              <template v-if="scope.row.status === 'REJECTED' || scope.row.status === '已驳回'">
                <el-button type="text" size="mini" @click="openEdit(scope.row)">修改</el-button>
                <el-button type="text" size="mini" class="text-danger" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
              background
              :current-page="searchForm.pageNum"
              :page-sizes="[10, 20, 50]"
              :page-size="searchForm.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
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
        <el-form :inline="true" size="small">
          <el-form-item label="客户信息">
            <el-input v-model="customerSearchKey" placeholder="请输入客户号、姓名或证件号" style="width: 260px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" :loading="customerLoading" @click="handleCustomerSearch">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetCustomerSearch">重置</el-button>
          </el-form-item>
          <span class="tip-text">输入客户号 / 姓名 / 证件号查询后，展示客户积分明细与调整操作</span>
        </el-form>
      </el-card>

      <!-- 客户信息（查询后展示） -->
      <el-card v-if="hasSearchedCustomer && customerInfo" shadow="never" class="section-card">
        <div slot="header" class="card-header">
          <span class="header-title">客户信息</span>
        </div>
        <el-row :gutter="20" class="customer-info-row">
          <el-col :span="6">客户号：<strong>{{ customerInfo.custId }}</strong></el-col>
          <el-col :span="5">客户姓名：<strong>{{ customerInfo.custName || '—' }}</strong></el-col>
          <el-col :span="7">证件号：<strong>{{ customerInfo.idNo || '—' }}</strong></el-col>
          <el-col :span="6">客户等级：<el-tag size="mini" type="warning">{{ customerInfo.gradeName || '—' }}</el-tag></el-col>
          <el-col :span="6">服务机构：<strong>{{ customerInfo.orgName || '—' }}</strong></el-col>
          <el-col :span="12">
            当前积分总额：<span class="points-badge">{{ customerInfo.currentPoint | formatNumber }}</span> 积分
          </el-col>
        </el-row>
      </el-card>

      <!-- 左右两栏布局 -->
      <el-row v-if="hasSearchedCustomer && customerInfo" :gutter="16" style="margin-top: 16px;">
        <!-- 左侧：积分明细 -->
        <el-col :span="11">
          <el-card shadow="never">
            <div slot="header" class="card-header">
              <span class="header-title">积分明细</span>
            </div>

            <el-form :inline="true" size="mini" class="mini-form">
              <el-form-item label="发生时间">
                <el-date-picker v-model="detailFilter.startDate" type="date" placeholder="开始日期" style="width: 110px" />
                ~
                <el-date-picker v-model="detailFilter.endDate" type="date" placeholder="结束日期" style="width: 110px" />
              </el-form-item>
              <el-form-item label="来源">
                <el-select v-model="detailFilter.source" placeholder="全部来源" style="width: 90px">
                  <el-option label="全部来源" value="" />
                </el-select>
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="detailFilter.type" placeholder="全部类型" style="width: 90px">
                  <el-option label="全部类型" value="" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search">查询</el-button>
              </el-form-item>
            </el-form>

            <el-table :data="pointsDetailList" border size="mini" style="width: 100%">
              <el-table-column prop="date" label="时间" width="90" />
              <el-table-column prop="source" label="来源" width="90" />
              <el-table-column prop="type" label="类型" width="80">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="scope.row.type === '人工调整' ? 'warning' : 'primary'">{{ scope.row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="积分额度" width="90" align="right">
                <template slot-scope="scope">
                  <span :class="scope.row.amount.startsWith('+') ? 'text-success' : 'text-danger'">
                    {{ scope.row.amount }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="说明" />
            </el-table>

            <div class="table-sub-footer">
              <el-button size="mini" @click="moreDetailDialogVisible = true">加载更多</el-button>
              <span>共 32 条积分流水</span>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：积分调整操作区 -->
        <el-col :span="13">
          <el-card shadow="never">
            <div slot="header" class="card-header">
              <span class="header-title">积分调整操作区</span>
            </div>

            <el-form
                ref="adjustForm"
                :model="adjustForm"
                :rules="adjustRules"
                label-width="120px"
                label-position="right"
                size="small"
                class="aligned-form"
            >
              <el-form-item label="调整方向" prop="adjustType" required>
                <el-radio-group v-model="adjustForm.adjustType">
                  <el-radio label="加分">加分</el-radio>
                  <el-radio label="减分">减分</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="调整积分额度" prop="adjustAmt" required>
                <div class="form-inline-content">
                  <el-input v-model="adjustForm.adjustAmt" placeholder="请输入调整积分额度" style="width: 220px" />
                  <span class="form-tip">正整数，支持小数点后 2 位</span>
                </div>
              </el-form-item>

              <el-form-item label="积分有效期" prop="validType" required>
                <div class="form-inline-content">
                  <el-select v-model="adjustForm.validType" style="width: 220px">
                    <el-option label="自然年（至当年12月31日）" value="nat" />
                    <el-option label="指定截止日" value="custom" />
                  </el-select>
                  <span class="form-tip">VIP积分默认按自然年有效期，至当年12月31日</span>
                </div>
              </el-form-item>

              <el-form-item v-if="adjustForm.validType === 'custom'" label="有效期截止日" prop="validEndDate" required>
                <el-date-picker
                    v-model="adjustForm.validEndDate"
                    type="date"
                    placeholder="选择有效期截止日"
                    value-format="yyyy-MM-dd"
                    style="width: 220px"
                />
              </el-form-item>

              <el-form-item label="关联保单号" prop="policyNo">
                <el-input v-model="adjustForm.policyNo" placeholder="选填，与特定保单相关时填写" style="width: 100%" />
              </el-form-item>

              <el-form-item label="OA流水号" prop="oaNo" required>
                <el-input v-model="adjustForm.oaNo" placeholder="请输入OA审批流程流水号" style="width: 100%" />
              </el-form-item>

              <el-form-item label="调整原因" prop="reasonCode" required>
                <el-select v-model="adjustForm.reasonCode" style="width: 100%" @change="handleReasonChange">
                  <el-option label="活动积分补发" value="ACT_SUPPLEMENT" />
                  <el-option label="系统故障补算" value="SYS_FIX" />
                  <el-option label="客户投诉处理" value="COMPLAINT" />
                  <el-option label="历史积分修正" value="HISTORY_CORRECTION" />
                </el-select>
              </el-form-item>

              <el-form-item label="详细说明" prop="remark">
                <el-input v-model="adjustForm.remark" type="textarea" :rows="3" placeholder="请输入详细说明" />
              </el-form-item>

              <el-form-item label="附件上传">
                <div class="upload-custom-container">
                  <input
                      type="file"
                      ref="workspaceFileInput"
                      style="display: none;"
                      @change="handleWorkspaceFileChange"
                  />
                  <el-button size="small" icon="el-icon-upload2" @click="$refs.workspaceFileInput.click()">选择文件</el-button>

                  <span v-if="adjustForm.attachment" class="file-name">
                    <i class="el-icon-document" /> {{ adjustForm.attachment }}
                  </span>
                  <span class="upload-tip">支持 jpg / png / pdf，单文件 ≤ 5MB</span>
                </div>
              </el-form-item>

              <el-form-item class="form-action-item">
                <el-button icon="el-icon-check" type="primary" @click="submitAdjust">提交调整</el-button>
                <el-button icon="el-icon-refresh" @click="resetAdjust">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Dialog 1: 申请详情弹窗 (对应 4.2.3 接口) -->
    <el-dialog title="申请详情" :visible.sync="detailDialogVisible" width="650px" v-loading="detailLoading">
      <div v-if="detailData">
        <div class="dialog-section">
          <div class="section-title">申请内容</div>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="申请单号">{{ detailData.applyNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ detailData.custName || '—' }}（{{ detailData.custId || '—' }}）</el-descriptions-item>
            <el-descriptions-item label="证件信息">{{ formatIdType(detailData.idType) }} / {{ detailData.idNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="调整类型">
              <span :class="isAddAdjust(detailData.adjustType) ? 'text-success' : 'text-danger'">{{ formatAdjustType(detailData.adjustType) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="调整积分额度">
              <strong :class="isAddAdjust(detailData.adjustType) ? 'text-success' : 'text-danger'">
                {{ isAddAdjust(detailData.adjustType) ? '+' : '-' }}{{ detailData.adjustAmt | formatNumber }}
              </strong>
            </el-descriptions-item>
            <el-descriptions-item label="调整原因">{{ detailData.reasonName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="关联保单号">{{ detailData.policyNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="OA流水号">{{ detailData.oaNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ detailData.applicant || '—' }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ detailData.applyTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="有效期类型">{{ detailData.validType || '—' }}</el-descriptions-item>
            <el-descriptions-item label="有效期截止日">{{ detailData.validEndDate || '—' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="dialog-section">
          <div class="section-title">积分变化</div>
          <div class="preview-box">
            <div>
              <span class="sub-label">调整前积分</span>
              <div class="val">{{ detailData.beforePoint | formatNumber }}</div>
            </div>
            <div class="arrow">→</div>
            <div>
              <span class="sub-label">调整后积分</span>
              <div class="val text-success">{{ detailData.afterPoint | formatNumber }}</div>
            </div>
          </div>
        </div>

        <div class="dialog-section">
          <div class="section-title">详细说明</div>
          <div class="desc-box">{{ detailData.remark || '暂无说明' }}</div>
        </div>

        <div class="dialog-section">
          <div class="section-title">附件</div>
          <el-link v-if="detailData.attachment" type="primary" icon="el-icon-document">{{ detailData.attachment }}</el-link>
          <span v-else class="text-muted">无附件</span>
        </div>

        <div class="dialog-section">
          <div class="section-title">审批信息</div>
          <el-descriptions v-if="detailData.auditor || detailData.auditTime" :column="2" size="small" border>
            <!-- 详情中的状态展示适配转换 -->
            <el-descriptions-item label="审核状态">
              <el-tag size="mini" :type="getStatusTagType(detailData.status)">
                {{ formatStatus(detailData.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核人">{{ detailData.auditor || '—' }}</el-descriptions-item>
            <el-descriptions-item label="审核时间">{{ detailData.auditTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="审核意见" :span="2">{{ detailData.auditOpinion || '—' }}</el-descriptions-item>
          </el-descriptions>
          <p v-else class="text-muted">该申请尚未完成审批，暂无审批结果。</p>
        </div>
      </div>
    </el-dialog>

    <!-- Dialog 2: 修改申请弹窗 -->
    <el-dialog title="修改申请" :visible.sync="editDialogVisible" width="620px">
      <div v-if="editRow">
        <el-alert
            title="客户信息不可修改，仅可调整积分申请内容"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px;"
        >
          <div>申请单号：<strong>{{ editRow.applyNo || '—' }}</strong> &nbsp;&nbsp;&nbsp;&nbsp; 客户：<strong>{{ editRow.custName }}（{{ editRow.custId }}）</strong></div>
        </el-alert>

        <el-form :model="editForm" label-width="120px" label-position="right" size="small" class="aligned-form">
          <div class="section-title" style="margin-bottom: 16px;">调整内容</div>

          <el-form-item label="调整方向" required>
            <el-radio-group v-model="editForm.adjustType">
              <el-radio label="加分">加分</el-radio>
              <el-radio label="减分">减分</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="调整积分额度" required>
            <el-input v-model="editForm.adjustAmt" style="width: 220px" />
          </el-form-item>

          <el-form-item label="积分有效期" required>
            <el-select v-model="editForm.validType" style="width: 220px">
              <el-option label="自然年（至当年12月31日）" value="nat" />
              <el-option label="指定截止日" value="custom" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="editForm.validType === 'custom'" label="有效期截止日" required>
            <el-date-picker
                v-model="editForm.validEndDate"
                type="date"
                placeholder="选择有效期截止日"
                value-format="yyyy-MM-dd"
                style="width: 220px"
            />
          </el-form-item>

          <el-form-item label="关联保单号">
            <el-input v-model="editForm.policyNo" placeholder="选填，与特定保单相关时填写" style="width: 100%" />
          </el-form-item>

          <el-form-item label="OA流水号" required>
            <el-input v-model="editForm.oaNo" style="width: 100%" />
          </el-form-item>

          <el-form-item label="调整原因" required>
            <el-select v-model="editForm.reasonCode" style="width: 100%" @change="handleEditReasonChange">
              <el-option label="客户投诉处理" value="COMPLAINT" />
              <el-option label="活动积分补发" value="ACT_SUPPLEMENT" />
            </el-select>
          </el-form-item>

          <el-form-item label="详细说明">
            <el-input v-model="editForm.remark" type="textarea" :rows="3" />
          </el-form-item>

          <el-form-item label="附件上传">
            <div class="upload-custom-container">
              <input
                  type="file"
                  ref="editFileInput"
                  style="display: none;"
                  @change="handleEditFileChange"
              />
              <el-button size="small" icon="el-icon-upload2" @click="$refs.editFileInput.click()">选择文件</el-button>

              <span v-if="editForm.attachment" class="file-name">
                <i class="el-icon-document" /> {{ editForm.attachment }}
              </span>
              <span class="upload-tip">支持 jpg / png / pdf，单文件 ≤ 5MB</span>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="saveEdit">保存并重新提交</el-button>
      </div>
    </el-dialog>

    <!-- Dialog 3: 全量积分明细弹窗 -->
    <el-dialog title="全量积分明细" :visible.sync="moreDetailDialogVisible" width="800px">
      <el-form :inline="true" :model="moreDetailFilter" size="small" class="custom-filter-form" style="margin-bottom: 12px;">
        <el-form-item label="发生时间">
          <el-date-picker v-model="moreDetailFilter.startDate" type="date" placeholder="开始日期" style="width: 130px" />
          <span style="margin: 0 4px; color: #909399;">~</span>
          <el-date-picker v-model="moreDetailFilter.endDate" type="date" placeholder="结束日期" style="width: 130px" />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="moreDetailFilter.source" placeholder="全部来源" style="width: 110px">
            <el-option label="全部来源" value="" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="moreDetailFilter.type" placeholder="全部类型" style="width: 110px">
            <el-option label="全部类型" value="" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="morePointsDetailList" border size="small" style="width: 100%">
        <el-table-column prop="date" label="时间" width="120" align="center" />
        <el-table-column prop="source" label="来源" width="130" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.type === '人工调整' ? 'warning' : 'primary'">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="积分额度" width="120" align="right">
          <template slot-scope="scope">
            <span :class="scope.row.amount.startsWith('+') ? 'text-success' : 'text-danger'">{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" />
      </el-table>

      <div class="pagination-container" style="margin-top: 16px;">
        <el-pagination :current-page="1" :page-sizes="[10, 20, 50]" :page-size="10" layout="total, prev, pager, next, sizes" :total="32" />
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="moreDetailDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getPointAdjustPageApi, getPointAdjustDetailApi, getCustPointDetailApi } from '@/api/test/point'

export default {
  name: 'PointsManagement',
  filters: {
    formatNumber(val) {
      if (val === null || val === undefined || isNaN(val)) return '0'
      return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    }
  },
  data() {
    return {
      currentView: 'list',
      hasSearchedCustomer: false,
      customerSearchKey: '',
      customerLoading: false,
      customerInfo: null,
      loading: false,
      detailLoading: false,

      // 证件类型字典映射 (规范 1.8)
      idTypeMap: {
        IDCARD: '身份证',
        PASSPORT: '护照',
        OTHER: '其他'
      },

      // 申请状态编码字典映射 (规范 1.5)
      statusMap: {
        PENDING: '待审核',
        APPROVED: '已通过',
        REJECTED: '已驳回'
      },

      // 4.2.2 分页查询表单
      dateRange: ['2026-08-01', '2026-08-23'],
      searchForm: {
        custId: '',
        custName: '',
        idType: '',
        idNo: '',
        adjustType: '',
        status: '',
        dateFrom: '2026-08-01',
        dateTo: '2026-08-23',
        pageNum: 1,
        pageSize: 10
      },
      total: 0,
      recordList: [],

      // 4.2.3 详情响应数据存储
      detailData: null,
      detailDialogVisible: false,

      // 积分明细测试数据
      detailFilter: {startDate: '', endDate: '', source: '', type: ''},
      pointsDetailList: [],

      moreDetailDialogVisible: false,
      moreDetailFilter: {startDate: '', endDate: '', source: '', type: ''},
      morePointsDetailList: [],

      // 新增与编辑表单
      adjustForm: {
        custId: 'CU202401001',
        custName: '张伟',
        adjustType: '加分',
        adjustAmt: '',
        validType: 'nat',
        validEndDate: '',
        reasonCode: 'ACT_SUPPLEMENT',
        reasonName: '活动积分补发',
        policyNo: '',
        oaNo: '',
        remark: '2026年暑期营销活动积分补发',
        attachment: ''
      },
      adjustRules: {
        adjustType: [{required: true, message: '请选择调整方向', trigger: 'change'}],
        adjustAmt: [{required: true, message: '请输入调整积分额度', trigger: 'blur'}],
        validType: [{required: true, message: '请选择有效期类型', trigger: 'change'}],
        validEndDate: [{required: true, message: '请选择有效期截止日', trigger: 'change'}],
        oaNo: [{required: true, message: '请输入OA流水号', trigger: 'blur'}],
        reasonCode: [{required: true, message: '请选择调整原因', trigger: 'change'}]
      },

      editDialogVisible: false,
      editRow: null,
      editForm: {
        id: '',
        custId: '',
        custName: '',
        adjustType: '减分',
        adjustAmt: '',
        validType: 'nat',
        validEndDate: '',
        policyNo: '',
        oaNo: '',
        reasonCode: '',
        reasonName: '',
        remark: '',
        attachment: ''
      }
    }
  },
  created() {
    this.fetchPageList()
  },
  methods: {
    async handleCustomerSearch() {
      const custId = String(this.customerSearchKey || '').trim()
      if (!custId) {
        this.$message.warning('请输入客户号')
        return
      }
      this.customerLoading = true
      try {
        const res = await getCustPointDetailApi(custId)
        const data = res?.data || res?.body?.data || {}
        const profile = data.profile || data.customer || data
        this.customerInfo = {
          custId: profile.custId || custId,
          custName: profile.custName || profile.name,
          idNo: profile.idNo || profile.idNumber,
          gradeName: profile.gradeName || profile.grade,
          orgName: profile.orgName || profile.serviceOrg,
          currentPoint: (data.pointSummary || {}).current_point != null
            ? data.pointSummary.current_point
            : (profile.currentPoint || 0)
        }
        this.pointsDetailList = (data.pointTraces || []).map(item => ({
          date: item.occurTime || item.changeTime || item.createTime,
          source: item.sourceName || item.source || '—',
          type: item.pointTypeName || item.pointType || '—',
          amount: `${item.direction === 'SUB' ? '-' : '+'} ${Math.abs(item.pointAmt || 0)}`,
          remark: item.remark || item.reasonName || '—'
        }))
        this.hasSearchedCustomer = true
      } catch (err) {
        this.customerInfo = null
        this.hasSearchedCustomer = false
        this.$message.error('客户查询失败，请检查客户号')
      } finally {
        this.customerLoading = false
      }
    },
    resetCustomerSearch() {
      this.customerSearchKey = ''
      this.customerInfo = null
      this.pointsDetailList = []
      this.hasSearchedCustomer = false
    },
    // 转换证件类型中文显示 (规范 1.8)
    formatIdType(code) {
      if (!code) return '—'
      return this.idTypeMap[code] || code
    },

    // 转换状态中文显示
    formatStatus(status) {
      if (!status) return '—'
      return this.statusMap[status] || status
    },

    formatAdjustType(type) {
      if (!type) return '—'
      return { ADD: '加分', SUB: '减分', '加分': '加分', '减分': '减分' }[type] || type
    },

    isAddAdjust(type) {
      return type === 'ADD' || type === '加分'
    },

    // 根据状态输出对应的 Element UI Tag 标签类型
    getStatusTagType(status) {
      switch (status) {
        case 'APPROVED':
        case '已通过':
          return 'success'
        case 'PENDING':
        case '待审核':
          return 'warning'
        case 'REJECTED':
        case '已驳回':
          return 'danger'
        default:
          return 'info'
      }
    },

    // 4.2.2 列表数据加载
    async fetchPageList() {
      this.loading = true
      try {
        const res = await getPointAdjustPageApi(this.searchForm)
        if (res && res.data ) {
          const data = res.data || {}
          this.recordList = data.list || []
          this.total = data.total || 0
        } else {
          console.log(res,"res")
          this.$message.error(res?.header?.message || '获取申请列表失败')
        }
      } catch (err) {
        console.error('【接口报错详情】:', err)
        console.error('【HTTP状态码】:', err.response?.status)
        console.error('【后端返回内容】:', err.response?.data)
        this.$message.error('获取申请列表失败')
      } finally {
        this.loading = false
      }
    },

    // 4.2.3 查看详情数据加载
    async openDetail(row) {
      this.detailDialogVisible = true
      this.detailLoading = true
      this.detailData = null

      // 兼容后端可能是 id 或 id/applyNo 字段入参
      const targetId = row.id || row.applyNo
      try {
        const res = await getPointAdjustDetailApi(targetId)
        if (res && res.data) {
          console.log(res,"res")
          this.detailData = res.data || {}
        } else {
          this.$message.error(res?.header?.message || '获取申请详情失败')
          // 容错处理：若网络/API异常则回退使用当前行表格数据
          this.detailData = {...row}
        }
      } catch (err) {
        console.error('获取详情发生异常:', err)
        this.detailData = {...row}
      } finally {
        this.detailLoading = false
      }
    },

    // 筛选日期处理
    handleDateChange(val) {
      if (val && val.length === 2) {
        this.searchForm.dateFrom = val[0]
        this.searchForm.dateTo = val[1]
      } else {
        this.searchForm.dateFrom = ''
        this.searchForm.dateTo = ''
      }
    },

    // 触发查询与重置
    handleQuery() {
      this.searchForm.pageNum = 1
      this.fetchPageList()
    },
    resetQuery() {
      this.dateRange = []
      this.searchForm = {
        custId: '',
        custName: '',
        idType: '',
        idNo: '',
        adjustType: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        pageNum: 1,
        pageSize: 10
      }
      this.handleQuery()
    },

    // 分页切换
    handleSizeChange(val) {
      this.searchForm.pageSize = val
      this.fetchPageList()
    },
    handleCurrentChange(val) {
      this.searchForm.pageNum = val
      this.fetchPageList()
    },

    // 表单其他交互方法
    handleReasonChange(val) {
      const reasonMap = {
        'ACT_SUPPLEMENT': '活动积分补发',
        'SYS_FIX': '系统故障补算',
        'COMPLAINT': '客户投诉处理',
        'HISTORY_CORRECTION': '历史积分修正'
      }
      this.adjustForm.reasonName = reasonMap[val] || ''
    },
    handleEditReasonChange(val) {
      const reasonMap = {
        'ACT_SUPPLEMENT': '活动积分补发',
        'SYS_FIX': '系统故障补算',
        'COMPLAINT': '客户投诉处理',
        'HISTORY_CORRECTION': '历史积分修正'
      }
      this.editForm.reasonName = reasonMap[val] || ''
    },
    handleWorkspaceFileChange(e) {
      const file = e.target.files[0]
      if (file) this.adjustForm.attachment = file.name
    },
    handleEditFileChange(e) {
      const file = e.target.files[0]
      if (file) this.editForm.attachment = file.name
    },
    openEdit(row) {
      this.editRow = row
      this.editForm = {
        id: row.id || '',
        custId: row.custId,
        custName: row.custName,
        adjustType: row.adjustType,
        adjustAmt: row.adjustAmt,
        validType: row.validType || 'nat',
        validEndDate: row.validEndDate || '',
        policyNo: row.policyNo,
        oaNo: row.oaNo,
        reasonCode: row.reasonCode || 'COMPLAINT',
        reasonName: row.reasonName,
        remark: row.remark || '',
        attachment: row.attachment || ''
      }
      this.editDialogVisible = true
    },
    handleDelete(row) {
      this.$confirm(`确认删除客户【${row.custName}】的此条调整申请记录？`, '提示', {
        type: 'warning'
      }).then(() => {
        this.$message.success('删除成功')
      }).catch(() => {
      })
    },
    submitAdjust() {
      this.$refs.adjustForm.validate((valid) => {
        if (valid) {
          this.$confirm(`确认提交调整申请？`, '二次确认', {
            type: 'info'
          }).then(() => {
            this.$message.success('提交成功！')
            this.currentView = 'list'
            this.fetchPageList()
          })
        }
      })
    },
    resetAdjust() {
      this.$refs.adjustForm.resetFields()
      this.adjustForm.attachment = ''
    },
    saveEdit() {
      this.$message.success('修改成功并已重新提交！')
      this.editDialogVisible = false
      this.fetchPageList()
    }
  }
}
</script>

<style scoped>
.points-management-app {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 16px;
}

.page-container {
  max-width: 1280px;
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

.custom-filter-form .el-form-item {
  margin-bottom: 12px !important;
  margin-right: 16px !important;
}

.aligned-form .el-form-item {
  margin-bottom: 20px !important;
}

.aligned-form .form-action-item {
  margin-bottom: 8px !important;
  margin-top: 24px;
}

.form-inline-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #909399;
  font-size: 13px;
}

.customer-info-row .el-col {
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.points-badge {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.form-tip, .tip-text {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.upload-custom-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 32px;
}

.upload-custom-container .file-name {
  font-size: 13px;
  color: #409eff;
  background-color: #ecf5ff;
  padding: 4px 10px;
  border-radius: 4px;
}

.upload-custom-container .upload-tip {
  font-size: 12px;
  color: #909399;
}

.table-sub-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.dialog-section {
  margin-bottom: 18px;
}

.section-title {
  position: relative;
  padding-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background-color: #409eff;
  border-radius: 2px;
}

.preview-box {
  background-color: #f4f4f5;
  padding: 12px 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.sub-label {
  font-size: 12px;
  color: #909399;
}

.preview-box .val {
  font-size: 16px;
  font-weight: bold;
  margin-top: 4px;
}

.preview-box .arrow {
  font-size: 18px;
  color: #409eff;
}

.desc-box {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}
</style>
