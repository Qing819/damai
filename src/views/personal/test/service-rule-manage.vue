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
          以自然年度为单位（每年1月1日-12月31日）；中途成为VIP自达标次日起生效、有效期至当年年末；升星即时享受新服务、降星/不达标立即停止；当年未使用次数年末自动清零、不结转下一年度；新单投保过犹豫期方可累计积分，积分达标后触发对应等级权益派发
        </span>
      </div>
    </el-card>

    <!-- 操作按钮区 -->
    <div class="action-bar">
      <div class="left-btn-group">
        <el-button type="primary" icon="el-icon-plus" size="medium" @click="handleAddRule">新增服务规则</el-button>
        <el-button plain size="medium" icon="el-icon-download" @click="handleDownloadTemplate">模板下载</el-button>
        <el-button plain size="medium" icon="el-icon-upload2" @click="triggerImport">批量导入</el-button>
        <el-button plain size="medium" icon="el-icon-share" @click="handleExport">导出</el-button>
        <!-- 隐藏的文件选择框 -->
        <input type="file" ref="fileInput" style="display: none;" accept=".xlsx, .xls" @change="handleFileChange" />
      </div>
      <span class="tip-text">支持模板下载、批量导入/导出、导入后数据修改</span>
    </div>

    <!-- 主卡片区域 -->
    <el-card class="main-card" shadow="never">
      <!-- 列表顶部栏 -->
      <div class="table-header">
        <div class="table-title">服务规则配置</div>
        <div class="version-select-group">
          <span class="label">查看版本</span>
          <el-select v-model="selectedVersion" size="small" style="width: 180px;" @change="handleVersionChange">
            <el-option
                v-for="ver in versionOptions"
                :key="ver.version_tag"
                :label="ver.version_tag + (ver.current_flag === '1' ? ' (当前版本)' : '')"
                :value="ver.version_tag">
            </el-option>
          </el-select>
          <span class="effect-date" v-if="currentVersionInfo">
            已配置等级数: {{ currentVersionInfo.grade_count }} | 更新时间: {{ currentVersionInfo.last_update_time || '—' }}
          </span>
        </div>
      </div>

      <!-- 未配置等级警告提示 -->
      <el-alert v-if="unconfiguredGradesText" type="warning" :closable="false" show-icon class="warning-alert">
        <template slot="title">
          <span style="font-weight: bold; color: #E6A23C; margin-right: 8px;">未配置等级</span>
          <span>版本 {{ selectedVersion }} 下还有 {{ unconfiguredGradeList.length }} 个等级未配置服务规则：{{ unconfiguredGradesText }}，请点击「+ 新增服务规则」补充</span>
        </template>
      </el-alert>

      <!-- 数据表格 -->
      <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="gradeName" label="客户级别" width="160"></el-table-column>
        <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip></el-table-column>
        <el-table-column prop="benefit_count" label="已选权益数量" align="center" width="140"></el-table-column>
        <el-table-column prop="create_time" label="创建时间" align="center" width="180"></el-table-column>
        <el-table-column prop="creator" label="创建人" align="center" width="120"></el-table-column>
        <el-table-column label="操作" align="center" width="140">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 1. Drawer 抽屉编辑与新增 -->
    <el-drawer
        :title="dialogTitle"
        :visible.sync="editDialogVisible"
        size="100%"
        direction="btt"
        :wrapperClosable="false"
        custom-class="rule-edit-drawer"
    >
      <div class="drawer-body-scroll">
        <el-form :model="editForm" ref="editFormRef" label-width="90px" size="small" class="dialog-form">
          <!-- 基础信息区 -->
          <div class="form-row">
            <el-form-item label="规则版本" required>
              <el-select v-model="editForm.versionTag" style="width: 200px;" @change="handleFormVersionChange" :disabled="isEditMode">
                <el-option
                    v-for="ver in versionOptions"
                    :key="ver.version_tag"
                    :label="ver.version_tag + (ver.current_flag === '1' ? ' (当前版本)' : '')"
                    :value="ver.version_tag">
                </el-option>
              </el-select>
              <span class="form-tip-text">先选版本，再选该版本下的客户等级</span>
            </el-form-item>

            <el-form-item label="客户等级" required>
              <el-select v-model="editForm.gradeCode" style="width: 200px;" :disabled="isEditMode">
                <el-option
                    v-for="grade in formGradeOptions"
                    :key="grade.gradeCode"
                    :label="grade.gradeName"
                    :value="grade.gradeCode"
                    :disabled="grade.configured === 1 && !isEditMode">
                </el-option>
              </el-select>
              <span class="form-tip-text">同一版本、同一等级下可配置多条服务权益</span>
            </el-form-item>
          </div>

          <el-form-item label="描述">
            <el-input
                type="textarea"
                :rows="2"
                placeholder="请输入服务规则描述"
                v-model="editForm.description"
                style="width: 100%; max-width: 800px;"
            >
            </el-input>
          </el-form-item>

          <!-- 服务权益配置项列表 -->
          <el-form-item label="服务权益" required class="rights-form-item">
            <div class="rights-header-bar">
              <div class="left-rights-info">
                <span>已选 <b style="color: #409EFF;">{{ editForm.rightsList.length }}</b> 条 · 点击行可展开配置服务项目</span>
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
                :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
            >
              <!-- 嵌套展示：服务项目明细 -->
              <el-table-column type="expand" width="40">
                <template slot-scope="props">
                  <div class="expand-sub-table">
                    <div class="sub-table-title">服务项目明细</div>
                    <el-table :data="props.row.items" border size="mini" :header-cell-style="{ background: '#f0f4f8', color: '#333' }">
                      <el-table-column prop="cat" label="服务类别" width="120"></el-table-column>
                      <el-table-column prop="name" label="服务项目名称" width="150"></el-table-column>
                      <el-table-column label="服务频次" min-width="360">
                        <template slot-scope="scope">
                          <div class="frequency-cell">
                            <el-checkbox v-model="scope.row.freqUnlimited">不限次数</el-checkbox>
                            <template v-if="!scope.row.freqUnlimited">
                              <el-input-number v-model="scope.row.freqYears" :min="1" controls-position="right" size="mini" style="width: 75px;"></el-input-number>
                              <span class="freq-text">年内平均</span>
                              <el-input-number v-model="scope.row.freqAvgYears" :min="1" controls-position="right" size="mini" style="width: 75px;"></el-input-number>
                              <span class="freq-text">年使用</span>
                              <el-input-number v-model="scope.row.freqCount" :min="1" controls-position="right" size="mini" style="width: 75px;"></el-input-number>
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
                          <el-select v-model="scope.row.orderChannels" multiple size="mini" style="width: 100%;" :disabled="!scope.row.needOrder" placeholder="请选择途径">
                            <el-option
                                v-for="item in orderChannelOptions"
                                :key="item.code || item.value || item"
                                :label="item.name || item.label || item"
                                :value="item.code || item.value || item">
                            </el-option>
                          </el-select>
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
                        :key="idType"
                        :label="idType"
                        :value="idType">
                    </el-option>
                  </el-select>
                </template>
              </el-table-column>

              <el-table-column label="项目数" align="center" width="80">
                <template slot-scope="scope">
                  {{ scope.row.items ? scope.row.items.length : 0 }} 项
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="80" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" style="color: #F56C6C;" @click="handleRemoveRight(scope.$index)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-form-item>
        </el-form>
      </div>

      <!-- 底部固定吸附按钮区 -->
      <div class="drawer-fixed-footer">
        <el-button @click="editDialogVisible = false" size="medium">取 消</el-button>
        <el-button type="primary" @click="handleSaveRule" size="medium" :loading="saving">保 存</el-button>
      </div>
    </el-drawer>

    <!-- 2. 查看服务规则详情弹窗 -->
    <el-dialog
        title="查看服务规则"
        :visible.sync="viewDialogVisible"
        width="1000px"
        top="8vh"
        custom-class="rule-view-dialog"
    >
      <div class="view-detail-container" v-loading="viewLoading">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">等级名称</span>
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
              :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 'bold' }"
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
        <el-button plain @click="viewDialogVisible = false" size="medium">关 闭</el-button>
      </span>
    </el-dialog>

    <!-- 3. 选择权益弹窗 -->
    <el-dialog title="选择服务权益" :visible.sync="selectRightsDialogVisible" width="800px">
      <div style="margin-bottom: 12px; display: flex; gap: 10px;">
        <el-input v-model="rightsKeyword" placeholder="请输入权益编码/名称/供应商" size="small" style="width: 300px;" clearable></el-input>
        <el-button type="primary" size="small" icon="el-icon-search" @click="fetchBenefitItems">搜索</el-button>
      </div>
      <el-table :data="allRightsList" border size="small" max-height="400" @selection-change="handleRightsSelectionChange">
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column prop="benefitCode" label="权益编码" width="110"></el-table-column>
        <el-table-column prop="benefitName" label="权益名称" width="140"></el-table-column>
        <el-table-column prop="kind" label="服务种类" width="110"></el-table-column>
        <el-table-column prop="supplier" label="供应商" min-width="140" show-overflow-tooltip></el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="selectRightsDialogVisible = false" size="small">取 消</el-button>
        <el-button type="primary" @click="confirmSelectRights" size="small">确 定</el-button>
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
  getPlatformIdTypesApi,
  getPlatformOrderChannelApi
} from '@/api/test/index';

export default {
  name: 'ServiceRuleConfig',
  data() {
    return {
      loading: false,
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
    currentVersionInfo() {
      return this.versionOptions.find(v => v.version_tag === this.selectedVersion);
    },
    unconfiguredGradeList() {
      return this.gradeConfigList.filter(g => g.configured === 0);
    },
    unconfiguredGradesText() {
      return this.unconfiguredGradeList.map(g => g.gradeName).join('、');
    }
  },
  created() {
    this.initPageData();
  },
  methods: {
    // 基础初始化
    async initPageData() {
      // 提取下拉字典接口数据[cite: 1, 2, 3]
      this.fetchDictOptions();
      await this.fetchVersions();
      if (this.selectedVersion) {
        this.fetchTableData();
        this.fetchGradeConfigStatus();
      }
    },
    // 加载下拉字典项[cite: 1, 2, 3]
    async fetchDictOptions() {
      try {
        const [orgRes, idRes, channelRes] = await Promise.all([
          getPlatformOrgApi(),
          getPlatformIdTypesApi(),
          getPlatformOrderChannelApi()
        ]);

        // 适配接口层级的返回格式并储存
        this.orgOptions = (orgRes.body && orgRes.body.data) || orgRes.data || [];
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
          const current = this.versionOptions.find(v => v.current_flag === '1');
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
        this.gradeConfigList = res.data || [];
      } catch (err) {
        this.$message.error('获取等级状态失败');
      }
    },
    // 查询等级列表汇总
    async fetchTableData() {
      this.loading = true;
      try {
        const res = await getGradeListApi({ versionTag: this.selectedVersion });
        this.tableData = res.data || [];
      } catch (err) {
        this.$message.error('获取服务规则数据失败');
      } finally {
        this.loading = false;
      }
    },
    handleVersionChange() {
      this.fetchTableData();
      this.fetchGradeConfigStatus();
    },

    // ===== 新增与编辑 =====
    async handleAddRule() {
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
      this.dialogTitle = '编辑服务规则';
      this.isEditMode = true;
      this.editForm.versionTag = this.selectedVersion;
      this.editForm.gradeCode = row.grade_code;
      await this.loadFormGradeOptions(this.editForm.versionTag);
      await this.loadRuleDetail(this.selectedVersion, row.grade_code);
      this.editDialogVisible = true;
    },
    async loadFormGradeOptions(versionTag) {
      const res = await getBenefitGradeListApi({ versionTag });
      this.formGradeOptions = res.data || [];
    },
    async handleFormVersionChange(val) {
      await this.loadFormGradeOptions(val);
      this.editForm.gradeCode = '';
    },
    // 加载整包规则详情并反显至编辑表单
    async loadRuleDetail(versionTag, gradeCode) {
      try {
        const res = await getRuleViewApi({ versionTag, gradeCode });
        const data = res.data || {};
        const items = data.items || [];
        this.editForm.description = items.length > 0 ? items[0].description : '';

        this.editForm.rightsList = items.map(item => {
          let parsedItems = [];
          try {
            parsedItems = item.itemsJson ? JSON.parse(item.itemsJson) : [];
          } catch (e) {
            parsedItems = [];
          }

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
              if (id === 'POLICYHOLDER') return '投保人';
              if (id === 'INSURED') return '有效保单被保险人';
              return id;
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
            const itemChannels = rule.orderChannels || parsedChannels;
            return {
              cat: p.cat,
              name: p.name,
              freqUnlimited: rule.freqUnlimited !== undefined ? Boolean(rule.freqUnlimited) : Boolean(item.freqUnlimited),
              freqYears: rule.freqYears || item.freqYears || 1,
              freqAvgYears: rule.freqAvgYears || item.freqAvgYears || 1,
              freqCount: rule.freqCount || item.freqCount || 1,
              needOrder: rule.needOrder !== undefined ? Boolean(rule.needOrder) : Boolean(item.needOrder),
              orderChannels: itemChannels,
              needAudit: rule.needAudit !== undefined ? Boolean(rule.needAudit) : Boolean(item.needAudit)
            };
          });

          return {
            benefitCode: item.benefitCode,
            kind: item.kind,
            benefitName: item.benefitName,
            supplier: item.supplier,
            signOrg: item.signOrg,
            regions: parsedRegions,
            identities: parsedIdentities,
            items: projectItems
          };
        });
      } catch (err) {
        this.$message.error('加载整包详情失败');
      }
    },

    // ===== 选择权益逻辑 =====
    async openSelectRightsDialog() {
      this.rightsKeyword = '';
      await this.fetchBenefitItems();
      this.selectRightsDialogVisible = true;
    },
    async fetchBenefitItems() {
      try {
        const res = await getBenefitItemsApi({ keyword: this.rightsKeyword });
        this.allRightsList = res.data || [];
      } catch (e) {
        this.$message.error('获取权益库列表失败');
      }
    },
    handleRightsSelectionChange(val) {
      this.selectedRightsFromDialog = val;
    },
    confirmSelectRights() {
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
            needOrder: true,
            orderChannels: this.orderChannelOptions.length > 0 ? [this.orderChannelOptions[0].code || this.orderChannelOptions[0]] : [],
            needAudit: false
          }));

          this.editForm.rightsList.push({
            benefitCode: item.benefitCode,
            kind: item.kind,
            benefitName: item.benefitName,
            supplier: item.supplier,
            signOrg: item.signOrg,
            regions: this.orgOptions.length > 0 ? [this.orgOptions[0]] : [],
            identities: this.idTypeOptions.length > 0 ? [this.idTypeOptions[0]] : [],
            items: subItems
          });
        }
      });
      this.selectRightsDialogVisible = false;
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
      if (!this.editForm.versionTag || !this.editForm.gradeCode) {
        this.$message.warning('请选择版本和客户等级');
        return;
      }
      if (this.editForm.rightsList.length === 0) {
        this.$message.warning('请至少选择一条服务权益');
        return;
      }

      const payload = {
        versionTag: this.editForm.versionTag,
        gradeCode: this.editForm.gradeCode,
        description: this.editForm.description,
        items: this.editForm.rightsList.map(r => {
          const itemRules = (r.items || []).map(it => ({
            cat: it.cat,
            name: it.name,
            needOrder: it.needOrder ? 1 : 0,
            orderChannels: it.orderChannels || [],
            needAudit: it.needAudit ? 1 : 0,
            freqUnlimited: it.freqUnlimited ? 1 : 0,
            freqYears: it.freqYears,
            freqAvgYears: it.freqAvgYears,
            freqCount: it.freqCount
          }));

          const firstItem = itemRules[0] || {};
          return {
            benefitCode: r.benefitCode,
            regions: r.regions,
            identities: r.identities,
            freqUnlimited: firstItem.freqUnlimited !== undefined ? firstItem.freqUnlimited : 0,
            freqYears: firstItem.freqYears || 1,
            freqAvgYears: firstItem.freqAvgYears || 1,
            freqCount: firstItem.freqCount || 1,
            needOrder: firstItem.needOrder !== undefined ? firstItem.needOrder : 1,
            orderChannels: firstItem.orderChannels || [],
            needAudit: firstItem.needAudit !== undefined ? firstItem.needAudit : 0,
            itemRules
          };
        })
      };

      this.saving = true;
      try {
        await saveRuleApi(payload);
        this.$message.success('保存服务规则成功！');
        this.editDialogVisible = false;
        this.fetchTableData();
        this.fetchGradeConfigStatus();
      } catch (err) {
        this.$message.error('保存失败');
      } finally {
        this.saving = false;
      }
    },

    // ===== 查看详情 =====
    async handleView(row) {
      this.viewDialogVisible = true;
      this.viewLoading = true;
      try {
        const res = await getRuleViewApi({ versionTag: this.selectedVersion, gradeCode: row.grade_code });
        const data = res.data || {};
        const items = data.items || [];

        if (items.length > 0) {
          this.viewData.gradeName = items[0].gradeName || row.gradeName;
          this.viewData.creator = items[0].creator;
          this.viewData.createTime = items[0].createTime;
          this.viewData.description = items[0].description;
        } else {
          this.viewData.gradeName = row.gradeName;
          this.viewData.creator = row.creator;
          this.viewData.createTime = row.create_time;
          this.viewData.description = row.description;
        }

        const detailRows = [];
        items.forEach(rule => {
          let parsedItems = [];
          try {
            parsedItems = rule.itemsJson ? JSON.parse(rule.itemsJson) : [];
          } catch (e) {
            parsedItems = [];
          }

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
            if (freqUnlim === 0 || freqUnlim === false) {
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
              area: rule.regionsJson ? JSON.parse(rule.regionsJson).join('、') : '—',
              identity: rule.identitiesJson ? JSON.parse(rule.identitiesJson).join('、') : '—',
              frequency: freqStr,
              needOrder: nOrder === 1 || nOrder === true ? '是' : '否',
              orderChannel: displayChannels.length > 0 ? displayChannels.join('、') : '—',
              needAudit: nAudit === 1 || nAudit === true ? '是' : '否'
            });
          };

          if (parsedItems.length > 0) {
            parsedItems.forEach(p => processItem(p.cat, p.name));
          } else {
            processItem('—', '—');
          }
        });

        this.viewData.itemList = detailRows;
      } catch (e) {
        this.$message.error('获取详情数据失败');
      } finally {
        this.viewLoading = false;
      }
    },

    // ===== 导入/导出/模板下载 =====
    async handleDownloadTemplate() {
      try {
        const res = await exportRuleApi();
        this.downloadFile(res, '服务规则导入模板.xlsx');
      } catch (e) {
        this.$message.error('下载模板失败');
      }
    },
    async handleExport() {
      if (!this.selectedVersion) return;
      try {
        const res = await exportBenefitRuleApi(this.selectedVersion);
        this.downloadFile(res, `服务规则配置_${this.selectedVersion}.xlsx`);
      } catch (e) {
        this.$message.error('导出失败');
      }
    },
    triggerImport() {
      this.$refs.fileInput.click();
    },
    async handleFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await importBenefitRuleApi(file, this.selectedVersion);
        this.$message.success('导入成功！');
        this.fetchTableData();
        this.fetchGradeConfigStatus();
      } catch (err) {
        this.$message.error('导入失败');
      } finally {
        e.target.value = '';
      }
    },
    downloadFile(data, defaultFileName) {
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
  min-height: 100vh;
}

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

/* 规则说明卡片 */
.rule-info-card {
  margin-bottom: 20px;
  background-color: #f0f5ff;
  border: 1px solid #d6e4ff;
}

.rule-info-content {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.6;
}

.rule-title {
  font-weight: bold;
  color: #2b569a;
  white-space: nowrap;
  margin-right: 16px;
}

.rule-text {
  color: #4a5d78;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-btn-group {
  display: flex;
  gap: 10px;
}

.tip-text {
  font-size: 13px;
  color: #a8abb2;
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
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
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

/* ===== 核心样式：抽屉强行固定底部操作按钮 ===== */
::v-deep .rule-edit-drawer {
  display: flex !important;
  flex-direction: column !important;
  height: 100vh !important;
}

::v-deep .rule-edit-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: bold;
  color: #303133;
}

::v-deep .rule-edit-drawer .el-drawer__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.drawer-body-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.drawer-fixed-footer {
  flex-shrink: 0;
  padding: 12px 24px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  text-align: right;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.form-row {
  display: flex;
  gap: 32px;
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
  margin-bottom: 12px;
  background-color: #f8f9fa;
  padding: 8px 16px;
  border: 1px solid #ebedf0;
  border-radius: 4px;
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
  padding: 12px 20px;
  background-color: #fcfdfe;
}

.sub-table-title {
  font-weight: bold;
  font-size: 13px;
  color: #303133;
  margin-bottom: 8px;
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
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
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
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #303133;
}

.text-bold {
  font-weight: bold;
}

.detail-table-section .section-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
}
</style>