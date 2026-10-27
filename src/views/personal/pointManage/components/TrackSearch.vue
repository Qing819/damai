<template>
  <div class="dialog-container">
    <div class="header">
      <span class="header-title">
        <template>个人客户积分轨迹查询</template>
      </span>
      <div class="header-button">
        <el-button
          type="primary"
          size="mini"
          :icon="exportPending ? `el-icon-loading` : `el-icon-upload2`"
          :disabled="exportPending"
          @click="handleExport">
          导 出
        </el-button>
        <el-button type="primary" size="mini" icon="el-icon-back" plain @click="$emit('update:dialogVisible', false)">返 回</el-button>
      </div>
    </div>
    <div class="track-search">
      <el-form size="small" :model="form" ref="formData" label-width="80px" class="top-form">
        <el-form-item style="width: 33%" label="客户号">
          <!-- <el-input disabled v-model="form.cust_id" placeholder="请输入客户号"></el-input> -->
          {{ form.cust_id }}
        </el-form-item>
        <el-form-item style="width: 33%" label="客户名称">
          <!-- <el-input disabled v-model="form.cust_name" placeholder="请输入客户姓名"></el-input> -->
          {{ form.cust_name }}
        </el-form-item>
        <el-form-item style="width: 33%" label="客户级别">
          <!-- <el-select disabled style="width: 100%" v-model="form.cust_level_name">
            <el-option value="" label="全部"></el-option>
          </el-select> -->
          {{ form.cust_level_name }}
        </el-form-item>
        <el-form-item style="width: 33%" label="证件类型">
          <!-- <el-select disabled style="width: 100%" v-model="form.certificate_type">
            <el-option value="" label="全部"></el-option>
          </el-select> -->
          {{ form.certificate_type }}
        </el-form-item>
        <el-form-item style="width: 33%" label="证件号码">
          <!-- <el-input disabled v-model="form.certificate_number" placeholder="请输入证件号码"></el-input> -->
          {{ form.certificate_number }}
        </el-form-item>
        <el-form-item style="width: 33%" label="服务机构">
          <!-- <el-select disabled style="width: 100%" v-model="form.manage_coms_name">
            <el-option value="" label="全部"></el-option>
          </el-select> -->
          {{ form.manage_coms_name }}
        </el-form-item>
      </el-form>
      <div class="table">
        <el-form size="small" ref="formData" label-width="80px" class="table-form">
          <el-form-item style="width: 100%" label-width="0px">
            <el-radio-group size="small" v-model="formData.integralType" @change="changeIntegralType">
              <el-radio label="00">级别积分</el-radio>
              <el-radio label="01">消费积分</el-radio>
              <el-radio label="02">级别变化</el-radio>
            </el-radio-group>
          </el-form-item>

          <div class="date" >
            <el-form-item style="width: 33%" label="开始时间">
              <el-date-picker
                style="width: 100%"
                v-model="formData.startTime"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss "
                placeholder="选择日期"
                :picker-options="startDateOption"
              >
              </el-date-picker>
            </el-form-item>
            <el-form-item style="width: 33%" label="结束时间">
              <el-date-picker
                style="width: 100%"
                v-model="formData.endTime"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss "
                placeholder="选择日期"
                :picker-options="endDateOption"
              >
              </el-date-picker>
            </el-form-item>
            <el-form-item style="width: 33%" label="变化类型" v-if="formData.integralType === '02'">
              <el-select filterable v-model="changeType" size="small" style="width: 50%">
                <el-option label="全部" value=""></el-option>
                <el-option label="升级" value="升级"></el-option>
                <el-option label="降级" value="降级"></el-option>
              </el-select>

            </el-form-item>
            <!-- <div class="change" v-if="formData.integralType === '03'">
            </div> -->

          </div>
        </el-form>
        <div class="table-main">
          <el-table
            v-if="this.formData.integralType === '00' || this.formData.integralType === '01'"
            size="mini"
            height="100%"
            :data="tableData"
            style="width: 100%"
            v-loading="tableLoading">
            <el-table-column align="center" type="index" label="序号"> </el-table-column>
            <el-table-column align="center" prop="adjustmentType" label="积分调整类型"> </el-table-column>
            <el-table-column align="center" prop="point" label="积分变化"> </el-table-column>
            <el-table-column align="center" prop="pointNum" label="变动后级别积分" v-if="formData.integralType == '00'"></el-table-column>
            <el-table-column align="center" prop="pointNum" label="变动后消费积分" v-if="formData.integralType == '01'"></el-table-column>
            <el-table-column align="center" prop="operate" label="操作人"></el-table-column>
            <el-table-column align="center" prop="operateTime" label="操作时间"></el-table-column>
            <el-table-column align="center" prop="comment" label="备注"></el-table-column>
          </el-table>
          <el-table
            v-else-if="this.formData.integralType === '02'"
            size="mini"
            height="100%"
            :data="tableData"
            style="width: 100%"
            v-loading="tableLoading">
            <el-table-column align="center" type="index" label="序号"></el-table-column>
            <el-table-column align="center" prop="logType" label="变化类型"></el-table-column>
            <el-table-column align="center" prop="oldLevel" label="变化前级别"></el-table-column>
            <el-table-column align="center" prop="newLevel" label="变化后级别"></el-table-column>
            <el-table-column align="center" prop="operateTime" label="变化时间"></el-table-column>
            <el-table-column align="center" prop="comment" label="备注"></el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  customerIntegrationTrajectoryInfo,
  exportCustomerIntegrationTrajectory
} from 'api/pointManage'
import { exportFilePost } from 'utils/exportFile';

export default {
  data() {
    return {
      tableLoading: false,
      info: {},
      formData: {
        custId: '',
        endTime: '',
        integralType: '00',
        startTime: ''
      },
      tableData: [],
      changeType: '',
      start: '',
      end: '',
      startDateOption: {
        disabledDate: startDate => this.formData.endTime ? new Date(startDate) >= new Date(this.formData.endTime) : false
      },
      endDateOption: {
        disabledDate: endDate => this.formData.startTime ? new Date(endDate) <= new Date(this.formData.startTime) : false
      },
      exportPending: false
    }
  },
  watch: {
    'formData.startTime'(value) {
      if (value && this.formData.endTime) {
        this.getTrackList()
      }
    },
    'formData.endTime'(value) {
      if (value && this.formData.startTime) {
        this.getTrackList()
      }
    },
    changeType(_) {
      this.getTrackList()
    }

  },
  props: ['form'],
  methods: {
    async getTrackList() {
      this.tableLoading = true
      try {
        const params = JSON.parse(JSON.stringify(this.formData))
        const res = await customerIntegrationTrajectoryInfo(params)
        if (this.changeType) {
          this.tableData = res.list.filter(item => item.logType === this.changeType)
        } else {
          this.tableData = res.list
        }
        this.tableLoading = false
      } catch (error) {
        this.tableLoading = false
      }
    },
    changeIntegralType() {
      if ((this.formData.startTime && this.formData.endTime) || (!this.formData.startTime && !this.formData.endTime)) {
        this.getTrackList()
      }
    },

    // 导出
    handleExport() {
      this.exportPending = true;
      exportCustomerIntegrationTrajectory(this.formData).then(res => {
        exportFilePost('个人客户积分轨迹文件', res)
      }).finally(() => {
        this.exportPending = false;
      })
    }
  },
  created() {
    this.formData.custId = this.form.cust_id

    this.getTrackList()
  }
}
</script>

<style  lang='scss' scoped>
.dialog-container {
  height: 100%;
  background-color: #f4f4f4;
  .header {
    padding: 0 10px;
    height: 40px;
    margin-bottom: 10px;
    background-color: #fff;
    line-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    border-radius: 4px;
    .header-title {
      display: flex;
      align-items: center;
      color: #29303e;
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
  .track-search {
    height: calc(100% - 40px - 12px);
    .top-form {
      height: 120px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      background-color: #fff;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .table {
      height: calc(100% - 120px - 12px);
      background-color: #fff;
      padding: 20px;
      border-radius: 4px;
      .table-form {
        height: 90px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        .date {
          display: flex;
        }
      }
      .table-main {
        height: calc(100% - 90px);
      }
    }
  }
}

</style>
