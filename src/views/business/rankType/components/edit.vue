// 编辑/新增
<template>
    <div class="container" v-loading="loading">
        <div class="container-header">
            <div class="header-left">
                <div class="p-line"></div>
                <div class="title">等级类型{{ this.code ? '编辑' : '新增' }}</div>
            </div>
            <div>
                <el-button type="primary" size="mini" @click="handleSaveClick">
                    <icon-svg class="btn-icon" icon-class="save"></icon-svg>保 存
                </el-button>
                <el-button
                    type="primary"
                    plain
                    size="mini"
                    icon="el-icon-back"
                    class="button-text"
                    @click="handleBack(false)"
                >返 回</el-button>
            </div>
        </div>
        <div class="container-body">
            <resize-layout :showResizeLine="false">
                <template #left>
                    <element-tree ref="tree" class="body-left"></element-tree>
                </template>
                <template #right>
                    <div class="body-right">
                        <div class="body-right-top">
                            <!-- 等级类型：不可编辑状态 -->
                            <template v-if="code">
                                <div>
                                    <span>等级类型 : </span>
                                    <span>{{ formData.name }}</span>
                                </div>
                                <div>
                                    <span class="label">联合主键 : </span>
                                    <template v-if="compositeKeys.length > 0">
                                        <el-tag v-for="(item, index) in compositeKeys" :key="index" size="medium">
                                            {{ item }}
                                        </el-tag>
                                    </template>
                                    <span v-else>无</span>
                                </div>
                            </template>
                            <!-- 等级类型：可编辑状态 -->
                            <el-form
                                v-else
                                ref="form"
                                :model="formData"
                                :rules="rules"
                                size="small"
                                inline
                                @submit.native.prevent>
                                <el-form-item label="等级类型 : " prop="name" inline-message>
                                    <el-input
                                        v-model.trim="formData.name"
                                        size="mini"
                                        maxlength="20"
                                        show-word-limit
                                        placeholder="请输入等级类型名称">
                                    </el-input>
                                </el-form-item>
                            </el-form>
                        </div>
                        <div class="body-right-container">
                            <div class="table-text">
                                <template>
                                    已选择<span class="number">{{ tableSelectRow.length }}</span>项
                                </template>
                                <el-link
                                    type="primary"
                                    :underline="false"
                                    class="clear-btn"
                                    @click="clearSelectRow"
                                >清空</el-link>
                                <div style="margin-left: 10px; display: inline-block">
                                    <el-button v-if="!code" size="mini" type="primary" @click="setPrimaryKey">设为主键</el-button>
                                    <el-button v-if="!code" size="mini" @click="delPrimaryKey">取消主键</el-button>
                                    <el-button size="mini" @click="handleBatDel">删除</el-button>
                                </div>
                            </div>
                            <el-table
                                ref="table"
                                :data="tableData"
                                row-key="elementCode"
                                size="small"
                                height="calc(100% - 50px)"
                                class="edit-table"
                                :span-method="arraySpanMethod"
                                :row-class-name="setRowClassName"
                                @select-all="handleSelectAll"
                                @selection-change="handleSelectionChange">
                                <el-table-column
                                    key="selCol"
                                    width="50"
                                    type="selection"
                                    align="center">
                                </el-table-column>
                                <!-- 表格中要素为空时，显示的提示信息 -->
                                <el-table-column align="center" width="1">
                                    <template slot-scope="{ row }">
                                        <div class="one-line" style="color: rgba(0,0,0,0.25)">{{ row.message }}</div>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="排序"
                                    type="index"
                                    width="45"
                                    align="center">
                                </el-table-column>
                                <!-- 主键列 -->
                                <el-table-column width="28">
                                    <template slot-scope="{ row }">
                                        <el-tooltip
                                            v-if="row.isPrimaryKey === '00'"
                                            effect="dark"
                                            content="主键"
                                            placement="top"
                                            :enterable="false">
                                            <icon-svg
                                                class="primary-key"
                                                icon-class="primarykey">
                                            </icon-svg>
                                        </el-tooltip>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="要素"
                                    min-width="125"
                                    show-overflow-tooltip>
                                    <template slot-scope="{ row }">
                                        <!-- 优先使用数据中的要素名称，其次再通过要素code获取要素数据中的要素名称 -->
                                        <el-tag v-if="row.elementName || elementData(row.elementCode).elementName" size="medium">
                                            {{ row.elementName || elementData(row.elementCode).elementName }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="类型"
                                    prop="elementType"
                                    min-width="100"
                                    show-overflow-tooltip>
                                    <template slot-scope="{ row }">
                                        <!-- 优先使用数据中的要素类型，其次再通过要素code获取要素数据中的要素类型 -->
                                        <el-tag v-if="elementTypeName(row.elementType || elementData(row.elementCode).elementType)" type="success" size="medium">
                                            {{ elementTypeName(row.elementType || elementData(row.elementCode).elementType) }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <!-- <el-table-column
                                    label="是否唯一"
                                    prop="elementOnly"
                                    min-width="90"
                                    align="center"
                                    show-overflow-tooltip>
                                    <template slot-scope="scope">
                                        {{ scope.row.elementOnly === '00' ? '是' : '否' }}
                                    </template>
                                </el-table-column> -->
                                <el-table-column
                                    label="分级列表展示"
                                    prop="isCustomerLevelShow"
                                    min-width="100"
                                    align="center"
                                    show-overflow-tooltip>
                                    <template slot-scope="scope">
                                        <el-checkbox
                                            v-model="scope.row.isCustomerLevelShow"
                                            true-label="00"
                                            false-label="01">
                                            展示列
                                        </el-checkbox>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="顺序调整"
                                    min-width="110"
                                    align="center"
                                    show-overflow-tooltip>
                                    <template slot-scope="{ $index }">
                                        <div>
                                            <el-tooltip
                                                effect="dark"
                                                content="上移"
                                                placement="top"
                                                :enterable="false">
                                                <icon-svg
                                                    class="move-icon"
                                                    icon-class="move-up"
                                                    @click.native="moveUp($index)">
                                                </icon-svg>
                                            </el-tooltip>
                                            <el-tooltip
                                                effect="dark"
                                                content="下移"
                                                placement="top"
                                                :enterable="false">
                                                <icon-svg
                                                    class="move-icon"
                                                    icon-class="move-down"
                                                    @click.native="moveDown($index)">
                                                </icon-svg>
                                            </el-tooltip>
                                            <el-tooltip
                                                effect="dark"
                                                content="置顶"
                                                placement="top"
                                                :enterable="false">
                                                <icon-svg
                                                    class="move-icon"
                                                    icon-class="move-top"
                                                    @click.native="moveTop($index)"
                                                ></icon-svg>
                                            </el-tooltip>
                                            <el-tooltip
                                                effect="dark"
                                                content="置底"
                                                placement="top"
                                                :enterable="false">
                                                <icon-svg
                                                    class="move-icon"
                                                    icon-class="move-bottom"
                                                    @click.native="moveBottom($index)"
                                                ></icon-svg>
                                            </el-tooltip>
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="能否编辑"
                                    prop="isEdit"
                                    min-width="160"
                                    align="center">
                                    <template slot-scope="scope">
                                        <!-- <el-switch v-model="scope.row.isEdit"></el-switch> -->
                                        <custom-switch
                                            v-model="scope.row.isEdit"
                                            activeText="可以编辑"
                                            inactiveText="不可编辑"
                                            activeValue="00"
                                            inactiveValue="01">
                                        </custom-switch>
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作" min-width="50" align="center">
                                    <template slot-scope="scope">
                                        <!-- 不可删除 -->
                                        <el-link
                                            v-if="scope.row.isDelete !== '00'"
                                            slot="reference"
                                            type="danger"
                                            disabled
                                            :underline="false"
                                            class="options-col-btn">
                                            删除
                                        </el-link>
                                        <!-- 可删除 -->
                                        <el-popconfirm
                                            v-else
                                            confirmButtonText='是'
                                            cancelButtonText='否'
                                            icon="el-icon-info"
                                            title="确认删除？"
                                            @confirm="delTr(scope.$index)">
                                            <el-link
                                                slot="reference"
                                                type="danger"
                                                :disabled="scope.row.isDelete === '00' ? false : true"
                                                :underline="false"
                                                class="options-col-btn">
                                                删除
                                            </el-link>
                                            <!-- <i slot="reference" class="del-icon el-icon-delete"></i> -->
                                        </el-popconfirm>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </div>
                </template>
            </resize-layout>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Sortable from 'sortablejs'

import resizeLayout from 'components/resizeLayout'
import customSwitch from 'components/customSwitch'
import elementTree from './elementTree'

import { elementTypeConfig } from 'utils/pointConfig'

import { getRankTypeDetail, saveRankTypeData } from 'api/rankType/index'
import { checkIntegralTypeName } from 'api/pointType/index'

export default {
  name: 'rankTypeEdit',
  components: { resizeLayout, customSwitch, elementTree },
  props: {
    // 积分编码
    code: {
      type: String,
      required: false
    }
  },
  data() {
    const checkNameIsReapt = (rule, value, callback) => {
      if (value) {
        checkIntegralTypeName({
          integralGradeTypeName: this.formData.name,
          type: '01'
        }).then(({ result }) => {
          if (!result) {
            callback(new Error('该名称已存在，请修改名称！'))
          } else {
            callback()
          }
        })
      }
    }
    return {
      loading: false,
      // 表格数据
      tableData: [{ code: '-1', message: '请将要素拖拽到表格内' }],
      // 选中行
      tableSelectRow: [],
      // 表单
      formData: { name: '' },
      // 表单规则
      rules: {
        name: [
          { required: true, message: '请输入等级类型名称！', trigger: 'change' },
          { validator: checkNameIsReapt, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['rankTypeElements']),
    // 联合主键
    compositeKeys() {
      const allPrimaryKeys = this.tableData.filter(item => item.isPrimaryKey === '00')
      return allPrimaryKeys.map(item =>
        item.elementName || this.elementData(item.elementCode).elementName
      )
    },
    // 通过要素code获取要素数据
    elementData() {
      return elementCode => {
        let elementObj = {}
        if (Array.isArray(this.rankTypeElements)) {
          elementObj = this.rankTypeElements.find(item => item.code === elementCode)
        }
        return elementObj || {}
      }
    },
    // 要素类型code转换成名称
    elementTypeName() {
      return elementTypeCode => elementTypeConfig[elementTypeCode] || elementTypeCode
    }
  },
  watch: {
    tableData: {
      handler() {
        if (this.tableData.length === 0) {
          this.tableData.push({ code: '-1', message: '请将要素拖拽到表格内' })
        } else if (this.tableData.length === 1) {
          // 不做处理
        } else {
          this.tableData[0].code === '-1' && this.tableData.splice(0, 1)
        }
      },
      deep: true,
      immediate: true
    }
  },
  created() {
    this.code && this.getDetail()
  },
  mounted() {
    // 阻止默认行为
    document.body.ondrop = function(event) {
      event.preventDefault()
      event.stopPropagation()
    }
    this.drag()
  },
  methods: {
    // 获取积分规则详情
    getDetail() {
      this.loading = true
      getRankTypeDetail({
        gradeCode: this.code
      }).then(res => {
        const elementsList = res?.gradeTypeOneInfo?.gradeElementsVos || []
        // 按照order排序
        elementsList.sort((a, b) => a.ord - b.ord)
        this.tableData = elementsList
        this.formData.name = res.gradeTypeOneInfo.name || ''
      }).finally(() => {
        this.loading = false
      })
    },
    // 点击保存
    handleSaveClick() {
      if (this.$refs.form) {
        this.$refs.form.validate(valid => {
          if (!valid) { return }
          this.saveData()
        })
      } else {
        this.saveData()
      }
    },
    // 保存
    saveData() {
      if (this.tableData.length < 1 || (this.tableData.length === 1 && this.tableData[0].code === '-1')) {
        this.$message({
          type: 'error',
          message: '请您至少配置一个要素到列表中!'
        })
        return
      }
      // 校验是否存在必选
      const needSelectedElemets = ['积分上限', '积分下限', '等级名称']
      let validateResult = true
      needSelectedElemets.forEach(item => {
        if (validateResult) {
          validateResult = this.tableData.some(tableItem => tableItem.elementName === item)
        }
      })
      if (!validateResult) {
        this.$message({
          type: 'error',
          message: '积分上限、积分下限、等级名称为必需配置的要素!'
        })
        return
      }

      // 重置排序
      this.tableData.forEach((item, index) => {
        item.ord = index + 1 + ''
      })
      const params = {
        gradeCode: this.code || '',
        name: this.formData.name,
        addGradeElementVoList: this.tableData
      }
      // 发送请求
      saveRankTypeData(params).then(res => {
        this.$message({
          type: 'success',
          message: '保存成功!',
          duration: 1500
        })
        this.handleBack(true)
      })
    },
    // 返回
    handleBack(needRefresh = false) {
      this.$emit('handleClose', needRefresh)
    },
    // 表格选中行
    handleSelectionChange(data) {
      this.tableSelectRow = data
    },
    // 手动勾选全部
    handleSelectAll(selection) {
      if (selection.length === 1 && selection[0].code === '-1') {
        this.tableSelectRow = []
      }
    },
    // 清空表格选择的列
    clearSelectRow() {
      this.$refs.table.clearSelection()
    },
    // 设置行可以拖拽
    drag() {
      const _this = this
      // 首先获取需要拖拽的dom节点
      const tbody = document.querySelector('.edit-table .el-table__body-wrapper tbody')
      console.log(tbody)
      Sortable.create(tbody, {
        disabled: false, // 是否开启拖拽
        ghostClass: 'sortable-ghost', // 拖拽样式
        animation: 150, // 拖拽延时
        draggable: '.draggable-row', // 可拖拽元素只有带class为draggable-row的元素才可拖拽
        group: {
          name: 'tableList',
          pull: 'clone',
          put: true
        },
        forceFallback: true,

        // 拖拽结束
        onEnd({ newIndex, oldIndex }) {
          if (newIndex !== oldIndex) {
            const currRow = _this.tableData.splice(oldIndex, 1)[0]
            _this.tableData.splice(newIndex, 0, currRow)
          }
        },

        // 新的元素被加入进来
        onAdd(evt) {
          // 新的位置下标
          const newIndex = evt.newIndex
          // 获取克隆元素的信息
          const dataId = evt.clone.getAttribute('data-id')
          // 克隆元素的所有叶子节点数据集合
          const nodeLeafs = _this.$refs.tree.getNodeLeafs(dataId)

          // 循环遍历叶子节点集合，没有的新增进去，已经存在的不做处理
          nodeLeafs.forEach(nodeData => {
            // 检查是否已存在该项
            const hasData = _this.tableData.findIndex(item => item.elementCode == nodeData.code)

            if (hasData === -1) {
              // 表格新增一行
              _this.tableData.splice(newIndex, 0, {
                elementCode: nodeData.code,
                elementName: nodeData.elementName,
                elementType: nodeData.elementType,
                elementOnly: nodeData.elementOnly,
                elementAllowNull: nodeData.elementAllowNull,
                isEdit: '01', // 是否可编辑
                isCustomerLevelShow: '01', // 是否客户等级展示
                isPrimaryKey: '01', // 是否主键
                isDelete: '00' // 是否可以删除
              })
            } else {
              // _this.$message.closeAll()
              // _this.$message({
              //     message: '要素已存在'
              // })
            }

            // 将拖拽进来的元素删除
            const needRemoveEl = document.querySelector('.edit-table .custom-tree-node')
            needRemoveEl && needRemoveEl.parentNode.removeChild(needRemoveEl)
          })

          // 若克隆的是空，需要将拖拽进来的元素删除
          const hasNeedRemoveEl = document.querySelector('.edit-table .custom-tree-node')
          hasNeedRemoveEl && hasNeedRemoveEl.parentNode.removeChild(hasNeedRemoveEl)
        }
      })
    },
    // 删除一行
    delTr(index) {
      this.tableData.splice(index, 1)
    },
    // 设为主键
    setPrimaryKey() {
      if (!Array.isArray(this.tableSelectRow)) { return }

      if (this.tableSelectRow.length === 0) {
        this.$message({
          type: 'warning',
          message: '请至少选择一条需设为主键的要素!',
          duration: 2000
        })
      } else {
        // 已被设置主键的要素集合
        const existPKs = this.tableData.filter(item => item.isPrimaryKey === '00')

        // 准备设为主键的要素集合（排除掉已是主键的要素）
        const noExistPKs = this.tableSelectRow.filter(item =>
          !existPKs.some(e => e.elementCode === item.elementCode)
        )

        // 合并
        const pksMerge = [...noExistPKs, ...existPKs]

        // 校验要素必填性
        // let hasAllowNullElement = pksMerge.some(item => item.elementAllowNull === '00')
        // if (hasAllowNullElement) {
        //     this.$message({
        //         type: 'warning',
        //         message: '设为主键的要素其必填属性必须为是!',
        //         duration: 2000,
        //     })
        //     return
        // }

        // 校验要素唯一性
        if (pksMerge.length === 1) {
          if (pksMerge[0].elementOnly !== '00') {
            this.$message({
              type: 'warning',
              message: '设置一个主键时, 要素必须符合唯一性！',
              duration: 2000
            })
            return
          }
        } else {
          const hasOnlyElement = pksMerge.some(item => item.elementOnly === '00')
          if (hasOnlyElement) {
            this.$message({
              type: 'warning',
              message: '设置联合主键时, 不允许存在唯一性的要素！',
              duration: 2000
            })
            return
          }
        }

        // 设置主键
        this.tableSelectRow.forEach(item => {
          const elementObj = this.tableData.find(({ elementCode }) =>
            elementCode === item.elementCode
          )
          elementObj.isPrimaryKey = '00'
        })

        // 清空选中状态
        this.clearSelectRow()
      }
    },
    // 删除主键
    delPrimaryKey() {
      if (!Array.isArray(this.tableSelectRow)) { return }

      if (this.tableSelectRow.length === 0) {
        this.$message({
          type: 'warning',
          message: '请至少选择一条需取消主键的要素!',
          duration: 2000
        })
      } else {
        this.tableSelectRow.forEach(item => {
          const elementObj = this.tableData.find(({ elementCode }) =>
            elementCode === item.elementCode
          )
          elementObj.isPrimaryKey = '01'
        })
        // 清空选中状态
        this.clearSelectRow()
      }
    },
    // 批量删除
    handleBatDel() {
      if (!Array.isArray(this.tableSelectRow)) { return }

      if (this.tableSelectRow.length === 0) {
        this.$message({
          type: 'warning',
          message: '请至少选择一条需删除的要素!',
          duration: 2000
        })
      } else {
        this.$confirm('确定删除选中要素吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.tableSelectRow.forEach(item => {
              if (item.elementCode) {
                const elementIndex = this.tableData.findIndex(({ elementCode }) =>
                  elementCode === item.elementCode
                )
                elementIndex !== -1 && this.tableData.splice(elementIndex, 1)
              }
            })
          })
      }
    },
    // 上移
    moveUp(index) {
      if (index < 1) { return }
      this.tableData = this.swapArray(this.tableData, index, index - 1)
    },
    // 下移
    moveDown(index) {
      if (index > this.tableData.length - 2) { return }
      this.tableData = this.swapArray(this.tableData, index, index + 1)
    },
    // 置顶
    moveTop(index) {
      if (index < 1) { return }
      const tableDataCopy = JSON.parse(JSON.stringify(this.tableData))
      tableDataCopy.unshift(tableDataCopy.splice(index, 1)[0])
      this.tableData = tableDataCopy
    },
    // 置底
    moveBottom(index) {
      if (index > this.tableData.length - 2) { return }
      const tableDataCopy = JSON.parse(JSON.stringify(this.tableData))
      tableDataCopy.push(tableDataCopy.splice(index, 1)[0])
      this.tableData = tableDataCopy
    },

    /**
        * 数组元素交换位置
        * @param {array} arr 数组
        * @param {number} index1 添加项目的位置
        * @param {number} index2 删除项目的位置
        * 数组index1位置的数据与index2位置的数据互换位置
        * 不会改变原数组，返回交互好位置后的数组
        */
    swapArray(arr, index1, index2) {
      const arrCopy = JSON.parse(JSON.stringify(arr))
      arrCopy[index1] = arrCopy.splice(index2, 1, arrCopy[index1])[0]
      return arrCopy
    },
    // 表格合并行列
    arraySpanMethod({ row, column, rowIndex, columnIndex }) {
      if (row.code === '-1') {
        if (columnIndex === 1) {
          return [1, 11]
        } else {
          return [0, 0]
        }
      } else {
        return [1, 1]
      }
    },
    // 设置行class
    setRowClassName({ row, rowIndex }) {
      return row.code === '-1' ? '' : 'draggable-row'
    }
  }
}
</script>

<style lang="scss" scoped>
$border-radius: 2px;
$--color-primary: #6383ff;

.card {
    border-radius: $border-radius;
    background-color: #fff;
}

.container-header{
    @extend .card;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 8px;
    box-shadow: 0 7px 24px 0 rgba(163, 171, 186, .1);
    .header-left{
        display: flex;
        align-items: center;
        .title{
            font-size: 14px;
            font-weight: 500;
            margin-left: 5px;
            color: #29303e;
        }
    }
    .btn-icon{
        margin-right: 5px;
    }
}
.container-body{
    display: flex;
    height: calc(100% - 50px);
    overflow: hidden;
    .body-left{
        height: 100%;
        border-radius: $border-radius;
    }
    .body-right{
        display: flex;
        flex-direction: column;
        height: 100%;
        margin-left: 8px;
        .body-right-top{
            @extend .card;
            display: flex;
            align-items: center;
            padding: 10px 12px;
            margin-bottom: 8px;
            line-height: 32px;
            font-size: 13px;
            .label{
                // line-height: 28px;
                margin-left: 20px;
            }
            ::v-deep.el-form{
                padding: 8px 0;
            }
            ::v-deep.el-form-item{
                margin-bottom: 0 !important;
            }
            ::v-deep.el-tag{
                margin-left: 5px;
            }
        }
        .body-right-container{
            @extend .card;
            flex: 1;
            // height: calc(100% - 81px);
            padding: 5px 12px;
            ::v-deep.el-tag{
                border-radius: 3px;
                border-width: 0;
                line-height: 28px;
                vertical-align: middle;
                max-width: 100%;
                box-sizing: border-box;
            }
            ::v-deep.el-checkbox__label{
                font-size: 12px;
                padding-left: 6px;
            }
        }
        .table-text{
            padding: 10px 0;
            font-size: 13px;
            font-weight: 500;
            .number{
                color: $--color-primary;
                padding: 0 4px;
            }
            .clear-btn{
                font-size: 13px;
                vertical-align: baseline;
                margin: 0 10px;
            }
        }
    }
    .edit-table{
        .options-col-btn{
            font-size: 13px;
            // color: #F5222D;
        }
        .primary-key{
            font-size: 14px;
            color: $--color-primary;
        }
        .move-icon{
            font-size: 20px;
            color: $--color-primary;
            padding: 0 4px;
            cursor: pointer;
        }
        ::v-deep.el-table__row{
            cursor: move;
        }
        // ::v-deep.header-checkbox{
        //     .el-checkbox__label{
        //         font-size: 12px;
        //         font-weight: bold;
        //         color: #8a8f9d;
        //     }
        // }
        // ::v-deep.el-radio__label{
        //     font-size: 12px;
        // }
    }
}
.sortable-ghost {
    opacity: 0.4;
    background-color: #F4E2C9;
    width: 100%;
}

</style>
