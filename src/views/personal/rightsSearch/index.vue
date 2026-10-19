<template>
  <div class="container">
    <!-- 搜索区域 -->
    <div class="search">
      <div class="search-header">
        <span class="search-title">个人客户权益查询</span>
      </div>
      <el-form size="small" :model="formData" class="advanced-form" ref="formData" label-width="90px">
        <el-form-item style="width: 25%" label="客户类型" prop="custLevel">
          <el-select filterable clearable style="width: 100%" v-model="formData.custLevel">
            <el-option label="全部" value=""></el-option>
            <el-option :value="item.ruleCode" :label="item.gradeName" v-for="item in custLevelList" :key="item.ruleCode"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item style="width: 25%" label="所属渠道" prop="saleChnl">
          <el-select filterable clearable style="width: 100%" v-model="formData.saleChnl">
            <el-option label="全部" value=""></el-option>
            <el-option :value="item.label" :label="item.label" v-for="item in saleChnlList" :key="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item style="width: 25%" label="服务机构" prop="manageComs">
          <el-select filterable clearable style="width: 100%" v-model="formData.manageComs">
            <el-option label="全部" value=""></el-option>
            <el-option :value="item.value" :label="item.label" v-for="item in manageComs" :key="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item style="width: 25%" label="客户号" prop="custId">
          <el-input v-model="formData.custId" placeholder="请输入客户号"></el-input>
        </el-form-item>
        <el-form-item style="width: 25%" label="客户姓名" prop="custName">
          <el-input v-model="formData.custName" placeholder="请输入客户姓名"></el-input>
        </el-form-item>
        <el-form-item style="width: 25%" label="证件类型" prop="certificateType">
          <el-select filterable clearable style="width: 100%" v-model="formData.certificateType">
            <el-option label="全部" value=""></el-option>
            <el-option :value="item.label" :label="item.label" v-for="item in certificateTypeList" :key="item.label"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item style="width: 25%" label="证件号码" prop="certificateNumber">
          <el-input v-model="formData.certificateNumber" placeholder="请输入证件号码"></el-input>
        </el-form-item>
        <el-form-item style="width: 25%" label="手机号" prop="phoneNumber">
          <el-input v-model="formData.phoneNumber" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item style="width: 50%" class="search-btn">
          <el-button type="primary" icon="el-icon-refresh" plain @click="handleReset">重置</el-button>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 表格区域 -->
    <div class="table">
      <div class="table-buttons">
        <el-button size="mini" type="primary" @click="handleExport" icon="el-icon-download"> 清单导出 </el-button>
      </div>
      <el-table size="small" v-loading="tableLoading" height="calc(100% - 50px - 40px)" :data="tableData">
        <el-table-column align="center" type="index" label="序号" :index="indexMethods"> </el-table-column>
        <el-table-column prop="cust_level_name" label="客户类型" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="cust_id_tm" label="客户号" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="cust_name" label="客户姓名" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="phone_number" label="手机号" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="certificate_type" label="证件类型" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="certificate_number" label="证件号码" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="cust_age" label="客户年龄" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="gender_name" label="客户性别" show-overflow-tooltip> </el-table-column>
        <el-table-column prop="sale_chnl" label="所属渠道" show-overflow-tooltip></el-table-column>
        <el-table-column prop="manage_coms_name" label="机构" min-width="100" show-overflow-tooltip></el-table-column>
        <el-table-column fixed="right" align="center" label="操作" min-width="80">
          <template #default="{ row }">
            <el-button size="small" type="text" @click="rightDetail(row)" >权益详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页区域 -->
    <div class="page">
      <el-pagination
        :disabled="tableLoading"
        :page-sizes="[20, 40, 60, 80]"
        :current-page.sync="formData.pageNum"
        :page-size.sync="formData.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        background
        @size-change="getRightsList"
        @current-change="getRightsList"
      ></el-pagination>
    </div>
    <!-- 详情 -->
    <el-dialog v-if="dialogVisible" fullscreen :modal="false" :visible.sync="dialogVisible" :show-close="false">
      <Right-Detail :currentRow="currentRow" :dialogVisible.sync="dialogVisible"></Right-Detail>
    </el-dialog>
  </div>
</template>

<script>
import RightDetail from './components/RightDetail'
import { getEquityPageInfo, exportEquityInfo, getGradeName } from 'api/rightsSearch'
import { exportFileGet } from 'utils/exportFile'
import { getBaseDictByType } from 'api/auth'

export default {
  components: { RightDetail },
  data() {
    return {
      tableLoading: false,
      // 表格数据
      tableData: [],
      // 表单数据
      formData: {
        custLevel: '',
        saleChnl: '',
        custName: '',
        custId: '',
        manageComs: '',
        certificateNumber: '', // 证件号码
        certificateType: '', // 证件类型
        phoneNumber: '', // 手机号
        pageNum: 1,
        pageSize: 20
      },
      saleChnlList: [],
      total: 0,
      dialogVisible: false,
      currentRow: {},
      custLevelList: [],
      manageComs: [],
      certificateTypeList: []// 证件类型列表
    }
  },
  methods: {
    // 序号
    indexMethods(index) {
      return (this.formData.pageNum - 1) * this.formData.pageSize + index + 1
    },
    // 获取列表
    async getRightsList() {
      this.tableLoading = true
      try {
        const res = await getEquityPageInfo(this.formData)
        this.tableData = res.list.list
        this.total = res.list.total
      } catch (error) {}
      this.tableLoading = false
    },
    async getBaseDictByType() {
      try {
        // 获取所属渠道
        const res = await getBaseDictByType({ dictType: 'channel' })
        this.saleChnlList = res.respStr
        // 获取证件类型
        const res1 = await getBaseDictByType({ dictType: 'document_type' })
        this.certificateTypeList = res1.respStr
        // 获取所属机构
        const res2 = await getBaseDictByType({ dictType: 'manage_coms_code' })
        this.manageComs = res2.respStr
      } catch (error) {
        console.log(error)
      }
    },
    // 获取客户级别
    async getGradeName() {
      try {
        const res = await getGradeName()
        this.custLevelList = res.list
      } catch (error) {
        console.log(error)
      }
    },

    // 处理查询
    handleSearch() {
      this.formData.pageNum = 1
      this.getRightsList()
    },
    // 处理重置
    handleReset() {
      this.$refs.formData.resetFields()
      this.$nextTick(() => {
        this.getRightsList()
      })
    },
    // 权益详情
    rightDetail(row) {
      this.currentRow = row
      this.dialogVisible = true
      console.log(row)
    },
    // 清单导出
    async handleExport() {
      try {
        const form = JSON.parse(JSON.stringify(this.formData))
        delete form.pageNum
        delete form.pageSize
        const res = await exportEquityInfo(form)
        await exportFileGet(res, '清单')
      } catch (error) {
        console.log(error)
      }
    }
  },
  created() {
    this.getBaseDictByType()
    this.getGradeName()
    this.getRightsList()
  }
}
</script>


<style scoped lang="scss">
.container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  .search {
    margin-bottom: 10px;
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
        display: flex;
        align-items: center;
        font-size: 14px;
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
      padding: 15px 12px 3px;
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      .search-btn {
        text-align: right;
      }
      /deep/.el-form-item {
        padding-bottom: 12px;
        margin: 0;
      }
    }
  }
  .table {
    flex: 1;
    // height: calc(100% - 203px); // 100% - 149px - 10px - 44px
    background-color: #fff;
    border-radius: 4px 4px 0 0;
    .table-buttons {
      padding: 10px 16px;
    }
  }
  .page {
    position: fixed;
    left: 10px;
    bottom: 10px;
    height: 40px;
    padding: 4px;
    background-color: #fff;
  }
}
</style>




