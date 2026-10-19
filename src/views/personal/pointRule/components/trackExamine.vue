<!-- 轨迹查询页面 -->
<template>
  <div class="container">
    <div class="container-header">
      <div class="dialog-header">
        <div class="title">{{`个人${trackInfo.integralName}规则轨迹查询`}}</div>
        <div>
          <el-button plain size="small" icon="el-icon-back" @click="$emit('update:trackDialog',false)" type="primary">返回</el-button>
        </div>
      </div>
    </div>
    <el-scrollbar class="scrollbar">
      <div style="margin-bottom:10px">
        <add-or-edit-rule :integralCode="trackInfo.integralCode" :ruleCode="trackInfo.ruleCode"></add-or-edit-rule>
      </div>
      <el-table size="small" :data="tableData" max-height="400px" v-loading="loading">
        <el-table-column type="index" label="序号"></el-table-column>
        <el-table-column
          show-overflow-tooltip
          min-width="140"
          v-for="(item, i) in tableHead"
          :key="i"
          :label="item.elementName"
        >
          <template #default="{ row }">{{getTableValue(row.elementList,item.elementCode)}}</template>
        </el-table-column>
        <el-table-column label="创建人" prop="creatorUserName" show-overflow-tooltip></el-table-column>
        <el-table-column label="创建时间" min-width="150" prop="createTime" show-overflow-tooltip></el-table-column>
      </el-table>
    </el-scrollbar>
  </div>
</template>

<script>
import addOrEditRule from './addOrEditRule';
import {
  selectIntegrationRuleTrajectoryField,
  selectIntegrationRuleTrajectory
} from 'api/pointRule/index';

export default {
  components: { addOrEditRule },
  props: {
    // 轨迹查询弹窗
    trackDialog: {
      type: Boolean,
      default: false
    },
    // 轨迹查询行内信息
    trackInfo: {
      type: Object,
      default() {
        return {};
      },
      required: true
    }
  },
  data() {
    return {
      loading: false,
      tableData: [],
      tableHead: []
    };
  },
  created() {
    this.getTableHead();
    this.getTableData();
  },
  methods: {
    // 获取轨迹查询表头项
    getTableHead() {
      selectIntegrationRuleTrajectoryField({
        ruleCode: this.trackInfo.ruleCode
      }).then(({ list }) => {
        this.tableHead = list;
      });
    },
    // 获取轨迹查询表内容
    getTableData() {
      this.loading = true;
      selectIntegrationRuleTrajectory({ ruleCode: this.trackInfo.ruleCode })
        .then(({ list }) => {
          this.tableData = list;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 获取表格单元格的内容
    getTableValue(list, code) {
      const value = list.find(e => e.elementCode === code);
      return value ? value.elementValue : '';
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
