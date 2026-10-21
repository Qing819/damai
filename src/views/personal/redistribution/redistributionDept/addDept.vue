//孤儿客户重分配机构
<template>
  <div class="container">
    <div class="container-header">
      <div class="dialog-header">
        <div class="title">{{`新建孤单客户分配机构`}}</div>
        <div>
          <el-button plain size="small" icon="el-icon-back" @click="backPage" type="primary">返回</el-button>
        </div>
      </div>
    </div>
    <div class="blockStart">
      <el-form inline label-width="150px">
        <el-form-item label="分配开始时间">
          <el-date-picker v-model="formData.startTime" placeholder="选择日期" :disabled="Boolean(fileId)"
                          :picker-options="startDateOption">
          </el-date-picker>

        </el-form-item>
        <el-form-item label="强制回收时间">
          <el-date-picker v-model="formData.endTime" placeholder="选择日期"
                          value-format="yyyy-MM-dd"
                          format="yyyy-MM-dd"
                          :picker-options="endDateOption">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select
            v-model="deType"
            placeholder="请选择"
            :size="size"
            style="width:100%;"
            filterable
            clearable>
            <el-option
              v-for="(item, index) in seleArr"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="downloadTemplate" size="small" type="primary">下载上传模板</el-button>
          <el-upload action="" accept=".xls,.xlsx" :on-change="fileChange" :show-file-list="false" :auto-upload="false"
                     :file-list="fileList" style="display:inline;margin-left:10px">
            <el-button size="small" type="primary">导入文件</el-button>
          </el-upload>
          <el-button @click="sureTemplateTemplate" size="small" style="display:inline;margin-left:10px" type="primary" :disabled="isSubmit">提交</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="blockRebackInformation" style="position:relative;">
      <span class="blockRebackInformationSpan">操作流程：下载模板-填写分配信息-导入文件-确认是否成功-填写强制回收时间（非必选）-提交</span>
      <span class="blockRebackInformationSpan" ><br>手工回收操作：在模板中机构ID列输入“99999”，机构名称列输入“孤单客户机构回收”。客户机构回收时代理人将同时回收</span>
<!--      <el-button slot="reference" type="primary" size="mini" class="validationText" @click="togglePopover" style="right: 300px;bottom: 3px;position: absolute;">校验规则</el-button>-->
      <el-popover placement="bottom" width="550" trigger="click" :visible.sync="popoverVisible">
        <el-table ref="table" :data="tableRule" size="small" height="calc(100% - 50px - 40px)"
                  reserve-selection v-loading="loading">
          <el-table-column type="index" prop="ruleId" width="50" label="序号" align="left" ></el-table-column>
          <el-table-column label="规则" prop="rule" min-width="120" align="left" show-overflow-tooltip></el-table-column>
        </el-table>
        <el-button slot="reference" type="primary" size="mini" class="validationText" @click="togglePopover" style="right: 300px;bottom: 3px;position: absolute;">校验规则</el-button>
      </el-popover>
    </div>
    <div style="height: 88%;">
      <el-table ref="table" :data="tableData" size="small" height="calc(100% - 50px - 40px)" row-key="code"
                reserve-selection v-loading="loading">
        <el-table-column type="index" width="50" label="序号" align="center" :index="indexMethods"></el-table-column>
        <el-table-column label="客户ID" prop="custId" min-width="100" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="客户姓名" min-width="80" prop="custName" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="机构ID" min-width="80" prop="custManage" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="机构名称" min-width="80" prop="saledeptName" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="分配开始时间" min-width="100" prop="effectiveTime" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="强制回收时间" min-width="100" prop="expirationTime" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="是否成功" min-width="50" prop="state" align="center" show-overflow-tooltip>
          <template #default="{row}">
            {{getAuditStatus(row.state)}}
          </template>
        </el-table-column>
<!--              <el-table-column label="原因" min-width="130" prop="exceptionCause" :render-header="renderHeader"  show-overflow-tooltip>-->
        <el-table-column label="原因" min-width="130" prop="exceptionCause"  show-overflow-tooltip>
          <!--        <template slot="header">-->
          <!--          <div @mouseenter="isShow = true">-->
          <!--            <span>原因</span>-->
          <!--            <i class="el-icon-warning"></i>-->
          <!--            <div v-show="isShow" style="display: inline-block">-->
          <!--              <span>校验规则</span>-->
          <!--            </div>-->
          <!--          </div>-->
          <!--        </template>-->
        </el-table-column>
      </el-table>
      <div class="pagination" style="position: fixed;">
        <el-pagination
          :current-page="pageNum"
          :page-sizes="[20, 40, 60, 80]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import {
  mapGetters
} from 'vuex'
import {
  exportFileGet
} from 'utils/exportFile'
import trackExamine from './components/trackExamine'
import formItem from 'components/formItem'
import {
  getImportTemplate,
  importIntegrationRule,
  orgCodesInformation,
  deleteFileList,
  sureFileList,
  sureFileListUp
} from 'api/pointRedistribution/index'

export default {
  components: {
    trackExamine,
    formItem
  },

  data() {
    return {
      size: 'small',
      popoverVisible: false,
      tableRule: [],
      isSubmit: false,
      isShow: false,
      depart: '',
      deType: '',
      seleArr: [
        {
          label: '有效纯孤单客户',
          value: '1'
        },
        {
          label: '已失效纯孤单客户',
          value: '2'
        },
        {
          label: '全量纯孤单客户',
          value: '3'
        }
      ],
      formData: {
        endTime: '',
        startTime: ''
      },
      pageNum: 1,
      pageSize: 20,
      total: null,
      premiumIntegral: '', // 保费积分编码
      searchConfig: [], // 查询内容配置
      searchInfo: [], // 查询条件
      loading: false,
      trackDialog: false, // 轨迹查询弹窗
      type: '', // 新增或编辑弹窗类型
      fileId: null, // 轨迹查询fileId信息
      tableHeader: [],
      tableData: [],
      fileList: [],
      // 进度条
      progressVisible: false,
      progressNum: 0,
      progressStatusText: '正在导入中...',
      dayMiniseconds: 1000 * 60 * 60 * 24,
      startDateOption: {
        disabledDate: startDate => (startDate.getTime() < new Date().getTime()) || (startDate.getTime() > (new Date().getTime() + 10 * this.dayMiniseconds))
      },
      endDateOption: {
        disabledDate: endDate => this.formData.startTime ? new Date(endDate) <= new Date(this.formData.startTime) :
          false
      }
    };
  },
  computed: {},
  watch: {
    'formData.endTime'(val) {
      console.log('val1', val)
      if (this.tableData.length) {
        this.loading = true
        for (const el of this.tableData) {
          el.expirationTime = val
        }
        this.loading = false
      }
    },
    depart() {
      // console.log(this.isSubmit+"0")
      // if(this.tableData.length > 0) {
      //   for (const el of this.tableData)
      //     if(el.state==0){
      //       this.isSubmit = true
      //     }
      // }
      // console.log(this.isSubmit+"1")
    },
    searchConfig(val) {
      this.searchInfo = []
      val.forEach(item => {
        this.searchInfo.push({
          elementCode: item.elementCode,
          elementValue: ''
        })
      })
    }
  },
  created() {
    this.dateTime();
    this.getTableData();
  },
  methods: {
    togglePopover() {
      this.popoverVisible = !this.popoverVisible;
      console.log('popoverVisible', this.popoverVisible)
      console.log('tableRule', this.tableRule)
      this.tableRule = [
        {
          ruleId: '1',
          rule: '机构ID及名称：填写内容须与模板中的机构信息完全一致'
        },
        {
          ruleId: '2',
          rule: '客户信息：校验客户ID、姓名、是否纯孤单客户、是否重复'
        },
        {
          ruleId: '3',
          rule: '客户所属分公司：按照客户最近一张个险保单所属，确定分公司归属'
        },
        {
          ruleId: '4',
          rule: '内勤权限：操作人员权限须与客户归属分公司一致'
        },
        {
          ruleId: '5',
          rule: '客户类型：根据导入时选择的客户类型进行校验'
        },
        {
          ruleId: '6',
          rule: '回收校验：已指派客户须进行回收，才可再次指派；已回收的不可再次提交回收'
        },
        {
          ruleId: '7',
          rule: '是否处在等待期：从机构回收后的30天内，不得再次进行机构指派'
        }
      ]
    },
    // 小提示



    // 获取数据
    getTableData() {
      const param = {
        fileId: this.fileId,
        pageNum: this.pageNum,
        pageSize: this.pageSize
      };
      orgCodesInformation(param)
        .then(
          ({
            page: {
              total,
              list
            }
          }) => {
            console.log(list)
            this.tableData = list;
            this.total = total;
            console.log(this.isSubmit + '0')
            console.log('this.tableData', this.tableData)
            console.log(this.tableData.length + 'y')
            if (this.tableData.length > 0) {
              for (const el of this.tableData) {
                this.isSubmit = el.state === 0
              }
              console.log(this.isSubmit + '1')
            }
          }
        );
      // console.log(this.isSubmit+"0")
      // console.log('this.tableData', this.tableData)
      // console.log(this.tableData.length+"y")
      // if(this.tableData.length > 0) {
      //   for (const el of this.tableData)
      //     console.log(el.state+"Y")
      //     if(el.state==0){
      //       this.isSubmit = true
      //     }
      // }
      // console.log(this.isSubmit+"1")
      // if(this.fileId != null){
      //   let paramState ={fileId: this.fileId};
      //   sureFileListUp(paramState).then(res => {
      //     this.statusUP = res.countNum
      //   })
      // }
    },
    pickDateStart(time) {
      if (this.value1) {
        return time.getTime() > this.value1
      } else {
        return false
      }
    },
    // 设置开始时间为今天
    dateTime() {
      this.formData.startTime = new Date(new Date().getTime() + this.dayMiniseconds);
    },
    backPage() {
      window.location.href = '/point/personal/redistributionDept';
    },

    // 获取审核状态  0是false 1是true
    getAuditStatus(state) {
      switch (state) {
        case 0:
          return '失败'
        case 1:
          return '成功'
        case 2:
          return '审核中'
        default:
          return ''
      }
    },

    // 获取表格单元格的内容
    getTableValue(list, code) {
      const value = list.find(e => e.elementCode === code)
      return value ? value.elementValue || '' : ''
    },

    // 处理重置
    handleReset() {
      this.searchInfo.forEach(item => {
        item.elementValue = ''
      })
      this.formData.ruleName = ''
      this.formData.auditStatus = ''
    },
    // 序号
    indexMethods(index) {
      return (this.formData.pageNum - 1) * this.formData.pageSize + index + 1
    },
    // 上传文件
    fileChange(file, fileList) {
      this.loading = true
      if (file) {
        const formData = new FormData()
        formData.append('excel', file.raw)
        if (this.formData.startTime) {
          console.log('this.formData.startTime', this.formData.startTime)
          formData.append('startDate', this.formData.startTime.getTime())
        }
        if (this.formData.endTime) {
          formData.append('endDate', new Date(this.formData.endTime).getTime())
        }
        formData.append('fileId', this.fileId)
        formData.append('type', this.deType)
        this.progressVisible = true;
        importIntegrationRule(
          formData,
          progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            this.progressNum = percentCompleted > 90 ? 90 : percentCompleted
          }
        ).then(res => {
          if (res) {
            this.progressNum = 100
            this.progressStatusText = '导入完成，请核对信息无误后，点击“提交”'
            this.progressVisible = false
            this.$message({
              type: 'success',
              message: '导入完成，请核对信息无误后，点击“提交”'
            })
            this.fileId = res.fileId
            this.startTime = res.startDate
            this.endTime = res.endDate
            this.startDateOption = false
            this.getTableData();
          } else {
            this.progressVisible = false
            this.$message({
              type: 'warning',
              message: '导入模板填写有误',
              duration: 2000
            })
          }
        }).catch(() => {
          this.progressNum = 200
          this.progressStatusText = '导入失败!'
          this.progressVisible = false
        }).finally(() => {
          // 清理进度条状态
          this.progressStatusText = '正在导入中...'
          this.progressNum = 0
          this.loading = false
        })
      }
    },
    // 下载模板
    downloadTemplate() {
      this.loading = true
      getImportTemplate().then(res => {
        exportFileGet(res, '孤单客户再分配机构')
      }).finally(() => {
        // 清理进度条状态
        this.progressStatusText = '正在下载中...'
        this.progressNum = 0
        this.loading = false
      })
    },
    // 点击提交按钮
    sureTemplateTemplate() {
      if (this.statusUP != null) {
        this.$message({
          type: 'warning',
          message: '客户再分配机构有错误，请重新上传'
        })
        return;
      } else {
        const param = {
          fileId: this.fileId,
          endDate: this.formData.endTime ? new Date(this.formData.endTime).getTime() : null
        };
        sureFileList(param).then(res => {
          this.$message({
            type: 'success',
            message: '提交成功'
          })
        })
          .finally(() => {
            this.backPage()
          });
      }
    },
    // 处理新增
    handleAdd(item) {},
    // 处理轨迹查询
    handleTrack(row) {
      this.trackDialog = true
    },
    // 处理当前页面大小改变
    handleSizeChange(val) {
      this.pageSize = val
      this.getTableData();
    },

    // 处理当前页更改
    handleCurrentChange(val) {
      this.pageNum = val
      this.getTableData();
    }
  }
};
</script>

<style lang="scss" scoped>
  $radius: 4px;

  ::v-deep.container .box {
    margin-top: 0;
    padding: 0;
  }

  .container {
    .scrollbar {
      height: calc(100% - 42px)
    }

    height: 100%;

    .container-header {
      font-size: 14px;
      font-weight: bolder;
    }

    .blockStart {
      margin-top: 10px ;
      background-color: #fff;
      padding: 10px 0 0 0;
      .el-form-item {
        margin-bottom: 10px;
      }
    }
    .blockRebackInformation{
      padding: 0px 53px ;
      background-color: #fff;
      .blockRebackInformationSpan{
        color: #8A8F9D;
        font-weight:500;
        font-size: 12px;
      }
    }

    .dialog-header {
      background-color: #fff;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title {
      height: 16px;
      font-size: 12px;
      display: flex;
      align-items: center;
      font-weight: 600;

      &::before {
        content: '';
        display: inline-block;
        width: 3px;
        height: 12px;
        border-radius: 1px;
        margin-right: 12px;
        background-color: #6383ff;
      }
    }

    .header {
      background-color: #fff;
      border-radius: $radius;
      padding: 10px;
      display: flex;
      justify-content: space-between;
    }

    ::v-deep.el-scrollbar__wrap {
      overflow-x: hidden;
    }
  }
</style>
