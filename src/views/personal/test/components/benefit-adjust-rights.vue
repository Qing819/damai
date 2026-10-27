<template>
  <div :class="['benefit-rights', { 'rights-readonly': readonly }]">
    <div v-if="!readonly" class="rights-toolbar">
      <span>{{ hint }}已选 <b>{{ value.length }}</b> 条 · 点击行可展开配置服务项目</span>
      <div class="toolbar-buttons">
        <el-button type="text" size="mini" @click="expandAll(true)">全部展开</el-button>
        <el-button type="text" size="mini" @click="expandAll(false)">全部收起</el-button>
        <el-button size="small" @click="openPicker">＋ 选择权益</el-button>
      </div>
    </div>
    <el-table ref="rightsTable" :data="value" row-key="benefitCode" size="small" :expand-row-keys="expandedKeys" empty-text="请点击右上角「＋ 选择权益」添加服务权益" @row-click="toggleRow">
      <el-table-column type="expand" :width="readonly ? 1 : 30">
        <template slot-scope="{ row }">
          <div class="project-panel">
            <div class="project-title">服务项目</div>
            <el-table :data="row.items" size="mini" border empty-text="暂无服务项目明细">
              <el-table-column prop="cat" label="服务类别" :width="readonly ? null : 110" min-width="100" />
              <el-table-column prop="name" label="服务项目名称" min-width="130" />
              <el-table-column label="服务频次" :min-width="readonly ? 150 : 360">
                <template slot-scope="project">
                  <span v-if="readonly">{{ frequency(project.row) }}</span>
                  <div v-else class="frequency">
                    <el-checkbox v-model="project.row.freqUnlimited">不限次数</el-checkbox>
                    <el-input-number v-model="project.row.freqYears" :min="1" :precision="0" :controls="false" :disabled="project.row.freqUnlimited" size="mini" />
                    <span>年内平均</span>
                    <el-input-number v-model="project.row.freqAvgYears" :min="1" :precision="0" :controls="false" :disabled="project.row.freqUnlimited" size="mini" />
                    <span>年使用</span>
                    <el-input-number v-model="project.row.freqCount" :min="1" :precision="0" :controls="false" :disabled="project.row.freqUnlimited" size="mini" />
                    <span>次</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="是否需订单申请" width="120">
                <template slot-scope="project">
                  <span v-if="readonly">{{ yesNo(project.row.needOrder) }}</span>
                  <el-checkbox v-else v-model="project.row.needOrder" />
                </template>
              </el-table-column>
              <el-table-column label="订单申请途径" :min-width="readonly ? 130 : 240">
                <template slot-scope="project">
                  <span v-if="readonly">{{ project.row.needOrder ? display(project.row.orderChannels, channels) : '—' }}</span>
                  <el-checkbox-group v-else v-model="project.row.orderChannels" :disabled="!project.row.needOrder">
                    <el-checkbox v-for="item in channels" :key="item.code" :label="item.code">{{ item.name }}</el-checkbox>
                  </el-checkbox-group>
                </template>
              </el-table-column>
              <el-table-column label="是否审核" width="90">
                <template slot-scope="project">
                  <span v-if="readonly">{{ yesNo(project.row.needAudit) }}</span>
                  <el-checkbox v-else v-model="project.row.needAudit" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="benefitCode" label="服务权益ID" :width="readonly ? 97 : 110" />
      <el-table-column prop="kind" label="服务种类" :width="readonly ? 82 : 90" />
      <el-table-column prop="benefitName" label="服务权益" :min-width="readonly ? 100 : 130" />
      <el-table-column label="服务项目" :min-width="readonly ? 82 : 120">
        <template slot-scope="{ row }">{{ projectNames(row) }}</template>
      </el-table-column>
      <el-table-column prop="supplier" label="服务商" :min-width="readonly ? 100 : 140" show-overflow-tooltip />
      <el-table-column prop="signOrg" label="签约机构" :width="readonly ? 82 : 120" />
      <el-table-column label="适用地区" :min-width="readonly ? 82 : 150">
        <template slot-scope="{ row }">
          <span v-if="readonly">{{ display(row.regions) }}</span>
          <el-select v-else v-model="row.regions" multiple collapse-tags size="mini" placeholder="请选择适用地区">
            <el-option v-for="region in regions" :key="region" :label="region" :value="region" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="适用身份" :min-width="readonly ? 170 : 150">
        <template slot-scope="{ row }">
          <span v-if="readonly">{{ display(row.identities, identities) }}</span>
          <el-select v-else v-model="row.identities" multiple collapse-tags size="mini" placeholder="请选择适用身份">
            <el-option v-for="identity in identities" :key="identity.code" :label="identity.name" :value="identity.code" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="项目数" :width="readonly ? 66 : 70">
        <template slot-scope="{ row }">{{ row.items.length || row.itemCount || 0 }} 项</template>
      </el-table-column>
      <el-table-column v-if="readonly" label="有效期" width="107">
        <template>{{ validEndDate || '—' }}</template>
      </el-table-column>
      <el-table-column v-else label="操作" width="60">
        <template slot-scope="{ $index }"><el-button type="text" size="small" class="remove-button" @click="remove($index)">移除</el-button></template>
      </el-table-column>
    </el-table>

    <el-dialog title="选择权益" :visible.sync="pickerVisible" width="1000px" append-to-body custom-class="benefit-picker-dialog" :close-on-click-modal="false">
      <div class="picker-search">
        <el-input v-model="keyword" placeholder="搜索服务权益ID / 服务权益 / 服务商" clearable size="small" />
        <span>支持多选，勾选后点击「添加所选权益」 共 {{ filteredCatalog.length }} 条</span>
      </div>
      <el-table ref="pickerTable" :data="filteredCatalog" row-key="benefitCode" size="small" max-height="400" @selection-change="selection = $event">
        <el-table-column prop="benefitCode" label="服务权益ID" width="110" />
        <el-table-column prop="kind" label="服务种类" width="100" />
        <el-table-column prop="benefitName" label="服务权益" min-width="150" />
        <el-table-column label="服务项目" min-width="140">
          <template slot-scope="{ row }">{{ libraryProjects(row) }}</template>
        </el-table-column>
        <el-table-column prop="supplier" label="服务商" min-width="150" />
        <el-table-column prop="signOrg" label="签约机构" min-width="120" />
        <el-table-column type="selection" reserve-selection :selectable="selectable" width="45" />
      </el-table>
      <div slot="footer">
        <el-button size="medium" @click="pickerVisible = false">取消</el-button>
        <el-button type="primary" size="medium" @click="addSelection">添加所选权益</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { parseList, normalizeBenefit } from '../benefit-adjust-model'

export default {
  name: 'BenefitAdjustRights',
  props: {
    value: { type: Array, default: () => [] },
    catalog: { type: Array, default: () => [] },
    regions: { type: Array, default: () => [] },
    identities: { type: Array, default: () => [] },
    channels: { type: Array, default: () => [] },
    readonly: Boolean,
    hint: { type: String, default: '' },
    validEndDate: { type: String, default: '' }
  },
  data() {
    return { pickerVisible: false, keyword: '', selection: [], expandedKeys: [] }
  },
  computed: {
    filteredCatalog() {
      const keyword = this.keyword.trim().toLowerCase()
      return this.catalog.filter(item => [item.benefitCode, item.benefitName, item.supplier]
        .some(value => String(value || '').toLowerCase().includes(keyword)))
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(rows) { this.expandedKeys = rows.map(row => row.benefitCode) }
    }
  },
  methods: {
    display(values, options = []) {
      return (values || []).map(code => {
        const option = options.find(item => item.code === code)
        return option ? option.name : code
      }).join('、') || '—'
    },
    frequency(item) {
      if (item.freqUnlimited) return '不限次数'
      if ([item.freqYears, item.freqAvgYears, item.freqCount].some(value => value == null)) return '—'
      return `${item.freqYears}年内平均${item.freqAvgYears}年使用${item.freqCount}次`
    },
    yesNo(value) { return value == null ? '—' : value ? '是' : '否' },
    projectNames(row) { return row.items.map(item => item.name).join('、') || '—' },
    libraryProjects(row) { return parseList(row.itemsJson).map(item => item.name).join('、') || '—' },
    expandAll(expand) { this.expandedKeys = expand ? this.value.map(row => row.benefitCode) : [] },
    toggleRow(row, column) {
      if (!this.readonly && column && ['服务权益ID', '服务种类', '服务权益', '服务项目', '服务商', '签约机构', '项目数'].includes(column.label)) {
        const key = row.benefitCode
        this.expandedKeys = this.expandedKeys.includes(key) ? this.expandedKeys.filter(value => value !== key) : [...this.expandedKeys, key]
      }
    },
    remove(index) { this.$emit('input', this.value.filter((row, position) => position !== index)) },
    selectable(row) { return !this.value.some(item => item.benefitCode === row.benefitCode) },
    openPicker() {
      this.keyword = ''
      this.selection = []
      this.pickerVisible = true
      this.$nextTick(() => this.$refs.pickerTable.clearSelection())
    },
    addSelection() {
      const selected = this.selection.filter(row => this.selectable(row))
      if (!selected.length) return this.$message.warning('请先勾选需要添加的权益')
      this.$emit('input', [...this.value, ...selected.map(row => normalizeBenefit(row, this.catalog, this.identities, this.channels, true))])
      this.pickerVisible = false
    }
  }
}
</script>

<style scoped>
.rights-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 2px 0 8px; color: #5a6472; font-size: 12px; flex-wrap: wrap; }
.rights-toolbar b { color: #4f6fae; }
.toolbar-buttons { display: flex; align-items: center; gap: 8px; }
.toolbar-buttons .el-button { margin-left: 0; }
.project-panel { padding: 8px 10px 10px 30px; }
.rights-readonly .project-panel { padding: 12px 18px; }
.rights-readonly ::v-deep .el-table__expand-icon { display: none; }
.project-title { margin-bottom: 6px; font-size: 12px; font-weight: 600; color: #5a6472; }
.frequency { display: flex; align-items: center; gap: 5px; white-space: nowrap; font-size: 12px; }
.frequency .el-input-number { width: 44px; flex-shrink: 0; }
.frequency ::v-deep .el-input__inner { padding: 0 4px; font-size: 12px; }
.benefit-rights ::v-deep .el-checkbox__label { padding-left: 5px; font-size: 12px; }
.benefit-rights ::v-deep .el-checkbox { margin-right: 12px; }
.benefit-rights .el-select { width: 100%; }
.remove-button { color: #c62828; }
.picker-search { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; color: #98a1ad; font-size: 12px; }
.picker-search .el-input { width: 320px; }
::v-deep .benefit-picker-dialog { max-width: calc(100vw - 32px); }
::v-deep .benefit-picker-dialog .el-dialog__body { height: auto; max-height: 65vh; overflow-y: auto; padding: 18px; }
</style>
