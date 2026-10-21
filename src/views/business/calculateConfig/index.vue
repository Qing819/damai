<template>
  <div class="points-config-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">积分计算配置</span>
        </div>
      </template>

      <!-- 积分规则配置表格 -->
      <el-table
          :data="tableData"
          :span-method="objectSpanMethod"
          border
          style="width: 100%"
          header-cell-class-name="custom-header-cell"
          cell-class-name="custom-table-cell"
      >
        <el-table-column prop="type" label="积分类型" align="center" width="280" />
        <el-table-column label="计算规则" min-width="500">
          <template #default="scope">
            <div class="rules-wrapper">
              <div
                  v-for="(rule, index) in scope.row.rules"
                  :key="index"
                  class="formula-tag"
                  :class="rule.styleType"
              >
                {{ rule.text }}
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 结合新需求更新后的积分配置数据
const tableData = ref([
  // 保费积分相关
  {
    type: '保费积分',
    rules: [
      { text: '保费积分 = 基础保费积分 × 养老协同系数（1.05，若适用）', styleType: 'tag-purple' },
      { text: '趸交保费积分 = 实收保费 × 10%（承保年期 ≤ 10年，且处于保单有效保障期内）', styleType: 'tag-green' },
      { text: '期交保费积分 = 期间实收保费 × 折算系数（折算系数 = min(交费年期 × 10%, 100%)）', styleType: 'tag-gray' },
      { text: '短期险积分 = 实收保费 × 10%', styleType: 'tag-blue' }
    ]
  },
  // 忠诚积分相关
  {
    type: '忠诚积分',
    rules: [
      { text: '忠诚积分 = 连续交费奖励积分 + 二次投保奖励积分', styleType: 'tag-orange' },
      { text: '连续交费奖励积分 = 年交主险保费 × 1%（同一保单连续交费满5年，从第6年起每年触发）', styleType: 'tag-pink' },
      { text: '二次投保奖励积分 = 首期实收保费 × 20%（同一投保人第2次及以上购买，且保单过犹豫期）', styleType: 'tag-blue-light' }
    ]
  },
  // 活动积分
  {
    type: '活动积分',
    rules: [
      { text: '活动积分 = 活动参与积分基数', styleType: 'tag-green' }
    ]
  },
  // 级别积分
  {
    type: '级别积分',
    rules: [
      { text: '级别积分 = 保费积分 + 忠诚积分', styleType: 'tag-gray' }
    ]
  },
  // 消费积分
  {
    type: '消费积分',
    rules: [
      { text: '消费积分 = 保费积分 + 忠诚积分 + 活动积分', styleType: 'tag-orange' }
    ]
  }
])

// 表格合并单元格逻辑（如果后续需要合并行可扩展，当前按行展示）
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }) => ({
  rowspan: 1,
  colspan: 1
})
</script>

<style scoped>
.points-config-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.box-card {
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 10px;
}

.header-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background-color: #409eff;
  border-radius: 2px;
}

/* 单元格与表头样式还原 */
:deep(.custom-header-cell) {
  background-color: #fafafa !important;
  color: #303133;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 0;
}

:deep(.custom-table-cell) {
  padding: 16px;
  vertical-align: middle;
}

/* 规则标签组包装容器 */
.rules-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

/* 公式标签基础样式 */
.formula-tag {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid transparent;
  word-break: break-all;
}

/* 颜色变体（还原图片中的浅色背景与文本颜色） */
/* 紫色系 */
.tag-purple {
  background-color: #f0f2ff;
  border-color: #d6ddff;
  color: #5b6bfa;
}

/* 绿色系 */
.tag-green {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  color: #67c23a;
}

/* 灰色系 */
.tag-gray {
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
}

/* 橙/黄色系 */
.tag-orange {
  background-color: #fdf6ec;
  border-color: #faecd8;
  color: #e6a23c;
}

/* 粉红/红色系 */
.tag-pink {
  background-color: #fef0f0;
  border-color: #fde2e2;
  color: #f56c6c;
}

/* 蓝紫色/浅蓝系 */
.tag-blue-light {
  background-color: #edf5ff;
  border-color: #d9ecff;
  color: #409eff;
}

/* 蓝色系 */
.tag-blue {
  background-color: #e8f4ff;
  border-color: #d3e8ff;
  color: #1890ff;
}
</style>