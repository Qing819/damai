// 方案测算
<template>
    <div>
        <el-form
            ref="planForm"
            :model="planForm"
            :label-width="getLabelWidth(elements)"
            label-position="right"
            size="small">
            <div class="form-items-box">
                <el-form-item
                    v-for="(cfgItem, cfgIndex) in elements"
                    :key="'plan' + cfgItem.elementCode"
                    :label="cfgItem.elementName + ' :'"
                    :prop="'elements.' + cfgIndex + '.value'"
                    :rules="{
                        required: cfgItem.isPrimaryKey === '00',
                        message: '该项为必填项!',
                        trigger: 'change'
                    }">
                    <!-- 当险种名称和险种编码同时存在时，险种名称特殊处理 -->
                    <div
                      v-if="hasInsuranceNameAndCode && cfgItem.elementCode === 'a7J6RT44'"
                      class="likeness-input"
                      @click="showInsuranceList(planForm.elements[cfgIndex].value)">
                      <div v-show="!planForm.elements[cfgIndex].value" class="one-line placeholder-text">
                        请选择
                      </div>
                      <div v-show="planForm.elements[cfgIndex].value" class="one-line" :title="planForm.elements[cfgIndex].value">
                        {{ planForm.elements[cfgIndex].value }}
                      </div>
                    </div>

                  <!-- 当险种名称和险种编码同时存在时，险种编码特殊处理 -->
                  <div
                    v-else-if="hasInsuranceNameAndCode && cfgItem.elementCode === 'D9eVGr7P'"
                    class="likeness-input"
                    @click="showInsuranceList(planForm.elements[cfgIndex].value)">
                    <div v-show="!planForm.elements[cfgIndex].value" class="one-line placeholder-text">
                      请选择
                    </div>
                    <div v-show="planForm.elements[cfgIndex].value" class="one-line" :title="planForm.elements[cfgIndex].value">
                      {{ planForm.elements[cfgIndex].value }}
                    </div>
                  </div>

                  <!-- 险种编码和险种名称同时存在，并且存在险种分类1，2，3，4其中任意一个做特殊处理 -->
                    <div  v-else-if="hasInsuranceNameAndCode && (cfgItem.elementName === '险种分类一' || cfgItem.elementName === '险种分类二' || cfgItem.elementName === '险种分类三' || cfgItem.elementName === '险种分类四')">
                    <form-item  v-model="planForm.elements[cfgIndex].value" :elementConfig="cfgItem" :disabled="true"></form-item>
                    </div>

                    <!-- 正常状态 -->
                    <form-item
                        v-else
                        v-model="planForm.elements[cfgIndex].value"
                        :elementConfig="cfgItem"
                        size="small">
                    </form-item>
                </el-form-item>

                <el-form-item
                    label="所需积分 :"
                    prop="integralNum"
                    :rules="{
                        required: true,
                        message: '该项为必填项!',
                        trigger: 'change'
                    }">
                    <el-input-number
                        v-model="planForm.integralNum"
                        :min="0"
                        :controls="false"
                        placeholder="请输入所需积分"
                    ></el-input-number>
                </el-form-item>
            </div>
        </el-form>
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
                @click="handleCalculate"
            > 测 算 </el-button>
        </div>

        <!-- 测算结果表格 -->
        <calculate-table
            v-if="calculateTableHeader.length > 0"
            v-loading="calculateLoading"
            :tableHeader="calculateTableHeader"
            :tableData="calculateTableData">
        </calculate-table>

        <!-- 弹窗-险种列表 -->
        <el-dialog
            v-if="insuranceListVisible"
            :visible.sync="insuranceListVisible"
            title="险种编码"
            width="80%"
            modal-append-to-body
            append-to-body>
            <insurance-list :hasSelectedCode="currSet" @change="changeInsuranceName"></insurance-list>
        </el-dialog>
    </div>
</template>

<script>
import formItem from 'components/formItem'
import insuranceList from 'components/insuranceList'
import calculateTable from '../calculateTable'
import { getLabelWidth } from '../../consts/index'
import { getPlanCalculateListHeader, getPlanCalculateData } from 'api/pointCalculate/index'
export default {
  components: { formItem, calculateTable, insuranceList },
  props: {
    // 方案测算要素配置列表
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
      planForm: {
        integralCode: '',
        integralNum: '', // 所需积分
        elements: [] // 要素 [{code: '', value: ''}, ...]
      },
      // 测算结果表头
      calculateTableHeader: [],
      // 测算结果数据
      calculateTableData: [],
      insuranceListVisible: false,

      // 当前选中配置的行列号以及险种code
      currSet: ''
    }
  },
  computed: {
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
          this.planForm.elements.push({
            code: item.elementCode,
            value: ''
          })
        })
      },
      deep: true,
      immediate: true
    }
  },
  created() {
    this.planForm.integralCode = this.premiumIntegralCode
  },
  methods: {
    // 显示险种选中弹窗
    showInsuranceList(code) {
      this.currSet = code
      this.insuranceListVisible = true
    },

    // 险种编码选中数据改变
    changeInsuranceName(data) {
      const insuranceNameElement = this.planForm.elements.find(item => item.code === 'a7J6RT44')
      const insuranceCodeElement = this.planForm.elements.find(item => item.code === 'D9eVGr7P')
      let insuranceClassElement1 = this.elements.find(item => item.elementName === '险种分类一')
      insuranceClassElement1 ? insuranceClassElement1 = this.planForm.elements.find(item => item.code === insuranceClassElement1.elementCode) : ''

      let insuranceClassElement2 = this.elements.find(item => item.elementName === '险种分类二')
      insuranceClassElement2 ? insuranceClassElement2 = this.planForm.elements.find(item => item.code === insuranceClassElement2.elementCode) : ''

      let insuranceClassElement3 = this.elements.find(item => item.elementName === '险种分类三')
      insuranceClassElement3 ? insuranceClassElement3 = this.planForm.elements.find(item => item.code === insuranceClassElement3.elementCode) : ''

      let insuranceClassElement4 = this.elements.find(item => item.elementName === '险种分类四')
      insuranceClassElement4 ? insuranceClassElement4 = this.planForm.elements.find(item => item.code === insuranceClassElement4.elementCode) : ''

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

    // 测算
    handleCalculate() {
      this.$refs.planForm.validate(async valid => {
        if (!valid) { return }

        this.calculateLoading = true
        // 获取表头
        await getPlanCalculateListHeader({ integralCode: this.premiumIntegralCode }).then(res => {
          this.calculateTableHeader = res.list || []
        })
        // 获取表数据
        getPlanCalculateData(this.planForm).then(res => {
          this.calculateTableData = res.list || []
        }).finally(res => {
          this.calculateLoading = false
        })
      })
    },

    // 清空
    handleReset() {
      this.$refs.planForm.resetFields()
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

// 表单项给定宽度：解决input输入框带后缀时，对不齐的问题
::v-deep.el-form-item{
    // width: 260px;
    margin: 0 25px 15px 0;
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

.footer{
    text-align: center;
    margin-top: 20px;
}
</style>
