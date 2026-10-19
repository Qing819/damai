/** 根据传入不同的类型 渲染不同的表单项
    必填字段需要检验是否为空
    文本
    数字类型：长度限制，小数点位数限制
    时间：    格式控制
    下拉框
*/
<template>
  <div>
    <!-- 0文本 -->
    <template v-if="elementConfig.elementType === '0'">
      <el-input
        v-model.trim="val"
        :size="size"
        :disabled="disabled"
        :maxlength="elementConfig.elementLength"
        placeholder="请输入内容"
      ></el-input>
    </template>
    <!-- 1数字 @input="handleNumberInput" @blur="handleNumberBlur"-->
    <template v-else-if="elementConfig.elementType === '1'">
      <el-input
        v-model.number="val"
        :size="size"
        :disabled="disabled"
        placeholder="请输入数字"
        @input="handleNumber">
        <template #append v-if="elementConfig.isPercentage === '00'">%</template>
      </el-input>
    </template>
    <!-- 2时间 -->
    <template v-else-if="elementConfig.elementType === '2'">
      <template v-if="datePicker(elementConfig.elementDimension) === 'time'">
        <el-time-picker
          v-model="val"
          :size="size"
          style="width: 100%"
          :value-format="elementConfig.elementDimension"
          :disabled="disabled"
          placeholder="请选择时间"
        ></el-time-picker>
      </template>
      <template v-else>
        <!-- @change="handleInput" -->
        <el-date-picker
          v-model="val"
          :size="size"
          style="width: 100%"
          :type="datePicker(elementConfig.elementDimension)"
          :value-format="elementConfig.elementDimension"
          :disabled="disabled"
          placeholder="请选择时间"
        ></el-date-picker>
      </template>
    </template>
    <!-- 3下拉框 -->
    <template v-else-if="elementConfig.elementType === '3'">
      <el-select
        v-model="val"
        placeholder="请选择"
        :size="size"
        :disabled="disabled"
        style="width:100%"
        filterable
        clearable>
        <el-option
          v-for="(item, index) in strToArr(elementConfig.elementDimension)"
          :key="index"
          :label="item"
          :value="item"
        ></el-option>
      </el-select>
    </template>
    <!-- 未匹配到类型的，默认为文本类型 -->
    <template v-else>
      <el-input
        v-model.trim="val"
        :size="size"
        :disabled="disabled"
        :maxlength="elementConfig.elementLength"
        placeholder="请输入内容"
      ></el-input>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      required: true
    },
    // 列设置
    elementConfig: {
      type: Object,
      required: true
    },
    size: {
      type: String,
      default: 'mini'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      val: ''
    }
  },
  watch: {
    val(val) {
      this.$emit('input', val)
    },
    value(val) {
      this.val = val
    }
  },
  created() {
    // 初始化
    this.val = this.value
  },
  methods: {
    // 时间选择器组件类型
    datePicker(value) {
      if (!value) return '';
      if (value.indexOf('y') === -1) {
        // 日期 / 时间选择器
        return value.indexOf('H') === -1 ? 'date' : 'time';
      } else {
        // 日期 / 日期时间选择器
        return value.indexOf('H') === -1 ? 'date' : 'datetime';
      }
    },
    // 字符串以中文逗号隔开转换成数组
    strToArr(str) {
      const newStr = str.replace(/[\uff0c]/g, ',');
      return Object.prototype.toString.call(newStr) === '[object String]'
        ? newStr.split(',')
        : '';
    },
    // 父组件改变子组件value的方法
    resetValue(val) {
      this.value = val;
    },
    // 处理输入框只能填入数字
    handleNumber(value) {
      this.val = value.replace(/[^\d\.]/g, '')
    },
    // 数值输入框改变
    handleNumberInput(value) {
      if (value !== '') {
        // 去掉非数字和点的其它字符
        value = value.replace(/[^\d\.]/g, '');

        const valueIndex = value.indexOf('.');
        if (valueIndex === -1) {
          // 小数点前的位数限制
          this.value = value.substr(0, this.elementConfig.elementLength);
        } else if (valueIndex === 0) {
          // 第一位不能是小数点
          this.value = value.replace(/^\./g, '');
        } else {
          const valueArr = value.split('.');
          const firstValue = valueArr[0];
          // 检查小数点前面的数字
          if (firstValue.length > this.elementConfig.elementLength) {
            valueArr[0] = valueArr[0].substr(0, this.elementConfig.elementLength);
            this.value = valueArr.join('.');
          } else {
            // 规则中需要有小数位时
            if (this.elementConfig.colPoint > 0) {
              const reg = new RegExp(
                '(\\d{1,' +
                  this.elementConfig.elementLength +
                  '}\\.\\d{0,' +
                  this.elementConfig.colPoint +
                  '}).*',
                'g'
              );
              this.value = value.replace(reg, '$1');
            } else {
              // 规则中不需要有小数位时
              const reg = new RegExp(
                '(\\d{1,' + this.elementConfig.elementLength + '}).*',
                'g'
              );
              this.value = value.replace(reg, '$1');
            }
          }
        }
      }
    },
    // 百分比输入框改变
    handlePerInput(value) {
      if (value !== '') {
        // 去掉非数字和点的其它字符
        value = value.replace(/[^\d\.]/g, '');
        const valueIndex = value.indexOf('.');
        if (valueIndex === 0) {
          // 第一位不能是小数点
          this.value = value.replace(/^\./g, '');
        } else {
          // 规则中需要有小数位时
          if (this.elementConfig.colPoint > 0) {
            const reg = new RegExp(
              '(\\d+\\.\\d{0,' + this.elementConfig.colPoint + '}).*',
              'g'
            );
            this.value = value.replace(reg, '$1');
          } else {
            // 规则中不需要有小数位时
            const reg = new RegExp('(\\d+).*', 'g');
            this.value = value.replace(reg, '$1');
          }
        }
      }
    },
    // 数字输入框,百分比输入框失焦事件
    handleNumberBlur(value) {
      if (this.value !== '') {
        if (/\.$/.test(this.value)) {
          // 最后一位是小数点，小数第一位补零
          this.value = this.value + '0';
          return;
        }
        const valueArr = this.value.split('.');
        const firstValue = valueArr[0];
        // 小数点前全是0，只保留一个0
        if (/^0+$/.test(firstValue)) {
          valueArr[0] = 0;
          this.value = valueArr.join('.');
          return;
        }
        // 小数点前是0跟上非零数字，只保留非零数字 ^0+\d$
        if (/^0+\d*$/.test(firstValue)) {
          valueArr[0] = valueArr[0].replace(/^0+/g, '');
          this.value = valueArr.join('.');
          return;
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
::v-deep.el-date-editor.el-input__inner {
  width: 100%;
}
</style>
