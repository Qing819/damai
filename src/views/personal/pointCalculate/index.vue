<template>
  <div class="calculator-container">
    <!-- 头部：终端与权限模拟 -->
    <el-card class="header-card" shadow="never">
      <div class="terminal-selector">
        <span class="label">当前模拟终端环境：</span>
        <el-radio-group v-model="currentTerminal" @change="handleTerminalChange">
          <el-radio-button label="PC">PC端 (机构数据隔离)</el-radio-button>
          <el-radio-button label="LIGHT">光速保移动端 (限试算个人名下客户)</el-radio-button>
        </el-radio-group>
        <el-tag type="info" class="terminal-tips">
          {{ currentTerminal === 'PC' ? '当前权限：分公司/机构视图，可输入任意客户信息试算及批量操作' : '当前权限：代理人个人视图，仅支持名下绑定客户试算，无批量操作权限' }}
        </el-tag>
      </div>
    </el-card>

    <!-- 主体 Tabs：两个核心场景 -->
    <el-tabs v-model="activeMainTab" type="border-card" class="main-tabs">

      <!-- ==================== 场景一：老客户转新规则等级试算 ==================== -->
      <el-tab-pane label="场景一：老客户转新规则等级试算" name="scene1">
        <!-- 单条试算搜索区 -->
        <el-form :inline="true" :model="scene1Form" class="search-form">
          <el-form-item label="客户姓名">
            <el-input v-model="scene1Form.name" placeholder="请输入姓名" clearable></el-input>
          </el-form-item>
          <el-form-item label="证件类型">
            <el-select v-model="scene1Form.idType" placeholder="请选择" style="width: 140px;">
              <el-option label="身份证" value="ID"></el-option>
              <el-option label="护照" value="PASSPORT"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="证件号码">
            <el-input v-model="scene1Form.idNo" placeholder="请输入证件号" style="width: 220px;" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleScene1Calculate">试算</el-button>
            <el-button icon="el-icon-refresh" @click="resetScene1">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 批量操作区（仅PC端展示） -->
        <div v-if="currentTerminal === 'PC'" class="batch-action-bar">
          <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="handleBatchImport">
            <el-button type="success" icon="el-icon-upload2">批量导入试算</el-button>
          </el-upload>
          <el-button icon="el-icon-download" @click="downloadData('summary')">下载汇总数据</el-button>
          <el-button icon="el-icon-download" @click="downloadData('detail')">下载汇总+明细数据</el-button>
        </div>

        <el-divider></el-divider>

        <!-- 单条试算结果卡片 -->
        <div v-if="scene1Result" class="result-section">
          <div class="result-header">
            <h3>试算结果对比</h3>
            <el-button type="text" icon="el-icon-user" @click="showCustomerDetail">客户详情 (查看保单明细穿透)</el-button>
          </div>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="hover" class="compare-card old-rules">
                <div slot="header" class="card-title">老规则当前体系</div>
                <div class="metric-item">
                  <span class="label">当前总积分：</span>
                  <span class="value">{{ scene1Result.oldPoints }} 积分</span>
                </div>
                <div class="metric-item">
                  <span class="label">当前客户等级：</span>
                  <el-tag type="info" size="medium">{{ scene1Result.oldLevel }}</el-tag>
                </div>
                </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover" class="compare-card new-rules">
                <div slot="header" class="card-title">新规则预估体系</div>
                <div class="metric-item">
                  <span class="label">新规则试算积分：</span>
                  <span class="value highlight">{{ scene1Result.newPoints }} 积分</span>
                </div>
                <div class="metric-item">
                  <span class="label">新规则预估等级：</span>
                  <el-tag type="danger" size="medium">{{ scene1Result.newLevel }}</el-tag>
                </div>
                </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>


      <!-- ==================== 场景二：加保/购新单场景全量试算 ==================== -->
      <el-tab-pane label="场景二：全量客户加保/购新单试算" name="scene2">
        <div class="sub-scene-selector">
          <span class="label">选择客户身份子场景：</span>
          <el-radio-group v-model="activeSubScene" @change="resetScene2">
            <el-radio-button label="sub1">子场景1：名下无保单新客</el-radio-button>
            <el-radio-button label="sub2">子场景2：已迁移至新系统的客户</el-radio-button>
            <el-radio-button label="sub3">子场景3：仍在老系统的客户</el-radio-button>
          </el-radio-group>
        </div>

        <el-card class="form-card" shadow="never">
          <el-form :model="scene2Form" label-width="120px">
            <!-- 基础客户信息（子场景2和3需要） -->
            <el-row v-if="activeSubScene !== 'sub1'" :gutter="20">
              <el-col :span="8">
                <el-form-item label="客户姓名">
                  <el-input v-model="scene2Form.name" placeholder="张三"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="证件号码">
                  <el-input v-model="scene2Form.idNo" placeholder="110101199001018888"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 计划购买产品信息 -->
            <div class="form-section-title">拟加保/新购产品计划</div>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="险种类型">
                  <el-select v-model="scene2Form.productType" placeholder="请选择险种" style="width: 100%;">
                    <el-option label="尊享终身寿险" value="LIFE"></el-option>
                    <el-option label="臻爱重疾险" value="CRITICAL"></el-option>
                    <el-option label="年金年年盈" value="ANNUITY"></el-option>
                  </el-select>
                </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="计划保费(元)">
                    <el-input-number v-model="scene2Form.premium" :min="1000" :step="1000" style="width: 100%;"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="缴费方式">
                    <el-select v-model="scene2Form.payMethod" style="width: 100%;">
                      <el-option label="年缴" value="YEARLY"></el-option>
                      <el-option label="趸缴" value="SINGLE"></el-option>
                    </el-select>
                  </el-form-item>
                  </el-col>
            </el-row>

            <el-form-item>
              <el-button type="primary" icon="el-icon-cpu" @click="handleScene2Calculate">执行加保试算</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 子场景结果展示区 -->
        <div v-if="scene2Result" class="result-section">

          <!-- 子场景1：名下无保单新客 -->
          <div v-if="activeSubScene === 'sub1'">
            <h4 class="sub-title">新客首单试算结果</h4>
            <table class="custom-desc-table">
              <tr>
                <td class="bg-gray">当前积分及等级：</td>
                <td>0 积分 (无等级)</td>
                <td class="bg-gray">购买后预估积分：</td>
                <td><span class="highlight-text">{{ scene2Result.sub1.calculatedPoints }} 积分</span></td>
              </tr>
              <tr>
                <td class="bg-gray">预计达成等级：</td>
                <td><el-tag type="success">{{ scene2Result.sub1.newLevel }}</el-tag></td>
                <td class="bg-gray">距离下一等级({{ scene2Result.sub1.nextLevel }})差额：</td>
                <td><span class="danger-text">{{ scene2Result.sub1.pointsGap }} 积分</span></td>
              </tr>
            </table>

            <el-alert title="升级建议" type="warning" class="mt-15" :closable="false" show-icon>
              推荐：如补充加保 <strong>{{ scene2Result.sub1.upsellAmount }} 元</strong>（或加保“{{ scene2Result.sub1.recommendProduct }}”），可直接升级至 <strong>{{ scene2Result.sub1.nextLevel }}</strong>！
            </el-alert>

            <h4 class="mt-20">升级后（{{ scene2Result.sub1.newLevel }}）享受的全部权益：</h4>
            <div>
              <el-tag v-for="benefit in scene2Result.sub1.allBenefits" :key="benefit" class="mr-10 mb-10">{{ benefit }}</el-tag>
            </div>

            <h4 class="mt-15">相较于当前等级新增的权益明细：</h4>
            <ul class="benefit-list add">
              <li v-for="b in scene2Result.sub1.newAddedBenefits" :key="b">{{ b }}</li>
            </ul>
          </div>

          <!-- 子场景2：已迁移至新系统的客户 -->
          <div v-if="activeSubScene === 'sub2'">
            <h4 class="sub-title">已迁移客户加保试算结果</h4>
            <table class="custom-desc-table">
              <tr>
                <td class="bg-gray">加保前原有积分：</td>
                <td>12,000 积分 (四星客户)</td>
                <td class="bg-gray">加保获得积分：</td>
                <td>+{{ scene2Result.sub2.addPoints }} 积分</td>
              </tr>
              <tr>
                <td class="bg-gray">加保后最新积分：</td>
                <td><span class="highlight-text">{{ scene2Result.sub2.totalPoints }} 积分</span></td>
                <td class="bg-gray">加保后最新等级：</td>
                <td><el-tag type="danger" size="medium">{{ scene2Result.sub2.newLevel }}</el-tag></td>
              </tr>
            </table>

            <h4 class="mt-20">最新等级（{{ scene2Result.sub2.newLevel }}）全部服务权益清单：</h4>
            <div class="benefit-box">
              <el-tag v-for="b in scene2Result.sub2.benefits" :key="b" type="danger" class="mr-10 mb-10" effect="dark">{{ b }}</el-tag>
            </div>
          </div>

          <!-- 子场景3：仍在老系统的客户 -->
          <div v-if="activeSubScene === 'sub3'">
            <h4 class="sub-title">老系统客户迁移+加保综合试算结果</h4>
            <table class="custom-desc-table">
              <tr>
                <td class="bg-gray">老系统当前积分/等级：</td>
                <td>6,000 积分 / 老三星</td>
                <td class="bg-gray">迁移新系统折算积分：</td>
                <td>8,000 积分</td>
              </tr>
              <tr>
                <td class="bg-gray">本次加保产生积分：</td>
                <td>+{{ scene2Result.sub3.addPoints }} 积分</td>
                <td class="bg-gray">迁移+加保后最新总积分：</td>
                <td><span class="highlight-text">{{ scene2Result.sub3.totalPoints }} 积分</span></td>
              </tr>
              <tr>
                <td class="bg-gray">最新达成的系统等级：</td>
                <td colspan="3"><el-tag type="warning" size="medium">{{ scene2Result.sub3.newLevel }}</el-tag></td>
              </tr>
            </table>

            <h4 class="mt-20">新系统等级（{{ scene2Result.sub3.newLevel }}）权益与老系统当前权益差异对比：</h4>
            <el-table :data="scene2Result.sub3.diffTable" border style="width: 100%">
              <el-table-column prop="type" label="变更类型" width="120">
                <template slot-scope="scope">
                  <el-tag :type="getDiffTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="item" label="服务权益项目" width="200"></el-table-column>
              <el-table-column prop="description" label="具体差异规则说明（含新增、调整、取消项）"></el-table-column>
            </el-table>
          </div>

        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 弹窗：客户详情与保单明细穿透 -->
    <el-dialog :visible.sync="detailDialogVisible" title="客户保单按新规则试算明细 (保单穿透)" width="70%">
      <div v-if="customerDetailData" class="dialog-content">
        <p><strong>客户姓名：</strong>{{ customerDetailData.name }} | <strong>证件号：</strong>{{ customerDetailData.idNo }}</p>
        <p><strong>名下有效保单数量：</strong>{{ customerDetailData.policies.length }} 张</p>

        <el-table :data="customerDetailData.policies" border stripe style="width: 100%" class="mt-15">
          <el-table-column prop="policyNo" label="保单号" width="180"></el-table-column>
          <el-table-column prop="productName" label="险种名称"></el-table-column>
          <el-table-column prop="premium" label="年交保费 (元)" width="120"></el-table-column>
          <el-table-column prop="oldPoints" label="原规则下积分" width="120"></el-table-column>
          <el-table-column prop="newPoints" label="新规则试算积分" width="140">
            <template slot-scope="scope">
              <span class="highlight-text">{{ scope.row.newPoints }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailDialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PointsCalculator',
  data() {
    return {
      // 全局状态
      currentTerminal: 'PC', // PC 或 LIGHT(光速保)
      activeMainTab: 'scene1',
      activeSubScene: 'sub1',
      detailDialogVisible: false,

      // 场景一表单及结果
      scene1Form: {
        name: '张伟',
        idType: 'ID',
        idNo: '110101198505051234'
      },
      scene1Result: null,

      // 场景二表单及结果
      scene2Form: {
        name: '',
        idNo: '',
        productType: 'LIFE',
        premium: 10000,
        payMethod: 'YEARLY'
      },
      scene2Result: null,

      // 保单明细穿透数据
      customerDetailData: null
    }
  },
  methods: {
    // 终端切换处理
    handleTerminalChange(val) {
      if (val === 'LIGHT') {
        this.scene1Form.name = '张伟'
        this.scene1Form.idNo = '110101198505051234'
      }
    },

    // 场景一：试算
    handleScene1Calculate() {
      if (!this.scene1Form.name || !this.scene1Form.idNo) {
        this.$message.warning('请填写完整的客户姓名与证件号！')
        return
      }
      if (this.currentTerminal === 'LIGHT' && this.scene1Form.name !== '张伟') {
        this.$message.error('【光速保提示】您仅能试算您名下的绑定客户！')
        return
      }

      this.scene1Result = {
        oldPoints: 1500,
        oldLevel: 'V爱-三星客户',
        newPoints: 3200,
        newLevel: '新体系-四星VIP'
      }
      this.$message.success('老客户转新规则试算成功！')
    },

    resetScene1() {
      this.scene1Form.name = ''
      this.scene1Form.idNo = ''
      this.scene1Result = null
    },

    handleBatchImport() {
      this.$message.success('批量文件导入成功，共解析 20 条客户记录并完成试算！')
    },

    downloadData(type) {
      const typeText = type === 'summary' ? '【汇总数据】' : '【汇总+明细数据】'
      this.$message.success(`开始导出 ${typeText} 试算结果 Excel 表格文件...`)
    },

    showCustomerDetail() {
      this.customerDetailData = {
        name: this.scene1Form.name || '张伟',
        idNo: this.scene1Form.idNo || '110101198505051234',
        policies: [
          { policyNo: 'P0008829101', productName: 'V爱尊享终身寿险', premium: '20,000', oldPoints: '1000', newPoints: '2000' },
          { policyNo: 'P0009923812', productName: '臻爱重疾保障计划', premium: '5,000', oldPoints: '500', newPoints: '1200' }
        ]
      }
      this.detailDialogVisible = true
    },

    // 场景二：试算
    handleScene2Calculate() {
      this.scene2Result = {
        sub1: {
          calculatedPoints: 1000,
          newLevel: '新二星客户',
          nextLevel: '新三星客户',
          pointsGap: 500,
          upsellAmount: '5,000',
          recommendProduct: '臻爱重疾险',
          allBenefits: ['每年免费体检1次', '生日双倍积分', '住院绿通服务'],
          newAddedBenefits: ['每年免费体检1次', '住院绿通服务']
        },
        sub2: {
          addPoints: 2000,
          totalPoints: 14000,
          newLevel: '新五星VIP客户',
          benefits: ['三甲医院专家点名手术', '高级体检套餐', '机场VIP贵宾厅全年6次', '1对1专属管家']
        },
        sub3: {
          addPoints: 2000,
          totalPoints: 10000,
          newLevel: '新四星VIP客户',
          diffTable: [
            { type: '新增', item: '三甲医院绿色通道', description: '新四星客户享有每年2次免费预约挂号服务（老系统无）' },
            { type: '调整', item: '免费体检额度', description: '体检额度由原来的 500元/年 升级提升至 1200元/年' },
            { type: '取消', item: '线下节日小礼品', description: '新规则取消线下实物邮寄，统一调整为等值电子积分发放' }
          ]
        }
      }
      this.$message.success('加保/购新单试算完成！')
    },

    resetScene2() {
      this.scene2Result = null
    },

    getDiffTagType(type) {
      if (type === '新增') return 'success'
      if (type === '调整') return 'warning'
      if (type === '取消') return 'danger'
      return 'info'
    }
  }
}
</script>

<style scoped>
.calculator-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}
.header-card {
  margin-bottom: 20px;
}
.terminal-selector {
  display: flex;
  align-items: center;
}
.terminal-tips {
  margin-left: 15px;
}
.main-tabs {
  background: #fff;
}
.search-form {
  background: #f8f9fa;
  padding: 18px 18px 0 18px;
  border-radius: 4px;
}
.batch-action-bar {
  margin-top: 15px;
  display: flex;
  gap: 12px;
}
.result-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fff;
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.compare-card {
  text-align: center;
}
.card-title {
  font-weight: bold;
  font-size: 16px;
}
.metric-item {
  margin: 15px 0;
  font-size: 15px;
}
.metric-item .value {
  font-size: 20px;
  font-weight: bold;
}
.metric-item .value.highlight {
  color: #f56c6c;
}
.sub-scene-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.form-card {
  background-color: #fdfdfd;
}
.form-section-title {
  font-weight: bold;
  margin: 10px 0 15px 0;
  padding-left: 8px;
  border-left: 4px solid #6383ff;
}
.sub-title {
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}
.custom-desc-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ebeef5;
}
.custom-desc-table td {
  border: 1px solid #ebeef5;
  padding: 10px 15px;
  font-size: 14px;
}
.custom-desc-table td.bg-gray {
  background-color: #fafafa;
  color: #606266;
  width: 20%;
}
.mt-15 { margin-top: 15px; }
.mt-20 { margin-top: 20px; }
.mr-10 { margin-right: 10px; }
.mb-10 { margin-bottom: 10px; }
.highlight-text { color: #f56c6c; font-weight: bold; font-size: 16px; }
.danger-text { color: #e6a23c; font-weight: bold; }
.benefit-list.add li {
  color: #67c23a;
  line-height: 24px;
}
</style>