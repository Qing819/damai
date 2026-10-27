<template>
  <div class="container">
    <!-- 搜索区域 -->
    <div class="search">
      <div class="search-header">
        <span class="search-title">要素配置</span>
      </div>
      <el-form @submit.native.prevent size="small" :model="formData" class="advanced-form" ref="formData" label-width="80px">
        <el-form-item style="width: 25%" label="要素名称">
          <el-input @keyup.native.enter="search" v-model="formData.elementName" placeholder="请输入要素名称"></el-input>
        </el-form-item>
        <el-form-item style="width: 25%" class="search-btn">
          <el-button @click="search" type="primary" icon="el-icon-search"> 搜 索 </el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 表格区域 -->
    <div class="table">
      <div class="table-buttons">
        <div class="left-buttons">
          <el-button @click="addElement" size="small" type="primary"> 新 增 </el-button>
        </div>
      </div>
      <div class="table-main">
        <el-table size="mini" v-loading="tableLoading" height="100%" :data="tableData" style="width: 100%">
          <el-table-column align="center" type="index" label="序号"> </el-table-column>
          <el-table-column align="center" prop="elementName" label="要素名称"> </el-table-column>
          <el-table-column align="center" prop="elementType" label="要素类型">
            <template #default="{ row }">
              <span v-if="row.elementType === '0'">文本型</span>
              <span v-if="row.elementType === '1'">数值型</span>
              <span v-if="row.elementType === '2'">日期型</span>
              <span v-if="row.elementType === '3'">维度型</span>
            </template>
          </el-table-column>
          <el-table-column align="center" prop="elementAllowNull" label="是否必填">
            <template #default="{ row }">
              <span v-if="row.elementAllowNull === '01'">是</span>
              <span v-if="row.elementAllowNull === '00'">否</span>
            </template>
          </el-table-column>
          <el-table-column align="center" prop="elementOnly" label="是否唯一">
            <template #default="{ row }">
              <span v-if="row.elementOnly === '00'">是</span>
              <span v-if="row.elementOnly === '01'">否</span>
            </template>
          </el-table-column>
          <el-table-column align="center" prop="creatorUserName" label="创建人"></el-table-column>
          <el-table-column align="center" prop="createTime" label="创建时间" width="160"></el-table-column>
          <el-table-column align="center" prop="updateTime" label="更新时间" width="160"></el-table-column>
          <el-table-column fixed="right" align="center" label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" type="text" @click="editRow(row)">编辑</el-button>
              <el-button :disabled="row.isDelete === '01'" size="small" type="text" @click="deleteRow(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 分页区域 -->
    <div class="page">
      <el-pagination
        :disabled="tableLoading"
        @size-change="getList"
        @current-change="getList"
        :page-sizes="[20, 40, 60, 80]"
        :current-page.sync="formData.pageNum"
        :page-size.sync="formData.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        background
      >
      </el-pagination>
    </div>
    <!-- 新增or编辑 -->
    <el-dialog @closed="state = ''" fullscreen :modal="false" :visible.sync="dialogVisible" :show-close="false">
      <Add-Element @updateList="search" :dialogVisible.sync="dialogVisible" v-if="state === '0'"></Add-Element>
      <Edit-Element @updateList="search" :currentCode="currentCode" :dialogVisible.sync="dialogVisible" v-if="state === '1'"></Edit-Element>
    </el-dialog>
  </div>
</template>
<script>
import AddElement from './components/AddElement'
import EditElement from './components/EditElement'
import { checkIntegralDelete, getIntegralElementInfo, delIntegralElementInfo } from 'api/elementConfig'

export default {
  components: { AddElement, EditElement },
  data() {
    return {
      message: '1',
      tableLoading: false,
      state: '0', // 弹窗页面状态  0:新增 1:编辑 2:详情
      // 表格数据
      tableData: [
        {
          code: '1',
          createTime: '2021-10-22',
          creatorUserName: 'admin',
          elementAllowNull: '00',
          elementName: '测试',
          elementOnly: '00',
          isDelete: '00',
          isPercentage: '00',
          updateTime: '2021-10-22'
        }
      ],
      // 表单数据
      formData: {
        pageNum: 1,
        pageSize: 20,
        elementName: ''
      },
      total: 0,
      // 当前编辑的要素code
      currentCode: '',
      dialogVisible: false
    }
  },
  methods: {
    // 获取列表
    async getList() {
      this.tableLoading = true
      try {
        const params = JSON.parse(JSON.stringify(this.formData))
        const {
          result: { list, total }
        } = await getIntegralElementInfo(params)
        this.tableData = list
        this.total = total
        this.tableLoading = false
      } catch (error) {
        this.tableLoading = false
      }
    },
    // 搜索按钮
    search() {
      this.formData.pageNum = 1
      this.getList()
    },
    editRow(row) {
      this.state = '1'
      this.currentCode = row.code
      this.dialogVisible = true
    },
    deleteRow(row) {
      this.$confirm(`确定删除要素 [ ${row.elementName} ] 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          const res = await checkIntegralDelete({ elementCode: row.code })
          if (!res.result) {
            this.$message.warning(`要素 [ ${row.elementName} ] 不可删除`)
          } else {
            await delIntegralElementInfo({ code: row.code })
            this.$message.success('操作成功')
            this.getList()
          }
        })
        .catch(() => {
          // 【待人工复核】沿用原有行为，不向外抛出异常。
        })
    },
    // 新增要素
    addElement() {
      this.dialogVisible = true
      this.state = '0'
    },
    handleSizeChange(pageSize) {},
    handleCurrentChange(pageNum) {}
  },
  created() {
    this.getList()
  }
}
</script>


<style scoped lang="scss">
.container {
  height: 100%;
  width: 100%;
  padding: 12px;
  .search {
    margin-bottom: 12px;
    border-radius: 4px;
    background-color: #fff;
    .search-header {
      padding: 0 12px;
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e3e5ed;
      .search-title {
        height: 16px;
        font-size: 14px;
        display: flex;
        align-items: center;
        // font-weight: 600;
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
    .advanced-form {
      padding: 0 12px;
      position: relative;
      height: 70px;
      z-index: 10;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      .search-btn {
        text-align: right;
      }
      ::v-deep.el-form-item {
        margin-bottom: 0px !important;
      }
    }
  }
  .table {
    height: calc(100% - 40px - 70px - 12px - 40px);
    .table-buttons {
      padding: 0 16px;
      height: 50px;
      display: flex;
      justify-content: space-between;
      background-color: #fff;
      .left-buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
    .table-main {
      height: calc(100% - 50px);
      .table-operate {
        cursor: pointer;
        margin: 0 2px;
        font-size: 15px;
      }
    }
  }
  .page {
    height: 40px;
    padding: 4px 10px;
    background-color: #fff;
  }
}
</style>




