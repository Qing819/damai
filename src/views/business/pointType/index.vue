// 积分类型配置
<template>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <div class="header-title">
          <span class="p-line"></span>
          <span>积分类型配置</span>
        </div>
        <el-input
            maxlength="20"
            v-model.trim="filterData.name"
            placeholder="请输入积分类型进行检索"
            size="mini"
            class="search-input"
            @change="search">
            <i
              slot="suffix"
              class="el-input-suffix-icon el-input__icon el-icon-search"
              @click="search">
            </i>
        </el-input>
      </div>
      <el-button
        v-show="handleIsOwn('新建')"
        type="primary"
        size="mini"
        icon="el-icon-plus"
        @click="showAddDialog"
      >新 建</el-button>
    </div>

    <div class="table-box">
      <!-- 表格 -->
      <el-table
        ref="table"
        v-loading="loading"
        :data="tableData"
        row-key="integralCode"
        size="small"
        height="calc(100% - 52px)">
        <el-table-column
          label="序号"
          type="index"
          width="50"
          align="center">
        </el-table-column>
        <el-table-column
          label="积分类型"
          prop="integralName"
          show-overflow-tooltip>
        </el-table-column>
        <el-table-column
          label="要素个数"
          prop="integralElementCount"
          align="center"
          show-overflow-tooltip>
        </el-table-column>
        <!-- min-width="100"  -->
        <el-table-column
          label="创建人"
          align="center"
          prop="creatorUserName"
          show-overflow-tooltip>
        </el-table-column>
        <el-table-column
          label="创建时间"
          prop="createTime"
          min-width="160"
          align="center"
          show-overflow-tooltip>
        </el-table-column>
        <el-table-column
          label="更新时间"
          prop="updateTime"
          min-width="160"
          align="center"
          show-overflow-tooltip>
        </el-table-column>
        <el-table-column
          label="操作"
          fixed="right"
          width="120px"
          align="center">
          <template #default="{ row }">
            <!-- <el-tooltip effect="dark" content="编辑" placement="top" :enterable="false">
              <icon-svg class="options-col-icon" icon-class="edit" @click.native="handleEdit(row)"></icon-svg>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip effect="dark" content="删除" placement="top" :enterable="false">
              <icon-svg class="options-col-icon" icon-class="delete" @click.native="handleDelete(row)"></icon-svg>
            </el-tooltip> -->
            <el-link
              v-show="handleIsOwn('编辑')"
              type="success"
              :underline="false"
              class="options-col-btn"
              @click="handleEdit(row)">
              编辑
            </el-link>
            <el-divider v-if="handleIsOwn('删除') && handleIsOwn('编辑')" direction="vertical"></el-divider>
            <el-link
              v-show="handleIsOwn('删除')"
              type="danger"
              :underline="false"
              class="options-col-btn"
              :disabled="row.isDefaultUse === '00'"
              @click="handleDelete(row)">
              删除
            </el-link>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <el-pagination
        :total="total"
        :current-page="filterData.pageNum"
        :page-size="filterData.pageSize"
        :page-sizes="[20, 40, 60, 80]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        class="pagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>

    <!-- 弹窗-新增/编辑 -->
    <el-dialog
      v-if="editDialogVisible"
      class="edit-dialog"
      fullscreen
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :visible.sync="editDialogVisible"
      :before-close="hideEditDialog">
      <point-type-edit :code="selectedData.integralCode" @handleClose="hideEditDialog"></point-type-edit>
    </el-dialog>
  </div>
</template>

<script>
import pointTypeEdit from './components/edit'
import { getIntegralTypeList, delIntegralType } from 'api/pointType/index'
import { getPageButtonMenuInfo } from 'api/btnPermissions'

export default {
  components: { pointTypeEdit },
  data() {
    return {
      loading: false,
      filterData: {
        name: '',
        pageNum: 1,
        pageSize: 20
      },
      tableData: [],
      total: 0,
      // 弹窗：编辑弹窗是否显示
      editDialogVisible: false,
      // 当前处理的数据
      selectedData: { integralCode: '' },
      allowBtn: []// 允许展示的按钮
    }
  },
  created() {
    this.getPageButtonMenuInfo()
    this.getList()
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
      getPageButtonMenuInfo({ pageType: 'pointType' }).then(({ list }) => {
        this.allowBtn = list
      }).finally(() => {
        this.loading = false
      })
    },
    // 获取列表
    getList() {
      this.loading = true
      getIntegralTypeList(this.filterData).then(res => {
        this.tableData = res.list || []
        this.total = res.total || 0
      }).finally(() => {
        this.loading = false
      })
    },
    // 查询
    search() {
      if (this.filterData.pageNum !== 1) { this.filterData.pageNum = 1 }
      this.$nextTick(() => { this.getList() })
    },
    // 点击了新增
    showAddDialog() {
      this.selectedData = {}
      this.editDialogVisible = true
    },
    // 点击了编辑
    handleEdit(rowData) {
      this.selectedData = rowData
      this.editDialogVisible = true
    },
    // 删除
    handleDelete(rowData) {
      this.$confirm(`确定删除积分类型 [ ${rowData.integralName} ] 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          delIntegralType({ integralCode: rowData.integralCode }).then(res => {
            this.$message({
              type: 'success',
              message: '删除成功!',
              duration: 2000
            })
            this.getList()
          })
        })
    },
    // 分页
    handleSizeChange(val) {
      this.filterData.pageSize = val
      this.$nextTick(() => { this.getList() })
    },
    handleCurrentChange(val) {
      this.filterData.pageNum = val
      this.$nextTick(() => { this.getList() })
    },
    // 弹窗：关闭编辑弹窗
    hideEditDialog(needRefresh) {
      this.selectedData = {}
      this.editDialogVisible = false
      // needRefresh为true 需要刷新列表
      needRefresh && this.getList()
    }
  }
}
</script>

<style lang="scss" scoped>
.container{
  height: 100%;
  padding: 10px;
  .header{
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    padding: 5px;
    border-radius: 4px;
    // box-shadow: 0px 7px 24px 0px rgba(163, 171, 186, 0.2);
    box-shadow: 0 7px 24px 0 rgba(163,171,186,.1);
    padding: 0 12px;
    min-height: 45px;
    .header-left{
      display: flex;
      align-items: center;
      flex: 1;
      .header-title{
        font-size: 14px;
        margin-right: 10px;
        white-space: nowrap;
      }
      .search-input{
        flex: 1;
        max-width: 300px;
        min-width: 100px;
        /deep/.el-input__inner{
          border-radius: 20.5px;
        }
      }
      .p-line{
        margin-right: 5px;
      }
    }
    /deep/.el-form-item{
      margin: 0;
    }
  }
  .table-box{
    height: calc(100% - 55px);
    background-color: #fff;
    border-radius: 4px;
    margin-top: 10px;
    overflow: hidden;
  }
  .pagination{
    margin: 10px 10px 0 0;
    text-align: right;
  }
}
.options-col-icon{
  font-size: 13px;
  cursor: pointer;
  // &:not(:first-child){
  //   padding-left: 10px;
  // }
}
.options-col-btn{
  font-size: 13px;
}
.edit-dialog{
  /deep/.el-dialog__body{
    padding: 0;
  }
}
</style>
