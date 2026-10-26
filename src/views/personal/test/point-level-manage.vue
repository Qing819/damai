<template>
  <div class="app-container">
    <el-card shadow="never" class="main-card">
      <!-- 页头与说明 -->
      <div slot="header" class="card-header">
        <span class="header-title">客户等级积分配置</span>
        <p class="header-desc">
          维护客户等级、展示等级名称与积分分档区间，避免与老积分体系在运营中混淆
        </p>
      </div>

      <el-alert
          type="info"
          :closable="false"
          class="custom-alert"
      >
        <template slot="title">
          <span class="alert-label">配置说明</span>
          分档区间需连续、不重叠、无缺口；展示等级名称可与等级编码分离维护
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
                      :label="formatVersionOption(ver)"
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
                :data="pagedBandData"
                stripe
                style="width: 100%;"
            >
              <el-table-column label="客户等级" align="center">
                <template slot-scope="scope">
                  {{ scope.row.gradeName || scope.row.grade_name || scope.row.grade_code || scope.row.gradeCode || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="displayGradeName" label="展示等级名称" align="center" />
              <el-table-column label="积分分档下限" align="center">
                <template slot-scope="scope">
                    {{ scope.row.minPointText || formatPointBoundary(scope.row.minPoint == null ? scope.row.min_point : scope.row.minPoint, scope.row.minBoundary || scope.row.min_boundary, true) }}
                </template>
              </el-table-column>
              <el-table-column label="积分分档上限" align="center">
                <template slot-scope="scope">
                    {{ scope.row.maxPointText || formatPointBoundary(scope.row.maxPoint == null ? scope.row.max_point : scope.row.maxPoint, scope.row.maxBoundary || scope.row.max_boundary, false) }}
                </template>
              </el-table-column>
              <el-table-column label="边界规则" align="center">
                <template slot-scope="scope">
                  {{ scope.row.boundaryRule || formatBoundaryRule(scope.row) }}
                </template>
              </el-table-column>
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
                  :current-page.sync="bandPage"
                  :page-size="bandPageSize"
                  :total="bandData.length"
                  @size-change="handleBandPageSizeChange"
                  small
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 2: 等级版本管理 -->
        <el-tab-pane v-if="userRole === 'admin'" label="等级版本管理" name="versionConfig">
          <div class="tab-content">
            <div class="toolbar-header">
              <div class="section-title">等级版本管理</div>
              <div class="toolbar-actions">
                <el-button
                    v-if="userRole === 'admin'"
                    type="primary"
                    icon="el-icon-plus"
                    size="small"
                    @click="openVersionDialog"
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
                  <el-tag :type="getVersionTagType(scope.row)" size="small" effect="plain" class="status-tag">
                    {{ formatVersionStatus(scope.row) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column v-if="userRole === 'admin'" label="操作" align="center" width="120">
                <template slot-scope="scope">
                  <el-button
                      v-if="getVersionState(scope.row) === 'ACTIVE' && !scope.row.expireDate"
                      type="text"
                      size="small"
                      class="btn-danger-text"
                      @click="openObsoleteDialog(scope.row)"
                  >
                    作废
                  </el-button>
                  <template v-else-if="getVersionState(scope.row) === 'PENDING_EFFECTIVE'">
                    <el-button type="text" size="small" @click="handleModifyVersion(scope.row)">修改</el-button>
                    <el-button type="text" size="small" class="btn-danger-text" @click="handleDeleteVersion(scope.row)">删除</el-button>
                  </template>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>

            <div class="version-footer-row">
              <span class="total-text">共 {{ versionData.length }} 个版本</span>
              <span class="footer-tip">版本生效/失效日期必须连续：不得重叠、不得出现空隙</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 弹窗 1：新增等级分档（批量） -->
    <el-dialog
        title="新增等级分档（批量）"
        :visible.sync="dialogBatchVisible"
        width="860px"
        custom-class="beauty-dialog"
        :close-on-click-modal="false"
    >
      <div class="dialog-version-tip">
        <span>所属版本</span><b>{{ currentVersionObj.versionNo }}（{{ currentVersionObj.effectiveDate }} ~ {{ currentVersionObj.expireDate || '长期有效' }}）</b>
      </div>

      <div class="batch-action-bar">
        <span class="sub-tip">点击 + 可批量添加多条等级分档，系统实时校验区间是否重叠</span>
        <el-button type="text" icon="el-icon-plus" @click="addBatchRow">新增一行</el-button>
      </div>

      <el-table :data="batchRows" max-height="400" border size="small" class="batch-table" style="width: 100%; margin-top: 10px;">
        <el-table-column label="序号" type="index" width="42" align="center" />
        <el-table-column label="客户等级" min-width="110">
          <template slot-scope="scope">
            <el-input v-model="scope.row.gradeName" placeholder="如：三星" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="展示等级名称" min-width="110">
          <template slot-scope="scope">
            <el-input v-model="scope.row.displayGradeName" placeholder="如：三星（新V）" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="积分下限" width="100">
          <template slot-scope="scope">
            <el-input v-model="scope.row.minPoint" type="number" placeholder="0" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="边界" width="90">
          <template slot-scope="scope">
            <el-select v-model="scope.row.minBoundary" size="small">
              <el-option label="包含（含）" value="含" />
              <el-option label="不包含（不含）" value="不含" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="积分上限" width="100">
          <template slot-scope="scope">
            <el-input v-model="scope.row.maxPoint" type="number" placeholder="无上限" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="边界" width="90">
          <template slot-scope="scope">
            <el-select v-model="scope.row.maxBoundary" size="small">
              <el-option label="包含（含）" value="含" />
              <el-option label="不包含（不含）" value="不含" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center" class-name="batch-operation-cell">
          <template slot-scope="scope">
            <div class="batch-row-actions">
              <button
                  type="button"
                  class="batch-row-action batch-row-remove"
                  title="删除此行"
                  aria-label="删除此行"
                  :disabled="batchRows.length <= 1"
                  @click="removeBatchRow(scope.$index)"
              >−</button>
              <button
                  type="button"
                  class="batch-row-action batch-row-add"
                  title="新增一行"
                  aria-label="新增一行"
                  @click="addBatchRow"
              >+</button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="batchValidationMessage" class="batch-validation" role="alert">
        <b>校验结果</b> {{ batchValidationMessage }}
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogBatchVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="submitLoading" @click="handleSaveBatchBands">保存</el-button>
      </div>
    </el-dialog>

    <!-- 弹窗 2：新增版本 -->
    <el-dialog
        title="新增版本"
        :visible.sync="dialogVersionVisible"
        width="520px"
        custom-class="beauty-dialog version-dialog"
        :close-on-click-modal="false"
    >
      <el-form :model="versionForm" label-width="122px" label-position="left" size="small" class="dialog-form">
        <el-form-item label="版本号" required>
          <el-input v-model="versionForm.versionNo" :maxlength="16" placeholder="如：V3" style="width: 160px;" />
        </el-form-item>
        <el-form-item label="生效日期" required>
          <el-date-picker
              v-model="versionForm.effectiveDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="yyyy/mm/dd"
              style="width: 200px;"
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
        width="520px"
        custom-class="beauty-dialog version-dialog"
        :close-on-click-modal="false"
    >
      <el-form :model="obsoleteForm" label-width="122px" label-position="left" size="small" class="dialog-form">
        <el-form-item label="版本号">
          <span class="fixed-text">{{ obsoleteForm.versionNo }}</span>
        </el-form-item>
        <el-form-item label="生效日期">
          <span>{{ obsoleteForm.effectiveDate }}</span>
        </el-form-item>
        <el-form-item label="失效日期" required>
          <el-date-picker
              v-model="obsoleteForm.expireDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="请选择失效日期"
              :picker-options="obsoleteDateOptions"
              style="width: 200px;"
          />
          <div class="form-tip">
            作废的失效日期只能选当日或之后；作废当日仍按原版本执行，次日（失效日期后一天）起才按最新有效版本重新核算。若作废后未新增版本，则继续沿用当前版本分档；其后新增版本，生效日期须为失效次日
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
  saveGradeConfigBandsBatchApi,
  voidGradeConfigVersionApi,
  deleteGradeConfigVersionApi,
  deleteGradeConfigBandApi
} from '@/api/test/index'
import { getUserInfo } from '@/api/auth'

const GRADE_NAMES = {
  PUXING: '普星',
  SANXING: '三星',
  SIXING: '四星',
  WUXING: '五星',
  ZHUOYUE: '卓越',
  ZUNYAO: '尊耀'
}

export default {
  name: 'CustomerLevelConfig',
  data() {
    return {
      userRole: 'user',
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
      bandPage: 1,
      bandPageSize: 10,
      versionData: []
    }
  },
  computed: {
    batchValidationMessage() {
      const rows = this.batchRows.filter(row => row.gradeName.trim() && row.displayGradeName.trim())
      return rows.length ? this.validateBandRows(rows) : ''
    },
    pagedBandData() {
      const start = (this.bandPage - 1) * this.bandPageSize
      return this.bandData.slice(start, start + this.bandPageSize)
    },
    obsoleteDateOptions() {
      return {
        disabledDate(date) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return date.getTime() < today.getTime()
        }
      }
    },
    currentVersionObj() {
      return this.versionData.find(item => item.id === this.currentVersionId) || {}
    }
  },
  watch: {
    userRole(role) {
      if (role !== 'admin' && this.activeTab === 'versionConfig') {
        this.activeTab = 'bandConfig'
      }
    }
  },
  created() {
    this.initUserRole()
  },
  methods: {
    normalizeBand(row) {
      const gradeCode = row.gradeCode || row.grade_code || ''
      return {
        ...row,
        gradeCode,
        gradeName: GRADE_NAMES[gradeCode] || gradeCode || row.gradeName || row.grade_name || '',
        displayGradeName: row.displayGradeName || row.display_grade_name || row.gradeName || row.grade_name || ''
      }
    },
    getBandCode(row) {
      const name = row.gradeName.trim()
      if (row.gradeCode && (GRADE_NAMES[row.gradeCode] || row.gradeCode) === name) return row.gradeCode
      return Object.keys(GRADE_NAMES).find(code => GRADE_NAMES[code] === name)
        || name
    },
    async initUserRole() {
      try {
        const res = await getUserInfo()
        const userInfo = res && (res.userInfo || res.data || res.body && res.body.data || res)
        const roles = userInfo && (userInfo.roles || userInfo.roleList || userInfo.authorities || [])
        const roleValues = (Array.isArray(roles) ? roles : [roles]).map(role => {
          if (typeof role === 'string') return role
          return role && (role.roleCode || role.code || role.roleName || role.name || '')
        }).join('|').toLowerCase()
        const currentRole = userInfo && (userInfo.roleCode || userInfo.roleName || userInfo.role)
        const roleText = `${currentRole || ''}|${roleValues}`.toLowerCase()
        this.userRole = /admin|administrator|系统管理员|管理员/.test(roleText) ? 'admin' : 'user'
      } catch (err) {
        this.userRole = 'user'
        console.error('获取当前用户角色失败:', err)
      }
      await this.initData()
    },

    formatPointBoundary(point, boundary, isMin) {
      if (point == null || point === '') return isMin ? '0（不含边界以下）' : '无上限'
      const value = Number(point)
      if (isMin && value === 0 && boundary === '不含') return '0（不含边界以下）'
      let text = String(point)
      if (Number.isFinite(value) && value >= 10000 && value % 10000 === 0) {
        text = `${value / 10000}万`
      }
      return `${text}（${boundary || (isMin ? '含' : '不含')}）`
    },

    formatBoundaryRule(row) {
      const min = row.minBoundary || row.min_boundary
      const max = row.maxBoundary || row.max_boundary
      const maxPoint = row.maxPoint == null ? row.max_point : row.maxPoint
      if (!min && !max) return '-'
      const minText = min === '含' ? '闭' : '开'
      const maxText = max === '含' ? '闭' : '开'
      return maxPoint == null || maxPoint === ''
        ? `下限${minText} / 无上限`
        : `下限${minText} / 上限${maxText}`
    },

    getVersionState(version) {
      if (['ACTIVE', 'PENDING_EFFECTIVE', 'EXPIRED'].includes(version.displayStatus)) {
        return version.displayStatus
      }
      if (version.status === 'PENDING') return 'PENDING_EFFECTIVE'
      if (version.status === 'APPROVED' || String(version.status) === '1') return 'ACTIVE'
      return 'EXPIRED'
    },
    getVersionTagType(version) {
      return { ACTIVE: 'success', PENDING_EFFECTIVE: 'warning', EXPIRED: 'info' }[this.getVersionState(version)]
    },
    formatVersionStatus(version) {
      return { ACTIVE: '生效中', PENDING_EFFECTIVE: '待生效', EXPIRED: '已失效' }[this.getVersionState(version)]
    },
    formatVersionOption(version) {
      const state = this.getVersionState(version)
      const label = state === 'PENDING_EFFECTIVE' ? '待生效'
        : state === 'ACTIVE' ? '当前版本' : '历史版本'
      return `${version.versionNo}（${label}）`
    },
    async handleModifyVersion(version) {
      this.currentVersionId = version.id
      this.bandPage = 1
      await this.fetchBands(version.id)
      this.$message.success(`已切换，可修改版本 ${version.versionNo} 的等级分档配置`)
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

        const currentVer = this.versionData.find(v => this.getVersionState(v) === 'ACTIVE')
          || this.versionData.find(v => v.currentFlag === '1' || v.currentFlag === 1)
        if (currentVer) {
          this.currentVersionId = currentVer.id
        } else if (this.versionData.length > 0) {
          this.currentVersionId = this.versionData[0].id
        } else {
          this.currentVersionId = null
          this.bandData = []
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
        if (this.currentVersionId !== versionId) return
        this.bandData = this.unpackData(res).map(row => this.normalizeBand(row))
        const lastPage = Math.max(1, Math.ceil(this.bandData.length / this.bandPageSize))
        this.bandPage = Math.min(this.bandPage, lastPage)
      } catch (err) {
        console.error('获取分档列表失败:', err)
      } finally {
        if (this.currentVersionId === versionId) this.bandLoading = false
      }
    },

    // 切换查看版本
    handleVersionChange(versionId) {
      this.bandPage = 1
      this.fetchBands(versionId)
    },
    handleBandPageSizeChange(size) {
      this.bandPageSize = size
      this.bandPage = 1
    },

    // 打开批量新增弹窗
    openBatchAddDialog() {
      this.batchRows = [
        { gradeName: '', displayGradeName: '', minPoint: '', minBoundary: '含', maxPoint: '', maxBoundary: '不含' },
        { gradeName: '', displayGradeName: '', minPoint: '', minBoundary: '含', maxPoint: '', maxBoundary: '不含' },
        { gradeName: '', displayGradeName: '', minPoint: '', minBoundary: '含', maxPoint: '', maxBoundary: '不含' }
      ]
      this.dialogBatchVisible = true
    },
    addBatchRow() {
      this.batchRows.push({
        gradeName: '',
        displayGradeName: '',
        minPoint: '',
        minBoundary: '含',
        maxPoint: '',
        maxBoundary: '不含'
      })
    },
    removeBatchRow(index) {
      this.batchRows.splice(index, 1)
    },

    // 保存批量分档
    validateBandRows(rows) {
      const editedIds = rows.filter(row => row.id != null).map(row => row.id)
      const bands = this.bandData.filter(row => !editedIds.includes(row.id)).concat(rows)
      const codes = new Set()
      for (const row of bands) {
        const code = this.getBandCode(row)
        if (codes.has(code)) return `客户等级【${row.gradeName}】重复`
        codes.add(code)
        const min = Number(row.minPoint)
        const max = row.maxPoint === '' || row.maxPoint == null ? Infinity : Number(row.maxPoint)
        const hasMax = row.maxPoint !== '' && row.maxPoint != null
        if (!Number.isFinite(min) || (hasMax && !Number.isFinite(max)) || max <= min) {
          return '请填写有效的积分区间，上限必须大于下限'
        }
      }
      const sorted = bands.slice().sort((a, b) => Number(a.minPoint) - Number(b.minPoint))
      for (let i = 1; i < sorted.length; i++) {
        const previous = sorted[i - 1]
        const current = sorted[i]
        const upper = previous.maxPoint === '' || previous.maxPoint == null ? Infinity : Number(previous.maxPoint)
        const lower = Number(current.minPoint)
        const bothIncluded = previous.maxBoundary === '含' && current.minBoundary === '含'
        const bothExcluded = previous.maxBoundary !== '含' && current.minBoundary !== '含'
        if (upper > lower || (upper === lower && bothIncluded)) return '积分分档区间重叠，请检查上下限及边界'
        if (upper < lower || (upper === lower && bothExcluded)) return '积分分档区间存在缺口，请检查上下限及边界'
      }
      return ''
    },
    async handleSaveBatchBands() {
      if (this.submitLoading) return
      const rows = this.batchRows.filter(row => row.gradeName.trim())
      if (!rows.length) {
        this.$message.warning('请至少填写一条完整的等级分档数据')
        return
      }
      if (rows.some(row => !row.displayGradeName.trim())
        || this.batchRows.some(row => !row.gradeName.trim() && (row.displayGradeName.trim() || row.minPoint !== '' || row.maxPoint !== ''))) {
        this.$message.warning('请完整填写客户等级和展示等级名称')
        return
      }
      const validationMessage = this.validateBandRows(rows)
      if (validationMessage) {
        this.$message.warning(validationMessage)
        return
      }
      this.submitLoading = true
      try {
        let nextGradeOrder = Math.max(0, ...this.bandData.concat(rows).map(row => Number(row.gradeOrder) || 0))
        await saveGradeConfigBandsBatchApi(rows.map(row => ({
          id: row.id,
          versionId: this.currentVersionId,
          gradeCode: this.getBandCode(row),
          gradeName: row.displayGradeName.trim() || row.gradeName.trim(),
          gradeOrder: row.gradeOrder == null ? ++nextGradeOrder : row.gradeOrder,
          status: row.status == null ? '1' : row.status,
          minPoint: Number(row.minPoint),
          minBoundary: row.minBoundary,
          maxPoint: row.maxPoint === '' || row.maxPoint == null ? null : Number(row.maxPoint),
          maxBoundary: row.maxBoundary
        })))
        await this.fetchBands(this.currentVersionId)
        const unlimitedNotSaved = rows.some(row => {
          if (row.maxPoint !== '' && row.maxPoint != null) return false
          const saved = this.bandData.find(band => band.gradeCode === this.getBandCode(row))
          return saved && saved.maxPoint != null
        })
        if (unlimitedNotSaved) {
          this.$message.error('后端未保存“无上限”设置，请联系后端处理后重试')
          return
        }
        this.$message.success('保存成功！')
        this.dialogBatchVisible = false
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
        gradeCode: row.gradeCode,
        gradeOrder: row.gradeOrder,
        status: row.status,
        gradeName: row.gradeName || row.grade_name || row.grade_code || row.gradeCode || '',
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
    openVersionDialog() {
      this.versionForm = { versionNo: '', effectiveDate: '', expireDate: null }
      this.dialogVersionVisible = true
    },
    async handleCreateVersion() {
      if (this.submitLoading) return
      if (!this.versionForm.versionNo.trim() || !this.versionForm.effectiveDate) {
        this.$message.warning('请填写版本号和生效日期！')
        return
      }
      if (this.versionData.some(row => row.versionNo === this.versionForm.versionNo.trim())) {
        this.$message.warning('版本号已存在')
        return
      }
      if (this.versionData.some(row => !row.expireDate)) {
        this.$message.warning('新增版本必须先作废旧版本')
        return
      }
      const latest = this.versionData.slice().sort((a, b) => b.expireDate.localeCompare(a.expireDate))[0]
      if (latest) {
        const nextDate = new Date(`${latest.expireDate}T00:00:00`)
        nextDate.setDate(nextDate.getDate() + 1)
        const expectedDate = [nextDate.getFullYear(), String(nextDate.getMonth() + 1).padStart(2, '0'), String(nextDate.getDate()).padStart(2, '0')].join('-')
        if (this.versionForm.effectiveDate !== expectedDate) {
          this.$message.warning(`生效日期须为旧版本失效日期次日（${expectedDate}）`)
          return
        }
      }

      this.submitLoading = true
      try {
        await addGradeConfigVersionApi({
          versionNo: this.versionForm.versionNo.trim(),
          effectiveDate: this.versionForm.effectiveDate,
          expireDate: null
        })
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
    getLocalToday() {
      const date = new Date()
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-')
    },
    openObsoleteDialog(row) {
      this.obsoleteForm = {
        id: row.id,
        versionNo: row.versionNo,
        effectiveDate: row.effectiveDate,
        expireDate: this.getLocalToday()
      }
      this.dialogObsoleteVisible = true
    },
    async handleConfirmObsolete() {
      if (this.submitLoading) return
      if (!this.obsoleteForm.expireDate) {
        this.$message.warning('请选择失效日期')
        return
      }
      if (this.obsoleteForm.expireDate < this.getLocalToday()) {
        this.$message.warning('失效日期只能选择当日或之后')
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
  padding: 20px 24px 40px;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.main-card {
  border-radius: 0;
  border: none;
  background: transparent;
}

::v-deep .main-card > .el-card__header,
::v-deep .main-card > .el-card__body {
  background: transparent;
  border-bottom: 0;
  padding: 0;
}

.header-title {
  font-size: 21px;
  font-weight: 700;
  color: #333a45;
}

.header-desc {
  font-size: 13px;
  color: #5a6472;
  margin: 6px 0 18px;
}

.custom-alert {
  margin-top: 0;
  margin-bottom: 16px;
  background-color: #ebf1fa;
  border: 1px solid #c5d5f0;
  border-radius: 6px;
  color: #333a45;
  padding: 13px 20px;
}

.alert-label {
  font-weight: 600;
  color: #2f5496;
  margin-right: 8px;
}

.role-switch-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid #e0e4ea;
}

.main-tabs {
  margin-top: 16px;
}

::v-deep .main-tabs .el-tabs__item {
  height: 40px;
  line-height: 40px;
  padding: 0 24px;
  color: #6b7280;
  font-size: 14px;
}

::v-deep .main-tabs.el-tabs--top .el-tabs__item.is-top:nth-child(2) {
  padding-left: 24px;
}

::v-deep .main-tabs.el-tabs--top .el-tabs__item.is-top:last-child {
  padding-right: 24px;
}

::v-deep .main-tabs .el-tabs__item.is-active {
  color: #2f5496;
  font-weight: 600;
}

::v-deep .main-tabs .el-tabs__active-bar {
  background-color: #2f5496;
  height: 2px;
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
  color: #333a45;
}

.toolbar-actions {
  display: flex;
  align-items: center;
}

.version-label {
  font-size: 13px;
  color: #333a45;
  margin-right: 8px;
}

.version-date-tip {
  font-size: 13px;
  color: #98a1ad;
}

::v-deep .el-button--primary {
  background-color: #4472c4;
  border-color: #4472c4;
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
  font-size: 12px;
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
  border-radius: 10px;
  border: 0;
  font-size: 12px;
  font-weight: 400;
}

.status-tag.el-tag--success {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-tag.el-tag--warning {
  background: #fdf3e7;
  color: #e67e22;
}

.status-tag.el-tag--info {
  background: #eef0f2;
  color: #5a6472;
}

/* 弹窗专用样式 */
.dialog-version-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 34px;
  font-size: 14px;
  color: #333a45;
  line-height: 20px;
  margin-bottom: 14px;
}

.dialog-version-tip > span {
  width: 110px;
  flex-shrink: 0;
  color: #5a6472;
}

.batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-tip {
  font-size: 12px;
  color: #98a1ad;
}

.fixed-text {
  font-size: 14px;
  font-weight: 600;
  color: #333a45;
}

.form-tip {
  font-size: 12px;
  color: #98a1ad;
  line-height: 18px;
  margin-top: 8px;
}

::v-deep .beauty-dialog .dialog-form .el-form-item {
  margin-bottom: 18px;
}

::v-deep .beauty-dialog .dialog-form .el-form-item:last-child {
  margin-bottom: 0;
}

::v-deep .beauty-dialog .dialog-form .el-form-item__label {
  color: #5a6472;
  font-size: 14px;
  line-height: 32px;
}

::v-deep .beauty-dialog .dialog-form .el-form-item__content {
  color: #333a45;
  font-size: 14px;
  line-height: 32px;
}

::v-deep .beauty-dialog {
  border-radius: 8px;
  max-width: 90vw;
}

::v-deep .beauty-dialog .el-dialog__header {
  border-bottom: 1px solid #e0e4ea;
  padding: 16px 18px;
}

::v-deep .beauty-dialog .el-dialog__title {
  color: #343a44;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  padding-left: 0;
}

::v-deep .beauty-dialog .el-dialog__header::before {
  display: none;
}

::v-deep .beauty-dialog .el-dialog__footer {
  border-top: 1px solid #e0e4ea;
  padding: 14px 18px;
}

::v-deep .beauty-dialog .el-dialog__body {
  padding: 18px;
  color: #333a45;
}

::v-deep .beauty-dialog .el-input__inner,
::v-deep .beauty-dialog .el-select .el-input__inner {
  height: 32px;
  line-height: 32px;
  font-size: 13px;
}

::v-deep .beauty-dialog .el-select .el-input__inner {
  font-size: 12px;
  padding-left: 6px;
  padding-right: 22px;
}

::v-deep .beauty-dialog .el-dialog__footer .el-button,
::v-deep .toolbar-actions .el-button {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}

::v-deep .toolbar-actions .el-input__inner {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

::v-deep .version-dialog .el-input__inner {
  height: 38px;
  line-height: 38px;
  font-size: 14px;
}

::v-deep .version-dialog .el-date-editor .el-input__inner {
  height: 40px;
  line-height: 40px;
}

::v-deep .version-dialog .el-form-item__label,
::v-deep .version-dialog .el-form-item__content {
  line-height: 38px;
}

::v-deep .batch-operation-cell .cell {
  padding: 0 8px;
}

.batch-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.batch-row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border: 1px solid;
  border-radius: 4px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  cursor: pointer;
}

.batch-row-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-row-remove {
  color: #dc2626;
  background-color: #fef2f2;
  border-color: #fca5a5;
}

.batch-row-add {
  color: #2e7d32;
  background-color: #f0fdf4;
  border-color: #86efac;
}

::v-deep .role-switch-row .el-radio-button__inner {
  font-size: 13px;
  padding: 7px 16px;
  line-height: 18px;
}

::v-deep .role-switch-row .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background-color: #4472c4;
  border-color: #4472c4;
  box-shadow: -1px 0 0 0 #4472c4;
}

.batch-validation {
  margin-top: 14px;
  padding: 13px 20px;
  background: #ebf1fa;
  border: 1px solid #c5d5f0;
  border-radius: 6px;
  font-size: 13px;
  color: #333a45;
}

::v-deep .beauty-dialog .el-button--primary {
  background-color: #4472c4;
  border-color: #4472c4;
}
</style>
