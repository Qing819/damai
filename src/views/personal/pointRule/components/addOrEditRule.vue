<!-- 新增积分规则 -->
<template>
  <div class="container">
    <div class="dialog-header" v-show="type!=='track'">
      <div class="title" v-show="type==='insert'">{{`个人${integralName}规则新建`}}</div>
      <div class="title" v-show="type==='update'">{{`个人${integralName}规则编辑`}}</div>
      <div>
        <el-button size="small" type="primary" @click="handleSave">
          <icon-svg class="btn-icon" icon-class="save"></icon-svg> 保存
        </el-button>
        <el-button size="small" plain type="primary" icon="el-icon-back" @click="$emit('update:addOrEditDialog',false)">返回</el-button>
      </div>
    </div>
    <el-scrollbar class="scrollbar" v-loading="loading">
      <div :class="['box',type!=='insert'?'editBox':'']">
        <div v-show="type==='insert'" style="text-align:right">
          <el-button type="primary" size="small" plain @click="handleAddRule">增加</el-button>
        </div>
        <el-card class="box-item" v-for="(ruleBox, boxIndex) in ruleList" :key="boxIndex">
          <div v-show="type==='insert'" slot="header" class="box-item-title">
            <div>规则{{boxIndex + 1}}</div>
            <div>
              <el-popconfirm title="确定删除此条规则吗？" @confirm="handleDelete(boxIndex)">
                <i slot="reference" class="el-icon-delete" style="color:#6383ff;cursor:pointer"></i>
              </el-popconfirm>
            </div>
          </div>
          <el-form inline :model="ruleBox[boxIndex]" ref="ruleForm" size="small" :disabled="type==='track'">
            <!-- 显示必填样式 -->
            <template v-for="(boxItem,itemIndex) in elementConfig">

              <!-- 当险种名称和险种编码同时存在时，险种名称特殊处理 -->
              <el-form-item
                v-if="hasInsuranceNameAndCode && boxItem.elementCode === 'a7J6RT44'"
                :key="itemIndex"
                :label="boxItem.elementName"
                :rules="[{ required: boxItem.elementAllowNull === '01'}]">
                <!-- 非禁用状态 -->
                <div
                  v-if="ruleList[boxIndex][itemIndex].isEdit === '00'"
                  class="likeness-input"
                  @click="showInsuranceList(boxIndex, itemIndex, insuranceCode(boxIndex))">
                  <div v-show="!ruleList[boxIndex][itemIndex].elementValue" class="one-line placeholder-text">
                    请选择
                  </div>
                  <div v-show="ruleList[boxIndex][itemIndex].elementValue" class="one-line" :title="ruleList[boxIndex][itemIndex].elementValue">
                    {{ ruleList[boxIndex][itemIndex].elementValue }}
                  </div>
                </div>
                <!-- 禁用状态 -->
                <div v-else class="likeness-input likeness-input-disabled">
                  <div v-show="!ruleList[boxIndex][itemIndex].elementValue" class="one-line placeholder-text">
                    请选择
                  </div>
                  <div v-show="ruleList[boxIndex][itemIndex].elementValue" class="one-line" :title="ruleList[boxIndex][itemIndex].elementValue">
                    {{ ruleList[boxIndex][itemIndex].elementValue }}
                  </div>
                </div>
              </el-form-item>

              <!-- 当险种名称和险种编码同时存在时，险种编码特殊处理 -->
              <el-form-item
                v-else-if="hasInsuranceNameAndCode && boxItem.elementCode === 'D9eVGr7P'"
                :key="itemIndex"
                :label="boxItem.elementName"
                :rules="[{ required: boxItem.elementAllowNull === '01'}]">
                <!-- 非禁用状态 -->
                <div
                  v-if="ruleList[boxIndex][itemIndex].isEdit === '00'"
                  class="likeness-input"
                  @click="showInsuranceList(boxIndex, itemIndex, ruleList[boxIndex][itemIndex].elementValue)">
                  <div v-show="!ruleList[boxIndex][itemIndex].elementValue" class="one-line placeholder-text">
                    请选择
                  </div>
                  <div v-show="ruleList[boxIndex][itemIndex].elementValue" class="one-line" :title="ruleList[boxIndex][itemIndex].elementValue">
                    {{ ruleList[boxIndex][itemIndex].elementValue }}
                  </div>
                </div>

                <!-- 禁用状态 -->
                <div v-else class="likeness-input likeness-input-disabled">
                  <div v-show="!ruleList[boxIndex][itemIndex].elementValue" class="one-line placeholder-text">
                    请选择
                  </div>
                  <div v-show="ruleList[boxIndex][itemIndex].elementValue" class="one-line" :title="ruleList[boxIndex][itemIndex].elementValue">
                    {{ ruleList[boxIndex][itemIndex].elementValue }}
                  </div>
                </div>
              </el-form-item>

              <!-- 险种编码和险种名称同时存在，并且存在险种分类1，2，3，4其中任意一个做特殊处理 -->
              <el-form-item
                v-else-if="hasInsuranceNameAndCode && (boxItem.elementName === '险种分类一' || boxItem.elementName === '险种分类二' || boxItem.elementName === '险种分类三' || boxItem.elementName === '险种分类四')"
                :key="itemIndex"
                :label="boxItem.elementName"
                :rules="[{ required: boxItem.elementAllowNull==='01'}]">
                <form-item :elementConfig="boxItem" v-model="ruleList[boxIndex][itemIndex].elementValue" :disabled="true"></form-item>
              </el-form-item>

              <!-- 其它 -->
              <el-form-item
                v-else
                :key="itemIndex"
                :label="boxItem.elementName"
                :rules="[{ required: boxItem.elementAllowNull==='01'}]">
                <form-item :elementConfig="boxItem" v-model="ruleList[boxIndex][itemIndex].elementValue" :disabled="ruleList[boxIndex][itemIndex].isEdit === '00' ? false : true"></form-item>
              </el-form-item>
            </template>

          </el-form>
        </el-card>
      </div>
    </el-scrollbar>

    <!-- 弹窗-险种列表 -->
    <el-dialog
      v-if="insuranceListVisible"
      :visible.sync="insuranceListVisible"
      title="险种编码"
      top="10vh"
      width="80%"
      modal-append-to-body
      append-to-body>
      <insurance-list :hasSelectedCode="currSet[2]" @change="changeInsuranceName"></insurance-list>
    </el-dialog>
  </div>
</template>

<script>
import { integrationRuleElementContentInfo, integrationRuleContentDefaultInfo, editIntegralRule, checkEditIntegralRule, checkRuleStartAndEndPeriod } from 'api/pointRule/index'
import formItem from 'components/formItem'
import insuranceList from 'components/insuranceList'
import { truncate } from 'fs';

export default {
  components: { formItem, insuranceList },
  props: {
    // 积分类型编码
    integralCode: {
      type: String,
      required: true
    },
    // 新增弹窗
    addOrEditDialog: {
      type: Boolean,
      default: false
    },
    // 弹窗标题名称
    integralName: {
      type: String,
      default: ''
      // required: true
    },
    // 新增或编辑弹窗类型
    type: {
      type: String,
      default: 'track'
      // required:true
    },
    ruleCode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      ruleList: [],
      elementConfig: [],
      insuranceListVisible: false,

      // 当前选中配置的行列号以及险种code
      currSet: []
    };
  },
  computed: {
    // 是否同时存在"险种名称"和"险种编码"
    hasInsuranceNameAndCode() {
      const hasInsuranceName = this.elementConfig.some(item => item.elementCode === 'a7J6RT44')
      const hasInsuranceCode = this.elementConfig.some(item => item.elementCode === 'D9eVGr7P')

      return hasInsuranceName && hasInsuranceCode
    },

    // 险种code
    insuranceCode() {
      return boxIndex => {
        const insuranceCodeElement = this.ruleList[boxIndex].find(item => item.elementCode === 'D9eVGr7P')
        return insuranceCodeElement.elementValue
      }
    }
  },
  created() {
    this.getElementConfig()
  },
  methods: {
    // 获取初始元素label值
    async getElementConfig() {
      this.loading = true
      if (this.type === 'insert') {
        await this.getFormItem()
        this.handleAddRule()
      } else {
        this.handleEditRule()
      }
    },
    /**
     *校验必填数据是否必填
     *  1.找出必填值为空的情况，返回校验规则
     *  2.将校验布尔值赋值
     */
    validIsRequied() {
      let isReqeired = false
      this.ruleList.find((boxItem, boxIndex) => {
        const validRequired = boxItem.find(e => e.elementAllowNull === '01' && (e.elementValue === '' || e.elementValue === undefined))
        if (validRequired) {
          isReqeired = true
          this.$message({
            type: 'warning',
            message: `规则${boxIndex + 1}中的${validRequired.elementName}必填！`
          })
          return
        } else {
          isReqeired = false
          return
        }
      })
      return isReqeired
    },
    /**
     * 后端检验规则是否与数据库是否重复
     */
    async validIsRuleOnly() {
      let ruleOnly = false
      const params = {
        editType: this.type,
        elementCodeAndValueVoList: this.ruleList[this.ruleList.length - 1],
        integralGradeCode: this.integralCode,
        ruleCode: this.ruleCode
      }
      await checkEditIntegralRule(params).then(res => {
        if (!res.result) {
          ruleOnly = true
          this.handleWarningInfo(res)
        }
      })
      return ruleOnly
    },
    /**
     * 检验唯一规则是否唯一
     *过滤上一条信息的所有唯一要素内容
     * 过滤当前信息的所有唯一要素内容
     * 对比查看结果是否唯一
     */
    validIsUnique() {
      let isUnique = false
      let lastRule = []
      let nextRule = []
      if (this.ruleList.length > 2) {
        lastRule = this.ruleList[this.ruleList.length - 2].filter(item => item.elementOnly === '00')
        nextRule = this.ruleList[this.ruleList.length - 1].filter(item => item.elementOnly === '00')
      } else if (this.ruleList.length === 2) {
        lastRule = this.ruleList[0].filter(item => item.elementOnly === '00')
        nextRule = this.ruleList[this.ruleList.length - 1].filter(item => item.elementOnly === '00')
      }
      if (lastRule.length > 0) {
        lastRule.forEach((item, i) => {
          if (item.elementValue) {
            if (!isUnique && item.elementValue === nextRule[i].elementValue) {
              isUnique = true
              this.$message({
                type: 'warning',
                message: `${item.elementName}已存在，请重新输入！！`
              })
            }
          }
        })
      }
      return isUnique
    },
    /**
     * 校验主键规则是否唯一
     *  1.当必填结果验证成功时
     *  2.找出必须是唯一值的数据，
     *  3.将数据值转换为字符串格式，
     *  4.定义一个数组，将上下条规则进行存储
     *  5.将数组进行去重，如果数组长度变化，说明有规则重复
     */
    validIsOnly() {
      let isRuleOnly = false
      let lastRule = []
      let nextRule = []
      const validLastRule = []
      const validNextRule = []
      const primaryKey = []
      if (this.ruleList.length > 2) {
        lastRule = this.ruleList[this.ruleList.length - 2].filter(item => item.isPrimaryKey === '00')
        nextRule = this.ruleList[this.ruleList.length - 1].filter(item => item.isPrimaryKey === '00')
      } else if (this.ruleList.length === 2) {
        lastRule = this.ruleList[0].filter(item => item.isPrimaryKey === '00')
        nextRule = this.ruleList[this.ruleList.length - 1].filter(item => item.isPrimaryKey === '00')
      }
      if (lastRule.length > 1) {
        lastRule.forEach(item => {
          validLastRule.push(item.elementValue)
        })
        nextRule.forEach(item => {
          validNextRule.push(item.elementValue)
        })
        const last = validLastRule.join('')
        const next = validNextRule.join('')
        lastRule.forEach(item => {
          primaryKey.push(item.elementName)
        })
        if (last && last === next) {
          isRuleOnly = true
          this.$message({
            type: 'warning',
            message: `${primaryKey.join('+')}已存在，请重新输入！`
          })
        }
      }
      return isRuleOnly
    },
    /**
     * 检验规则止期必须大于规则起期
     */
    validRuleDate() {
      let isCorrect = false
      // 获取规则起期
      if (this.ruleList.length !== 0) {
        const ruleStart = this.ruleList[this.ruleList.length - 1].find(item => item.elementCode === '4ZTEi9sx')
        // 获取规则止期
        const ruleEnd = this.ruleList[this.ruleList.length - 1].find(item => item.elementCode === 'mNh0rGWD')
        if (ruleStart && ruleEnd) {
          const startDate = new Date(ruleStart.elementValue).getTime()
          const endDate = new Date(ruleEnd.elementValue).getTime()
          if (startDate > endDate) {
            isCorrect = true
            this.$message({
              type: 'warning',
              message: '规则止期要大于规则起期'
            })
          }
        }
      }
      return isCorrect
    },
    /**
     * 当所有主键内容都相同时，起止日期不能相同
     * 1.找到所有规则里的最后一条数据，以及前一条数据里的所有主键内容
     * 2.看主键里面是否包含规则起止日期
     *   如果有。将规则中的起止日期提取出来，分为两部分
     *   判断没有起止日期的主键的部份是不是相同，不相同，直接允许添加
     *    相同时，判断日期的交集
     *   如果咋交集内，不允许添加，否则直接添加数据
     */
    validDate() {
      let isPass = true
      let lastRule = []
      let nextRule = []
      let isOwnDate = false
      const lastDate = []
      const nextDate = []
      const lastPrimary = []
      const nextPrimary = []
      const validLastRule = []
      const validNextRule = []
      if (this.ruleList.length > 1) {
        lastRule = this.ruleList[this.ruleList.length - 2].filter(item => item.isPrimaryKey === '00')
        nextRule = this.ruleList[this.ruleList.length - 1].filter(item => item.isPrimaryKey === '00')
        isOwnDate = lastRule.find(item => item.elementCode === '4ZTEi9sx' || item.elementCode === 'mNh0rGWD')
        if (isOwnDate) {
          lastRule.forEach(item => {
            if (item.elementCode === '4ZTEi9sx' || item.elementCode === 'mNh0rGWD') {
              lastDate.push(item)
            } else {
              lastPrimary.push(item)
            }
          })
          nextRule.forEach(item => {
            if (item.elementCode === '4ZTEi9sx' || item.elementCode === 'mNh0rGWD') {
              nextDate.push(item)
            } else {
              nextPrimary.push(item)
            }
          })
          lastPrimary.forEach(item => {
            validLastRule.push(item.elementValue)
          })
          nextPrimary.forEach(item => {
            validNextRule.push(item.elementValue)
          })
          const last = validLastRule.join('')
          const next = validNextRule.join('')
          if (last === next) {
            const start1 = lastDate.find(item => item.elementCode === '4ZTEi9sx').elementValue || ''
            const end1 = lastDate.find(item => item.elementCode === 'mNh0rGWD').elementValue || ''
            const start2 = nextDate.find(item => item.elementCode === '4ZTEi9sx').elementValue || ''
            const end2 = nextDate.find(item => item.elementCode === 'mNh0rGWD').elementValue || ''
            if ((!start1 && !end1) || (!start2 && !end2)) {
              isPass = false
            } else if ((start1 && start2 && !end1 && !end2) || (!start1 && !start2 && end1 && end2)) {
              isPass = false
            } else if (start1 && start2 && end1 && end2) {
              if (!(new Date(start1).getTime() > new Date(end2).getTime() || new Date(end1).getTime() < new Date(start2).getTime())) {
                isPass = false
              }
            } else {
              if (start1 && end2) {
                if (!(new Date(start1).getTime() > new Date(end2).getTime())) {
                  isPass = false
                }
              } else if (start2 && end1) {
                if (!(new Date(start2).getTime() > new Date(end1).getTime())) {
                  isPass = false
                }
              }
            }
          }
        }
      }
      if (!isPass) {
        this.$message.warning('在当前时间段内已存在相应规则')
      }
      return isPass
    },
    /**
     * 后端数据库判断起止日期
     */
    async validStartEndDate() {
      let validIsCorrect = false
      const params = {
        editType: this.type,
        integralGradeCode: this.integralCode,
        ruleCode: this.ruleCode
      }
      let allData = []
      const primaryKeyList = []
      const startEndPeriodList = []
      allData = this.ruleList[this.ruleList.length - 1].filter(item => item.isPrimaryKey === '00')
      allData.forEach(item => {
        if (item.elementCode === '4ZTEi9sx' || item.elementCode === 'mNh0rGWD') {
          startEndPeriodList.push({ elementCode: item.elementCode, elementValue: item.elementValue })
        } else {
          primaryKeyList.push({ elementCode: item.elementCode, elementValue: item.elementValue })
        }
      })
      params.primaryKeyList = primaryKeyList
      params.startEndPeriodList = startEndPeriodList
      await checkRuleStartAndEndPeriod(params).then(({ result }) => {
        if (!result.result) {
          validIsCorrect = true
          this.$message.warning('在当前时间段内已存在相应规则')
        }
      })
      return validIsCorrect
    },
    // 获取新增的动态表单内容
    async getFormItem() {
      await integrationRuleElementContentInfo({ integralCode: this.integralCode, elementShow: 'isIntegralCalculationShow' })
        .then(({ list }) => {
          this.elementConfig = list
        })
        .catch(() => {
          this.elementConfig = []
        })
        .finally(() => {
          this.loading = false
        })
    },
    /**
     * 处理新增规则
     */
    async handleAddRule() {
      const isReqeired = await this.validIsRequied()
      const isUnique = await this.validIsUnique()
      const isOnly = await this.validIsOnly()
      const isCorrect = await this.validRuleDate()
      const isPass = await this.validDate()
      let ruleOnly = false
      let validIsCorrect = false
      if (this.ruleList.length !== 0) {
        ruleOnly = await this.validIsRuleOnly()
        validIsCorrect = await this.validStartEndDate()
      }
      if (!isReqeired && !isUnique && !isOnly && !ruleOnly && !isCorrect && isPass && !validIsCorrect) {
        const data = []
        this.elementConfig.map(e => {
          const returnData = {
            elementOnly: e.elementOnly,
            elementAllowNull: e.elementAllowNull,
            elementCode: e.elementCode,
            elementName: e.elementName,
            elementValue: e.elementValue || '',
            isPrimaryKey: e.isPrimaryKey,
            isEdit: '00'
          }
          return data.push(returnData)
        })
        this.ruleList.push(data)
      }
    },
    // 处理错误消息提示
    handleWarningInfo(data) {
      const onlyList = data.onlyCode ? data.onlyCode.split(',') : ''
      const primaryList = data.primaryKeyCode ? data.primaryKeyCode.split(',') : ''
      const onlyName = []
      const primaryName = []
      if (onlyList) {
        onlyList.forEach(item => {
          this.elementConfig.map(e => {
            if (e.elementCode === item) {
              onlyName.push(e.elementName)
            }
          })
        })
      }
      if (primaryList) {
        primaryList.forEach(item => {
          this.elementConfig.map(e => {
            if (e.elementCode === item) {
              primaryName.push(e.elementName)
            }
          })
        })
      }
      this.$message({
        type: 'warning',
        message: `${onlyName}${data.onlyMessage ? data.onlyMessage : ''} ${primaryName.join('+')}${data.primaryKeyMessage ? data.primaryKeyMessage : ''}`
      })
    },
    // 处理编辑规则
    handleEditRule() {
      integrationRuleContentDefaultInfo({ ruleCode: this.ruleCode, integralCode: this.integralCode }).then(({ list }) => {
        this.elementConfig = list
        const data = []
        this.elementConfig.map(e => {
          const returnData = {
            elementOnly: e.elementOnly,
            elementAllowNull: e.elementAllowNull,
            elementCode: e.elementCode,
            elementName: e.elementName,
            elementValue: e.elementValue,
            isPrimaryKey: e.isPrimaryKey,
            isEdit: e.isEdit
          }
          return data.push(returnData)
        })
        this.ruleList.push(data)
      })
        .finally(() => {
          this.loading = false
        })
    },
    // 处理删除
    handleDelete(index) {
      if (index > 0) {
        this.ruleList.splice(index, 1)
      } else {
        this.$message({
          type: 'warning',
          message: '第一条数据不可删除'
        })
      }
    },
    /**
     * 处理保存
     * *检查是否必填以及规则是否唯一
     */
    async handleSave() {
      const isReqeired = await this.validIsRequied()
      const isUnique = await this.validIsUnique()
      const isOnly = await this.validIsOnly()
      const ruleOnly = await this.validIsRuleOnly()
      const isCorrect = await this.validRuleDate()
      const isPass = await this.validDate()
      const validIsCorrect = await this.validStartEndDate()
      if (!isReqeired && !isUnique && !isOnly && !ruleOnly && !isCorrect && isPass && !validIsCorrect) {
        const params = {
          editType: this.type,
          integralCode: this.integralCode,
          elementCodeAndValueVoList: this.ruleList
        }
        if (this.type === 'update') {
          params.ruleCode = this.ruleCode
        }
        editIntegralRule(params).then(({ result }) => {
          if (result) {
            this.$message({
              type: 'success',
              message: '保存成功，数据已提交审核！'
            })
          }
          this.$emit('update:addOrEditDialog', false)
          this.$emit('handleSearch')
        })
      }
    },

    // 显示险种选中弹窗
    showInsuranceList(boxIndex, itemIndex, insuranceCode) {
      this.currSet = [boxIndex, itemIndex, insuranceCode]
      this.insuranceListVisible = true
    },

    // 险种编码选中数据改变
    changeInsuranceName(data) {
      const boxIndex = this.currSet[0]
      const itemIndex = this.currSet[1]
      if (boxIndex !== undefined && itemIndex !== undefined) {
        const insuranceNameElement = this.ruleList[boxIndex].find(item => item.elementCode === 'a7J6RT44')
        const insuranceCodeElement = this.ruleList[boxIndex].find(item => item.elementCode === 'D9eVGr7P')
        const insuranceClassElement1 = this.ruleList[boxIndex].find(item => item.elementName === '险种分类一')
        const insuranceClassElement2 = this.ruleList[boxIndex].find(item => item.elementName === '险种分类二')
        const insuranceClassElement3 = this.ruleList[boxIndex].find(item => item.elementName === '险种分类三')
        const insuranceClassElement4 = this.ruleList[boxIndex].find(item => item.elementName === '险种分类四')
        // 险种名称赋值
        insuranceNameElement.elementValue = data.insuranceName
        // 险种编码赋值
        insuranceCodeElement.elementValue = data.insuranceCode
        // 险种分类1赋值
        insuranceClassElement1 ? insuranceClassElement1.elementValue = data.insuranceClassification1 : ''
        // 险种分类2赋值
        insuranceClassElement2 ? insuranceClassElement2.elementValue = data.insuranceClassification2 : ''
        // 险种分类3赋值
        insuranceClassElement3 ? insuranceClassElement3.elementValue = data.insuranceClassification3 : ''
        // 险种分类4赋值
        insuranceClassElement4 ? insuranceClassElement4.elementValue = data.insuranceClassification4 : ''
      }
      this.currSet = []
      this.insuranceListVisible = false
    }
  }
};
</script>

<style lang="scss" scoped>
$radius: 4px;

.container {
  height: 100%;
  .dialog-header {
    background-color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    font-size: 14px;
    font-weight: bolder;
    .title {
      height: 16px;
      font-size: 12px;
      display: flex;
      align-items: center;
      font-weight: 600;
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
  .scrollbar{
    height:calc(100% - 55px)
  }
  .box {
    margin-top: 10px;
    border-radius: $radius;
    background-color: #fff;
    padding: 10px;
    .box-item{
      margin:10px 0;
      border-radius: $radius;
    }
    .box-item-title {
      padding:10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: bold;
      background-color: #F2F6FC;
    }
  }
  .editBox{
    /deep/.el-scrollbar__wrap{ overflow-x: hidden; }
    /deep/.el-card{
      border:0px;
    }
    /deep/.el-card.is-always-shadow{
      box-shadow: 0 0 0 0 transparent;
    }
    /deep/.el-card__body{
      padding:0;
    }
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

  .likeness-input-disabled{
    background-color: #F5F7FA;
    border-color: #E4E7ED;
    color: #C0C4CC;
    cursor: not-allowed;
    &:hover{
      border-color: #E4E7ED;
    }
  }
}
/deep/.el-divider--horizontal {
  margin: 5px 0;
}
/deep/.el-card__header{
  padding:0;
  border-bottom:none
}
/deep/.el-card__body{
  padding:10px;
}
/deep/.el-scrollbar__wrap{ overflow-x: hidden; }
</style>
