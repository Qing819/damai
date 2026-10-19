// 测算结果统计表
<template>
    <div class="calculate-container">
        <el-divider></el-divider>
        <el-table
            ref="table"
            size="small"
            :data="tableData"
            max-height="500px"
            border>
            <template v-for="item in tableHeader">
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
        </el-table>
    </div>
</template>

<script>
export default {
  name: 'calculateTable',
  props: {
    // 表头配置
    tableHeader: {
      type: Array,
      required: true
    },
    // 表数据
    tableData: {
      type: Array,
      defalut: () => [],
      required: false
    }
  }
}
</script>

<style lang="scss" scoped>
.calculate-container{
    // overflow-x: hidden;
}
::v-deep.el-divider{
    width: 120%;
    margin-left: -20px;
    background-color: #F0F2F5;
}
::v-deep.el-divider--horizontal{
    height: 10px;
}
</style>