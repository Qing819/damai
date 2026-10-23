<template>
  <div class="page-container">
    <div class="page-title">积分计算规则</div>
    <div class="page-subtitle">依据需求「积分规则管理」章节，展示积分体系计算链路、积分类型定义与各场景实际计算公式</div>

    <div class="alert-box">
      <span class="alert-title">规则说明</span>
      积分规则的比例、年限、阈值均支持后台参数化配置，规则变更按 T+1 生效并保留完整版本历史；本页展示当前生效规则，每条积分流水均可回溯至当时生效的规则版本。
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab">

      <!-- Tab 1: 计算架构 -->
      <el-tab-pane label="计算架构" name="arch">
        <div class="architecture-card">
          <div class="architecture-title">积分体系总体架构</div>

        <div class="section-title">业务计算链路</div>
        <el-table :data="linkData" border size="mini" style="width: 100%">
          <el-table-column prop="level" label="计算层级" width="120"></el-table-column>
          <el-table-column prop="content" label="核心业务计算内容"></el-table-column>
          <el-table-column prop="dimension" label="归属业务维度" width="220"></el-table-column>
          <el-table-column prop="desc" label="业务规则说明"></el-table-column>
        </el-table>
        <div class="sub-tips">积分业务计算严格遵循层级递进规则，各层级业务用途独立、不可跳过。</div>

        <div class="section-title" style="margin-top: 30px;">积分类型业务定义</div>
        <el-table :data="typeData" border size="mini" style="width: 100%">
          <el-table-column label="积分类型" width="200">
            <template slot-scope="scope">
              <span :class="scope.row.tagClass">{{ scope.row.type }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="对应计算层级" width="140"></el-table-column>
          <el-table-column prop="def" label="核心业务定义"></el-table-column>
        </el-table>
        <div class="sub-tips">积分体系仅包含上述两类核心积分（保费积分、忠诚积分），所有积分明细均归属以上类型，无其他新增积分类型。</div>

        <div class="section-title-large" style="margin-top: 36px;">计算范围与生效前置条件</div>
        <el-table :data="conditionData" border size="mini" style="width: 100%">
          <el-table-column prop="condition" label="前置条件" width="140"></el-table-column>
          <el-table-column label="判定规则">
            <template slot-scope="scope">
              <div v-html="scope.row.rule"></div>
            </template>
          </el-table-column>
        </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 保费积分规则 -->
      <el-tab-pane label="保费积分规则" name="fee">
        <!-- 趸交保单积分计算 -->
        <div class="card-box">
          <div class="card-header">
            <span class="card-title">趸交保单积分计算</span>
            <span class="tag-gray">险种层</span>
            <span class="tag-gray">过犹豫期后生效</span>
          </div>
          <div class="formula-banner">
            前 10 年（含第 10 年）： 积分 = 趸交保费 × 10%
          </div>
          <el-table :data="lumpSumRules" border size="mini" style="width: 100%" :show-header="false">
            <el-table-column prop="title" width="140"></el-table-column>
            <el-table-column prop="content"></el-table-column>
          </el-table>

          <div class="section-title" style="margin-top: 20px;">计算示例</div>
          <el-table :data="lumpSumExamples" border size="mini" style="width: 100%">
            <el-table-column prop="example" label="示例" width="100"></el-table-column>
            <el-table-column prop="fee" label="趸交保费"></el-table-column>
            <el-table-column prop="startDate" label="开始日期"></el-table-column>
            <el-table-column prop="yearStatus" label="2024 年所处年份"></el-table-column>
            <el-table-column prop="calc" label="积分计算"></el-table-column>
          </el-table>
          <div class="sub-tips">以统计年度实收保费为基准核算；趸交保费 50 万元前 10 年每年积分 = 500,000 × 10% = 50,000，第 11 年积分为 0。</div>
        </div>

        <!-- 期交保单积分计算 -->
        <div class="card-box">
          <div class="card-header">
            <span class="card-title">期交保单积分计算</span>
            <span class="tag-gray">险种层</span>
            <span class="tag-gray">系数按缴费年限固定</span>
          </div>
          <div class="formula-orange">
            核心原则：系数按缴费年限固定，非递增。例如 3 年交保单，每年都乘 0.3，乘 3 年；不是第一年乘 0.1、第二年乘 0.2、第三年乘 0.3 的递增方式。
          </div>

          <div class="section-title">年交保单折算系数</div>
          <el-table :data="periodFactors" border size="mini" style="width: 100%">
            <el-table-column prop="years" label="交费年期" width="160"></el-table-column>
            <el-table-column prop="factor" label="折算系数" width="160"></el-table-column>
            <el-table-column prop="desc" label="说明"></el-table-column>
          </el-table>

          <div class="formula-banner" style="margin-top: 16px;">
            交费期内每年：积分 = 年交保费 × 对应交费年期折算系数
          </div>
          <div class="sub-tips" style="margin-bottom: 16px;">
            年交 5,000 元、3 年期保单 → 5,000 × 30% = 1,500（交费期内每年均按此计算）；年交 5,000 元、20 年期保单 → 5,000 × 100% = 5,000。
          </div>

          <div class="section-title">计算示例</div>
          <el-table :data="periodExamples" border size="mini" style="width: 100%">
            <el-table-column prop="example" label="示例" width="100"></el-table-column>
            <el-table-column prop="fee" label="年交保费"></el-table-column>
            <el-table-column prop="startDate" label="保单生效日期"></el-table-column>
            <el-table-column prop="years" label="缴费年限"></el-table-column>
            <el-table-column prop="status" label="当年状态"></el-table-column>
            <el-table-column prop="calc" label="积分计算"></el-table-column>
          </el-table>
        </div>

        <!-- 月交保单积分计算 -->
        <div class="card-box">
          <div class="card-header">
            <span class="card-title">月交保单积分计算</span>
            <span class="tag-gray">险种层</span>
            <span class="tag-gray">折算为年交</span>
          </div>
          <div class="formula-banner">
            积分 = 月交实收保费 × 交费月度数 × 对应折算系数
          </div>
          <el-table :data="monthRules" border size="mini" style="width: 100%" :show-header="false">
            <el-table-column prop="title" width="140"></el-table-column>
            <el-table-column prop="content"></el-table-column>
          </el-table>
        </div>

        <!-- 短期险保单积分计算 -->
        <div class="card-box">
          <div class="card-header">
            <span class="card-title">短期险保单积分计算</span>
            <span class="tag-gray">险种层</span>
            <span class="tag-gray">无等待期</span>
          </div>
          <div class="formula-banner">
            积分 = 实收保费 × 10%
          </div>
          <el-table :data="shortRules" border size="mini" style="width: 100%" :show-header="false">
            <el-table-column prop="title" width="140"></el-table-column>
            <el-table-column prop="content"></el-table-column>
          </el-table>
        </div>

        <!-- 养老协同产品积分计算 -->
        <div class="card-box">
          <div class="card-header">
            <span class="card-title">养老协同产品积分计算</span>
            <span class="tag-gray">险种层</span>
            <span class="tag-gray">额外加成</span>
          </div>
          <div class="formula-banner">
            计算顺序：先按对应保单类型计算基础积分，再加基础积分 × 5% &nbsp;&nbsp;&nbsp; 加成后积分 = 基础积分 × 1.05
          </div>
          <el-table :data="pensionRules" border size="mini" style="width: 100%" :show-header="false">
            <el-table-column prop="title" width="140"></el-table-column>
            <el-table-column prop="content"></el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 忠诚积分规则 -->
      <el-tab-pane label="忠诚积分规则" name="loyalty">
        <!-- 忠诚积分 · 连续交费奖励 -->
        <div class="card-box">
          <div class="card-header">
            <span class="card-title">忠诚积分 · 连续交费奖励</span>
            <span class="tag-gray">保单层</span>
            <span class="tag-gray">奖励比例与起始年份可配置</span>
          </div>
          <div class="formula-banner">
            第 6 年起每年： 奖励积分 = 年交主险保费 × 1%
          </div>
          <el-table :data="loyaltyPayRules" border size="mini" style="width: 100%" :show-header="false">
            <el-table-column prop="title" width="140"></el-table-column>
            <el-table-column prop="content"></el-table-column>
          </el-table>
        </div>

        <!-- 忠诚积分 · 二次投保奖励 -->
        <div class="card-box">
          <div class="card-header">
            <span class="card-title">忠诚积分 · 二次投保奖励</span>
            <span class="tag-gray">客户层</span>
            <span class="tag-gray">比例系数可配置</span>
          </div>
          <div class="formula-banner">
            仅限首期： 奖励积分 = 首期实收保费 × 20%
          </div>
          <el-table :data="loyaltyRebuyRules" border size="mini" style="width: 100%" :show-header="false">
            <el-table-column prop="title" width="140"></el-table-column>
            <el-table-column prop="content"></el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 4: 汇总与参数配置 -->
      <el-tab-pane label="汇总与参数配置" name="config">
        <div class="section-title-large">积分汇总计算规则</div>
        <el-table :data="summaryRules" border size="mini" style="width: 100%">
          <el-table-column label="积分类型" width="200">
            <template slot-scope="scope">
              <span :class="scope.row.tagClass">{{ scope.row.type }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="计算层级" width="140"></el-table-column>
          <el-table-column prop="desc" label="说明"></el-table-column>
        </el-table>

        <div class="section-title-large" style="margin-top: 32px;">规则配置管理</div>
        <el-table :data="configManage" border size="mini" style="width: 100%">
          <el-table-column prop="cap" label="配置能力" width="160"></el-table-column>
          <el-table-column prop="desc" label="说明"></el-table-column>
        </el-table>

        <div class="section-title-large" style="margin-top: 32px;">后台可配置参数</div>
        <div class="sub-tips" style="margin-bottom: 12px;">全部参数默认支持自定义维护，配置维度为时间维度</div>
        <el-table :data="paramsData" border size="mini" style="width: 100%">
          <el-table-column prop="seq" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="cat" label="参数分类" width="140"></el-table-column>
          <el-table-column prop="name" label="参数名称" width="180">
            <template slot-scope="scope">
              <span style="color: #1890ff; cursor: pointer;">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="参数编码" width="220"></el-table-column>
          <el-table-column prop="dataType" label="数据类型" width="90"></el-table-column>
          <el-table-column prop="defaultVal" label="默认值" width="90"></el-table-column>
          <el-table-column prop="range" label="取值范围 / 单位" width="130"></el-table-column>
          <el-table-column prop="configurable" label="是否可配置" width="100" align="center"></el-table-column>
          <el-table-column prop="desc" label="参数说明"></el-table-column>
        </el-table>
        <div class="sub-tips config-footer-tip">以上参数为后台可配置项，配置变更后按 T+1 同步生效，并保留规则版本历史与快照，支持按生效时间点回溯。</div>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script>
import {
  getRulePageApi,
  getRuleDetailApi,
  pointRuleAddApi,
  pointRuleUpdateApi,
  pointRuleDisableApi
} from '@/api/test'

export default {
  name: 'PointsRules',
  data() {
    return {
      activeTab: 'arch',
      // Tab 1 数据
      linkData: [
        { level: '险种层', content: '计算有效保单下险种对应保费基础积分、养老协同加成积分', dimension: '单个险种（riskcode）', desc: '完成产品过滤、实收保费清洗、险种专属积分核算，是所有积分计算的基础单元' },
        { level: '保单层', content: '汇总有效保单下所有险种积分、核算保单连续交费忠诚积分', dimension: '单张保单（contno）', desc: '连续交费奖励仅以保单主险为核算依据，附加险不参与该类积分计算' },
        { level: '投保人层', content: '汇总投保人名下所有有效保单积分、核算跨保单二次投保奖励积分', dimension: '单个投保人（appntno）', desc: '二次投保奖励为投保人专属一次性业务奖励，独立于单保单积分之外' }
      ],
      typeData: [
        { type: '保费积分', level: '险种层', def: '以客户有效实缴保费为核算基数，覆盖趸交、年交、月交、短期险所有有效交费场景，是基础积分来源', tagClass: 'tag-blue' },
        { type: '忠诚积分-连续交费奖励', level: '保单层', def: '针对单张保单长期有效交费的客户激励，保单连续交费满指定年限后，按年发放固定奖励积分', tagClass: 'tag-purple' },
        { type: '忠诚积分-二次投保奖励', level: '投保人层', def: '针对存量客户新增投保的一次性激励，同一投保人新增有效保单后，触发单次奖励积分发放，积分依据实收保费计算', tagClass: 'tag-purple' }
      ],
      conditionData: [
        { condition: '投保主体认定', rule: '个险投保人（个险表 conttype 均为 1）全部计入；团险-个单（conttype 02）、团险-家庭单（03）、团险-汇交件（04）、团险-其他（99）在 policymode=01 时计入；<strong>团险-汇交企业（conttype 01）不计入</strong>，企业投保、单位团体投保不参与积分计算。<br>补充：信托 2.0 业务在个险表中，保费正常纳入积分计算，积分归属原保单投保人。' },
        { condition: '产品过滤', rule: '投连险（Scndlvltypecode=3）、万能险（Scndlvltypecode=4）从业务根源剔除，不参与任何积分计算，同保单其他有效险种不受影响；其他产品正常纳入积分计算。<br>投连 / 万能不触发二次投保奖励：首次投保投连或万能、二次投保其他产品，不触发；首次投保其他产品、二次投保投连或万能，同样不触发。' },
        { condition: '犹豫期认定', rule: '犹豫期是保单积分生效的核心前置条件，未过犹豫期的保单不产生任何积分、不触发权益。<br>起算基准：customgetpoldate（保单回执客户签收日期）；犹豫期天数字段：hesitateend（为空默认 15 天），现有取值 0 / 10 / 15 / 20 / 30 天。<br>计算逻辑：<strong>保单回执客户签收日期 + 犹豫期天数 ≤ 当前日期时，计入积分。</strong>' }
      ],
      // Tab 2 数据
      lumpSumRules: [
        { title: '适用条件', content: '当前有效长险趸交保单，过犹豫期后生效' },
        { title: '超限处理', content: '第 10 年后折算系数自动置 0，不再计算积分' },
        { title: '有效性判定', content: '① 保单原始保险期间（整年） > 当前的保周年数（保单尚未满期）；② 当前的保周年数 ≤ 10，最长发放 10 个保周年，第 11 周年起积分系数置 0；③ 积分计算时点，保单实际状态为有效，未退保、未终止。' },
        { title: '保障期不足 10 年', content: '按保单实际有效期核算，保障几年则发放几年积分。' }
      ],
      lumpSumExamples: [
        { example: '示例 1', fee: '500,000 元', startDate: '2022.1.1', yearStatus: '承保后第 3 年（≤10 年）', calc: '500,000 × 0.1 = 50,000' },
        { example: '示例 2', fee: '500,000 元', startDate: '2015.1.1', yearStatus: '承保后第 10 年（含）', calc: '500,000 × 0.1 = 50,000' },
        { example: '示例 3', fee: '500,000 元', startDate: '2014.1.1', yearStatus: '承保后第 11 年（>10 年）', calc: '0' }
      ],
      periodFactors: [
        { years: '1 年交', factor: '10%', desc: '每年按此系数计算' },
        { years: '2 年交', factor: '20%', desc: '每年都乘 0.2，乘 2 年' },
        { years: '3 年交', factor: '30%', desc: '每年都乘 0.3，乘 3 年' },
        { years: '5 年交', factor: '50%', desc: '每年都乘 0.5，乘 5 年' },
        { years: '10 年交', factor: '100%', desc: '每年都乘 1，乘 10 年' },
        { years: '≥10 年交', factor: '100%', desc: '超过 10 年按 10 年算，系数固定为 1' }
      ],
      periodExamples: [
        { example: '示例 1', fee: '5,000 元', startDate: '2022.1.1', years: '3 年', status: '处于交费期内', calc: '5,000 × 3 × 0.1 = 1,500' },
        { example: '示例 2', fee: '5,000 元', startDate: '2021.1.1', years: '3 年', status: '已过交费期（无实收保费）', calc: '0' },
        { example: '示例 3', fee: '5,000 元', startDate: '2021.1.1', years: '20 年', status: '交费年限 ≥10 年，折算系数 = 100%', calc: '5,000 × 1 = 5,000' }
      ],
      monthRules: [
        { title: '计算方式', content: '折算为年交，每月加一次积分' },
        { title: '系数规则', content: '按年算，与年交系数完全一致。例如 3 年期月交保单，每月交费后乘 0.3，12 个月累加后等同于年交保费 × 0.3' },
        { title: '等效验证', content: '12 个月加起来 = 年交保费 × 系数' },
        { title: '年度统计', content: '1 月 1 日算前一年整体实收；年中每月有新保费进来时按 T+1 计算后累加' },
        { title: '注意事项', content: '月交保单数据量大、历史复效情况多，需特别注意计算时间的准确性，避免计算时间偏差导致积分错误' }
      ],
      shortRules: [
        { title: '适用产品', content: '以 BI 产品表长短险标识为唯一标准，系统标识字段名称需与产品部确认' },
        { title: '等待期', content: '无等待期约束' },
        { title: '时效要求', content: 'T+1 同步处理' }
      ],
      pensionRules: [
        { title: '标识字段', content: 'hcflag = \'Y\'（养老协同标识）' },
        { title: '产品范围', content: '不以产品划定范围，按保单识别' },
        { title: '结果精度', content: '保留整数（四舍五入）' },
        { title: '轨迹可查', content: '养老协同产品额外积分轨迹可查询' },
        { title: '时效要求', content: 'T+1 同步处理' }
      ],
      // Tab 3 数据
      loyaltyPayRules: [
        { title: '触发条件', content: '在同一保单号下连续交费满 5 年（无失效），第 6 年起主险连续缴费（可能有多主险，主险保障号可能会变）' },
        { title: '计算基数', content: '年交主险保费，附加险不算' },
        { title: '宽限期处理', content: '宽限期内补交视为未中断' },
        { title: '连续判定', content: '向前回溯该保单的交费记录，滑动窗口算法计算连续无失效年限' },
        { title: '可配置项', content: '奖励比例（1%）、起始年份（6 年）均可配置，规则变动保留历史记录' }
      ],
      loyaltyRebuyRules: [
        { title: '触发条件', content: '同一投保人第二次起购买公司产品，且首期过犹豫期' },
        { title: '计算维度', content: '客户层（投保人维度保单索引），按投保人跨保单判断是否为二次投保' },
        { title: '仅限首期', content: '续期保费不再享受此奖励' },
        { title: '投连 / 万能', content: '投连险、万能险不参与二次投保奖励计算：首次投保投连或万能、二次投保其他产品，不触发；首次投保其他产品、二次投保投连或万能，同样不触发' },
        { title: '保证续保', content: '保单号未变，不算二次投保' },
        { title: '可配置项', content: '比例系数（20%）可配置，规则变动保留历史记录' }
      ],
      // Tab 4 数据
      summaryRules: [
        { type: '保费积分', level: '险种层', desc: '一张保单下多险种各自计算（主险、附加险交费期不同、保费不同）', tagClass: 'tag-blue' },
        { type: '忠诚积分-连续交费奖励', level: '保单合同层', desc: '按保单合同整体计算连续交费年限', tagClass: 'tag-purple' },
        { type: '忠诚积分-二次投保奖励', level: '客户层', desc: '按投保人维度，跨保单判断是否为二次投保', tagClass: 'tag-purple' }
      ],
      configManage: [
        { cap: '参数化配置', desc: '所有积分规则（比例、年限、阈值）可通过后台配置表完成规则的修改、停用和启用' },
        { cap: '时效要求', desc: 'T+1 同步处理' },
        { cap: '版本管理', desc: '规则的每一次变更都保留完整的版本历史' },
        { cap: '规则快照', desc: '支持按生效时间点进行规则快照回溯' },
        { cap: '审计追溯', desc: '每一条积分流水可回溯至当时生效的规则版本、执行时间、输入参数和计算结果' }
      ],
      paramsData: [
        { seq: 1, cat: '保费积分-趸交', name: '趸交折算系数', code: 'LUMPSUM_RATE', dataType: '百分比', defaultVal: '10%', range: '0%~100%', configurable: '是', desc: '前 10 年(含)积分 = 趸交保费 × 系数' },
        { seq: 2, cat: '保费积分-趸交', name: '趸交积分计算年限上限', code: 'LUMPSUM_YEARS_CAP', dataType: '数值', defaultVal: '10', range: '年', configurable: '是', desc: '前 10 年(含第 10 年)计算，超过后系数置 0' },
        { seq: 3, cat: '保费积分-趸交', name: '趸交超限后系数', code: 'LUMPSUM_OVER_CAP_RATE', dataType: '百分比', defaultVal: '0%', range: '0%', configurable: '是', desc: '第 10 年后自动置 0 不再计算' },
        { seq: 4, cat: '保费积分-期交(年交)', name: '年交折算系数上限', code: 'ANNUAL_FACTOR_CAP', dataType: '百分比', defaultVal: '100%', range: '0%~200%', configurable: '是', desc: '交费年期 ≥ 触发年限时固定为上限' },
        { seq: 5, cat: '保费积分-期交(年交)', name: '年交上限触发年限', code: 'ANNUAL_CAP_YEARS', dataType: '数值', defaultVal: '10', range: '年', configurable: '是', desc: '交费年期 ≥10 年，折算系数固定 100%' },
        { seq: 6, cat: '保费积分-短期险', name: '短期险折算系数', code: 'SHORT_TERM_RATE', dataType: '百分比', defaultVal: '10%', range: '0%~100%', configurable: '是', desc: '积分 = 实收保费 × 系数' },
        { seq: 7, cat: '保费积分-养老协同', name: '养老协同奖励系数', code: 'PENSION_BONUS_FACTOR', dataType: '倍数', defaultVal: '1.05', range: '≥1.0', configurable: '是', desc: '在对应保单类型结果基础上叠加系数' },
        { seq: 8, cat: '忠诚积分-连续交费奖励', name: '连续交费触发年数', code: 'LOYAL_CONSEC_YEARS', dataType: '数值', defaultVal: '5', range: '年', configurable: '是', desc: '同一保单连续交费满 5 年（中途无失效）触发' },
        { seq: 9, cat: '忠诚积分-连续交费奖励', name: '连续交费奖励率', code: 'LOYAL_CONSEC_RATE', dataType: '百分比', defaultVal: '1%', range: '0%~100%', configurable: '是', desc: '每年奖励积分 = 年交主险保费 × 1%' },
        { seq: 10, cat: '忠诚积分-二次投保奖励', name: '二次投保触发次数', code: 'LOYAL_REBUY_THRESHOLD', dataType: '数值', defaultVal: '2', range: '次', configurable: '是', desc: '同一投保人第 2 次起购买且过犹豫期' },
        { seq: 11, cat: '忠诚积分-二次投保奖励', name: '二次投保奖励率', code: 'LOYAL_REBUY_RATE', dataType: '百分比', defaultVal: '20%', range: '0%~100%', configurable: '是', desc: '奖励积分 = 首期实收保费 × 20%' }
      ],

      // 规则相关状态变量
      ruleTableData: [],
      ruleTotal: 0,
      ruleQuery: {
        pageNum: 1,
        pageSize: 10,
        ruleCode: '',
        productCategory: ''
      }
    }
  },
  created() {
    this.fetchRulePage();
  },
  methods: {
    // 37. 规则分页查询接口
    fetchRulePage() {
      getRulePageApi(this.ruleQuery).then(res => {
        const data = res.body ? res.body.data : res.data;
        if (data && data.list) {
          this.ruleTableData = data.list;
          this.ruleTotal = data.total || 0;
        } else if (Array.isArray(data)) {
          this.ruleTableData = data;
        }
      }).catch(err => {
        console.error('获取规则分页失败', err);
      });
    },

    // 38. 规则详情接口
    fetchRuleDetail(id) {
      getRuleDetailApi(id).then(res => {
        const data = res.body ? res.body.data : res.data;
        if (data) {
          this.$message.success('获取规则详情成功');
        }
      }).catch(err => {
        console.error('获取规则详情失败', err);
      });
    },

    // 39. 新增规则接口 (IntegralRuleV2)
    handleAddRule(form) {
      pointRuleAddApi(form).then(res => {
        this.$message.success('新增规则成功');
        this.fetchRulePage();
      }).catch(err => {
        console.error('新增规则失败', err);
      });
    },

    // 40. 修改规则接口 (生成新版本)
    handleUpdateRule(form) {
      pointRuleUpdateApi(form).then(res => {
        this.$message.success('修改规则成功');
        this.fetchRulePage();
      }).catch(err => {
        console.error('修改规则失败', err);
      });
    },

    // 41. 停用规则接口
    handleDisableRule(id) {
      pointRuleDisableApi(id).then(res => {
        this.$message.success('停用规则成功');
        this.fetchRulePage();
      }).catch(err => {
        console.error('停用规则失败', err);
      });
    }
  }
}
</script>

<style scoped>
.page-container {
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  min-height: calc(100vh - 84px);
  background: #f5f7fa;
  padding: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #333a45;
}

.page-subtitle {
  font-size: 13px;
  color: #5a6472;
  margin-bottom: 16px;
}

.alert-box {
  background-color: #ebf1fa;
  border: 1px solid #c5d5f0;
  border-radius: 4px;
  padding: 13px 20px;
  font-size: 13px;
  color: #2f5496;
  margin-bottom: 16px;
}

.alert-title {
  font-weight: bold;
  color: #2f5496;
  margin-right: 8px;
}

.section-title-large {
  font-size: 16px;
  font-weight: bold;
  margin: 24px 0 16px 0;
  color: #333a45;
}

.architecture-card {
  border: 1px solid #e1e5ec;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.architecture-title {
  padding: 14px 18px;
  border-bottom: 1px solid #ebeef5;
  color: #333a45;
  font-size: 15px;
  font-weight: 600;
}

.architecture-card > .section-title,
.architecture-card > .section-title-large,
.architecture-card > .el-table,
.architecture-card > .sub-tips {
  margin-left: 18px;
  margin-right: 18px;
}

.architecture-card > .el-table {
  width: calc(100% - 36px) !important;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 28px 0 8px 0;
  border-left: 3px solid #409eff;
  padding-left: 9px;
  line-height: 19.6px;
  color: #2f5496;
}

.sub-tips {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.config-footer-tip {
  margin-top: 12px;
  margin-bottom: 4px;
}

.page-container ::v-deep .el-tabs__header {
  margin-bottom: 16px;
}

.page-container ::v-deep .el-tabs__item {
  height: 42px;
  line-height: 42px;
  padding: 0 20px;
  color: #606266;
  font-size: 14px;
}

.page-container ::v-deep .el-tabs__item.is-active {
  color: #2f5496;
  font-weight: 700;
}

.page-container ::v-deep .el-tabs__active-bar {
  background-color: #2f5496;
  height: 2px;
}

.card-box {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 0;
  margin-bottom: 16px;
  background-color: #fff;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 11px 16px;
  margin-bottom: 0;
  background-color: #f7f9fc;
}

.card-title {
  font-weight: 700;
  font-size: 14px;
  margin-right: 8px;
  color: #2f5496;
}

.formula-banner {
  background-color: #eef4ff;
  border: 1px solid #c5d5f0;
  padding: 11px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: #333a45;
  font-weight: 400;
  margin: 10px 16px 0;
}

.formula-orange {
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  padding: 11px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: #d46b08;
  margin: 10px 16px 0;
}

.card-box > .el-table {
  width: calc(100% - 32px) !important;
  margin: 14px 16px 0;
}

.card-box > .section-title {
  margin-left: 16px;
  margin-right: 16px;
}

.card-box > .sub-tips {
  margin-left: 16px;
  margin-right: 16px;
}

/* 标签样式 */
.tag-blue {
  background-color: #ecf5ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  display: inline-block;
}

.tag-purple {
  background-color: #f9f0ff;
  color: #722ed1;
  border: 1px solid #d3adf7;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  display: inline-block;
}

.tag-gray {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  padding: 0 8px;
  font-size: 11px;
  margin-left: 6px;
}

/* 覆盖 Element 表头浅灰色背景 */
::v-deep .el-table th {
  background-color: #fafafa !important;
  color: #303133;
  font-weight: bold;
}
</style>
