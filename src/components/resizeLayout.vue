// 可调节左右宽度的布局
<template>
  <div class="box" ref="box">
    <!-- 左侧 -->
    <div class="box-left" :style="{'width': leftWidth}">
      <slot name="left"></slot>
    </div>
    <!-- 可调节尺寸线 -->
    <div class="resize" :style="{'left': leftWidth}">
      <div :class="['resize-line', showResizeLine ? 'line-show' : '']"></div>
    </div>
    <!-- 右侧 -->
    <div class="box-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // 左侧宽度，默认为300px
    leftWidth: {
      type: String,
      default: '300px',
      required: false
    },
    // 是否显示可调节的尺寸线
    showResizeLine: {
      type: Boolean,
      default: true,
      required: false
    }
  },
  mounted() {
    this.dragControllerDiv();
  },
  methods: {
    // 控制面板可调节函数
    dragControllerDiv() {
      const resizeObj = document.getElementsByClassName('resize');
      const resize = resizeObj[resizeObj.length - 1];
      const resizeLineObj = document.getElementsByClassName('resize-line');
      const resizeLine = resizeLineObj[resizeLineObj.length - 1];
      const leftObj = document.getElementsByClassName('box-left');
      const left = leftObj[leftObj.length - 1];
      const boxObj = document.getElementsByClassName('box');
      const box = boxObj[boxObj.length - 1];
      // 鼠标按下事件
      resize.onmousedown = function(e) {
        // 颜色改变提醒
        if (this.showResizeLine) { resizeLine.style.background = '#6383ff'; }
        const startX = e.clientX; // 鼠标按下的x坐标
        const startLeft = resize.offsetLeft; // 鼠标按下时，左侧框的宽度
        // 鼠标拖动事件
        document.onmousemove = function(e) {
          const endX = e.clientX;
          let moveLen = startLeft + (endX - startX); // （endx-startx）=移动的距离。startLeft+移动的距离=左边区域最后的宽度
          const leftMaxWidth = box.clientWidth * 0.5; // 左边区域的最大宽度占box的50%
          const leftMinWidth = box.clientWidth * 0.15; // 左边区域的最小宽度占box的15%
          if (moveLen < leftMinWidth) moveLen = leftMinWidth;
          if (moveLen > leftMaxWidth) moveLen = leftMaxWidth;
          left.style.width = moveLen + 'px';
          resize.style.left = moveLen + 'px';
        };
        // 鼠标松开事件
        document.onmouseup = function(evt) {
          // 颜色恢复
          if (this.showResizeLine) { resizeLine.style.background = '#e8e8e8'; }
          document.onmousemove = null;
          document.onmouseup = null;
          resize.releaseCapture && resize.releaseCapture(); // 当你不在需要继续获得鼠标消息就要应该调用ReleaseCapture()释放掉
        };
        resize.setCapture && resize.setCapture(); // 该函数在属于当前线程的指定窗口里设置鼠标捕获
        return false;
      };
    }
  }
};
</script>

<style lang="scss" scoped>
$color_border: #e8e8e8;
$color_blue: #6383ff;

.box {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
  .box-left {
    height: 100%;
  }
  .resize {
    position: absolute;
    width: 12px;
    height: 100%;
    transform: translateX(-4.5px);
    cursor: w-resize;
    margin: auto;
    .resize-line {
      width: 1px;
      height: 100%;
      // height: calc(100% - 12px);
      // margin-top: 6px;
      margin-left: 4.5px;
      z-index: 2021;
      &.line-show{
        background-color: $color_border;
      }
    }
    &:hover .resize-line.line-show {
      background-color: $color_blue !important;
    }
  }
  .box-right {
    flex: 1;
    min-width: 0;
    height: 100%;
  }
}
</style>
