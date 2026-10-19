<template>
  <div id="point-system">
    <keep-alive>
      <router-view v-if="$route.meta.keepAlive"></router-view>
    </keep-alive>
    <router-view v-if="!$route.meta.keepAlive"></router-view>
  </div>
</template>

<script>
export default {
  name: 'point-system'
}
</script>

<style lang="scss">
@import "./styles/index.scss";

#point-system {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}
</style>