<!-- 按钮授权页面 -->
<template>
  <div class="btn-author">
    <div class="title">按钮授权</div>
    <el-tree
      class="tree"
      v-loading="loading"
      ref="menu"
      :props="defaultProps"
      :data="btnMenu"
      node-key="id"
      @check="handleCheck"
      :default-checked-keys="defaultBtn"
      show-checkbox
      highlight-current
      default-expand-all
      style="height:calc(100% - 30px)">
      <div class="custom-tree-node" slot-scope="{ node }">
        <div class="label">{{node.label}}</div>
      </div>
    </el-tree>
  </div>
</template>

<script>
import { getButtonMenu, getButtonMenuInfo, addButtonMenu } from 'api/btnPermissions'

export default {
  props: {
    // 权限类型
    permissionType: {
      type: String,
      default: '',
      required: true
    },
    // 权限值
    permissionValue: {
      type: String,
      default: '',
      required: true
    }
  },
  data() {
    return {
      loading: false, // 加载状态
      filterText: '',
      defaultProps: {
        children: 'children',
        label: 'menuName'
      },
      btnMenu: [],
      baseId: [], // 按钮id集合
      defaultBtn: [] // 编辑状态默认选中的按钮
    }
  },
  watch: {
    permissionValue: {
      handler() {
        this.getButtonMenuInfo()
      },
      deep: true
    }
  },
  created() {
    this.getButtonMenu()
  },
  methods: {
    // 获取所有按钮内容
    getButtonMenu() {
      this.loading = true
      getButtonMenu().then(({ authTrees }) => {
        const allData = JSON.parse(JSON.stringify(authTrees))
        allData[0].children.forEach(btns => {
          if (btns.children.length !== 0) {
            btns.children.forEach(btn => {
              const button = []
              if (btn.baseElements && btn.baseElements.length !== 0) {
                btn.baseElements.forEach(item => {
                  button.push({
                    id: item.id,
                    menuName: item.name,
                    children: []
                  })
                })
              }
              btn.children = button
            })
          }
        })
        this.btnMenu = allData
      }).finally(() => {
        this.loading = false
      })
    },
    // 获取所有角色、组织机构按钮权限
    getButtonMenuInfo() {
      this.$refs.menu.setCheckedKeys([])
      const params = {
        permissionType: this.permissionType,
        permissionValue: this.permissionValue
      }
      this.loading = true
      getButtonMenuInfo(params).then(({ list }) => {
        this.defaultBtn = list
      }).finally(() => {
        this.loading = false
      })
    },
    // 处理选中内容
    handleCheck(node, key) {
      this.baseId = key.checkedKeys
    },
    // 处理按钮权限保存
    handleSave() {
      const params = {
        baseId: this.baseId,
        permissionType: this.permissionType,
        permissionValue: this.permissionValue
      }
      this.loading = true
      addButtonMenu(params).then(({ result }) => {
        if (result) {
          this.$message.success('保存成功！')
          this.getButtonMenuInfo()
        } else {
          this.$message.warning('保存失败！')
        }
      }).finally(() => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.btn-author {
  height: 100%;
  padding:10px;
  .title{
    font-size: 13px;
  }
  .tree {
    width: 100%;
    overflow-y: auto;
    .custom-tree-node {
      width: calc(100% - 24px);
      display: flex;
      align-items: center;
      .label {
        margin-left: 5px;
        flex: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        color: #29303e;
        margin-left: 5px;
        font-size: 13px;
      }
      .role-icon {
        width: 9px;
        height: 10px;
      }
    }
  }
}
</style>
