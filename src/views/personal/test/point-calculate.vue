<template>
  <div v-loading.fullscreen.lock="calcLoading || batchLoading" element-loading-text="正在试算，请稍候…" class="trial-page">
    <div class="sticky-heading">
      <h1>积分及等级试算</h1>
      <p>支持老客户转新规则等级试算、新规则全量客户加保/购新试算，结果实时展示</p>
      <div class="scene-tabs">
        <button v-for="(scene, index) in scenes" :key="scene" :class="{ active: currentScene === index }" @click="switchScene(index)">{{ scene }}</button>
      </div>
      <div class="notice"><b>提示</b><div class="notice-viewport"><div class="notice-track"><span>{{ notices[currentScene] }}</span><span aria-hidden="true">{{ notices[currentScene] }}</span></div></div></div>
    </div>
    <el-card shadow="never" class="trial-card">
      <div slot="header" class="card-heading">
        <span>试算条件</span>
        <el-button v-if="currentScene === 0" class="task-entry" @click="openTaskDialog">试算任务</el-button>
      </div>
      <el-form :model="calcForm" class="calc-form" @submit.native.prevent="handleRunCalc">
        <div class="form-row">
          <label class="form-label"><i>*</i>{{ currentScene === 0 ? '客户姓名' : '客户名称' }}</label>
          <el-input v-model.trim="calcForm.custName" aria-label="客户姓名" placeholder="请输入客户姓名" clearable class="name-input" />
          <label class="form-label short-label"><i>*</i>证件类型</label>
          <el-select v-model="calcForm.idType" aria-label="证件类型" placeholder="请选择证件类型" class="type-input">
            <el-option v-for="item in idTypeOptions" :key="item.code" :label="formatIdType(item.name)" :value="item.code" />
          </el-select>
          <template v-if="currentScene === 1">
            <label class="form-label short-label"><i>*</i>证件号码</label>
            <el-input v-model.trim="calcForm.idNo" aria-label="证件号码" placeholder="请输入证件号码" clearable class="id-input" />
          </template>
        </div>
        <div v-if="currentScene === 0" class="form-row">
          <label class="form-label"><i>*</i>证件号</label>
          <el-input v-model.trim="calcForm.idNo" aria-label="证件号" placeholder="请输入证件号" clearable class="id-input" @keyup.enter.native="handleRunCalc" />
          <el-button type="primary" @click="handleRunCalc">试算</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button :loading="importLoading" @click="$refs.fileInput.click()">批量导入</el-button>
        </div>
      </el-form>
      <input ref="fileInput" type="file" accept=".csv" hidden @change="onFileChange">
      <template v-if="currentScene === 0">
        <div class="hint batch-tip">批量操作：支持客户名单批量导入，导入后确认名单再提交试算；提交后可在右上角「试算任务」入口中查看结果</div>
        <div v-if="batchRows.length" class="batch-preview">
          <div class="section-title">导入预览<span class="hint">共 {{ batchRows.length }} 人</span></div>
          <el-table :data="batchRows" stripe size="mini" max-height="340">
            <el-table-column label="客户"><template slot-scope="{ row }">{{ maskName(row.custName) }}</template></el-table-column>
            <el-table-column label="证件类型"><template slot-scope="{ row }">{{ formatIdType(row.idType) }}</template></el-table-column>
            <el-table-column label="证件号码"><template slot-scope="{ row }">{{ maskId(row.idNo) }}</template></el-table-column>
          </el-table>
          <div class="form-row bottom-actions"><el-button type="primary" @click="submitBatch">提交试算</el-button><el-button @click="clearBatch">清空名单</el-button><span class="hint">提交后系统后台批量试算，人员较多时耗时较长</span></div>
        </div>
      </template>
      <template v-else>
        <div class="section-title product-title">产品明细<span class="hint">（共 {{ productList.length }} 个产品）</span><el-button @click="addProduct">+ 添加产品</el-button></div>
        <el-table :data="productList" stripe size="mini">
          <el-table-column label="险种编码" min-width="145"><template slot-scope="{ row, $index }">{{ value(row.riskCode) }} <el-button type="text" size="mini" @click="openProductDialog($index)">选择</el-button></template></el-table-column>
          <el-table-column prop="riskName" label="险种名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="type" label="险种类型" min-width="100" />
          <el-table-column label="年交保费（元）" min-width="150"><template slot-scope="{ row }"><el-input-number v-model="row.premium" :controls="false" :min="0" :precision="2" aria-label="年交保费" /></template></el-table-column>
          <el-table-column label="缴费方式" min-width="150"><template slot-scope="{ row }"><el-select v-model="row.payMode" aria-label="缴费方式"><el-option v-for="item in payModes" :key="item.value" :label="item.label" :value="item.value" /></el-select></template></el-table-column>
          <el-table-column label="是否养老协同" width="120" align="center"><template slot-scope="{ row }"><el-checkbox v-model="row.pensionFlag" aria-label="是否养老协同" /></template></el-table-column>
          <el-table-column label="操作" width="70" align="center"><template slot-scope="{ $index }"><el-button type="text" size="mini" @click="productList.splice($index, 1)">删除</el-button></template></el-table-column>
        </el-table>
        <div class="form-row bottom-actions"><el-button type="primary" @click="handleRunCalc">试算</el-button><el-button @click="handleReset">重置</el-button><span class="hint">支持添加多个产品一同试算，积分按各产品保费 × 险种系数合计</span></div>
      </template>
    </el-card>

    <div v-if="hasCalculated" class="result-box">
      <div class="result-title">试算结果</div>
      <div class="section-title first-title">客户基本信息</div>
      <div class="info-grid"><div v-for="field in customerFields" :key="field.label" class="info-item"><span>{{ field.label }}</span><b>{{ value(field.value) }}</b></div></div>
      <div class="section-title">试算比对</div>
      <div class="comparison">
        <div class="compare-panel"><div class="compare-heading"><b>{{ currentScene === 0 ? '老规则' : '当前' }}</b><span v-if="currentScene === 0">V爱客户管理规则</span></div><div class="compare-body"><div class="metric-row"><span>当前积分</span><b>{{ formatNumber(resultData.oldPoint) }}</b></div><div class="metric-row"><span>当前等级</span><b>{{ formatGrade(resultData.oldGrade) }}</b></div></div></div>
        <div class="compare-arrow wide-arrow"><span class="arrow-circle">→</span><span class="delta" :class="pointDelta.type">{{ pointDelta.text }}</span><span class="delta flat">{{ gradeChange }}</span></div>
        <div class="compare-panel new-panel"><div class="compare-heading"><b>{{ currentScene === 0 ? '新规则' : '试算后（预估）' }}</b><span v-if="currentScene === 0">新积分等级体系</span></div><div class="compare-body"><div class="metric-row"><span>试算积分</span><b>{{ formatNumber(resultData.newPoint) }}</b></div><div class="metric-row"><span>预估等级</span><b>{{ formatGrade(resultData.newGrade || resultData.newGradeName, true) }}</b></div></div></div>
      </div>
      <template v-if="currentScene === 0">
        <div class="section-title">按新规则计算的保单积分明细</div>
        <el-table :data="resultData.pointCalc || []" stripe size="mini">
          <el-table-column v-for="col in policyColumns" :key="col.key" :label="col.label" :min-width="col.width || 120" :align="col.numeric ? 'right' : 'left'">
            <template slot-scope="{ row }"><span :class="col.key === 'point_type' ? ['type-pill', pointClass(row.point_type)] : ''">{{ cellValue(row, col) }}</span></template>
          </el-table-column>
        </el-table>
        <div class="formula">保费积分 <b>{{ formatNumber(pointTotals.premium) }}</b> + 忠诚积分 <b>{{ formatNumber(pointTotals.loyalty) }}</b> + 养老协同积分 <b>{{ formatNumber(pointTotals.pension) }}</b> = 试算汇总积分 <strong>{{ formatNumber(pointTotals.total) }}</strong></div>
        <div class="hint formula-hint">保费积分 = 实收保费（元）× 险种计算系数，每张已生效保单均产生；忠诚积分 = 实收保费（元）× 1%，仅连续交费满 3 年及以上的保单产生（含二次投保奖励）；养老协同积分 = 保费积分 × 5%，仅在养老协同产品的基础积分之外额外奖励。故并非每张保单都有忠诚积分与养老协同积分。客户名下全部已生效保单均纳入试算，新规则试算总积分 {{ formatNumber(resultData.newPoint) }} 分。</div>
      </template>
      <template v-else>
        <div class="section-title">试算摘要</div>
        <template v-for="section in extraSections">
          <div :key="section.title + '-title'" class="hint summary-label">{{ section.title }}</div>
          <el-table :key="section.title" :data="section.rows" stripe size="mini">
            <el-table-column v-for="col in section.columns" :key="col.key" :label="col.label" :min-width="120" :align="col.numeric ? 'right' : 'left'"><template slot-scope="{ row }">{{ cellValue(row, col) }}</template></el-table-column>
          </el-table>
        </template>
        <div class="score-summary"><span>总积分 <b>{{ formatNumber(resultData.newPoint) }}</b></span><span>距下一等级差额 <b>{{ formatNumber(resultData.nextGap) }}</b></span></div>
      </template>
      <div class="section-title">等级权益对比</div>
      <div class="comparison">
        <template v-for="(panel, index) in benefitPanels">
          <div v-if="index === 1" :key="panel.title + '-arrow'" class="compare-arrow"><span class="arrow-circle">→</span><span class="hint">{{ currentScene === 0 ? '老规则→新规则' : '当前→试算后' }}</span></div>
          <div :key="panel.title" class="compare-panel" :class="{ 'new-panel': index === 1 }">
            <div class="compare-heading"><b>{{ panel.title }}</b><span v-if="currentScene === 0">{{ index === 0 ? 'V爱客户管理规则' : '新积分等级体系' }}</span></div>
            <div class="compare-body"><el-table :data="panel.rows" stripe size="mini">
              <el-table-column label="服务权益" min-width="120"><template slot-scope="{ row }">{{ value(row.benefit_name) }} <el-tag v-if="index === 1 && row.added" type="success" size="mini">新增</el-tag></template></el-table-column>
              <el-table-column label="服务项目" min-width="100" show-overflow-tooltip><template slot-scope="{ row }">{{ formatItems(row.items_json) }}</template></el-table-column>
              <el-table-column prop="supplier" label="服务商" min-width="100" show-overflow-tooltip />
              <el-table-column :label="index === 0 ? '可使用次数' : '权益次数'" width="100" align="center"><template slot-scope="{ row }">{{ benefitCount(row, index === 1) }}</template></el-table-column>
              <el-table-column v-if="index === 0" label="已使用" width="70" align="center"><template slot-scope="{ row }">{{ value(row.used_count) }}</template></el-table-column>
            </el-table></div>
          </div>
        </template>
      </div>
    </div>

    <el-dialog title="试算任务" :visible.sync="taskDialogVisible" width="1120px" custom-class="trial-dialog" :close-on-click-modal="false">
      <el-tabs v-model="activeTaskTab" @tab-click="handleTaskTabChange">
        <el-tab-pane label="试算记录" name="record" />
        <el-tab-pane label="试算明细" name="detail" />
      </el-tabs>
      <div class="dialog-query">
        <template v-if="activeTaskTab === 'detail'">
          <el-input v-model.trim="detailQueryForm.custName" placeholder="客户" clearable />
          <el-input v-model.trim="detailQueryForm.idNo" placeholder="证件号码" clearable class="wide-input" />
          <el-select v-model="detailQueryForm.status" placeholder="全部状态" clearable><el-option label="全部状态" value="" /><el-option label="已完成" value="DONE" /><el-option label="试算中" value="RUNNING" /><el-option label="失败" value="FAILED" /></el-select>
        </template>
        <el-input v-model.trim="activeTaskQuery.applicant" placeholder="申请人" clearable />
        <span class="hint">申请时间</span>
        <el-date-picker v-model="activeTaskQuery.dateFrom" type="date" placeholder="开始日期" value-format="yyyy-MM-dd" />
        <span class="hint">~</span>
        <el-date-picker v-model="activeTaskQuery.dateTo" type="date" placeholder="结束日期" value-format="yyyy-MM-dd" />
        <el-button type="primary" @click="searchTasks">查询</el-button><el-button @click="resetTaskQuery">重置</el-button><el-button :loading="exportLoading" @click="exportTasks">导出</el-button>
      </div>
      <el-table v-if="activeTaskTab === 'record'" v-loading="taskLoading" :data="taskRecordData" stripe size="mini">
        <el-table-column label="试算时间" min-width="160"><template slot-scope="{ row }">{{ displayTime(row.trialTime) }}</template></el-table-column>
        <el-table-column prop="cnt" label="试算人数" width="100" />
        <el-table-column label="申请人" min-width="100"><template slot-scope="{ row }">{{ value(row.operator) }}</template></el-table-column>
        <el-table-column label="状态" width="100"><template slot-scope="{ row }"><span class="status-pill" :class="statusClass(row.status)">{{ statusText(row.status) }}</span></template></el-table-column>
        <el-table-column label="操作" min-width="220"><template slot-scope="{ row }"><el-button v-if="row.status !== 'RUNNING'" type="text" size="mini" @click="viewTaskResult(row)">试算结果</el-button><span v-else class="hint">试算进行中，完成后可查看结果</span></template></el-table-column>
      </el-table>
      <el-table v-else v-loading="taskLoading" :data="taskDetailData" stripe size="mini">
        <el-table-column v-for="col in detailColumns" :key="col.key" :label="col.label" :min-width="col.width || 120" :align="col.numeric ? 'right' : 'left'"><template slot-scope="{ row }">{{ taskCell(row, col) }}</template></el-table-column>
      </el-table>
      <div class="pagination-row"><el-pagination background :current-page="taskPageNum" :page-size="10" :total="taskTotal" layout="total, prev, pager, next" @current-change="changeTaskPage" /><span class="hint">{{ activeTaskTab === 'record' ? '仅记录老客户转新规则（场景一）的批量试算任务，结果仅供预估参考' : '汇总全部试算任务的客户试算明细，敏感信息脱敏展示' }}</span></div>
      <span slot="footer"><el-button @click="taskDialogVisible = false">关闭</el-button></span>
    </el-dialog>

    <el-dialog title="选择险种" :visible.sync="productDialogVisible" width="1000px" custom-class="trial-dialog" :close-on-click-modal="false">
      <div class="dialog-query">
        <el-input v-model.trim="riskQuery.riskCode" placeholder="险种编码" clearable /><el-input v-model.trim="riskQuery.riskName" placeholder="险种名称" clearable class="wide-input" />
        <el-select v-for="(options, index) in riskClasses" :key="index" v-model="riskQuery['type' + (index + 1)]" :placeholder="'全部分类' + ['一', '二', '三', '四'][index]" clearable><el-option v-for="option in options" :key="option" :label="option" :value="option" /></el-select>
        <el-button type="primary" @click="searchRisks">查询</el-button><el-button @click="resetRisks">重置</el-button>
      </div>
      <el-table ref="riskTable" v-loading="riskLoading" :data="riskRows" stripe size="mini" max-height="340" highlight-current-row @current-change="selectRisk">
        <el-table-column width="45"><template slot-scope="{ row }"><el-radio :value="selectedRisk ? selectedRisk.riskCode : ''" :label="row.riskCode" @change="selectRisk(row)"><span /></el-radio></template></el-table-column>
        <el-table-column prop="riskCode" label="险种编码" min-width="100" /><el-table-column prop="riskName" label="险种名称" min-width="180" show-overflow-tooltip />
        <el-table-column v-for="(name, index) in ['一', '二', '三', '四']" :key="name" :prop="'type' + (index + 1)" :label="'险种分类' + name" min-width="110" />
      </el-table>
      <div class="pagination-row"><el-pagination background :current-page="riskPageNum" :page-size="10" :total="riskTotal" layout="total, prev, pager, next" @current-change="changeRiskPage" /></div>
      <span slot="footer"><el-button @click="productDialogVisible = false">取消</el-button><el-button type="primary" @click="confirmSelectProduct">确定</el-button></span>
    </el-dialog>

    <el-dialog title="试算结果" :visible.sync="taskResultVisible" width="960px" custom-class="trial-dialog" :close-on-click-modal="false">
      <div class="section-title first-title">基本信息</div>
      <div class="info-grid"><div v-for="field in taskResultFields" :key="field.label" class="info-item"><span>{{ field.label }}</span><b>{{ value(field.value) }}</b></div></div>
      <div class="section-title">试算结果<span class="hint">共 {{ resultTotal }} 条</span></div>
      <el-table v-loading="taskResultLoading" :data="taskResultRows" stripe size="mini">
        <el-table-column v-for="col in detailColumns.slice(0, 7)" :key="col.key" :label="col.label" :min-width="col.width || 120"><template slot-scope="{ row }">{{ taskCell(row, col) }}</template></el-table-column>
      </el-table>
      <div class="pagination-row"><el-pagination background :current-page="resultPageNum" :page-size="10" :total="resultTotal" layout="total, prev, pager, next" @current-change="changeResultPage" /></div>
      <div class="hint">试算结果为按新规则预估，正式切换以跑批核算为准。</div>
      <span slot="footer"><el-button @click="taskResultVisible = false">关闭</el-button></span>
    </el-dialog>
    <el-dialog title="提交成功" :visible.sync="queuedVisible" width="460px" custom-class="trial-dialog">
      <div class="hint">本次试算已提交，请稍后在「试算任务」中查看结果。</div>
      <span slot="footer"><el-button type="primary" @click="queuedVisible = false">知道了</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
import { switchTrialApi, switchTrialBatchApi, switchTrialExtraApi, getTrialCustomerProfileApi, getSwitchTrialTaskPageApi, getSwitchTrialItemPageApi, getSwitchTrialRiskPageApi, switchTrialItemExportApi, getSwitchIdTypesApi } from '@/api/test'
import { formatIdType, formatTime, parseList } from './benefit-adjust-model'
import { parseTrialCsv, trialCsv, trialNumber, trialGrade } from './trial-model'

const newForm = () => ({ custName: '', idType: 'IDCARD', idNo: '' })
const newTaskQuery = () => ({ applicant: '', dateFrom: '', dateTo: '' })
const newDetailQuery = () => ({ ...newTaskQuery(), custName: '', idNo: '', status: '' })
const newRiskQuery = () => ({ riskCode: '', riskName: '', type1: '', type2: '', type3: '', type4: '' })
const policyColumns = [
  { key: 'policy_no', label: '保单号', width: 140 }, { key: 'riskname', label: '险种', width: 180 },
  { key: 'point_type', label: '积分类型' }, { key: 'premium', label: '实收保费（元）', numeric: true },
  { key: 'calc_coefficient', label: '计算系数', percent: true }, { key: 'payyears', label: '连续交费（年）' },
  { key: 'point', label: '积分（分）', numeric: true }
]
const detailColumns = [
  { key: 'customer', label: '客户', width: 150 }, { key: 'idType', label: '证件类型' }, { key: 'idNo', label: '证件号码', width: 160 },
  { key: 'oldPoint', label: '老规则当前积分', numeric: true }, { key: 'oldGrade', label: '老规则当前等级' },
  { key: 'newPoint', label: '新规则试算积分', numeric: true }, { key: 'newGrade', label: '新规则预估等级' },
  { key: 'operator', label: '申请人' }, { key: 'trialTime', label: '申请时间', width: 155 }, { key: 'status', label: '状态' }
]
function clean(params) {
  return Object.keys(params).reduce((result, key) => {
    if (params[key] != null && params[key] !== '') result[key] = params[key]
    return result
  }, {})
}

export default {
  name: 'TrialCalcPage',
  data() {
    return {
      currentScene: 0, calcForm: newForm(), idTypeOptions: [], calcLoading: false, resultData: {}, hasCalculated: false,
      scenes: ['场景一：老客户转新规则等级试算', '场景二：新规则全量客户加保/购新试算'],
      notices: [
        '本结果为模拟预估，不代表最终等级，仅供参考。试算不会变更账户真实等级与权益，实际等级以系统正式核算为准。客户数据发生变动时，试算结果会随之变化。',
        '试算支持两类场景：一是老系统客户迁移至新系统，并叠加拟办理的加保/购新业务；二是已在新系统的客户直接叠加拟办理的加保/购新业务，模拟预判等级变动。试算基于客户当前账户数据开展模拟计算，不会修改账户真实数据、不产生真实业务生效，亦不会变更现有等级与权益；若客户原有业绩、业务状态、有效期发生变动，试算结果将同步变化，最终等级以系统迁移、加保/购新业务真实生效后，按新版规则正式核算为准。'
      ],
      productList: [], payModes: [{ label: '趸交', value: 'year' }, ...Array.from({ length: 9 }, (_, index) => ({ label: index === 8 ? '期交10年及以上' : `期交${index + 2}年`, value: `period${index + 2}` }))],
      policyColumns, detailColumns, batchRows: [], importLoading: false, importRequestId: 0, batchLoading: false, queuedVisible: false,
      taskDialogVisible: false, activeTaskTab: 'record', taskQueryForm: newTaskQuery(), detailQueryForm: newDetailQuery(),
      taskApplied: {}, detailApplied: {}, taskLoading: false, taskRequestId: 0, taskRecordData: [], taskDetailData: [], taskPageNum: 1, taskTotal: 0, exportLoading: false,
      productDialogVisible: false, productIndex: -1, selectedRisk: null, riskQuery: newRiskQuery(), riskApplied: {}, riskRows: [], riskLoading: false, riskRequestId: 0, riskPageNum: 1, riskTotal: 0,
      riskClasses: [['人身保险', '财产保险'], ['年金保险', '人寿保险', '健康保险', '意外伤害保险', '财产损失保险'], ['分红型', '万能型', '传统型', '医疗险', '重疾险'], ['个人', '团体']],
      taskResultVisible: false, selectedTask: {}, taskResultRows: [], resultPageNum: 1, resultTotal: 0, taskResultLoading: false, resultRequestId: 0
    }
  },
  computed: {
    activeTaskQuery() { return this.activeTaskTab === 'record' ? this.taskQueryForm : this.detailQueryForm },
    pointTotals() { return this.resultData.pointCalcTotal || {} },
    customerFields() {
      const data = this.resultData
      const fields = [{ label: '客户名称', value: this.maskName(data.custName) }, { label: '客户号', value: data.custId }, { label: '证件类型', value: formatIdType(data.idType) }, { label: '证件号码', value: this.maskId(data.idNo) }, { label: '服务归属机构', value: data.orgName }]
      if (this.currentScene === 1) fields.push({ label: '客户积分体系', value: data.migrateScene ? '老积分体系' : data.ruleVersionTag ? data.ruleVersionTag === 'V1_LEGACY' ? '老积分体系' : '新积分体系' : '—' })
      return fields
    },
    pointDelta() {
      const old = this.resultData.oldPoint
      const next = this.resultData.newPoint
      if (old == null || old === '' || next == null || next === '' || !Number.isFinite(Number(old)) || !Number.isFinite(Number(next))) return { text: '积分 —', type: 'flat' }
      const delta = Number(next) - Number(old)
      return { text: `积分 ${delta > 0 ? '+' : ''}${trialNumber(delta)}`, type: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' }
    },
    gradeChange() {
      const old = trialGrade(this.resultData.oldGrade)
      const next = trialGrade(this.resultData.newGrade)
      if (old === '—' || next === '—') return '等级 —'
      if (old === next) return '等级 持平'
      return `等级 ${old} → ${next}`
    },
    extraSections() {
      return [
        { title: '现有保单积分（客户名下已生效保单，按新规则累计）', rows: this.resultData.policyDetails || [], columns: [
          { key: 'policy_no', label: '保单号' }, { key: 'riskcode', label: '险种编码' }, { key: 'riskname', label: '险种' }, { key: 'premium', label: '年交保费（元）', numeric: true }, { key: 'calc_coefficient', label: '计算系数', percent: true }, { key: 'point', label: '积分（分）', numeric: true }
        ] },
        { title: '加保/购新积分（按上方产品明细试算）', rows: this.resultData.extraDetails || [], columns: [
          { key: 'riskCode', label: '险种编码' }, { key: 'riskName', label: '险种名称' }, { key: 'premium', label: '年交保费（元）', numeric: true }, { key: 'factor', label: '首期保费计算系数', percent: true }, { key: 'premiumPoint', label: '积分（分）', numeric: true }
        ] }
      ]
    },
    benefitPanels() {
      return [
        { title: this.currentScene === 0 ? '老系统当前权益' : '当前权益', rows: (this.currentScene === 0 ? this.resultData.oldBenefits : this.resultData.currentBenefits) || [] },
        { title: this.currentScene === 0 ? '新规则权益' : '试算后权益', rows: (this.currentScene === 0 ? this.resultData.newBenefits : this.resultData.newGradeBenefits) || [] }
      ]
    },
    taskResultFields() {
      return [
        { label: '申请时间', value: this.displayTime(this.selectedTask.trialTime) }, { label: '申请人', value: this.selectedTask.operator },
        { label: '完成时间', value: this.displayTime(this.selectedTask.completeTime) }, { label: '耗时', value: this.selectedTask.duration }
      ]
    }
  },
  async created() {
    try { const res = await getSwitchIdTypesApi(); this.idTypeOptions = res.data || [] } catch (error) { this.$message.error('证件类型加载失败，请刷新重试') }
  },
  beforeDestroy() {
    this.taskRequestId++
    this.riskRequestId++
    this.resultRequestId++
    this.importRequestId++
  },
  methods: {
    formatIdType,
    formatNumber: trialNumber,
    formatGrade: trialGrade,
    value(data) { return data == null || data === '' ? '—' : data },
    displayTime(data) { return formatTime(data).slice(0, 16) },
    maskName(data) { return data ? String(data).slice(0, 1) + '*'.repeat(Math.max(String(data).length - 1, 1)) : '—' },
    maskId(data) { return data ? String(data).includes('*') ? data : String(data).slice(0, -4) + '****' : '—' },
    formatItems(data) { return this.value(parseList(data).map(item => item.name).filter(Boolean).join('、')) },
    benefitCount(row, isNew) {
      if (isNew) return [1, true, '1', '00'].includes(row.freq_unlimited) ? '不限次' : row.freq_count == null ? '—' : `${row.freq_count} 次`
      return row.grant_count == null ? '不限次' : `${row.grant_count} 次`
    },
    pointLabel(type) { return { PREMIUM: '保费积分', bf: '保费积分', LOYALTY: '忠诚积分', zc: '忠诚积分', PENSION: '养老协同积分', pension: '养老协同积分', yl: '养老协同积分' }[type] || this.value(type) },
    pointClass(type) { return { 保费积分: 'pill-blue', 忠诚积分: 'pill-purple', 养老协同积分: 'pill-orange' }[this.pointLabel(type)] || '' },
    cellValue(row, col) {
      const value = row[col.key]
      if (col.key === 'point_type') return this.pointLabel(value)
      if (col.percent) return value == null || value === '' ? '—' : `${Number((Number(value) * 100).toFixed(6))}%`
      return col.numeric ? trialNumber(value) : this.value(value)
    },
    taskCell(row, col) {
      if (col.key === 'customer') return `${this.maskName(row.custName)}（${this.value(row.custId)}）`
      if (col.key === 'idNo') return this.maskId(row.idNo)
      if (col.key === 'idType') return formatIdType(row.idType)
      if (col.key === 'oldGrade' || col.key === 'newGrade') return trialGrade(row[col.key], col.key === 'newGrade')
      if (col.key === 'trialTime') return this.displayTime(row.trialTime)
      if (col.key === 'status') return this.statusText(row.status)
      return this.cellValue(row, col)
    },
    statusText(status) { return { DONE: '已完成', RUNNING: '试算中', FAILED: '失败' }[status] || this.value(status) },
    statusClass(status) { return status === 'DONE' ? 'pill-green' : status === 'FAILED' ? 'pill-red' : 'pill-orange' },
    switchScene(scene) {
      if (this.calcLoading || this.batchLoading || scene === this.currentScene) return
      this.currentScene = scene
      this.handleReset()
    },
    handleReset() {
      this.calcForm = newForm()
      this.resultData = {}
      this.hasCalculated = false
      this.productList = []
      this.clearBatch()
    },
    async handleRunCalc() {
      if (this.calcLoading || this.batchLoading) return
      if (!this.calcForm.custName || !this.calcForm.idNo || !this.idTypeOptions.some(item => item.code === this.calcForm.idType)) return this.$message.warning('请填写客户姓名、证件类型和证件号码')
      if (this.currentScene === 1 && (!this.productList.length || this.productList.some(item => !item.riskCode || !Number.isFinite(item.premium) || item.premium <= 0))) return this.$message.warning('请至少添加一个险种，并填写大于 0 的年交保费')
      this.calcLoading = true
      this.hasCalculated = false
      this.resultData = {}
      try {
        const payload = { ...this.calcForm }
        if (this.currentScene === 1) payload.products = this.productList.map(item => ({ riskCode: item.riskCode, premium: item.premium, payMode: item.payMode, pensionFlag: item.pensionFlag }))
        const res = await (this.currentScene === 0 ? switchTrialApi(payload) : switchTrialExtraApi(payload))
        if (!res.data || !res.data.custId) throw new Error('未返回有效试算结果')
        if (this.currentScene === 1 && !res.data.migrateScene && !res.data.ruleVersionTag) {
          try {
            const profile = await getTrialCustomerProfileApi(res.data.custId)
            res.data.ruleVersionTag = (profile.data || {}).ruleVersionTag
          } catch (error) { this.$message.warning('客户积分体系加载失败，试算结果仍可查看') }
        }
        this.resultData = res.data
        this.hasCalculated = true
      } catch (error) { this.$message.error(error.message || '试算失败，请核对客户信息后重试') } finally { this.calcLoading = false }
    },
    clearBatch() { this.importRequestId++; this.importLoading = false; this.batchRows = [] },
    async onFileChange(event) {
      const input = event.target
      const file = input.files && input.files[0]
      if (!file) return
      const requestId = ++this.importRequestId
      this.importLoading = true
      this.batchRows = []
      try {
        if (!/\.csv$/i.test(file.name)) throw new Error('请选择 CSV 文件')
        if (!this.idTypeOptions.length) throw new Error('请等待证件类型加载完成后重试')
        const rows = parseTrialCsv(await file.text(), this.idTypeOptions)
        if (requestId === this.importRequestId) this.batchRows = rows
      } catch (error) { if (requestId === this.importRequestId) this.$message.error(error.message) } finally {
        input.value = ''
        if (requestId === this.importRequestId) this.importLoading = false
      }
    },
    async submitBatch() {
      if (this.batchLoading || !this.batchRows.length) return
      this.batchLoading = true
      try {
        const data = new FormData()
        data.append('file', new Blob([trialCsv(this.batchRows)], { type: 'text/csv;charset=utf-8' }), 'trial-customers.csv')
        const res = await switchTrialBatchApi(data)
        if (!res.data || !res.data.taskNo) throw new Error('未返回试算任务号')
        this.$message[res.data.fail ? 'warning' : 'success'](`共 ${res.data.total} 条，成功 ${res.data.success} 条，失败 ${res.data.fail} 条，任务号：${res.data.taskNo}`)
        this.clearBatch()
        this.queuedVisible = true
      } catch (error) { this.$message.error(error.message || '批量试算提交失败，请重试') } finally { this.batchLoading = false }
    },
    addProduct() { this.productList.push({ riskCode: '', riskName: '', type: '', premium: 0, payMode: 'year', pensionFlag: false }) },
    openProductDialog(index) {
      this.productIndex = index
      this.selectedRisk = null
      this.riskQuery = newRiskQuery()
      this.riskApplied = {}
      this.riskPageNum = 1
      this.productDialogVisible = true
      this.fetchRisks()
    },
    searchRisks() { this.riskApplied = clean(this.riskQuery); this.riskPageNum = 1; return this.fetchRisks() },
    resetRisks() { this.riskQuery = newRiskQuery(); return this.searchRisks() },
    changeRiskPage(page) { this.riskPageNum = page; return this.fetchRisks() },
    async fetchRisks() {
      const requestId = ++this.riskRequestId
      this.riskLoading = true
      this.selectedRisk = null
      if (this.$refs.riskTable) this.$refs.riskTable.setCurrentRow()
      try {
        const res = await getSwitchTrialRiskPageApi({ ...this.riskApplied, pageNum: this.riskPageNum, pageSize: 10 })
        if (requestId !== this.riskRequestId) return
        this.riskRows = res.data.list || []
        this.riskTotal = res.data.total || 0
      } catch (error) {
        if (requestId !== this.riskRequestId) return
        this.riskRows = []
        this.riskTotal = 0
        this.$message.error('险种列表加载失败，请重试')
      } finally { if (requestId === this.riskRequestId) this.riskLoading = false }
    },
    selectRisk(row) { this.selectedRisk = row },
    confirmSelectProduct() {
      if (!this.selectedRisk) return this.$message.warning('请选择一个险种')
      if (!this.productList[this.productIndex]) return
      const row = this.selectedRisk
      Object.assign(this.productList[this.productIndex], { riskCode: row.riskCode, riskName: row.riskName, type: row.type2 })
      this.productDialogVisible = false
    },
    dateValid(query) {
      if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
        this.$message.warning('开始日期不能晚于结束日期')
        return false
      }
      return true
    },
    openTaskDialog() {
      this.taskDialogVisible = true
      this.activeTaskTab = 'record'
      this.taskQueryForm = newTaskQuery()
      this.detailQueryForm = newDetailQuery()
      this.taskApplied = {}
      this.detailApplied = {}
      this.taskPageNum = 1
      return this.fetchTasks()
    },
    handleTaskTabChange() { this.taskPageNum = 1; return this.fetchTasks() },
    searchTasks() {
      if (!this.dateValid(this.activeTaskQuery)) return
      this[this.activeTaskTab === 'record' ? 'taskApplied' : 'detailApplied'] = clean(this.activeTaskQuery)
      this.taskPageNum = 1
      return this.fetchTasks()
    },
    resetTaskQuery() {
      this[this.activeTaskTab === 'record' ? 'taskQueryForm' : 'detailQueryForm'] = this.activeTaskTab === 'record' ? newTaskQuery() : newDetailQuery()
      return this.searchTasks()
    },
    changeTaskPage(page) { this.taskPageNum = page; return this.fetchTasks() },
    taskParams() {
      const query = { ...this.activeTaskTab === 'record' ? this.taskApplied : this.detailApplied }
      if (this.activeTaskTab === 'detail') { query.operator = query.applicant; delete query.applicant }
      return clean(query)
    },
    async fetchTasks() {
      const requestId = ++this.taskRequestId
      this.taskLoading = true
      const record = this.activeTaskTab === 'record'
      try {
        const res = await (record ? getSwitchTrialTaskPageApi : getSwitchTrialItemPageApi)({ ...this.taskParams(), pageNum: this.taskPageNum, pageSize: 10 })
        if (requestId !== this.taskRequestId) return
        this[record ? 'taskRecordData' : 'taskDetailData'] = res.data.list || []
        this.taskTotal = res.data.total || 0
      } catch (error) {
        if (requestId !== this.taskRequestId) return
        this[record ? 'taskRecordData' : 'taskDetailData'] = []
        this.taskTotal = 0
        this.$message.error('试算任务加载失败，请重试')
      } finally { if (requestId === this.taskRequestId) this.taskLoading = false }
    },
    async exportTasks() {
      if (this.exportLoading) return
      this.exportLoading = true
      try {
        const params = this.taskParams()
        if (this.activeTaskTab === 'record') { params.operator = params.applicant; delete params.applicant }
        const blob = await switchTrialItemExportApi(params)
        if (blob.type && blob.type.includes('json')) { const data = JSON.parse(await blob.text()); throw new Error((data.header || {}).message || '导出失败') }
        const href = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = href
        link.download = '试算明细.xlsx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(href)
      } catch (error) { this.$message.error(error.message || '导出失败，请重试') } finally { this.exportLoading = false }
    },
    viewTaskResult(row) {
      this.selectedTask = { ...row }
      this.taskResultVisible = true
      this.resultPageNum = 1
      return this.fetchTaskResults()
    },
    changeResultPage(page) { this.resultPageNum = page; return this.fetchTaskResults() },
    async fetchTaskResults() {
      const requestId = ++this.resultRequestId
      this.taskResultLoading = true
      this.taskResultRows = []
      try {
        const res = await getSwitchTrialItemPageApi({ taskNo: this.selectedTask.taskNo, pageNum: this.resultPageNum, pageSize: 10 })
        if (requestId !== this.resultRequestId) return
        this.taskResultRows = res.data.list || []
        this.resultTotal = res.data.total || 0
      } catch (error) {
        if (requestId !== this.resultRequestId) return
        this.resultTotal = 0
        this.$message.error('试算结果加载失败，请重试')
      } finally { if (requestId === this.resultRequestId) this.taskResultLoading = false }
    }
  }
}
</script>

<style scoped>
.trial-page { padding: 16px; min-height: calc(100vh - 84px); background: #f5f7fa; color: #333a45; }
.sticky-heading { position: sticky; top: 0; z-index: 20; background: #f5f7fa; padding-top: 2px; padding-bottom: 1px; }
.sticky-heading h1 { margin: 0; font-size: 21px; font-weight: 700; }
.sticky-heading p { margin: 6px 0 18px; font-size: 13px; color: #5a6472; }
.scene-tabs { display: flex; margin-bottom: 16px; border-bottom: 2px solid #4f6fae; }
.scene-tabs button { padding: 10px 20px; border: 1px solid #e0e4ea; border-bottom: none; border-radius: 6px 6px 0 0; background: white; color: #5a6472; font-size: 14px; cursor: pointer; }
.scene-tabs button.active { background: #4f6fae; border-color: #4f6fae; color: white; font-weight: 600; }
.notice { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding: 9px 14px; background: #fdecea; border: 1px solid #f5c6c0; border-left: 3px solid #c62828; border-radius: 6px; }
.notice b { flex: none; padding: 2px 7px; background: #c62828; border-radius: 3px; color: white; font-size: 11px; letter-spacing: .5px; }
.notice-viewport { flex: 1; min-width: 0; overflow: hidden; }
.notice-track { display: inline-flex; white-space: nowrap; animation: trial-notice 60s linear infinite; }
.notice-track:hover { animation-play-state: paused; }
.notice-track span { padding-right: 80px; color: #c62828; font-size: 13px; line-height: 1.5; }
@keyframes trial-notice { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.trial-card { margin-bottom: 16px; border: 1px solid #e0e4ea; border-radius: 6px; }
.trial-card ::v-deep .el-card__header { padding: 13px 18px; }
.trial-card ::v-deep .el-card__body { padding: 16px 18px; }
.card-heading { display: flex; align-items: center; justify-content: space-between; font-size: 15px; font-weight: 600; }
.task-entry { padding: 4px 14px; border-radius: 16px; font-size: 13px; font-weight: 400; color: #2f5496; }
.form-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.form-label { width: 110px; flex-shrink: 0; font-size: 14px; color: #5a6472; }
.form-label i { font-style: normal; color: #c62828; margin-right: 4px; }
.form-label.short-label { width: 70px; }
.name-input { width: 200px; }
.type-input { width: 160px; }
.id-input { width: 240px; }
.trial-page ::v-deep .calc-form .el-input__inner, .dialog-query ::v-deep .el-input__inner { height: 40px; line-height: 40px; font-size: 14px; }
.trial-page ::v-deep .calc-form .el-input__icon, .dialog-query ::v-deep .el-input__icon { line-height: 40px; }
.form-row > .el-button, .product-title > .el-button, .dialog-query > .el-button { height: 36px; padding: 0 16px; margin: 0; font-size: 14px; font-weight: 400; }
.hint { font-size: 12px; color: #98a1ad; font-weight: 400; }
.batch-tip { margin-left: 122px; }
.batch-preview { margin-top: 14px; }
.section-title { margin: 28px 0 8px; padding-left: 9px; border-left: 3px solid #4472c4; color: #2f5496; font-size: 14px; font-weight: 600; line-height: 1.4; }
.section-title .hint { margin-left: 8px; }
.first-title, .batch-preview > .section-title { margin-top: 0; }
.product-title { display: flex; align-items: center; gap: 10px; margin-top: 0; }
.product-title > .el-button { margin-left: auto; }
.trial-card ::v-deep .el-input-number, .trial-card ::v-deep .el-table .el-select { width: 140px; }
.bottom-actions { margin: 16px 0 0; }
.result-box { padding: 16px 20px; margin-top: 16px; border: 1px solid #c5d5f0; border-radius: 6px; background: #ebf1fa; }
.result-title { margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #2f5496; }
.info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 24px; }
.info-item { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.info-item > span { color: #5a6472; font-size: 13px; flex-shrink: 0; }
.info-item > b { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.comparison { display: flex; align-items: stretch; gap: 14px; margin-top: 10px; }
.compare-panel { flex: 1; min-width: 0; overflow: hidden; border: 1px solid #e0e4ea; border-radius: 10px; background: white; }
.compare-panel.new-panel { border-color: #bfd0ea; box-shadow: 0 4px 16px rgba(68, 114, 196, .12); }
.compare-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 11px 16px; background: #f2f4f7; border-bottom: 1px solid #e0e4ea; }
.compare-heading b { color: #5a6472; font-size: 14px; }
.compare-heading > span { padding: 1px 9px; border-radius: 10px; font-size: 11px; color: #8b95a3; background: rgba(0, 0, 0, .05); }
.new-panel .compare-heading { background: linear-gradient(90deg, #eaf1fb, #d6e4f7); border-color: #c5d5f0; }
.new-panel .compare-heading b { color: #2f5496; }
.new-panel .compare-heading > span { background: rgba(255, 255, 255, .7); }
.compare-body { padding: 12px 14px; }
.metric-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 9px 2px; }
.metric-row + .metric-row { border-top: 1px dashed #e0e4ea; }
.metric-row > span { color: #5a6472; font-size: 13px; }
.metric-row > b { font-size: 24px; line-height: 1.15; }
.new-panel .metric-row > b { color: #4f6fae; }
.compare-arrow { flex: 0 0 56px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 6px; text-align: center; }
.wide-arrow { flex-basis: 118px; }
.arrow-circle { width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #4f6fae; color: white; font-size: 20px; }
.wide-arrow .arrow-circle { width: 38px; height: 38px; font-size: 16px; }
.delta { padding: 2px 9px; border-radius: 10px; font-size: 11px; font-weight: 700; }
.delta.up { color: #0f7a45; background: #e4f5eb; border: 1px solid #b9e4cb; }
.delta.down { color: #b4341e; background: #fdecea; border: 1px solid #f5c6c0; }
.delta.flat { color: #8b95a3; background: rgba(0, 0, 0, .05); }
.formula { background: #f3f6fc; padding: 12px 16px; text-align: right; color: #5a6472; font-size: 13px; }
.formula b, .formula strong { color: #2f5496; }
.formula strong { font-size: 16px; }
.formula-hint { margin-top: 10px; line-height: 1.6; }
.summary-label { margin: 16px 0 6px; }
.score-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; padding: 12px 14px; border-radius: 8px; background: #f5f7fa; font-size: 13px; color: #5a6472; }
.score-summary b { margin-left: 10px; color: #333a45; font-size: 14px; }
.score-summary > span:first-child b { color: #4f6fae; }
.type-pill, .status-pill { display: inline-block; padding: 2px 12px; border-radius: 10px; font-size: 12px; line-height: 1.1; }
.pill-blue { color: #2f5496; background: #ebf1fa; }
.pill-purple { color: #7d3caf; background: #f3ebfa; }
.pill-orange { color: #e67e22; background: #fdf3e7; }
.pill-green { color: #2e7d32; background: #e8f5e9; }
.pill-red { color: #c62828; background: #fdecea; }
.trial-page ::v-deep .trial-dialog { display: flex; flex-direction: column; max-width: calc(100vw - 32px); max-height: 80vh; }
.trial-page ::v-deep .trial-dialog .el-dialog__body { overflow: auto; flex: 1; min-height: 0; padding: 16px 18px; }
.trial-page ::v-deep .trial-dialog .el-dialog__header, .trial-page ::v-deep .trial-dialog .el-dialog__footer { flex-shrink: 0; }
.dialog-query { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.dialog-query > .el-input, .dialog-query > .el-select { width: 140px; }
.dialog-query > .wide-input { width: 160px; }
.pagination-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; margin-bottom: 10px; }
@media (max-width: 900px) {
  .comparison { flex-direction: column; }
  .compare-arrow { flex-basis: auto; padding: 8px 0; }
  .info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .batch-tip { margin-left: 0; }
}
</style>
