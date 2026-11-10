<template>
  <nav v-if="visible" class="temporary-point-nav" aria-label="积分管理测试导航">
    <div class="temporary-point-nav__title">积分管理测试导航</div>
    <div class="temporary-point-nav__items">
      <button
        v-for="item in menus"
        :key="item.path"
        type="button"
        :class="['temporary-point-nav__item', { active: item.path === $route.path }]"
        @click="$router.push(item.path)"
      >
        {{ item.label }}
      </button>
    </div>
  </nav>
</template>

<script>
const menus = [
  { label: '客户积分管理', path: '/personal/manage' },
  { label: '积分调整申请', path: '/personal/apply' },
  { label: '积分调整审核', path: '/personal/sh' },
  { label: '积分轨迹', path: '/personal/guiji' },
  { label: '积分计算规则', path: '/personal/rule' },
  { label: '客户等级积分配置', path: '/personal/plm' },
  { label: '等级变化轨迹', path: '/personal/lc' },
  { label: '服务规则配置', path: '/personal/srm' },
  { label: '权益调整申请', path: '/personal/serviceApply' },
  { label: '权益调整审批', path: '/personal/serviceApproval' },
  { label: '权益轨迹', path: '/personal/serviceGuiJi' },
  { label: '老切新申请', path: '/personal/otn' },
  { label: '切换轨迹查询', path: '/personal/guiJiTab' },
  { label: '积分等级试算', path: '/personal/pointCalculated' }
]

export default {
  name: 'TemporaryPointNav',
  data() {
    return { menus }
  },
  computed: {
    visible() {
      return menus.some(item => this.$route.path === item.path)
    }
  }
}
</script>

<style lang="scss" scoped>
.temporary-point-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 16px;
  background: #263648;
  box-shadow: 0 2px 8px rgba(25, 38, 54, .16);
  color: #fff;
}

.temporary-point-nav__title {
  flex: 0 0 auto;
  margin-right: 18px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.temporary-point-nav__items {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: 2px;
  overflow-x: auto;
}

.temporary-point-nav__item {
  flex: 0 0 auto;
  border: 0;
  padding: 0 12px;
  background: transparent;
  color: #c9d3df;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
}

.temporary-point-nav__item:hover,
.temporary-point-nav__item.active {
  background: #3d78b8;
  color: #fff;
}

@media (max-width: 900px) {
  .temporary-point-nav {
    display: block;
    padding: 8px 12px 0;
  }

  .temporary-point-nav__title {
    margin: 0 0 6px;
  }

  .temporary-point-nav__items {
    min-height: 34px;
  }
}
</style>
