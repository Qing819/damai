// 定制的开关组件
<template>
    <div class="switch-view">
        <div :class="['bcg', isOpen === activeValue ? 'left' : 'right']"></div>
        <div class="switch-text-box">
            <span
                class="switch-text"
                :style="{'color': isOpen === activeValue ? '#fff' : '#DCDFE6'}"
                @click="isOpen = activeValue"
            >{{ activeText || '开启' }}</span>
            <span
                class="switch-text"
                :style="{'color': isOpen === inactiveValue ? '#fff' : '#DCDFE6'}"
                @click="isOpen = inactiveValue"
            >{{ inactiveText || '关闭' }}</span>
        </div>
    </div>
</template>

<script>
export default {
  name: 'customSwitch',
  props: {
    // 绑定的值
    value: {
      type: [Boolean, String, Number],
      default: false
    },
    // 开启时文本
    activeText: {
      type: String,
      default: '开启'
    },
    // 关闭时文本
    inactiveText: {
      type: String,
      default: '关闭'
    },
    // 开启时的值
    activeValue: {
      type: [Boolean, String, Number],
      default: true
    },
    // 关闭时的值
    inactiveValue: {
      type: [Boolean, String, Number],
      default: false
    }
  },
  data() {
    return {
      isOpen: false
    }
  },
  watch: {
    // 监听数据改变，同步更新父组件绑定的值
    isOpen(value) {
      this.$emit('input', value)
    }
  },
  created() {
    // 设置初始值
    if ([this.activeValue, this.inactiveValue].indexOf(this.value) !== -1) {
      this.isOpen = this.value
    }
  }
}
</script>

<style lang="scss" scoped>
$--color-primary: #6383ff;

.switch-view {
    position: relative;
    display: inline-block;
    height: 28px;
    background: #fff;
    border-radius: 14px;
    padding: 0 1px;
    border: 1px solid #DCDFE6;
    .left {
        position: absolute;
        top: 1px;
        left: 1px;
        // transform: translateX(-50%);
    }
    .right {
        position: absolute;
        top: 1px;
        left: calc(50% - 1px);
        // transform: translateX(50%);
    }
    .bcg {
        z-index: 0;
        width: 50%;
        height: calc(100% - 2px);
        border-radius: 14px;
        background: $--color-primary;
        transition: all 0.1s;
    }
    .switch-text-box{
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        .switch-text {
            z-index: 1;
            padding: 0 8px;
            white-space: nowrap;
            font-size: 12px;
            cursor: pointer;
        }
    }
}
</style>