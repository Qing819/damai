<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="header-section">
      <h2 class="title">服务规则配置</h2>
      <p class="subtitle">按客户等级配置服务权益，支持多条服务权益与服务项目维护</p>
    </div>

    <!-- 顶部规则说明卡片 -->
    <el-card class="rule-info-card" shadow="never">
      <div class="rule-info-content">
        <span class="rule-title">VIP有效期规则</span>
        <span class="rule-text">
          以自然年度为单位（每年1月1日-12月31日）；中途成为VIP自达标次日起生效、有效期至当年年末；当年未使用次数年末自动清零、不结转下一年度；新单投保过犹豫期方可累计积分，积分达标后触发对应等级权益派发
        </span>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" class="rule-tabs" @tab-click="handleTabChange">
      <el-tab-pane label="等级规则列表" name="rules" />
      <el-tab-pane label="服务规则修改记录" name="changes" />
    </el-tabs>
    <template v-if="activeTab === 'rules'">
    <div class="action-bar">
      <div class="left-btn-group">
        <el-button type="primary" size="medium" @click="handleAddRule">＋ 新增服务规则</el-button>
        <el-button size="medium" @click="handleStartModification">发起服务规则修改</el-button>
        <el-button size="medium" @click="handleDownloadTemplate">模板下载</el-button>
        <el-button size="medium" :loading="importing" @click="triggerImport">批量导入</el-button>
        <el-button size="medium" @click="handleExport">导出</el-button>
        <!-- 隐藏的文件选择框 -->
        <input type="file" ref="fileInput" style="display: none;" accept=".xlsx, .xls" @change="handleFileChange" />
      </div>
    </div>

    <!-- 主卡片区域 -->
    <el-card key="configured-rules" class="main-card" shadow="never">
      <!-- 列表顶部栏 -->
      <div class="table-header">
        <div class="table-title">服务规则配置</div>
        <div class="version-select-group">
          <span class="label">查看版本</span>
          <el-select v-model="selectedVersion" size="small" style="width: 180px;" @change="handleVersionChange">
            <el-option
                v-for="ver in versionOptions"
                :key="ver.version_tag"
                :label="versionLabel(ver)"
                :value="ver.version_tag">
            </el-option>
          </el-select>
          <span class="effect-date" v-if="currentVersionInfo">
            生效 {{ currentVersionInfo.effectiveDate || '—' }} ~ {{ versionExpireText(currentVersionInfo) }}
          </span>
        </div>
      </div>

      <!-- 未配置等级警告提示 -->
      <el-alert v-if="unconfiguredGradesText && canConfigureVersion(currentVersionInfo)" type="warning" :closable="false" show-icon class="warning-alert">
        <template slot="title">
          <span style="font-weight: bold; color: #E6A23C; margin-right: 8px;">未配置等级</span>
          <span>版本 {{ selectedVersion }} 下还有 {{ unconfiguredGradeList.length }} 个等级未配置服务规则：{{ unconfiguredGradesText }}，请点击「+ 新增服务规则」补充</span>
        </template>
      </el-alert>

      <!-- 数据表格 -->
      <el-table
          v-loading="loading"
          :data="pagedTableData"
          style="width: 100%"
      >
        <el-table-column label="客户级别" width="160">
          <template slot-scope="scope">{{ gradeDisplayName(scope.row) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="260" show-overflow-tooltip>
          <template slot-scope="scope">{{ scope.row.description || '—' }}</template>
        </el-table-column>
        <el-table-column prop="benefit_count" label="已选权益数量" align="center" width="140"></el-table-column>
        <el-table-column label="生效日期" width="120">
          <template slot-scope="scope">{{ scope.row.effectiveDate || (currentVersionInfo && currentVersionInfo.effectiveDate) || '—' }}</template>
        </el-table-column>
        <el-table-column label="失效日期" width="120">
          <template slot-scope="scope">{{ versionExpireText(scope.row.expireDate !== undefined ? scope.row : currentVersionInfo) }}</template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" align="center" width="180"></el-table-column>
        <el-table-column prop="creator" label="创建人" align="center" width="120">
          <template slot-scope="scope">{{ scope.row.creator || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="140">
          <template slot-scope="scope">
            <el-button v-if="canConfigureVersion(currentVersionInfo)" type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination :current-page.sync="pageNo" :page-size="pageSize" :total="tableData.length" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50]" @size-change="handlePageSizeChange" />
      </div>
    </el-card>
    </template>
    <el-card v-else key="rule-modifications" class="main-card" shadow="never">
      <div class="table-title">服务规则修改记录</div>
      <p class="records-tip">版本生效后不可直接修改；中途调整通过「发起服务规则修改」发起，记录保留修改后的权益内容快照；待生效的记录可修改、删除</p>
      <el-table v-loading="changeLoading" :data="pagedChangeRecords">
        <el-table-column prop="versionTag" label="版本" width="140" />
        <el-table-column prop="gradeName" label="星级" min-width="160" />
        <el-table-column prop="effectiveDate" label="生效日期" width="130" />
        <el-table-column prop="operator" label="修改人" width="120">
          <template slot-scope="scope">{{ scope.row.operator || '—' }}</template>
        </el-table-column>
        <el-table-column prop="modifyTime" label="修改时间" min-width="180" />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <span :class="['record-status', 'record-status--' + scope.row.status]">{{ changeStatusText(scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210">
          <template slot-scope="scope">
            <template v-if="scope.row.status === 'PENDING'">
              <el-button type="text" size="small" @click="handleEditChange(scope.row)">修改</el-button>
              <el-divider direction="vertical" />
              <el-button type="text" size="small" @click="handleDeleteChange(scope.row)">删除</el-button>
              <el-divider direction="vertical" />
            </template>
            <el-button type="text" size="small" @click="handleViewChange(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination :current-page.sync="changePageNo" :page-size="changePageSize" :total="changeRecords.length" layout="total, prev, pager, next, sizes" :page-sizes="[10, 20, 50]" @size-change="handleChangePageSizeChange" />
      </div>
    </el-card>

    <!-- 1. Drawer 抽屉编辑与新增 -->
    <el-dialog
        :title="dialogTitle"
        :visible.sync="editDialogVisible"
        width="1280px"
        top="0"
        :close-on-click-modal="false"
        :close-on-press-escape="!saving"
        :before-close="beforeEditClose"
        @close="detailRequest++"
        custom-class="rule-edit-drawer"
    >
      <div v-loading="formLoading">
        <el-form :model="editForm" ref="editFormRef" label-width="90px" size="small" class="dialog-form">
          <!-- 基础信息区 -->
          <div class="form-row">
            <el-form-item label="规则版本" required>
              <el-select v-model="editForm.versionTag" style="width: 200px;" @change="handleFormVersionChange" :disabled="isEditMode || isModification">
                <el-option
                    v-for="ver in versionOptions"
                    :key="ver.version_tag"
                    :label="versionLabel(ver)"
                    :value="ver.version_tag">
                </el-option>
              </el-select>
              <span class="form-tip-text">先选版本，再选该版本下的客户等级；等级分档见「客户等级积分配置-等级版本管理」</span>
            </el-form-item>

            <el-form-item v-if="!isModification" label="生效日期">
              <el-input :value="formVersionInfo && formVersionInfo.effectiveDate || '—'" readonly style="width: 160px;" />
              <span class="version-date-label">失效日期</span>
              <el-input :value="versionExpireText(formVersionInfo)" readonly style="width: 160px;" />
              <span class="form-tip-text">随规则版本带出；调整需在「客户等级积分配置-等级版本管理」中修改版本</span>
            </el-form-item>

            <el-form-item label="客户等级" required>
              <el-select v-model="editForm.gradeCode" style="width: 200px;" :disabled="isEditMode" @change="handleFormGradeChange">
                <el-option
                    v-for="grade in formGradeOptions"
                    :key="grade.gradeCode"
                    :label="grade.gradeName + (isModification && !isEditMode && gradeHasPendingChange(grade.gradeCode) ? '（已有待生效修改）' : '')"
                    :value="grade.gradeCode"
                    :disabled="gradeUnavailable(grade)">
                </el-option>
              </el-select>
              <span class="form-tip-text">同一版本、同一等级下可配置多条服务权益</span>
            </el-form-item>
          </div>
          <el-form-item v-if="isModification" label="生效日期" required>
            <el-date-picker v-model="editForm.effectiveDate" type="date" value-format="yyyy-MM-dd" placeholder="请选择生效日期" :picker-options="futureDateOptions" style="width: 160px;" />
            <span class="form-tip-text">需手动选择，仅可选今天以后的日期；同一版本 + 星级最多只能有一条待生效的修改记录；生效日期后升级为该等级的客户采用新权益内容，生效日期前已享有该等级权益的客户保持不变</span>
          </el-form-item>

          <el-form-item label="描述">
            <el-input
                type="textarea"
                :rows="2"
                placeholder="请输入服务规则描述"
                maxlength="200"
                show-word-limit
                v-model="editForm.description"
                style="width: 480px; max-width: 100%;"
            >
            </el-input>
          </el-form-item>

          <!-- 服务权益配置项列表 -->
          <el-form-item label="服务权益" required class="rights-form-item">
            <div class="rights-header-bar">
              <div class="left-rights-info">
                <span>已选 <b class="selected-count">{{ editForm.rightsList.length }}</b> 条 · 点击行可展开配置服务项目</span>
                <el-button-group class="expand-btn-group">
                  <el-button size="mini" icon="el-icon-arrow-down" @click="expandAllRows(true)">全部展开</el-button>
                  <el-button size="mini" icon="el-icon-arrow-up" @click="expandAllRows(false)">全部收起</el-button>
                </el-button-group>
              </div>
              <el-button type="primary" size="small" plain icon="el-icon-plus" @click="openSelectRightsDialog">选择权益</el-button>
            </div>

            <!-- 可展开的可编辑表格 -->
            <el-table
                ref="editTableRef"
                :data="editForm.rightsList"
                row-key="benefitCode"
                border
                size="small"
                class="rights-edit-table"
                @row-click="toggleRightRow"
                empty-text="请点击右上角「＋ 选择权益」添加服务权益"
            >
              <!-- 嵌套展示：服务项目明细 -->
              <el-table-column type="expand" width="40">
                <template slot-scope="props">
                  <div class="expand-sub-table">
                    <div class="sub-table-title">服务项目</div>
                    <el-table :data="props.row.items" border size="mini">
                      <el-table-column prop="cat" label="服务类别" width="120"></el-table-column>
                      <el-table-column prop="name" label="服务项目名称" width="150"></el-table-column>
                      <el-table-column label="服务频次" min-width="360">
                        <template slot-scope="scope">
                          <div class="frequency-cell">
                            <el-checkbox v-model="scope.row.freqUnlimited">不限次数</el-checkbox>
                            <template>
                              <el-input-number v-model="scope.row.freqYears" :disabled="scope.row.freqUnlimited" :min="1" :precision="0" :controls="false" size="mini" style="width: 44px;"></el-input-number>
                              <span class="freq-text">年内平均</span>
                              <el-input-number v-model="scope.row.freqAvgYears" :disabled="scope.row.freqUnlimited" :min="1" :precision="0" :controls="false" size="mini" style="width: 44px;"></el-input-number>
                              <span class="freq-text">年使用</span>
                              <el-input-number v-model="scope.row.freqCount" :disabled="scope.row.freqUnlimited" :min="1" :precision="0" :controls="false" size="mini" style="width: 44px;"></el-input-number>
                              <span class="freq-text">次</span>
                            </template>
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column label="是否需订单申请" align="center" width="120">
                        <template slot-scope="scope">
                          <el-checkbox v-model="scope.row.needOrder"></el-checkbox>
                        </template>
                      </el-table-column>
                      <!-- ⑦ 动态读取订单申请途径列表 -->
                      <el-table-column label="订单申请途径" width="220">
                        <template slot-scope="scope">
                          <el-checkbox-group v-model="scope.row.orderChannels" :disabled="!scope.row.needOrder">
                            <el-checkbox
                                v-for="item in orderChannelOptions"
                                :key="item.code || item.value || item"
                                :label="item.code || item.value || item">{{ item.name || item.label || item }}
                            </el-checkbox>
                          </el-checkbox-group>
                        </template>
                      </el-table-column>
                      <el-table-column label="是否审核" align="center" width="90">
                        <template slot-scope="scope">
                          <el-checkbox v-model="scope.row.needAudit"></el-checkbox>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="benefitCode" label="服务权益ID" width="110"></el-table-column>
              <el-table-column prop="kind" label="服务种类" width="110"></el-table-column>
              <el-table-column prop="benefitName" label="服务权益" width="140"></el-table-column>
              <el-table-column label="服务项目" min-width="140">
                <template slot-scope="scope">{{ projectNames(scope.row) }}</template>
              </el-table-column>
              <el-table-column prop="supplier" label="服务商" min-width="140" show-overflow-tooltip></el-table-column>
              <el-table-column prop="signOrg" label="签约机构" width="140" show-overflow-tooltip></el-table-column>

              <!-- ⑤ 动态读取适用地区/机构列表 -->
              <el-table-column label="适用地区" width="180">
                <template slot-scope="scope">
                  <el-select v-model="scope.row.regions" multiple size="mini" placeholder="请选择地区" collapse-tags style="width: 100%;">
                    <el-option
                        v-for="org in orgOptions"
                        :key="org"
                        :label="org"
                        :value="org">
                    </el-option>
                  </el-select>
                </template>
              </el-table-column>

              <!-- ⑥ 动态读取适用身份列表 -->
              <el-table-column label="适用身份" min-width="180">
                <template slot-scope="scope">
                  <el-select v-model="scope.row.identities" multiple size="mini" placeholder="请选择身份" collapse-tags style="width: 100%;">
                    <el-option
                        v-for="idType in idTypeOptions"
                        :key="idType.code"
                        :label="idType.name"
                        :value="idType.code">
                    </el-option>
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column label="项目数" align="center" width="80">
                <template slot-scope="scope">
                  {{ scope.row.items ? scope.row.items.length : 0 }} 项
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="80">
                <template slot-scope="scope">
                  <el-button type="text" style="color: #F56C6C;" @click="handleRemoveRight(scope.$index)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-form-item>
        </el-form>
      </div>

      <!-- 底部固定吸附按钮区 -->
      <div slot="footer">
        <el-button @click="editDialogVisible = false" size="medium" :disabled="saving">取消</el-button>
        <el-button type="primary" @click="handleSaveRule" size="medium" :loading="saving" :disabled="formLoading">保存</el-button>
      </div>
    </el-dialog>

    <!-- 2. 查看服务规则详情弹窗 -->
    <el-dialog
        :title="viewIsChange ? '查看服务规则修改详情' : '查看服务规则'"
        :visible.sync="viewDialogVisible"
        width="1080px"
        top="8vh"
        custom-class="rule-view-dialog"
        @close="detailRequest++"
    >
      <div class="view-detail-container" v-loading="viewLoading">
        <div v-if="viewIsChange" class="info-grid">
          <div v-for="field in changeDetailFields" :key="field.key" class="info-item">
            <span class="info-label">{{ field.label }}</span>
            <span v-if="field.key === 'status'" :class="['record-status', 'record-status--' + viewChange.status]">{{ changeStatusText(viewChange.status) }}</span>
            <span v-else class="info-value text-bold">{{ viewChange[field.key] || '—' }}</span>
          </div>
        </div>
        <div v-else class="info-grid">
          <div class="info-item">
            <span class="info-label">客户等级</span>
            <span class="info-value text-bold">{{ viewData.gradeName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建人</span>
            <span class="info-value">{{ viewData.creator }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value text-bold">{{ viewData.createTime }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">描述</span>
            <span class="info-value">{{ viewData.description }}</span>
          </div>
        </div>

        <div class="detail-table-section">
          <div class="section-title">服务项目详情</div>
          <el-table
              :data="viewData.itemList"
              border
              stripe
              size="small"
              style="width: 100%;"
          >
            <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
            <el-table-column prop="benefitCode" label="服务权益ID" width="110"></el-table-column>
            <el-table-column prop="benefitName" label="服务权益名称" width="130"></el-table-column>
            <el-table-column prop="kind" label="服务种类" width="110"></el-table-column>
            <el-table-column prop="category" label="服务类别" width="110"></el-table-column>
            <el-table-column prop="itemName" label="服务项目名称" width="130"></el-table-column>
            <el-table-column prop="supplier" label="服务商名称" width="140"></el-table-column>
            <el-table-column prop="area" label="适用地区" width="120" align="center" show-overflow-tooltip></el-table-column>
            <el-table-column prop="identity" label="适用身份" min-width="160" show-overflow-tooltip></el-table-column>
            <el-table-column prop="frequency" label="服务频次" min-width="160"></el-table-column>
            <el-table-column prop="needOrder" label="是否需订单申请" align="center" width="120"></el-table-column>
            <el-table-column prop="orderChannel" label="订单申请途径" width="140" align="center" show-overflow-tooltip></el-table-column>
            <el-table-column prop="needAudit" label="是否审核" align="center" width="90"></el-table-column>
          </el-table>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false" size="medium">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 3. 选择权益弹窗 -->
    <el-dialog title="选择权益" :visible.sync="selectRightsDialogVisible" width="1080px" custom-class="rule-picker-dialog">
      <div style="margin-bottom: 12px; display: flex; gap: 10px;">
        <el-input v-model="rightsKeyword" placeholder="请输入权益编码/名称/服务商" size="small" style="width: 320px;" clearable></el-input>
        <span class="records-tip">支持多选，勾选后点击「添加所选权益」 共 {{ filteredRightsList.length }} 条</span>
      </div>
      <el-table ref="rightsPicker" :data="filteredRightsList" row-key="benefitCode" border size="small" max-height="400" @selection-change="handleRightsSelectionChange">
        <el-table-column prop="benefitCode" label="服务权益ID" width="110"></el-table-column>
        <el-table-column prop="kind" label="服务种类" width="110"></el-table-column>
        <el-table-column prop="benefitName" label="服务权益" width="140"></el-table-column>
        <el-table-column label="服务项目" min-width="140">
          <template slot-scope="scope">{{ projectNames(scope.row) }}</template>
        </el-table-column>
        <el-table-column prop="supplier" label="服务商" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="signOrg" label="签约机构" width="140"></el-table-column>
        <el-table-column type="selection" :selectable="rightSelectable" reserve-selection width="55" align="center"></el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="selectRightsDialogVisible = false" size="small">取消</el-button>
        <el-button type="primary" @click="confirmSelectRights" size="small">添加所选权益</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getGradeListApi,
  getRuleVersionsApi,
  getBenefitGradeListApi,
  getRuleViewApi,
  saveRuleApi,
  exportBenefitRuleApi,
  importBenefitRuleApi,
  exportRuleApi,
  getBenefitItemsApi,
  getPlatformOrgApi,
  getServiceRuleIdentitiesApi,
  getPlatformOrderChannelApi,
  getServiceRuleModListApi,
  getServiceRuleModGradesApi,
  getServiceRuleModViewApi,
  createServiceRuleModApi,
  updateServiceRuleModApi,
  deleteServiceRuleModApi
} from '@/api/test/index';

export default {
  name: 'ServiceRuleConfig',
  data() {
    return {
      loading: false,
      activeTab: 'rules',
      pageNo: 1,
      pageSize: 10,
      importing: false,
      isModification: false,
      changeRecords: [],
      changeLoading: false,
      changeRequest: 0,
      modGradeOptions: [],
      formLoading: false,
      detailRequest: 0,
      changePageNo: 1,
      changePageSize: 10,
      viewIsChange: false,
      viewChange: {},
      changeDetailFields: [
        { key: 'versionTag', label: '规则版本' },
        { key: 'gradeName', label: '星级' },
        { key: 'effectiveDate', label: '生效日期' },
        { key: 'operator', label: '修改人' },
        { key: 'modifyTime', label: '修改时间' },
        { key: 'status', label: '状态' }
      ],
      futureDateOptions: {
        disabledDate(date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date.getTime() <= today.getTime();
        }
      },
      selectedVersion: '',
      versionOptions: [],
      tableData: [],
      gradeConfigList: [],

      // 字典下拉列表数据存储[cite: 1, 2, 3]
      orgOptions: [], // ⑤ 适用地区机构[cite: 1]
      idTypeOptions: [], // ⑥ 适用身份[cite: 2]
      orderChannelOptions: [], // ⑦ 订单申请途径[cite: 3]

      // 1. 编辑/新增弹窗数据
      editDialogVisible: false,
      dialogTitle: '新增服务规则',
      isEditMode: false,
      saving: false,
      formGradeOptions: [],
      editForm: {
        versionTag: '',
        gradeCode: '',
        description: '',
        rightsList: []
      },

      // 2. 查看弹窗数据
      viewDialogVisible: false,
      viewLoading: false,
      viewData: {
        gradeName: '',
        creator: '',
        createTime: '',
        description: '',
        itemList: []
      },

      // 3. 权益选择弹窗数据
      selectRightsDialogVisible: false,
      rightsKeyword: '',
      allRightsList: [],
      selectedRightsFromDialog: []
    };
  },
  computed: {
    pagedChangeRecords() {
      return this.changeRecords.slice((this.changePageNo - 1) * this.changePageSize, this.changePageNo * this.changePageSize);
    },
    pagedTableData() {
      return this.tableData.slice((this.pageNo - 1) * this.pageSize, this.pageNo * this.pageSize);
    },
    formVersionInfo() {
      return this.versionOptions.find(v => v.version_tag === this.editForm.versionTag);
    },
    filteredRightsList() {
      const keyword = this.rightsKeyword.trim().toLowerCase();
      return this.allRightsList.filter(item => [item.benefitCode, item.benefitName, item.supplier]
        .some(value => String(value || '').toLowerCase().includes(keyword)));
    },
    currentVersionInfo() {
      return this.versionOptions.find(v => v.version_tag === this.selectedVersion);
    },
    unconfiguredGradeList() {
      return this.gradeConfigList.filter(g => Number(g.configured) === 0);
    },
    unconfiguredGradesText() {
      return this.unconfiguredGradeList.map(g => g.gradeName).join('、');
    }
  },
  created() {
    this.initPageData();
  },
  methods: {
    beforeEditClose(done) { if (!this.saving) done(); },
    handleTabChange() {
      if (this.activeTab === 'changes') return this.fetchChangeRecords();
    },
    normalizeChange(record) {
      return { ...record, status: record.statusCode, operator: record.modifier };
    },
    async fetchChangeRecords() {
      const request = ++this.changeRequest;
      this.changeLoading = true;
      try {
        const res = await getServiceRuleModListApi();
        if (request !== this.changeRequest) return;
        this.changeRecords = (res.data || []).map(this.normalizeChange);
        const lastPage = Math.max(1, Math.ceil(this.changeRecords.length / this.changePageSize));
        this.changePageNo = Math.min(this.changePageNo, lastPage);
      } catch (error) {
        if (request !== this.changeRequest) return;
        this.changeRecords = [];
        this.$message.error('获取服务规则修改记录失败，请重试');
      } finally { if (request === this.changeRequest) this.changeLoading = false; }
    },
    changeStatusText(status) {
      return { PENDING: '待生效', EFFECTIVE: '生效中', EXPIRED: '已失效' }[status] || '—';
    },
    handleChangePageSizeChange(size) {
      this.changePageSize = size;
      this.changePageNo = 1;
    },
    gradeUnavailable(grade) {
      if (this.isEditMode) return false;
      if (!this.isModification) return Number(grade.configured) === 1;
      return this.gradeHasPendingChange(grade.gradeCode);
    },
    gradeHasPendingChange(gradeCode) {
      const grade = this.modGradeOptions.find(item => item.gradeCode === gradeCode);
      return Boolean(grade && Number(grade.pendingMod) === 1) ||
        this.changeRecords.some(record => record.versionTag === this.editForm.versionTag &&
          record.gradeCode === gradeCode && record.status === 'PENDING');
    },
    async handleViewChange(record) {
      const request = ++this.detailRequest;
      this.viewIsChange = true;
      this.viewChange = {};
      this.viewData = { itemList: [] };
      this.viewLoading = true;
      this.viewDialogVisible = true;
      try {
        const res = await getServiceRuleModViewApi(record.id);
        if (request !== this.detailRequest) return;
        if (!res.data || res.data.id !== record.id) throw new Error('修改记录不匹配');
        this.viewChange = this.normalizeChange(res.data);
        this.viewData = { itemList: this.buildDetailRows(res.data.items || []) };
      } catch (error) {
        if (request === this.detailRequest) {
          this.viewDialogVisible = false;
          this.$message.error('获取修改记录详情失败，请重试');
        }
      } finally { if (request === this.detailRequest) this.viewLoading = false; }
    },
    async handleEditChange(record) {
      if (record.status !== 'PENDING' || this.saving) return;
      const request = ++this.detailRequest;
      this.isModification = true;
      this.isEditMode = true;
      this.dialogTitle = '修改服务规则修改记录';
      this.editForm = { versionTag: record.versionTag, gradeCode: record.gradeCode, effectiveDate: '', description: '', rightsList: [] };
      this.formLoading = true;
      this.editDialogVisible = true;
      try {
        const res = await getServiceRuleModViewApi(record.id);
        if (request !== this.detailRequest) return;
        const detail = res.data;
        if (!detail || detail.id !== record.id || detail.statusCode !== 'PENDING') {
          this.editDialogVisible = false;
          this.$message.warning('该修改记录已非待生效状态，请刷新列表');
          await this.fetchChangeRecords();
          return;
        }
        this.formGradeOptions = [{ gradeCode: detail.gradeCode, gradeName: detail.gradeName }];
        this.editForm = { id: detail.id, versionTag: detail.versionTag, gradeCode: detail.gradeCode,
          effectiveDate: detail.effectiveDate, description: detail.description || '', rightsList: [] };
        // Edit the saved modification snapshot, never the currently effective rule.
        this.setEditableRules(detail.items || []);
        this.$nextTick(() => this.expandAllRows(true));
      } catch (error) {
        if (request === this.detailRequest) {
          this.editDialogVisible = false;
          this.$message.error('加载修改记录失败，请重试');
        }
      } finally { if (request === this.detailRequest) this.formLoading = false; }
    },
    async handleDeleteChange(record) {
      if (record.status !== 'PENDING') return;
      try {
        await this.$confirm('确定删除该待生效的服务规则修改记录？删除后该记录不再生效。', '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' });
      } catch (error) { return; }
      try {
        await deleteServiceRuleModApi(record.id);
        this.$message.success('已删除服务规则修改记录');
        await this.fetchChangeRecords();
      } catch (error) { this.$message.error('删除失败，请刷新记录状态后重试'); }
    },
    flag(value) {
      return value === true || value === 1 || value === '1';
    },
    ruleFlag(value) {
      return value === '00' || (value !== '01' && this.flag(value));
    },
    parseList(value) {
      if (Array.isArray(value)) return value;
      try {
        const list = JSON.parse(value || '[]');
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },
    versionLabel(version) {
      const status = this.flag(version.current_flag) ? '当前版本'
        : this.canConfigureVersion(version) ? '待生效' : '历史版本';
      return `${version.version_tag}（${status}）`;
    },
    versionExpireText(version) {
      if (!version || version.expireDate === undefined) return '—';
      return version.expireDate || '长期有效';
    },
    canConfigureVersion(version) {
      if (!version || this.flag(version.current_flag)) return false;
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      return version.displayStatus === 'PENDING_EFFECTIVE' ||
        Boolean(version.effectiveDate && version.effectiveDate.slice(0, 10) > localDate);
    },
    projectNames(row) {
      return (row.items || this.parseList(row.itemsJson)).map(item => item.name).join('、') || '—';
    },
    ruleProjects(rule) {
      const projects = this.parseList(rule.itemsJson);
      if (projects.length) return projects;
      const snapshot = this.parseList(rule.itemRulesJson);
      if (snapshot.length) return snapshot.map(item => ({ cat: item.cat, name: item.name }));
      const library = this.allRightsList.find(item => item.benefitCode === rule.benefitCode);
      return this.parseList(library && library.itemsJson);
    },
    rightSelectable(row) {
      return !this.editForm.rightsList.some(item => item.benefitCode === row.benefitCode);
    },
    gradeDisplayName(row) {
      const grade = this.gradeConfigList.find(item => item.gradeCode === (row.grade_code || row.gradeCode));
      return grade && grade.gradeName || row.gradeName || '—';
    },
    handlePageSizeChange(value) {
      this.pageSize = value;
      this.pageNo = 1;
    },
    toggleRightRow(row, column) {
      if (column && ['服务权益ID', '服务种类', '服务权益', '服务项目', '服务商', '签约机构', '项目数'].includes(column.label)) {
        this.$refs.editTableRef.toggleRowExpansion(row);
      }
    },
    async handleStartModification() {
      if (this.saving) return;
      if (!this.currentVersionInfo || !this.flag(this.currentVersionInfo.current_flag)) {
        this.$message.warning('请先选择当前生效版本，再发起服务规则修改');
        return;
      }
      this.isModification = true;
      this.isEditMode = false;
      this.dialogTitle = '发起服务规则修改';
      this.editForm = { versionTag: this.selectedVersion, gradeCode: '', effectiveDate: '', description: '', rightsList: [] };
      try {
        await this.loadFormGradeOptions(this.selectedVersion);
        this.editDialogVisible = true;
      } catch (error) { this.$message.error('获取可修改等级失败，请重试'); }
    },
    async handleFormGradeChange(value) {
      if (this.isModification && value) {
        this.editForm.description = '';
        this.editForm.rightsList = [];
        await this.loadRuleDetail(this.editForm.versionTag, value);
        this.$nextTick(() => this.expandAllRows(true));
      }
    },
    // 基础初始化
    async initPageData() {
      // 提取下拉字典接口数据[cite: 1, 2, 3]
      await Promise.all([this.fetchDictOptions(), this.fetchVersions(), this.fetchBenefitItems()]);
      if (this.selectedVersion) {
        await Promise.all([this.fetchTableData(), this.fetchGradeConfigStatus(), this.fetchChangeRecords()]);
      }
    },
    // 加载下拉字典项[cite: 1, 2, 3]
    async fetchDictOptions() {
      try {
        const [orgRes, idRes, channelRes] = await Promise.all([
          getPlatformOrgApi(),
          getServiceRuleIdentitiesApi(),
          getPlatformOrderChannelApi()
        ]);

        // 适配接口层级的返回格式并储存
        this.orgOptions = Array.from(new Set(['全国', ...((orgRes.body && orgRes.body.data) || orgRes.data || [])]));
        this.idTypeOptions = (idRes.body && idRes.body.data) || idRes.data || [];
        this.orderChannelOptions = (channelRes.body && channelRes.body.data) || channelRes.data || [];
      } catch (e) {
        this.$message.error('初始化部分字典选项失败');
      }
    },
    // 获取规则版本
    async fetchVersions() {
      try {
        const res = await getRuleVersionsApi();
        this.versionOptions = res.data || [];
        if (this.versionOptions.length > 0 && !this.selectedVersion) {
          const current = this.versionOptions.find(v => this.flag(v.current_flag));
          this.selectedVersion = current ? current.version_tag : this.versionOptions[0].version_tag;
        }
      } catch (err) {
        this.$message.error('获取规则版本失败');
      }
    },
    // 获取版本下各个等级配置状态
    async fetchGradeConfigStatus(versionTag = this.selectedVersion) {
      try {
        const res = await getBenefitGradeListApi({ versionTag });
        if (versionTag !== this.selectedVersion) return;
        this.gradeConfigList = res.data || [];
      } catch (err) {
        this.$message.error('获取等级状态失败');
      }
    },
    // 查询等级列表汇总
    async fetchTableData() {
      this.loading = true;
      const versionTag = this.selectedVersion;
      try {
        const res = await getGradeListApi({ versionTag });
        if (versionTag !== this.selectedVersion) return;
        this.tableData = res.data || [];
      } catch (err) {
        this.tableData = [];
        this.$message.error('获取服务规则数据失败');
      } finally {
        this.loading = false;
      }
    },
    handleVersionChange() {
      this.pageNo = 1;
      this.fetchTableData();
      this.fetchGradeConfigStatus();
    },

    // ===== 新增与编辑 =====
    async handleAddRule() {
      if (!this.canConfigureVersion(this.currentVersionInfo)) {
        this.$message.warning(this.flag(this.currentVersionInfo && this.currentVersionInfo.current_flag)
          ? `版本 ${this.selectedVersion} 为生效中，不可直接新增服务规则，请使用「发起服务规则修改」`
          : '只能为待生效版本新增服务规则；当前接口未提供版本生效日期，暂无法确认可配置状态');
        return;
      }
      this.isModification = false;
      this.dialogTitle = '新增服务规则';
      this.isEditMode = false;
      this.editForm = {
        versionTag: this.selectedVersion,
        gradeCode: '',
        description: '',
        rightsList: []
      };
      await this.loadFormGradeOptions(this.editForm.versionTag);
      this.editDialogVisible = true;
    },
    async handleEdit(row) {
      if (!this.canConfigureVersion(this.currentVersionInfo)) return;
      this.isModification = false;
      this.dialogTitle = '编辑服务规则';
      this.isEditMode = true;
      this.editForm = { versionTag: this.selectedVersion, gradeCode: row.grade_code, description: '', rightsList: [] };
      await this.loadFormGradeOptions(this.editForm.versionTag);
      await this.loadRuleDetail(this.selectedVersion, row.grade_code);
      this.editDialogVisible = true;
    },
    async loadFormGradeOptions(versionTag) {
      const res = this.isModification ? await getServiceRuleModGradesApi({ versionTag }) : await getBenefitGradeListApi({ versionTag });
      this.formGradeOptions = res.data || [];
      this.modGradeOptions = this.isModification ? this.formGradeOptions : [];
    },
    async handleFormVersionChange(val) {
      await this.loadFormGradeOptions(val);
      this.editForm.gradeCode = '';
      this.editForm.rightsList = [];
      this.editForm.description = '';
    },
    // 加载整包规则详情并反显至编辑表单
    async loadRuleDetail(versionTag, gradeCode) {
      const selection = { versionTag: this.editForm.versionTag, gradeCode: this.editForm.gradeCode };
      try {
        const res = await getRuleViewApi({ versionTag, gradeCode });
        if (selection.versionTag !== this.editForm.versionTag || selection.gradeCode !== this.editForm.gradeCode) return;
        const data = res.data || {};
        const items = data.items || [];
        this.editForm.description = items.length > 0 ? items[0].description || '' : '';
        this.setEditableRules(items);
      } catch (err) {
        this.$message.error('加载整包详情失败');
      }
    },
    setEditableRules(items) {
        this.editForm.rightsList = items.map(item => {
          const parsedItems = this.ruleProjects(item);

          let parsedItemRules = [];
          try {
            parsedItemRules = item.itemRulesJson ? JSON.parse(item.itemRulesJson) : [];
          } catch (e) {
            parsedItemRules = [];
          }

          let parsedRegions = [];
          try {
            parsedRegions = item.regionsJson ? JSON.parse(item.regionsJson) : [];
          } catch (e) {
            parsedRegions = [];
          }

          let parsedIdentities = [];
          try {
            parsedIdentities = item.identitiesJson ? JSON.parse(item.identitiesJson) : [];
            parsedIdentities = parsedIdentities.map(id => {
              const option = this.idTypeOptions.find(value => value.code === id || value.name === id);
              return option ? option.code : id;
            });
          } catch (e) {
            parsedIdentities = [];
          }

          let parsedChannels = [];
          try {
            parsedChannels = item.orderChannelsJson ? JSON.parse(item.orderChannelsJson) : [];
          } catch (e) {
            parsedChannels = [];
          }

          const projectItems = parsedItems.map(p => {
            const rule = parsedItemRules.find(r => r.cat === p.cat && r.name === p.name) || {};
            const itemChannels = (rule.orderChannels || parsedChannels).map(channel => {
              const option = this.orderChannelOptions.find(value => value.code === channel || value.name === channel);
              return option ? option.code : channel;
            });
            return {
              cat: p.cat,
              name: p.name,
              freqUnlimited: this.ruleFlag(rule.freqUnlimited !== undefined ? rule.freqUnlimited : item.freqUnlimited),
              freqYears: rule.freqYears || item.freqYears || 1,
              freqAvgYears: rule.freqAvgYears || item.freqAvgYears || 1,
              freqCount: rule.freqCount || item.freqCount || 1,
              needOrder: this.ruleFlag(rule.needOrder !== undefined ? rule.needOrder : item.needOrder),
              orderChannels: itemChannels,
              needAudit: this.ruleFlag(rule.needAudit !== undefined ? rule.needAudit : item.needAudit)
            };
          });

          return {
            benefitCode: item.benefitCode,
            kind: item.kind,
            benefitName: item.benefitName,
            supplier: item.supplier,
            signOrg: item.signOrg || (this.allRightsList.find(value => value.benefitCode === item.benefitCode) || {}).signOrg,
            regions: parsedRegions,
            identities: parsedIdentities,
            items: projectItems
          };
        });
    },

    // ===== 选择权益逻辑 =====
    async openSelectRightsDialog() {
      this.rightsKeyword = '';
      this.selectedRightsFromDialog = [];
      await this.fetchBenefitItems();
      this.selectRightsDialogVisible = true;
      this.$nextTick(() => this.$refs.rightsPicker.clearSelection());
    },
    async fetchBenefitItems() {
      try {
        const res = await getBenefitItemsApi({ keyword: this.rightsKeyword });
        this.allRightsList = (res.data || []).filter(item => item.status === undefined || this.flag(item.status));
      } catch (e) {
        this.allRightsList = [];
        this.$message.error('获取权益库列表失败');
      }
    },
    handleRightsSelectionChange(val) {
      this.selectedRightsFromDialog = val;
    },
    confirmSelectRights() {
      if (!this.selectedRightsFromDialog.length) {
        this.$message.warning('请先勾选服务权益');
        return;
      }
      this.selectedRightsFromDialog.forEach(item => {
        const exists = this.editForm.rightsList.some(r => r.benefitCode === item.benefitCode);
        if (!exists) {
          let parsedItems = [];
          try {
            parsedItems = item.itemsJson ? JSON.parse(item.itemsJson) : [];
          } catch (e) {
            parsedItems = [];
          }
          const subItems = parsedItems.map(p => ({
            cat: p.cat,
            name: p.name,
            freqUnlimited: false,
            freqYears: 1,
            freqAvgYears: 1,
            freqCount: 1,
            needOrder: false,
            orderChannels: this.orderChannelOptions.length > 0 ? [this.orderChannelOptions[0].code || this.orderChannelOptions[0]] : [],
            needAudit: false
          }));

          this.editForm.rightsList.push({
            benefitCode: item.benefitCode,
            kind: item.kind,
            benefitName: item.benefitName,
            supplier: item.supplier,
            signOrg: item.signOrg,
            regions: [],
            identities: this.idTypeOptions.some(option => option.code === 'POLICYHOLDER') ? ['POLICYHOLDER'] : [],
            items: subItems
          });
        }
      });
      this.selectRightsDialogVisible = false;
      this.$nextTick(() => this.expandAllRows(true));
    },
    handleRemoveRight(index) {
      this.editForm.rightsList.splice(index, 1);
    },
    expandAllRows(isExpand) {
      this.editForm.rightsList.forEach(row => {
        this.$refs.editTableRef.toggleRowExpansion(row, isExpand);
      });
    },

    // 保存规则配置
    async handleSaveRule() {
      if (this.saving || this.formLoading) return;
      if (!this.isModification && !this.canConfigureVersion(this.formVersionInfo)) {
        this.$message.warning('只允许配置待生效版本');
        return;
      }
      if (this.isModification) {
        if (!this.formVersionInfo || !this.flag(this.formVersionInfo.current_flag)) {
          this.$message.warning('仅可对当前生效版本发起服务规则修改');
          return;
        }
        const today = new Date();
        const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (!this.editForm.effectiveDate || this.editForm.effectiveDate <= localDate) {
          this.$message.warning('生效日期必须晚于今日');
          return;
        }
        const previous = this.changeRecords.filter(record => record.versionTag === this.editForm.versionTag &&
          record.gradeCode === this.editForm.gradeCode && record.id !== this.editForm.id);
        if (previous.some(record => record.effectiveDate >= this.editForm.effectiveDate)) {
          this.$message.warning('生效日期必须晚于该星级上一条修改的生效日期');
          return;
        }
        if (!this.isEditMode && this.gradeHasPendingChange(this.editForm.gradeCode)) {
          this.$message.warning('该等级已有待生效修改，请修改原记录');
          return;
        }
      }
      if (!this.editForm.versionTag || !this.editForm.gradeCode) {
        this.$message.warning('请选择版本和客户等级');
        return;
      }
      if (this.editForm.rightsList.length === 0) {
        this.$message.warning('请至少选择一条服务权益');
        return;
      }
      if ((this.editForm.description || '').length > 200) {
        this.$message.warning('描述不能超过200字');
        return;
      }
      for (const right of this.editForm.rightsList) {
        if (!right.regions.length || !right.identities.length) {
          this.$message.warning(`请为「${right.benefitName}」选择适用地区和适用身份`);
          return;
        }
        if (right.identities.some(code => !this.idTypeOptions.some(option => option.code === code))) {
          this.$message.warning('适用身份不在当前字典中，请重新选择');
          return;
        }
        if (!right.items.length) {
          this.$message.warning(`「${right.benefitName}」没有服务项目，请核对权益库`);
          return;
        }
        for (const item of right.items) {
          if (!item.freqUnlimited && [item.freqYears, item.freqAvgYears, item.freqCount].some(value => !Number.isInteger(value) || value < 1)) {
            this.$message.warning('服务频次必须为大于零的整数');
            return;
          }
          if (item.needOrder && !item.orderChannels.length) {
            this.$message.warning(`请为「${item.name}」选择订单申请途径`);
            return;
          }
          if (item.needOrder && item.orderChannels.some(code => !this.orderChannelOptions.some(option => option.code === code))) {
            this.$message.warning('订单申请途径不在当前字典中，请重新选择');
            return;
          }
        }
      }

      const payload = {
        versionTag: this.editForm.versionTag,
        gradeCode: this.editForm.gradeCode,
        description: this.editForm.description,
        items: this.editForm.rightsList.map(r => {
          const itemRules = (r.items || []).map(it => ({
            cat: it.cat,
            name: it.name,
            needOrder: it.needOrder ? '00' : '01',
            orderChannels: it.needOrder ? it.orderChannels || [] : [],
            needAudit: it.needAudit ? '00' : '01',
            freqUnlimited: it.freqUnlimited ? '00' : '01',
            freqYears: it.freqUnlimited ? null : it.freqYears,
            freqAvgYears: it.freqUnlimited ? null : it.freqAvgYears,
            freqCount: it.freqUnlimited ? null : it.freqCount
          }));

          const firstItem = itemRules[0] || {};
          return {
            benefitCode: r.benefitCode,
            regions: r.regions,
            identities: r.identities,
            freqUnlimited: firstItem.freqUnlimited,
            freqYears: firstItem.freqYears,
            freqAvgYears: firstItem.freqAvgYears,
            freqCount: firstItem.freqCount,
            needOrder: firstItem.needOrder,
            orderChannels: firstItem.orderChannels || [],
            needAudit: firstItem.needAudit,
            itemRules
          };
        })
      };

      this.saving = true;
      try {
        if (this.isModification) {
          payload.effectiveDate = this.editForm.effectiveDate;
          if (this.isEditMode) {
            payload.id = this.editForm.id;
            await updateServiceRuleModApi(payload);
          } else {
            await createServiceRuleModApi(payload);
          }
        } else {
          await saveRuleApi(payload);
        }
        this.$message.success('保存服务规则成功！');
        this.editDialogVisible = false;
        await Promise.all([this.fetchTableData(), this.fetchGradeConfigStatus(), this.fetchChangeRecords()]);
      } catch (err) {
        this.$message.error('保存失败');
      } finally {
        this.saving = false;
      }
    },

    // ===== 查看详情 =====
    async handleView(row) {
      const request = ++this.detailRequest;
      this.viewIsChange = false;
      this.viewData = { gradeName: this.gradeDisplayName(row), creator: row.creator || '—', createTime: row.create_time || '—', description: row.description || '—', itemList: [] };
      this.viewDialogVisible = true;
      this.viewLoading = true;
      try {
        const res = await getRuleViewApi({ versionTag: this.selectedVersion, gradeCode: row.grade_code });
        if (request !== this.detailRequest) return;
        const data = res.data || {};
        const items = data.items || [];

        if (items.length > 0) {
          this.viewData.gradeName = this.gradeDisplayName(row);
          this.viewData.creator = items[0].creator || row.creator || '—';
          this.viewData.createTime = items[0].createTime || row.create_time || '—';
          this.viewData.description = items[0].description || row.description || '—';
        } else {
          this.viewData.gradeName = this.gradeDisplayName(row);
          this.viewData.creator = row.creator || '—';
          this.viewData.createTime = row.create_time || '—';
          this.viewData.description = row.description || '—';
        }
        this.viewData.itemList = this.buildDetailRows(items);
      } catch (e) {
        if (request !== this.detailRequest) return;
        this.$message.error('获取详情数据失败');
      } finally {
        if (request === this.detailRequest) this.viewLoading = false;
      }
    },
    buildDetailRows(items) {
        const detailRows = [];
        items.forEach(rule => {
          const parsedItems = this.ruleProjects(rule);

          let parsedItemRules = [];
          try {
            parsedItemRules = rule.itemRulesJson ? JSON.parse(rule.itemRulesJson) : [];
          } catch (e) {
            parsedItemRules = [];
          }

          const processItem = (cat, itemName) => {
            const itemRule = parsedItemRules.find(r => r.cat === cat && r.name === itemName) || {};
            const freqUnlim = itemRule.freqUnlimited !== undefined ? itemRule.freqUnlimited : rule.freqUnlimited;
            const years = itemRule.freqYears || rule.freqYears;
            const avgYears = itemRule.freqAvgYears || rule.freqAvgYears;
            const count = itemRule.freqCount || rule.freqCount;

            let freqStr = '不限次';
            if (!this.ruleFlag(freqUnlim)) {
              freqStr = `${years}年内平均${avgYears}年使用${count}次`;
            }

            const nOrder = itemRule.needOrder !== undefined ? itemRule.needOrder : rule.needOrder;
            const nAudit = itemRule.needAudit !== undefined ? itemRule.needAudit : rule.needAudit;
            const channels = itemRule.orderChannels || (rule.orderChannelsJson ? JSON.parse(rule.orderChannelsJson) : []);

            // 转换途径 Code 显示为 Name 名称[cite: 3]
            let displayChannels = [];
            if (Array.isArray(channels)) {
              displayChannels = channels.map(code => {
                const found = this.orderChannelOptions.find(c => (c.code || c) === code);
                return found ? found.name || found : code;
              });
            }

            detailRows.push({
              benefitCode: rule.benefitCode,
              benefitName: rule.benefitName,
              kind: rule.kind,
              category: cat,
              itemName,
              supplier: rule.supplier,
              area: this.parseList(rule.regionsJson).join('、') || '—',
              identity: this.parseList(rule.identitiesJson).map(code => {
                const option = this.idTypeOptions.find(value => value.code === code);
                return option ? option.name : code;
              }).join('、') || '—',
              frequency: freqStr,
              needOrder: this.ruleFlag(nOrder) ? '是' : '否',
              orderChannel: this.ruleFlag(nOrder) && displayChannels.length > 0 ? displayChannels.join('、') : '—',
              needAudit: this.ruleFlag(nAudit) ? '是' : '否'
            });
          };

          if (parsedItems.length > 0) {
            parsedItems.forEach(p => processItem(p.cat, p.name));
          } else {
            processItem('—', '—');
          }
        });

        return detailRows;
    },

    // ===== 导入/导出/模板下载 =====
    async handleDownloadTemplate() {
      try {
        const res = await exportRuleApi();
        await this.downloadFile(res, '服务规则导入模板.xlsx');
      } catch (e) {
        this.$message.error(e.message || '下载模板失败');
      }
    },
    async handleExport() {
      if (!this.selectedVersion) return;
      try {
        const res = await exportBenefitRuleApi(this.selectedVersion);
        await this.downloadFile(res, `服务规则配置_${this.selectedVersion}.xlsx`);
      } catch (e) {
        this.$message.error(e.message || '导出失败');
      }
    },
    triggerImport() {
      if (!this.canConfigureVersion(this.currentVersionInfo)) {
        this.$message.warning('只允许向待生效版本导入规则，生效中版本请使用「发起服务规则修改」');
        return;
      }
      this.$refs.fileInput.click();
    },
    async handleFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!this.canConfigureVersion(this.currentVersionInfo) || this.importing) {
        e.target.value = '';
        return;
      }
      if (!/\.xlsx?$/i.test(file.name)) {
        this.$message.warning('请选择 Excel 文件（.xlsx 或 .xls）');
        e.target.value = '';
        return;
      }
      this.importing = true;
      try {
        const res = await importBenefitRuleApi(file, this.selectedVersion);
        const result = res.data || {};
        const summary = `共 ${result.total === undefined ? '—' : result.total} 条，成功 ${result.success === undefined ? '—' : result.success} 条，失败 ${result.fail === undefined ? '—' : result.fail} 条`;
        if (Number(result.fail) > 0) this.$message.warning(`导入完成：${summary}`);
        else this.$message.success(`导入完成：${summary}`);
        this.fetchTableData();
        this.fetchGradeConfigStatus();
      } catch (err) {
        this.$message.error('导入失败');
      } finally {
        this.importing = false;
        e.target.value = '';
      }
    },
    async downloadFile(data, defaultFileName) {
      if (data instanceof Blob && /json|text/.test(data.type)) {
        const result = JSON.parse(await data.text());
        throw new Error(result.header && result.header.message || '文件下载失败');
      }
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = defaultFileName;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }
  }
};
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f4f6f9;
  min-height: calc(100vh - 84px);
  color: #333a45;
}

.header-section {
  margin-bottom: 16px;
}

.header-section .title {
  margin: 0 0 6px 0;
  font-size: 21px;
  font-weight: 600;
  color: #333a45;
}

.header-section .subtitle {
  margin: 0;
  font-size: 13px;
  color: #5a6472;
}

/* 规则说明卡片 */
.rule-info-card {
  margin-bottom: 16px;
  background-color: #ebf1fa;
  border: 1px solid #c5d5f0;
}

::v-deep .rule-info-card .el-card__body {
  padding: 13px 20px;
}

.rule-info-content {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  gap: 12px;
}

.rule-title {
  font-weight: bold;
  color: #2f5496;
  white-space: nowrap;
  margin-right: 0;
}

.rule-text {
  color: #333a45;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.left-btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.left-btn-group .el-button {
  margin-left: 0;
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}

/* 主卡片及表格 */
.main-card {
  border: 1px solid #e4e7ed;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.table-title {
  font-size: 15px;
  font-weight: 600;
  color: #333a45;
}

.version-select-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.version-select-group .label {
  font-size: 13px;
  color: #606266;
}

.version-select-group .effect-date {
  font-size: 13px;
  color: #909399;
  margin-left: 8px;
}

.warning-alert {
  margin-bottom: 16px;
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
}

::v-deep .rule-edit-drawer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
}

::v-deep .rule-edit-drawer .el-dialog__header,
::v-deep .rule-edit-drawer .el-dialog__footer {
  flex-shrink: 0;
}

::v-deep .rule-edit-drawer .el-dialog__body {
  flex: 1;
  min-height: 0;
  height: auto;
  overflow-y: auto;
  padding: 18px;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.form-tip-text {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.rights-form-item ::v-deep .el-form-item__content {
  margin-left: 0 !important;
}

.rights-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2px 0 8px;
  padding: 0;
}

.left-rights-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #606266;
}

.expand-btn-group {
  margin-left: 10px;
}

.expand-sub-table {
  padding: 8px 10px 10px 30px;
  background-color: #fff;
}

.sub-table-title {
  font-weight: 600;
  font-size: 12px;
  color: #5a6472;
  margin-bottom: 6px;
}

.frequency-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.freq-text {
  font-size: 12px;
  color: #606266;
}

/* 查看弹窗样式 */
.view-detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  row-gap: 12px;
  padding: 0;
}

.info-item {
  width: 33.33%;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-item.full-width {
  width: 100%;
  margin-top: 4px;
}

.info-label {
  color: #5a6472;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #333a45;
}

.text-bold {
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.records-tip {
  color: #5a6472;
  font-size: 13px;
  line-height: 20px;
}
.record-status {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 10px;
  font-size: 12px;
  color: #5a6472;
  background: #eef0f2;
}
.record-status--EFFECTIVE {
  color: #2e7d32;
  background: #e8f5e9;
}
.record-status--PENDING {
  color: #e67e22;
  background: #fdf3e7;
}
.selected-count {
  color: #4f6fae;
}
.version-select-group {
  flex-wrap: wrap;
}
::v-deep .rule-tabs .el-tabs__item {
  height: 42px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}
::v-deep .rule-tabs .el-tabs__item.is-active {
  color: #2f5496;
  font-weight: 600;
}
::v-deep .rule-view-dialog {
  max-width: calc(100vw - 32px);
  max-height: 84vh;
  display: flex;
  flex-direction: column;
}
::v-deep .rule-view-dialog .el-dialog__body {
  height: auto;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
}
::v-deep .rule-view-dialog .el-dialog__header,
::v-deep .rule-view-dialog .el-dialog__footer {
  flex-shrink: 0;
}
::v-deep .rule-edit-drawer .dialog-form > .el-form-item > .el-form-item__content > .el-date-editor .el-input__inner,
::v-deep .rule-edit-drawer .form-row .el-input__inner {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}
::v-deep .rule-edit-drawer .el-form-item__label {
  font-size: 14px;
  color: #5a6472;
  line-height: 40px;
}
::v-deep .rule-edit-drawer .el-form-item {
  margin-bottom: 16px;
}
.version-date-label {
  margin: 0 12px;
  color: #5a6472;
}
::v-deep .rule-edit-drawer .el-textarea__inner {
  font-size: 14px;
  min-height: 58px !important;
}
::v-deep .frequency-cell .el-input-number .el-input__inner {
  padding: 0 4px;
  font-size: 12px;
}
::v-deep .expand-sub-table .el-checkbox__label {
  font-size: 12px;
}
::v-deep .rule-picker-dialog {
  max-width: calc(100vw - 32px);
}
::v-deep .rule-picker-dialog .el-dialog__body {
  height: auto;
  max-height: 65vh;
  overflow-y: auto;
  padding: 18px;
}
::v-deep .rule-picker-dialog .el-input__inner {
  height: 38px;
  line-height: 38px;
  font-size: 14px;
}
@media (max-width: 800px) {
  .rule-info-content { flex-direction: column; gap: 8px; }
  .form-tip-text { display: block; margin-left: 0; }
  .rights-header-bar { flex-wrap: wrap; gap: 8px; }
  .left-rights-info { flex-wrap: wrap; }
  .info-item { width: 100%; }
}
</style>
