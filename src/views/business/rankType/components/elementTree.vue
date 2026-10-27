// 要素信息树
<template>
    <!-- show-checkbox @check-change="handleCheckChange" -->
    <div class="tree-container">
        <el-alert
            title="拖拽所需要素到右侧列表中"
            type="success"
            class="alert-box"
            :closable="false">
        </el-alert>
        <el-scrollbar class="scrollbar-container" wrapStyle="margin-bottom:0">
            <el-tree
                ref="tree"
                :data="treeData"
                :props="props"
                node-key="code"
                class="tree"
                default-expand-all
                v-loading="loading"
                :expand-on-click-node="false">
                <div class="custom-tree-node allow-dragable" slot-scope="{ node, data }" :data-id="data.code">
                    <div class="tree-label">
                        {{ node.label }}
                    </div>
                    <!-- <div class="tree-options">
                        <icon-svg class="btn-icon" icon-class="dragable"></icon-svg>
                    </div> -->
                </div>
            </el-tree>
        </el-scrollbar>
    </div>
</template>

<script>
import Sortable from 'sortablejs'
import { getElementsMenu } from 'api/pointType/index'

export default {
  data() {
    return {
      loading: false,
      props: {
        label: 'elementName',
        children: 'children'
      },
      checkedAll: false,
      treeData: [{
        code: '-1',
        elementName: '要素目录',
        children: [{
          code: '00',
          elementName: '通用',
          children: []
        }, {
          code: '01',
          elementName: '积分规则专用',
          children: []
        }, {
          code: '02',
          elementName: '客户等级专用',
          children: []
        }]
      }],

      // 某节点下的所有叶子节点集合
      leafNodes: []
    }
  },
  created() {
    this.getTreeData(true)
  },
  methods: {
    // 获取树状图
    getTreeData(isInit = false) {
      this.loading = true
      getElementsMenu({
        type: '00'
      }).then(res => {
        const resData = res.list || {}
        this.$store.dispatch(
          'setRankTypeElements',
          [
            ...resData['00'] || [],
            ...resData['01'] || [],
            ...resData['02'] || []
          ]
        )
        this.treeData[0].children[0].children = resData['00'] || []
        this.treeData[0].children[1].children = resData['01'] || []
        this.treeData[0].children[2].children = resData['02'] || []
      }).finally(() => {
        this.loading = false
        isInit && this.initDrag()
      })
    },
    // 拖拽初始化
    initDrag() {
      // 需要拖拽的dom节点
      const els = document.querySelectorAll('.el-tree-node__content')
      const options = {
        group: {
          name: 'treeList',
          pull: 'clone', // 克隆
          put: false
        },
        draggable: '.allow-dragable',
        direction: 'vertical',
        forceFallback: true,
        onClone(evt) {

        }
      }

      // 由于tree组件的dom结构原因，只能为每个节点都创建拖拽
      els.forEach(el => {
        Sortable.create(el, options)
      })
    },

    /**
         * 获取某节点本身以及其下的所有叶子节点
         * nodeId: 节点id
         * leafNodesData：函数本身用来存储列表的数组，可以不传
         * 注意: 若本身就是叶子节点，就返回本身
         *       若本身不是叶子节点，需要返回以该点为顶点，下面的所有叶子节点
         */
    getNodeLeafs(nodeId) {
      const nodeObj = this.$refs.tree.getNode(nodeId)
      const nodeData = nodeObj.data

      const leafNodesData = []

      switch (nodeObj.level) {
        // 一级节点
        case 1:
          Array.isArray(nodeData.children) && nodeData.children.forEach(children => {
            children.children && children.children.forEach(item => {
              leafNodesData.push(item)
            })
          })
          break
          // 二级节点
        case 2:
          Array.isArray(nodeData.children) && nodeData.children.forEach(children => {
            leafNodesData.push(children)
          })
          break
          // 三级节点：要素节点
        case 3:
          nodeObj.isLeaf && leafNodesData.push(nodeData)
          break
        default:
          // 大于2级节点的其它叶子节点
          nodeObj.level > 2 && nodeObj.isLeaf && leafNodesData.push(nodeData)
          break
      }

      return leafNodesData
    }
  }
}
</script>

<style lang="scss" scoped>
$--color-primary: #6383ff;

.tree-container{
    height: 100%;
    background: #fff;
    padding: 12px 0;
    .alert-box{
        width: calc(100% - 24px);
        margin-left: 12px;
        margin-bottom: 8px;
        padding: 6px 5px;
        ::v-deep.el-alert__title{
            font-size: 12px;
        }
    }
    .scrollbar-container{
        height: calc(100% - 39.5px);
        .tree{
            width: calc(100% - 24px);
            margin: 0 12px;
        }
    }
}
.custom-tree-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: calc(100% - 24px);
    font-size: 13px;
    line-height: 24px;
    .tree-label {
        // 100% - 50px - 20px
        width: calc(100% - 70px);
        // 1.先强制一行内显示文本
        white-space: nowrap;
        // 2.超出部分隐藏
        overflow: hidden;
        // 3.文字用省略号代替
        text-overflow: ellipsis;
        height: 24px;
        line-height: 24px;
        .el-input {
        ::v-deep.el-input__inner {
            height: 21px;
        }
        }
    }
    .btn-icon{
        font-size: 14px;
        color: $--color-primary;
        font-weight: bold;
    }
    &.allow-dragable{
        cursor: move;
    }
}

.sortable-ghost {
    opacity: 0.4;
    background-color: #F4E2C9;
}
</style>
