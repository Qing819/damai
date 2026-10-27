// 积分规则
<template>
  <div class="container">
    <div class="search">
      <div class="search-header">
        <span class="search-title">个人积分规则管理</span>
      </div>
      <div class="search-content">
        <el-form ref="search" inline :model="formData" size="small" label-width="100px">
          <el-form-item label="积分类型 :" prop="integralCode">
            <el-select filterable v-model="formData.integralCode" @change="handleChange">
              <el-option
                v-for="(item,i) in integrationTypeList"
                :key="i"
                :label="item.integralName"
                :value="item.integralCode"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="规则名称 :" v-show="formData.ruleNameElementCode !== ''">
            <el-input v-model="formData.ruleName"></el-input>
          </el-form-item>
          <el-form-item v-for="(item, index) in searchConfig" :key="'integral' + item.elementCode" :label="item.elementName + '：'">
            <form-item v-model="searchInfo[index].elementValue" :elementConfig="item"></form-item>
          </el-form-item>
          <el-form-item label="审核状态 :" prop="auditStatus">
            <el-select filterable v-model="formData.auditStatus">
              <el-option label="全部" value=""></el-option>
              <el-option label="通过" value="01"></el-option>
              <el-option label="不通过" value="02"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item >
            <el-button icon="el-icon-refresh" size="small" @click="handleReset">重置</el-button>
            <el-button icon="el-icon-search" type="primary" size="small" @click="handleSearch">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="table">
      <div class="btns">
        <el-dropdown v-show="handleIsOwn('新建')" trigger="click" @command="handleAdd">
          <el-button size="mini" type="primary" icon="el-icon-plus" class="m10">新增</el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-for="(item,i) in integrationTypeList" :key="i" :command="item">{{item.integralName}}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown v-show="handleIsOwn('导入')" trigger="click" @command="handleImport">
          <el-button size="mini" type="primary" plain icon="el-icon-download" class="m10">导入</el-button>
          <el-dropdown-menu slot="dropdown" >
            <el-dropdown-item command="downLoad">下载上传模板</el-dropdown-item>
            <el-dropdown-item class="m12">
              <el-upload
                action=""
                accept=".xls,.xlsx"
                :on-change="fileChange"
                :show-file-list="false"
                :auto-upload="false"
                :file-list="fileList">
                <div class="m11"><span>导入文件</span></div>
                </el-upload>
                </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown v-show="handleIsOwn('导出')" trigger="click" >
          <el-button size="mini" type="primary" plain icon="el-icon-upload2" class="m10" @click="handleExport">导出</el-button>
        </el-dropdown>
        <el-button v-show="handleIsOwn('批量删除')" size="mini" type="primary" plain icon="el-icon-delete" @click="handleDelSelected">删除</el-button>
      </div>

      <el-table
        ref="table"
        :data="tableData"
        size="small"
        height="calc(100% - 50px - 40px)"
        row-key="code"
        @select-all="handleSelectionChange"
        @selection-change="handleSelectionChange"
        reserve-selection
        v-loading="loading">
        <el-table-column type="selection" width="50" align="center"></el-table-column>
        <el-table-column type="index" width="50" label="序号" :index="indexMethods"></el-table-column>
        <el-table-column label="积分类型" prop="integralName" show-overflow-tooltip></el-table-column>
        <el-table-column v-for="(item, index) in tableHeader" :key="item.elementName + index" :label="item.elementName" :width = "item.elementCode === 'a7J6RT44' ? '280' : '140'" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getTableValue(row.elementList,item.elementCode) }}
          </template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="80" prop="auditStatus" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getAuditStatus(row.auditStatus) }}
          </template>
        </el-table-column>
        <el-table-column label="创建人" min-width="80" prop="creatorUserName" show-overflow-tooltip></el-table-column>
        <el-table-column label="创建时间" min-width="150" prop="createTime" show-overflow-tooltip></el-table-column>
        <el-table-column label="更新时间" min-width="150" prop="updateTime" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-link v-show="handleIsOwn('编辑')" class="option" type="primary" :underline="false" @click="handleEdit(row)">编辑</el-link>
            <el-link v-show="handleIsOwn('删除')" class="option" type="primary" :underline="false" @click="handleDel(row)">删除</el-link>
            <el-link v-show="handleIsOwn('轨迹查询')" class="option" type="primary" :underline="false" @click="handleTrack(row)">轨迹查询</el-link>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        :current-page="formData.pageNum"
        :page-sizes="[20, 40, 60, 80]"
        :page-size="formData.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>

    <!-- 编辑 or 新增 -->
    <el-dialog :visible.sync="addOrEditDialog" fullscreen>
      <add-or-edit-rule
        v-if="addOrEditDialog"
        :addOrEditDialog.sync="addOrEditDialog"
        :integralName="integralName"
        :integralCode="addIntegralCode"
        :type="type"
        :ruleCode="ruleCode"
        @handleSearch="handleSearch"
      ></add-or-edit-rule>
    </el-dialog>

    <!-- 轨迹查询 -->
    <el-dialog :visible.sync="trackDialog" fullscreen>
      <track-examine v-if="trackDialog" :trackDialog.sync="trackDialog" :trackInfo="trackInfo"></track-examine>
    </el-dialog>

    <!-- 上传进度条 -->
    <el-dialog
      :visible.sync="progressVisible"
      top="35vh"
      title="提示"
      class="progress-dialog"
      width="50%"
      :show-close="false"
      :close-on-press-escape="false"
      :close-on-click-modal="false">
      <el-progress text-inside :stroke-width="18" :percentage="progressNum"></el-progress>
      <div class="progress-text">{{ progressStatusText }}</div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { exportFileGet } from 'utils/exportFile'
import addOrEditRule from './components/addOrEditRule'
import trackExamine from './components/trackExamine'
import formItem from 'components/formItem'
import {
  integrationRuleFieldValueList,
  integrationRulePageInfo,
  delIntegralRule,
  getImportTemplate,
  exportIntegralRule,
  importIntegrationRule,
  checkEditIntegralRuleAudit,
  getIntegralRuleSelInfo
} from 'api/pointRule/index'
import { getPageButtonMenuInfo } from 'api/btnPermissions'

export default {
  components: { addOrEditRule, trackExamine, formItem },
  data() {
    return {
      formData: {
        integralCode: '',
        ruleName: '',
        ruleNameElementCode: '', // 规则名称要素编码
        auditStatus: '', // 审核状态
        pageNum: 1,
        pageSize: 20
      },
      premiumIntegral: '', // 保费积分编码
      searchConfig: [], // 查询内容配置
      searchInfo: [], // 查询条件
      loading: false,
      total: 0,
      addIntegralCode: '', // 新增类型code
      addOrEditDialog: false, // 新增或编辑弹窗
      trackDialog: false, // 轨迹查询弹窗
      integralName: '', // 新增或编辑标题
      ruleCode: '', // 规则编码
      type: '', // 新增或编辑弹窗类型
      trackInfo: '', // 轨迹查询信息
      tableHeader: [],
      tableData: [],
      multipleSelection: [], // 多选内容
      fileList: [],
      allowBtn: [], // 允许展示的按钮

      // 进度条
      progressVisible: false,
      progressNum: 0,
      progressStatusText: '正在导入中...'
    };
  },
  computed: {
    // 获取积分类型下拉
    ...mapGetters(['integrationTypeList'])
  },
  watch: {
    searchConfig(val) {
      this.searchInfo = []
      val.forEach(item => {
        this.searchInfo.push({
          elementCode: item.elementCode,
          elementValue: ''
        })
      })
    }
  },
  created() {
    this.getPageButtonMenuInfo()
    this.getIntegralCode()
  },
  methods: {
    // 判断是否拥有该按钮权限
    handleIsOwn(btnName) {
      const isOwnBtn = this.allowBtn.find(btn => btn.name === btnName)
      return !!isOwnBtn
    },
    // 获取页面按钮是否授权
    getPageButtonMenuInfo() {
      this.loading = true
      getPageButtonMenuInfo({ pageType: 'pointRule' }).then(({ list }) => {
        this.allowBtn = list
      }).finally(() => {
        this.loading = false
      })
    },
    // 序号
    indexMethods(index) {
      return (this.formData.pageNum - 1) * this.formData.pageSize + index + 1
    },
    /**
     * 查看积分类型是否有数据
     * 有数据
     * 1.看是否有保费积分
     * 2.有保费积分将编码设为保费积分，否则设为第一个数据
     * 3.获取表格数据
     * 没数据
     * 1.不做操作
     */
    getIntegralCode() {
      if (this.integrationTypeList.length !== 0) {
        this.integrationTypeList.forEach(item => {
          if (item.integralName === '保费积分') {
            this.formData.integralCode = item.integralCode
            this.premiumIntegral = item.integralCode
          }
        })
        if (!this.formData.integralCode) {
          this.formData.integralCode = this.integrationTypeList[0].integralCode
        }
        this.getIntegralRuleSearch()
        this.getTableHeader()
        this.getTableData()
      }
    },
    // 获取查询条件
    getIntegralRuleSearch() {
      const integralCode = this.formData.integralCode === this.premiumIntegral ? this.premiumIntegral : ''
      getIntegralRuleSelInfo({ integralCode }).then(({ list }) => {
        this.searchConfig = list
      })
    },
    // 获取审核状态
    getAuditStatus(code) {
      switch (code) {
        case '01':
          return '审核通过'
        case '02':
          return '审核不通过'
        default:
          return ''
      }
    },
    /**
     * 获取表格表头
     * 如果有积分规则名称，经积分规则编码进行赋值
     */
    getTableHeader() {
      integrationRuleFieldValueList({ integralCode: this.formData.integralCode }).then(({ list }) => {
        this.tableHeader = list
        this.formData.ruleNameElementCode = ''
        list.forEach(item => {
          if (item.elementName === '积分规则名称') {
            this.formData.ruleNameElementCode = item.elementCode
          }
        })
        this.$nextTick(() => {
          this.$refs.table.doLayout()
        })
      })
    },
    // 获取表格内容
    getTableData() {
      this.loading = true
      const params = this.formData
      const selList = []
      this.searchInfo.forEach(item => {
        if (item.elementValue) {
          selList.push({
            elementCode: item.elementCode,
            elementValue: item.elementValue
          })
        }
      })
      params.list = selList
      integrationRulePageInfo(params).then(({ list, total }) => {
        this.tableData = list
        this.total = total
        this.$nextTick(() => {
          this.$refs.table.doLayout()
        })
      })
        .finally(() => {
          this.loading = false
        })
    },
    // 获取表格单元格的内容
    getTableValue(list, code) {
      const value = list.find(e => e.elementCode === code)
      return value ? value.elementValue || '' : ''
    },
    // 处理下拉改变
    handleChange() {
      this.formData.pageNum = 1
      this.formData.ruleName = ''
      this.formData.auditStatus = ''
      this.$nextTick(() => {
        this.getIntegralRuleSearch()
        this.getTableHeader()
        this.getTableData()
      })
    },
    // 处理查询
    handleSearch() {
      this.formData.pageNum = 1
      this.$nextTick(() => {
        this.getTableHeader()
        this.getTableData()
      })
    },
    // 处理编辑
    handleEdit(row) {
      // 检查是否可以编辑
      checkEditIntegralRuleAudit({ ruleCode: row.ruleCode }).then(({ result }) => {
        if (!result) { return }

        this.type = 'update'
        this.integralName = row.integralName
        this.ruleCode = row.ruleCode
        this.addIntegralCode = row.integralCode
        this.addOrEditDialog = true
      })
    },
    // 处理重置
    handleReset() {
      this.searchInfo.forEach(item => {
        item.elementValue = ''
      })
      this.formData.ruleName = ''
      this.formData.auditStatus = ''
    },
    // 处理多选的值
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    // 上传文件
    fileChange(file, fileList) {
      if (file) {
        const formData = new FormData()
        formData.append('excel', file.raw)
        formData.append('integralCode', this.formData.integralCode)
        this.progressVisible = true;
        importIntegrationRule(
          formData,
          progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            this.progressNum = percentCompleted > 90 ? 90 : percentCompleted
          }
        ).then(res => {
          if (res.result) {
            this.progressNum = 100
            this.progressStatusText = '导入成功!'
            this.progressVisible = false
            this.$message({
              type: 'success',
              message: '导入成功'
            })
            this.getTableData()
          } else {
            this.progressVisible = false
            this.$message({
              type: 'warning',
              message: res.error,
              duration: 2000
            })
          }
        }).catch(() => {
          this.progressNum = 100
          this.progressStatusText = '导入失败!'
          this.progressVisible = false
        }).finally(() => {
          // 清理进度条状态
          this.progressStatusText = '正在导入中...'
          this.progressNum = 0
        })
      }
    },
    // 处理导入
    handleImport(type) {
      if (type === 'downLoad') {
        getImportTemplate({ integralCode: this.formData.integralCode }).then(res => {
          exportFileGet(res, '个人积分规则管理文件')
        })
      }
    },
    // 处理导出
    handleExport() {
      const params = this.formData
      const selList = []
      this.searchInfo.forEach(item => {
        if (item.elementValue) {
          selList.push({
            elementCode: item.elementCode,
            elementValue: item.elementValue
          })
        }
      })
      params.list = selList
      exportIntegralRule(params).then(res => {
        exportFileGet(res, '个人积分规则管理文件')
      })
    },
    // 处理新增
    handleAdd(item) {
      this.ruleCode = ''
      this.type = 'insert'
      this.integralName = item.integralName
      this.addIntegralCode = item.integralCode
      this.addOrEditDialog = true
    },
    // 处理轨迹查询
    handleTrack(row) {
      this.trackDialog = true
      this.trackInfo = row
    },

    // 批量删除
    handleDelSelected() {
      if (this.multipleSelection.length === 0) {
        this.$message({
          type: 'warning',
          message: '请至少选择一条数据进行删除'
        })
        return
      }

      const ruleAuditStatus = this.multipleSelection[0].auditStatus // 审核类型
      const ruleCodes = this.multipleSelection.map(e => e.ruleCode).join(',')
      // let integralNames = this.multipleSelection.map(e=>e.integralName).join(',')

      this.$confirm('确定删除选中的数据吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delIntegralRule({ ruleCodes, integralCode: this.formData.integralCode }).then(({ result }) => {
          if (result) {
            this.$message({
              type: 'success',
              message: ruleAuditStatus === '01' ? '删除成功, 数据已提交审核!' : '删除成功!'
            })
            this.handleSearch()
          }
        })
      }).catch(() => {
        // 【待人工复核】沿用原有行为，不向外抛出异常。
      })
    },

    // 删除单条数据
    handleDel(row) {
      this.$confirm('确定删除吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delIntegralRule({ ruleCodes: row.ruleCode, integralCode: row.integralCode }).then(({ result }) => {
          if (result) {
            this.$message({
              type: 'success',
              message: row.auditStatus === '01' ? '删除成功, 数据已提交审核!' : '删除成功!'
            })
            this.handleSearch()
          }
        })
      }).catch(() => {
        // 【待人工复核】沿用原有行为，不向外抛出异常。
      })
    },

    // 处理当前页面大小改变
    handleSizeChange(val) {
      this.formData.pageSize = val
      this.getTableData()
    },

    // 处理当前页更改
    handleCurrentChange(val) {
      this.formData.pageNum = val
      this.getTableData()
    }
  }
};
</script>

<style>
  .el-dropdown-menu {
    max-height:300px;
    overflow:scroll;
  }
</style>

<style lang="scss" scoped>
$radius: 4px;

.m10 {
  margin-right: 10px;
}
.m11 {
  width:120px;
  padding:0px 20px;
  text-align:left;
  margin: 0;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}
.m12 {
  padding:0px;
}


.container {
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
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
        // height: 16px;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 10px;
    }
  }
  .header-title {
    padding: 15px;
    font-weight: 600;
  }
  .table {
    flex:1;
    background-color: #fff;
    border-radius: $radius;
    .btns {
      height: 50px;
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

  .progress-dialog {
    .progress-text{
      text-align: center;
      font-size: 13px;
      color: #6383ff;
      padding-top: 15px;
    }
    ::v-deep.el-dialog {
      min-width: 400px;
      max-width: 800px;
      margin-top: calc(50vh - 90px);
    }
    ::v-deep.el-dialog__header {
      display: none;
    }
    ::v-deep.el-dialog__body {
      height: auto;
      padding: 30px 20px 20px;
    }
  }
}
::v-deep.el-form-item--small.el-form-item {
  margin: 0;
  padding: 10px;
}
::v-deep.el-dialog {
  background-color: #f4f4f4;
}
::v-deep.el-dialog .el-dialog__body {
  padding: 0;
}
::v-deep.el-dialog .el-dialog__header {
  padding: 0 10px;
  background: #fff;
  margin: 10px 10px 0 10px;
  border-radius: $radius;
}
</style>
