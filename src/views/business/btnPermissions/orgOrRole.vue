// 组织结构或者角色页面
<template>
  <div class="author-tree">
    <el-input
      v-model="filterText"
      suffix-icon="el-icon-search"
      style="width: 100%; height: 28px"
      size="mini"
      placeholder="请输入内容"
    ></el-input>
    <el-tree
      v-loading="loading"
      ref="tree"
      class="tree"
      :filter-node-method="filterNode"
      :props="defaultProps"
      @node-click="handleNode"
      :data="authTrees"
      highlight-current
      style="height:calc(100% - 30px)"
    >
      <div class="custom-tree-node" slot-scope="{ node }">
        <icon-svg class="role-icon" :icon-class="permissionType === 'role' ? 'role' : 'organization'"></icon-svg>
        <el-tooltip class="item" effect="dark" :content="node.label" placement="top-start">
          <div class="label">{{node.label}}</div>
        </el-tooltip>
      </div>
    </el-tree>
  </div>
</template>

<script>
import { getOrganizationInfo, getRoleInfo } from 'api/btnPermissions'
export default {
  props: {
    // 权限类型
    permissionType: {
      type: String,
      default: ''
    },
    // 改变authId的方法
    changeAuthId: {
      type: Function
    }
  },
  data() {
    return {
      loading: false, // 加载状态
      filterText: '',
      defaultProps: {
        children: 'children',
        label: 'authName'
      },
      authTrees: [],
      defaultAuthId: ''// 默认权限id
    };
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    }
  },
  methods: {
    // 点击节点
    handleNode(node) {
      this.$emit('changeAuthId', node.authId)
    },
    // 过滤树节点
    filterNode(value, data) {
      if (!value) return true;
      return data.authName.indexOf(value) !== -1;
    },
    /**
     * 获取组织机构信息
     */
    async getOrgInfo() {
      try {
        this.loading = true;
        const { authTrees } = await getOrganizationInfo()
        this.authTrees = authTrees;
        this.defaultAuthId = authTrees[0].authId
        this.loading = false
      } catch {
        this.loading = false
      }
    },
    /**
     * 获取角色信息
     */
    async getRuleInfo() {
      this.loading = true
      try {
        const { authTrees } = await getRoleInfo()
        this.authTrees = authTrees;
        this.defaultAuthId = authTrees[0].authId
        this.loading = false
      } catch (err) {
        console.error(err)
        this.loading = false
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.author-tree {
  height: 100%;
  padding:10px;
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
        color: #8a8f9d;
        margin-left: 5px;
        font-size: 12px;
      }
      .role-icon {
        width: 9px;
        height: 10px;
      }
    }
  }
}
</style>
