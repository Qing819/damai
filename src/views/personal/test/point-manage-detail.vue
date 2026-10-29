<template>
  <div class="customer-point-detail-page" v-loading="loading">
    <div class="page-heading">
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
          <el-descriptions-item label="客户号">{{ userInfo.custId || '—' }}</el-descriptions-item>
          <el-descriptions-item label="核心客户号">{{ userInfo.coreCustId || '—' }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ userInfo.custName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ userInfo.idType || '—' }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ userInfo.idNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="手机号码">{{ userInfo.mobile || '—' }}</el-descriptions-item>
          <el-descriptions-item label="客户级别">
            <el-tag type="warning" size="small">{{ formatGrade(userInfo.currentGrade) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属渠道">{{ userInfo.channel || '—' }}</el-descriptions-item>
          <el-descriptions-item label="服务归属机构">{{ userInfo.orgName || '—' }}</el-descriptions-item>
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
        <el-table :data="benefitsData" header-row-class-name="custom-header" border size="mini">
          <el-table-column prop="benefitName" label="服务项目" align="center" />
          <el-table-column label="可使用次数" align="center">
            <template slot-scope="{row}">
              {{ row.limitType === 'unlimited' ? '不限' : (row.grantCount != null ? row.grantCount : '—') }}
            </template>
          </el-table-column>
          <el-table-column prop="usedCount" label="已使用次数" align="center">
            <template slot-scope="{row}">
              {{ row.usedCount !== null && row.usedCount !== undefined ? row.usedCount : 0 }}
            </template>
          </el-table-column>
          <el-table-column label="剩余次数" align="center">
            <template slot-scope="{row}">
              {{ row.limitType === 'unlimited' ? '不限' : (row.remainCount != null ? row.remainCount : '—') }}
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
            <el-table :data="pointsTrack" header-row-class-name="custom-header" border size="mini">
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
              <el-table-column prop="valid_end_date" label="积分有效期" align="center">
                <template slot-scope="{row}">{{ formatDateOnly(row.valid_end_date) }}</template>
              </el-table-column>
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
            <el-table :data="levelTrack" header-row-class-name="custom-header" border size="mini">
              <el-table-column label="服务归属机构" align="center">
                <template slot-scope="{row}">{{ row.org_name || row.orgName || '—' }}</template>
              </el-table-column>
              <el-table-column label="业务渠道" align="center">
                <template slot-scope="{row}">{{ row.channel || row.channel_name || row.channelName || '—' }}</template>
              </el-table-column>
              <el-table-column label="变化类型" align="center">
                <template slot-scope="{row}">
                  <el-tag size="mini" type="info">{{ formatChangeType(row.change_type || row.changeType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="变化前等级" align="center">
                <template slot-scope="{row}">{{ formatGrade(row.grade_before || row.gradeBefore) }}</template>
              </el-table-column>
              <el-table-column label="变化后等级" align="center">
                <template slot-scope="{row}">{{ formatGrade(row.grade_after || row.gradeAfter) }}</template>
              </el-table-column>
              <el-table-column label="变化时积分" align="center">
                <template slot-scope="{row}">{{ (row.change_point !== undefined ? row.change_point : row.changePoint) | formatNumber }}</template>
              </el-table-column>
              <el-table-column label="变化原因" align="center" show-overflow-tooltip>
                <template slot-scope="{row}">{{ row.change_reason || row.changeReason || row.reason || '—' }}</template>
              </el-table-column>
              <el-table-column label="变化时间" align="center">
                <template slot-scope="{row}">{{ row.change_time || row.changeTime || '—' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="90" fixed="right" align="center">
                <template slot-scope="{row}">
                  <el-button type="text" size="small" @click="handleGradeDetail(row)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 权益轨迹 -->
          <el-tab-pane label="权益轨迹" name="benefitTrack">
            <el-table :data="benefitTrackData" header-row-class-name="custom-header" border size="mini">
              <el-table-column label="权益动作" align="center">
                <template slot-scope="{row}">{{ formatBenefitAction(row.action || row.action_name || row.actionName) }}</template>
              </el-table-column>
              <el-table-column label="权益名称" align="center">
                <template slot-scope="{row}">{{ row.benefit_name || row.benefitName || '—' }}</template>
              </el-table-column>
              <el-table-column label="服务供应商" align="center">
                <template slot-scope="{row}">{{ row.supplier || '—' }}</template>
              </el-table-column>
              <el-table-column label="服务类型" align="center">
                <template slot-scope="{row}">{{ row.kind || row.service_type || row.serviceType || '—' }}</template>
              </el-table-column>
              <el-table-column label="有效期" align="center">
                <template slot-scope="{row}">{{ formatDateOnly(row.valid_to || row.validTo || row.expire_time) }}</template>
              </el-table-column>
              <el-table-column label="动作时间" align="center">
                <template slot-scope="{row}">{{ row.action_time || row.actionTime || row.use_time || row.useTime || '—' }}</template>
              </el-table-column>
              <el-table-column label="次数" align="center">
                <template slot-scope="{row}">{{ formatBenefitCount(row.count_change !== undefined ? row.count_change : row.countChange) }}</template>
              </el-table-column>
              <el-table-column label="已使用/剩余" align="center">
                <template slot-scope="{row}">{{ row.used_count !== undefined ? row.used_count : (row.usedCount || 0) }} / {{ row.remain_count !== undefined ? (row.remain_count === null ? '不限' : row.remain_count) : (row.remainCount === null || row.remainCount === undefined ? '不限' : row.remainCount) }}</template>
              </el-table-column>
              <el-table-column label="次数状态" align="center">
                <template slot-scope="{row}">{{ formatBenefitStatus(row.count_status || row.countStatus) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right" align="center">
                <template slot-scope="{row}">
                  <el-button type="text" size="small" @click="handleBenefitDetail(row)">详情</el-button>
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
            <el-col :span="12">客户：<strong>{{ traceDetailData.cust_name || userInfo.custName }} ({{ traceDetailData.cust_id || userInfo.custId }})</strong></el-col>
            <el-col :span="12">证件类型：<strong>{{ traceDetailData.id_type || traceDetailData.cert_type || userInfo.idType || '—' }}</strong></el-col>
            <el-col :span="12">证件号码：<strong>{{ traceDetailData.id_no || traceDetailData.cert_no || userInfo.idNo || '—' }}</strong></el-col>
            <el-col :span="12">服务归属机构：<strong>{{ traceDetailData.org_name || userInfo.orgName || '—' }}</strong></el-col>
            <el-col :span="12" v-if="traceDetailData.policy_no">保单号：<strong class="text-primary">{{ traceDetailData.policy_no }}</strong></el-col>
            <el-col :span="12" v-if="traceDetailData.risk_code">险种号：<strong>{{ traceDetailData.risk_code }}</strong></el-col>
            <el-col :span="12" v-if="traceDetailData.product_name">产品：<strong>{{ traceDetailData.product_name }}</strong></el-col>

            <!-- 【新增1】针对保费积分或养老协同积分展示 保单生效日期 -->
            <el-col :span="12" v-if="isPolicyPointType(traceDetailData.point_type)">
              保单生效日期：<strong>{{ traceDetailData.policy_effective_date || '—' }}</strong>
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
            <el-col :span="12">
              调整积分额度：
              <span :class="isAddDirection(traceDetailData.direction) ? 'text-green' : 'text-red'" class="font-bold">
                {{ isAddDirection(traceDetailData.direction) ? '+' : '-' }} {{ Math.abs(traceDetailData.point_amt || 0) | formatNumber }}
              </span>
            </el-col>
            <el-col :span="12" v-if="traceDetailData.oa_no">OA流水号：<strong>{{ traceDetailData.oa_no }}</strong></el-col>
            <el-col :span="12">调整原因：<strong>{{ traceDetailData.reason || traceDetailData.rule_name || '—' }}</strong></el-col>
            <el-col :span="12">积分有效期：<strong>{{ traceDetailData.valid_end_date ? `自然年（至当年${formatDateOnly(traceDetailData.valid_end_date)}）` : '长期有效' }}</strong></el-col>
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
            <el-col :span="12">触发规则：<strong>{{ traceDetailData.rule_name || traceDetailData.rule_code || '—' }}</strong></el-col>
            <el-col :span="12">规则版本：<strong>{{ traceDetailData.rule_version || '—' }}</strong></el-col>
            <el-col :span="12">实收记录：<el-button v-if="traceDetailData.pay_record_no" type="text" @click="$refs.payDetail.open(traceDetailData.pay_record_no)">{{ traceDetailData.pay_record_no }}</el-button><strong v-else>—</strong></el-col>
            <el-col :span="12">缴费间隔：<strong>{{ traceDetailData.pay_interval || '—' }}</strong></el-col>

            <!-- 【新增2】触发规则区域新增交费年期 -->
            <el-col :span="12">交费年期：<strong>{{ traceDetailData.pay_years != null ? `${traceDetailData.pay_years} 年` : '—' }}</strong></el-col>

            <el-col :span="12">缴费次数：<strong>{{ traceDetailData.pay_count != null ? `${traceDetailData.pay_count} 次` : '—' }}</strong></el-col>
            <el-col :span="12">交费金额：<strong>{{ traceDetailData.pay_amt != null ? $options.filters.formatNumber(traceDetailData.pay_amt) : '—' }}</strong></el-col>
            <el-col :span="12">计算系数：<strong>{{ traceDetailData.calc_factor != null ? traceDetailData.calc_factor : '—' }}</strong></el-col>
          </el-row>
        </div>

        <!-- 附件区 -->
        <div class="detail-section" v-if="traceDetailData.attachment_name">
          <div class="section-title">附件</div>
          <el-link type="primary" icon="el-icon-document" :underline="false" @click="downloadAttachment">
            {{ traceDetailData.attachment_name }}
          </el-link>
        </div>

        <!-- 审批信息区 (人工调整专属) -->
        <div class="detail-section" v-if="['MANUAL', '人工调整'].includes(traceDetailData.operate_type)">
          <div class="section-title">
            审批信息 <span class="sub-tip">人工调整需审批通过后生效</span>
          </div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">申请单号：<strong>{{ traceDetailData.apply_no || '—' }}</strong></el-col>
            <el-col :span="12">审核人：<strong>{{ traceDetailData.approver || '—' }}</strong></el-col>
            <el-col :span="12" v-if="traceDetailData.approve_time">审核时间：<strong>{{ traceDetailData.approve_time }}</strong></el-col>
            <el-col :span="24" v-if="traceDetailData.approve_remark">审核意见：<strong>{{ traceDetailData.approve_remark }}</strong></el-col>
          </el-row>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="innerTraceDetailVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <pay-detail-dialog ref="payDetail" />
    <!-- 等级变化详情弹框 -->
    <el-dialog
        title="等级变化详情"
        :visible.sync="gradeDetailDialogVisible"
        width="600px"
        append-to-body
        custom-class="detail-dialog grade-detail-dialog"
    >
      <div class="dialog-content" v-if="gradeDetailData">
        <div class="detail-section">
          <div class="section-title">基本信息</div>
          <el-descriptions :column="2" size="small" class="grade-descriptions">
            <el-descriptions-item label="变化记录号">{{ gradeDetailData.trace_no || gradeDetailData.traceNo || gradeDetailData.record_no || gradeDetailData.recordNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ gradeDetailData.cust_name || gradeDetailData.custName || userInfo.custName || '—' }}（{{ gradeDetailData.cust_id || gradeDetailData.custId || userInfo.custId || '—' }}）</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ gradeDetailData.id_no || gradeDetailData.idNo || userInfo.idNo || '—' }}</el-descriptions-item>
            <el-descriptions-item label="服务归属机构">{{ gradeDetailData.org_name || gradeDetailData.orgName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="业务渠道">{{ gradeDetailData.channel || gradeDetailData.channel_name || gradeDetailData.channelName || '—' }}</el-descriptions-item>
            <el-descriptions-item label="变化类型">{{ formatChangeType(gradeDetailData.change_type || gradeDetailData.changeType) }}</el-descriptions-item>
            <el-descriptions-item label="变化时积分">{{ (gradeDetailData.change_point !== undefined ? gradeDetailData.change_point : gradeDetailData.changePoint) | formatNumber }}</el-descriptions-item>
            <el-descriptions-item label="变化原因">{{ gradeDetailData.change_reason || gradeDetailData.changeReason || gradeDetailData.reason || '—' }}</el-descriptions-item>
            <el-descriptions-item label="变化时间">{{ gradeDetailData.change_time || gradeDetailData.changeTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="操作人">{{ gradeDetailData.operator || '系统' }}</el-descriptions-item>
            <el-descriptions-item label="等级生效日期">{{ gradeDetailData.effective_date || gradeDetailData.effectiveDate || gradeDetailData.change_time || gradeDetailData.changeTime || '—' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">等级变化</div>
          <div class="grade-change-card">
            <span class="grade-change-item">变化前等级：<span class="grade-status grade-status-before">{{ formatGrade(gradeDetailData.grade_before || gradeDetailData.gradeBefore) }}</span></span>
            <span class="grade-change-arrow">→</span>
            <span class="grade-change-item">变化后等级：<span class="grade-status grade-status-after">{{ formatGrade(gradeDetailData.grade_after || gradeDetailData.gradeAfter) }}</span></span>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">变动说明</div>
          <div class="grade-note">{{ gradeDetailData.note || `类型：${formatChangeType(gradeDetailData.change_type || gradeDetailData.changeType)}，等级从 ${formatGrade(gradeDetailData.grade_before || gradeDetailData.gradeBefore)} 调整至 ${formatGrade(gradeDetailData.grade_after || gradeDetailData.gradeAfter)}` }}</div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="gradeDetailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 权益使用详情弹框 -->
    <el-dialog
        title="权益使用详情"
        :visible.sync="benefitDetailDialogVisible"
        width="680px"
        append-to-body
        custom-class="detail-dialog benefit-detail-dialog"
    >
      <div class="dialog-content" v-if="benefitDetailData">
        <div class="detail-section">
          <div class="section-title">权益信息</div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">客户：<strong>{{ benefitDetailData.custName || benefitDetailData.cust_name || userInfo.custName || '—' }}（{{ benefitDetailData.custId || benefitDetailData.cust_id || userInfo.custId || '—' }}）</strong></el-col>
            <el-col :span="12">服务项目：<strong>{{ benefitDetailData.benefitName || benefitDetailData.benefit_name || '—' }}</strong></el-col>
            <el-col :span="12">服务供应商：<strong>{{ benefitDetailData.supplier || '—' }}</strong></el-col>
            <el-col :span="12">服务类型：<strong>{{ benefitDetailData.kind || benefitDetailData.serviceType || benefitDetailData.service_type || '—' }}</strong></el-col>
            <el-col :span="12">有效期：<strong>{{ formatDateOnly(benefitDetailData.validTo || benefitDetailData.valid_to || benefitDetailData.expire_time) }}</strong></el-col>
            <el-col :span="12">次数状态：<strong>{{ formatBenefitStatus(benefitDetailData.countStatus || benefitDetailData.count_status) }}</strong></el-col>
          </el-row>
        </div>

        <div class="detail-section">
          <div class="section-title">本次使用</div>
          <el-row :gutter="12" class="info-row">
            <el-col :span="12">权益动作：<strong>{{ formatBenefitAction(benefitDetailData.action || benefitDetailData.actionName || benefitDetailData.action_name) }}</strong></el-col>
            <el-col :span="12">动作时间：<strong>{{ benefitDetailData.actionTime || benefitDetailData.action_time || '—' }}</strong></el-col>
            <el-col :span="12">本次次数：<strong>{{ formatBenefitCount(benefitDetailData.countChange !== undefined ? benefitDetailData.countChange : benefitDetailData.count_change) }}</strong></el-col>
            <el-col :span="12">已使用 / 剩余：<strong>{{ benefitDetailData.usedCount !== undefined ? benefitDetailData.usedCount : (benefitDetailData.used_count || 0) }} / {{ benefitDetailData.remainCount === null || benefitDetailData.remain_count === null ? '不限' : (benefitDetailData.remainCount !== undefined ? benefitDetailData.remainCount : (benefitDetailData.remain_count !== undefined ? benefitDetailData.remain_count : '不限')) }}</strong></el-col>
          </el-row>
        </div>

        <div class="detail-section">
          <div class="section-title">次数变化</div>
          <div class="benefit-change-card">
            <span>变化前剩余：<strong>{{ benefitBalance(benefitDetailData, true) }}</strong></span>
            <span class="grade-change-arrow">→</span>
            <span>变化后剩余：<strong>{{ benefitBalance(benefitDetailData, false) }}</strong></span>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="benefitDetailDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getCustPointDetailApi, getPointTraceSummaryApi, getPointTraceDetailApi, exportTraceApi, downloadAttachmentApi } from '@/api/test/point'
import { getGradeTraceDetailApi } from '@/api/test/index'
import { getBenefitTraceDetailApi } from '@/api/test/index'
import { assertExportBlob, downloadBlob } from '@/utils/exportFile'
import PayDetailDialog from './pay-detail-dialog.vue'

export default {
  name: 'CustomerPointDetailDialog',
  components: { PayDetailDialog },
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
      customerRequest: 0,
      traceRequest: 0,
      gradeRequest: 0,
      benefitRequest: 0,
      activeTab: 'points',
      currentCustId: '',

      // 轨迹二级详情弹窗控制
      innerTraceDetailVisible: false,
      traceDetailData: null,
      gradeDetailDialogVisible: false,
      gradeDetailData: null,
      benefitDetailDialogVisible: false,
      benefitDetailData: null,

      directionMap: {
        ADD: '加分',
        SUB: '减分'
      },

      traceSummary: {
        addTotal: 0,
        reduceTotal: 0,
        netChange: 0,
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
        { title: '本期加分总额', value: this.traceSummary.addTotal, color: '#67c23a' },
        { title: '本期减分总额', value: this.traceSummary.reduceTotal, color: '#f56c6c' },
        { title: '本期净变化', value: this.traceSummary.netChange, color: '#4f6fae' },
        { title: '轨迹总数', value: this.traceSummary.total, color: '#909399' }
      ]
    },
    pointsSummaryList() {
      return [
        { label: '当前积分', value: this.pointsSummary.currentPoint || 0, highlight: true },
        { label: '保费积分', value: this.pointsSummary.premiumPoint || 0 },
        { label: '忠诚积分', value: this.pointsSummary.loyaltyPoint || 0 },
        { label: '人工调整积分', value: this.pointsSummary.manualPoint || 0 }
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
    async downloadAttachment() {
      if (!this.traceDetailData || !this.traceDetailData.attachment_name) return
      const filePath = this.traceDetailData.attachment_name
      const fileName = filePath.split('/').pop()
      try {
        const blob = await downloadAttachmentApi({ filePath, fileName })
        await downloadBlob(blob, fileName)
      } catch (error) {
        this.$message.error('附件下载失败，请重试')
      }
    },
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

    formatChangeType(type) {
      const typeMap = {
        UPGRADE: '升星',
        DOWNGRADE: '降星',
        INVALID: '失效',
        ANNUAL: '年度评定',
        SWITCH: '规则切换'
      }
      return typeMap[type] || type || '—'
    },

    formatBenefitCount(value) {
      if (value === null || value === undefined || value === '') return '—'
      return Number(value) > 0 ? `+${value}` : String(value)
    },
    formatBenefitAction(value) {
      return { GRADE_CHANGE: '等级变动调整', MANUAL_ADJUST: '人工调整', USE_DEDUCT: '使用消减', EXPIRE_DEDUCT: '失效消减', DEDUCT_ROLLBACK: '消减回退', TRANSFER_OUT: '转出', TRANSFER_IN: '转入' }[value] || value || '—'
    },
    formatBenefitStatus(value) {
      return { NORMAL: '正常', EXHAUSTED: '已用尽', EXPIRED: '已失效', TRANSFERRED: '已转出' }[value] || value || '—'
    },
    benefitBalance(row, before) {
      const fields = before ? ['beforeRemain', 'before_remain'] : ['afterRemain', 'after_remain', 'remainCount', 'remain_count']
      for (const field of fields) {
        if (row[field] !== undefined) return row[field] === null ? '不限' : row[field]
      }
      // 详情的 remainCount 空值可省略；动作前余额没有相应返回契约。
      return before ? '—' : '不限'
    },

    formatDirection(direction) {
      if (!direction) return '—'
      return this.directionMap[direction] || direction
    },

    formatDateOnly(value) {
      if (!value) return '—'
      return String(value).split('T')[0].split(' ')[0]
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
          const data = res.data || {}
          this.traceSummary = {
            addTotal: data.addTotal ?? 0,
            reduceTotal: data.reduceTotal ?? 0,
            netChange: data.netChange ?? 0,
            total: data.total !== undefined ? data.total : (data.totalCount || 0)
          }
        }
      } catch (err) {
        console.error('获取积分轨迹统计失败:', err)
      }
    },

    async fetchDetailData(custId) {
      const request = ++this.customerRequest
      try {
        const res = await getCustPointDetailApi(custId)
        if (request !== this.customerRequest) return
        if (res && res.data) {
          const data = res.data || {}
          const profile = data.profile || {}
          const baseInfo = data.custBaseInfo || {}
          this.userInfo = {
            custId: profile.cust_id || profile.custId || baseInfo.custId,
            coreCustId: profile.core_cust_id || profile.coreCustId || baseInfo.coreCustId,
            custName: profile.cust_name || profile.custName || baseInfo.custName,
            idType: profile.id_type || profile.idType || baseInfo.idType,
            idNo: profile.id_no || profile.idNo || baseInfo.idNo,
            mobile: profile.mobile || baseInfo.mobile,
            currentGrade: profile.current_grade || profile.currentGrade || data.pointSummary?.currentGrade,
            channel: profile.channel || profile.channelName || baseInfo.channel || baseInfo.channelName,
            orgName: profile.org_name || profile.orgName || baseInfo.orgName,
            org2Name: profile.org2_name || profile.org2Name || baseInfo.org2Name,
            org3Name: profile.org3_name || profile.org3Name || baseInfo.org3Name,
            agent: profile.agent || profile.agentName || baseInfo.agent || baseInfo.agentName
          }
          this.pointsSummary = data.pointSummary || {}
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
          this.benefitsData = data.benefitStatus || []
          this.benefitTrackData = data.benefitTraces || data.benefit_traces || []
        } else {
          throw new Error('客户积分详情响应异常')
        }
      } catch (err) {
        if (request !== this.customerRequest) return
        this.userInfo = {}
        this.pointsSummary = {}
        this.pointsTrack = []
        this.levelTrack = []
        this.benefitsData = []
        this.benefitTrackData = []
        this.$message.error('获取客户积分详情失败，请重试')
        console.error('获取详情接口错误:', err)
      }
    },

    normalizeDetailFields(item) {
      const row = { ...item }
      Object.keys(item).forEach(key => {
        const field = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        if (row[field] === undefined) row[field] = item[key]
      })
      return row
    },

    async handleExport() {
      try {
        const blob = await exportTraceApi({ custId: this.currentCustId })
        await assertExportBlob(blob)
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
      if (!row.trace_id) {
        this.$message.error('轨迹主键缺失，无法加载详情')
        return
      }
      const request = ++this.traceRequest
      this.traceDetailData = null
      this.innerTraceDetailVisible = true

      try {
        const res = await getPointTraceDetailApi(row.trace_id)
        if (request !== this.traceRequest || !this.innerTraceDetailVisible) return
        if (res && res.data) {
          const detail = this.normalizeDetailFields(res.data.trace || res.data)
          if (!detail.trace_id) throw new Error('轨迹详情缺少主键')
          this.traceDetailData = { ...row, ...detail }
          this.traceDetailData.policy_effective_date = detail.policy_effective_date || detail.cvalidate
          this.traceDetailData.pay_record_no = detail.pay_no || detail.pay_record_no
          this.traceDetailData.calc_factor = detail.calc_coefficient !== undefined ? detail.calc_coefficient : detail.calc_factor
          const apply = res.data.apply || detail.apply || {}
          this.traceDetailData.attachment_name = apply.attachment || detail.attachment || detail.attachment_name
          this.traceDetailData.apply = apply
          this.traceDetailData.apply_no = apply.apply_no || apply.applyNo || this.traceDetailData.apply_no
          this.traceDetailData.approver = apply.auditor || apply.approver || apply.approver_name || this.traceDetailData.approver
          this.traceDetailData.approve_time = apply.auditTime || apply.approve_time || apply.approveTime || this.traceDetailData.approve_time
          this.traceDetailData.approve_remark = apply.auditOpinion || apply.approve_remark || apply.approveRemark || apply.approval_comment || this.traceDetailData.approve_remark
        } else {
          throw new Error('轨迹详情响应异常')
        }
      } catch (err) {
        if (request !== this.traceRequest) return
        this.innerTraceDetailVisible = false
        console.error('获取积分轨迹详情失败:', err)
        this.$message.error('获取轨迹详情失败，请稍后重试')
      }
    },

    async handleGradeDetail(row) {
      const traceNo = row.trace_no || row.traceNo || row.record_no || row.recordNo
      if (!traceNo) return
      const request = ++this.gradeRequest
      this.gradeDetailData = null
      this.gradeDetailDialogVisible = true

      try {
        const res = await getGradeTraceDetailApi(traceNo)
        if (request !== this.gradeRequest || !this.gradeDetailDialogVisible) return
        const detail = res?.data || res?.body?.data
        if (detail && (detail.id || detail.traceNo || detail.trace_no)) {
          this.gradeDetailData = { ...row, ...detail }
        } else {
          throw new Error('等级变化详情响应异常')
        }
      } catch (err) {
        if (request !== this.gradeRequest) return
        this.gradeDetailDialogVisible = false
        console.error('获取等级变化详情失败:', err)
        this.$message.error('获取等级变化详情失败')
      }
    },

    async handleBenefitDetail(row) {
      const traceId = row.id || row.traceNo || row.trace_no
      if (!traceId) return
      const request = ++this.benefitRequest
      this.benefitDetailData = null
      this.benefitDetailDialogVisible = true

      try {
        const res = await getBenefitTraceDetailApi(traceId)
        if (request !== this.benefitRequest || !this.benefitDetailDialogVisible) return
        const detail = res?.data || res?.body?.data
        if (detail && (detail.id || detail.traceNo || detail.trace_no)) {
          this.benefitDetailData = { ...row, ...detail }
        } else {
          throw new Error('权益轨迹详情响应异常')
        }
      } catch (err) {
        if (request !== this.benefitRequest) return
        this.benefitDetailDialogVisible = false
        console.error('获取权益使用详情失败:', err)
        this.$message.error('获取权益使用详情失败')
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
  font-size: 14px;
  font-weight: bold;
  color: #333a45;
  border-left: 3px solid #409eff;
  padding-left: 8px;
  margin-bottom: 12px;
}

.main-title {
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 8px;
  margin-bottom: 16px;
}

.points-box {
  border: 1px solid #dcdfe6;
  border-top: 3px solid #4f6fae;
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
  color: #4f6fae;
}

.custom-header th {
  background-color: #4f6fae !important;
  color: #ffffff !important;
  font-weight: 500;
}

.text-green { color: #67c23a; }
.text-red { color: #f56c6c; }
.text-primary { color: #4f6fae; }
.font-bold { font-weight: bold; }

.page-footer {
  max-width: 1440px;
  margin: 16px auto 0;
  text-align: right;
}

/* 嵌套详情弹窗内样式 */
::v-deep .detail-dialog .el-dialog {
  border-radius: 4px;
  overflow: hidden;
  font-family: "Microsoft YaHei", Arial, sans-serif;
}

::v-deep .detail-dialog .el-dialog__header {
  height: auto;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

::v-deep .detail-dialog .el-dialog__title {
  color: #343a44;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  padding-left: 0;
}

::v-deep .detail-dialog .el-dialog__body {
  padding: 16px 20px 4px;
  background: #fff;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section .section-title {
  font-size: 14px;
  font-weight: bold;
  color: #2f5496;
  padding-left: 8px;
  border-left: 3px solid #409eff;
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
  color: #4f6fae;
  margin: 0 32px;
}

.grade-detail-dialog ::v-deep .el-dialog__body {
  max-height: 70vh;
  overflow-y: auto;
}

.grade-descriptions ::v-deep .el-descriptions-item__label,
.grade-descriptions ::v-deep .el-descriptions-item__content {
  font-size: 13px;
}

.grade-change-card {
  padding: 15px;
  background: #f4f4f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  font-size: 13px;
}

.grade-change-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.grade-status {
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 3px;
  font-size: 12px;
  line-height: 20px;
  font-weight: 600;
}

.grade-status-before {
  color: #606266;
  background: #f4f4f5;
  border-color: #d3d4d6;
}

.grade-status-after {
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.grade-change-arrow {
  margin: 0 20px;
  color: #909399;
  font-size: 18px;
  font-weight: bold;
}

.grade-note {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.benefit-change-card {
  padding: 15px;
  background: #f4f4f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  font-size: 13px;
}

.benefit-change-card strong {
  color: #303133;
}
</style>
