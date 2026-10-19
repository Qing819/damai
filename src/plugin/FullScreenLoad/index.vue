<template>
  <div v-show="show" class="page-loading">
    <img src="./gear.svg" alt="" />
    <span class="text">{{ tips }}</span>
  </div>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      tips: 'Loading......'
    }
  }
}
</script>

<style lang="scss" scoped>
.page-loading {
  top: 0;
  left: 0;
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: #fff;
  z-index: 9999999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  .gear {
    width: 50px;
    height: 50px;
  }
  .text {
    color: #ccc;
    font-size: 14px;
  }
}
</style>
