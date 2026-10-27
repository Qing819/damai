# 前端回归检查

以下CommonJS脚本用于加载实际Vue组件和API封装进行回归检查，不参与页面运行或生产构建。

| 文件 | 用途 |
| --- | --- |
| check-grade-config.cjs | 等级分档、保存参数、分页、角色及版本日期 |
| check-level-trace.cjs | 等级轨迹字段、查询参数、详情与异步响应 |
| check-benefit-apply.cjs | 权益申请、客户选择、附件及提交保护 |
| check-service-rules.cjs | 服务规则、00/01编码、修改记录快照与保存/导入参数 |
| integrate-service-rules.cjs | 服务规则真实接口联调及后端问题复测 |
| test-utils.cjs | 公共源码读取、Babel转换和Vue模板编译 |

在前端目录执行，默认使用内存API桩，不访问后端、不写数据库：

```sh
node scripts/check-grade-config.cjs
node scripts/check-level-trace.cjs
node scripts/check-benefit-apply.cjs
node scripts/check-service-rules.cjs
```

等级轨迹、权益申请和服务规则检查支持追加`--live`执行真实接口只读检查；前两项沿用localhost:8002，服务规则默认连接192.168.137.235:8002，可通过已有的`SERVICE_RULE_API`环境变量指定目标。

服务规则专项联调默认只读：

```sh
node scripts/integrate-service-rules.cjs
```

只有追加`--write-test-record`才启用真实测试写入；保留唯一标记、待生效状态校验、finally清理和失败退出码。当前已知后端非法布尔值校验未通过，以及合法整包保存/导入、跨日自动生效尚未验收，见[服务规则接口联调记录](service-rules-integration-results.md)。

本次整理集中重复加载代码，保留业务断言；清理调试日志和无用导入，模板、样式及业务逻辑不变。删除未引用的根目录index.js、空src/config/index.js、示例logo.png、HelloWorld.vue，以及绑定已删除临时库的check-grade-config-live.cjs。已跟踪的文件可由Git恢复，历史联调记录继续保留。

用途不明确的旧版业务组件、API、工具及动态样式保留，不按普通import缺失机械删除。
