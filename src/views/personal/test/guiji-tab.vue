<template>
  <div class="track-query-container">
    <!-- ==================== 1. 轨迹查询主列表视图 ==================== -->
    <div v-if="currentView === 'list'">
      <!-- 页头标题 -->
      <div class="page-header">
        <h2 class="title">规则切换轨迹查询</h2>
        <p class="subtitle">
          全量记录并展示客户规则切换的全周期轨迹，支持客户与内部工作人员双端查询，敏感信息脱敏展示
        </p>
      </div>

      <!-- 搜索筛选表单卡片 (已在输入框前加上 label 标签) -->
      <el-card class="box-card search-card" shadow="never">
        <el-form :inline="true" :model="queryForm" size="small" class="custom-search-form" label-width="100px">
          <el-form-item label="客户号：">
            <el-input v-model="queryForm.customerNo" placeholder="请输入客户号" style="width: 140px;" clearable />
          </el-form-item>

          <el-form-item label="姓名：">
            <el-input v-model="queryForm.name" placeholder="请输入姓名" style="width: 120px;" clearable />
          </el-form-item>

          <el-form-item label="证件类型：">
            <el-select v-model="queryForm.id_type" placeholder="请选择证件类型" style="width: 150px;" clearable>
              <el-option label="居民身份证" value="居民身份证" />
              <el-option label="中国护照" value="中国护照" />
            </el-select>
          </el-form-item>

          <el-form-item label="证件号码：">
            <el-input v-model="queryForm.idCard" placeholder="请输入证件号码" style="width: 160px;" clearable />
          </el-form-item>

          <el-form-item label="服务归属机构：">
            <el-select v-model="queryForm.org" placeholder="请选择服务归属机构" style="width: 160px;" clearable>
              <el-option label="天津分公司" value="天津分公司" />
              <el-option label="北京分公司" value="北京分公司" />
              <el-option label="江苏分公司" value="江苏分公司" />
              <el-option label="上海分公司" value="上海分公司" />
            </el-select>
          </el-form-item>

          <el-form-item label="切换状态：">
            <el-select v-model="queryForm.status" placeholder="请选择切换状态" style="width: 130px;" clearable>
              <el-option label="已切换" value="已切换" />
              <el-option label="未切换" value="未切换" />
            </el-select>
          </el-form-item>

          <el-form-item label="切换时间：">
            <el-date-picker
                v-model="queryForm.dateRange"
                type="daterange"
                range-separator="~"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 240px;"
                value-format="yyyy-MM-dd"
            />
          </el-form-item>

          <el-form-item label-width="0px">
            <el-button type="primary" class="btn-space" @click="handleSearch">查询</el-button>
            <el-button class="btn-space" @click="handleReset">重置</el-button>
            <el-button class="btn-space" @click="handleExport">导出</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 切换轨迹列表卡片 -->
      <el-card class="box-card table-card" shadow="never">
        <div class="table-header-title">切换轨迹列表</div>

        <el-table
            v-loading="loading"
            :data="tableData"
            style="width: 100%"
            size="medium"
            :header-cell-style="{ background: '#fafafa', color: '#333', fontWeight: 'bold' }"
        >
          <el-table-column prop="customer" label="客户" min-width="180" show-overflow-tooltip />
          <el-table-column prop="id_type" label="证件类型" min-width="120" />
          <el-table-column prop="idCard" label="证件号" min-width="170" />
          <el-table-column prop="org" label="服务归属机构" min-width="130" />
          <el-table-column prop="switchTime" label="实际切换时间" min-width="160" align="center" />
          <el-table-column prop="oldInfo" label="老系统积分 / 等级" min-width="160" align="center" />
          <el-table-column prop="newInfo" label="新系统积分 / 等级" min-width="170" align="center" />
          <el-table-column label="状态" min-width="100" align="center">
            <template slot-scope="scope">
              <span class="status-tag" :class="scope.row.status === '已切换' ? 'tag-switched' : 'tag-unswitched'">
                {{ scope.row.status }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="goTrackDetail(scope.row)">查看轨迹</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页与底部说明 -->
        <div class="pagination-footer">
          <div class="left-pagination">
            <el-pagination
                background
                layout="total, prev, pager, next"
                :total="total"
                :page-size="pageSize"
                :current-page="currentPage"
                @current-change="handleCurrentChange"
            />
          </div>
          <div class="right-desensitize-tip">客户敏感信息脱敏展示</div>
        </div>
      </el-card>
    </div>

    <!-- ==================== 2. 切换轨迹详情视图 ==================== -->
    <div v-else-if="currentView === 'track'">
      <!-- 页头标题 -->
      <div class="page-header">
        <h2 class="title">切换轨迹详情</h2>
        <p class="subtitle">
          客户规则切换的全周期轨迹：客户信息、切换前后数据（积分、等级与等级权益）与切换时积分计算过程（敏感信息脱敏）
        </p>
      </div>

      <!-- 提示 Alert Banner -->
      <el-alert
          class="custom-alert-banner"
          type="error"
          :closable="false"
          show-icon
      >
        <template slot="title">
          <span class="alert-title">提示</span>
          <span class="alert-content">
            本页积分、等级、等级权益与切换时积分计算过程均为「实际切换时间」时点的核算快照，反映的是切换时刻的计算结果，不随客户后续业绩、业务状态与有效期变动而更新，不能作为客户当前数据参考；如需查看客户当前数据，请前往「客户积分管理」查询。
          </span>
        </template>
      </el-alert>

      <div v-loading="detailLoading">
        <!-- 模块一：客户基本信息 -->
        <el-card class="box-card section-card" shadow="never">
          <div class="card-title-bar">
            <span class="title-text">客户基本信息</span>
            <span class="sub-text">敏感信息脱敏展示</span>
          </div>
          <el-descriptions :column="3" class="custom-descriptions">
            <el-descriptions-item label="客户号"><span class="val-bold">{{ custInfo.custId || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="客户姓名"><span class="val-bold">{{ custInfo.custName || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="证件类型"><span class="val-bold">{{ custInfo.idType || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="证件号码"><span class="val-bold">{{ custInfo.idNo || custInfo.idCard || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="手机号码"><span class="val-bold">{{ custInfo.phone || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="服务归属机构"><span class="val-bold">{{ custInfo.orgName || '—' }}</span></el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 模块二：切换核心信息 -->
        <el-card class="box-card section-card" shadow="never">
          <div class="card-title-bar">
            <span class="title-text">切换核心信息</span>
          </div>
          <el-descriptions :column="3" class="custom-descriptions">
            <el-descriptions-item label="申请编号"><span class="val-bold">{{ applyInfo.applyNo || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="客户号"><span class="val-bold">{{ applyInfo.custId || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="切换状态"><span class="val-bold">{{ applyInfo.status || '—' }}</span></el-descriptions-item>
            <el-descriptions-item label="实际切换时间"><span class="val-bold">{{ applyInfo.executeTime || '—' }}</span></el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 模块三：切换前后数据 -->
        <el-card class="box-card section-card" shadow="never">
          <div class="blue-line-title">切换前后数据</div>

          <div class="split-comparison-container">
            <!-- 左边：老系统数据 -->
            <div class="system-box left-box">
              <div class="system-header">
                <span class="sys-name">老系统数据</span>
                <span class="sys-tag gray-tag">V爱客户管理规则</span>
              </div>
              <div class="system-content">
                <div class="metric-group">
                  <div class="metric-item">
                    <div class="m-label">整体积分</div>
                    <div class="m-val main-num">{{ formatNumber(oldData.point) }}</div>
                  </div>
                  <div class="metric-item">
                    <div class="m-label">等级</div>
                    <div class="m-val"><span class="level-pill gold-pill">{{ formatGrade(oldData.grade) }}</span></div>
                  </div>
                </div>

                <div class="sub-table-header">
                  等级权益 <span class="sub-tip">老规则下当前享有权益及已使用情况</span>
                </div>
                <el-table :data="oldRightsData" border size="mini" class="inner-table">
                  <el-table-column prop="rights" label="服务权益" />
                  <el-table-column prop="project" label="服务项目" />
                  <el-table-column prop="provider" label="服务商" />
                  <el-table-column prop="available" label="可使用次数" width="90" align="center" />
                  <el-table-column prop="used" label="已使用" width="70" align="center" />
                </el-table>
              </div>
            </div>

            <!-- 中间转换流转图标 -->
            <div class="center-flow-icon">
              <div class="icon-circle"><i class="el-icon-right"></i></div>
              <div class="flow-text">老规则→新规则<br>切换后不可逆</div>
            </div>

            <!-- 右边：新系统数据 -->
            <div class="system-box right-box">
              <div class="system-header blue-bg">
                <span class="sys-name">新系统数据</span>
                <span class="sys-tag blue-tag">新积分等级体系</span>
              </div>
              <div class="system-content">
                <div class="metric-group">
                  <div class="metric-item">
                    <div class="m-label">整体积分</div>
                    <div class="m-val main-num blue-text">{{ formatNumber(newData.point) }}</div>
                  </div>
                  <div class="metric-item">
                    <div class="m-label">等级</div>
                    <div class="m-val"><span class="level-pill gold-pill">{{ formatGrade(newData.grade, true) }}</span></div>
                  </div>
                </div>

                <div class="sub-table-header">
                  等级权益 <span class="sub-tip">新规则下切换后享有权益</span>
                </div>
                <el-table :data="newRightsData" border size="mini" class="inner-table">
                  <el-table-column prop="rights" label="服务权益" />
                  <el-table-column prop="project" label="服务项目" />
                  <el-table-column prop="provider" label="服务商" />
                  <el-table-column prop="times" label="权益次数" width="90" align="center" />
                </el-table>

                <div class="sub-table-header" style="margin-top: 20px;">
                  切换时积分计算过程 <span class="sub-tip">按保单拆分保费积分与忠诚积分，实际积分为切换跑批核算结果</span>
                </div>
                <el-table :data="calcProcessData" border size="mini" class="inner-table">
                  <el-table-column prop="policyNo" label="保单号" width="120" />
                  <el-table-column prop="premiumPoint" label="保费积分" align="right" />
                  <el-table-column prop="loyaltyPoint" label="忠诚积分" align="right" />
                  <el-table-column prop="pensionPoint" label="养老协同积分" align="right" />
                  <el-table-column prop="actualPoint" label="切换时实际积分" align="right" />
                </el-table>

                <div class="points-summary-box">
                  <span>积分汇总 <strong class="blue-text" style="font-size: 15px;">{{ formatNumber(pointCalcTotal.total) }}</strong></span>
                </div>
                <div class="calc-formula-text">
                  切换实际积分合计 ({{ formatNumber(pointCalcTotal.total) }}) = 保费积分 {{ formatNumber(pointCalcTotal.premium) }} + 忠诚积分 {{ formatNumber(pointCalcTotal.loyalty) }} + 养老协同积分 {{ formatNumber(pointCalcTotal.pension) }} = 新系统整体积分。
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 底部关闭按钮条 -->
      <div class="bottom-action-bar">
        <el-button size="medium" @click="currentView = 'list'">关 闭</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { getSwitchRecordPageApi, getSwitchRecordDetailApi } from '@/api/test';

export default {
  name: 'RuleSwitchTrack',
  data() {
    return {
      currentView: 'list',
      loading: false,
      detailLoading: false,
      queryForm: {
        customerNo: '',
        name: '',
        id_type: '',
        idCard: '',
        org: '',
        status: '',
        dateRange: ['2026-08-01', '2026-08-23']
      },
      tableData: [],
      total: 0,
      pageSize: 10,
      currentPage: 1,

      // 详情组件数据绑定
      custInfo: {},
      applyInfo: {},
      oldData: {},
      newData: {},
      oldRightsData: [],
      newRightsData: [],
      calcProcessData: [],
      pointCalcTotal: {}
    };
  },
  mounted() {
    this.fetchList();
  },
  methods: {
    // 1. 获取列表数据
    async fetchList() {
      this.loading = true;
      try {
        const params = {
          customerNo: this.queryForm.customerNo,
          name: this.queryForm.name,
          id_type: this.queryForm.id_type,
          idCard: this.queryForm.idCard,
          org: this.queryForm.org,
          status: this.queryForm.status,
          startDate: this.queryForm.dateRange && this.queryForm.dateRange[0] ? this.queryForm.dateRange[0] : '',
          endDate: this.queryForm.dateRange && this.queryForm.dateRange[1] ? this.queryForm.dateRange[1] : '',
          pageNum: this.currentPage,
          pageSize: this.pageSize
        };
        const res = await getSwitchRecordPageApi(params);
        if (res) {
          const data = res.data || res.body?.data || {};
          const list = data.list || data.records || [];
          this.total = data.total || 0;

          this.tableData = list.map(item => ({
            apply_no: item.apply_no || item.apply?.apply_no,
            customer: `${item.cust_name || ''} (${item.cust_id || ''})`,
            id_type: item.id_type || '居民身份证',
            idCard: item.id_no || item.idCard || '—',
            org: item.org_name || item.org || '—',
            switchTime: item.effective_date || item.switchTime || '—',
            oldInfo: item.oldInfo || `${this.formatNumber(item.old_point)} / ${this.formatGrade(item.oldGrade)}`,
            newInfo: item.newInfo || `${this.formatNumber(item.new_point)} / ${this.formatGrade(item.newGrade, true)}`,
            status: item.switch_status === 'SWITCHED' || item.switch_status === '已切换' ? '已切换' : '未切换',
            rawItem: item
          }));
        }
      } catch (error) {
        console.error('获取切换轨迹列表失败:', error);
      } finally {
        this.loading = false;
      }
    },

    // 2. 获取详情数据（使用恢复的 getSwitchRecordDetailApi，内部对应 GET http://localhost:8002/switch/record/detail/{applyNo}）
    async fetchDetail(applyNo) {
      this.detailLoading = true;
      try {
        const res = await getSwitchRecordDetailApi(applyNo);
        if (res) {
          const data = res.data || res.body?.data || {};

          this.applyInfo = data.apply || {};
          this.custInfo = data.custInfo || {};
          this.oldData = data.oldData || {};
          this.newData = data.newData || {};

          // 解析旧权益发放记录列表 (oldBenefits)
          if (Array.isArray(data.oldBenefits)) {
            this.oldRightsData = data.oldBenefits.map(item => ({
              rights: item.benefit_name || '—',
              project: this.parseItemsJson(item.items_json),
              provider: item.supplier || '—',
              available: item.grant_count !== null && item.grant_count !== undefined ? `${item.grant_count} 次` : '不限次',
              used: item.used_count !== undefined && item.used_count !== null ? String(item.used_count) : '0'
            }));
          } else {
            this.oldRightsData = [];
          }

          // 解析新权益列表 (newBenefits)
          if (Array.isArray(data.newBenefits)) {
            this.newRightsData = data.newBenefits.map(item => ({
              rights: item.benefit_name || '—',
              project: this.parseItemsJson(item.items_json),
              provider: item.supplier || '—',
              times: item.freq_unlimited === 1 ? '不限次' : (item.freq_count ? `${item.freq_count} 次` : '—')
            }));
          } else {
            this.newRightsData = [];
          }

          // 解析按保单积分拆分列表 (pointCalc)
          if (Array.isArray(data.pointCalc)) {
            this.calcProcessData = data.pointCalc.map(item => ({
              policyNo: item.policy_no || '—',
              premiumPoint: this.formatNumber(item.premium),
              loyaltyPoint: this.formatNumber(item.loyalty),
              pensionPoint: this.formatNumber(item.pension),
              actualPoint: this.formatNumber(item.total)
            }));
          } else {
            this.calcProcessData = [];
          }

          this.pointCalcTotal = data.pointCalcTotal || {};
        }
      } catch (error) {
        console.error('获取切换轨迹详情失败:', error);
      } finally {
        this.detailLoading = false;
      }
    },

    // 工具函数：解析 JSON 字符串格式的 items_json
    parseItemsJson(jsonStr) {
      if (!jsonStr) return '—';
      try {
        const arr = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        if (Array.isArray(arr) && arr.length > 0) {
          return arr.map(i => i.name).join('、');
        }
      } catch (e) {
        console.error('JSON解析异常', e);
      }
      return '—';
    },

    // 工具函数：格式化数字（千分位/去除多余小数）
    formatNumber(val) {
      if (val === null || val === undefined || val === '' || val === '—') return '—';
      const num = Number(val);
      if (isNaN(num)) return val;
      return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
    },

    // 工具函数：等级转换
    formatGrade(grade, isNew = false) {
      if (!grade) return '—';
      const gradeMap = {
        'YIXING': '一星',
        'ERXING': '二星',
        'SANXING': '三星',
        'SIXING': '四星',
        'WUXING': '五星'
      };
      const name = gradeMap[grade] || grade;
      return isNew ? `${name} (新V)` : name;
    },

    handleSearch() {
      this.currentPage = 1;
      this.fetchList();
    },

    handleReset() {
      this.queryForm = {
        customerNo: '',
        name: '',
        id_type: '',
        idCard: '',
        org: '',
        status: '',
        dateRange: []
      };
      this.handleSearch();
    },

    handleExport() {
      this.$message.success('已导出当前条件数据');
    },

    handleCurrentChange(page) {
      this.currentPage = page;
      this.fetchList();
    },

    goTrackDetail(row) {
      this.currentView = 'track';
      // 正确提取 applyNo 参数，防止将整个 row 对象拼进 URL
      const applyNo = row.apply_no || row.rawItem?.apply?.applyNo || row.rawItem?.apply_no || 'SW202609010001';
      this.fetchDetail(applyNo);
    }
  }
};
</script>

<style scoped>
.track-query-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  box-sizing: border-box;
}

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

.box-card {
  border: none;
  border-radius: 4px;
  background: #ffffff;
}

.search-card {
  margin-bottom: 16px;
}
.search-card ::v-deep .el-card__body {
  padding: 16px 20px 4px 20px;
}
.custom-search-form .el-form-item {
  margin-bottom: 12px;
  margin-right: 8px;
}
.custom-search-form ::v-deep .el-form-item__label {
  font-weight: normal;
  color: #606266;
  padding-right: 4px;
}
.btn-space {
  margin-left: 4px;
}

.table-card {
  margin-bottom: 16px;
}
.table-card ::v-deep .el-card__body {
  padding: 16px 20px;
}
.table-header-title {
  font-size: 15px;
  font-weight: bold;
  color: #1f2d3d;
  margin-bottom: 16px;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 12px;
}
.tag-switched {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
.tag-unswitched {
  background-color: #f5f5f5;
  color: #8c8c8c;
  border: 1px solid #d9d9d9;
}

.pagination-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.right-desensitize-tip {
  font-size: 12px;
  color: #a0a5b8;
}

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
  line-height: 1.5;
}

.section-card {
  margin-bottom: 16px;
}
.section-card ::v-deep .el-card__body {
  padding: 16px 20px;
}
.card-title-bar {
  font-size: 14px;
  font-weight: bold;
  color: #1f2d3d;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.card-title-bar .sub-text {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  margin-left: 8px;
}

.val-bold {
  font-weight: bold;
  color: #303133;
}
.custom-descriptions ::v-deep .el-descriptions-item__label {
  color: #8c92a4;
}

.blue-line-title {
  font-size: 14px;
  font-weight: bold;
  color: #2b58f0;
  border-left: 3px solid #2b58f0;
  padding-left: 8px;
  margin-bottom: 16px;
}

.split-comparison-container {
  display: flex;
  align-items: stretch;
  gap: 16px;
}
.system-box {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
}
.system-header {
  background-color: #fafafa;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
}
.system-header.blue-bg {
  background-color: #eef3fe;
}
.sys-name {
  font-size: 13px;
  font-weight: bold;
  color: #1f2d3d;
}
.sys-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.gray-tag {
  background-color: #f4f4f5;
  color: #909399;
}
.blue-tag {
  background-color: #ffffff;
  color: #2b58f0;
  border: 1px solid #c6d7fe;
}

.system-content {
  padding: 16px;
}

.metric-group {
  display: flex;
  gap: 40px;
  margin-bottom: 16px;
}
.m-label {
  font-size: 12px;
  color: #8c92a4;
  margin-bottom: 4px;
}
.m-val.main-num {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}
.m-val .blue-text {
  color: #2b58f0;
}
.level-pill {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  display: inline-block;
}
.gold-pill {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

.sub-table-header {
  font-size: 12px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}
.sub-table-header .sub-tip {
  font-weight: normal;
  color: #909399;
  margin-left: 6px;
}
.inner-table {
  margin-bottom: 8px;
}

.center-flow-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 90px;
  text-align: center;
}
.icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #2b58f0;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 8px;
}
.flow-text {
  font-size: 11px;
  color: #8c92a4;
  line-height: 1.4;
}

.points-summary-box {
  text-align: right;
  font-size: 13px;
  padding: 8px 12px;
  background-color: #eef3fe;
  border-radius: 2px;
  margin-top: 4px;
}
.calc-formula-text {
  font-size: 11px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.4;
}

.bottom-action-bar {
  background-color: #ffffff;
  padding: 12px 20px;
  border-radius: 4px;
  display: flex;
  justify-content: flex-start;
}
</style>