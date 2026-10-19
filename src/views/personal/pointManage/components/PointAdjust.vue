<template>
  <div class="dialog-container">
    <div class="header">
      <span class="header-title">
        <template>个人客户积分调整</template>
      </span>
      <div class="header-button">
        <el-button @click="saveForm" size="mini" type="primary"> <icon-svg class="btn-icon" icon-class="save"></icon-svg> 保 存</el-button>
        <el-button @click="$emit('update:dialogVisible', false)" size="mini" type="primary" icon="el-icon-back" plain>返 回</el-button>
      </div>
    </div>
    <div class="point-adjust">
      <el-form size="small" :model="form" ref="formData" label-width="100px">
        <el-form-item style="width: 33%" label="客户号">
          <!-- <el-input disabled v-model="form.customerNumber" placeholder="请输入客户号"></el-input> -->
          {{ form.cust_id }}
        </el-form-item>
        <el-form-item style="width: 33%" label="客户名称">
          <!-- <el-input disabled v-model="form.customerName" placeholder="请输入客户姓名"></el-input> -->
          {{ form.cust_name }}
        </el-form-item>
        <el-form-item style="width: 33%" label="客户级别">
          <!-- <el-select disabled style="width: 100%" v-model="form.gradeName">
            <el-option value="" label="全部"></el-option>
          </el-select> -->
          {{ form.cust_level_name }}
        </el-form-item>
        <el-form-item style="width: 33%" label="证件类型">
          <!-- <el-select disabled style="width: 100%" v-model="form.certificateType">
            <el-option value="" label="全部"></el-option>
          </el-select> -->
          {{ form.certificate_type }}
        </el-form-item>
        <el-form-item style="width: 33%" label="证件号码">
          <!-- <el-input disabled v-model="form.certificateNumber" placeholder="请输入证件号码"></el-input> -->
          {{ form.certificate_number }}
        </el-form-item>
        <el-form-item style="width: 33%" label="服务机构">
          <!-- <el-select disabled style="width: 100%" v-model="form.serviceOrganization">
            <el-option value="" label="级别"></el-option>
          </el-select> -->
          {{ form.manage_coms_name }}
        </el-form-item>
        <el-form-item style="width: 33%" label="调整积分种类">
          <el-select filterable style="width: 100%" v-model="formData.type">
            <el-option value="00" label="级别积分"></el-option>
            <el-option value="01" label="消费积分"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item style="width: 33%" label="调整积分数量">
          <!-- <el-select style="width: 100%" v-model="formData.point">
            <el-option value="" label="全部"></el-option>
          </el-select> -->
          <el-input type="text" v-model="formData.point" maxlength="10" show-word-limit> </el-input>
        </el-form-item>
        <el-form-item style="width: 33%; visibility: hidden" label="空白占位">
          <el-select filterable style="width: 100%" v-model="formData.readerDbName">
            <el-option value="" label="全部"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item style="width: 66.5%" label="备注">
          <el-input :rows="5" type="textarea" v-model="formData.comment" maxlength="200" show-word-limit></el-input>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script>
import { integralAdjustment } from 'api/pointManage'
export default {
  data() {
    return {
      formData: {
        point: 0,
        type: '00',
        custId: '',
        // integralChangeType: '',
        comment: ''
      }
    }
  },
  props: ['form'],
  watch: {
    'formData.point'(value) {
      // console.log(value)
      if (value === undefined) {
        this.$nextTick(() => {
          this.formData.point = 0
        })
      }
    }
  },
  // computed: {
  //   pointLength() {
  //     return this.formData.point < 0 ? 11 : 10
  //   }
  // },
  methods: {
    async saveForm() {
      try {
        const params = JSON.parse(JSON.stringify(this.formData))
        const res = await integralAdjustment(params)
        if (res.result) {
          this.$message.success('操作成功')
          this.$emit('updateList')
          this.$emit('update:dialogVisible', false)
        }
      } catch (error) {
        console.log(error)
      }
    }
  },
  created() {
    this.formData.custId = this.form.cust_id
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
    margin-bottom: 12px;
    background-color: #fff;
    line-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
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
  .point-adjust {
    height: calc(100% - 40px - 12px);
    background-color: #fff;
    padding: 10px;
    .el-form {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
    }
  }
}
</style>
