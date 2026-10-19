<!-- 按钮权限管理页面 -->
<template>
  <div class="author-container">
    <div class="author-inner">
      <!-- 头部 -->
      <div class="header">
        <div class="title">
          <div class="title-icon"></div>
          <div class="title-text">积分按钮授权</div>
        </div>
        <div class="authorization-buttons">
          <el-radio-group v-model="authTypeName" size="mini" @change="handleAuthData">
            <el-radio-button label="角色授权"></el-radio-button>
            <el-radio-button label="组织机构授权"></el-radio-button>
          </el-radio-group>
        </div>
        <div class="edit-button">
          <el-button type="primary" size="mini" @click="handleSave">
            <icon-svg icon-class="save"></icon-svg>
            保存
          </el-button>
        </div>
      </div>
      <!-- body -->
      <div style="height: calc(100% - 40px)">
        <resize-layout>
          <div slot="left" style="height: 100%">
            <org-or-role ref="orgOrRole" @changeAuthId="changeAuthId" :permissionType="permissionType"></org-or-role>
          </div>
          <div slot="right" style="height: 100%">
            <author-tree ref="authorTree" :permissionValue="permissionValue" :permissionType="permissionType"></author-tree>
          </div>
        </resize-layout>
      </div>
    </div>
  </div>
</template>

<script>
import orgOrRole from './orgOrRole';
import authorTree from './authorTree';
import resizeLayout from 'components/resizeLayout'
export default {
  name: 'index',
  components: { authorTree, orgOrRole, resizeLayout },
  data() {
    return {
      authTypeName: '角色授权', // 授权的类型名称
      permissionType: 'role', // 授权的类型编码
      permissionValue: ''// 权限id
    }
  },
  async mounted() {
    await this.$refs.orgOrRole.getRuleInfo()
    this.permissionValue = this.$refs.orgOrRole.defaultAuthId
  },
  methods: {
    // /改变权限id的值
    changeAuthId(val) {
      this.permissionValue = val
    },
    /**
     * 处理授权内容
     * 如果类型为'00',获取角色信息
     * 如果类型为'01',获取组织机构信息
     */
    async handleAuthData(val) {
      console.log(val)
      if (val === '角色授权') {
        this.permissionType = 'role'
        await this.$refs.orgOrRole.getRuleInfo()
        this.permissionValue = this.$refs.orgOrRole.defaultAuthId
      } else {
        this.permissionType = 'org'
        await this.$refs.orgOrRole.getOrgInfo()
        this.permissionValue = this.$refs.orgOrRole.defaultAuthId
      }
    },
    // 处理保存，将表格页面的授权进行保存
    handleSave() {
      this.$refs.authorTree.handleSave()
    }
  }
}
</script>

<style scoped lang="scss">
  .author-container {
    width:100%;
    height:100%;
    padding: 8px;
    .author-inner {
      width:100%;
      height:100%;
      background-color: #ffffff;
      border-radius: 4px;
      .header {
        width: 100%;
        height: 40px;
        border-bottom: 1px solid #E3E5ED;
        display: flex;
        align-items: center;
        padding: 0 17px;
        .title {
          display: flex;
          align-items: center;
          width:105px;
          .title-icon {
            width: 4px;
            height: 12px;
            background: #6383FF;
            border-radius: 2px;
          }
          .title-text {
            font-weight: 500;
            color: #29303E;
            font-size: 13px;
            margin-left: 5px;
          }
        }
        .authorization-buttons {
          flex:1;
        }
        .edit-button {
          display: flex;
        }
      }
    }
  }
</style>

