<template>
  <div class="dialog-container">
    <div class="header">
      <span class="header-title">
        <template>要素新增</template>
      </span>
      <div class="header-button">
        <el-button :loading="saveBtnLaoding" @click="addSave" size="mini" type="primary">
          <icon-svg class="btn-icon" icon-class="save"></icon-svg> 保 存
        </el-button>
        <el-button
          size="mini"
          type="primary"
          icon="el-icon-back"
          plain
          @click="$emit('update:dialogVisible', false)"
        >返 回</el-button>
      </div>
    </div>
    <div class="add-element">
      <div class="table-form">
        <el-form size="mini" label-width="100px">
          <el-form-item style="margin-bottom: 0" label="标签库名称">
            <el-input :value="currentLabelStore.name" placeholder="请选择标签库">
              <template slot="append">
                <el-button @click="openLabelStoreDialog" size="small" type="primary">选 择</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="table-main">
        <el-form size="mini" ref="formData" :model="formData" :rules="formData.rules">
          <el-table size="mini" v-loading="tableLoading" :data="formData.tableData" style="width: 100%" height="100%">
            <el-table-column align="center" prop="_name" label="要素名称" width="180">
              <template #default="{ row, $index }">
                <el-form-item :prop="'tableData.' + $index + '._name'" :rules="rules._name">
                  <el-input readonly v-model="row._name" placeholder="请选择标签">
                    <template slot="append">
                      <el-button @click="openLabelDialog(row)" type="primary">选 择</el-button>
                    </template>
                  </el-input>
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="isPercentage" label="是否为百分比" width="140">
              <template #default="{ row, $index }">
                <el-form-item v-if="row.type === '1'" :prop="'tableData.' + $index + '.isPercentage'" :rules="rules.isPercentage">
                  <el-select filterable @change="row.elementContent = ''" v-model="row.isPercentage" placeholder="请选择">
                    <el-option value="00" label="是"></el-option>
                    <el-option value="01" label="否"></el-option>
                  </el-select>
                </el-form-item>
                <template v-else>
                  <el-input size="mini" style="margin-bottom: 18px" disabled> </el-input>
                </template>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="elementContent" label="内容" width="200">
              <template #default="{ row, $index }">
                <!-- 0 文本 1 数值  -->
                <template v-if="['0', '1', ''].includes(row.type)">
                  <el-input size="mini" style="margin-bottom: 18px" disabled> </el-input>
                </template>
                <el-form-item v-else :prop="'tableData.' + $index + '.elementContent'" :rules="rules.elementContent">
                  <!-- 下拉选项 or 时间-->
                  <template v-if="['2', '3'].includes(row.type)">
                    <el-input readonly v-model="row.elementContent" placeholder="请输入"> </el-input>
                  </template>
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="elementLength" label="长度">
              <template #default="{ row, $index }">
                <!-- 文字 数字 -->
                <el-form-item
                  v-if="['0', '1'].includes(row.type)"
                  :prop="'tableData.' + $index + '.elementLength'"
                  :rules="rules.elementLength"
                >
                  <el-input v-model="row.elementLength" placeholder="请输入"> </el-input>
                </el-form-item>

                <template v-else>
                  <el-input size="mini" style="margin-bottom: 18px" disabled> </el-input>
                </template>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="elementPoint" label="小数点">
              <template #default="{ row, $index }">
                <!-- 数字 百分比 -->
                <el-form-item v-if="['1'].includes(row.type)" :prop="'tableData.' + $index + '.elementPoint'" :rules="rules.elementPoint">
                  <el-input v-model="row.elementPoint" placeholder="请输入"> </el-input>
                </el-form-item>
                <template v-else>
                  <el-input size="mini" style="margin-bottom: 18px" disabled> </el-input>
                </template>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="category" label="所属分类" width="160">
              <template #default="{ row, $index }">
                <el-form-item :prop="'tableData.' + $index + '.category'" :rules="rules.category">
                  <el-select filterable v-model="row.category" placeholder="请选择">
                    <el-option value="00" label="通用"></el-option>
                    <el-option value="01" label="积分规则专用"></el-option>
                    <el-option value="02" label="客户等级专用"></el-option>
                  </el-select>
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="elementAllowNull" label="是否必填">
              <template #default="{ row, $index }">
                <el-form-item :prop="'tableData.' + $index + '.elementAllowNull'" :rules="rules.elementAllowNull">
                  <el-select filterable v-model="row.elementAllowNull" placeholder="请选择">
                    <el-option value="01" label="必填"></el-option>
                    <el-option value="00" label="非必填"></el-option>
                  </el-select>
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="elementOnly" label="是否唯一">
              <template #default="{ row, $index }">
                <el-form-item :prop="'tableData.' + $index + '.elementOnly'" :rules="rules.elementOnly">
                  <el-select filterable v-model="row.elementOnly" placeholder="请选择">
                    <el-option value="00" label="唯一"></el-option>
                    <el-option value="01" label="不唯一"></el-option>
                  </el-select>
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column align="center" label="操作" width="60px">
              <template #default="{ row, $index }">
                <el-popconfirm
                    confirmButtonText='是'
                    cancelButtonText='否'
                    icon="el-icon-info"
                    title="确认删除？"
                    @confirm="deleteRow(row, $index)">
                    <el-link
                        slot="reference"
                        type="danger"
                        :underline="false"
                        style="margin-bottom: 18px; font-size: 13px"
                        class="options-col-btn">
                        删除
                    </el-link>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
      </div>
      <div class="table-add">
        <el-button @click="addRow" size="small" icon="el-icon-plus" type="primary" plain>添 加</el-button>
      </div>
      <!-- 标签库弹窗 -->
      <el-dialog class="sub-dialog" width="70%" title="标签库选择" :visible.sync="labelStoreDialog" append-to-body>
        <div class="dialog-search">
          <el-form size="mini" label-width="100px">
            <el-form-item style="width: 50%" label="标签库名称：">
              <el-input v-model="labelStorePage.name" placeholder="请输入标签库名称">
                <template slot="append">
                  <el-button @click="labelStoreSearch" size="small" type="primary">查 询</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>

        <div class="dialog-table">
          <el-table size="mini" v-loading="dialogLoading" height="100%" :data="labelStoreTableData" style="width: 100%">
            <el-table-column align="center" type="index" label="序号"> </el-table-column>
            <el-table-column align="center" prop="name" label="标签库名称"> </el-table-column>
            <el-table-column align="center" prop="className" label="分类"> </el-table-column>
            <el-table-column align="center" prop="basicName" label="对应数据集"></el-table-column>
            <el-table-column align="center" prop="createUser" label="创建人"></el-table-column>
            <el-table-column width="160" align="center" prop="creatTime" label="创建时间"></el-table-column>
            <el-table-column width="160" align="center" prop="updateTime" label="更新时间"></el-table-column>
            <el-table-column align="center" label="操作" min-width="80px" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="text" @click="selectLabelStore(row)">选 择</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- 分页区域 -->
        <div class="dialog-page">
          <el-pagination
            :disabled="dialogLoading"
            @size-change="getLabelStoreList"
            @current-change="getLabelStoreList"
            :page-sizes="[10, 20, 30, 40]"
            :current-page.sync="labelStorePage.pageNum"
            :page-size.sync="labelStorePage.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="labelStoreTotal"
            background
          ></el-pagination>
        </div>
      </el-dialog>
      <!-- 标签弹窗 -->
      <el-dialog class="sub-dialog" width="70%" title="标签选择" :visible.sync="labelDialog" append-to-body>
        <div class="dialog-search">
          <el-form size="mini" label-width="85px">
            <el-form-item style="width: 50%" label="标签名称：">
              <el-input v-model="labelPage.name" placeholder="请输入标签名称">
                <template slot="append">
                  <el-button @click="labelSearch" size="small" type="primary">查 询</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>

        <div class="dialog-table">
          <el-table size="mini" v-loading="dialogLoading" height="100%" :data="labelTableData" style="width: 100%">
            <el-table-column align="center" type="index" label="序号"> </el-table-column>
            <el-table-column align="center" prop="name" label="标签名称"> </el-table-column>
            <el-table-column align="center" prop="type" label="标签类型">
              <template #default="{ row }">
                <span v-if="row.type === '0'">文本型</span>
                <span v-if="row.type === '1'">数值型</span>
                <span v-if="row.type === '2'">日期型</span>
                <span v-if="row.type === '3'">维度型</span>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="field" label="字段"></el-table-column>
            <el-table-column align="center" prop="renewalCycle" label="更新周期">
              <template #default="{ row }">
                <span v-if="row.renewalCycle === '0'">年</span>
                <span v-if="row.renewalCycle === '1'">月</span>
                <span v-if="row.renewalCycle === '2'">周</span>
                <span v-if="row.renewalCycle === '4'">日</span>
              </template>
            </el-table-column>
            <el-table-column fixed="right" align="center" label="操作" min-width="80px">
              <template #default="{ row }">
                <el-button size="small" type="text" @click="selectLabel(row)">选 择</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- 分页区域 -->
        <div class="dialog-page">
          <el-pagination
            :disabled="dialogLoading"
            :page-sizes="[10, 20, 30, 40]"
            :current-page.sync="labelPage.pageNum"
            :page-size.sync="labelPage.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="labelTotal"
            background
            @size-change="getLabelList"
            @current-change="getLabelList"
          ></el-pagination>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import {
  getPageLabrary,
  getLabelInfoByLabraryId,
  checkIntegralElementName,
  addIntegralElementInfo,
  getDimTableData
} from 'api/elementConfig'

export default {
  props: {
    dialogVisible: Boolean
  },
  data() {
    return {
      formData: {
        tableData: []
      },
      rules: {
        _name: [{ required: true, message: '请选择标签', trigger: 'change' }],
        isPercentage: [{ required: true, message: '请选择是否为百分比' }],
        // elementContent: [{ required: true, message: '请选择或输入内容' }],
        elementLength: [{ required: true, message: '请输入长度' }],
        elementPoint: [{ required: true, message: '请输入小数点' }],
        category: [{ required: true, message: '请选择所属分类' }],
        elementAllowNull: [{ required: true, message: '请选择是否必填' }],
        elementOnly: [{ required: true, message: '请选择是否唯一' }]
      },
      tableLoading: false,

      dialogLoading: false,

      // 标签库
      labelStoreDialog: false,
      labelStoreTableData: [],
      labelStorePage: {
        name: '',
        pageNum: 1,
        pageSize: 10
      },
      labelStoreTotal: 0,
      currentLabelStore: {},
      // 标签
      labelDialog: false,
      labelTableData: [],
      labelPage: {
        id: '',
        name: '',
        pageNum: 1,
        pageSize: 10
      },
      labelTotal: 0,
      currentLabel: {},
      // 当前编辑的行
      currentRow: {},
      saveBtnLaoding: false
    }
  },
  methods: {
    // 获取标签库列表
    async getLabelStoreList() {
      this.dialogLoading = true
      try {
        const {
          list: { list, total }
        } = await getPageLabrary(this.labelStorePage)
        this.labelStoreTableData = list
        this.labelStoreTotal = total
      } catch (error) {
        console.log(error)
      }
      this.dialogLoading = false
    },
    // 标签库查询按钮
    labelStoreSearch() {
      this.labelStorePage.pageNum = 1
      this.getLabelStoreList()
    },
    // 根据标签库id获取标签列表
    async getLabelList() {
      this.dialogLoading = true
      try {
        const {
          data: { list, total }
        } = await getLabelInfoByLabraryId(this.labelPage)
        this.labelTableData = list
        this.labelTotal = total
      } catch (error) {
        console.log(error)
      }
      this.dialogLoading = false
    },
    // 标签查询按钮
    labelSearch() {
      this.labelPage.pageNum = 1
      this.getLabelList()
    },
    openLabelStoreDialog() {
      this.labelStoreDialog = true
      // 请求标签库列表数据
      this.getLabelStoreList()
    },
    openLabelDialog(row) {
      this.labelDialog = true
      this.currentRow = row
      this.labelPage.id = this.currentLabelStore.id
      this.getLabelList()
    },
    // 标签库弹窗内点击选择
    selectLabelStore(row) {
      this.labelStoreDialog = false
      // 当前标签库
      this.currentLabelStore = row
      // 重置所有要素
      this.formData.tableData = [
        {
          _name: '',
          type: '',
          isPercentage: '',
          elementContent: '',
          elementLength: '',
          elementPoint: '',
          category: '',
          elementAllowNull: '',
          elementOnly: ''
        }
      ]
      console.log(row)
      // 重置表格内的表单的校验和输入
      this.$refs.formData.resetFields()
    },
    // 选择标签
    async selectLabel(row) {
      const isExist = this.formData.tableData.some(item => item._name === row.name)
      if (isExist) {
        return this.$message.warning('要素名称已存在')
      }
      try {
        this.dialogLoading = true
        // 选择标签前需要校验当前标签是否已存在
        const { result } = await checkIntegralElementName({ labelId: row.id })
        if (result) {
          // 维度型，查询维表获取内容
          if (row.type === '3') {
            const { data } = await getDimTableData({ dimTableId: row.dimTableId })
            // 更新当前标签行的内容
            this.currentRow.elementContent = data.map(item => item.codeName).toString()
          }
          // 日期型，不需要接口查询，直接设置内容
          if (row.type === '2') {
            this.currentRow.elementContent = row.dataFormat
          }
          this.currentLabel = row
          this.currentRow._name = row.name
          this.currentRow.type = row.type
          this.currentRow.labelId = row.id
          this.currentRow.labraryId = this.currentLabelStore.id

          this.labelDialog = false
        } else {
          this.$message.warning('要素名称已存在')
        }
      } catch (error) {
        console.log(error)
      }
      this.dialogLoading = false
    },
    deleteRow(row, index) {
      this.formData.tableData.splice(index, 1)
    },
    addRow() {
      if (!this.currentLabelStore.name) {
        return this.$message.warning('请选择标签库')
      }
      this.labelStorePage.pageNum = 1
      this.$refs.formData.validate(valid => {
        if (valid) {
          this.formData.tableData.push({
            _name: '',
            type: '',
            elementContent: '',
            elementLength: '',
            elementPoint: '',
            category: '',
            elementAllowNull: '',
            elementOnly: ''
          })

          this.$nextTick(() => {
            const tableBody = document.querySelector('.dialog-container .el-table__body-wrapper')
            tableBody.scrollTop = tableBody.scrollHeight
          })
        }
      })
    },
    addSave() {
      if (this.formData.tableData.length === 0) return this.$message.warning('请至少设置一个要素')
      this.$refs.formData.validate(async valid => {
        if (valid) {
          console.log(this.formData.tableData)
          this.saveBtnLaoding = true
          const addIntegralElementVo = this.formData.tableData.map(item => ({
            isPercentage: item.isPercentage || '01',
            // elementContent: item.elementContent,
            elementLength: item.elementLength,
            elementPoint: item.elementPoint,
            category: item.category,
            elementAllowNull: item.elementAllowNull,
            elementOnly: item.elementOnly,
            labelId: item.labelId,
            labraryId: item.labraryId
          }))
          try {
            const { result } = await addIntegralElementInfo(addIntegralElementVo)
            if (result) {
              this.$message.success('操作成功')
              this.$emit('update:dialogVisible', false)
              this.$emit('updateList')
            }
          } catch (error) {}
          this.saveBtnLaoding = false
        }
      })
    },
    // 初始化页面
    initPage() {
      // 初始化一些参数
      this.formData.tableData = []
      this.currentLabelStore = {}
      this.currentLabel = {}
      this.currentRow = {}
    }
  },
  created() {
    // this.initPage()
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
    margin-bottom: 10px;
    background-color: #fff;
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
  .add-element {
    height: calc(100% - 45px - 10px);
    background-color: #fff;
    .table-form {
      height: 50px;
      display: flex;
      align-items: center;
    }
    .table-main {
      height: calc(100% - 50px - 44px);
      .el-form {
        height: 100%;
      }
      .table-operate {
        cursor: pointer;
      }
    }
    .table-add {
      // height: 40px;
      padding: 6px;
      .el-button {
        width: 100%;
        border: 1px dashed #ccc;
      }
    }
  }
  .table-main {
    /deep/.el-table__body-wrapper,
    /deep/.el-table__fixed-body-wrapper {
      td {
        font-size: 13px;
        padding: 0;
        height: 80px;
      }
    }
  }
}
.sub-dialog {
  /deep/.el-dialog__body {
    height: 60vh;
    .dialog-search {
      height: 40px;
    }
    .dialog-table {
      height: calc(100% - 40px - 42px);
    }
    .dialog-page {
      padding-top: 10px;
    }
  }
}
</style>