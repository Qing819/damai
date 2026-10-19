<template>
  <div class="dialog-container">
    <div class="header">
      <span class="header-title">
        <template>积分计算配置新建</template>
      </span>
      <div class="header-button">
        <el-button @click="saveForm" size="small" type="primary"> <icon-svg class="btn-icon" icon-class="save"></icon-svg>保 存 </el-button>
        <el-button @click="$emit('update:dialogVisible', false)" size="small" type="primary" icon="el-icon-back">返 回</el-button>
      </div>
    </div>
    <div class="form">
      <el-form size="mini" label-width="100px">
        <el-form-item style="width: 25%" label="积分类型：">
          <el-select filterable value="忠诚积分">
            <el-option value="忠诚积分" label="忠诚积分"></el-option>
            <el-option value="级别积分" label="级别积分"></el-option>
            <el-option value="消费积分" label="消费积分"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item style="width: 25%" label="标签库名称：">
          <el-input value="" placeholder="请选择标签库">
            <template slot="append">
              <el-button @click="openDialog" size="small" type="primary">选 择</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>
    <div class="main">
      <!-- 指标or符号  -->
      <div class="left">
        <!-- 指标 -->
        <div class="left-top">
          <div class="title">指标</div>
          <draggable class="index-content content" :move="onMove" v-model="indexList" v-bind="indexOptions">
            <el-tag v-for="(item, index) in indexList" :key="item.value" class="item" :type="computeByIndex(item, index)">{{
              item.value
            }}</el-tag>
          </draggable>
        </div>
        <!-- 符号 -->
        <div class="left-bottom">
          <div class="title">运算符号</div>
          <draggable class="symbol-content content" :move="onMove" v-model="symbolList" v-bind="indexOptions">
            <el-tag type="info" effect="plain" v-for="(item, index) in symbolList" :key="index" class="item">{{ item.value }}</el-tag>
          </draggable>
        </div>
      </div>
      <!-- 规则 -->
      <div class="middle">
        <div class="title">积分计算规则</div>
        <draggable class="rule-content content" :move="onMove" v-model="ruleList" v-bind="ruleOptions" @change="ruleChange">
          <el-tag
            class="item"
            :class="tag.showInput ? 'number' : ''"
            disable-transitions
            @dblclick.native="editTag(tag, index)"
            @contextmenu.native.prevent="removeTag(tag, index)"
            v-for="(tag, index) of ruleList"
            :type="tag.tagType"
            :effect="tag.tagType ? 'light' : 'plain'"
            :key="index"
          >
            <span v-if="!tag.showInput">{{ tag.value }}</span>
            <el-input-number
              size="mini"
              :controls="false"
              v-if="tag.showInput"
              v-model="tag.value"
              @blur="inputBlur(tag, index)"
            ></el-input-number>
          </el-tag>
        </draggable>
      </div>
      <!-- 右侧 -->
      <div class="right">
        <div class="title">积分规则</div>
        <draggable class="index-content content" :move="onMove" v-model="rightList" v-bind="indexOptions">
          <el-tag v-for="(item, index) in rightList" :key="item.value" class="item" :type="computeByIndex(item, index)">{{
            item.value
          }}</el-tag>
        </draggable>
      </div>
    </div>
    <!-- 标签库弹窗 -->
    <el-dialog class="sub-dialog" width="70%" title="标签库选择" :visible.sync="labelStoreDialog" append-to-body>
      <div class="dialog-search">
        <el-form size="mini" label-width="100px">
          <el-form-item style="width: 50%" label="标签库名称：">
            <el-input value="" placeholder="请输入标签库名称">
              <template slot="append">
                <el-button size="small" type="primary">查 询</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="dialog-table">
        <el-table size="mini" v-loading="dialogLoading" height="100%" :data="labelStoreTableData" style="width: 100%">
          <el-table-column align="center" type="index" label="序号"> </el-table-column>
          <el-table-column align="center" prop="_labelSName" label="标签库名称"> </el-table-column>
          <el-table-column align="center" prop="B" label="分类"> </el-table-column>
          <el-table-column align="center" prop="C" label="对应数据集"></el-table-column>
          <el-table-column align="center" prop="D" label="创建人"></el-table-column>
          <el-table-column width="160" align="center" prop="E" label="创建时间"></el-table-column>
          <el-table-column width="160" align="center" prop="E" label="更新时间"></el-table-column>
          <el-table-column align="center" label="操作" width="100px">
            <template #default="{ row }">
              <el-button size="small" type="text" @click="selectLabelStore(row)" class="1">选 择</el-button>
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
          :page-sizes="[20, 40, 60, 80]"
          :current-page.sync="labelStorePage.pageNum"
          :page-size.sync="labelStorePage.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="labelStoreTotal"
          background
        >
        </el-pagination>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import { guid } from 'utils'
export default {
  components: {
    draggable
  },
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      labelStoreDialog: false,
      dialogLoading: false,
      labelStoreTableData: [],
      labelStoreTotal: 0,
      labelStorePage: {
        pageNum: 0,
        pageSize: 20
      },
      // 指标列表 (左侧)
      indexList: [
        {
          id: guid(),
          value: '首期积分系数',
          type: '01',
          originType: 'index'
        },
        {
          id: guid(),
          value: '续期积分系数',
          type: '01',
          originType: 'index'
        },
        {
          id: guid(),

          value: '缴费年限',
          type: '01',
          originType: 'index'
        },
        {
          id: guid(),
          value: '多次购保积分基数',
          type: '01',
          originType: 'index'
        },
        {
          id: guid(),
          value: '测试',
          type: '01',
          originType: 'index'
        }
      ],
      // 符号列表 (左侧)
      symbolList: [
        {
          id: guid(),
          value: '+',
          type: '03',
          originType: 'symbol'
        },
        {
          id: guid(),
          value: '-',
          type: '03',
          originType: 'symbol'
        },
        {
          id: guid(),

          value: '*',
          type: '03',
          originType: 'symbol'
        },
        {
          id: guid(),
          value: '/',
          type: '03',
          originType: 'symbol'
        },
        {
          id: guid(),
          value: '(',
          type: '03',
          originType: 'symbol'
        },
        {
          id: guid(),
          value: ')',
          type: '03',
          originType: 'symbol'
        },
        {
          id: guid(),
          value: 'Floor',
          type: '03',
          originType: 'symbol'
        },
        {
          id: guid(),
          value: '0',
          type: '03',
          originType: 'symbol',
          showInput: false
        }
      ],
      // 规则列表 (中间)
      ruleList: [],
      // 右侧列表 (右侧)
      rightList: [
        {
          id: guid(),
          value: '首期积分系数',
          type: '02',
          originType: 'right'
        },
        {
          id: guid(),
          value: '续期积分系数',
          type: '02',
          originType: 'right'
        },
        {
          id: guid(),
          value: '缴费年限',
          type: '02',
          originType: 'right'
        },
        {
          id: guid(),
          value: '多次购保积分基数',
          type: '02',
          originType: 'right'
        },
        {
          id: guid(),
          value: '测试',
          type: '02',
          originType: 'right'
        }
      ],
      // 中间配置
      ruleOptions: {
        animation: 200,
        group: {
          name: 'rule'
        },
        disabled: false
      },
      // 两侧配置 (共用)
      indexOptions: {
        animation: 200,
        group: {
          name: 'rule',
          pull: 'clone'
        },
        disabled: false
      }
    }
  },
  methods: {
    openDialog() {
      this.labelStoreDialog = true
    },
    getLabelStoreList() {},
    ensure() {
      this.$emit('update:dialogVisible', false)
    },
    computeByIndex(item, index) {
      switch (index % 5) {
        case 0:
          item.tagType = 'primary'
          return 'primary'
        case 1:
          item.tagType = 'success'
          return 'success'
        case 2:
          item.tagType = 'info'
          return 'info'
        case 3:
          item.tagType = 'warning'
          return 'warning'
        case 4:
          item.tagType = 'danger'
          return 'danger'
        default:
          break
      }
    },
    ruleChange(e) {
      // 添加元素
      if (e.added) {
        this.ruleList = JSON.parse(JSON.stringify(this.ruleList))
        const newTag = this.ruleList.find(item => item.originType !== 'rule')
        newTag && (newTag.originType = 'rule')
      }
      console.log(this.ruleList)
    },
    removeTag(tag, index) {
      this.$confirm('是否删除?', '确认框', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          this.ruleList.splice(index, 1)
          this.$message.success('操作成功')
        })
        .catch(() => {
          console.log('取消')
        })
    },
    editTag(tag, index) {
      if (tag.type === '03') {
        if (isNaN(tag.value)) {
          return
        } else {
          console.log(tag)
          tag.showInput = true

          this.$nextTick(() => {
            // this.$refs.symbol[index].focus()
            document.querySelector('.number .el-input__inner').focus()
          })
        }
      }
    },
    inputBlur(tag, index) {
      if (tag.value === undefined) {
        tag.value = 0
      }
      tag.showInput = false
    },
    onMove(e) {
      // 除了中间意外 其他区域内部不允许停靠
      if (e.relatedContext.element?.originType === 'index') return false
      if (e.relatedContext.element?.originType === 'symbol') return false
      if (e.relatedContext.element?.originType === 'right') return false
      return true
    },
    dragEnd(e) {
      console.log(e)
    },
    saveForm() {}
  }
}
</script>

<style  lang='scss' scoped>
.dialog-container {
  height: 100%;
  background-color: #f4f4f4;
  .header {
    padding: 0 10px;
    height: 40px;
    margin-bottom: 12px;
    background-color: #fff;
    line-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 12px;
    .header-title {
      display: flex;
      align-items: center;
      color: #29303e;

      &::before {
        content: '';
        display: inline-block;
        width: 3px;
        height: 12px;
        border-radius: 1px;
        margin-right: 12px;
        background-color: #6383ff;
      }
    }
  }

  .form {
    width: 100%;
    height: 50px;
    background-color: #fff;
    .el-form {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      .el-form-item {
        margin: 0;
      }
    }
  }
  .main {
    height: calc(100% - 40px - 12px - 50px);
    display: flex;
    border: 1px solid #ccc;
    background-color: #fff;

    .left {
      display: flex;
      flex-direction: column;
      width: 25%;
      height: 100%;
      .left-top {
        height: 70%;
      }
      .left-bottom {
        height: 30%;
      }
    }
    .middle {
      width: 50%;
      border: 1px solid #ccc;
      border-top: none;
      border-bottom: none;
    }
    .right {
      width: 25%;
    }
    // 每个模块的标题
    .title {
      padding: 0 10px;
      background-color: #eef5ff;
      height: 30px;
      line-height: 30px;
      font-size: 14px;
      font-weight: 600;
      color: #000;
    }
    // 每个模块的内容
    .content {
      height: calc(100% - 30px);
      padding: 4px;
      overflow-y: auto;
      .item {
        width: fit-content;
        &:hover {
          transition: all 0.2s;

          box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.2);
          cursor: grab;
        }
      }
      .number {
        padding: 0 2px;
      }
    }
    .index-content {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      gap: 10px;
    }
    .symbol-content {
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      overflow-y: auto;
      gap: 10px;
      padding: 4px;
    }
    .rule-content {
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      overflow-y: auto;
      gap: 2px;
      padding: 4px;
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
      height: calc(100% - 40px - 40px);
    }
    .dialog-page {
      height: 40px;
      padding: 4px 0;
    }
  }
}
.el-input-number {
  width: auto;
  /deep/ .el-input {
    .el-input__inner {
      width: 40px;
      height: 25px;
      padding: 0;
    }
  }
}
</style>