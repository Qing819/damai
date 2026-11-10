<template>
  <div id="point-system">
    <temporary-point-nav />
    <keep-alive>
      <router-view v-if="$route.meta.keepAlive"></router-view>
    </keep-alive>
    <router-view v-if="!$route.meta.keepAlive"></router-view>
  </div>
</template>

<script>
import TemporaryPointNav from './components/TemporaryPointNav'

export default {
  name: 'point-system',
  components: { TemporaryPointNav }
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
