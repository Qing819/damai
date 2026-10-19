<!-- 新增积分规则 -->
<template>
  <div class="container">
    <div class="dialog-header" v-show="type!=='track'">
      <div class="title" v-show="type==='insert'">{{`${gradeName}规则新建`}}</div>
      <div class="title" v-show="type==='update'">{{`${gradeName}规则编辑`}}</div>
      <div>
        <el-button size="mini" type="primary" @click="handleSave">
          <icon-svg class="btn-icon" icon-class="save"></icon-svg> 保存
        </el-button>
        <el-button plain type="primary" icon="el-icon-back" size="mini" @click="$emit('update:addOrEditDialog',false)">返回</el-button>
      </div>
    </div>
    <el-scrollbar class="scrollbar" v-loading="loading">
      <div class="box">
        <div class="box-top" :style="{flexFlow:channel.length === 0 ? 'row-reverse':'row'}">
          <el-form v-if="channel.length !== 0" inline :model="channel[0]">
            <el-form-item :label="channel[0].elementName" :rules="[{required:true}]">
              <el-select
                v-model="channel[0].elementValue"
                :disabled="channel[0].isEdit === '00' ? false : true"
                placeholder="请选择"
                size="small"
                style="width:100%"
                filterable
                clearable>
          <el-option
            v-for="(item, index) in strToArr(channel[0].elementDimension)"
            :key="index"
            :label="item"
            :value="item"
          ></el-option>
        </el-select>
          </el-form-item>
          </el-form>
          <div v-show="type==='insert'" style="text-align:right">
            <el-button type="primary" size="mini" plain @click="handleAddRule">增加</el-button>
          </div>
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
          <el-form inline :model="ruleBox[boxIndex]" ref="ruleForm" size="small">
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
import { customerGradeElementContentInfo, customerGradeElementContentDefaultInfo, editCustomerGrade, customerGradePageInfo, checkEditCustomerGrade } from 'api/rankManage/index'
import formItem from 'components/formItem'
import insuranceList from 'components/insuranceList'

export default {
  components: { formItem, insuranceList },
  props: {
    // 规则编码
    ruleCode: {
      type: String,
      default: ''
    },
    // 等级管理类型编码
    gradeCode: {
      type: String,
      required: true
    },
    // 新增弹窗
    addOrEditDialog: {
      type: Boolean,
      default: false
    },
    // 弹窗标题名称
    gradeName: {
      type: String,
      default: '',
      required: true
    },
    // 新增或编辑弹窗类型
    type: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      ruleList: [],
      elementConfig: [],
      channel: [], // 渠道内容
      tableTotal: '', // 表格的总数

      insuranceListVisible: false, // 险种列表弹窗是否显示
      currSet: [] // 当前选中配置的行列号以及险种code
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
    this.getElementConfig();
  },
  methods: {
    // 字符串以中文逗号隔开转换成数组
    strToArr(str) {
      const newStr = str.replace(/[\uff0c]/g, ',');
      return Object.prototype.toString.call(newStr) === '[object String]'
        ? newStr.split(',')
        : '';
    },
    // 获取table表格数据
    async getTableData() {
      await customerGradePageInfo({ gradeCode: this.gradeCode, pageNum: 1, pageSize: 20 }).then(({ total }) => {
        this.tableTotal = total
      })
    },
    // 获取初始元素label值
    async getElementConfig() {
      console.log(this.type)
      this.loading = true
      if (this.type === 'insert') {
        await this.getTableData()
        await this.getFormItem()
        this.handleAddRule();
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
        console.log(lastRule, nextRule)
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
     * 后端检验规则是否与数据库是否重复
     */
    async validIsRuleOnly() {
      let ruleOnly = false
      const params = {
        editType: this.type,
        elementCodeAndValueVoList: this.ruleList[this.ruleList.length - 1].concat(this.channel),
        integralGradeCode: this.gradeCode,
        ruleCode: this.ruleCode
      }
      await checkEditCustomerGrade(params).then(res => {
        if (!res.result) {
          ruleOnly = true
          this.handleWarningInfo(res)
        }
      })
      return ruleOnly
    },
    /**
     * 校验积分上限的区间值，不得小于当条数据的积分下限
     * 1.找出最后一条数据的上限值以及下限值
     * 2.判断上限值是否大于下限值
     * 3.如果大于，新增数据
     * 4.否则，弹窗警示框
     */
    validSection() {
      let isSection = false
      const prePointUpperObj = this.ruleList[this.ruleList.length - 1].find(item => item.elementName === '积分上限')
      const pointUpper = Number(prePointUpperObj.elementValue)
      const prePointLowerObj = this.ruleList[this.ruleList.length - 1].find(item => item.elementName === '积分下限')
      const pointLower = Number(prePointLowerObj.elementValue)
      if (pointUpper > pointLower) {
        isSection = false
      } else {
        isSection = true
        return this.$message({
          type: 'warning',
          message: '积分上限必须大于积分下限'
        })
      }
      return isSection
    },
    // 获取新增的动态表单内容
    async getFormItem() {
      await customerGradeElementContentInfo({ gradeCode: this.gradeCode }).then(({ list }) => {
        const data = list
        data.forEach((e, i) => {
          if (e.elementName === '渠道') {
            e.isEdit = '00'
            this.channel = data.splice(i, 1)
          }
        })
        this.elementConfig = data
      })
        .catch(() => {
          this.elementConfig = []
          this.channel = []
        }).finally(() => {
          this.loading = false
        })
    },
    // 处理错误消息提示
    handleWarningInfo(data) {
      const onlyList = data.onlyCode ? data.onlyCode.split(',') : ''
      const primaryList = data.primaryKeyCode ? data.primaryKeyCode.split(',') : ''
      console.log(onlyList, primaryList)
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
    /**
     * 处理新增规则
     */
    async handleAddRule() {
      const isReqeired = await this.validIsRequied()
      const isUnique = await this.validIsUnique()
      const isOnly = await this.validIsOnly()
      let ruleOnly = false
      if (this.ruleList.length !== 0) {
        ruleOnly = await this.validIsRuleOnly()
      }
      if (!isReqeired && !isUnique && !isOnly && !ruleOnly) {
        const data = []
        if (this.ruleList.length !== 0) {
          const isSection = this.validSection()
          if (!isSection) {
            // 获取前一个积分上限的值
            const prePointUpperObj = this.ruleList[this.ruleList.length - 1].find(item => item.elementName === '积分上限')
            // 积分上限的值
            const pointUpper = prePointUpperObj.elementValue
            this.elementConfig.map(e => {
              // 如果是积分下限，设置它的elementValue为pointUpper+1
              if (e.elementName === '积分下限') {
                e.elementValue = Number(pointUpper) + 1
              } else {
                e.elementValue = ''
              }
              return data.push({
                elementOnly: e.elementOnly,
                elementAllowNull: e.elementAllowNull,
                elementCode: e.elementCode,
                elementName: e.elementName,
                elementValue: e.elementValue || '',
                isPrimaryKey: e.isPrimaryKey,
                isEdit: '00'
              })
            })
            this.ruleList.push(data)
          }
        } else if (this.tableTotal === 0) {
          this.elementConfig.map(e => {
            // 如果是积分下限，设置它的elementValue为pointUpper+1
            if (e.elementName === '积分下限') {
              e.elementValue = 0
              e.isEdit = '01'
            } else {
              e.elementValue = ''
              e.isEdit = '00'
            }
            return data.push({
              elementOnly: e.elementOnly,
              elementAllowNull: e.elementAllowNull,
              elementCode: e.elementCode,
              elementName: e.elementName,
              elementValue: e.elementValue,
              isPrimaryKey: e.isPrimaryKey,
              isEdit: e.isEdit
            })
          })
          this.ruleList.push(data)
        } else {
          this.elementConfig.map(e => {
            // 如果是积分下限，设置它的elementValue为pointUpper+1
            if (e.elementName === '积分下限') {
              e.elementValue = ''
              e.isEdit = '00'
            } else {
              e.elementValue = ''
              e.isEdit = '00'
            }
            return data.push({
              elementOnly: e.elementOnly,
              elementAllowNull: e.elementAllowNull,
              elementCode: e.elementCode,
              elementName: e.elementName,
              elementValue: e.elementValue,
              isPrimaryKey: e.isPrimaryKey,
              isEdit: e.isEdit
            })
          })
          this.ruleList.push(data)
        }
        console.log(this.ruleList)
      }
    },
    // 处理编辑规则
    handleEditRule() {
      customerGradeElementContentDefaultInfo({ ruleCode: this.ruleCode, gradeCode: this.gradeCode }).then(({ list }) => {
        list.forEach((e, i) => {
          if (e.elementName === '渠道') {
            this.channel = list.splice(i, 1)
          }
        })
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
        console.log(this.ruleList)
      }).finally(() => {
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
     * 检查是否必填以及规则是否唯一
     * 检验积分上限的区间是否连续并不重复
     */
    async handleSave() {
      if (this.channel.length !== 0 && !this.channel[0].elementValue) {
        return this.$message({
          type: 'warning',
          message: '请选择渠道'
        })
      }
      const isReqeired = await this.validIsRequied()
      const isUnique = await this.validIsUnique()
      const isOnly = await this.validIsOnly()
      const isSection = await this.validSection()
      const ruleOnly = await this.validIsRuleOnly()
      if (!isReqeired && !isUnique && !isSection && !isOnly && !ruleOnly) {
        let elementCodeAndValueVoList = []
        if (this.channel.length !== 0) {
          elementCodeAndValueVoList = this.ruleList.map(e => e.concat(this.channel))
        } else {
          elementCodeAndValueVoList = this.ruleList
        }
        const params = {
          editType: this.type,
          gradeCode: this.gradeCode,
          elementCodeAndValueVoList
        }
        if (this.type === 'update') {
          params.ruleCode = this.ruleCode
        }
        editCustomerGrade(params).then(({ result }) => {
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
      // height: 16px;
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
    .box-top{
      display: flex;
      justify-content: space-between;
      align-items: center;
      ::v-deep.el-form-item{
        margin-bottom:0;
      }
    }
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
::v-deep.el-divider--horizontal {
  margin: 5px 0;
}
::v-deep.el-card__header{
  padding:0;
  border-bottom:none
}
::v-deep.el-card__body{
  padding:10px;
}
::v-deep.el-scrollbar__wrap{ overflow-x: hidden; }
</style>
