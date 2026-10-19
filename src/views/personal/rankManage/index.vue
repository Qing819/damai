<!-- 个人客户分级管理 -->
<template>
  <div class="container">
    <div class="search">
      <div class="search-header">
        <span class="search-title">个人客户分级管理</span>
      </div>
      <div class="search-content">
        <el-form ref="search" inline :model="formData" size="small">
          <el-form-item label="等级管理 :">
            <el-select filterable v-model="formData.gradeCode" @change="handleSearch">
              <el-option
                  v-for="(item, i) in gradeTypeList"
                  :key="i"
                  :label="item.gradeName"
                  :value="item.gradeCode"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="审核状态 :" prop="auditStatus">
            <el-select filterable v-model="formData.auditStatus" @change="handleSearch">
              <el-option label="全部" value=""></el-option>
              <el-option label="通过" value="01"></el-option>
              <el-option label="不通过" value="02"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="table">
      <div class="btns">
        <el-dropdown v-show="handleIsOwn('新建')" trigger="click" @command="handleAdd">
          <el-button size="mini" type="primary" class="m10" icon="el-icon-plus">新增</el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-for="(item, i) in gradeTypeList" :key="i" :command="item">
              {{ item.gradeName }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <el-table
          ref="table"
          :data="tableData"
          size="small"
          height="calc(100% - 50px - 40px)"
          v-loading="loading"
          border
      >
        <el-table-column type="index" width="50" label="序号" align="center" :index="indexMethods"></el-table-column>
        <el-table-column label="等级规则名称" prop="gradeName" min-width="150px" show-overflow-tooltip></el-table-column>
        <el-table-column label="客户等级" prop="gradeLevel" min-width="100px" show-overflow-tooltip></el-table-column>
        <el-table-column label="展示等级名称" prop="showGradeName" min-width="120px" show-overflow-tooltip></el-table-column>
        <el-table-column label="积分分档区间" prop="pointsRange" min-width="160px" show-overflow-tooltip></el-table-column>
        <el-table-column label="审核状态" min-width="90" prop="auditStatus" show-overflow-tooltip>
          <template #default="{ row }">{{ getAuditStatus(row.auditStatus) }}</template>
        </el-table-column>
        <el-table-column label="创建人" prop="creatorUserName" width="80" show-overflow-tooltip></el-table-column>
        <el-table-column label="创建时间" prop="createTime" min-width="140px" show-overflow-tooltip></el-table-column>
        <el-table-column label="更新时间" prop="updateTime" min-width="140px" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-link v-show="handleIsOwn('编辑')" class="option" type="primary" :underline="false" @click="handleEdit(row)">编辑</el-link>
            <el-link v-show="handleIsOwn('删除')" class="option" type="primary" :underline="false" @click="handleDel(row)">删除</el-link>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="formData.pageNum"
          :page-sizes="[20, 40, 60, 80]"
          :page-size="formData.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
      ></el-pagination>
    </div>

    <!-- 新增 or 编辑 -->
    <el-dialog :visible.sync="addOrEditDialog" fullscreen>
      <add-or-edit-rule
          v-if="addOrEditDialog"
          :addOrEditDialog.sync="addOrEditDialog"
          :gradeName="gradeName"
          :gradeCode="addGradeCode"
          :type="type"
          :ruleCode="ruleCode"
          @handleSearch="handleSearch"
      ></add-or-edit-rule>
    </el-dialog>
  </div>
</template>

<script>
import addOrEditRule from './components/addOrEditRule'

export default {
  components: { addOrEditRule },
  data() {
    return {
      formData: {
        gradeCode: 'V_LOVE_NEW',
        auditStatus: '',
        pageNum: 1,
        pageSize: 20
      },
      loading: false,
      total: 6,
      addGradeCode: '',
      addOrEditDialog: false,
      gradeName: '',
      type: '',
      ruleCode: '',
      // 模拟写死：等级管理下拉列表
      gradeTypeList: [
        { gradeName: 'V·爱客户尊享服务体系(新V)', gradeCode: 'V_LOVE_NEW' },
        { gradeName: '老客户积分服务体系', gradeCode: 'V_LOVE_OLD' }
      ],
      // 模拟写死：根据需求表更新后的6个分级档位数据
      tableData: [
        {
          ruleCode: 'RULE_001',
          gradeName: 'V·爱客户尊享服务体系',
          gradeLevel: '尊耀',
          showGradeName: '尊耀（新V）',
          pointsRange: '100万（含）以上',
          auditStatus: '01',
          creatorUserName: '王莹',
          createTime: '2026-01-18 17:10:22',
          updateTime: '2026-01-18 17:10:22'
        },
        {
          ruleCode: 'RULE_002',
          gradeName: 'V·爱客户尊享服务体系',
          gradeLevel: '卓越',
          showGradeName: '卓越（新V）',
          pointsRange: '30万（含）-100万（不含）',
          auditStatus: '01',
          creatorUserName: '王莹',
          createTime: '2026-01-18 17:10:22',
          updateTime: '2026-01-18 17:10:22'
        },
        {
          ruleCode: 'RULE_003',
          gradeName: 'V·爱客户尊享服务体系',
          gradeLevel: '五星',
          showGradeName: '五星（新V）',
          pointsRange: '10万（含）-30万（不含）',
          auditStatus: '01',
          creatorUserName: '王莹',
          createTime: '2026-01-18 17:10:22',
          updateTime: '2026-01-18 17:10:22'
        },
        {
          ruleCode: 'RULE_004',
          gradeName: 'V·爱客户尊享服务体系',
          gradeLevel: '四星',
          showGradeName: '四星（新V）',
          pointsRange: '5万（含）-10万（不含）',
          auditStatus: '01',
          creatorUserName: '王莹',
          createTime: '2026-01-18 17:10:22',
          updateTime: '2026-01-18 17:10:22'
        },
        {
          ruleCode: 'RULE_005',
          gradeName: 'V·爱客户尊享服务体系',
          gradeLevel: '三星',
          showGradeName: '三星（新V）',
          pointsRange: '2万（含）-5万（不含）',
          auditStatus: '01',
          creatorUserName: '王莹',
          createTime: '2026-01-18 17:10:22',
          updateTime: '2026-01-18 17:10:22'
        },
        {
          ruleCode: 'RULE_006',
          gradeName: 'V·爱客户尊享服务体系',
          gradeLevel: '普星',
          showGradeName: '普星（新V）',
          pointsRange: '2万（不含）以下',
          auditStatus: '01',
          creatorUserName: '王莹',
          createTime: '2026-01-18 17:10:22',
          updateTime: '2026-01-18 17:10:22'
        }
      ],
      // 写死按钮权限
      allowBtn: [
        { name: '新建' },
        { name: '编辑' },
        { name: '删除' }
      ]
    };
  },
  methods: {
    // 判断按钮权限
    handleIsOwn(btnName) {
      return this.allowBtn.some(btn => btn.name === btnName)
    },
    // 序号算法
    indexMethods(index) {
      return (this.formData.pageNum - 1) * this.formData.pageSize + index + 1
    },
    // 转换审核状态
    getAuditStatus(code) {
      switch (code) {
        case '01':
          return '审核通过'
        case '02':
          return '审核不通过'
        default:
          return '待审核'
      }
    },
    // 处理查询过滤（静态过滤）
    handleSearch() {
      this.formData.pageNum = 1
      this.$message.success('查询刷新数据（模拟）')
    },
    // 处理编辑
    handleEdit(row) {
      this.type = 'update'
      this.gradeName = row.showGradeName
      this.ruleCode = row.ruleCode
      this.addGradeCode = this.formData.gradeCode
      this.addOrEditDialog = true
    },
    // 处理新增
    handleAdd(item) {
      this.ruleCode = ''
      this.type = 'insert'
      this.gradeName = item.gradeName
      this.addGradeCode = item.gradeCode
      this.addOrEditDialog = true
    },
    // 处理删除
    handleDel(row) {
      this.$confirm(`确定删除等级规则[${row.showGradeName}]吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.tableData = this.tableData.filter(item => item.ruleCode !== row.ruleCode)
        this.total = this.tableData.length
        this.$message.success('删除成功!')
      }).catch(() => {})
    },
    handleSizeChange(val) {
      this.formData.pageSize = val
    },
    handleCurrentChange(val) {
      this.formData.pageNum = val
    }
  }
};
</script>

<style lang="scss" scoped>
$radius: 4px;

.m10 {
  margin-right: 10px;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  .search {
    background-color: #fff;
    border-radius: $radius;
    margin-bottom: 10px;
    .search-header {
      padding: 0 12px;
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e3e5ed;
      .search-title {
        display: flex;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        &::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 12px;
          border-radius: 2px;
          margin-right: 8px;
          background-color: #6383ff;
        }
      }
    }
    .search-content {
      padding: 0 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  .table {
    flex: 1;
    background-color: #fff;
    border-radius: $radius;
    .btns {
      padding: 10px;
    }
    .option {
      font-size: 12px;
      &:not(:first-child) {
        padding-left: 10px;
      }
    }
  }
  .pagination {
    position: fixed;
    left: 10px;
    bottom: 10px;
    height: 40px;
    padding: 4px;
    background-color: #fff;
  }
}
/deep/.el-form-item--small.el-form-item {
  margin: 0;
  padding: 10px;
}
/deep/.el-dialog {
  background-color: #f4f4f4;
}
/deep/.el-dialog .el-dialog__body {
  padding: 0;
}
/deep/.el-dialog .el-dialog__header {
  padding: 0 10px;
  background: #fff;
  margin: 10px 10px 0 10px;
  border-radius: $radius;
}
</style>