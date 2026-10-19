<!-- 轨迹查询页面 -->
<template>
  <div class="container">
    <div class="container-header">
      <div class="dialog-header">
        <div class="title">{{`孤单客户再分配机构列表查询`}}</div>
        <div>
          <el-button plain size="small" icon="el-icon-back" @click="$emit('update:trackDialog',false)" type="primary">返回</el-button>
        </div>
      </div>
    </div>
    <el-scrollbar class="scrollbar" >
      <el-table size="small" :data="tableData" max-height="600px" v-loading="loading">
        <el-table-column type="index" width="50" label="序号" align="center" :index="indexMethods"></el-table-column>
        <el-table-column label="客户ID" prop="custId" min-width="100" show-overflow-tooltip></el-table-column>
        <el-table-column label="客户姓名" min-width="80" prop="custName" show-overflow-tooltip></el-table-column>
        <el-table-column label="代理人ID" min-width="80" prop="agentId" show-overflow-tooltip></el-table-column>
        <el-table-column label="代理人姓名" min-width="80" prop="agentName" show-overflow-tooltip></el-table-column>
        <el-table-column label="机构ID" min-width="80" prop="custManage" show-overflow-tooltip></el-table-column>
        <el-table-column label="机构名称" min-width="80" prop="saledeptName" show-overflow-tooltip></el-table-column>
        <el-table-column label="分配开始时间" min-width="100" prop="effectiveTime" show-overflow-tooltip></el-table-column>
        <el-table-column label="强制回收时间" min-width="100" prop="expirationTime" show-overflow-tooltip></el-table-column>
        <el-table-column label="是否成功" min-width="50" prop="state" show-overflow-tooltip>
          <template #default="{row}">
            {{getAuditStatus(row.state)}}
          </template>
        </el-table-column>
        <el-table-column label="原因" min-width="130" prop="exceptionCause" show-overflow-tooltip></el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          :current-page="pageNum"
          :page-sizes="[20, 40, 60, 80]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
        </div>
    </el-scrollbar>
  </div>
</template>

<script>
import {
  orgCodesInformationAgent
} from 'api/pointRedistribution/index'

export default {

  props: {
    // 轨迹查询弹窗
    trackDialog: {
      type: Boolean,
      default: false
    },
    // 轨迹查询行内信息
    fileId: {
      type: String,
      default() {
        return '';
      },
      required: true
    }
  },
  data() {
    return {
      loading: false,
      tableData: [],
      tableHead: [],
      pageNum: 1,
      pageSize: 20,
      total: null
    };
  },
  created() {
    this.getTableData();
  },
  methods: {
    // 序号
    indexMethods(index) {
      return (this.pageNum - 1) * this.pageSize + index + 1
    },
    // 获取轨迹查询表内容
    getTableData() {
      this.loading = true;
      const param = {
        fileId: this.fileId,
        pageNum: this.pageNum,
        pageSize: this.pageSize
      };
      orgCodesInformationAgent(param)
        .then(({ page: { total, list } }) => {
          this.tableData = list;
          this.total = total
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 处理当前页面大小改变
    handleSizeChange(val) {
      this.pageSize = val;
      this.getTableData()
    },

    // 处理当前页更改
    handleCurrentChange(val) {
      this.pageNum = val;
      this.getTableData()
    },
    // 获取表格单元格的内容
    getTableValue(list, code) {
      const value = list.find(e => e.elementCode === code);
      return value ? value.elementValue : '';
    },
    // 获取审核状态  0是false 1是true
    getAuditStatus(state) {
      switch (state) {
        case 0:
          return '否'
        case 1:
          return '是'
        case 2:
          return '审核中'
        default:
          return ''
      }
    }
  }
};
</script>

<style lang="scss" scoped>
$radius: 4px;
/deep/.container .box {
  margin-top: 0;
  padding: 0;
}

.container {
  .scrollbar{
    height:calc(100% - 42px)
  }
  height: 100%;
  .container-header {
    font-size: 14px;
    font-weight: bolder;
  }
  .dialog-header {
    background-color: #fff;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title {
    height: 16px;
    font-size: 12px;
    display: flex;
    align-items: center;
    font-weight: 600;
    &::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 12px;
      border-radius: 1px;
      margin-right: 12px;
      background-color: #6383ff;
    }
  }
  .header {
    background-color: #fff;
    border-radius: $radius;
    padding: 10px;
    display: flex;
    justify-content: space-between;
  }
  /deep/.el-scrollbar__wrap{ overflow-x: hidden; }
}
</style>
