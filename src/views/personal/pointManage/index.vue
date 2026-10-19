<template>
  <div class="container">
    <el-tabs v-model="activeTab" type="border-card" class="point-tabs">

      <!-- ========================================== -->
      <!-- Tab 1: 积分汇总查询                        -->
      <!-- ========================================== -->
      <el-tab-pane label="积分汇总查询" name="summary">
        <!-- 汇总查询搜索区域 -->
        <div class="search">
          <div class="search-header">
            <span class="search-title">客户积分汇总查询</span>
          </div>
          <el-form size="small" :model="summaryForm" class="advanced-form" ref="summaryFormRef" label-width="100px">
            <el-form-item style="width: 25%" label="客户级别" prop="custLevel">
              <el-select filterable clearable style="width: 100%" v-model="summaryForm.custLevel">
                <el-option label="全部" value=""></el-option>
                <el-option label="普通客户" value="1"></el-option>
                <el-option label="黄金 VIP" value="2"></el-option>
                <el-option label="铂金 VIP" value="3"></el-option>
                <el-option label="钻石 VIP" value="4"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item style="width: 25%" label="客户姓名" prop="custName">
              <el-input v-model="summaryForm.custName" placeholder="请输入客户姓名" clearable></el-input>
            </el-form-item>
            <el-form-item style="width: 25%" label="客户号" prop="custId">
              <el-input v-model="summaryForm.custId" placeholder="请输入客户号" clearable></el-input>
            </el-form-item>
            <el-form-item style="width: 25%" label="手机号码" prop="phoneNumber">
              <el-input v-model="summaryForm.phoneNumber" placeholder="请输入手机号码" clearable></el-input>
            </el-form-item>
            <el-form-item style="width: 100%" class="search-btn">
              <el-button type="primary" icon="el-icon-refresh" plain @click="resetSummary">重 置</el-button>
              <el-button type="primary" icon="el-icon-search" @click="handleSummarySearch">搜 索</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 汇总列表区域 -->
        <div class="table">
          <div class="table-buttons">
            <div class="left-buttons">
              <el-button size="small" type="primary" @click="handleExport"> 导出汇总清单 </el-button>
            </div>
          </div>
          <div class="table-main">
            <el-table size="mini" v-loading="tableLoading" height="100%" :data="summaryTableData" style="width: 100%" border stripe>
              <el-table-column align="center" type="index" label="序号" width="55"></el-table-column>
              <el-table-column prop="cust_id" label="客户号" min-width="110" show-overflow-tooltip></el-table-column>
              <el-table-column prop="cust_name" label="客户姓名" min-width="100" show-overflow-tooltip></el-table-column>
              <el-table-column prop="phone_number" label="手机号码" min-width="120" show-overflow-tooltip></el-table-column>
              <el-table-column prop="cust_level_name" label="客户级别" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag size="mini" type="warning">{{ row.cust_level_name }}</el-tag>
                </template>
              </el-table-column>

              <!-- 核心积分汇总字段 -->
              <el-table-column prop="total_point" label="总积分" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-primary">{{ row.total_point }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="available_point" label="可用积分" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="font-bold text-success">{{ row.available_point }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="point_bf" label="保费积分累计" min-width="110" show-overflow-tooltip></el-table-column>
              <el-table-column prop="point_zc" label="忠诚积分累计" min-width="110" show-overflow-tooltip></el-table-column>
              <el-table-column prop="point_hd" label="活动积分累计" min-width="110" show-overflow-tooltip></el-table-column>
              <el-table-column prop="point_ts" label="特殊积分累计" min-width="110" show-overflow-tooltip></el-table-column>

              <el-table-column align="center" fixed="right" label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" type="text" icon="el-icon-document" @click="viewDetailByCustomer(row)">明细查询</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 分页 -->
        <div class="page-footer">
          <el-pagination
              @size-change="handleSummarySearch"
              @current-change="handleSummarySearch"
              :page-sizes="[10, 20, 50]"
              :current-page.sync="summaryForm.pageNum"
              :page-size.sync="summaryForm.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="summaryTotal"
              background
          ></el-pagination>
        </div>
      </el-tab-pane>

      <!-- ========================================== -->
      <!-- Tab 2: 积分明细查询                        -->
      <!-- ========================================== -->
      <el-tab-pane label="积分明细查询" name="detail">
        <!-- 明细筛选区域 -->
        <div class="search">
          <div class="search-header">
            <span class="search-title">积分明细与变动记录轨迹</span>
          </div>
          <el-form size="small" :model="detailForm" class="advanced-form" ref="detailFormRef" label-width="100px">
            <el-form-item style="width: 25%" label="保单号" prop="policyNo">
              <el-input v-model="detailForm.policyNo" placeholder="请输入对应保单号" clearable></el-input>
            </el-form-item>
            <el-form-item style="width: 25%" label="积分类型" prop="pointType">
              <el-select filterable clearable style="width: 100%" v-model="detailForm.pointType">
                <el-option label="全部" value=""></el-option>
                <el-option label="保费积分" value="保费积分"></el-option>
                <el-option label="忠诚积分" value="忠诚积分"></el-option>
                <el-option label="活动积分" value="活动积分"></el-option>
                <el-option label="特殊项目积分" value="特殊项目积分"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item style="width: 50%" label="时间范围" prop="dateRange">
              <el-date-picker
                  v-model="detailForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
              ></el-date-picker>
            </el-form-item>
            <el-form-item style="width: 25%" label="客户姓名/号" prop="custKeyword">
              <el-input v-model="detailForm.custKeyword" placeholder="姓名/客户号" clearable></el-input>
            </el-form-item>
            <el-form-item style="width: 75%" class="search-btn">
              <el-button type="primary" icon="el-icon-refresh" plain @click="resetDetail">重 置</el-button>
              <el-button type="primary" icon="el-icon-search" @click="handleDetailSearch">搜 索</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 明细表格区域 -->
        <div class="table">
          <div class="table-buttons">
            <div class="left-buttons">
              <el-button size="small" type="primary" @click="handleExport"> 导出明细清单 </el-button>
            </div>
          </div>
          <div class="table-main">
            <el-table size="mini" v-loading="tableLoading" height="100%" :data="detailTableData" style="width: 100%" border stripe>
              <el-table-column align="center" type="index" label="序号" width="55"></el-table-column>
              <el-table-column prop="create_time" label="产生/变动时间" width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="cust_name" label="客户姓名" width="100" show-overflow-tooltip></el-table-column>
              <el-table-column prop="policy_no" label="对应保单号" width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <span>{{ row.policy_no || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="point_type" label="积分类型" width="110" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag size="mini" :type="getPointTypeTag(row.point_type)">{{ row.point_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="point_amount" label="积分金额(变动)" width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <span :class="row.point_amount >= 0 ? 'text-plus' : 'text-minus'">
                    {{ row.point_amount >= 0 ? '+' + row.point_amount : row.point_amount }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="expire_time" label="失效时间" width="140" show-overflow-tooltip></el-table-column>

              <!-- 变动增减记录信息 -->
              <el-table-column prop="change_reason" label="变动原因" min-width="180" show-overflow-tooltip></el-table-column>
              <el-table-column prop="operator" label="操作主体" width="120" show-overflow-tooltip></el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 分页 -->
        <div class="page-footer">
          <el-pagination
              @size-change="handleDetailSearch"
              @current-change="handleDetailSearch"
              :page-sizes="[10, 20, 50]"
              :current-page.sync="detailForm.pageNum"
              :page-size.sync="detailForm.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="detailTotal"
              background
          ></el-pagination>
        </div>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'CustomerPointManagement',
  data() {
    return {
      activeTab: 'summary',
      tableLoading: false,

      // ---------------- Tab 1: 积分汇总 ----------------
      summaryForm: {
        custLevel: '',
        custName: '',
        custId: '',
        phoneNumber: '',
        pageNum: 1,
        pageSize: 10
      },
      summaryTotal: 3,
      // 模拟的【积分汇总】死数据
      summaryDataMock: [
        {
          cust_id: 'CUST2026001',
          cust_name: '李建国',
          phone_number: '138****8888',
          cust_level_name: '钻石 VIP',
          total_point: 28500,
          available_point: 19200,
          point_bf: 15000,
          point_zc: 8500,
          point_hd: 3000,
          point_ts: 2000
        },
        {
          cust_id: 'CUST2026002',
          cust_name: '张晓华',
          phone_number: '139****6666',
          cust_level_name: '黄金 VIP',
          total_point: 12000,
          available_point: 8400,
          point_bf: 8000,
          point_zc: 3000,
          point_hd: 1000,
          point_ts: 0
        },
        {
          cust_id: 'CUST2026003',
          cust_name: '王小明',
          phone_number: '135****1234',
          cust_level_name: '普通客户',
          total_point: 3500,
          available_point: 3500,
          point_bf: 2000,
          point_zc: 1000,
          point_hd: 500,
          point_ts: 0
        }
      ],
      summaryTableData: [],

      // ---------------- Tab 2: 积分明细 ----------------
      detailForm: {
        policyNo: '',
        pointType: '',
        dateRange: [],
        custKeyword: '',
        pageNum: 1,
        pageSize: 10
      },
      detailTotal: 5,
      // 模拟的【积分明细及变动记录】死数据
      detailDataMock: [
        {
          create_time: '2026-08-01 10:30:00',
          cust_name: '李建国',
          policy_no: 'P001928301',
          point_type: '保费积分',
          point_amount: 5000,
          expire_time: '2027-12-31 23:59:59',
          change_reason: '首期保费核保通过赠送积分',
          operator: '系统自动生成'
        },
        {
          create_time: '2026-07-15 14:20:11',
          cust_name: '李建国',
          policy_no: 'P001928301',
          point_type: '忠诚积分',
          point_amount: 2000,
          expire_time: '2028-12-31 23:59:59',
          change_reason: '老客户续保满5年忠诚奖励',
          operator: '系统自动生成'
        },
        {
          create_time: '2026-06-10 09:15:00',
          cust_name: '李建国',
          policy_no: '',
          point_type: '活动积分',
          point_amount: -500,
          expire_time: '-',
          change_reason: '商城兑换“三甲绿通服务”卡券扣减',
          operator: '客户自主兑换'
        },
        {
          create_time: '2026-05-20 16:00:00',
          cust_name: '张晓华',
          policy_no: 'P008827102',
          point_type: '保费积分',
          point_amount: -1200,
          expire_time: '-',
          change_reason: '减保业务办理成功，相应保费积分扣减',
          operator: '工号 Admin01'
        },
        {
          create_time: '2026-01-01 00:00:00',
          cust_name: '王小明',
          policy_no: 'P009982103',
          point_type: '特殊项目积分',
          point_amount: 1000,
          expire_time: '2026-12-31 23:59:59',
          change_reason: '开门红特殊项目手动加分',
          operator: '主管 Manager02'
        }
      ],
      detailTableData: []
    }
  },
  methods: {
    // 获取/过滤 汇总数据
    handleSummarySearch() {
      this.tableLoading = true;
      setTimeout(() => {
        this.summaryTableData = this.summaryDataMock.filter(item => {
          return (!this.summaryForm.custName || item.cust_name.includes(this.summaryForm.custName)) &&
              (!this.summaryForm.custId || item.cust_id.includes(this.summaryForm.custId)) &&
              (!this.summaryForm.phoneNumber || item.phone_number.includes(this.summaryForm.phoneNumber))
        })
        this.summaryTotal = this.summaryTableData.length
        this.tableLoading = false
      }, 300)
    },
    resetSummary() {
      this.$refs.summaryFormRef.resetFields()
      this.handleSummarySearch()
    },

    // 从汇总点击“明细查询”跳转并带入参数
    viewDetailByCustomer(row) {
      this.detailForm.custKeyword = row.cust_name
      this.activeTab = 'detail'
      this.handleDetailSearch()
    },

    // 获取/过滤 明细数据
    handleDetailSearch() {
      this.tableLoading = true
      setTimeout(() => {
        this.detailTableData = this.detailDataMock.filter(item => {
          const matchPolicy = !this.detailForm.policyNo || (item.policy_no && item.policy_no.includes(this.detailForm.policyNo))
          const matchType = !this.detailForm.pointType || item.point_type === this.detailForm.pointType
          const matchCust = !this.detailForm.custKeyword || item.cust_name.includes(this.detailForm.custKeyword)
          return matchPolicy && matchType && matchCust
        })
        this.detailTotal = this.detailTableData.length
        this.tableLoading = false
      }, 300)
    },
    resetDetail() {
      this.$refs.detailFormRef.resetFields()
      this.handleDetailSearch()
    },

    // 辅助样式设置
    getPointTypeTag(type) {
      switch (type) {
        case '保费积分': return 'primary'
        case '忠诚积分': return 'success'
        case '活动积分': return 'warning'
        default: return 'info'
      }
    },

    // 虚拟导出提示
    handleExport() {
      this.$message.success('已成功发起数据导出任务，请稍后下载！')
    }
  },
  created() {
    this.handleSummarySearch()
    this.handleDetailSearch()
  }
}
</script>

<style scoped lang="scss">
.container {
  height: 100%;
  width: 100%;
  padding: 12px;
  background-color: #f5f7fa;

  .point-tabs {
    background-color: #fff;
    height: 100%;

    /deep/ .el-tabs__content {
      padding: 12px;
    }
  }

  .search {
    margin-bottom: 12px;
    border: 1px solid #e3e5ed;
    border-radius: 4px;
    background-color: #fff;

    .search-header {
      padding: 0 12px;
      height: 36px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #e3e5ed;
      background-color: #f8f9fa;

      .search-title {
        font-size: 14px;
        font-weight: bold;
        color: #333;

        &::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 12px;
          border-radius: 2px;
          margin-right: 8px;
          background-color: #409eff;
        }
      }
    }

    .advanced-form {
      padding: 12px 12px 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      .search-btn {
        text-align: right;
        margin-left: auto;
      }

      /deep/ .el-form-item {
        padding-bottom: 12px;
        margin: 0;
      }
    }
  }

  .table {
    border: 1px solid #e3e5ed;
    border-radius: 4px;
    background-color: #fff;

    .table-buttons {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ebeef5;
    }

    .table-main {
      height: 400px; // 固定视口高度，保障大容量数据显示
    }
  }

  .page-footer {
    padding: 10px 0 0 0;
    display: flex;
    justify-content: flex-end;
  }

  // 状态与颜色辅助类
  .font-bold {
    font-weight: bold;
  }
  .text-primary {
    color: #409eff;
  }
  .text-success {
    color: #67c23a;
  }
  .text-plus {
    color: #67c23a;
    font-weight: bold;
  }
  .text-minus {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>