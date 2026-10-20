import Vue from 'vue';
import VueRouter from 'vue-router';
const _import = file => () => import('@/views/' + file + '.vue');

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    redirect: '/personal/test'
  },
  // 孤儿客户重分配机构
  {
    path: '/personal/redistributionDept',
    component: _import('personal/redistribution/redistributionDept/index')
  },
  // 孤儿客户重分配机构新建页
  {
    path: '/personal/redistributionDeptAdd',
    component: _import('personal/redistribution/redistributionDept/addDept')
  },
  // 孤儿客户重分配代理人
  {
    path: '/personal/redistributionAgent',
    component: _import('personal/redistribution/redistributionAgent/index')
  },
  // 孤儿客户重分配代理人新建页
  {
    path: '/personal/redistributionAgentAdd',
    component: _import('personal/redistribution/redistributionAgent/addDept')
  },
  // 个人积分规则管理
  {
    path: '/personal/pointRule',
    component: _import('personal/pointRule/index')
  },
  // 个人客户积分管理
  {
    path: '/personal/pointManage',
    component: _import('personal/pointManage/index')
  },
  // 个人客户分级管理
  {
    path: '/personal/rankManage',
    component: _import('personal/rankManage/index')
  },
  // 个人客户权益查询
  {
    path: '/personal/rightsSearch',
    component: _import('personal/rightsSearch/index')
  },
  // 个人保费积分测算
  {
    path: '/personal/pointCalculate',
    component: _import('personal/pointCalculate/index')
  },

  // 积分计算配置
  {
    path: '/business/calculateConfig',
    component: _import('business/calculateConfig/index')
  },
  // 客户权益配置
  {
    path: '/business/customerRights',
    component: _import('business/customerRights/index')
  },
  // 积分兑换规则配置
  {
    path: '/business/convertRule',
    component: _import('business/convertRule/index')
  },
  // 积分类型配置
  {
    path: '/business/pointType',
    component: _import('business/pointType/index')
  },
  // 等级类型配置
  {
    path: '/business/rankType',
    component: _import('business/rankType/index')
  },
  // 要素配置
  {
    path: '/business/elementConfig',
    component: _import('business/elementConfig/index')
  },
    //积分调整
  {
    path: '/personal/test',
    component: _import('personal/test/index')
  },
  {
    path: '/personal/manage',
    component: _import('personal/test/point-manage')
  },
  {
    path: '/personal/manageDetails',
    component: _import('personal/test/point-manage-detail')
  },
  {
    path: '/personal/guiji',
    component: _import('personal/test/point-guiji')
  },
  {
    path: '/personal/apply',
    component: _import('personal/test/point-apply')
  },
  {
    path: '/personal/sh',
    component: _import('personal/test/point-sh')
  },
  {
    path: '/personal/plm',
    component: _import('personal/test/point-level-manage')
  },
  {
    path: '/personal/lc',
    component: _import('personal/test/level-change')
  },
  {
    path: '/personal/rule',
    component: _import('personal/test/point-rule')
  },
  {
    path: '/personal/srm',
    component: _import('personal/test/service-rule-manage')
  },
  {
    path: '/personal/serviceApply',
    component: _import('personal/test/service-apply')
  },
  {
    path: '/personal/serviceApproval',
    component: _import('personal/test/service-approval')
  },
  {
    path: '/personal/serviceGuiJi',
    component: _import('personal/test/service-guiji')
  },
  {
    path: '/personal/otn',
    component: _import('personal/test/old-to-new')
  },
  {
    path: '/personal/guiJiTab',
    component: _import('personal/test/guiji-tab')
  },
  {
    path: '/personal/pointCalculated',
    component: _import('personal/test/point-calculate')
  },


  // 按钮权限
  {
    path: '/business/btnPermissions',
    component: _import('business/btnPermissions/index')
  }

];

const router = new VueRouter({
  base: '/point/',
  mode: 'history',
  routes
});

export default router;
