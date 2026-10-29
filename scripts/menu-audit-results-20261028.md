# 积分管理系统 15 个菜单核对报告

核对日期：2026-10-28。范围：用户指定的全部 15 个菜单及其工作台、详情和弹框。

## 结论与验证边界

- 已直接读取全部 15 个 Axure 页面，对照本地路由、筛选、表头、操作入口和接口代码；尺寸及颜色取 DOM/computed style，不从截图推断。
- 已修复本轮明确发现的前端问题，主要集中在客户积分列表、客户详情、积分申请/审核、积分轨迹和调整工作台。没有将缺失的后端数据填成原型演示数据。
- 新增 14 组前端回归全部通过，原有 5 组专项回归全部通过。生产构建通过，保留既有依赖包体积警告。
- **不能认定全系统交互和联调全部通过。** 本轮前半段真实接口可用，随后实际后端 `192.168.137.235:8002` 拒绝连接，开发代理返回 HTTP 500，日志为 `ECONNREFUSED`。11:24 再次直连检查仍未建立连接。
- 新增的 31 项真实只读检查在服务中断期间执行，均未完成业务断言；不得把它们计为通过，也不得误报为 31 个独立业务缺陷。
- 本轮没有真实新增、审批、删除、修改业务记录，没有改代理地址、后端 WAR、数据库或系统时间。以往真实写入结果单独标为历史结果，不能替代当前后端的复测。
- 本轮没有执行 Git 提交或推送。

项目实际为 Vue 2.6 / Vue CLI / Element UI。统一测试入口为 `http://localhost:7001/point`；用户列出的 7001/7002 为开发端口差异，本次没有另启动 7002。

## 逐菜单范围与状态

以下路由均接在上述入口后。接口路径省略本地代理 `/api`；GET 的业务成功依据是 `header.statusCode=000000`，不只看 HTTP 200。

| # | 菜单 / 路由 | 原型与前端核对范围 | 本轮真实读取及剩余限制 |
| --- | --- | --- | --- |
| 1 | 客户积分管理 `/personal/manage` | 9 项筛选、21 列、查询/重置/导出、新老体系详情分流；修复响应字段、等级标签、分页和导出条件 | 列表 15 人，统计 15 人，均新体系；老体系真实样本和跨服务详情未复测 |
| 2 | 积分调整申请 `/personal/apply` | 13 列、查看/驳回后编辑/删除、客户选择、调整提交；补齐工作台查询及全量明细分页 | 列表 17 条，主键 25 详情读取成功；新增/编辑/删除写入本轮未实测 |
| 3 | 积分调整审核 `/personal/sh` | 14 列、待审核/已完成分流、详情、驳回意见、重复提交保护、附件入口 | 共用申请列表及详情；真实通过/驳回未执行 |
| 4 | 积分轨迹 `/personal/guiji` | 18 列、四类积分、统计、详情、导出；接通实收记录钻取 | 列表 31 条，统计成功；`FT202609230001` 返回 `data.trace`，已据此修复读取；新实收入口待服务恢复后真实验收 |
| 5 | 积分计算规则 `/personal/rule` | 计算架构、保费、忠诚、汇总与参数配置四页签及说明表 | `/rule/v2/page` 返回 7 条；原型为说明页，不能宣称 11 项参数均已接可写配置接口 |
| 6 | 客户等级积分配置 `/personal/plm` | 分档 9 列、版本 5 列、批量/编辑/删除/作废与角色限制；专项回归通过 | 版本 2 条，当前版本和版本 1 的 6 个分档读取成功；角色接口 404；清空上限写入问题为历史待复测 |
| 7 | 等级变化轨迹 `/personal/lc` | 13 列、客户/证件/渠道/变化类型/日期、统计、详情和导出；专项回归通过 | 全量接口 24 条；本地初始日期区间显示 2 条；跨页重复历史问题本轮未复测 |
| 8 | 服务规则配置 `/personal/srm` | 等级汇总、整包详情、项目配置、版本、模板/导入/导出、未来修改记录；专项回归通过 | 当前版本 V2_2027，5 个已配置等级，修改记录空；版本日期仍缺失，合法整包保存/导入受待生效版本限制 |
| 9 | 权益调整申请 `/personal/serviceApply` | 13 列、查询、工作台、权益/项目选择、附件、驳回修改/删除；专项回归通过 | 真实列表 6 条；项目级历史快照/持久化与附件服务待后端 |
| 10 | 权益调整审批 `/personal/serviceApproval` | 14 列、审批/查看、意见校验、通过/驳回入参、只读状态和重复提交；专项回归通过 | 共用权益申请列表 6 条；既有权益有效期更新问题是历史隔离库缺陷，当前后端未复测 |
| 11 | 权益轨迹 `/personal/serviceGuiJi` | 15 列、动作/权益/次数状态筛选、6 张卡、详情、年初台账、导出 | 默认列表和统计均 19 条；同日结束边界和台账过滤历史问题未复测 |
| 12 | 老切新申请 `/personal/otn` | 11 列、6 个工具栏入口、单条/导入/批量日期/移除、详情及跳转 | 真实列表 9 条；申请人筛选、客户关联和到期跑批仍待后端；四类历史写入已单独记录 |
| 13 | 规则切换轨迹查询 `/personal/guiJiTab` | 9 列、查询/导出、按申请单号钻取、详情关闭返回、历史新老对比 | 真实列表 4 条；历史快照完整性与状态筛选异常待复测，待切换记录无实际切换时间属正常 |
| 14 | 积分及等级试算 `/personal/pointCalculated` | 两场景、CSV 预览/确认、险种选择、任务/明细/结果/导出 | 真实任务 12 条、险种 10 条；本轮未重新生成任务；等级编码与权益匹配问题待后端复测 |
| 15 | 统计分析与报表 `/personal/statistics` | 四类视图、自定义配置、日期校验、客户/保单穿透和客户导出 | 三星穿透返回 2 人；汇总统计、报表生成、保存及汇总导出接口仍未提供 |

初始演示日期与真实全量数据不等价；例如等级轨迹保留已核对的原型默认日期，页面 2 条不代表接口全量仅 2 条。

## 本轮已修改的前端

### 1. 客户积分列表与详情

- 当前真实列表返回 `custId/currentPoint/ruleVersionTag` 等驼峰字段，原列表按 `cust_id/current_point/rule_version_tag` 读取，造成多列空白及详情跳转缺客户号。现兼容两套命名，保留数值 0。
- 经代公司兼容 `agent_company/agentCompany`，代理人兼容 `agent_name/agentName`；标题改为原型“所属经代公司”。
- 等级编码 SANXING 等正常进入已有中文等级标签样式；新老体系按真实 `ruleVersionTag` 分流。
- 客户详情汇总、权益现状兼容驼峰；代理人读取真实 `agentName`。
- 客户详情的“权益轨迹”改读真实 `benefitTraces`，不再把 `usageRecords` 当作所有权益动作，避免向错误详情接口传使用记录主键。权益动作、次数状态翻译为中文。
- 权益变化卡保留真实 0，变化后取实际 remainCount；动作前余额未返回时显示“—”，不再把缺失或零余额误报为“不限”。
- 详情加载失败清空旧客户数据；积分/等级/权益弹框旧响应不能覆盖新详情或关闭后的弹框。

### 2. 查询、分页、导出

- 客户管理、积分申请、积分审核、积分轨迹保存最后一次点击查询的条件，分页不夹带未提交草稿。
- 调整每页数量回到第一页；重置清空已执行条件；倒置日期阻止请求。
- 列表旧响应不能覆盖新查询；失败不保留上次列表冒充本次成功。
- 客户统计失败不再使正确的列表请求一并失败；统计单独提示，且统计请求不带分页参数。
- 客户管理和积分轨迹导出使用已执行查询、排除分页，增加重复操作保护。
- 文件流若实际为 JSON/text 错误，不再保存成伪 Excel；共用校验供详情和附件下载使用。

### 3. 积分申请与审核

- 申请详情只传真实主键，不拿申请单号冒充数字主键；失败关闭，不用列表行伪装完整详情。
- 编辑先读取最新详情及状态，仅已驳回可进入；删除同样只允许已驳回记录并传主键。
- 调整金额要求大于 0、最多两位小数；编辑补齐 OA、原因和自定义截止日校验。
- 调整提交二次确认包含客户、方向、额度、调整后积分预览；防重复提交，不再携带演示客户和演示备注。
- 审核只允许完整加载的 PENDING 记录及 APPROVED/REJECTED 编码；驳回意见必填；提交中不能重复审批或关闭弹框。
- 新增、编辑提交参数仍采用原接口字段，不提交伪造申请人或审批人。
- 核对交付 SQL `sys_dict_v2` 与接口文档 2.4，发现权益申请将 REASON03/05 记反，已修正为“权益派发错误=REASON03、历史权益修正=REASON05”，补双向断言，并纠正旧专项报告的错误记录。积分 REASON01 展示名同步为后端“等级权益补发”。远端实时字典因断连尚未复核；演示原型的“活动积分补发”不作为后端编码含义。

### 4. 积分调整工作台

- 原型直接验证：输入 6，候选 2 条；选择后仍为 2 条并显示“已选择”；确认后隐藏整个候选框。本轮没有把选中项从候选数组删除。
- 当前原型选中项增加 `.on`，颜色 `#2f5496`、背景 `#ebf1fa`；已据实际 DOM 修正本地选中背景。截图未用于判断。
- 补齐客户证件类型。
- 明细采用可支持客户、操作类型、积分类型、起止日期的 `/platform/point/trace/page`，不再向仅约定分页的前台流水接口传无效筛选。
- 补齐两种操作类型及四类积分选项、重置、真实总条数。
- “加载更多”改为真实查询、分页、每页数量、筛选快照；去掉固定 32 条与空查询按钮。
- 检索请求乱序及清空后晚返回不会回填旧客户；查询确认按所选客户号精确匹配，不以第一条模糊结果替代。

### 5. 实收明细、附件与样式

- 新增共用 `pay-detail-dialog.vue`，供积分轨迹及客户积分详情钻取实收记录；按原型 40 个字段两列展示、660px，缺失列显示“—”，0 不丢失。
- 对接既有 `GET /platform/point/pay-detail/{payNo}`；具备失败关闭、切换记录及关闭后返回保护。此入口本轮仅契约/组件验证，真实取数待后端恢复。
- 轨迹详情读取 `data.trace` 和 `data.apply`，兼容 `payNo/calcCoefficient/cvalidate` 及审核字段；清除写死的“李四”、申请号、规则版本、实收号、金额及系数示例。
- 积分附件上传校验扩展名、5MB、返回存储路径；`attachment` 保存 `filePath`，不优先保存 `fileName`。同一文件可以重新选择，失败保留已有附件。
- 积分审核、积分轨迹、客户轨迹详情的附件文字接通下载接口；业务错误体不下载为附件。
- 前四个积分页面去掉查询按钮局部 `#4472c4 !important` 覆盖，沿用用户确认的 primary `#4f6fae`；默认按钮仍白底。原型查询本色为 `#4472c4`，此处明确遵守用户先前的主题覆盖要求。
- 浏览器实际计算样式：查询/重置 62×36px、14px，输入框统一 40px；新增积分调整原为局部冲突导致 40px，已恢复 36px。未改二级标题蓝色左边框规则。

## 接口入参与出参核对要点

所有列表分页统一 `pageNum/pageSize`。下表为前端实际调用契约摘要；具体选填字段仍以两份接口文档为准。

| 单元 | 主要请求 | 关键入参 | 关键出参/处理 |
| --- | --- | --- | --- |
| 客户积分 | GET `/platform/point/cust/list`、`stats`、`detail/{custId}`；导出 `/platform/point/export/custList` | custId/custName/grade/ruleVersionTag/channel/orgName/idType/idNo/mobile；老体系必须 V1_LEGACY，新体系 V2_2027 | list/total；byVersion/gradeByVersion；详情 profile/custBaseInfo/pointSummary/pointTraces/gradeTraces/benefitStatus/benefitTraces |
| 积分申请/审核 | `/platform/point/adjust/page`、`detail/{id}`、POST `submit`、PUT `modify`、DELETE `/{id}`、POST `audit` | 查询 custId/custName/idType/idNo/orgName/applicant/adjustType/status/dateFrom/dateTo；写入 custId/custName/idType/idNo/adjustType/adjustAmt/validType/validEndDate/reasonCode/policyNo/oaNo/remark/attachment；修改加 id；审核 `{id,result,opinion}` | ADD/SUB，nat/custom，PENDING/APPROVED/REJECTED；applyNo/beforePoint/afterPoint/auditor/auditTime/auditOpinion |
| 积分轨迹 | GET `/platform/point/trace/page`、`summary`、`detail/{traceId}`；导出 `/platform/point/export/trace` | custId/custName/policyNo/orgName/operateType/pointType/direction/dateFrom/dateTo；统计仅日期 | traceId/pointAmt/beforePoint/afterPoint；详情 `{trace,apply}`；统计 addTotal/reduceTotal/netChange/total |
| 积分规则 | GET `/rule/v2/page`、`/{id}` | 分页/已有规则筛选 | ruleCode/ruleName/pointType/coefficient/minThreshold/effectiveDate/version/status；不假定覆盖全部文档参数 |
| 等级配置 | `/platform/grade/config/versions`、`current`、`bands`、`version`、`band`、`bands/batch`、作废/删除 | versionId；版本日期；分档 gradeCode/gradeName/minPoint/maxPoint/minBoundary/maxBoundary/gradeOrder/status | currentFlag/status/versionNo；上限 null 与 0 不混淆；角色来自真实接口 |
| 等级轨迹 | GET `/platform/grade/trace/page`、`summary`、`detail/{id}`、`export` | custId/custName/idType/idNo/orgName/channel/changeType/dateFrom/dateTo；详情优先轨迹单号 | traceNo/gradeBefore/gradeAfter/changePoint/changeReason/changeTime；up_total/down_total/invalid_total |
| 服务规则 | `/platform/benefit/rule/gradeList`、`versions`、`grades`、`view`、`save`、`export/import/template`；`mod/list/gradeOptions/view/create/update/delete` | versionTag/gradeCode；整包 description/items；未来修改加 effectiveDate、更新加 id；mod/delete 的 id 在 query；导入 multipart file+versionTag | grade_code/current_flag/configured/pendingMod；mod statusCode/modifier/itemRulesJson；业务布尔 00/01，不能当版本标志 1/0 解码 |
| 权益申请/审批 | `/benefit/adjust/page`、`workbench/{custId}`、`detail/{id}`、`apply/modify`、DELETE `/{id}`、POST `audit` | 查询 applicant/benefitCode/status 等；申请 benefitCodes/benefitDetails、有效期/OA/原因/附件；审核 `{id,result,opinion}` | benefitDetails、状态与审批字段；多权益查询按各项完整结果合并分页，非只过滤当前页 |
| 权益轨迹 | `/benefit/trace/page`、`stats`、`detail/{id}`、`annual/page`、`export` | custId/custName/idType/idNo/orgName/action/benefitCode/countStatus/dateFrom/dateTo；统计仅日期 | action/countChange/usedCount/remainCount/countStatus/annualFlag；null 不限次数与 0 区分 |
| 老切新 | `/switch/apply/page/add/importCsv/batchUpdateEffect/batchRemove/detail/{applyNo}/export/template` | 证件/机构/状态、申请/生效区间；新增有效日期；批量 `{ids,effectiveDate}` 或 `{ids}`；导入 multipart file | applyNo/status/effectiveDate；导入 inserted/skippedDup/skippedInvalid；申请人筛选未受支持时不伪装成功 |
| 切换轨迹 | `/switch/record/page/detail/{applyNo}/export` | custId/custName/idType/idNo/orgName/switchStatus/switchTimeFrom/switchTimeTo | execute_time/old_point/new_point/old_grade/new_grade；缺历史快照不拿当前数据补 |
| 试算 | POST `/switch/trial/single/extra/batch`；GET `task/page`、`item/page/export`、`risk/page`；客户主档 | 单客户证件；加保 riskCode/premium/payMode/pensionFlag；批量 CSV file；任务 operator/时间；明细 taskNo/状态/姓名/证件 | 当前/新积分等级权益、计算过程、taskNo；bf/zc/pension 与平台编码分别兼容 |
| 报表 | GET `/report/drill/customers`、`policies`、`export/customers` | dimension=GRADE/item/orgName/custId/custName；保单 custId；导出不带分页 | 当前客户与保单，非历史统计快照；未提供的汇总/生成/保存/PDF 能力不以占位结果冒充 |

`/platform/benefit/rule/list` 是旧封装，实际服务配置页使用新 `gradeList`；本轮不会把旧路径的 404 列成当前页面缺陷。

## 后端待办条目

“本轮”表示今天已直接观察到；“历史待复测”表示已有专项报告证据，但本轮未在当前远端重现。不能把两种状态混为一谈。

| 编号 | 状态 / 涉及菜单 | 问题与后端所需处理 |
| --- | --- | --- |
| B01 | 本轮阻塞 / 全部 | `192.168.137.235:8002` 从可访问变为拒绝连接；请恢复服务和链路，继续同一代理地址验收。代理 500 并非 15 个页面各自发生逻辑异常。 |
| B02 | 本轮 404 / 等级配置、权限 | `GET /auth/user/getUserInfo` 返回 404。需提供真实登录身份/角色接口、字段和管理员判定口径，并在后端保护写接口；前端不以默认管理员或演示切换冒充权限。沿用用户此前“先保留”安排。 |
| B03 | 本轮字段缺失 / 服务规则 | versions 只有 version_tag/current_flag/grade_count/last_update_time；gradeList 无生效/失效日期。补状态及日期、提供可确认的待生效版本，才能合法联调整包新增/编辑和导入。 |
| B04 | 历史待复测 / 服务规则 | mod/view 缺 itemsJson/signOrg 等快照元数据；mod/update 曾接受 needOrder=BAD。补完整历史项目/签约机构快照及 00/01 服务端校验；目前无记录可做只读快照复现。 |
| B05 | 历史待复测 / 等级配置 | 将已有 maxPoint 清空为 null 后未真正清空。需要更新 SQL 区分“不修改”和“设置 NULL”；不能让前端伪造已清空结果。 |
| B06 | 历史待复测 / 等级轨迹 | 相同 change_time 的分页曾重复 LV202609238894/895。增加唯一键次级排序，验收跨页不重不漏。 |
| B07 | 历史待复测 / 权益申请及审批 | 详情缺完整 itemRulesJson/freqYears/freqAvgYears/needOrder/needAudit/orderChannels，无法还原或证明逐项目申请配置持久化。补齐写入和历史返回。 |
| B08 | 历史隔离库缺陷 / 权益审批 | 已有有效权益审批通过后，申请的新 validEndDate 未更新到额度及轨迹。先确定按有效期独立派发或延期口径，再改后端；此前样本申请 13/BEN20261027007 中 QY0002 仍为 2026-12-31，申请要求 2027-12-31。 |
| B09 | 文档及历史依赖 / 所有附件 | FastDFS 环境未就绪，历史上传业务码 999999。提供文件服务、可靠 filePath/fileName 及下载契约；前端路径已修正，但不代表真实上传下载闭环已成功。 |
| B10 | 历史待复测 / 权益轨迹 | 2026-09-23 同日起止返回 0，而全量有 13 条；改次日结束才返回 13。需按包含结束日全天处理列表、统计及导出。 |
| B11 | 历史待复测 / 权益轨迹 | custId 查询合并年初台账时，曾忽略 benefitCode/action/countStatus 等条件；需在统一过滤后计算 total 和分页，不能由前端过滤当前页掩盖。 |
| B12 | 本轮及文档缺字段 / 积分、权益详情 | 客户详情 benefitStatus 缺部分授予次数/日期，权益历史动作缺服务项目和可靠动作前余额；实收保单险种号码无源列；部分轨迹缺缴费次数/金额、产品及完整规则信息。需按原型补真实历史字段，前端仅显示已返回值或占位。 |
| B13 | 历史待复测 / 老切新 | applicant/operator 条件曾被忽略；历史新增/导入无真实客户关联及登录操作人；补申请人筛选和真实客户匹配。已过生效日仍 PENDING 的记录需核查调度，不用前端直接改状态。 |
| B14 | 本轮字段观察及历史缺陷 / 切换轨迹 | 本轮首条记录没有 old/new grade；历史专项发现四条 old/new point 都为 0，详情计算合计却为 17,300，且缺 oldData/newData。历史 switchStatus=SWITCHED/NOT_SWITCHED 列表查询曾返回 999999，同条件导出却正常。需修复状态查询及完整历史快照，不能使用当前积分替代；未切换记录没有 execute_time 不作为缺陷。 |
| B15 | 历史待复测 / 试算 | gradeCode 中文“三星”与权益 SANXING 不一致，试算 newGradeBenefits 为空；统一编码并回归新增权益。batch 不完整支持带引号 CSV；任务缺完成时间/耗时及场景筛选契约；需补解析和返回字段。 |
| B16 | 文档/已有实现缺能力 / 统计报表 | 未找到四类汇总统计、生成、保存/复用配置、汇总 Excel/PDF 接口；穿透仅 GRADE 且无历史区间；保单缺 riskName/riskcode/polState，导出姓名/编码与页面脱敏翻译不同。需给出完整接口及统计快照口径。 |

需恢复后确认的契约项：`GET /platform/dict/REASON` 应与交付 SQL/接口文档一致（03 权益派发错误、05 历史权益修正）。本轮修正的是明确与两份交付依据相反的本地映射，没有改写任何历史申请；当前远端实际字典是否发生独立变更尚不能确认。

补充范围限制：统计卡接口（积分轨迹、等级轨迹、权益轨迹）只接受日期，客户或机构筛选后仍为该期间全量统计。若产品要求随全部筛选变化，需后端扩充统计契约，不能前端累加当前页代替。

历史证据保留在同目录专项报告：`grade-config-live-results.md`、`level-trace-results.md`、`service-rules-integration-results.md`、`benefit-apply-results.md`、`benefit-approval-results.md`、`benefit-trace-results.md`、`switch-apply-results.md`、`switch-track-results.md`、`trial-calc-results.md`、`statistics-report-results.md`。

## 验证命令及结果

新增 `scripts/check-menu-audit.js`，没有新增 CJS。复用现有 `test-utils.cjs` 读取真实 Vue 方法、编译模板。

```sh
node scripts/check-menu-audit.js
node scripts/check-grade-config.cjs
node scripts/check-level-trace.cjs
node scripts/check-benefit-apply.cjs
node scripts/check-benefit-approval.cjs
node scripts/check-service-rules.cjs
```

结果：新增 14/14 组及原有 5 组全部通过。覆盖查询快照、分页、重置、响应乱序、字段/零值、主键、详情失败、重复审核、工作台真实接口入参、全量明细、实收 40 字段、导出错误、候选选择及清空、附件路径/文件校验。负例触发组件既有 console.error，脚本仍以断言结果和退出码判断。

```sh
node scripts/check-menu-audit.js --live
```

只发送 GET，默认沿用本地 `/api`。服务中断导致 31 项未完成；恢复后须重跑，再验证本报告列出的历史缺陷和新增交互。此命令不包括真实审批或配置写入。

ESLint 对比 HEAD：新测试、实收组件、导出工具、客户列表、积分审核均无错误；积分申请保留原 5 项，客户详情保留原 5 项，积分轨迹由 6 项减为 4 项，没有新增规则错误。未为消除既有格式问题批量重排业务文件。

构建产物位于 `/tmp/tianjin-menu-audit-build-20261028`，日志 `/tmp/tianjin-menu-audit-build-20261028.log`。不写入仓库构建目录。

## 服务恢复后的重点验收

1. 客户列表真实数据列、老体系筛选、三类详情跳转；查询后修改草稿再翻页/导出。
2. 工作台“输入→两条候选→选择回显且候选不减少→确认隐藏整框”，正确客户带入；两组明细筛选、加载更多、翻页、重置。
3. 新建/驳回重提的金额、OA、截止日、确认预览；真实保存后的详情回读。
4. 积分审核空意见驳回拦截、成功通过/驳回、失败保留、快速连点及提交中关闭保护；在专用测试申请验收。
5. 两处轨迹的实收明细、规则与审批字段、附件上传→保存路径→下载；缺字段明确占位。
6. B02—B16 按相应专项报告逐项复测；配置及审批写入使用专用测试记录或隔离环境，不能覆盖现行业务配置。
7. 后端提供统计/报表服务后，验收四类真实统计、周期/机构、报表生成与保存、Excel/PDF；当前不能将页面占位和实时穿透当成报表闭环。

当前本地工作台截图：`/tmp/tianjin-menu-audit-workspace-20261028.png`。仅证明初始 UI 状态；不证明后端中断期间真实客户查询已通过。

## 四个接口统一驼峰后的专项核验

以用户提供的新契约为准，客户列表18项字段、轨迹统计3项字段、客户详情pointSummary的7项字段及benefitStatus的6项字段已检查。现有页面归一化逻辑支持这些驼峰返回，无需修改页面绑定或样式；traceCnt保留在列表原始字段中，当前列表没有对应展示列。老切新申请仅读取未变更的custBaseInfo，不受此次字段调整影响。

`/platform/benefit/cust/status/{custId}` 当前只有API定义，没有页面调用；客户详情权益现状读取详情接口中的benefitStatus。

在现有 `scripts/check-menu-audit.js` 增加3组专项回归，实际加载页面方法，覆盖列表全部18项字段、两处统计、详情积分和权益映射，包含零值、负数及不限次数字段。组件回归结果17/17通过。此次未新增CJS文件。

尝试通过 `http://localhost:7001/api` 读取上述四个接口，均连接拒绝（ECONNREFUSED，无HTTP响应）。当前本地7001服务不可达，因此本次仅确认前端模拟契约回归通过，尚未确认真实后端返回；不能据此认定后端接口故障。

### 后续修订：页面内部也统一使用驼峰

以上“保留页面下划线绑定”的方案已按用户后续要求替换。客户列表筛选、表格、导出取值和详情跳转，积分统计卡，以及客户详情pointSummary和benefitStatus均直接使用驼峰字段，不再将这几组数据反向映射为下划线。请求保留接口约定的 `grade`、`ruleVersionTag`、`custId` 等入参；没有将请求的 `grade` 擅自改成响应的 `currentGrade`。详情中的profile及独立轨迹接口未列入此次变更契约，保留其既有字段兼容。

独立客户权益现状接口没有页面调用，API本身不做字段重命名，直接保留后端响应。专项测试增加请求键名与客户详情路由验证。生产构建成功，产物位于 `/tmp/tianjin-camel-build-20261028`。前端代理默认目标已改为 `http://192.168.137.237:8002`；再次真实请求超时，驼峰后端联调仍待服务可达后验证。
