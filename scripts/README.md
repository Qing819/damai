# 前端回归检查

这些脚本用于加载实际 Vue 组件和 API 封装做回归检查，不参与前端运行或构建。保留 CommonJS，不转换模块格式。

## 保留的脚本

| 文件 | 用途 |
| --- | --- |
| `check-grade-config.cjs` | 等级分档区间、批量保存参数、分页、角色及版本日期 |
| `check-level-trace.cjs` | 等级轨迹字段、查询参数、分页、详情及异步响应 |
| `check-benefit-apply.cjs` | 权益申请、客户选择、上传、编辑及提交保护 |
| `check-benefit-approval.cjs` | 权益审批查询、详情、通过/驳回及重复提交保护 |
| `check-service-rules.cjs` | 服务规则、00/01编码、修改记录快照及保存/导入参数 |
| `integrate-service-rules.cjs` | 服务规则真实接口及已发现的后端问题复测 |
| `test-utils.cjs` | 六个脚本共用的源码读取、Babel转换和Vue模板编译 |

## 本地回归

在前端项目目录执行，默认只使用内存中的 API 桩，不访问后端，不写数据库：

```sh
node scripts/check-grade-config.cjs
node scripts/check-level-trace.cjs
node scripts/check-benefit-apply.cjs
node scripts/check-benefit-approval.cjs
node scripts/check-service-rules.cjs
```

后四个脚本支持追加 `--live` 执行真实接口只读检查；等级轨迹、权益申请、权益审批沿用 `localhost:8002`，服务规则沿用当前接口目标，支持已有 `SERVICE_RULE_API` 环境变量。

服务规则专项真实联调默认只读：

```sh
node scripts/integrate-service-rules.cjs
```

只有追加原有 `--write-test-record` 参数才进行真实测试写入；保留唯一标记、待生效状态核对、finally清理及失败退出码。测试写入不是本地回归命令的一部分。

## 文件清理记录（2026-10-27）

本轮从项目移出五个文件，原件保存在本机 `/tmp/tianjin-file-cleanup-u9vnpl`，可恢复；`/tmp`不是永久备份。

| 原路径 | 清理依据 | 归档位置（相对上述目录） |
| --- | --- | --- |
| `index.js` | 仅打印欢迎语；package、构建入口及源码均无引用，实际入口为`src/main.js` | `index.js` |
| `src/config/index.js` | 仅导出空对象，没有导入或动态加载引用 | `config/index.js` |
| `src/assets/logo.png` | 未被源码、CSS、模板或配置使用的示例logo；不是public站点图标 | `logo.png` |
| `scripts/check-grade-config-live.cjs` | 绑定已删除的临时库与固定版本名的一次性联调脚本 | `scripts/check-grade-config-live.cjs` |
| `scripts/integrate-benefit-approval.cjs` | 绑定固定日期隔离库、容器及本机数据库连接参数的一次性联调脚本 | `scripts/integrate-benefit-approval.cjs` |

原有联调结果、失败样本说明及复现步骤保留。恢复归档脚本时须放回原项目的`scripts`目录，因为脚本按该目录定位源码。已有Git跟踪文件还可从Git恢复；原本未跟踪的权益审批联调脚本仅有上述临时归档。

八个CJS文件收敛为七个：移出两个一次性脚本，新增一个被六处使用的公共辅助文件；总代码1672行减少为1249行。没有删除业务断言，也没有通过改后缀减少数量。

默认执行行为调整：权益申请、权益审批、服务规则检查原来会自动连后端，现在与等级轨迹一样，只有带`--live`才执行真实只读检查。原有接口验证内容保留。

## 验证与保留项

- 七个CJS语法检查通过，五组本地回归全部通过。
- 六个脚本的367处原有业务断言逐项比对一致；模板编译检查集中到辅助文件，服务规则真实联调也复用模板检查。
- 移除无引用文件后生产构建成功，产物与日志位于`/tmp/tianjin-file-cleanup-build-20261027`及同名`.log`；仅有原有两项包体积警告。
- 本轮没有重新运行真实接口写入，也没有改动任何页面、接口、路由、权限、环境或构建配置。
- 【待人工复核】旧版业务组件、历史API、校验工具和动态样式用途不能仅凭无普通import确定，继续保留；public图标也可能被PWA或外部页面直接访问，未删除。
