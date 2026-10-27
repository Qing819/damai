<template>
  <div class="points-management-app">
    <div v-if="currentView === 'list'" class="page-heading">
      <h1>积分调整申请</h1>
      <p>按客户、申请状态和调整类型筛选人工积分调整申请，支持查看、修改和删除被驳回申请</p>
    </div>
    <!-- View 1: 积分调整申请列表页 -->
    <div v-if="currentView === 'list'" class="page-container">
      <!-- 搜索筛选栏 -->
      <el-card class="filter-card" shadow="never">
        <el-form :inline="true" :model="searchForm" size="small" class="custom-filter-form prototype-filter-form">
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
          <el-form-item label="服务归属机构">
            <el-select v-model="searchForm.orgName" placeholder="全部服务归属机构" clearable style="width: 170px">
              <el-option label="总公司" value="总公司" />
              <el-option label="北京分公司" value="北京分公司" />
              <el-option label="天津分公司" value="天津分公司" />
              <el-option label="河北分公司" value="河北分公司" />
              <el-option label="山西分公司" value="山西分公司" />
              <el-option label="辽宁分公司" value="辽宁分公司" />
              <el-option label="大连分公司" value="大连分公司" />
              <el-option label="江苏分公司" value="江苏分公司" />
              <el-option label="上海分公司" value="上海分公司" />
            </el-select>
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
              <el-option label="加分" value="ADD" />
              <el-option label="减分" value="SUB" />
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
            <el-button class="btn-search" type="primary" @click="handleQuery">查询</el-button>
            <el-button class="btn-reset" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 新增按钮 -->
      <div class="list-add-action" style="margin: 16px 0;">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="currentView = 'workspace'">
          新增积分调整
        </el-button>
      </div>

      <!-- 我的申请记录表格 (对应 4.2.2 接口) -->
      <el-card shadow="never" class="table-card">
        <div slot="header" class="card-header">
          <span class="header-title">我的申请记录</span>
        </div>

        <el-table v-loading="loading" :data="recordList" border stripe style="width: 100%" size="mini">
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
          <el-table-column prop="orgName" label="服务归属机构" width="120" show-overflow-tooltip />
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
            <span class="workspace-section-title">客户查询区</span>
        </div>
        <el-form :inline="true" size="small" class="workspace-search-form">
          <el-form-item label="客户号 / 姓名 / 证件号">
            <el-input v-model.trim="customerSearchKey" placeholder="" clearable style="width: 280px" @input="handleCustomerInput" @keyup.enter.native="handleCustomerKeyword" />
          </el-form-item>
          <el-form-item>
            <el-button @click="resetCustomerSearch">清空</el-button>
          </el-form-item>
          <span class="tip-text">边输边查，下拉中选中客户后点击「确认」带入</span>
        </el-form>
        <div v-if="customerCandidates.length" class="customer-search-results">
          <div class="customer-results-header">
            <span>姓名</span>
            <span>客户号</span>
            <span>证件类型</span>
            <span>证件号</span>
          </div>
          <div
              v-for="customer in customerCandidates"
              :key="customer.custId"
              :class="['customer-result-row', { selected: selectedCustomerId === customer.custId }]"
              @click="selectCustomerResult(customer)"
          >
            <span>{{ customer.custName || '—' }}</span>
            <span>{{ customer.custId || '—' }}</span>
            <span>{{ formatIdType(customer.idType) }}</span>
            <span>{{ customer.idNo || '—' }}</span>
          </div>
          <div class="customer-results-footer">
            <span v-if="selectedCustomerId" class="customer-selected-result">已选择：{{ selectedCustomerName }}（{{ selectedCustomerId }}）</span>
            <span v-else>请选择一位客户，选中后点击「确认」带入</span>
            <el-button type="primary" size="small" :disabled="!selectedCustomerId" @click="handleCustomerConfirm">确认</el-button>
          </div>
        </div>
        <div v-if="hasSearchedCustomer && customerInfo" class="customer-confirm-tip">
          已查询到客户：{{ customerInfo.custName || '—' }}（{{ customerInfo.custId || '—' }}）
        </div>
      </el-card>

      <!-- 客户信息（查询后展示） -->
      <el-card v-if="hasSearchedCustomer && customerInfo" shadow="never" class="section-card">
        <div slot="header" class="card-header">
            <span class="workspace-section-title">客户信息</span>
        </div>
        <el-row :gutter="20" class="customer-info-row">
          <el-col :span="6">客户号：<strong>{{ customerInfo.custId }}</strong></el-col>
          <el-col :span="5">客户姓名：<strong>{{ customerInfo.custName || '—' }}</strong></el-col>
          <el-col :span="7">证件号：<strong>{{ customerInfo.idNo || '—' }}</strong></el-col>
          <el-col :span="6">客户等级：<el-tag size="mini" type="warning">{{ formatGrade(customerInfo.gradeName) }}</el-tag></el-col>
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
              <span class="workspace-section-title">积分明细</span>
            </div>

            <el-form :inline="true" size="mini" class="mini-form workspace-detail-form">
              <el-form-item label="发生时间">
                <el-date-picker v-model="detailFilter.startDate" type="date" value-format="yyyy-MM-dd" placeholder="开始日期" style="width: 110px" />
                ~
                <el-date-picker v-model="detailFilter.endDate" type="date" value-format="yyyy-MM-dd" placeholder="结束日期" style="width: 110px" />
              </el-form-item>
              <el-form-item label="操作类型">
                <el-select v-model="detailFilter.operationType" placeholder="全部操作类型" style="width: 110px">
                  <el-option label="全部操作类型" value="" />
                </el-select>
              </el-form-item>
              <el-form-item label="积分类型">
                <el-select v-model="detailFilter.pointType" placeholder="全部积分类型" style="width: 110px">
                  <el-option label="全部积分类型" value="" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" @click="loadCustomerPoints">查询</el-button>
              </el-form-item>
            </el-form>

            <el-table :data="pointsDetailList" border size="mini" style="width: 100%">
              <el-table-column prop="date" label="时间" width="90" />
              <el-table-column prop="operationType" label="操作类型" width="100" />
              <el-table-column prop="pointType" label="积分类型" width="90">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="scope.row.operationType === '人工调整' ? 'warning' : 'primary'">{{ scope.row.pointType }}</el-tag>
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
              <span>共 {{ pointsDetailList.length }} 条积分流水</span>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：积分调整操作区 -->
        <el-col :span="13">
          <el-card shadow="never">
            <div slot="header" class="card-header">
              <span class="workspace-section-title">积分调整操作区</span>
            </div>

            <el-form
                ref="adjustForm"
                :model="adjustForm"
                :rules="adjustRules"
                label-width="120px"
                label-position="right"
                size="small"
                class="aligned-form workspace-adjust-form"
            >
              <el-form-item label="调整方向" prop="adjustType" required>
                <el-radio-group v-model="adjustForm.adjustType">
                  <el-radio label="ADD">加分</el-radio>
                  <el-radio label="SUB">减分</el-radio>
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
                    <el-option label="指定截止日期" value="custom" />
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
                  <el-option label="活动积分补发" value="REASON01" />
                  <el-option label="系统故障补发" value="REASON02" />
                  <el-option label="权益派发错误" value="REASON03" />
                  <el-option label="客户投诉补偿" value="REASON04" />
                  <el-option label="历史权益修正" value="REASON05" />
                  <el-option label="其他" value="REASON06" />
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
    <el-dialog class="application-detail-dialog" title="申请详情" :visible.sync="detailDialogVisible" width="660px" v-loading="detailLoading">
      <div v-if="detailData">
        <div class="dialog-section">
          <div class="section-title">申请内容</div>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="申请单号">{{ detailData.applyNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ detailData.custName || '—' }}（{{ detailData.custId || '—' }}）</el-descriptions-item>
            <el-descriptions-item label="证件类型">{{ formatIdType(detailData.idType) }}</el-descriptions-item>
            <el-descriptions-item label="证件号码">{{ detailData.idNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="服务归属机构">{{ detailData.orgName || detailData.org_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="调整类型">
              <span>{{ formatAdjustType(detailData.adjustType) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="调整积分额度">
              <strong>
                {{ isAddAdjust(detailData.adjustType) ? '+' : '-' }}{{ detailData.adjustAmt | formatNumber }}
              </strong>
            </el-descriptions-item>
            <el-descriptions-item label="调整原因">{{ detailData.reasonName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="关联保单号">{{ detailData.policyNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="OA流水号">{{ detailData.oaNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ detailData.applyTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ detailData.applicant || '—' }}</el-descriptions-item>
            <el-descriptions-item label="积分有效期">{{ formatValidType(detailData.validType || detailData.valid_type) }}</el-descriptions-item>
            <el-descriptions-item v-if="(detailData.validType || detailData.valid_type) === 'custom'" label="有效期截止日">{{ detailData.validEndDate || detailData.valid_end_date || '—' }}</el-descriptions-item>
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
          <el-link
              v-if="detailData.attachment"
              type="primary"
              @click="downloadAttachment(detailData)"
          >{{ detailData.attachmentName || detailData.attachment }}</el-link>
          <span v-else class="text-muted">无附件</span>
        </div>

        <div class="dialog-section">
          <div class="section-title">审批信息</div>
          <el-descriptions v-if="detailData.status && detailData.status !== 'PENDING' && detailData.status !== '待审核'" :column="2" size="small" border>
            <!-- 详情中的状态展示适配转换 -->
            <el-descriptions-item label="审批结果">
              <span :class="['status-text', 'status-' + String(detailData.status).toLowerCase()]">
                {{ formatStatus(detailData.status) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="审批人">{{ detailData.auditor || detailData.approver || '—' }}</el-descriptions-item>
            <el-descriptions-item label="审批时间">{{ detailData.auditTime || detailData.approveTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2">{{ detailData.auditOpinion || detailData.opinion || '—' }}</el-descriptions-item>
          </el-descriptions>
          <p v-else class="text-muted">该申请尚未完成审批，暂无审批结果。</p>
        </div>
      </div>
      <div slot="footer" class="application-detail-footer">
        <el-button size="small" @click="detailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- Dialog 2: 修改申请弹窗 -->
    <el-dialog class="edit-application-dialog" title="修改申请" :visible.sync="editDialogVisible" width="620px">
      <div v-if="editRow">
        <el-alert
            title="客户信息不可修改，仅可调整积分申请内容"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px;"
        >
          <div>
            申请单号：<strong>{{ editRow.applyNo || '—' }}</strong>
            &nbsp;&nbsp;&nbsp;&nbsp; 客户：<strong>{{ editRow.custName }}（{{ editRow.custId }}）</strong>
            &nbsp;&nbsp;&nbsp;&nbsp; 服务归属机构：<strong>{{ editRow.orgName || editRow.org_name || '—' }}</strong>
          </div>
        </el-alert>

        <el-form :model="editForm" label-width="120px" label-position="right" size="small" class="aligned-form">
          <div class="section-title" style="margin-bottom: 16px;">调整内容</div>

          <el-form-item label="调整方向" required>
            <el-radio-group v-model="editForm.adjustType">
              <el-radio label="ADD">加分</el-radio>
              <el-radio label="SUB">减分</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="调整积分额度" required>
            <el-input v-model="editForm.adjustAmt" style="width: 220px" />
          </el-form-item>

          <el-form-item label="积分有效期" required>
            <el-select v-model="editForm.validType" style="width: 220px">
              <el-option label="自然年（至当年12月31日）" value="nat" />
                    <el-option label="指定截止日期" value="custom" />
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
              <el-option label="活动积分补发" value="REASON01" />
              <el-option label="系统故障补算" value="REASON02" />
              <el-option label="权益派发错误" value="REASON03" />
              <el-option label="客户投诉处理" value="REASON04" />
              <el-option label="历史权益修正" value="REASON05" />
              <el-option label="其他" value="REASON06" />
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
import {
  getPointAdjustPageApi,
  getPointAdjustDetailApi,
  getCustCurrentPointApi,
  searchCustomerProfileApi,
  getPointDetailV2Api,
  uploadAttachmentApi,
  downloadAttachmentApi,
  submitPointAdjustApi,
  modifyPointAdjustApi,
  deletePointAdjustApi
} from '@/api/test/point'

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
      selectedCustomerId: '',
      selectedCustomerName: '',
      customerCandidates: [],
      customerSearchTimer: null,
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
      dateRange: [],
      searchForm: {
        custId: '',
        custName: '',
        idType: '',
        idNo: '',
        orgName: '',
        adjustType: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        pageNum: 1,
        pageSize: 10
      },
      total: 0,
      recordList: [],

      // 4.2.3 详情响应数据存储
      detailData: null,
      detailDialogVisible: false,

      // 积分明细测试数据
      detailFilter: { startDate: '', endDate: '', operationType: '', pointType: '' },
      pointsDetailList: [],

      moreDetailDialogVisible: false,
      moreDetailFilter: { startDate: '', endDate: '', source: '', type: '' },
      morePointsDetailList: [],

      // 新增与编辑表单
      adjustForm: {
        custId: 'CU202401001',
        custName: '张伟',
        idType: '',
        idNo: '',
        orgName: '',
        adjustType: 'ADD',
        adjustAmt: '',
        validType: 'nat',
        validEndDate: '',
        reasonCode: 'REASON01',
        reasonName: '活动积分补发',
        policyNo: '',
        oaNo: '',
        remark: '2026年暑期营销活动积分补发',
        attachment: ''
      },
      adjustRules: {
        adjustType: [{ required: true, message: '请选择调整方向', trigger: 'change' }],
        adjustAmt: [{ required: true, message: '请输入调整积分额度', trigger: 'blur' }],
        validType: [{ required: true, message: '请选择有效期类型', trigger: 'change' }],
        validEndDate: [{ required: true, message: '请选择有效期截止日', trigger: 'change' }],
        oaNo: [{ required: true, message: '请输入OA流水号', trigger: 'blur' }],
        reasonCode: [{ required: true, message: '请选择调整原因', trigger: 'change' }]
      },

      editDialogVisible: false,
      editRow: null,
      editForm: {
        id: '',
        custId: '',
        custName: '',
        idType: '',
        idNo: '',
        adjustType: 'SUB',
        adjustAmt: '',
        validType: 'nat',
        validEndDate: '',
        policyNo: '',
        oaNo: '',
        reasonCode: 'REASON06',
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
        const searchRes = await searchCustomerProfileApi(custId)
        const candidates = searchRes?.data || searchRes?.body?.data || []
        const normalizedCandidates = (Array.isArray(candidates) ? candidates : []).map(item => ({
          ...item,
          custId: item.custId || item.cust_id,
          custName: item.custName || item.cust_name,
          idType: item.idType || item.id_type,
          idNo: item.idNo || item.id_no,
          orgName: item.orgName || item.org_name
        }))
        const profile = normalizedCandidates
          .find(item => String(item.custId) === custId) || normalizedCandidates[0]
        if (!profile) throw new Error('customer-not-found')

        const currentRes = await getCustCurrentPointApi(profile.custId)
        const current = currentRes?.data || currentRes?.body?.data || {}
        this.customerInfo = {
          custId: profile.custId,
          custName: profile.custName,
          idType: profile.idType,
          idNo: profile.idNo,
          gradeName: current.currentGrade || profile.currentGrade,
          orgName: current.orgName || profile.orgName,
          currentPoint: current.currentPoint || 0
        }
        this.adjustForm.custId = profile.custId
        this.adjustForm.custName = profile.custName
        this.adjustForm.idType = profile.idType
        this.adjustForm.idNo = profile.idNo
        this.adjustForm.orgName = current.orgName || profile.orgName || ''
        await this.loadCustomerPoints()
        this.hasSearchedCustomer = true
      } catch (err) {
        this.customerInfo = null
        this.hasSearchedCustomer = false
        this.$message.error('客户查询失败，请检查客户号')
      } finally {
        this.customerLoading = false
      }
    },
    handleCustomerInput(value) {
      this.selectedCustomerId = ''
      this.selectedCustomerName = ''
      this.customerCandidates = []
      this.customerInfo = null
      this.pointsDetailList = []
      this.hasSearchedCustomer = false
      clearTimeout(this.customerSearchTimer)
      if (!String(value || '').trim()) return
      this.customerSearchTimer = setTimeout(() => {
        this.handleCustomerKeyword()
      }, 300)
    },
    async handleCustomerKeyword() {
      const value = String(this.customerSearchKey || '').trim()
      this.selectedCustomerId = ''
      if (!value) {
        this.customerCandidates = []
        this.$message.warning('请输入客户号、姓名或证件号')
        return
      }
      this.customerLoading = true
      try {
        const res = await searchCustomerProfileApi(value)
        const candidates = res?.data || res?.body?.data || []
        this.customerCandidates = (Array.isArray(candidates) ? candidates : []).map(item => ({
          ...item,
          custId: item.custId || item.cust_id,
          custName: item.custName || item.cust_name,
          idNo: item.idNo || item.id_no,
          currentGrade: item.currentGrade || item.current_grade,
          gradeName: item.gradeName || item.grade_name,
          orgName: item.orgName || item.org_name
        }))
        if (!this.customerCandidates.length) this.$message.info('未检索到客户')
      } catch (err) {
        this.customerCandidates = []
      } finally {
        this.customerLoading = false
      }
    },
    async handleCustomerConfirm() {
      if (!this.selectedCustomerId) {
        this.$message.warning('请先选择客户')
        return
      }
      const selectedId = this.selectedCustomerId
      const selectedName = this.selectedCustomerName
      this.customerSearchKey = selectedId
      await this.handleCustomerSearch()
      if (this.hasSearchedCustomer) {
        this.customerSearchKey = `${selectedName}（${selectedId}）`
        this.selectedCustomerId = ''
        this.selectedCustomerName = ''
        this.customerCandidates = []
      }
    },
    selectCustomerResult(customer) {
      this.selectedCustomerId = customer.custId
      this.selectedCustomerName = customer.custName || '—'
    },
    resetCustomerSearch() {
      clearTimeout(this.customerSearchTimer)
      this.customerSearchKey = ''
      this.selectedCustomerId = ''
      this.selectedCustomerName = ''
      this.customerCandidates = []
      this.customerInfo = null
      this.pointsDetailList = []
      this.hasSearchedCustomer = false
    },
    async loadCustomerPoints() {
      if (!this.customerInfo || !this.customerInfo.custId) return
      try {
        const params = {
          pageNum: 1,
          pageSize: 20,
          startDate: this.detailFilter.startDate,
          endDate: this.detailFilter.endDate
        }
        const res = await getPointDetailV2Api(this.customerInfo.custId, params)
        const data = res?.data || res?.body?.data || {}
        this.pointsDetailList = (data.list || []).map(item => ({
          date: item.calc_date || item.calcDate || item.pt,
          operationType: item.operation_type || item.operationType || item.source || '—',
          pointType: item.point_type || item.pointType || item.type || '—',
          amount: `${Number(item.point || 0) >= 0 ? '+' : '-'} ${Math.abs(Number(item.point || 0))}`,
          remark: item.comment || item.remark || '—'
        }))
      } catch (err) {
        this.$message.error('获取客户积分明细失败')
      }
    },
    // 转换证件类型中文显示 (规范 1.8)
    formatIdType(code) {
      if (!code) return '—'
      return this.idTypeMap[code] || code
    },

    formatGrade(grade) {
      if (!grade) return '—'
      const gradeMap = {
        PUXING: '普星',
        SANXING: '三星',
        SIXING: '四星',
        WUXING: '五星',
        ZHUOYUE: '卓越',
        ZUNYAO: '尊耀',
        '普星级客户': '普星级客户',
        '三星级客户': '三星级客户',
        '四星级客户': '四星级客户',
        '五星级客户': '五星级客户',
        '卓越客户': '卓越客户'
      }
      return gradeMap[grade] || grade
    },

    // 转换状态中文显示
    formatStatus(status) {
      if (!status) return '—'
      return this.statusMap[status] || status
    },

    formatAdjustType(type) {
      if (!type) return '—'
      return { ADD: '加分', SUB: '减分', 加分: '加分', 减分: '减分' }[type] || type
    },

    formatValidType(type) {
      if (!type) return '—'
      return {
        nat: '自然年（至当年12月31日）',
        NAT: '自然年（至当年12月31日）',
        custom: '指定截止日期',
        CUSTOM: '指定截止日期'
      }[type] || type
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
        // 空筛选项不传给后端，避免部分实现将空字符串转换为无效查询条件。
        const params = Object.keys(this.searchForm).reduce((result, key) => {
          const value = this.searchForm[key]
          if (value !== '' && value !== null && value !== undefined) result[key] = value
          return result
        }, {})
        const res = await getPointAdjustPageApi(params)
        if (res && res.data) {
          const data = res.data || {}
          this.recordList = (data.list || data.records || []).map(this.normalizeAdjustRecord)
          this.total = data.total || 0
        } else {
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

    normalizeAdjustRecord(row) {
      const item = row || {}
      return {
        ...item,
        id: item.id || item.applyId,
        applyNo: item.applyNo || item.apply_no,
        custId: item.custId || item.cust_id,
        custName: item.custName || item.cust_name,
        idType: item.idType || item.id_type,
        idNo: item.idNo || item.id_no,
        orgName: item.orgName || item.org_name,
        adjustType: item.adjustType || item.adjust_type,
        adjustAmt: item.adjustAmt ?? item.adjust_amt,
        reasonCode: item.reasonCode || item.reason_code,
        reasonName: item.reasonName || item.reason_name,
        policyNo: item.policyNo || item.policy_no,
        oaNo: item.oaNo || item.oa_no,
        validType: item.validType || item.valid_type,
        validEndDate: item.validEndDate || item.valid_end_date,
        applyTime: item.applyTime || item.apply_time,
        applicant: item.applicant || item.apply_user || item.applyUser,
        status: item.status || item.audit_status
      }
    },

    buildAdjustPayload(form, includeId) {
      const payload = {
        custId: form.custId,
        custName: form.custName,
        idType: form.idType,
        idNo: form.idNo,
        adjustType: form.adjustType,
        adjustAmt: form.adjustAmt,
        validType: form.validType,
        validEndDate: form.validType === 'custom' ? form.validEndDate : undefined,
        reasonCode: form.reasonCode,
        policyNo: form.policyNo,
        oaNo: form.oaNo,
        remark: form.remark,
        attachment: form.attachment
      }
      if (includeId) payload.id = form.id
      return Object.keys(payload).reduce((result, key) => {
        if (payload[key] !== '' && payload[key] !== null && payload[key] !== undefined) result[key] = payload[key]
        return result
      }, {})
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
          this.detailData = res.data || {}
        } else {
          this.$message.error(res?.header?.message || '获取申请详情失败')
          // 容错处理：若网络/API异常则回退使用当前行表格数据
          this.detailData = { ...row }
        }
      } catch (err) {
        console.error('获取详情发生异常:', err)
        this.detailData = { ...row }
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
        orgName: '',
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
        REASON01: '活动积分补发',
        REASON02: '系统故障补发',
        REASON03: '权益派发错误',
        REASON04: '客户投诉补偿',
        REASON05: '历史权益修正',
        REASON06: '其他'
      }
      this.adjustForm.reasonName = reasonMap[val] || ''
    },
    handleEditReasonChange(val) {
      const reasonMap = {
        REASON01: '活动积分补发',
        REASON02: '系统故障补发',
        REASON03: '权益派发错误',
        REASON04: '客户投诉补偿',
        REASON05: '历史权益修正',
        REASON06: '其他'
      }
      this.editForm.reasonName = reasonMap[val] || ''
    },
    async handleWorkspaceFileChange(e) {
      const file = e.target.files[0]
      if (!file) return
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await uploadAttachmentApi(formData)
        const data = res?.data || res?.body?.data || {}
        this.adjustForm.attachment = data.fileName || data.filePath || data.name || file.name
        this.$message.success('附件上传成功')
      } catch (err) {
        this.adjustForm.attachment = ''
        this.$message.error('附件上传失败，请重试')
      }
    },
    async handleEditFileChange(e) {
      const file = e.target.files[0]
      if (!file) return
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await uploadAttachmentApi(formData)
        const data = res?.data || res?.body?.data || {}
        this.editForm.attachment = data.fileName || data.filePath || data.name || file.name
        this.$message.success('附件上传成功')
      } catch (err) {
        this.editForm.attachment = ''
        this.$message.error('附件上传失败，请重试')
      }
    },
    async downloadAttachment(detail) {
      const filePath = detail.attachmentPath || detail.filePath || detail.attachment
      const fileName = detail.attachmentName || detail.fileName || detail.attachment
      if (!filePath || !fileName) {
        this.$message.warning('附件信息不完整，无法下载')
        return
      }
      try {
        const response = await downloadAttachmentApi({ filePath, fileName })
        const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/octet-stream' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        this.$message.error('附件下载失败')
      }
    },
    openEdit(row) {
      this.editRow = row
      this.editForm = {
        id: row.id || '',
        custId: row.custId,
        custName: row.custName,
        idType: row.idType || '',
        idNo: row.idNo || '',
        adjustType: row.adjustType,
        adjustAmt: row.adjustAmt,
        validType: row.validType || 'nat',
        validEndDate: row.validEndDate || '',
        policyNo: row.policyNo,
        oaNo: row.oaNo,
        reasonCode: row.reasonCode || 'REASON06',
        reasonName: row.reasonName,
        remark: row.remark || '',
        attachment: row.attachment || ''
      }
      this.editDialogVisible = true
    },
    handleDelete(row) {
      this.$confirm(`确认删除客户【${row.custName}】的此条调整申请记录？`, '提示', {
        type: 'warning'
      }).then(async() => {
        try {
          await deletePointAdjustApi(row.id || row.applyNo)
          this.$message.success('删除成功')
          this.fetchPageList()
        } catch (err) {
          this.$message.error('删除失败')
        }
      }).catch(() => null)
    },
    submitAdjust() {
      this.$refs.adjustForm.validate(valid => {
        if (valid) {
          this.$confirm('确认提交调整申请？', '二次确认', {
            type: 'info'
          }).then(async() => {
            try {
              await submitPointAdjustApi(this.buildAdjustPayload(this.adjustForm, false))
              this.$message.success('提交成功！')
              this.currentView = 'list'
              this.fetchPageList()
            } catch (err) {
              this.$message.error('提交失败')
            }
          })
        }
      })
    },
    resetAdjust() {
      this.$refs.adjustForm.resetFields()
      this.adjustForm.attachment = ''
    },
    async saveEdit() {
      try {
        await modifyPointAdjustApi(this.buildAdjustPayload(this.editForm, true))
        this.$message.success('修改成功并已重新提交！')
        this.editDialogVisible = false
        this.fetchPageList()
      } catch (err) {
        this.$message.error('修改失败')
      }
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
  width: 100%;
}

.page-heading {
  margin: 2px 0 16px;
}

.page-heading h1 {
  margin: 0 0 8px;
  color: #333a45;
  font-size: 21px;
  line-height: 1.3;
  font-weight: 700;
}

.page-heading p {
  margin: 0;
  color: #5a6472;
  font-size: 13px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header .title {
  font-size: 21px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #303133;
}

.page-header .subtitle {
  font-size: 13px;
  color: #5a6472;
}

.filter-card, .table-card, .section-card {
  margin-bottom: 16px;
}

.filter-card,
.table-card,
.section-card,
.page-container /deep/ .el-card {
  border: 1px solid #e1e5ec;
  border-radius: 4px;
  background: #fff;
}

.table-card /deep/ .el-card__header,
.section-card /deep/ .el-card__header {
  padding: 14px 18px;
  border-bottom: 1px solid #ebeef5;
}

.table-card /deep/ .el-card__body,
.section-card /deep/ .el-card__body {
  padding: 16px 18px;
}

.filter-card /deep/ .el-card__body {
  padding: 16px 18px 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-card .card-header {
  justify-content: flex-start;
}

/* 与客户积分管理的 mini 表格保持同样的行高 */
.table-card /deep/ .el-table--mini .el-table__cell {
  padding: 6px 0;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #333a45;
}

.workspace-section-title {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding-left: 0;
  border-left: 0;
  color: #303a4a;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
}

.workspace-search-form /deep/ .el-form-item__label {
  color: #5b6678;
  font-size: 14px;
  line-height: 38px;
  font-weight: 400;
}

.workspace-search-form /deep/ .el-form-item {
  margin-bottom: 0;
  vertical-align: middle;
}

.workspace-search-form /deep/ .el-form-item__content {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.workspace-search-form .tip-text {
  line-height: 38px;
  vertical-align: middle;
}

.workspace-search-form /deep/ .el-input__inner,
.workspace-search-form /deep/ .el-button {
  height: 38px;
  line-height: normal;
  font-size: 14px;
}

.workspace-search-form /deep/ .el-button {
  height: 36px;
  line-height: normal;
  width: 62px;
  padding: 0 16px;
  color: #4472c4 !important;
  border-color: #4472c4 !important;
  background: #fff !important;
}

.workspace-search-form /deep/ .el-input__inner {
  width: 280px;
  padding: 8px 10px;
  border-color: #c9cfd8;
  border-radius: 4px;
}

.page-container > div[style*="margin"] {
  margin: 0 0 16px !important;
}

.page-container > div[style*="margin"] /deep/ .el-button {
  height: 40px;
  line-height: 38px;
  padding: 0 17px;
  border-radius: 3px;
  background-color: #4f6fae;
  border-color: #4f6fae;
}

.list-add-action /deep/ .el-button {
  height: 36px;
  line-height: normal;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 14px;
  background: #4472c4;
  border-color: #4472c4;
}

.custom-filter-form .el-form-item {
  margin-bottom: 12px !important;
  margin-right: 16px !important;
}

.custom-filter-form /deep/ .el-form-item__label {
  display: none;
}

.custom-filter-form /deep/ .el-form-item__content {
  margin-left: 0 !important;
}

/* 与原型筛选栏统一控件高度和按钮色阶 */
.custom-filter-form /deep/ .el-input__inner,
.custom-filter-form /deep/ .el-select .el-input__inner,
.custom-filter-form /deep/ .el-date-editor.el-input__inner {
  height: 40px;
  line-height: 40px;
  border-radius: 3px;
  border-color: #cfd5df;
}

.custom-filter-form /deep/ .el-button {
  height: 40px;
  line-height: 38px;
  padding: 0 17px;
  font-size: 13px;
  border-radius: 3px;
}

.prototype-filter-form /deep/ .el-input__inner,
.prototype-filter-form /deep/ .el-date-editor.el-input__inner {
  height: 40px;
  line-height: normal;
  border-color: #c9cfd8;
  border-radius: 4px;
  font-size: 14px;
}

.prototype-filter-form /deep/ .el-button {
  width: 62px;
  height: 36px;
  line-height: normal;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 14px;
}

.prototype-filter-form /deep/ .el-button--primary {
  background: #4472c4 !important;
  border-color: #4472c4 !important;
}

.prototype-filter-form /deep/ .btn-search {
  background: #4472c4 !important;
  border-color: #4472c4 !important;
}

.prototype-filter-form /deep/ .btn-reset {
  color: #4472c4;
  background: #fff !important;
  border-color: #4472c4 !important;
}

.custom-filter-form /deep/ .el-button--primary,
.form-action-item /deep/ .el-button--primary {
  background-color: #4f6fae;
  border-color: #4f6fae;
}

.custom-filter-form /deep/ .el-button:not(.el-button--primary),
.form-action-item /deep/ .el-button:not(.el-button--primary) {
  color: #606266;
  border-color: #dcdfe6;
  background-color: #fff;
}

.custom-filter-form .el-form-item:last-child {
  margin-left: 8px;
}

.btn-search {
  background-color: #4f6fae !important;
  border-color: #4f6fae !important;
}

.btn-reset {
  background-color: #f2f5fb !important;
  color: #526b9f !important;
  border-color: #aebfdf !important;
}

.aligned-form .el-form-item {
  margin-bottom: 20px !important;
}

.workspace-detail-form /deep/ .el-form-item__label,
.workspace-adjust-form /deep/ .el-form-item__label {
  color: #5b6678;
  font-size: 13px;
}

.workspace-detail-form /deep/ .el-input__inner,
.workspace-detail-form /deep/ .el-button,
.workspace-adjust-form /deep/ .el-input__inner,
.workspace-adjust-form /deep/ .el-button,
.workspace-adjust-form /deep/ .el-radio__label {
  font-size: 14px;
}

.workspace-adjust-form /deep/ .el-input__inner,
.workspace-adjust-form /deep/ .el-select .el-input__inner,
.workspace-adjust-form /deep/ .el-date-editor.el-input__inner {
  height: 42px;
  line-height: 42px;
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
  line-height: 20px;
  color: #5b6678;
}

.customer-info-row .el-col strong {
  color: #5b6678;
  font-size: 15px;
  font-weight: 400;
}

.points-badge {
  font-size: 20px;
  line-height: 24px;
  font-weight: bold;
  color: #4f6fae;
}

.form-tip, .tip-text {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.customer-search-results {
  width: 560px;
  max-width: 100%;
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
  border: 1px solid #dcdfe6;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.customer-results-header,
.customer-result-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1.2fr 1.6fr;
  align-items: center;
  min-height: 38px;
  padding: 0 12px;
  column-gap: 16px;
  font-size: 14px;
}

.customer-results-header {
  color: #98a3b3;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.customer-result-row {
  color: #606266;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
}

.customer-result-row:hover,
.customer-result-row.selected {
  color: #2f5496;
  background: #f5f8fc;
}

.customer-selected-result {
  color: #2f5496;
  font-size: 14px;
  font-weight: bold;
}

.customer-confirm-tip {
  margin-top: 12px;
  color: #2f5496;
  font-size: 13px;
  font-weight: bold;
}

.customer-results-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 12px;
  color: #909399;
  font-size: 12px;
}

.customer-results-footer /deep/ .el-button {
  min-width: 62px;
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
  color: #4f6fae;
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

.application-detail-dialog /deep/ .el-dialog {
  border-radius: 4px;
  overflow: hidden;
  font-family: "Microsoft YaHei", Arial, sans-serif;
}

.application-detail-dialog /deep/ .el-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.application-detail-dialog /deep/ .el-dialog__title {
  color: #343a44;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  padding-left: 0;
}

.application-detail-dialog /deep/ .el-dialog__body {
  padding: 16px 20px 4px;
  background: #fff;
  max-height: 70vh;
  overflow-y: auto;
}

.application-detail-dialog /deep/ .el-dialog__headerbtn {
  top: 16px;
}

.application-detail-dialog /deep/ .el-dialog__footer {
  padding: 10px 16px;
  border-top: 1px solid #e4e7ed;
  text-align: right;
  background: #fff;
}

.application-detail-footer /deep/ .el-button {
  min-width: 62px;
  color: #385391;
  border-color: #8fa6cf;
  background: #fff;
}

.edit-application-dialog /deep/ .el-dialog {
  border-radius: 4px;
  overflow: hidden;
  font-family: "Microsoft YaHei", Arial, sans-serif;
}

.edit-application-dialog /deep/ .el-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.edit-application-dialog /deep/ .el-dialog__title {
  color: #343a44;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}

.edit-application-dialog /deep/ .el-dialog__body {
  padding: 16px 20px 4px;
  background: #fff;
  max-height: 70vh;
  overflow-y: auto;
}

.edit-application-dialog /deep/ .el-dialog__footer {
  padding: 10px 16px;
  border-top: 1px solid #e4e7ed;
  text-align: right;
  background: #fff;
}

.edit-application-dialog .section-title {
  padding-left: 8px;
  margin-bottom: 16px;
  border-left: 3px solid #4472c4;
  line-height: 20px;
  color: #6383ff;
}

.edit-application-dialog /deep/ .el-alert {
  padding: 10px 12px;
  border: 1px solid #d9e5f5;
  background: #f5f8fc;
}

.edit-application-dialog /deep/ .el-alert__content {
  color: #606266;
  font-size: 13px;
  line-height: 22px;
}

.edit-application-dialog .dialog-footer /deep/ .el-button:last-child {
  background: #4f6fae;
  border-color: #4f6fae;
}

.application-detail-dialog .section-card {
  padding: 12px 16px;
  margin-bottom: 18px;
  border: 0;
  border-radius: 0;
  background: #fff;
  box-shadow: none;
}

.application-detail-dialog .section-card:last-child {
  margin-bottom: 0;
}

.application-detail-dialog .section-title {
  padding-left: 8px;
  margin-bottom: 12px;
  border-left: 3px solid #4472c4;
  font-size: 14px;
  line-height: 20px;
  font-weight: bold;
  color: #2f5496;
}

.application-detail-dialog .section-title::before {
  display: none;
}

.application-detail-dialog /deep/ .el-descriptions__label {
  width: 108px;
  color: #5c6471;
  background: #fff;
  font-weight: 400;
}

.application-detail-dialog /deep/ .el-descriptions__content {
  color: #343a44;
  background: #fff;
  font-weight: 700 !important;
}

.application-detail-dialog /deep/ .el-descriptions__content strong {
  color: #343a44;
  font-weight: 700 !important;
}

.application-detail-dialog /deep/ .el-descriptions-item__content {
  color: #343a44;
  font-weight: 700 !important;
}

.application-detail-dialog /deep/ .el-descriptions__body,
.application-detail-dialog /deep/ .el-descriptions__table,
.application-detail-dialog /deep/ .el-descriptions-item__cell {
  border: 0;
}

.application-detail-dialog /deep/ .el-descriptions-item__cell {
  padding: 5px 0;
  font-size: 14px;
  color: #343a44;
  font-weight: 400;
  line-height: 1.45;
}

.application-detail-dialog /deep/ .el-descriptions-item__label {
  font-size: 13px;
  color: #5c6471;
  font-weight: 400;
  white-space: nowrap;
}

.application-detail-dialog .preview-box {
  border: 0;
  background: #edf4ff;
  border-radius: 4px;
  padding: 12px 20px;
  gap: 36px;
}

.application-detail-dialog .preview-box .sub-label {
  color: #5c6471;
  font-size: 12px;
  line-height: 18px;
  font-weight: 700;
}

.application-detail-dialog .preview-box .val {
  color: #343a44;
  font-size: 20px;
  line-height: 1.2;
  margin-top: 6px;
  font-weight: 700;
}

.application-detail-dialog .preview-box .val.text-success {
  color: #32853a;
}

.application-detail-dialog .preview-box .arrow {
  color: #4f6fae;
  font-size: 20px;
}

.application-detail-dialog .desc-box {
  min-height: 42px;
  border: 0;
  background: #fff;
  padding-left: 0;
  font-size: 14px;
  color: #343a44;
  line-height: 22px;
}

.application-detail-dialog .text-success {
  color: #32853a;
}

.application-detail-dialog .text-danger {
  color: #c85a5a;
}

.application-detail-dialog .text-muted {
  color: #5c6471;
}

.application-detail-dialog .status-text {
  font-weight: 700;
}

.application-detail-dialog .status-approved {
  color: #32853a;
}

.application-detail-dialog .status-rejected {
  color: #c85a5a;
}

.application-detail-dialog .status-pending {
  color: #5c6471;
}

.section-title {
  position: relative;
  padding-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #6383ff;
  margin-bottom: 10px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background-color: #4472c4;
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
  color: #4f6fae;
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
