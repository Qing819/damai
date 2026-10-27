// 险种列表
<template>
    <div class="insurance-list-container" v-loading="loading">
        <!-- 搜索区域 -->
        <el-form ref="searchData" :model="searchData" size="mini" class="search-box" inline label-width="100px">
            <div>
                <el-form-item label="险种编码 :">
                    <el-input v-model="searchData.insuranceCode" placeholder="请输入险种编码" clearable></el-input>
                </el-form-item>
                <el-form-item label="险种名称 :">
                    <el-input v-model="searchData.insuranceName" placeholder="请输入险种名称" clearable></el-input>
                </el-form-item>
                <el-form-item label="险种分类一 :">
                    <el-input v-model="searchData.insuranceClassification1" placeholder="请输入险种名称" clearable></el-input>
                </el-form-item>
                <el-form-item label="险种分类二 :">
                    <el-input v-model="searchData.insuranceClassification2" placeholder="请输入险种名称" clearable></el-input>
                </el-form-item>
                <el-form-item label="险种分类三 :">
                    <el-input v-model="searchData.insuranceClassification3" placeholder="请输入险种名称" clearable></el-input>
                </el-form-item>
                <el-form-item label="险种分类四 :">
                    <el-input v-model="searchData.insuranceClassification4" placeholder="请输入险种名称" clearable></el-input>
                </el-form-item>
                <el-button size="mini" type="primary" plain icon="el-icon-search" @click="search">查询</el-button>
            </div>
        </el-form>
        <!-- 列表 -->
        <el-table
            ref="table"
            :data="tableData"
            row-key="code"
            size="small"
            height="50vh">
            <el-table-column label="险种编码" prop="insuranceCode" width="120"></el-table-column>
            <el-table-column label="险种名称" prop="insuranceName" show-overflow-tooltip></el-table-column>
            <el-table-column label="险种分类一" prop="insuranceClassification1" show-overflow-tooltip></el-table-column>
            <el-table-column label="险种分类二" prop="insuranceClassification2" show-overflow-tooltip></el-table-column>
            <el-table-column label="险种分类三" prop="insuranceClassification3" show-overflow-tooltip></el-table-column>
            <el-table-column label="险种分类四" prop="insuranceClassification4" show-overflow-tooltip></el-table-column>
            <el-table-column width="55" fixed="right" align="center">
                <template slot-scope="scope">
                    <el-link
                        :disabled="hasSelectedCode === scope.row.code"
                        type="primary"
                        :underline="false"
                        @click="handleChange(scope.row)"
                    >选择</el-link>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination
            background
            :pager-count="5"
            :page-sizes="[20, 40, 60, 80]"
            :current-page="searchData.pageNum"
            :page-size="searchData.pageSize"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        ></el-pagination>
    </div>
</template>

<script>
import { getInsuranceTypeInfo } from 'api/pointRule/index'

export default {
  props: {
    // 已经选中的，禁止再选择
    hasSelectedCode: {
      type: String,
      default: '',
      required: false
    }
  },
  data() {
    return {
      loading: false,
      searchData: {
        insuranceCode: '',
        insuranceName: '',
        insuranceClassification1: '',
        insuranceClassification2: '',
        insuranceClassification3: '',
        insuranceClassification4: '',
        pageNum: 1,
        pageSize: 20
      },
      tableData: [],
      total: 0
    }
  },
  created() {
    this.getList()
  },
  methods: {
    // 搜索
    search() {
      this.searchData.pageNum === 1 || (this.searchData.pageNum = 1)
      this.$nextTick(() => { this.getList() })
    },

    // 获取列表
    getList() {
      this.loading = true
      getInsuranceTypeInfo(this.searchData).then(res => {
        this.tableData = res.list || []
        this.total = res.total || 0
      }).finally(() => {
        this.loading = false
      })
    },

    // 某行选中改变
    handleChange(row) {
      this.$emit('change', row)
    },

    // 分页 pageSize改变
    handleSizeChange(val) {
      this.searchData.pageSize = val
      this.$nextTick(() => { this.getList() })
    },

    // 分页 pageNum改变
    handleCurrentChange(val) {
      this.searchData.pageNum = val
      this.$nextTick(() => { this.getList() })
    }
  }
}
</script>

<style lang="scss" scoped>
.insurance-list-container{
    height: 100%;
    // padding: 0 10px;
    .search-box{
        display: flex;
        justify-content: space-between;
        padding: 12px 2px 0;
    }
    .tip{
        padding: 0 4px 8px;
        font-size: 13px;
        color: #4E4E4E;
        .el-icon-info{
            color: #6383ff;
            margin-right: 2px;
            font-size: 14px;
        }
        .num{
            color: #6383ff;
            font-weight: 500;
            padding: 0 4px;
        }
        .link{
            vertical-align: baseline;
            margin-left: 15px;
            font-size: 13px;
        }
    }
    .pagination{
        padding: 10px 10px 0;
    }
    ::v-deep.el-link{
        font-size: 12px;
    }
}
</style>
