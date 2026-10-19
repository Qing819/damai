<template>
  <div class="dialog-container">
    <div class="header">
      <span class="header-title">
        <template>要素编辑</template>
      </span>
      <div class="header-button">
        <el-button v-if="!pageLoading" :loading="saveBtnLaoding" @click="editSave" size="mini" type="primary">
          <icon-svg class="btn-icon" icon-class="save"></icon-svg> 保 存
        </el-button>
        <el-button @click="$emit('update:dialogVisible', false)" size="mini" type="primary" icon="el-icon-back" plain>返 回</el-button>
      </div>
    </div>

    <div class="edit-element" v-loading="pageLoading">
      <el-form @submit.native.prevent size="small" :model="formData" ref="formData" label-width="100px">
        <!-- 下拉框 -->
        <el-form-item label="标签库：">{{ formData.labName }}</el-form-item>
        <el-form-item label="类型：" v-if="formData.elementType === '0'">文本型</el-form-item>
        <el-form-item label="类型：" v-if="formData.elementType === '1'">数字型</el-form-item>
        <el-form-item label="类型：" v-if="formData.elementType === '2'">日期型</el-form-item>
        <el-form-item label="日期格式：" v-if="formData.elementType === '2'">{{formData.elementContent}}</el-form-item>
        <el-form-item label="类型：" v-if="formData.elementType === '3'">维度型</el-form-item>
        <el-form-item label="要素名称：">{{ formData.elementName }}</el-form-item>
        <!-- 数字类型 是否为百分比 -->
        <el-form-item label="是否百分比：" v-if="formData.elementType === '1'">
          <el-switch active-value="00" inactive-value="01" v-model="formData.isPercentage" active-color="#6383ff" inactive-color="#ccc">
          </el-switch>
        </el-form-item>
        <!-- 文本型 数值型 长度 -->
        <el-form-item label="长度：" v-if="['0', '1'].includes(formData.elementType)">
          <el-input style="width: 15%" v-model="formData.elementLength" placeholder="请输入"></el-input>
        </el-form-item>
        <!--  数值型 小数点 -->
        <el-form-item label="小数点：" v-if="['1'].includes(formData.elementType)">
          <el-input style="width: 15%" v-model="formData.elementPoint" placeholder="请输入"></el-input>
        </el-form-item>
        <!-- 分类 -->
        <el-form-item label="分类：">
          <el-select filterable style="width: 15%" v-model="formData.category" placeholder="请选择">
            <el-option value="00" label="通用"></el-option>
            <el-option value="01" label="积分规则专用"></el-option>
            <el-option value="02" label="客户等级专用"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填：">
          <el-switch active-value="01" inactive-value="00" v-model="formData.elementAllowNull" active-color="#6383ff" inactive-color="#ccc">
          </el-switch>
        </el-form-item>
        <el-form-item label="是否唯一：">
          <el-switch active-value="00" inactive-value="01" v-model="formData.elementOnly" active-color="#6383ff" inactive-color="#ccc">
          </el-switch>
        </el-form-item>
        <!-- 维度型内容 -->
        <el-form-item v-if="formData.elementType === '3'" label="下拉选项：">
          <el-tag v-show="item" v-for="(item, index) in contentList" :key="item + index">{{ item }}</el-tag>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script>
import { getIntegralElementDetail, updIntegralElementInfo } from 'api/elementConfig'

export default {
  props: {
    dialogVisible: Boolean,
    currentCode: String
  },
  computed: {
    contentList() {
      if (this.formData.elementType === '3') {
        return this.formData.elementContent.split(',')
      } else {
        return []
      }
    }
  },
  data() {
    return {
      formData: {},
      saveBtnLaoding: false,
      pageLoading: false
    }
  },
  methods: {
    // 获取要素详情 编辑回显
    async getDetail() {
      try {
        this.pageLoading = true
        const { result } = await getIntegralElementDetail({ code: this.currentCode })
        this.formData = result
      } catch (error) {}
      this.pageLoading = false
    },
    async editSave() {
      const params = {
        code: this.currentCode,
        elementAllowNull: this.formData.elementAllowNull,
        elementOnly: this.formData.elementOnly
      }
      this.formData.isPercentage && (params.isPercentage = this.formData.isPercentage)
      this.formData.elementLength && (params.elementLength = this.formData.elementLength)
      this.formData.elementPoint && (params.elementPoint = this.formData.elementPoint)
      this.formData.category && (params.category = this.formData.category)

      try {
        this.saveBtnLaoding = true
        const { status } = await updIntegralElementInfo(params)
        if (status) {
          this.$message.success('操作成功')
          this.$emit('update:dialogVisible', false)
          this.$emit('updateList')
        }
      } catch (error) {}
      this.saveBtnLaoding = false
    }
  },
  created() {
    this.getDetail()
  }
}
</script>

<style  lang='scss' scoped>
$border-radius: 4px;

.dialog-container {
  height: 100%;
  background-color: #f4f4f4;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    // height: 40px;
    margin-bottom: 10px;
    background-color: #fff;
    // line-height: 50px;
    border-radius: $border-radius;
    .header-title {
      display: flex;
      align-items: center;
      font-size: 14px;
      // font-weight: 600;
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
  .edit-element {
    height: calc(100% - 45px - 10px);
    background-color: #fff;
    padding: 15px 10px;
    border-radius: $border-radius;
    .el-tag {
      margin-right: 10px;
    }
    ::v-deep.el-form-item{
      margin-bottom: 12px;
    }
  }
}
</style>
