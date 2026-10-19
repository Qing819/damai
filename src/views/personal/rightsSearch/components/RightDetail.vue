<template>
  <div class="dialog-container">
    <div class="header">
      <span class="header-title">个人客户权益详情</span>
      <div class="header-button">
        <!-- <el-button @click="$emit('update:dialogVisible', false)" size="small" type="primary">返 回</el-button> -->
        <el-button type="primary" size="mini" icon="el-icon-back" plain @click="$emit('update:dialogVisible', false)">返 回</el-button>
      </div>
    </div>
    <el-scrollbar class="container-body" v-loading="loading">
      <!-- 客户信息 -->
      <!-- <div class="user-info"> -->
      <!-- <div class="info-item"><span class="info-item-label">客户姓名：</span> 张三</div>
        <div class="info-item"><span class="info-item-label">客户号：</span> 0001</div>
        <div class="info-item"><span class="info-item-label">客户年龄：</span> 35</div>
        <div class="info-item"><span class="info-item-label">客户性别：</span> 男</div>
        <div class="info-item"><span class="info-item-label">客户类型：</span> 普星客户</div>
        <div class="info-item"><span class="info-item-label">所属渠道：</span> 网销</div> -->
      <el-form size="small" :model="currentRow" class="advanced-form" label-width="90px">
        <el-form-item label="客户姓名：">
          {{ currentRow.cust_name }}
        </el-form-item>
        <el-form-item label="客户号：">
          {{ currentRow.cust_id_tm }}
        </el-form-item>
        <el-form-item label="客户年龄：">
          {{ currentRow.cust_age }}
        </el-form-item>
        <el-form-item label="客户性别：">
          {{ currentRow.gender_name }}
        </el-form-item>
        <el-form-item label="客户类型：">
          {{ currentRow.cust_level_name }}
        </el-form-item>
        <el-form-item label="所属渠道：">
          {{ currentRow.sale_chnl }}
        </el-form-item>
      </el-form>
      <!-- </div> -->
      <!-- 权益现状 -->
      <div class="table-box">
        <div class="table-box-title">权益现状</div>
        <el-table :data="equityList" size="small" max-height="400px" v-loading="loading">
          <el-table-column align="center" type="index" label="序号"> </el-table-column>
          <el-table-column align="center" prop="ruleName" label="规则名称" show-overflow-tooltip> </el-table-column>
          <el-table-column align="center" prop="serviceEquityName" label="权益名称" show-overflow-tooltip> </el-table-column>
          <el-table-column align="center" prop="serviceItemDescribe" label="权益描述" show-overflow-tooltip> </el-table-column>
          <el-table-column align="center" prop="originalTimes" label="可使用权益次数" show-overflow-tooltip>
            <template #default="{ row }">
              {{row.originalTimes>=99999?'不限':row.originalTimes}}
            </template>
          </el-table-column>
          <el-table-column align="center" prop="usageTimes" label="已使用权益次数" show-overflow-tooltip> </el-table-column>
          <el-table-column align="center" prop="acquisitionTime" label="获得时间" show-overflow-tooltip></el-table-column>
          <el-table-column align="center" prop="failureTime" label="失效时间" show-overflow-tooltip></el-table-column>
        </el-table>
      </div>
      <!-- 权益轨迹 -->
      <div class="table-box">
        <div class="table-box-title">权益轨迹</div>
        <el-table :data="trajectoryList" size="small" max-height="400px" v-loading="loading">
          <el-table-column align="center" type="index" label="序号"> </el-table-column>
          <el-table-column align="center" prop="incrementAction" label="权益动作" show-overflow-tooltip>
            <template #default="{ row }">
              {{row.incrementAction}}
            </template>`
          </el-table-column>
          <el-table-column align="center" prop="serviceEquityName" label="权益名称" show-overflow-tooltip> </el-table-column>
          <el-table-column align="center" prop="actionContent" label="动作内容" show-overflow-tooltip> </el-table-column>
          <el-table-column align="center" prop="actionTime" label="动作时间" show-overflow-tooltip></el-table-column>
        </el-table>
      </div>
    </el-scrollbar>
  </div>
</template>
<script>
import { getEquityDetail } from 'api/rightsSearch'
export default {
  props: {
    currentRow: Object
  },
  data() {
    return {
      equityList: [],
      trajectoryList: [],
      loading: false
    }
  },
  methods: {
    async getRightsDetail() {
      this.loading = true
      try {
        const res = await getEquityDetail({ custId: this.currentRow.cust_id })
        this.equityList = res.list.equityList
        this.trajectoryList = res.list.trajectList
      } catch (error) {}
      this.loading = false
    }
  },
  created() {
    this.getRightsDetail()
  }
}
</script>

<style  lang='scss' scoped>
$color-primary: #6383ff;
$border-redius: 4px;

.dialog-container {
  height: 100%;
  background-color: #f4f4f4;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: $border-redius;
    margin-bottom: 10px;
    background-color: #fff;
    .header-title {
      color: #29303e;
      &::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 12px;
        border-radius: 2px;
        margin-right: 8px;
        background-color: $color-primary;
      }
    }
  }
  .container-body {
    height: calc(100% - 55px);
    .advanced-form {
      margin-bottom: 10px;
      /deep/.el-form-item {
        background-color: #fff;
        padding: 0px 0px 10px 10px;
        margin: 0;
      }
    }
    .table-box {
      background-color: #fff;
      padding: 10px 20px;
      .table-box-title {
        padding: 15px 0;
        color: #29303e;
      }
      &:last-child {
        padding-bottom: 40px;
      }
    }
  }
}
</style>
