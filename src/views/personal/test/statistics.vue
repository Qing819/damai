<template>
  <div class="report-page">
    <div class="page-heading">
      <h1>统计分析与报表</h1>
      <p>客户等级分布、积分、规则切换、权益使用多维统计；支持标准/自定义报表生成、Excel/PDF导出、穿透追溯</p>
    </div>
    <el-card shadow="never">
      <div class="form-row">
        <span class="form-label">报表类型</span>
        <el-radio-group v-model="period"><el-radio v-for="name in periods" :key="name" :label="name">{{ name }}</el-radio></el-radio-group>
        <span class="hint">统计区间：尚未生成</span>
      </div>
      <div class="form-row">
        <span class="form-label">统计维度</span>
        <el-checkbox-group v-model="dimensions"><el-checkbox v-for="name in dimensionNames" :key="name" :label="name">{{ name }}</el-checkbox></el-checkbox-group>
        <span class="hint">支持多元勾选</span>
      </div>
      <div class="form-row">
        <span class="form-label" />
        <div>
          <el-button type="primary" @click="generate">生成报表</el-button>
          <el-button @click="openCustom">自定义报表</el-button>
          <el-button @click="unavailable">导出Excel</el-button>
          <el-button @click="unavailable">导出PDF</el-button>
        </div>
        <span class="hint">报表数据可穿透查询，追溯至具体客户、保单明细</span>
      </div>
    </el-card>
    <div class="notice" role="status">统计报表数据暂不可用。下方可查看各等级当前客户明细；统计值及 Excel/PDF 报表暂无法生成。</div>
    <div class="report-tabs" role="tablist" aria-label="统计维度">
      <button v-for="name in dimensionNames" :key="name" role="tab" :aria-selected="activeTab === name" :class="{ active: activeTab === name }" @click="activeTab = name">{{ name }}</button>
    </div>
    <el-card v-if="activeTab === dimensionNames[0]" shadow="never">
      <div slot="header">客户等级分布<span class="hint card-hint">按机构、时间周期统计，支持起止日期输入</span></div>
      <div class="grade-chart" aria-label="客户等级分布暂无统计数据">
        <div v-for="grade in grades" :key="grade.code"><span class="hint">—</span><div class="empty-bar" /><span>{{ grade.name }}</span></div>
      </div>
      <el-table :data="grades" stripe size="mini">
        <el-table-column prop="name" label="客户等级" min-width="100" />
        <el-table-column label="客户数" min-width="100" :formatter="() => '—'" />
        <el-table-column label="占比" min-width="100" :formatter="() => '—'" />
        <el-table-column label="较上期变动" min-width="100" :formatter="() => '—'" />
        <el-table-column label="操作" width="100"><template slot-scope="{ row }"><el-button type="text" size="mini" @click="drill(row)">穿透追溯</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-card v-else-if="activeTab === dimensionNames[1]" shadow="never">
      <div slot="header">积分相关统计<span class="hint card-hint">全量/分机构积分累计总量、类型占比、新增/扣减趋势</span></div>
      <div class="metrics"><div v-for="(label, index) in pointMetrics" :key="label"><span>{{ label }}</span><strong :class="{ blue: index === 0, green: index === 3 }">—</strong></div></div>
      <div v-for="label in ['保费积分', '忠诚积分']" :key="label" class="bar-row"><span>{{ label }}</span><div class="bar-track" /><span>—</span></div>
    </el-card>
    <el-card v-else-if="activeTab === dimensionNames[2]" shadow="never">
      <div slot="header">规则切换统计<span class="hint card-hint">申请数量、成功切换数量、未切换原因分布、各机构切换率</span></div>
      <div class="metrics"><div v-for="(label, index) in switchMetrics" :key="label"><span>{{ label }}</span><strong :class="['blue', 'green', 'red', 'orange'][index]">—</strong></div></div>
      <div class="section-title">未切换原因分布</div>
      <div v-for="label in ['不满足条件', '资料不全', '客户撤销']" :key="label" class="bar-row"><span>{{ label }}</span><div class="bar-track" /><span>—</span></div>
      <el-table :data="[]" stripe size="mini"><el-table-column v-for="label in ['机构', '申请数量', '成功切换', '切换率']" :key="label" :label="label" /></el-table>
    </el-card>
    <el-card v-else shadow="never">
      <div slot="header">权益使用统计<span class="hint card-hint">各服务权益使用次数、使用率、剩余次数、各等级偏好</span></div>
      <el-table :data="[]" stripe size="mini"><el-table-column v-for="label in ['服务项目', '使用次数', '使用率', '剩余次数', '使用偏好最高等级']" :key="label" :label="label" min-width="100" /></el-table>
    </el-card>
    <el-dialog title="自定义报表配置" :visible.sync="customVisible" width="660px" append-to-body custom-class="report-custom-dialog" :close-on-click-modal="false">
      <el-form label-width="122px" label-position="left">
        <el-form-item label="报表类型"><el-radio-group v-model="custom.period"><el-radio v-for="name in periods" :key="name" :label="name">{{ name }}</el-radio></el-radio-group></el-form-item>
        <el-form-item label="统计维度"><el-checkbox-group v-model="custom.dimensions"><el-checkbox v-for="name in dimensionNames" :key="name" :label="name">{{ name }}</el-checkbox></el-checkbox-group></el-form-item>
        <el-form-item label="统计区间" class="control-row"><div class="custom-dates"><el-date-picker v-model="custom.dates[0]" type="date" placeholder="开始日期" aria-label="统计开始日期" value-format="yyyy-MM-dd" /><span>~</span><el-date-picker v-model="custom.dates[1]" type="date" placeholder="结束日期" aria-label="统计结束日期" value-format="yyyy-MM-dd" /></div></el-form-item>
        <el-form-item label="机构范围" class="control-row"><el-select v-model="custom.orgName" placeholder="全部机构" clearable><el-option label="全部机构" value="" /><el-option v-for="org in orgOptions" :key="org" :label="org" :value="org" /></el-select></el-form-item>
      </el-form>
      <div class="custom-tip"><b>说明</b> 自定义报表按所选维度、筛选条件与区间生成，支持保存复用、Excel/PDF导出，数据可穿透至客户/保单明细。</div>
      <div slot="footer"><el-button @click="customVisible = false">取消</el-button><el-button type="primary" @click="saveCustom">保存并生成</el-button></div>
    </el-dialog>
  </div>
</template>

<script>
import { getPlatformOrgApi } from '@/api/test'

const dimensionNames = ['客户等级分布', '积分相关统计', '规则切换统计', '权益使用统计']

export default {
  name: 'StatisticsReport',
  data() {
    return {
      periods: ['日报', '周报', '月报', '年报'],
      period: '日报',
      dimensionNames,
      dimensions: dimensionNames.slice(),
      activeTab: dimensionNames[0],
      grades: [{ code: 'PUXING', name: '普星' }, { code: 'SANXING', name: '三星' }, { code: 'SIXING', name: '四星' }, { code: 'WUXING', name: '五星' }, { code: 'ZHUOYUE', name: '卓越' }, { code: 'ZUNYAO', name: '尊耀' }],
      pointMetrics: ['积分累计总量', '保费积分占比', '忠诚积分占比', '本期新增 / 扣减'],
      switchMetrics: ['本期申请数量', '成功切换数量', '未切换数量', '整体切换率'],
      customVisible: false,
      custom: { period: '日报', dimensions: dimensionNames.slice(), dates: [], orgName: '' },
      orgOptions: []
    }
  },
  methods: {
    unavailable() { this.$message.warning('统计报表服务暂不可用，暂无法生成、保存或导出报表') },
    generate() {
      if (!this.dimensions.length) return this.$message.warning('请至少选择一个统计维度')
      this.unavailable()
    },
    async openCustom() {
      this.custom.period = this.period
      this.custom.dimensions = this.dimensions.slice()
      this.customVisible = true
      try {
        const res = await getPlatformOrgApi()
        this.orgOptions = Array.isArray(res.data) ? res.data : []
      } catch (error) {
        this.$message.error('机构选项加载失败，请重新打开弹框重试')
      }
    },
    saveCustom() {
      if (!this.custom.dimensions.length) return this.$message.warning('请至少选择一个统计维度')
      if (!this.custom.dates || !this.custom.dates[0] || !this.custom.dates[1]) return this.$message.warning('请选择完整的统计区间')
      if (this.custom.dates[0] > this.custom.dates[1]) return this.$message.warning('开始日期不能晚于结束日期')
      this.unavailable()
    },
    drill(grade) {
      this.$router.push({ path: '/personal/reportDrill', query: { item: grade.code } })
    }
  }
}
</script>

<style lang="scss" scoped>
@import './report.scss';
.report-tabs { display: flex; flex-wrap: wrap; border-bottom: 2px solid #4f6fae; margin-bottom: 18px; gap: 6px; }
.report-tabs button { padding: 10px 18px; background: #fff; border: 1px solid #e0e4ea; border-bottom: 0; border-radius: 5px 5px 0 0; color: #5a6472; cursor: pointer; font: inherit; }
.report-tabs .active { background: #4f6fae; border-color: #4f6fae; color: #fff; font-weight: 600; }
.grade-chart { display: flex; gap: 26px; height: 200px; padding: 10px 8px 0; margin-bottom: 20px; }
.grade-chart > div { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; }
.empty-bar { width: 100%; height: 1px; background: #e0e4ea; }
.metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 18px; }
.metrics > div { padding: 16px 20px 18px; border: 1px solid #e0e4ea; border-radius: 10px; background: #fff; }
.metrics span { font-size: 13px; color: #5a6472; }
.metrics strong { display: block; margin-top: 6px; font-size: 26px; line-height: 1.15; }
.blue { color: #4472c4; } .green { color: #2e7d32; } .red { color: #c62828; } .orange { color: #e67e22; }
.section-title { margin: 28px 0 8px; padding-left: 9px; border-left: 3px solid #4472c4; color: #2f5496; font-size: 14px; font-weight: 600; line-height: 1.4; }
.bar-row { display: flex; align-items: center; gap: 12px; margin: 10px 0; font-size: 13px; }
.bar-row > span:first-child { width: 110px; color: #5a6472; }
.bar-row > span:last-child { width: 56px; font-weight: 600; text-align: right; }
.bar-track { flex: 1; height: 14px; border-radius: 7px; background: #eef1f5; }
@media (max-width: 800px) { .metrics { grid-template-columns: repeat(2, 1fr); } }
</style>

<style lang="scss">
.report-custom-dialog {
  max-width: calc(100vw - 40px);
  .el-dialog__body { max-height: 60vh; overflow-y: auto; padding: 16px 18px; color: #333a45; }
  .el-form-item { margin-bottom: 16px; }
  .el-form-item:last-child { margin-bottom: 0; }
  .el-form-item__content { line-height: 20px; }
  .el-radio-group, .el-checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; }
  .el-radio, .el-checkbox { margin-right: 0; line-height: 20px; font-weight: 400; color: #333a45; }
  .el-radio__label, .el-checkbox__label { font-size: 14px; padding-left: 6px; }
  .el-button { height: 36px; padding: 0 16px; font: inherit; }
  .el-button--primary { background: #4f6fae; border-color: #4f6fae; }
  .el-button--default:hover, .el-button--default:focus { color: #4f6fae; border-color: #4f6fae; background: #fff; }
  .el-form-item__label { font-size: 14px; color: #5a6472; line-height: 20px; padding-right: 12px; }
  .control-row .el-form-item__label { line-height: 40px; }
  .custom-dates { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
  .el-date-editor.el-input { width: 160px; }
  .el-select { width: 200px; }
  .el-input__inner { height: 40px; line-height: 40px; font-size: 14px; }
  .el-input__icon { line-height: 40px; }
  .custom-tip { margin-top: 14px; background: #eef4ff; border: 1px solid #c5d5f0; border-radius: 6px; color: #333a45; padding: 13px 20px; font-size: 13px; line-height: 22px; }
  .custom-tip b { color: #2f5496; margin-right: 10px; }
}
</style>
