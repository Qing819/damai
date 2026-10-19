// 积分类型表单（新增的积分类型）
<template>
    <el-form
        ref="form"
        :model="formData"
        :label-width="getLabelWidth(elementsConfig)"
        label-position="right"
        size="small"
        class="form-items-box">
        <el-form-item label="积分类型 :" label-width="80px" >
            <el-select filterable :value="integralCode" disabled>
                <el-option
                    v-for="item in canSelectedIntegralTypes"
                    :key="item.integralCode"
                    :label="item.integralName"
                    :value="item.integralCode"
                ></el-option>
            </el-select>
        </el-form-item>

        <el-form-item
            v-if="integralName !== '忠诚积分'"
            label="积分规则 :"
            :rules="{
                required: true,
                message: '该项为必填项!',
                trigger: 'change'
            }">
            <el-select filterable v-model="formData.ruleCode">
                <el-option
                    v-for="ruleItem in pointRules"
                    :key="ruleItem.ruleCode"
                    :label="ruleItem.ruleName"
                    :value="ruleItem.ruleCode"
                ></el-option>
            </el-select>
        </el-form-item>

        <el-form-item
            v-for="(cfgItem, cfgIndex) in elementsConfig"
            :key="cfgItem.elementCode"
            :label="cfgItem.elementName + ' :'"
            :prop="'elements.' + cfgIndex + '.value'"
            :rules="{
                required: cfgItem.isPrimaryKey === '00',
                message: '该项为必填项!',
                trigger: 'blur'
            }">
            <form-item
                v-model="formData.elements[cfgIndex].value"
                :elementConfig="cfgItem"
                size="small">
            </form-item>
        </el-form-item>

    </el-form>
</template>

<script>
import { mapGetters } from 'vuex'
import formItem from 'components/formItem'
import { integralNamesOfCalculate } from '../../consts/index'
import { getLabelWidth } from '../../consts/index'
import { getIntegralTypeElements, getIntegralRuleList } from 'api/pointCalculate/index'

export default {
  name: 'integralTypeForm',
  components: { formItem },
  props: {
    // 积分类型code
    integralCode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      formData: {
        ruleCode: '',
        elements: []
      },
      pointRules: [],
      elementsConfig: []
    }
  },
  computed: {
    ...mapGetters(['integrationTypeList']),

    // 可选择的积分类型集合
    canSelectedIntegralTypes() {
      return this.integrationTypeList.filter(item => integralNamesOfCalculate.includes(item.integralName))
    },

    // 当前积分类型名称
    integralName() {
      const integralObj = this.integrationTypeList.find(item => item.integralCode === this.integralCode)
      return integralObj?.integralName || ''
    }
  },
  watch: {
    // 监听积分类型code改变，修改积分规则下拉框数据并重新配置表单项
    integralCode: {
      handler() {
        this.getRulesByIntegralCode()
        this.getElementsByIntegralCode()
      },
      immediate: true
    }
  },
  methods: {
    // 通过积分类型code获取积分规则下拉数据
    getRulesByIntegralCode() {
      getIntegralRuleList({ integralCode: this.integralCode }).then(res => {
        this.pointRules = res.list || []
      })
    },

    // 获取积分类型的要素项
    getElementsByIntegralCode() {
      getIntegralTypeElements({
        integralCode: this.integralCode
      }).then(res => {
        const resData = res.list || []

        // 过滤得到积分测算的要素列表
        const elementsOfIntegral = resData.filter(item => item.type === '01' || item.type === '02')

        this.elementsConfig = elementsOfIntegral

        // 通过配置项配置表单
        const obj = {
          ruleCode: '',
          elements: []
        }
        elementsOfIntegral.forEach(item => {
          obj.elements.push({
            code: item.elementCode,
            value: ''
          })
        })
        this.formData = obj
      })
    },

    // 校验表单
    validateForm() {
      let validateResult = false
      this.$refs.form.validate(valid => { validateResult = valid })
      return validateResult
    },

    // 获取表单数据: 其中elements的格式需要再套一层数组
    getFormData() {
      return {
        ruleCode: this.formData.ruleCode,
        // elements: [JSON.parse(JSON.stringify(this.formData.elements))]
        elements: JSON.parse(JSON.stringify(this.formData.elements))
      }
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
</style>