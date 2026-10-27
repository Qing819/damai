// 保费积分配置表格
<template>
    <el-table
        ref="table"
        size="small"
        :data="tableData"
        max-height="245px"
        border>
        <el-table-column label="序号" width="50" type="index" align="center">
        </el-table-column>
        <template v-for="item in columnSetting">
            <el-table-column
                :key="item.elementCode"
                :label="item.elementName"
                show-overflow-tooltip>
                <template #header>
                    <div class="one-line" :title="item.elementName">
                        {{ item.elementName }}
                    </div>
                </template>
                <template slot-scope="scope">
                    <span>{{ scope.row[item.elementCode] }}</span>
                </template>
            </el-table-column>
        </template>
        <template v-for="(item) in tableHeader">
          <el-table-column :label="item.elementName" :key="item.elementCode">
            <template #default = "{ row }">
              {{row[item.elementCode]}}
            </template>
          </el-table-column>
        </template>
        <el-table-column label="规则起期" show-overflow-tooltip>
          <template #default="{ row }">
            {{row.ruleStartingDate}}
          </template>
        </el-table-column>
        <el-table-column label="规则止期" show-overflow-tooltip>
          <template #default="{ row }">
            {{row.ruleEndingDate}}
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
            key="options"
            fixed="right"
            width="100"
            label="操作"
            align="center">
            <template slot-scope="scope">
                <el-popconfirm
                    confirmButtonText='是'
                    cancelButtonText='否'
                    icon="el-icon-info"
                    title="确认删除？"
                    @confirm="delTr(scope.$index)">
                    <el-link
                        slot="reference"
                        type="danger"
                        :underline="false"
                        class="options-col-btn">
                        删除
                    </el-link>
                </el-popconfirm>
            </template>
        </el-table-column>
    </el-table>
</template>

<script>
import { getRuleCode, showSpecialFields } from 'api/pointCalculate/index'

export default {
  name: 'premiumTable',
  props: {
    // 表头配置
    columnSetting: {
      type: Array,
      required: true
    },
    // 保费积分code
    premiumIntegralCode: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      tableData: [],
      tableHeader: []// 新增表格头
    }
  },
  created() {
    this.getSpecialFields()
  },
  computed: {
    // 是主键的要素code集合
    isPKElementCodes() {
      const isPKElements = this.columnSetting.filter(item => item.isPrimaryKey === '00') || []
      return isPKElements.map(item => item.elementCode)
    }
  },
  methods: {
    // 获取特殊字段增加
    getSpecialFields() {
      showSpecialFields().then(({ specialElementCodeAndName }) => {
        this.tableHeader = specialElementCodeAndName
      })
    },
    /**
         * 添加一行
         * trData格式: [{code: "要素code", value:"要素值"},{...},...]
         */
    addTr(trData, successCallback, finallyCallback) {
      const isPKTrData = trData.filter(item => this.isPKElementCodes.includes(item.code))
      // 通过接口获取规则code
      getRuleCode({
        integralCode: this.premiumIntegralCode,
        elements: isPKTrData || [] // 接口只传主键的要素数据
      }).then(res => {
        const dateAndCode = res.calculationQueryRuleVos

        if (dateAndCode.length === 0) {
          this.$message({
            type: 'warning',
            message: '未查到匹配的规则！请检查数据信息！',
            duration: 2000
          })
          return
        }
        if (this.tableData.length < 20) {
          const addTrList = []
          // 将规则code存到该行数据中
          dateAndCode.forEach(item => {
            const tableTr = {}
            trData.forEach(item => { tableTr[item.code] = item.value })
            for (const key in item) {
              tableTr[key] = item[key]
            }
            tableTr._RULECODE = item.ruleCode
            // 校验是否已经存在相同的行
            this.validateExitSameTr(tableTr) || addTrList.push(tableTr)
          })

          // 删除超出20条的数据
          20 - this.tableData.length < addTrList.length && addTrList.splice(20 - this.tableData.length)
          addTrList.forEach(trItem => {
            this.tableData.push(Object.assign({}, trItem))
          })
          if (addTrList.length !== 0) {
            this.$message.success(`成功添加${addTrList.length}条信息！`)
          } else {
            this.$message.error('已添加相同规则!')
          }
        } else {
          this.$message({
            type: 'warning',
            message: '一次性只允许20条数据进行测算'
          })
        }


        successCallback && successCallback()
      }).finally(() => {
        finallyCallback && finallyCallback()
      })
    },

    // 校验是否已经存在相同数据行 true:已经存在相同行
    validateExitSameTr(trData) {
      // 将trData转成字符串
      let str1 = ''
      this.columnSetting.forEach(setItem => {
        str1 = str1 + setItem.elementCode + trData[setItem.elementCode]
      })
      // tableData中挨个对比
      return this.tableData.some(item => {
        let str2 = ''
        this.columnSetting.forEach(setItem => {
          str2 = str2 + setItem.elementCode + item[setItem.elementCode]
        })
        return str2 === str1
      })
    },

    // 删除一行
    delTr(trIndex) {
      this.tableData.splice(trIndex, 1)
    },

    // 获取表格数据: 转换成[ [ {code: "要素code", value:"要素值"}, ...], [],... ]数据格式
    getTableData() {
      const returnData = []
      this.tableData.forEach((item, index) => {
        const itemObj = { ruleCode: item._RULECODE, elements: [] }
        for (const key in item) {
          itemObj.elements.push({ code: key, value: item[key] })
        }
        returnData[index] = itemObj
      })
      return returnData
    },

    // 清空表格数据
    clearTableData() {
      this.tableData = []
    }
  }
}
</script>

<style lang="scss" scoped>
.options-col-btn{
    font-size: 13px;
}
</style>
