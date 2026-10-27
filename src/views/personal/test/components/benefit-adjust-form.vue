<template>
  <div class="adjust-form">
    <div class="field-label required">服务权益</div>
    <benefit-adjust-rights v-model="form.selectedBenefits" :catalog="catalog" :regions="regions" :identities="identities" :channels="channels" :hint="editing ? '客户信息不可修改，仅可调整权益申请内容；' : ''" />
    <el-form label-position="top" class="adjust-fields">
      <el-form-item label="权益有效期" required>
        <el-date-picker v-model="form.validEndDate" type="date" value-format="yyyy-MM-dd" :clearable="false" :picker-options="dateOptions" />
        <span class="field-tip">默认为当年年底，可修改；仅支持选择当日及以后的日期</span>
      </el-form-item>
      <el-form-item label="关联保单号"><el-input v-model="form.policyNo" /></el-form-item>
      <el-form-item label="OA流水号" required><el-input v-model="form.oaNo" /></el-form-item>
      <el-form-item label="调整原因" required>
        <el-select v-model="form.reasonCode"><el-option v-for="item in reasons" :key="item.code" :label="item.name" :value="item.code" /></el-select>
      </el-form-item>
      <el-form-item label="详细说明"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
      <el-form-item label="附件上传">
        <input ref="file" class="file-input" type="file" accept=".jpg,.jpeg,.png,.pdf" @change="chooseFile">
        <el-button size="small" :loading="uploading" @click="$refs.file.click()">选择文件</el-button>
        <span class="file-name">{{ form.attachmentName || form.attachment || '未选择文件' }}</span>
        <span class="field-tip">支持 jpg / png / pdf，单文件 ≤ 5MB</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import BenefitAdjustRights from './benefit-adjust-rights'
import { reasons, today } from '../benefit-adjust-model'
export default {
  name: 'BenefitAdjustForm',
  components: { BenefitAdjustRights },
  props: {
    form: { type: Object, required: true },
    catalog: { type: Array, default: () => [] },
    regions: { type: Array, default: () => [] },
    identities: { type: Array, default: () => [] },
    channels: { type: Array, default: () => [] },
    uploading: Boolean,
    editing: Boolean
  },
  data() {
    return {
      reasons,
      dateOptions: { disabledDate: date => date.getTime() < new Date(`${today()}T00:00:00`).getTime() }
    }
  },
  methods: {
    chooseFile(event) {
      const file = event.target.files[0]
      if (file) this.$emit('file-change', file)
      event.target.value = ''
    }
  }
}
</script>

<style scoped>
.field-label { font-size: 14px; color: #5a6472; margin-bottom: 8px; }
.required::before { content: '* '; color: #f56c6c; }
.adjust-fields { margin-top: 18px; }
.adjust-fields ::v-deep .el-form-item__label { line-height: 20px; color: #5a6472; padding-bottom: 6px; font-size: 14px; }
.adjust-fields .el-input, .adjust-fields .el-select { width: 260px; }
.adjust-fields .el-date-editor { width: 160px; }
.adjust-fields ::v-deep .el-input__inner { height: 40px; line-height: 40px; font-size: 14px; }
.adjust-fields .el-form-item:nth-child(2) ::v-deep .el-input__inner,
.adjust-fields .el-form-item:nth-child(3) ::v-deep .el-input__inner { height: 38px; line-height: 38px; }
.adjust-fields .el-textarea { width: 260px; max-width: 100%; }
.adjust-fields ::v-deep .el-textarea__inner { min-height: 78px !important; font-size: 14px; }
.field-tip { margin-left: 10px; color: #98a1ad; font-size: 12px; }
.file-input { display: none; }
.file-name { margin-left: 8px; color: #5a6472; font-size: 14px; overflow-wrap: anywhere; }
</style>
