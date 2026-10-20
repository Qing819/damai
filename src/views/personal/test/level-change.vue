<template>
  <div style="padding: 20px; background-color: #f5f7fa; min-height: 100vh;">
    <!-- 1. 顶部查询表单 -->
    <el-card shadow="never" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="queryForm" size="small" label-width="90px">
        <el-form-item label="客户号">
          <el-input v-model="queryForm.cust_id" placeholder="请输入客户号" style="width: 200px;" clearable />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="queryForm.cust_name" placeholder="请输入客户姓名" style="width: 200px;" clearable />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="queryForm.id_no" placeholder="请输入身份证号" style="width: 200px;" clearable />
        </el-form-item>
        <el-form-item label="服务机构">
          <el-select v-model="queryForm.org_name" placeholder="全部服务机构" style="width: 200px;" clearable>
            <el-option label="天津分公司" value="天津分公司" />
            <el-option label="北京分公司" value="北京分公司" />
            <el-option label="江苏分公司" value="江苏分公司" />
            <el-option label="上海分公司" value="上海分公司" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务渠道">
          <el-select v-model="queryForm.channel" placeholder="全部业务渠道" style="width: 200px;" clearable>
            <el-option label="个险" value="个险" />
            <el-option label="银保" value="银保" />
            <el-option label="经代" value="经代" />
          </el-select>
        </el-form-item>
        <el-form-item label="变化类型">
          <el-select v-model="queryForm.change_type" placeholder="全部变化类型" style="width: 200px;" clearable>
            <el-option label="升星" value="UPGRADE" />
            <el-option label="降星" value="DOWNGRADE" />
            <el-option label="失效" value="INVALID" />
            <el-option label="年度评定" value="ANNUAL" />
            <el-option label="规则切换" value="SWITCH" />
          </el-select>
        </el-form-item>
        <el-form-item label="变化时间">
          <el-date-picker
              v-model="queryForm.dateRange"
              type="daterange"
              range-separator="~"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px;"
              value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          <el-button icon="el-icon-download" plain @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 指标数据卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card shadow="never">
          <div style="font-size: 14px; color: #909399; margin-bottom: 8px;">本期升星</div>
          <div style="font-size: 28px; font-weight: bold; color: #67c23a;">+ {{ summaryData.upgradeCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div style="font-size: 14px; color: #909399; margin-bottom: 8px;">本期降星</div>
          <div style="font-size: 28px; font-weight: bold; color: #e6a23c;">- {{ summaryData.downgradeCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div style="font-size: 14px; color: #909399; margin-bottom: 8px;">本期失效</div>
          <div style="font-size: 28px; font-weight: bold; color: #f56c6c;">{{ summaryData.invalidCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div style="font-size: 14px; color: #909399; margin-bottom: 8px;">变化总数</div>
          <div style="font-size: 28px; font-weight: bold; color: #303133;">{{ summaryData.totalCount || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 3. 等级变化明细表格卡片 -->
    <el-card shadow="never">
      <div slot="header" style="font-size: 16px; font-weight: bold;">
        等级变化明细
      </div>

      <el-table v-loading="tableLoading" :data="tableData" border style="width: 100%;">
        <el-table-column prop="traceNo" label="变化记录号" min-width="150" align="center">
          <template slot-scope="scope">
            {{ scope.row.traceNo || scope.row.recordNo }}
          </template>
        </el-table-column>
        <el-table-column label="客户" min-width="170" align="center">
          <template slot-scope="scope">
            {{ scope.row.cust_name || '客户' }} ({{ scope.row.custId || scope.row.cust_id }})
          </template>
        </el-table-column>
        <el-table-column prop="id_no" label="身份证号" min-width="170" align="center">
          <template slot-scope="scope">
            {{ scope.row.idNo || scope.row.id_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="org_name" label="服务机构" min-width="110" align="center">
          <template slot-scope="scope">
            {{ scope.row.orgName || scope.row.org_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="业务渠道" min-width="90" align="center">
          <template slot-scope="scope">
            {{ scope.row.channel || '-' }}
          </template>
        </el-table-column>

        <!-- 变化类型 -->
        <el-table-column label="变化类型" min-width="110" align="center">
          <template slot-scope="scope">
            <el-tag :type="getChangeTagType(scope.row.changeType || scope.row.change_type)" size="small">
              {{ formatChangeType(scope.row.changeType || scope.row.change_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 变化前等级 -->
        <el-table-column label="变化前等级" min-width="120" align="center">
          <template slot-scope="scope">
            <el-tag type="info" size="small">
              {{ formatGradeCode(scope.row.gradeBefore || scope.row.grade_before) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 变化后等级 -->
        <el-table-column label="变化后等级" min-width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="isInvalidGrade(scope.row.gradeAfter || scope.row.grade_after) ? 'info' : 'warning'" size="small">
              {{ formatGradeCode(scope.row.gradeAfter || scope.row.grade_after) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="变化时积分" min-width="110" align="center">
          <template slot-scope="scope">
            {{ scope.row.changePoint != null ? scope.row.changePoint : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="变化原因" min-width="180" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.change_reason || formatChangeType(scope.row.changeType) || '年度评定' }}
          </template>
        </el-table-column>
        <el-table-column label="变化时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ scope.row.changeTime || scope.row.change_time }}
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="100" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleDetail(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页与底部提示 -->
      <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
        <el-pagination
            :current-page="pagination.pageNo"
            :page-sizes="[10, 20, 50]"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
        <span style="font-size: 12px; color: #909399;">每条变化记录可查看详情与等级变动说明</span>
      </div>
    </el-card>

    <!-- 4. 详情弹窗 -->
    <el-dialog title="等级变化详情" :visible.sync="dialogVisible" width="600px" v-loading="detailLoading">
      <div v-if="currentDetail">
        <!-- 基本信息描述列表 -->
        <div style="font-weight: bold; margin-bottom: 12px; color: #409EFF; border-left: 3px solid #409EFF; padding-left: 8px;">
          基本信息
        </div>
        <el-descriptions :column="2" size="small">
          <el-descriptions-item label="变化记录号">{{ currentDetail.traceNo || currentDetail.recordNo }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentDetail.cust_name || '客户' }} ({{ currentDetail.custId || currentDetail.cust_id }})</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ currentDetail.idNo || currentDetail.id_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务机构">{{ currentDetail.orgName || currentDetail.org_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="业务渠道">{{ currentDetail.channel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="变化类型">
            <el-tag :type="getChangeTagType(currentDetail.changeType || currentDetail.change_type)" size="mini">
              {{ formatChangeType(currentDetail.changeType || currentDetail.change_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="变化时积分">{{ currentDetail.changePoint || '-' }}</el-descriptions-item>
          <el-descriptions-item label="变化原因">{{ currentDetail.change_reason || formatChangeType(currentDetail.changeType) }}</el-descriptions-item>
          <el-descriptions-item label="变化时间">{{ currentDetail.changeTime || currentDetail.change_time }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentDetail.operator || '系统' }}</el-descriptions-item>
          <el-descriptions-item label="等级生效日期">{{ currentDetail.effective_date || currentDetail.changeTime }}</el-descriptions-item>
        </el-descriptions>

        <!-- 等级变化指示器 -->
        <div style="font-weight: bold; margin: 20px 0 12px 0; color: #409EFF; border-left: 3px solid #409EFF; padding-left: 8px;">
          等级变化
        </div>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
          <span style="margin-right: 15px; color: #606266;">变化前等级：
            <el-tag type="info" size="small">
              {{ formatGradeCode(currentDetail.gradeBefore || currentDetail.grade_before) }}
            </el-tag>
          </span>
          <i class="el-icon-right" style="font-weight: bold; margin-right: 15px; color: #909399;"></i>
          <span style="color: #606266;">变化后等级：
            <el-tag :type="isInvalidGrade(currentDetail.gradeAfter || currentDetail.grade_after) ? 'info' : 'warning'" size="small">
              {{ formatGradeCode(currentDetail.gradeAfter || currentDetail.grade_after) }}
            </el-tag>
          </span>
        </div>

        <!-- 变动说明 -->
        <div style="font-weight: bold; margin: 20px 0 8px 0; color: #409EFF; border-left: 3px solid #409EFF; padding-left: 8px;">
          变动说明
        </div>
        <div style="font-size: 13px; color: #606266; line-height: 1.6;">
          {{ currentDetail.note || `类型：${formatChangeType(currentDetail.changeType || currentDetail.change_type)}，等级从 ${formatGradeCode(currentDetail.gradeBefore || currentDetail.grade_before)} 调整至 ${formatGradeCode(currentDetail.gradeAfter || currentDetail.grade_after)}` }}
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getGradeTracePageApi,
  getGradeTraceSummaryApi,
  getGradeTraceDetailApi,
  exportGradeTraceApi
} from '@/api/test/index'

export default {
  name: 'LevelChangeDetail',
  data() {
    return {
      tableLoading: false,
      detailLoading: false,
      dialogVisible: false,
      currentDetail: null,

      // 变化类型字典映射 (规范 1.7)
      changeTypeMap: {
        UPGRADE: '升星',
        DOWNGRADE: '降星',
        INVALID: '失效',
        ANNUAL: '年度评定',
        SWITCH: '规则切换'
      },

      // 等级编码转换映射
      gradeCodeMap: {
        PUXING: '普星',
        SANXING: '三星',
        SIXING: '四星',
        WUXING: '五星',
        ZHUOYUE: '卓越',
        ZUNYAO: '尊耀'
      },

      queryForm: {
        cust_id: '',
        cust_name: '',
        id_no: '',
        org_name: '',
        channel: '',
        change_type: '',
        dateRange: []
      },

      pagination: {
        pageNo: 1,
        pageSize: 10,
        total: 0
      },

      summaryData: {
        upgradeCount: 0,
        downgradeCount: 0,
        invalidCount: 0,
        totalCount: 0
      },

      tableData: []
    }
  },
  created() {
    this.fetchData()
    this.fetchSummary()
  },
  methods: {
    // 转换变化类型展示
    formatChangeType(code) {
      if (!code) return '-'
      return this.changeTypeMap[code] || code
    },

    // 转换等级编码/名称展示
    formatGradeCode(code) {
      if (!code) return '-'
      if (this.gradeCodeMap[code]) {
        return `${this.gradeCodeMap[code]} (${code})`
      }
      return code
    },

    // 判断是否为失效状态
    isInvalidGrade(grade) {
      return grade === '失效' || grade === 'SHIXIAO' || grade === 'INVALID'
    },

    // 统一的数据解包辅助工具
    unpackData(res) {
      return res?.data || res?.body?.data || res
    },

    // 1. 获取轨迹分页数据
    async fetchData() {
      this.tableLoading = true
      try {
        const params = {
          pageNo: this.pagination.pageNo,
          pageSize: this.pagination.pageSize,
          custId: this.queryForm.cust_id,
          custName: this.queryForm.cust_name,
          idNo: this.queryForm.id_no,
          orgName: this.queryForm.org_name,
          channel: this.queryForm.channel,
          changeType: this.queryForm.change_type,
          startDate: this.queryForm.dateRange?.[0],
          endDate: this.queryForm.dateRange?.[1]
        }

        const res = await getGradeTracePageApi(params)
        const data = this.unpackData(res)

        if (Array.isArray(data)) {
          this.tableData = data
          this.pagination.total = data.length
        } else if (data?.list) {
          this.tableData = data.list
          this.pagination.total = data.total || 0
        } else {
          this.tableData = [data]
          this.pagination.total = 1
        }
      } catch (error) {
        console.error('获取等级变化轨迹失败:', error)
      } finally {
        this.tableLoading = false
      }
    },

    // 2. 获取统计数据
    async fetchSummary() {
      try {
        const res = await getGradeTraceSummaryApi()
        const data = this.unpackData(res)
        if (data && typeof data === 'object') {
          this.summaryData = {...this.summaryData, ...data}
        }
      } catch (error) {
        console.error('获取汇总数据失败:', error)
      }
    },

    // 3. 点击查看单条记录详情
    async handleDetail(row) {
      this.dialogVisible = true
      this.detailLoading = true
      const traceNo = row.traceNo || row.recordNo

      try {
        const res = await getGradeTraceDetailApi(traceNo)
        const detailData = this.unpackData(res)
        this.currentDetail = detailData || row
      } catch (error) {
        console.error('获取详情失败，降级使用行数据:', error)
        this.currentDetail = row
      } finally {
        this.detailLoading = false
      }
    },

    getChangeTagType(type) {
      if (type === 'UPGRADE' || type === '升星' || type === '升级') return 'success'
      if (type === 'DOWNGRADE' || type === '降星' || type === '降级') return 'warning'
      if (type === 'INVALID' || type === '失效') return 'danger'
      if (type === 'ANNUAL' || type === '年度评定') return 'primary'
      if (type === 'SWITCH' || type === '规则切换') return 'info'
      return 'info'
    },

    handleQuery() {
      this.pagination.pageNo = 1
      this.fetchData()
    },

    handleReset() {
      this.queryForm = {
        cust_id: '',
        cust_name: '',
        id_no: '',
        org_name: '',
        channel: '',
        change_type: '',
        dateRange: []
      }
      this.handleQuery()
    },

    async handleExport() {
      try {
        const params = {
          custId: this.queryForm.cust_id,
          custName: this.queryForm.cust_name,
          idNo: this.queryForm.id_no,
          orgName: this.queryForm.org_name,
          channel: this.queryForm.channel,
          changeType: this.queryForm.change_type,
          startDate: this.queryForm.dateRange?.[0],
          endDate: this.queryForm.dateRange?.[1]
        }
        const blob = await exportGradeTraceApi(params)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '等级变化轨迹.xlsx'
        link.click()
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (error) {
        this.$message.error('导出失败')
      }
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.fetchData()
    },

    handleCurrentChange(val) {
      this.pagination.pageNo = val
      this.fetchData()
    }
  }
}
</script>
