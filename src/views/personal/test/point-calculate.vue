<template>
  <div class="trial-calc-container">
    <!-- 页头标题 -->
    <div class="page-header">
      <h2 class="title">积分及等级试算</h2>
      <p class="subtitle">
        支持老客户转新规则等级试算、新规则全量客户加保/购新试算，结果实时展示
      </p>
    </div>

    <!-- 场景 Tab 切换 -->
    <div class="scene-tabs">
      <div
          class="tab-item"
          :class="{ active: currentScene === 'scene1' }"
          @click="switchScene('scene1')"
      >
        场景一：老客户转新规则等级试算
      </div>
      <div
          class="tab-item"
          :class="{ active: currentScene === 'scene2' }"
          @click="switchScene('scene2')"
      >
        场景二：新规则全量客户加保/购新试算
      </div>
    </div>

    <!-- 提示 Banner：场景一提示 -->
    <el-alert
        v-if="currentScene === 'scene1'"
        class="custom-alert-banner"
        type="error"
        :closable="false"
        show-icon
    >
      <template slot="title">
        <span class="alert-title">提示</span>
        <span class="alert-content">
          本结果为模拟预估，不代表最终等级，仅供参考。试算不会变更账户真实等级与权益，实际等级以系统正式核算为准。客户数据发生变动时，试算结果会随之变化。
        </span>
      </template>
    </el-alert>

    <!-- 提示 Banner：场景二提示 -->
    <el-alert
        v-else
        class="custom-alert-banner"
        type="error"
        :closable="false"
        show-icon
    >
      <template slot="title">
        <span class="alert-title">提示</span>
        <span class="alert-content">
          试算支持两类场景：一是老系统客户迁移至新系统，并叠加拟办理的加保/购新业务；二是已在新系统的客户直接叠加拟办理的加保/购新业务，模拟预判等级变动。试算基于客户当前账户数据开展模拟计算，不会修改账户真实数据、不产生真实业务生效，亦不会变更现有等级与权益；若客户原有业绩、业务状态、有效期发生变动，试算结果将同步变化，最终等级以系统迁移、加保/购新业务真实生效后，按新版规则正式核算为准。
        </span>
      </template>
    </el-alert>

    <!-- ==================== 试算条件卡片 ==================== -->
    <el-card class="box-card form-card" shadow="never">
      <div class="card-header-flex">
        <span class="card-title">试算条件</span>
        <el-button
            v-if="currentScene === 'scene1'"
            size="small"
            class="btn-round"
            @click="openTaskDialog"
        >
          试算任务
        </el-button>
      </div>

      <!-- 试算表单 (包含带 Label 的输入项) -->
      <el-form
          :inline="true"
          :model="calcForm"
          size="small"
          label-width="95px"
          class="calc-form"
      >
        <el-form-item label="客户姓名：" required>
          <el-input
              v-model="calcForm.custName"
              placeholder="请输入客户姓名"
              style="width: 180px;"
              clearable
          />
        </el-form-item>

        <el-form-item label="证件类型：" required>
          <el-select
              v-model="calcForm.idType"
              placeholder="请选择证件类型"
              style="width: 160px;"
          >
            <el-option label="居民身份证" value="IDCARD" />
            <el-option label="身份证" value="身份证" />
            <el-option label="中国护照" value="PASSPORT" />
          </el-select>
        </el-form-item>

        <el-form-item label="证件号码：" required>
          <el-input
              v-model="calcForm.idNo"
              placeholder="请输入证件号码"
              style="width: 220px;"
              clearable
          />
        </el-form-item>

        <!-- 场景一：表单操作按钮组 -->
        <el-form-item v-if="currentScene === 'scene1'" label-width="10px">
          <el-button type="primary" class="btn-item" @click="handleRunCalc">试算</el-button>
          <el-button class="btn-item" @click="handleReset">重置</el-button>
          <el-button class="btn-item" @click="handleBatchImport">批量导入</el-button>
          <input ref="fileInput" type="file" style="display: none;" accept=".csv" @change="onFileChange" />
        </el-form-item>
      </el-form>

      <!-- 场景一：批量导入操作提示 -->
      <div v-if="currentScene === 'scene1'" class="batch-tip-text">
        批量操作：支持客户名单批量导入，导入后确认名单再提交试算；提交后可在右上角「试算任务」入口中查看结果
      </div>

      <!-- 场景二：产品明细添加表格 -->
      <div v-if="currentScene === 'scene2'" class="product-section">
        <div class="product-header-bar">
          <div class="p-title">
            产品明细 <span class="p-count">（共 {{ productList.length }} 个产品）</span>
          </div>
          <el-button size="small" type="primary" plain icon="el-icon-plus" @click="openProductDialog">
            添加产品
          </el-button>
        </div>

        <el-table :data="productList" border size="small" class="product-table">
          <el-table-column label="险种编码" width="140">
            <template slot-scope="scope">
              <span>{{ scope.row.riskCode }}</span>
              <el-button type="text" size="mini" style="margin-left: 8px;" @click="openProductDialog">选择</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="riskName" label="险种名称" min-width="160" />
          <el-table-column prop="type" label="险种类型" width="120" />
          <el-table-column label="年交保费 (元)" width="180">
            <template slot-scope="scope">
              <el-input-number v-model="scope.row.premium" :controls="false" size="mini" style="width: 100%;" />
            </template>
          </el-table-column>
          <el-table-column label="缴费方式" width="150">
            <template slot-scope="scope">
              <el-select v-model="scope.row.payMode" size="mini">
                <el-option label="趸交" value="year" />
                <el-option label="期交3年" value="period3" />
                <el-option label="期交5年" value="period5" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="是否养老协同" width="110" align="center">
            <template slot-scope="scope">
              <el-checkbox v-model="scope.row.pensionFlag" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" class="danger-text" @click="handleRemoveProduct(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="scene2-action-bar">
          <el-button type="primary" size="small" @click="handleRunCalc">试 算</el-button>
          <el-button size="small" @click="handleReset">重 置</el-button>
          <span class="action-tip">支持添加多个产品一同试算，积分按各产品保费 × 险种系数合计</span>
        </div>
      </div>
    </el-card>

    <!-- ==================== 试算结果卡片展示 ==================== -->
    <el-card v-if="hasCalculated" class="box-card result-card" shadow="never">
      <div class="result-header-title">试算结果</div>

      <!-- 客户基本信息 -->
      <div class="sub-block-title">客户基本信息</div>
      <el-descriptions :column="3" class="result-descriptions" size="medium">
        <el-descriptions-item label="客户名称"><span class="val-bold">{{ resultData.custName || calcForm.custName || '张*' }}</span></el-descriptions-item>
        <el-descriptions-item label="客户号"><span class="val-bold">{{ resultData.custId || 'CU202401001' }}</span></el-descriptions-item>
        <el-descriptions-item label="证件类型"><span class="val-bold">{{ resultData.idType || calcForm.idType || '居民身份证' }}</span></el-descriptions-item>
        <el-descriptions-item label="证件号码"><span class="val-bold">{{ resultData.idNo || calcForm.idNo || '110101198710******' }}</span></el-descriptions-item>
        <el-descriptions-item label="服务归属机构"><span class="val-bold">{{ resultData.orgName || '天津分公司' }}</span></el-descriptions-item>
      </el-descriptions>

      <!-- 试算比对 (顶部卡片) -->
      <div class="sub-block-title" style="margin-top: 24px;">试算比对</div>
      <div class="comparison-container">
        <!-- 左侧：老规则 / 当前等级 -->
        <div class="comp-box">
          <div class="comp-header">
            <span class="c-title">{{ currentScene === 'scene1' ? '老规则' : '当前' }}</span>
            <span class="c-tag gray-tag">{{ currentScene === 'scene1' ? 'V爱客户管理规则' : '新积分等级体系' }}</span>
          </div>
          <div class="comp-body">
            <div class="comp-row">
              <span class="c-label">当前积分</span>
              <span class="c-num">{{ currentScene === 'scene1' ? (resultData.oldPoint !== undefined ? resultData.oldPoint : '98,200') : (resultData.oldPoint !== undefined ? resultData.oldPoint : '7,200') }}</span>
            </div>
            <div class="comp-row" style="margin-top: 16px;">
              <span class="c-label">当前等级</span>
              <span class="c-level">{{ currentScene === 'scene1' ? (resultData.oldGrade || '五星') : (resultData.oldGrade || '普星') }}</span>
            </div>
          </div>
        </div>

        <!-- 中间：升降级/变动提示 -->
        <div class="comp-middle">
          <div class="arrow-circle"><i class="el-icon-right"></i></div>
          <template v-if="currentScene === 'scene1'">
            <div class="diff-badge green-badge">积分 +4,200</div>
            <div class="diff-badge gray-badge">等级 持平</div>
          </template>
          <template v-else>
            <div class="diff-badge green-badge">等级 ↑ 升1级</div>
          </template>
        </div>

        <!-- 右侧：新规则 / 预估等级 -->
        <div class="comp-box highlight-box">
          <div class="comp-header blue-bg">
            <span class="c-title">{{ currentScene === 'scene1' ? '新规则' : '试算后' }}</span>
            <span class="c-tag blue-tag">新积分等级体系</span>
          </div>
          <div class="comp-body">
            <div class="comp-row">
              <span class="c-label">试算积分</span>
              <span class="c-num blue-text">{{ currentScene === 'scene1' ? (resultData.newPoint !== undefined ? resultData.newPoint : '105,900') : (resultData.newPoint !== undefined ? resultData.newPoint : '37,200') }}</span>
            </div>
            <div class="comp-row" style="margin-top: 16px;">
              <span class="c-label">预估等级</span>
              <span class="c-level blue-text">{{ currentScene === 'scene1' ? (resultData.newGradeName || resultData.newGrade || '五星 (新V)') : (resultData.newGrade || '三星 (新V)') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 场景一独有：保单积分明细与等级权益对比 ==================== -->
      <template v-if="currentScene === 'scene1'">
        <!-- 按新规则计算的保单积分明细 -->
        <div class="sub-block-title" style="margin-top: 24px;">按新规则计算的保单积分明细</div>
        <el-table :data="resultData.pointCalc && resultData.pointCalc.length ? resultData.pointCalc : scene1PolicyDetails" border size="small" class="custom-inner-table">
          <el-table-column prop="policy_no" label="保单号" width="130" />
          <el-table-column prop="riskname" label="险种" min-width="180" />
          <el-table-column label="积分类型" width="130">
            <template slot-scope="scope">
              <span class="type-pill" :class="getTypePillClass(scope.row.point_type || scope.row.type)">{{ scope.row.point_type || scope.row.type }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="premium" label="实收保费 (元)" align="right" width="130" />
          <el-table-column prop="calc_coefficient" label="计算系数" align="center" width="100" />
          <el-table-column prop="payyears" label="连续交费 (年)" align="center" width="110" />
          <el-table-column prop="point" label="积分 (分)" align="right" width="120" />
        </el-table>

        <div class="calc-formula-bar">
          保费积分 <strong class="blue-text">{{ resultData.pointCalcTotal ? resultData.pointCalcTotal.premium : '92,400' }}</strong> + 忠诚积分 <strong class="blue-text">{{ resultData.pointCalcTotal ? resultData.pointCalcTotal.loyalty : '9,900' }}</strong> + 养老协同积分 <strong class="blue-text">{{ resultData.pointCalcTotal ? resultData.pointCalcTotal.pension : '3,600' }}</strong> = 试算汇总积分 <strong class="blue-text" style="font-size: 16px;">{{ resultData.pointCalcTotal ? resultData.pointCalcTotal.total : '105,900' }}</strong>
        </div>
        <div class="formula-sub-tip">
          保费积分 = 实收保费（元）× 险种计算系数，每张已生效保单均产生；忠诚积分 = 实收保费（元）× 1%，仅连续交费满3年及以上的保单产生（含二次投保奖励）；养老协同积分 = 保费积分 × 5%, 仅在养老协同产品的基础积分之外额外奖励。故并非每张保单都有忠诚积分与养老协同积分。客户名下全部已生效保单均纳入试算，新规则试算总积分 105,900 分。
        </div>

        <!-- 场景一：等级权益对比 -->
        <div class="sub-block-title" style="margin-top: 24px;">等级权益对比</div>
        <div class="equity-comparison-container">
          <!-- 老系统当前权益 -->
          <div class="equity-box">
            <div class="equity-header">
              <span class="e-title">老系统当前权益</span>
              <span class="e-tag gray-tag">V爱客户管理规则</span>
            </div>
            <el-table :data="resultData.oldBenefits && resultData.oldBenefits.length ? resultData.oldBenefits : scene1OldEquities" size="small" border class="equity-table">
              <el-table-column prop="benefit_name" label="服务权益">
                <template slot-scope="scope">
                  <span>{{ scope.row.benefit_name || scope.row.service }}</span>
                </template>
              </el-table-column>
              <el-table-column label="服务项目" min-width="140">
                <template slot-scope="scope">
                  <span>{{ formatItemsJson(scope.row.items_json || scope.row.item) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="supplier" label="服务商">
                <template slot-scope="scope">
                  <span>{{ scope.row.supplier || scope.row.provider }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="grant_count" label="可使用次数" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.grant_count !== undefined ? scope.row.grant_count : scope.row.available }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="used_count" label="已使用" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.used_count !== undefined ? scope.row.used_count : scope.row.used }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 转换方向指示 -->
          <div class="equity-middle">
            <div class="arrow-circle"><i class="el-icon-right"></i></div>
            <span class="equity-mid-text">老规则→新规则</span>
          </div>

          <!-- 新规则权益 -->
          <div class="equity-box">
            <div class="equity-header blue-bg">
              <span class="e-title">新规则权益</span>
              <span class="e-tag blue-tag">新积分等级体系</span>
            </div>
            <el-table :data="resultData.newBenefits && resultData.newBenefits.length ? resultData.newBenefits : scene1NewEquities" size="small" border class="equity-table">
              <el-table-column label="服务权益">
                <template slot-scope="scope">
                  <span>{{ scope.row.benefit_name || scope.row.service }}</span>
                  <el-tag v-if="scope.row.added || scope.row.isNew" type="success" size="mini" effect="light" style="margin-left: 6px;">新增</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="服务项目" min-width="140">
                <template slot-scope="scope">
                  <span>{{ formatItemsJson(scope.row.items_json || scope.row.item) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="supplier" label="服务商">
                <template slot-scope="scope">
                  <span>{{ scope.row.supplier || scope.row.provider }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="grant_count" label="可使用次数" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.grant_count !== undefined ? scope.row.grant_count : scope.row.available }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>

      <!-- ==================== 场景二独有：试算摘要与等级权益对比 ==================== -->
      <template v-if="currentScene === 'scene2'">
        <div class="sub-block-title" style="margin-top: 24px;">试算摘要</div>

        <!-- 表格 1：现有保单积分 -->
        <div class="summary-table-title">现有保单积分 <span class="sub-text">（客户名下已生效保单，按新规则累计）</span></div>
        <el-table :data="resultData.policyDetails && resultData.policyDetails.length ? resultData.policyDetails : scene2ExistingPolicies" border size="small" class="custom-inner-table">
          <el-table-column prop="policy_no" label="保单号" width="160" />
          <el-table-column prop="riskcode" label="险种编码" width="130" />
          <el-table-column prop="riskname" label="险种" min-width="200" />
          <el-table-column prop="premium" label="年交保费 (元)" align="right" width="150" />
          <el-table-column prop="calc_coefficient" label="计算系数" align="center" width="120" />
          <el-table-column prop="point" label="积分 (分)" align="right" width="150" />
        </el-table>
        <div class="summary-total-row">
          现有保单积分合计 <strong class="bold-num">{{ resultData.oldPoint !== undefined ? resultData.oldPoint : '7,200' }}</strong>
        </div>

        <!-- 表格 2：加保/购新积分 -->
        <div class="summary-table-title" style="margin-top: 16px;">加保/购新积分 <span class="sub-text">（按上方产品明细试算）</span></div>
        <el-table :data="resultData.extraDetails && resultData.extraDetails.length ? resultData.extraDetails : scene2NewPolicies" border size="small" class="custom-inner-table">
          <el-table-column prop="riskCode" label="险种编码" width="160" />
          <el-table-column prop="riskName" label="险种名称" min-width="200" />
          <el-table-column prop="premium" label="年交保费 (元)" align="right" width="150" />
          <el-table-column prop="factor" label="首期保费计算系数" align="center" width="160" />
          <el-table-column prop="premiumPoint" label="积分 (分)" align="right" width="150" />
        </el-table>
        <div class="summary-total-row">
          加保/购新积分合计 <strong class="bold-num">{{ resultData.extraPoint && resultData.extraPoint.total !== undefined ? resultData.extraPoint.total : '30,000' }}</strong>
        </div>

        <!-- 场景二总积分与差额提示条 -->
        <div class="scene2-score-summary-bar">
          <span class="score-item">总积分 <strong class="blue-score">{{ resultData.newPoint !== undefined ? resultData.newPoint : '37,200' }} 分</strong></span>
          <span class="score-item">距下一等级差额 <strong class="dark-score">{{ resultData.nextGap !== undefined ? resultData.nextGap : '22,800' }} 分</strong></span>
        </div>

        <!-- 场景二：等级权益对比 -->
        <div class="sub-block-title" style="margin-top: 24px;">等级权益对比</div>
        <div class="equity-comparison-container">
          <!-- 当前权益 -->
          <div class="equity-box">
            <div class="equity-header">
              <span class="e-title">当前权益</span>
              <span class="e-tag gray-tag">新积分等级体系</span>
            </div>
            <el-table :data="resultData.currentBenefits && resultData.currentBenefits.length ? resultData.currentBenefits : scene2CurrentEquities" size="small" border class="equity-table">
              <el-table-column prop="benefit_name" label="服务权益" />
              <el-table-column prop="supplier" label="服务商" />
              <el-table-column prop="grant_count" label="可使用次数" align="center" />
              <el-table-column prop="used_count" label="已使用" align="center" />
            </el-table>
          </div>

          <!-- 试算方向指示 -->
          <div class="equity-middle">
            <div class="arrow-circle"><i class="el-icon-right"></i></div>
            <span class="equity-mid-text">当前→试算后</span>
          </div>

          <!-- 试算后权益 -->
          <div class="equity-box">
            <div class="equity-header blue-bg">
              <span class="e-title">试算后权益</span>
              <span class="e-tag blue-tag">新积分等级体系</span>
            </div>
            <el-table :data="resultData.newGradeBenefits && resultData.newGradeBenefits.length ? resultData.newGradeBenefits : scene2AfterEquities" size="small" border class="equity-table">
              <el-table-column label="服务权益">
                <template slot-scope="scope">
                  <span>{{ scope.row.benefit_name || scope.row.service }}</span>
                  <el-tag v-if="scope.row.added" type="success" size="mini" effect="light" style="margin-left: 6px;">新增</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="supplier" label="服务商" />
              <el-table-column label="权益次数" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.freq_count !== undefined ? scope.row.freq_count : scope.row.times }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>
    </el-card>

    <!-- ==================== 弹窗一：试算任务弹窗 ==================== -->
    <el-dialog
        title="试算任务"
        :visible.sync="taskDialogVisible"
        width="900px"
        custom-class="custom-dialog"
        :close-on-click-modal="false"
    >
      <el-tabs v-model="activeTaskTab" class="custom-dialog-tabs" @tab-click="handleTaskTabChange">
        <el-tab-pane label="试算记录" name="record">
          <el-form :inline="true" :model="taskQueryForm" size="small" label-width="85px" class="dialog-search-form">
            <el-form-item label="申请人：">
              <el-input v-model="taskQueryForm.applicant" placeholder="请输入申请人" style="width: 130px;" clearable />
            </el-form-item>
            <el-form-item label="申请时间：">
              <el-date-picker
                  v-model="taskQueryForm.dateRange"
                  type="daterange"
                  range-separator="~"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 220px;"
                  value-format="yyyy-MM-dd"
              />
            </el-form-item>
            <el-form-item label-width="0">
              <el-button type="primary" @click="fetchTaskPage">查询</el-button>
              <el-button @click="resetTaskQuery">重置</el-button>
              <el-button>导出</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="taskRecordData" size="small" border style="width: 100%; margin-top: 12px;">
            <el-table-column prop="trialTime" label="试算时间" min-width="160" align="center" />
            <el-table-column prop="cnt" label="试算人数" width="100" align="center" />
            <el-table-column prop="operator" label="申请人" width="110" align="center" />
            <el-table-column label="状态" width="110" align="center">
              <template slot-scope="scope">
                <span class="status-pill" :class="scope.row.status === 'DONE' ? 'pill-success' : 'pill-warning'">
                  {{ scope.row.status === 'DONE' ? '已完成' : scope.row.status }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="150" align="center">
              <template slot-scope="scope">
                <el-button v-if="scope.row.status === 'DONE'" type="text" size="small" @click="viewTaskDetail(scope.row.taskNo)">查看结果</el-button>
                <span v-else class="text-disabled">试算进行中，完成后可查看</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="dialog-pagination-bar">
            <el-pagination
                background
                layout="total, prev, pager, next"
                :total="taskTotal"
                :page-size="taskPageSize"
                :current-page.sync="taskPageNum"
                @current-change="fetchTaskPage"
            />
            <span class="footer-tip">仅记录老客户转新规则（场景一）的批量试算任务，结果仅供预估参考</span>
          </div>
        </el-tab-pane>

        <el-tab-pane label="试算明细" name="detail">
          <el-form :inline="true" :model="detailQueryForm" size="small" label-width="85px" class="dialog-search-form">
            <el-form-item label="客户：">
              <el-input v-model="detailQueryForm.custName" placeholder="客户" style="width: 120px;" clearable />
            </el-form-item>
            <el-form-item label="证件号码：">
              <el-input v-model="detailQueryForm.idNo" placeholder="证件号码" style="width: 150px;" clearable />
            </el-form-item>

            <el-form-item label-width="0">
              <el-button type="primary" @click="fetchDetailItemPage">查询</el-button>
              <el-button @click="resetDetailQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="taskDetailData" size="small" border style="width: 100%; margin-top: 12px;">
            <el-table-column prop="custName" label="客户" min-width="150" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.custName }} ({{ scope.row.custId }})
              </template>
            </el-table-column>
            <el-table-column prop="idType" label="证件类型" width="100" />
            <el-table-column prop="idNo" label="证件号码" width="150" />
            <el-table-column prop="oldPoint" label="老规则当前积分" align="right" width="120" />
            <el-table-column prop="oldGrade" label="老规则当前等级" align="center" width="110" />
            <el-table-column prop="newPoint" label="新规则试算积分" align="right" width="120" />
            <el-table-column prop="newGrade" label="新规则预估等级" align="center" width="120" />
          </el-table>

          <div class="dialog-pagination-bar">
            <el-pagination
                background
                layout="total, prev, pager, next"
                :total="detailTotal"
                :page-size="detailPageSize"
                :current-page.sync="detailPageNum"
                @current-change="fetchDetailItemPage"
            />
          </div>
        </el-tab-pane>
      </el-tabs>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="taskDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- ==================== 弹窗二：选择险种弹窗 ==================== -->
    <el-dialog
        title="选择险种"
        :visible.sync="productDialogVisible"
        width="800px"
        custom-class="custom-dialog"
        :close-on-click-modal="false"
    >
      <el-form :inline="true" :model="productQueryForm" size="small" label-width="85px" class="dialog-search-form">
        <el-form-item label="险种编码：">
          <el-input v-model="productQueryForm.riskCode" placeholder="险种编码" style="width: 120px;" clearable />
        </el-form-item>
        <el-form-item label="险种名称：">
          <el-input v-model="productQueryForm.riskName" placeholder="险种名称" style="width: 140px;" clearable />
        </el-form-item>
        <el-form-item label-width="0">
          <el-button type="primary" @click="fetchRiskPage">查询</el-button>
          <el-button @click="resetRiskQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
          :data="productSelectData"
          size="small"
          border
          highlight-current-row
          style="width: 100%; margin-top: 12px;"
          @current-change="handleSelectRowChange"
      >
        <el-table-column width="45" align="center">
          <template slot-scope="scope">
            <el-radio v-model="selectedProductCode" :label="scope.row.riskCode"><span></span></el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="riskCode" label="险种编码" width="120" />
        <el-table-column prop="riskName" label="险种名称" min-width="160" />
        <el-table-column prop="type1" label="险种分类一" width="110" />
        <el-table-column prop="type2" label="险种分类二" width="110" />
      </el-table>

      <div class="dialog-pagination-bar" style="margin-top: 10px;">
        <el-pagination
            background
            layout="total, prev, pager, next"
            :total="riskTotal"
            :page-size="riskPageSize"
            :current-page.sync="riskPageNum"
            @current-change="fetchRiskPage"
        />
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="productDialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="confirmSelectProduct">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  switchTrialApi,
  switchTrialBatchApi,
  getSwitchTrialTaskPageApi,
  getSwitchTrialItemPageApi,
  switchTrialExtraApi,
  getSwitchTrialRiskPageApi
} from '@/api/test'

export default {
  name: 'TrialCalcPage',
  data() {
    return {
      currentScene: 'scene1',
      hasCalculated: false,

      calcForm: {
        custName: '王芳',
        idType: '身份证',
        idNo: '110101199202002028'
      },

      // 接口返回的试算结果数据
      resultData: {},

      // 场景二：待试算产品列表
      productList: [
        { riskCode: 'R1001', riskName: '分红年金保险A款', type: '年金保险', premium: 10000, payMode: 'year', pensionFlag: false }
      ],

      // ==================== 场景一数据源 (默认备用) ==================== -->
      scene1PolicyDetails: [
        {
          policyNo: 'P202400566',
          productName: '分红年金保险A款',
          type: '保费积分',
          premium: '840,000',
          ratio: '5%',
          years: '—',
          points: '42,000'
        },
        {
          policyNo: 'P202400566',
          productName: '分红年金保险A款',
          type: '忠诚积分',
          premium: '840,000',
          ratio: '1%',
          years: '3',
          points: '8,400'
        },
        {
          policyNo: 'P202400566',
          productName: '分红年金保险A款',
          type: '养老协同积分',
          premium: '840,000',
          ratio: '0.25%',
          years: '—',
          points: '2,100'
        },
        {
          policyNo: 'P202100207',
          productName: '终身寿险（尊享版）',
          type: '保费积分',
          premium: '300,000',
          ratio: '10%',
          years: '—',
          points: '30,000'
        }
      ],
      scene1OldEquities: [
        { service: '视频医生服务', item: '视频医生', provider: 'XX健康管理', available: '不限次', used: '3' },
        { service: '专家问诊服务', item: '专家问诊', provider: 'XX医院互联网医院', available: '2 次/年', used: '1' },
        { service: '体检服务', item: '体检套餐', provider: 'XX体检中心', available: '1 次/年', used: '0' }
      ],
      scene1NewEquities: [
        { service: '视频医生服务', item: '视频医生', provider: 'XX健康管理', available: '不限次', isNew: false },
        { service: '专家问诊服务', item: '专家问诊', provider: 'XX医院互联网医院', available: '2 次/年', isNew: false },
        { service: '体检服务', item: '体检套餐', provider: 'XX体检中心', available: '1 次/年', isNew: false },
        { service: '重疾关怀服务', item: '重疾关怀', provider: 'XX康复服务', available: '1 次/年', isNew: true }
      ],

      // ==================== 场景二数据源 ====================
      scene2ExistingPolicies: [
        {
          policyNo: 'P202501188',
          code: 'R1001',
          name: '分红年金保险A款',
          premium: '84,000',
          ratio: '5%',
          points: '4,200'
        },
        {
          policyNo: 'P202301442',
          code: 'R2001',
          name: '终身寿险（尊享版）',
          premium: '30,000',
          ratio: '10%',
          points: '3,000'
        }
      ],
      scene2NewPolicies: [
        { code: 'R1001', name: '分红年金保险A款', premium: '400,000', ratio: '5%', points: '20,000' },
        { code: 'R2001', name: '终身寿险（尊享版）', premium: '100,000', ratio: '10%', points: '10,000' }
      ],
      scene2CurrentEquities: [
        { service: '视频医生服务', item: '视频医生', provider: 'XX健康管理', available: '不限次', used: '2' },
        { service: '体检服务', item: '体检套餐', provider: 'XX体检中心', available: '1 次/年', used: '0' }
      ],
      scene2AfterEquities: [
        { service: '视频医生服务', item: '视频医生', provider: 'XX健康管理', times: '不限次' },
        { service: '专家问诊服务', item: '专家问诊', provider: 'XX医院互联网医院', times: '不限次' },
        { service: '体检服务', item: '体检套餐', provider: 'XX体检中心', times: '2 次/年' },
        { service: '重疾关怀服务', item: '重疾关怀', provider: 'XX康复服务', times: '1 次/年' },
        { service: '二选一服务 (A/B)', item: '二选一体检', provider: 'XX健康管理', times: '10 次/年' },
        { service: '道路救援服务', item: '道路救援', provider: 'XX救援服务', times: '3 次/年' }
      ],

      // 弹窗状态与数据
      taskDialogVisible: false,
      activeTaskTab: 'record',
      taskQueryForm: { applicant: '', dateRange: [] },
      taskRecordData: [],
      taskTotal: 0,
      taskPageNum: 1,
      taskPageSize: 10,

      detailQueryForm: { custName: '', idNo: '', taskNo: '' },
      taskDetailData: [],
      detailTotal: 0,
      detailPageNum: 1,
      detailPageSize: 10,

      productDialogVisible: false,
      productQueryForm: { riskCode: '', riskName: '' },
      selectedProductCode: '',
      selectedProductRow: null,
      productSelectData: [],
      riskTotal: 0,
      riskPageNum: 1,
      riskPageSize: 10
    };
  },
  methods: {
    // 解析 JSON 字符串服务项目，避免直接展示 JSON 文本
    formatItemsJson(jsonStr) {
      if (!jsonStr) return '—';
      // 如果已经是普通文本（如静态数据中的 item），直接返回
      if (typeof jsonStr !== 'string') return jsonStr;
      if (!jsonStr.startsWith('[') && !jsonStr.startsWith('{')) {
        return jsonStr;
      }
      try {
        const arr = JSON.parse(jsonStr);
        if (Array.isArray(arr)) {
          return arr.map(item => item.name || item.cat || '').filter(Boolean).join(', ');
        }
      } catch (e) {
        return jsonStr;
      }
      return jsonStr;
    },
    switchScene(scene) {
      this.currentScene = scene;
      this.hasCalculated = true;
      if (scene === 'scene2') {
        this.calcForm.custName = '王芳';
        this.calcForm.idType = '身份证';
        this.calcForm.idNo = '110101199202002028';
      } else {
        this.calcForm.custName = '李娜';
        this.calcForm.idType = 'IDCARD';
        this.calcForm.idNo = '11010119920200202X';
      }
    },
    // 试算分发处理
    handleRunCalc() {
      if (this.currentScene === 'scene1') {
        switchTrialApi({
          custName: this.calcForm.custName,
          idType: this.calcForm.idType,
          idNo: this.calcForm.idNo
        }).then(res => {
          const bodyData = res.body ? res.body.data : res.data;
          if (bodyData) {
            this.resultData = bodyData;
            this.hasCalculated = true;
            this.$message.success('已完成预估试算，请查看下方比对结果');
          }
        }).catch(err => {
          console.error(err);
          this.resultData = {};
          this.hasCalculated = false;
          this.$message.error('试算请求失败');
        });
      } else {
        // 场景二：调用加保试算接口
        const payload = {
          custName: this.calcForm.custName,
          idType: this.calcForm.idType,
          idNo: this.calcForm.idNo,
          products: this.productList.map(item => ({
            riskCode: item.riskCode,
            premium: item.premium,
            payMode: item.payMode || 'year',
            pensionFlag: !!item.pensionFlag
          }))
        };
        switchTrialExtraApi(payload).then(res => {
          const bodyData = res.body ? res.body.data : res.data;
          if (bodyData) {
            this.resultData = bodyData;
            this.hasCalculated = true;
            this.$message.success('已完成加保预估试算，请查看下方比对结果');
          }
        }).catch(err => {
          console.error(err);
          this.resultData = {};
          this.hasCalculated = false;
          this.$message.error('加保试算请求失败');
        });
      }
    },
    handleReset() {
      this.calcForm = { custName: '', idType: 'IDCARD', idNo: '' };
    },
    handleBatchImport() {
      this.$refs.fileInput.click();
    },
    // 场景一：批量试算（CSV）接口调用
    onFileChange(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      switchTrialBatchApi(formData).then(res => {
        const data = res.body ? res.body.data : res.data;
        if (data) {
          this.$message.success(`批量试算提交成功！任务号: ${data.taskNo}, 总数: ${data.total}, 成功: ${data.success}, 失败: ${data.fail}`);
        }
      }).catch(err => {
        console.error(err);
        this.$message.error('批量导入试算失败');
      }).finally(() => {
        e.target.value = '';
      });
    },
    handleRemoveProduct(index) {
      this.productList.splice(index, 1);
    },
    openProductDialog() {
      this.productDialogVisible = true;
      this.fetchRiskPage();
    },
    // 险种档案分页接口调用
    fetchRiskPage() {
      const params = {
        pageNum: this.riskPageNum,
        pageSize: this.riskPageSize,
        riskCode: this.productQueryForm.riskCode,
        riskName: this.productQueryForm.riskName
      };
      getSwitchTrialRiskPageApi(params).then(res => {
        const data = res.body ? res.body.data : res.data;
        if (Array.isArray(data)) {
          this.productSelectData = data;
        } else if (data && data.list) {
          this.productSelectData = data.list;
          this.riskTotal = data.total || 0;
        } else {
          // 备用静态数据填充防止接口未就绪时的空展示
          this.productSelectData = [
            { riskCode: 'R1001', riskName: '分红年金保险A款', type1: '人身保险', type2: '年金保险' },
            { riskCode: 'R2001', riskName: '终身寿险（尊享版）', type1: '人身保险', type2: '人寿保险' }
          ];
        }
      }).catch(() => {
        this.productSelectData = [
          { riskCode: 'R1001', riskName: '分红年金保险A款', type1: '人身保险', type2: '年金保险' },
          { riskCode: 'R2001', riskName: '终身寿险（尊享版）', type1: '人身保险', type2: '人寿保险' }
        ];
      });
    },
    resetRiskQuery() {
      this.productQueryForm = { riskCode: '', riskName: '' };
      this.fetchRiskPage();
    },
    handleSelectRowChange(row) {
      if (row) {
        this.selectedProductCode = row.riskCode;
        this.selectedProductRow = row;
      }
    },
    confirmSelectProduct() {
      if (this.selectedProductRow) {
        this.productList.push({
          riskCode: this.selectedProductRow.riskCode,
          riskName: this.selectedProductRow.riskName,
          type: this.selectedProductRow.type2 || '年金保险',
          premium: 10000,
          payMode: 'year',
          pensionFlag: false
        });
        this.productDialogVisible = false;
      }
    },
    openTaskDialog() {
      this.taskDialogVisible = true;
      this.fetchTaskPage();
      this.fetchDetailItemPage();
    },
    handleTaskTabChange(tab) {
      if (tab.name === 'record') {
        this.fetchTaskPage();
      } else if (tab.name === 'detail') {
        this.fetchDetailItemPage();
      }
    },
    // 试算任务列表接口调用
    fetchTaskPage() {
      const params = {
        pageNum: this.taskPageNum,
        pageSize: this.taskPageSize,
        applicant: this.taskQueryForm.applicant,
        dateFrom: this.taskQueryForm.dateRange && this.taskQueryForm.dateRange[0] ? this.taskQueryForm.dateRange[0] : '',
        dateTo: this.taskQueryForm.dateRange && this.taskQueryForm.dateRange[1] ? this.taskQueryForm.dateRange[1] : ''
      };
      getSwitchTrialTaskPageApi(params).then(res => {
        const data = res.body ? res.body.data : res.data;
        if (data && data.list) {
          this.taskRecordData = data.list;
          this.taskTotal = data.total || 0;
        } else if (Array.isArray(data)) {
          this.taskRecordData = data;
        } else {
          this.taskRecordData = [
            { trialTime: '2026-09-10 14:20', cnt: 186, operator: '张三', status: 'DONE' },
            { trialTime: '2026-09-11 09:05', cnt: 2340, operator: '张三', status: 'RUNNING' }
          ];
        }
      }).catch(() => {
        this.taskRecordData = [
          { trialTime: '2026-09-10 14:20', cnt: 186, operator: '张三', status: 'DONE' },
          { trialTime: '2026-09-11 09:05', cnt: 2340, operator: '张三', status: 'RUNNING' }
        ];
      });
    },
    resetTaskQuery() {
      this.taskQueryForm = { applicant: '', dateRange: [] };
      this.fetchTaskPage();
    },
    // 试算明细列表接口调用
    fetchDetailItemPage() {
      const params = {
        pageNum: this.detailPageNum,
        pageSize: this.detailPageSize,
        taskNo: this.detailQueryForm.taskNo,
        custName: this.detailQueryForm.custName,
        idNo: this.detailQueryForm.idNo
      };
      getSwitchTrialItemPageApi(params).then(res => {
        const data = res.body ? res.body.data : res.data;
        if (data && data.list) {
          this.taskDetailData = data.list;
          this.detailTotal = data.total || 0;
        } else if (Array.isArray(data)) {
          this.taskDetailData = data;
        } else {
          this.taskDetailData = [
            {
              custName: '王芳',
              custId: '1002',
              idType: '身份证',
              idNo: '110101199202002028',
              oldPoint: '20,100',
              oldGrade: 'SANXING',
              newPoint: '21,000',
              newGrade: 'SANXING'
            }
          ];
        }
      }).catch(() => {
        this.taskDetailData = [
          {
            custName: '王芳',
            custId: '1002',
            idType: '身份证',
            idNo: '110101199202002028',
            oldPoint: '20,100',
            oldGrade: 'SANXING',
            newPoint: '21,000',
            newGrade: 'SANXING'
          }
        ];
      });
    },
    resetDetailQuery() {
      this.detailQueryForm = { custName: '', idNo: '', taskNo: '' };
      this.fetchDetailItemPage();
    },
    viewTaskDetail(taskNo) {
      this.detailQueryForm.taskNo = taskNo;
      this.activeTaskTab = 'detail';
      this.fetchDetailItemPage();
    },
    getTypePillClass(type) {
      if (type === 'PREMIUM' || type === 'bf' || type === '保费积分') return 'pill-blue';
      if (type === 'LOYALTY' || type === '忠诚积分') return 'pill-purple';
      if (type === 'PENSION' || type === '养老协同积分') return 'pill-orange';
      return '';
    }
  }
};
</script>

<style scoped>
/* 容器框架布局 */
.trial-calc-container {
  padding: 20px 24px;
  background-color: #f0f2f5;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 页头标题 */
.page-header {
  margin-bottom: 16px;
}

.page-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #1f2d3d;
  margin: 0 0 6px 0;
}

.page-header .subtitle {
  font-size: 12px;
  color: #8c92a4;
  margin: 0;
}

/* 场景切换 Tab */
.scene-tabs {
  display: flex;
  border-bottom: 2px solid #2b58f0;
  margin-bottom: 16px;
}

.scene-tabs .tab-item {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background-color: #ffffff;
  color: #606266;
  border-radius: 4px 4px 0 0;
  margin-right: 8px;
  border: 1px solid #e4e7ed;
  border-bottom: none;
}

.scene-tabs .tab-item.active {
  background-color: #2b58f0;
  color: #ffffff;
  border-color: #2b58f0;
}

/* 提示 Banner */
.custom-alert-banner {
  margin-bottom: 16px;
  border-radius: 4px;
  background-color: #fdebee;
  border: 1px solid #fbd2d7;
}

.alert-title {
  font-weight: bold;
  color: #d03050;
  margin-right: 8px;
}

.alert-content {
  font-size: 12px;
  color: #d03050;
  line-height: 1.6;
}

/* 通用卡片及表单边距 */
.box-card {
  border: none;
  border-radius: 4px;
  background: #ffffff;
  margin-bottom: 16px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: bold;
  color: #1f2d3d;
}

.btn-round {
  border-radius: 16px;
  padding: 6px 16px;
}

/* 表单与 Label 标签调距 */
.calc-form .el-form-item {
  margin-bottom: 12px;
  margin-right: 12px;
}

.calc-form ::v-deep .el-form-item__label {
  font-weight: normal;
  color: #606266;
  padding-right: 4px;
}

.btn-item {
  margin-left: 4px;
}

.batch-tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.4;
}

/* 场景二：产品明细 */
.product-section {
  margin-top: 16px;
  border-top: 1px dashed #e4e7ed;
  padding-top: 16px;
}

.product-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.product-header-bar .p-title {
  font-size: 14px;
  font-weight: bold;
  color: #2b58f0;
}

.product-header-bar .p-count {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

.product-table {
  margin-bottom: 16px;
}

.danger-text {
  color: #f56c6c;
}

.scene2-action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.action-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

/* 试算结果区域结构 */
.result-card ::v-deep .el-card__body {
  padding: 20px;
}

.result-header-title {
  font-size: 16px;
  font-weight: bold;
  color: #1f2d3d;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.sub-block-title {
  font-size: 14px;
  font-weight: bold;
  color: #2b58f0;
  border-left: 3px solid #2b58f0;
  padding-left: 8px;
  margin-bottom: 12px;
}

.val-bold {
  font-weight: bold;
  color: #303133;
}

.result-descriptions ::v-deep .el-descriptions-item__label {
  color: #8c92a4;
}

/* 对比图框 (顶部卡片) */
.comparison-container {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-top: 12px;
}

.comp-box {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.comp-box.highlight-box {
  border-color: #c6d7fe;
}

.comp-header {
  padding: 10px 16px;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
}

.comp-header.blue-bg {
  background-color: #eef3fe;
}

.c-title {
  font-weight: bold;
  font-size: 14px;
}

.c-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.gray-tag {
  background: #f4f4f5;
  color: #909399;
}

.blue-tag {
  background: #ffffff;
  color: #2b58f0;
  border: 1px solid #c6d7fe;
}

.comp-body {
  padding: 20px 24px;
}

.comp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-label {
  color: #8c92a4;
  font-size: 13px;
}

.c-num {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.c-num.blue-text {
  color: #2b58f0;
}

.c-level {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.c-level.blue-text {
  color: #2b58f0;
}

.comp-middle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100px;
}

.arrow-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #2b58f0;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 8px;
}

.diff-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 4px;
}

.green-badge {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.gray-badge {
  background: #f5f5f5;
  color: #8c8c8c;
}

/* 场景一计算公式及提示 */
.type-pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.pill-blue {
  background: #e6f7ff;
  color: #1890ff;
}

.pill-purple {
  background: #f9f0ff;
  color: #722ed1;
}

.pill-orange {
  background: #fff7e6;
  color: #fa8c16;
}

.calc-formula-bar {
  text-align: right;
  font-size: 13px;
  background-color: #eef3fe;
  padding: 10px 16px;
  border-radius: 2px;
  margin-top: 12px;
  color: #606266;
}

.formula-sub-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  margin-top: 8px;
}

/* 场景二：试算摘要专属样式 */
.summary-table-title {
  font-size: 13px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.summary-table-title .sub-text {
  font-weight: normal;
  color: #909399;
  font-size: 12px;
}

.summary-total-row {
  text-align: right;
  font-size: 13px;
  padding: 8px 12px;
  background: #fbfbfb;
  border: 1px solid #ebeef5;
  border-top: none;
  color: #606266;
  margin-bottom: 12px;
}

.summary-total-row .bold-num {
  font-size: 15px;
  color: #303133;
}

.scene2-score-summary-bar {
  background-color: #eef3fe;
  padding: 12px 20px;
  border-radius: 4px;
  display: flex;
  justify-content: flex-start;
  gap: 40px;
  align-items: center;
  margin-top: 16px;
}

.scene2-score-summary-bar .score-item {
  font-size: 14px;
  color: #606266;
}

.scene2-score-summary-bar .blue-score {
  font-size: 18px;
  color: #2b58f0;
  margin-left: 6px;
}

.scene2-score-summary-bar .dark-score {
  font-size: 18px;
  color: #303133;
  margin-left: 6px;
}

/* 等级权益对比 (场景一 & 场景二通用表格对比) */
.equity-comparison-container {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-top: 12px;
}

.equity-box {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.equity-header {
  padding: 10px 16px;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
}

.equity-header.blue-bg {
  background-color: #eef3fe;
}

.e-title {
  font-weight: bold;
  font-size: 14px;
}

.e-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.equity-middle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 90px;
}

.equity-mid-text {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.equity-table {
  border: none !important;
}

/* 弹窗通用样式 */
.custom-dialog ::v-deep .el-dialog__body {
  padding: 16px 20px;
}

.dialog-search-form .el-form-item {
  margin-bottom: 8px;
  margin-right: 8px;
}

.dialog-pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-tip {
  font-size: 12px;
  color: #a0a5b8;
}

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 10px;
}

.pill-success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.pill-warning {
  background: #fffbe6;
  color: #faad14;
  border: 1px solid #ffe58f;
}

.text-disabled {
  color: #c0c4cc;
  font-size: 12px;
}
</style>
