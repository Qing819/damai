<template>
  <div class="app-container">
    <el-card shadow="never" class="main-card">
      <!-- 页头与说明 -->
      <div slot="header" class="card-header">
        <div class="breadcrumb-tip">等级管理 / 客户等级积分配置</div>
        <span class="header-title">客户等级积分配置</span>
        <p class="header-desc">
          维护客户等级、展示等级名称与积分分档区间，避免与老积分体系在运营中混淆
        </p>
      </div>

      <el-alert
          type="info"
          show-icon
          :closable="false"
          class="custom-alert"
      >
        <template slot="title">
          <span class="alert-label">配置说明</span>
          分档区间需连续、不重叠、无缺口；展示等级名称可与等级编码分离维护，新体系建议带“（新V）”标识区分
        </template>
      </el-alert>

      <!-- 角色切换栏 -->
      <div class="role-switch-row">
        <el-radio-group v-model="userRole" size="medium">
          <el-radio-button label="admin">系统管理员</el-radio-button>
          <el-radio-button label="user">普通用户</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 主 Tab 切换 -->
      <el-tabs v-model="activeTab" class="main-tabs">
        <!-- Tab 1: 等级分档配置 -->
        <el-tab-pane label="等级分档配置" name="bandConfig">
          <div class="tab-content">
            <div class="toolbar-header">
              <div class="section-title">等级分档配置</div>
              <div class="toolbar-actions">
                <span class="version-label">查看版本</span>
                <el-select
                    v-model="currentVersionId"
                    placeholder="请选择"
                    size="small"
                    style="width: 160px; margin-right: 12px;"
                    @change="handleVersionChange"
                >
                  <el-option
                      v-for="ver in versionData"
                      :key="ver.id"
                      :label="`${ver.versionNo} (${ver.currentFlag === '1' || ver.currentFlag === 1 ? '当前版本' : '历史版本'})`"
                      :value="ver.id"
                  />
                </el-select>
                <span class="version-date-tip">
                  生效 {{ currentVersionObj.effectiveDate || '-' }} ~ {{ currentVersionObj.expireDate || '长期有效' }}
                </span>

                <el-button
                    v-if="userRole === 'admin'"
                    type="primary"
                    icon="el-icon-plus"
                    size="small"
                    style="margin-left: 16px;"
                    @click="openBatchAddDialog"
                >
                  新增等级
                </el-button>
              </div>
            </div>

            <!-- 等级分档配置表格 -->
            <el-table
                v-loading="bandLoading"
                :data="bandData"
                stripe
                style="width: 100%;"
                header-cell-class-name="custom-table-header"
            >
              <el-table-column prop="gradeName" label="客户等级" align="center" />
              <el-table-column prop="displayGradeName" label="展示等级名称" align="center" />
              <el-table-column label="积分分档下限" align="center">
                <template slot-scope="scope">
                  {{ scope.row.minPointText || (scope.row.minPoint != null ? `${scope.row.minPoint} (${scope.row.minBoundary || '含'})` : '0 (不含边界以下)') }}
                </template>
              </el-table-column>
              <el-table-column label="积分分档上限" align="center">
                <template slot-scope="scope">
                  {{ scope.row.maxPointText || (scope.row.maxPoint != null ? `${scope.row.maxPoint} (${scope.row.maxBoundary || '不含'})` : '无上限') }}
                </template>
              </el-table-column>
              <el-table-column prop="boundaryRule" label="边界规则" align="center" />
              <el-table-column label="版本号" align="center">
                <template>
                  {{ currentVersionObj.versionNo || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="生效日期" align="center">
                <template>
                  {{ currentVersionObj.effectiveDate || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="失效日期" align="center">
                <template>
                  {{ currentVersionObj.expireDate || '长期有效' }}
                </template>
              </el-table-column>
              <el-table-column v-if="userRole === 'admin'" label="操作" align="center" width="120">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="handleEditSingle(scope.row)">编辑</el-button>
                  <el-button type="text" size="small" class="btn-danger-text" @click="handleDeleteSingle(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页组件 -->
            <div class="pagination-container">
              <span class="total-text">共 {{ bandData.length }} 条</span>
              <el-pagination
                  layout="prev, pager, next, sizes"
                  :current-page="1"
                  :page-size="10"
                  :total="bandData.length"
                  small
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 2: 等级版本管理 -->
        <el-tab-pane label="等级版本管理" name="versionConfig">
          <div class="tab-content">
            <div class="toolbar-header">
              <div class="section-title">等级版本管理</div>
              <div class="toolbar-actions">
                <el-button
                    v-if="userRole === 'admin'"
                    type="primary"
                    icon="el-icon-plus"
                    size="small"
                    @click="dialogVersionVisible = true"
                >
                  新增版本
                </el-button>
              </div>
            </div>

            <!-- 版本管理表格 -->
            <el-table
                v-loading="versionLoading"
                :data="versionData"
                stripe
                style="width: 100%;"
                header-cell-class-name="custom-table-header"
            >
              <el-table-column prop="versionNo" label="版本号" align="center" />
              <el-table-column prop="effectiveDate" label="生效日期" align="center" />
              <el-table-column label="失效日期" align="center">
                <template slot-scope="scope">
                  {{ scope.row.expireDate || '长期有效' }}
                </template>
              </el-table-column>
              <el-table-column label="状态" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getVersionTagType(scope.row.status)" size="small" effect="plain" class="status-tag">
                    {{ formatVersionStatus(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column v-if="userRole === 'admin'" label="操作" align="center" width="120">
                <template slot-scope="scope">
                  <el-button
                      v-if="scope.row.status === 'APPROVED' || scope.row.status === '1'"
                      type="text"
                      size="small"
                      class="btn-danger-text"
                      @click="openObsoleteDialog(scope.row)"
                  >
                    作废
                  </el-button>
                  <el-button
                      v-else-if="scope.row.displayStatus === 'PENDING_EFFECTIVE' || scope.row.status === 'PENDING'"
                      type="text"
                      size="small"
                      class="btn-danger-text"
                      @click="handleDeleteVersion(scope.row)"
                  >
                    删除
                  </el-button>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>

            <div class="version-footer-row">
              <span class="total-text">共 {{ versionData.length }} 个版本</span>
              <span class="footer-tip">版本生效/失效日期必须连续：不得重复、不得出现空隙</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 弹窗 1：新增等级分档（批量） -->
    <el-dialog
        title="新增等级分档（批量）"
        :visible.sync="dialogBatchVisible"
        width="820px"
        custom-class="beauty-dialog"
        :close-on-click-modal="false"
    >
      <div class="dialog-version-tip">
        所属版本：<b>{{ currentVersionObj.versionNo }} ({{ currentVersionObj.effectiveDate }} ~ {{ currentVersionObj.expireDate || '长期有效' }})</b>
      </div>

      <div class="batch-action-bar">
        <span class="sub-tip">点击 + 可批量添加多条等级分档，系统实时校验区间是否重叠</span>
        <el-button type="text" icon="el-icon-plus" @click="addBatchRow">新增一行</el-button>
      </div>

      <el-table :data="batchRows" border size="small" style="width: 100%; margin-top: 10px;">
        <el-table-column label="序号" type="index" width="50" align="center" />
        <el-table-column label="客户等级" width="140">
          <template slot-scope="scope">
            <el-input v-model="scope.row.gradeName" placeholder="如：三星" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="展示等级名称" width="150">
          <template slot-scope="scope">
            <el-input v-model="scope.row.displayGradeName" placeholder="如：三星（新V）" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="积分下限" width="110">
          <template slot-scope="scope">
            <el-input v-model="scope.row.minPoint" placeholder="0" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="边界" width="100">
          <template slot-scope="scope">
            <el-select v-model="scope.row.minBoundary" size="small">
              <el-option label="包含 (含)" value="含" />
              <el-option label="不包含 (不含)" value="不含" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="积分上限" width="110">
          <template slot-scope="scope">
            <el-input v-model="scope.row.maxPoint" placeholder="无上限" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="边界" width="100">
          <template slot-scope="scope">
            <el-select v-model="scope.row.maxBoundary" size="small">
              <el-option label="包含 (含)" value="含" />
              <el-option label="不包含 (不含)" value="不含" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button
                type="danger"
                icon="el-icon-minus"
                circle
                size="mini"
                :disabled="batchRows.length <= 1"
                @click="removeBatchRow(scope.$index)"
            />
            <el-button
                type="success"
                icon="el-icon-plus"
                circle
                size="mini"
                @click="addBatchRow"
            />
          </template>
        </el-table-column>
      </el-table>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogBatchVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleSaveBatchBands">保存</el-button>
      </div>
    </el-dialog>

    <!-- 弹窗 2：新增版本 -->
    <el-dialog
        title="新增版本"
        :visible.sync="dialogVersionVisible"
        width="480px"
        custom-class="beauty-dialog"
        :close-on-click-modal="false"
    >
      <el-form :model="versionForm" label-width="90px" size="small" class="dialog-form">
        <el-form-item label="版本号" required>
          <el-input v-model="versionForm.versionNo" placeholder="如：V3" />
        </el-form-item>
        <el-form-item label="生效日期" required>
          <el-date-picker
              v-model="versionForm.effectiveDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="yyyy/mm/dd"
              style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="失效日期">
          <div class="fixed-text">长期有效</div>
          <div class="form-tip">
            新增版本必须先作废旧版本，新版本失效日期固定为长期生效，仅作废时设定失效日；新版本生效日期须为旧版本失效日期次日，生效区间不得重叠、无空隙
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVersionVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleCreateVersion">保存</el-button>
      </div>
    </el-dialog>

    <!-- 弹窗 3：作废版本 -->
    <el-dialog
        title="作废版本"
        :visible.sync="dialogObsoleteVisible"
        width="500px"
        custom-class="beauty-dialog"
        :close-on-click-modal="false"
    >
      <el-form :model="obsoleteForm" label-width="100px" size="small" class="dialog-form">
        <el-form-item label="版本号">
          <span>{{ obsoleteForm.versionNo }}</span>
        </el-form-item>
        <el-form-item label="生效日期">
          <span>{{ obsoleteForm.effectiveDate }}</span>
        </el-form-item>
        <el-form-item label="* 失效日期" required>
          <el-date-picker
              v-model="obsoleteForm.expireDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="请选择失效日期"
              style="width: 100%;"
          />
          <div class="form-tip">
            作废的失效日期只能选当日或之后；作废当日仍按原版本执行，次日(失效日期后一天)起才按最新有效版本重新核算。若作废后未新增版本，则继续沿用当前版本分档；其后新增版本，生效日期须为失效次日
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogObsoleteVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleConfirmObsolete">确认作废</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getGradeConfigVersionsApi,
  getGradeConfigBandsApi,
  addGradeConfigVersionApi,
  saveGradeConfigBandApi,
  voidGradeConfigVersionApi,
  deleteGradeConfigVersionApi,
  deleteGradeConfigBandApi
} from '@/api/test/index'

export default {
  name: 'CustomerLevelConfig',
  data() {
    return {
      userRole: 'admin',
      activeTab: 'bandConfig',
      currentVersionId: null,

      // 各种 Loading
      versionLoading: false,
      bandLoading: false,
      submitLoading: false,

      // 弹窗控制
      dialogBatchVisible: false,
      dialogVersionVisible: false,
      dialogObsoleteVisible: false,

      // 批量新增表单列表
      batchRows: [],

      // 新增版本表单
      versionForm: {
        versionNo: '',
        effectiveDate: '',
        expireDate: null
      },

      // 作废版本表单
      obsoleteForm: {
        id: null,
        versionNo: '',
        effectiveDate: '',
        expireDate: ''
      },

      // 列表数据
      bandData: [],
      versionData: []
    }
  },
  computed: {
    currentVersionObj() {
      return this.versionData.find(item => item.id === this.currentVersionId) || {}
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 格式化版本状态标签样式
    getVersionTagType(status) {
      if (status === 'APPROVED' || status === '1' || status === 1) return 'success'
      return 'info'
    },
    formatVersionStatus(status) {
      if (status === 'APPROVED' || status === '1' || status === 1) return '生效中'
      return '已失效'
    },

    // 解包接口返回数据
    unpackData(res) {
      return res?.data || res?.body?.data || res || []
    },

    // 初始化数据
    async initData() {
      this.versionLoading = true
      try {
        const res = await getGradeConfigVersionsApi()
        this.versionData = this.unpackData(res)

        const currentVer = this.versionData.find(v => v.currentFlag === '1' || v.currentFlag === 1)
        if (currentVer) {
          this.currentVersionId = currentVer.id
        } else if (this.versionData.length > 0) {
          this.currentVersionId = this.versionData[0].id
        }

        if (this.currentVersionId) {
          await this.fetchBands(this.currentVersionId)
        }
      } catch (err) {
        console.error('获取版本列表失败:', err)
      } finally {
        this.versionLoading = false
      }
    },

    // 获取特定版本的分档数据
    async fetchBands(versionId) {
      this.bandLoading = true
      try {
        const res = await getGradeConfigBandsApi({ versionId })
        this.bandData = this.unpackData(res)
      } catch (err) {
        console.error('获取分档列表失败:', err)
      } finally {
        this.bandLoading = false
      }
    },

    // 切换查看版本
    handleVersionChange(versionId) {
      this.fetchBands(versionId)
    },

    // 打开批量新增弹窗
    openBatchAddDialog() {
      this.batchRows = [
        { gradeName: '', displayGradeName: '', minPoint: '0', minBoundary: '含', maxPoint: '', maxBoundary: '不含' },
        { gradeName: '', displayGradeName: '', minPoint: '0', minBoundary: '含', maxPoint: '', maxBoundary: '不含' },
        { gradeName: '', displayGradeName: '', minPoint: '0', minBoundary: '含', maxPoint: '', maxBoundary: '不含' }
      ]
      this.dialogBatchVisible = true
    },
    addBatchRow() {
      this.batchRows.push({
        gradeName: '',
        displayGradeName: '',
        minPoint: '0',
        minBoundary: '含',
        maxPoint: '',
        maxBoundary: '不含'
      })
    },
    removeBatchRow(index) {
      this.batchRows.splice(index, 1)
    },

    // 保存批量分档
    async handleSaveBatchBands() {
      this.submitLoading = true
      try {
        const rows = this.batchRows.filter(row => row.gradeName && row.maxPoint)
        if (!rows.length) {
          this.$message.warning('请至少填写一条完整分档')
          return
        }
        await Promise.all(rows.map(row => saveGradeConfigBandApi({
          id: row.id,
          versionId: this.currentVersionId,
          gradeName: row.gradeName,
          displayGradeName: row.displayGradeName,
          minPoint: row.minPoint,
          minBoundary: row.minBoundary,
          maxPoint: row.maxPoint,
          maxBoundary: row.maxBoundary
        })))
        this.$message.success('保存成功！')
        this.dialogBatchVisible = false
        this.fetchBands(this.currentVersionId)
      } catch (err) {
        this.$message.error('保存失败，请检查区间校验')
      } finally {
        this.submitLoading = false
      }
    },

    // 编辑与删除单条分档
    handleEditSingle(row) {
      this.batchRows = [{
        id: row.id,
        gradeName: row.gradeName || row.grade_code || '',
        displayGradeName: row.displayGradeName || row.gradeName || '',
        minPoint: row.minPoint == null ? '0' : String(row.minPoint),
        minBoundary: row.minBoundary || '含',
        maxPoint: row.maxPoint == null ? '' : String(row.maxPoint),
        maxBoundary: row.maxBoundary || '不含'
      }]
      this.dialogBatchVisible = true
    },
    async handleDeleteSingle(row) {
      this.$confirm(`确认删除分档【${row.gradeName}】吗？`, '提示', { type: 'warning' })
        .then(async() => {
          try {
            await deleteGradeConfigBandApi(row.id)
            this.$message.success('删除成功')
            await this.fetchBands(this.currentVersionId)
          } catch (err) {
            this.$message.error('删除失败，请检查分档连续性')
          }
        })
        .catch(() => null)
    },

    // 保存新增版本
    async handleCreateVersion() {
      if (!this.versionForm.versionNo || !this.versionForm.effectiveDate) {
        this.$message.warning('请填写版本号和生效日期！')
        return
      }

      this.submitLoading = true
      try {
        await addGradeConfigVersionApi(this.versionForm)
        this.$message.success('新增版本成功！')
        this.dialogVersionVisible = false
        await this.initData()
      } catch (err) {
        this.$message.error('新增版本失败')
      } finally {
        this.submitLoading = false
      }
    },

    // 打开作废弹窗与确认作废
    openObsoleteDialog(row) {
      this.obsoleteForm = {
        id: row.id,
        versionNo: row.versionNo,
        effectiveDate: row.effectiveDate,
        expireDate: new Date().toISOString().split('T')[0]
      }
      this.dialogObsoleteVisible = true
    },
    async handleConfirmObsolete() {
      if (!this.obsoleteForm.expireDate) {
        this.$message.warning('请选择失效日期')
        return
      }
      this.submitLoading = true
      try {
        await voidGradeConfigVersionApi(this.obsoleteForm.id, {
          voidDate: this.obsoleteForm.expireDate
        })
        this.$message.success('版本作废成功')
        this.dialogObsoleteVisible = false
        await this.initData()
      } catch (err) {
        this.$message.error('作废操作失败')
      } finally {
        this.submitLoading = false
      }
    },
    async handleDeleteVersion(row) {
      try {
        await this.$confirm(`确认删除待生效版本【${row.versionNo}】吗？`, '提示', { type: 'warning' })
        await deleteGradeConfigVersionApi(row.id)
        this.$message.success('版本删除成功')
        await this.initData()
      } catch (err) {
        if (err !== 'cancel' && err !== 'close') this.$message.error('版本删除失败')
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 16px 24px;
  background-color: #f4f5f9;
  min-height: 100vh;
}

.main-card {
  border-radius: 4px;
  border: none;
}

.breadcrumb-tip {
  font-size: 12px;
  color: #a8abb2;
  margin-bottom: 6px;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #1d2129;
}

.header-desc {
  font-size: 13px;
  color: #86909c;
  margin: 4px 0 0 0;
}

.custom-alert {
  margin-top: 12px;
  background-color: #e8f3ff;
  border: none;
  color: #4e5969;
}

.alert-label {
  font-weight: 600;
  color: #165dff;
  margin-right: 8px;
}

.role-switch-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -30px;
  margin-bottom: 10px;
}

.main-tabs {
  margin-top: 10px;
}

.tab-content {
  padding-top: 10px;
}

.toolbar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.toolbar-actions {
  display: flex;
  align-items: center;
}

.version-label {
  font-size: 13px;
  color: #4e5969;
  margin-right: 8px;
}

.version-date-tip {
  font-size: 13px;
  color: #86909c;
}

::v-deep .custom-table-header {
  background-color: #f7f8fa !important;
  color: #1d2129;
  font-weight: 600;
}

.btn-danger-text {
  color: #f53f3f;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.total-text {
  font-size: 13px;
  color: #86909c;
}

.version-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.footer-tip {
  font-size: 12px;
  color: #86909c;
}

.status-tag {
  border-radius: 12px;
}

/* 弹窗专用样式 */
.dialog-version-tip {
  font-size: 13px;
  color: #1d2129;
  margin-bottom: 12px;
}

.batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-tip {
  font-size: 12px;
  color: #86909c;
}

.fixed-text {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.form-tip {
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
  margin-top: 6px;
}

::v-deep .beauty-dialog {
  border-radius: 6px;
}

::v-deep .beauty-dialog .el-dialog__header {
  border-bottom: 1px solid #f2f3f5;
  padding: 16px 20px;
}

::v-deep .beauty-dialog .el-dialog__footer {
  border-top: 1px solid #f2f3f5;
  padding: 12px 20px;
}
</style>
