// 测算积点表单
<template>
    <div>
        <el-form
            :model="integralForm"
            ref="integralForm"
            label-position="right"
            size="small">
            <div class="form-items-box">
                <el-form-item
                    v-for="(cfgItem, cfgIndex) in elements"
                    :key="'integral' + cfgItem.elementCode"
                    :label="cfgItem.elementName + ' :'"
                    :label-width="getLabelWidth(elements)"
                    :prop="'elements.' + cfgIndex + '.value'"
                    :rules="{
                        required: cfgItem.isPrimaryKey === '00',
                        message: '该项为必填项!',
                        trigger: 'blur'
                    }">
                    <!-- 当险种名称和险种编码同时存在时，险种名称特殊处理 -->
                      <div
                        v-if="hasInsuranceNameAndCode && cfgItem.elementCode === 'a7J6RT44'"
                        class="likeness-input"
                        @click="showInsuranceList(integralForm.elements[cfgIndex].value)">
                        <div v-show="!integralForm.elements[cfgIndex].value" class="one-line placeholder-text">
                          请选择
                        </div>
                        <div v-show="integralForm.elements[cfgIndex].value" class="one-line" :title="integralForm.elements[cfgIndex].value">
                          {{ integralForm.elements[cfgIndex].value }}
                        </div>
                      </div>

                    <!-- 当险种名称和险种编码同时存在时，险种编码特殊处理 insuranceCode存放的是codeKey  value存放的是code-->
                    <div
                      v-else-if="hasInsuranceNameAndCode && cfgItem.elementCode === 'D9eVGr7P'"
                      class="likeness-input"
                      @click="showInsuranceList(integralForm.elements[cfgIndex].value)">
                      <div v-show="!integralForm.elements[cfgIndex].value" class="one-line placeholder-text">
                        请选择
                      </div>
                      <div v-show="integralForm.elements[cfgIndex].value" class="one-line" :title="integralForm.elements[cfgIndex].value">
                        {{ integralForm.elements[cfgIndex].value }}
                      </div>
                    </div>

                    <!-- 险种编码和险种名称同时存在，并且存在险种分类1，2，3，4其中任意一个做特殊处理 -->
                    <div  v-else-if="hasInsuranceNameAndCode && (cfgItem.elementName === '险种分类一' || cfgItem.elementName === '险种分类二' || cfgItem.elementName === '险种分类三' || cfgItem.elementName === '险种分类四')">
                      <form-item  v-model="integralForm.elements[cfgIndex].value" :elementConfig="cfgItem" :disabled="true"></form-item>
                    </div>

                    <!-- 正常状态 -->
                    <form-item
                        v-else
                        v-model="integralForm.elements[cfgIndex].value"
                        :elementConfig="cfgItem"
                        size="small">
                    </form-item>
                </el-form-item>
            </div>
        </el-form>

        <template v-if="elements.length > 0">
            <el-button
                type="success"
                icon="el-icon-plus"
                size="mini"
                plain
                style="margin-bottom: 10px"
                :loading="addTrLoading"
                @click="addTr">
                添 加
            </el-button>

            <!-- 保费积分配置列表 -->
            <premium-table ref="premiumTable" :columnSetting="elements" :premiumIntegralCode="premiumIntegralCode"></premium-table>
        </template>

        <el-button
            type="success"
            icon="el-icon-plus"
            size="mini"
            plain
            style="margin: 20px 0"
            @click="dialogVisible = true">
            添加积分类型
        </el-button>

        <!-- 其它积分类型 -->
        <integral-type-form
            v-for="checkedItem in checkedIntegralTypesObj"
            :key="checkedItem.integralCode"
            :ref="'integralTypeFrom' + checkedItem.integralCode"
            :integralCode="checkedItem.integralCode">
        </integral-type-form>

        <div class="row-box footer">
            <el-popconfirm
                confirmButtonText='是'
                cancelButtonText='否'
                icon="el-icon-info"
                title="此操作将重置表单数据以及清空测算结果，确定清空吗？"
                @confirm="handleReset">
                <el-button size="small" slot="reference" style="margin-right: 10px">
                    清 空
                </el-button>
            </el-popconfirm>
            <el-button
                size="small"
                type="primary"
                :loading="calculateLoading"
                :disabled="calculateLoading"
                @click="handleCalculate('y')"
            > 测 算 年 缴</el-button>
            <el-button
              size="small"
              type="primary"
              :loading="calculateLoading"
              :disabled="calculateLoading"
              @click="handleCalculate('s')"
            > 测 算 季 缴</el-button>
            <el-button
              size="small"
              type="primary"
              :loading="calculateLoading"
              :disabled="calculateLoading"
              @click="handleCalculate('m')"
            > 测 算 月 缴</el-button>
        </div>

        <!-- 测算结果表格 -->
        <calculate-table
            v-if="calculateTableHeader.length > 0"
            :tableHeader="calculateTableHeader"
            :tableData="calculateTableData">
        </calculate-table>

        <!-- 弹窗-添加积分类型  -->
        <el-dialog
            v-if="dialogVisible"
            class="dialog"
            title="添加积分类型"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :visible.sync="dialogVisible"
            :before-close="closeDialog">
            <div style="padding: 20px 20px 30px">
                <el-checkbox-group v-model="temporaryCheckedPointTypes">
                    <el-checkbox
                        v-for="item in canSelectedIntegralTypes"
                        :key="item.integralCode"
                        :label="item.integralName"
                        :disabled="item.integralName === '保费积分'"
                    ></el-checkbox>
                </el-checkbox-group>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button size="small" @click="closeDialog">取 消</el-button>
                    <el-button size="small" type="primary" @click="saveCheckedPointTypes">确 定</el-button>
                </div>
            </template>
        </el-dialog>
        <!-- 弹窗-险种列表 -->
        <el-dialog
            v-if="insuranceListVisible"
            :visible.sync="insuranceListVisible"
            top="10vh"
            title="险种编码"
            width="80%"
            modal-append-to-body
            append-to-body>
            <insurance-list :hasSelectedCode="currSet" @change="changeInsuranceName"></insurance-list>
        </el-dialog>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import formItem from 'components/formItem'
import insuranceList from 'components/insuranceList'
import premiumTable from './premiumTable'
import integralTypeForm from './integralTypeForm'
import calculateTable from '../calculateTable'

import { getLabelWidth } from '../../consts/index'
import { integralNamesOfCalculate } from '../../consts/index'

import { getIntegralCalculateListHeader, getIntegralCalculateData, getRuleCode } from 'api/pointCalculate/index'

export default {
  components: { formItem, premiumTable, integralTypeForm, calculateTable, insuranceList },
  props: {
    // 测算积分要素配置列表
    elements: {
      type: Array,
      default: () => [],
      required: false
    },
    // 保费积分code
    premiumIntegralCode: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      calculateLoading: false,
      addTrLoading: false,
      integralForm: {
        elements: []
      },

      // 弹窗：是否显示
      dialogVisible: false,
      // 弹窗：临时选中的积分类型
      temporaryCheckedPointTypes: [],
      // 弹窗：确定选中的积分类型
      checkedIntegralTypes: [],
      // 测算结果表头
      calculateTableHeader: [],
      // 测算结果数据
      calculateTableData: [],
      // 当前选中配置的行列号以及险种code
      currSet: '',
      insuranceListVisible: false
    }
  },
  computed: {
    ...mapGetters(['integrationTypeList']),

    // 弹窗确认选中的积分类型对象集合
    checkedIntegralTypesObj() {
      return this.checkedIntegralTypes.map(integralName => this.integrationTypeList.find(item => item.integralName === integralName))
    },

    // 可选择的积分类型集合
    canSelectedIntegralTypes() {
      return this.integrationTypeList.filter(item => integralNamesOfCalculate.includes(item.integralName))
    },

    // 是否同时存在"险种名称"和"险种编码"
    hasInsuranceNameAndCode() {
      const hasInsuranceName = this.elements.some(item => item.elementCode === 'a7J6RT44')
      const hasInsuranceCode = this.elements.some(item => item.elementCode === 'D9eVGr7P')

      return hasInsuranceName && hasInsuranceCode
    },

    // 险种code
    insuranceCode() {
      return cfgIndex => {
        const insuranceCodeElement = this.ruleList[cfgIndex].find(item => item.elementCode === 'D9eVGr7P')
        return insuranceCodeElement.value
      }
    }
  },
  watch: {
    elements: {
      handler() {
        // 配置保费积分的方案测算表单项
        this.elements.forEach(item => {
          this.integralForm.elements.push({
            code: item.elementCode,
            value: ''
          })
        })
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    // 显示险种选中弹窗
    showInsuranceList(code) {
      this.currSet = code
      this.insuranceListVisible = true
    },

    // 险种编码选中数据改变
    changeInsuranceName(data) {
      const insuranceNameElement = this.integralForm.elements.find(item => item.code === 'a7J6RT44')
      const insuranceCodeElement = this.integralForm.elements.find(item => item.code === 'D9eVGr7P')
      let insuranceClassElement1 = this.elements.find(item => item.elementName === '险种分类一')
      insuranceClassElement1 ? insuranceClassElement1 = this.integralForm.elements.find(item => item.code === insuranceClassElement1.elementCode) : ''

      let insuranceClassElement2 = this.elements.find(item => item.elementName === '险种分类二')
      insuranceClassElement2 ? insuranceClassElement2 = this.integralForm.elements.find(item => item.code === insuranceClassElement2.elementCode) : ''

      let insuranceClassElement3 = this.elements.find(item => item.elementName === '险种分类三')
      insuranceClassElement3 ? insuranceClassElement3 = this.integralForm.elements.find(item => item.code === insuranceClassElement3.elementCode) : ''

      let insuranceClassElement4 = this.elements.find(item => item.elementName === '险种分类四')
      insuranceClassElement4 ? insuranceClassElement4 = this.integralForm.elements.find(item => item.code === insuranceClassElement4.elementCode) : ''

      // 险种名称赋值
      insuranceNameElement.value = data.insuranceName
      // 险种编码赋值
      insuranceCodeElement.value = data.insuranceCode
      // 险种分类1赋值
      insuranceClassElement1 ? insuranceClassElement1.value = data.insuranceClassification1 : ''
      // 险种分类2赋值
      insuranceClassElement2 ? insuranceClassElement2.value = data.insuranceClassification2 : ''
      // 险种分类3赋值
      insuranceClassElement3 ? insuranceClassElement3.value = data.insuranceClassification3 : ''
      // 险种分类4赋值
      insuranceClassElement4 ? insuranceClassElement4.value = data.insuranceClassification4 : ''
      this.insuranceListVisible = false
    },

    // 方案测算添加一行保费积分配置
    addTr() {
      this.$refs.integralForm.validate(valid => {
        if (!valid) { return }

        // 复制一份数据，防止数据污染
        const integralFormElesCopy = JSON.parse(JSON.stringify(this.integralForm.elements))

        // 表格添加一行
        this.addTrLoading = true
        this.$refs.premiumTable.addTr(
          integralFormElesCopy,
          () => {
            // 清空保费积分表单
            integralFormElesCopy.forEach(item => { item.value = '' })
            this.integralForm.elements = integralFormElesCopy
          },
          () => {
            this.addTrLoading = false
          }
        )
      })
    },

    // 保存选中的积分类型
    saveCheckedPointTypes() {
      this.checkedIntegralTypes = JSON.parse(JSON.stringify(this.temporaryCheckedPointTypes))
      this.dialogVisible = false
    },

    // 关闭弹窗
    closeDialog() {
      this.temporaryCheckedPointTypes = JSON.parse(JSON.stringify(this.checkedIntegralTypes))
      this.dialogVisible = false
    },

    // 测算
    async handleCalculate(type) {
      if (!this.validateData()) { return }

      // 统计保费积分配置数据
      const premiumIntegralTypeList = this.$refs.premiumTable.getTableData()

      // 统计其它积分类型数据
      const otherIntegralTypesList = {}
      this.checkedIntegralTypesObj.forEach(item => {
        otherIntegralTypesList[item.integralName] = {
          infos: [this.$refs['integralTypeFrom' + item.integralCode][0]?.getFormData()],
          integralCode: item.integralCode
        }
      })

      // 合并
      const marginObj = {
        ...{
          保费积分: {
            infos: premiumIntegralTypeList,
            integralCode: this.premiumIntegralCode
          }
        },
        ...otherIntegralTypesList
      }

      this.calculateLoading = true
      await getIntegralCalculateListHeader(marginObj)
        .then(res => {
          this.calculateTableHeader = res.list || []
        })
      getIntegralCalculateData(marginObj, type)
        .then(res => {
          this.calculateTableData = res.list || []
        })
        .finally(() => {
          this.calculateLoading = false
        })
    },

    // 校验表单数据
    validateData() {
      let validateResult = true

      // 保费积分配置项至少需要有一条
      const premiumList = this.$refs.premiumTable.getTableData() || []
      if (premiumList.length < 1) {
        this.$message({
          type: 'error',
          message: '请至少配置一条保费积分数据！',
          duration: 2000
        })
        return false
      }

      // 保费积分配置数校验通过，再循环校验其它积分类型
      this.checkedIntegralTypesObj.forEach(item => {
        if (validateResult && this.$refs['integralTypeFrom' + item.integralCode][0]) {
          validateResult = this.$refs['integralTypeFrom' + item.integralCode][0].validateForm()
        }
      })

      return validateResult
    },

    // 重置清空
    handleReset() {
      this.$refs.integralForm.resetFields()
      this.$refs.premiumTable.clearTableData()
      this.checkedIntegralTypes = []
      this.calculateTableHeader = []
      this.calculateTableData = []
    },

    getLabelWidth(columnSetting) {
      return getLabelWidth(columnSetting)
    }
  }
}
</script>

<style lang="scss" scoped>
.form-items-box{
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.likeness-input{
    width: 178px;
    height: 28px;
    line-height: 28px;
    border-radius: 4px;
    border: 1px solid #DCDFE6;
    color: #606266;
    padding: 0 12px;
    font-size: 12px;
    cursor: pointer;
    .placeholder-text{
      color: #C0C4CC;
    }
    &:hover{
      border-color: #C0C4CC;
    }
  }

// 表单项给定宽度：解决input输入框带后缀时，对不齐的问题
/deep/.el-form-item{
    // width: 260px;
    margin: 0 25px 15px 0;
}
.footer{
    text-align: center;
    margin-top: 20px;
}
.dialog{
    /deep/.el-checkbox{
        margin-bottom: 10px;
    }
}
</style>
