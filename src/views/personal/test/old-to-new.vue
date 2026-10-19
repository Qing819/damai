<template>
  <div class="old-to-new-container">
    <!-- ==================== 1. 主列表视图 ==================== -->
    <div v-if="currentView === 'list'">
      <!-- 页头信息 -->
      <div class="page-header">
        <h2 class="title">老切新申请</h2>
        <p class="subtitle">
          收集老客户转新规则申请，支持单条录入与批量导入；设定切换生效日期后，到生效当天系统自动跑批重新计算，客户自生效日起看到新积分
        </p>
      </div>

      <!-- 提示 Banner -->
      <el-alert
          class="custom-banner"
          type="info"
          :closable="false"
          show-icon
      >
        <template slot="title">
          <span class="banner-title">切换生效规则</span>
          <span class="banner-desc">切换生效日期即客户看到新积分的日期，可选次日及以后；申请提交后无需人工切换，到生效当天系统自动跑批重新计算并生效。生效后规则类型锁定、不可逆。</span>
        </template>
      </el-alert>

      <!-- 操作按钮栏 -->
      <el-card class="box-card action-card" shadow="never">
        <div class="toolbar-box">
          <div class="btn-group">
            <el-button type="primary" icon="el-icon-plus" size="small" class="primary-btn" @click="openSingleAdd">单条申请</el-button>
            <el-button size="small" icon="el-icon-download" @click="handleDownloadTemplate">模板下载</el-button>
            <el-button size="small" icon="el-icon-upload2" @click="importDialogVisible = true">批量导入</el-button>
            <el-button size="small" icon="el-icon-share" @click="handleExport">申请数据导出</el-button>
            <el-button size="small" @click="openBatchEdit">批量修改生效日期</el-button>
            <el-button size="small" @click="openBatchRemove">批量移除</el-button>
          </div>
          <span class="toolbar-tips">切换生效日期可选次日及以后；到生效当天系统自动跑批重新计算</span>
        </div>
      </el-card>

      <!-- 切换申请列表 -->
      <el-card class="box-card main-table-card" shadow="never">
        <div class="table-title-bar">
          <h3>切换申请列表</h3>
        </div>

        <!-- 紧凑精致的高级筛选区 -->
        <div class="search-form-wrapper">
          <el-form
              :inline="true"
              :model="queryForm"
              size="small"
              class="compact-search-form"
              label-position="right"
          >
            <el-form-item label="证件类型：">
              <el-select v-model="queryForm.idType" placeholder="请选择证件类型" clearable class="input-normal">
                <el-option label="居民身份证" value="IDCARD" />
                <el-option label="中国护照" value="PASSPORT" />
                <el-option label="港澳居民来往内地通行证" value="HKMO_PASS" />
              </el-select>
            </el-form-item>

            <el-form-item label="证件号码：">
              <el-input v-model="queryForm.idCard" placeholder="请输入证件号码" clearable class="input-normal" />
            </el-form-item>

            <el-form-item label="服务归属机构：">
              <el-select v-model="queryForm.org" placeholder="请选择服务归属机构" clearable class="input-normal">
                <el-option label="天津分公司" value="天津分公司" />
                <el-option label="北京分公司" value="北京分公司" />
                <el-option label="江苏分公司" value="江苏分公司" />
                <el-option label="上海分公司" value="上海分公司" />
              </el-select>
            </el-form-item>

            <el-form-item label="切换状态：">
              <el-select v-model="queryForm.status" placeholder="请选择切换状态" clearable class="input-normal">
                <el-option label="待生效" value="PENDING" />
                <el-option label="已生效" value="SWITCHED" />
                <el-option label="已移除" value="REMOVED" />
              </el-select>
            </el-form-item>

            <el-form-item label="申请时间：">
              <el-date-picker
                  v-model="queryForm.applyDate"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  class="input-date-range"
              />
            </el-form-item>

            <el-form-item label="切换生效日期：">
              <el-date-picker
                  v-model="queryForm.effectDate"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  class="input-date-range"
              />
            </el-form-item>

            <!-- 按钮紧跟在表单末尾 -->
            <el-form-item class="form-btn-item">
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">查 询</el-button>
              <el-button icon="el-icon-refresh" @click="handleReset">重 置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据表格 -->
        <el-table
            v-loading="loading"
            :data="tableData"
            style="width: 100%"
            size="medium"
            row-key="id"
            @selection-change="handleSelectionChange"
            :header-cell-style="{ background: '#f8f9fc', color: '#303133', fontWeight: '600' }"
        >
          <el-table-column type="selection" width="55" align="center" :selectable="selectableRows" />
          <el-table-column prop="applyNo" label="申请单号" min-width="140" />
          <el-table-column prop="custName" label="客户" min-width="180" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.custName }} <span v-if="scope.row.custId">({{ scope.row.custId }})</span>
            </template>
          </el-table-column>
          <el-table-column prop="idType" label="证件类型" min-width="110" />
          <el-table-column prop="idNo" label="证件号" min-width="160" />
          <el-table-column prop="orgName" label="服务归属机构" min-width="120" />
          <el-table-column prop="applyTime" label="申请时间" min-width="150" align="center" />
          <el-table-column prop="effectiveDate" label="切换生效日期" min-width="120" align="center" />
          <el-table-column label="切换状态" min-width="100" align="center">
            <template slot-scope="scope">
              <span class="status-tag" :class="getStatusClass(scope.row.status)">
                {{ formatStatus(scope.row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button v-if="scope.row.status === 'PENDING'" type="text" size="small" @click="goDetail(scope.row)">查看</el-button>
              <el-button v-else type="text" size="small" @click="goTrackDetail(scope.row)">查看轨迹</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页与底部提示 -->
        <div class="table-footer">
          <el-pagination
              background
              layout="total, prev, pager, next, sizes"
              :total="total"
              :page-size="pageSize"
              :current-page="currentPage"
              :page-sizes="[10, 20, 50]"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
          />
          <div class="bottom-tips">到期系统自动跑批重新计算，客户自生效日起看到新积分；生效后规则类型锁定、不可逆</div>
        </div>
      </el-card>
    </div>

    <!-- ==================== 2. 切换申请详情视图 ==================== -->
    <div v-else-if="currentView === 'detail'">
      <div class="page-header flex-between">
        <h2 class="title">切换申请详情</h2>
        <el-button size="medium" icon="el-icon-back" @click="currentView = 'list'">返回列表</el-button>
      </div>

      <el-card class="box-card" shadow="never" v-loading="detailLoading">
        <div slot="header" class="card-header">
          <span>基础申请信息</span>
          <span class="status-tag" :class="getStatusClass(detailData.status)">
            {{ formatStatus(detailData.status) }}
          </span>
        </div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="申请单号">{{ detailData.applyNo }}</el-descriptions-item>
          <el-descriptions-item label="客户编号">{{ detailData.custId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ detailData.custName }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ detailData.idType }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ detailData.idNo }}</el-descriptions-item>
          <el-descriptions-item label="服务归属机构">{{ detailData.orgName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="切换生效日期">{{ detailData.effectiveDate }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ detailData.operator }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ detailData.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="切换执行时间" v-if="detailData.executeTime">{{ detailData.executeTime }}</el-descriptions-item>
          <el-descriptions-item label="移除时间" v-if="detailData.removeTime">{{ detailData.removeTime }}</el-descriptions-item>
        </el-descriptions>

        <!-- 快照对照信息（已生效时存在） -->
        <div v-if="detailData.snapshot" style="margin-top: 24px;">
          <h4 style="margin-bottom: 12px; color: #303133;">新老规则切换快照对照</h4>
          <el-table :data="snapshotTable" border size="small">
            <el-table-column prop="type" label="阶段" width="120" align="center" />
            <el-table-column prop="grade" label="等级" align="center" />
            <el-table-column prop="point" label="积分 (VIP + 忠诚度)" align="center" />
          </el-table>
        </div>
        </el-card>
    </div>

    <!-- ==================== 3. 弹窗定义区域 ==================== -->

    <!-- 单条申请弹窗 -->
    <el-dialog title="新增切换申请" :visible.sync="addDialogVisible" width="500px" @closed="resetAddForm">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="110px" size="small">
        <el-form-item label="客户姓名：" prop="custName">
          <el-input v-model="addForm.custName" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="证件类型：" prop="idType">
          <el-select v-model="addForm.idType" placeholder="请选择证件类型" style="width: 100%;">
            <el-option label="居民身份证" value="IDCARD" />
            <el-option label="中国护照" value="PASSPORT" />
            <el-option label="港澳居民来往内地通行证" value="HKMO_PASS" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件号码：" prop="idNo">
          <el-input v-model="addForm.idNo" placeholder="请输入证件号码" />
        </el-form-item>
        <el-form-item label="服务归属机构：" prop="orgName">
          <el-select v-model="addForm.orgName" placeholder="请选择服务归属机构" style="width: 100%;" clearable>
            <el-option label="天津分公司" value="天津分公司" />
            <el-option label="北京分公司" value="北京分公司" />
            <el-option label="江苏分公司" value="江苏分公司" />
            <el-option label="上海分公司" value="上海分公司" />
          </el-select>
        </el-form-item>
        <el-form-item label="切换生效日期：" prop="effectiveDate">
          <el-date-picker
              v-model="addForm.effectiveDate"
              type="date"
              placeholder="选择生效日期（≥次日）"
              value-format="yyyy-MM-dd"
              :picker-options="pickerOptions"
              style="width: 100%;"
          />
        </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" size="small" :loading="addLoading" @click="submitSingleAdd">确 定</el-button>
        </div>
    </el-dialog>

    <!-- 批量导入 CSV 弹窗 -->
    <el-dialog title="批量导入 CSV 申请" :visible.sync="importDialogVisible" width="500px" @closed="resetImportForm">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px;">
        <template slot="title">
          <div style="font-size: 12px; line-height: 1.6;">
            1. CSV 格式要求：<b>客户姓名,证件类型,证件号,服务归属机构</b>（首行表头自动跳过）；<br>
            2. 导入数据生效日期统一默认为<b>次日 ({{ tomorrowDate }})</b>。
          </div>
        </template>
      </el-alert>
      <el-upload
          drag
          action=""
          accept=".csv"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :file-list="fileList"
          :limit="1"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将 CSV 文件拖到此处，或<em>点击上传</em></div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="importDialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="importLoading" :disabled="!selectedFile" @click="submitImport">确 认 导 入</el-button>
      </div>
    </el-dialog>

    <!-- 批量修改生效日期弹窗 -->
    <el-dialog title="批量修改切换生效日期" :visible.sync="batchEditVisible" width="450px">
      <el-form label-width="120px" size="small">
        <el-form-item label="已选择记录：">
          <span><b>{{ selectedRows.length }}</b> 条待生效记录</span>
        </el-form-item>
        <el-form-item label="新切换生效日：" required>
          <el-date-picker
              v-model="batchEffectiveDate"
              type="date"
              placeholder="请选择新的生效日期"
              value-format="yyyy-MM-dd"
              :picker-options="pickerOptions"
              style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="batchEditVisible = false">取 消</el-button>
        <el-button type="primary" size="small" :loading="batchEditLoading" @click="submitBatchEdit">确 认 修改</el-button>
      </div>
      </el-dialog>
  </div>
</template>

<script>
import {
  switchApplyApi,
  importCsvApi,
  switchApplyExportApi,
  preUpdateEffectApi,
  switchApplyBatchRemoveApi,
  getSwitchApplyPageApi,
  switchApplyDetailApi,
} from '@/api/test';

export default {
  name: 'OldToNewApply',
  data() {
    return {
      currentView: 'list',
      loading: false,
      tableData: [],
      total: 0,
      pageSize: 10,
      currentPage: 1,
      selectedRows: [],

      // 4.17.15 筛选条件
      queryForm: {
        idType: '',
        idCard: '',
        org: '',
        status: '',
        applyDate: [],
        effectDate: []
      },

      // 生效日期校验约束（≥次日）
      pickerOptions: {
        disabledDate(time) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return time.getTime() < tomorrow.getTime();
        }
      },

      // 4.17.10 单条新增
      addDialogVisible: false,
      addLoading: false,
      addForm: {
        custName: '',
        idType: 'IDCARD',
        idNo: '',
        orgName: '',
        effectiveDate: ''
      },
      addRules: {
        custName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
        idType: [{ required: true, message: '请选择证件类型', trigger: 'change' }],
        idNo: [{ required: true, message: '请输入证件号码', trigger: 'blur' }],
        effectiveDate: [{ required: true, message: '请选择切换生效日期', trigger: 'change' }]
      },

      // 4.17.11 批量导入 CSV
      importDialogVisible: false,
      importLoading: false,
      fileList: [],
      selectedFile: null,

      // 4.17.13 批量修改生效日
      batchEditVisible: false,
      batchEditLoading: false,
      batchEffectiveDate: '',

      // 4.17.16 详情数据
      detailLoading: false,
      detailData: {}
    };
  },
  computed: {
    tomorrowDate() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    snapshotTable() {
      if (!this.detailData.snapshot) return [];
      const snap = this.detailData.snapshot;
      return [
        { type: '切换前', grade: snap.preGrade || '-', point: snap.prePoint || '-' },
        { type: '切换后', grade: snap.postGrade || '-', point: snap.postPoint || '-' }
      ];
    }
  },
  mounted() {
    this.fetchPageData();
  },
  methods: {
    // 4.17.15 获取分页列表
    async fetchPageData() {
      this.loading = true;
      try {
        const params = {
          idType: this.queryForm.idType,
          idNo: this.queryForm.idCard,
          orgName: this.queryForm.org,
          status: this.queryForm.status,
          applyDateFrom: this.queryForm.applyDate && this.queryForm.applyDate[0] ? this.queryForm.applyDate[0] : '',
          applyDateTo: this.queryForm.applyDate && this.queryForm.applyDate[1] ? this.queryForm.applyDate[1] : '',
          effectDateFrom: this.queryForm.effectDate && this.queryForm.effectDate[0] ? this.queryForm.effectDate[0] : '',
          effectDateTo: this.queryForm.effectDate && this.queryForm.effectDate[1] ? this.queryForm.effectDate[1] : '',
          pageNum: this.currentPage,
          pageSize: this.pageSize
        };
        const res = await getSwitchApplyPageApi(params);
        if (res) {
          this.tableData = res.data.list || [];
          this.total = res.data.total || 0;
        } else {
          this.$message.error('获取列表失败');
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    handleSearch() {
      this.currentPage = 1;
      this.fetchPageData();
    },

    handleReset() {
      this.queryForm = { idType: '', idCard: '', org: '', status: '', applyDate: [], effectDate: [] };
      this.handleSearch();
    },

    handleSelectionChange(val) {
      this.selectedRows = val;
    },

    selectableRows(row) {
      return row.status === 'PENDING';
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchPageData();
    },

    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchPageData();
    },

    // 4.17.10 单条新增
    openSingleAdd() {
      this.addDialogVisible = true;
    },
    submitSingleAdd() {
      this.$refs.addFormRef.validate(async (valid) => {
        if (!valid) return;
        this.addLoading = true;
        try {
          const res = await switchApplyApi(this.addForm);
          if (res.header && res.header.statusCode === '000000') {
            this.$message.success('新增切换申请成功');
            this.addDialogVisible = false;
            this.fetchPageData();
          } else {
            this.$message.error(res.header ? res.header.message : '新增失败');
          }
        } catch (err) {
          console.error(err);
        } finally {
          this.addLoading = false;
        }
      });
    },
    resetAddForm() {
      this.$refs.addFormRef.resetFields();
    },

    // 4.17.11 批量导入 CSV
    handleFileChange(file, fileList) {
      if (!file.name.endsWith('.csv')) {
        this.$message.error('只支持上传 .csv 格式文件');
        this.fileList = [];
        this.selectedFile = null;
        return;
      }
      this.fileList = fileList.slice(-1);
      this.selectedFile = file.raw;
    },
    handleFileRemove() {
      this.fileList = [];
      this.selectedFile = null;
    },
    async submitImport() {
      if (!this.selectedFile) return;
      this.importLoading = true;
      try {
        const res = await importCsvApi(this.selectedFile);
        if (res.header && res.header.statusCode === '000000') {
          const data = res.body.data;
          this.$message.success(`导入成功！共 ${data.total} 条，成功 ${data.success} 条，失败 ${data.fail} 条`);
          this.importDialogVisible = false;
          this.fetchPageData();
        } else {
          this.$message.error(res.header ? res.header.message : '导入失败');
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.importLoading = false;
      }
    },
    resetImportForm() {
      this.fileList = [];
      this.selectedFile = null;
    },

    // 4.17.12 下载模板
    async handleDownloadTemplate() {
      try {
        const res = await switchApplyExportApi();
        const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '老切新申请导入模板.csv';
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (err) {
        this.$message.error('下载模板失败');
      }
    },

    // 4.17.13 批量修改生效日期
    openBatchEdit() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请先勾选待生效的申请记录');
        return;
      }
      this.batchEffectiveDate = '';
      this.batchEditVisible = true;
    },
    async submitBatchEdit() {
      if (!this.batchEffectiveDate) {
        this.$message.warning('请选择新的生效日期');
        return;
      }
      this.batchEditLoading = true;
      try {
        const ids = this.selectedRows.map(row => row.id || row.applyNo);
        const res = await preUpdateEffectApi({ ids, effectiveDate: this.batchEffectiveDate });
        if (res.header && res.header.statusCode === '000000') {
          this.$message.success(`成功更新 ${res.body.data} 条数据的生效日期`);
          this.batchEditVisible = false;
          this.fetchPageData();
        } else {
          this.$message.error(res.header ? res.header.message : '批量更新失败');
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.batchEditLoading = false;
      }
    },

    // 4.17.14 批量移除
    openBatchRemove() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请先勾选需要移除的记录（仅限待生效）');
        return;
      }
      this.$confirm(`确定要移除选中的 ${this.selectedRows.length} 条记录吗？`, '提示', {
        type: 'warning'
      }).then(async () => {
        const ids = this.selectedRows.map(row => row.id || row.applyNo);
        const res = await switchApplyBatchRemoveApi({ ids });
        if (res.header && res.header.statusCode === '000000') {
          this.$message.success(`成功移除 ${res.body.data} 条记录`);
          this.fetchPageData();
        } else {
          this.$message.error(res.header ? res.header.message : '批量移除失败');
        }
      }).catch(() => {});
    },

    // 4.17.16 查看详情与轨迹
    async goDetail(row) {
      this.currentView = 'detail';
      this.detailLoading = true;
      try {
        const res = await switchApplyDetailApi(row.applyNo);
        if (res) {
          this.detailData = res.data.apply || {};
        } else {
          this.$message.error('获取详情失败');
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.detailLoading = false;
      }
    },
    goTrackDetail(row) {
      this.goDetail(row);
    },

    // 4.17.17 申请列表导出
    async handleExport() {
      try {
        const params = {
          idType: this.queryForm.idType,
          idNo: this.queryForm.idCard,
          orgName: this.queryForm.org,
          status: this.queryForm.status,
          applyDateFrom: this.queryForm.applyDate && this.queryForm.applyDate[0] ? this.queryForm.applyDate[0] : '',
          applyDateTo: this.queryForm.applyDate && this.queryForm.applyDate[1] ? this.queryForm.applyDate[1] : '',
          effectDateFrom: this.queryForm.effectDate && this.queryForm.effectDate[0] ? this.queryForm.effectDate[0] : '',
          effectDateTo: this.queryForm.effectDate && this.queryForm.effectDate[1] ? this.queryForm.effectDate[1] : ''
        };
        const res = await switchApplyExportApi(params);
        const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `切换申请数据导出_${new Date().getTime()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (err) {
        this.$message.error('导出失败');
      }
    },

    // 辅助格式化函数
    formatStatus(status) {
      const map = { PENDING: '待生效', SWITCHED: '已生效', REMOVED: '已移除' };
      return map[status] || status;
    },
    getStatusClass(status) {
      if (status === 'PENDING') return 'tag-warning';
      if (status === 'SWITCHED') return 'tag-success';
      return 'tag-info';
    }
  }
};
</script>

<style scoped>
/* 容器及通用布局 */
.old-to-new-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 页头标题 */
.page-header {
  margin-bottom: 16px;
}
.page-header .title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 6px 0;
}
.page-header .subtitle {
  font-size: 13px;
  color: #8c92a4;
  margin: 0;
}

/* Banner */
.custom-banner {
  margin-bottom: 16px;
  border-radius: 6px;
  border: 1px solid #e8f3ff;
  background-color: #f4f8fe;
}
.banner-title {
  font-weight: 600;
  margin-right: 12px;
  color: #1677ff;
}
.banner-desc {
  font-size: 13px;
  color: #595959;
}

/* 卡片样式 */
.box-card {
  border: 1px solid #edf1f7;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03) !important;
  background: #ffffff;
}
.action-card {
  margin-bottom: 16px;
}
.action-card ::v-deep .el-card__body {
  padding: 14px 20px;
}
.toolbar-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toolbar-tips {
  font-size: 12px;
  color: #8c8c8c;
}

/* 表格卡片 */
.main-table-card ::v-deep .el-card__body {
  padding: 20px;
}
.table-title-bar h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
}

/* 精致筛选表单 */
.search-form-wrapper {
  background-color: #fafbfc;
  padding: 18px 20px 6px 20px;
  border-radius: 6px;
  border: 1px solid #f0f2f5;
  margin-bottom: 20px;
}

.compact-search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.compact-search-form ::v-deep .el-form-item {
  display: flex;
  align-items: center;
  margin-right: 24px !important;
  margin-bottom: 12px !important;
}

.compact-search-form ::v-deep .el-form-item__label {
  font-size: 13px;
  color: #434955;
  font-weight: 500;
  padding-right: 8px;
  line-height: 32px;
  white-space: nowrap;
}

.input-normal {
  width: 200px !important;
}

.input-date-range {
  width: 250px !important;
}

.form-btn-item ::v-deep .el-form-item__content {
  display: flex;
  gap: 8px;
  margin-left: 0 !important;
}

/* 状态标签样式 */
.status-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
}
.tag-warning {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}
.tag-success {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.tag-info {
  background-color: #f5f5f5;
  color: #8c8c8c;
  border: 1px solid #d9d9d9;
}

/* 表格底部 */
.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bottom-tips {
  font-size: 12px;
  color: #8c8c8c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>