//孤儿客户重分配机构
<template>
  <div class="container">
    <div class="table">
      <div class="btns" style="width: 100%">
        <el-button class="m10" @click="upPage" size="mini" type="primary">新建</el-button>
        <el-button size="mini" type="primary" @click="handleExport">导出当前可分配孤单客户明细</el-button>
        <!--        <div style="margin-left: 20%;display: flex;align-items: stretch">-->
        <div style="display: inline-block;margin-left: 5%">
          <span>当前未分配客户数:{{formDataClient.canUndoneAllocCnt}}</span>
        </div>
        <div style="display: inline-block;margin-left: 5%">
          <span>当前未分配有效客户数:{{formDataClient.canUndoneAllocValidCnt}}</span>
        </div>
        <div style="display: inline-block;margin-left: 5%">
          <span>已分配客户数:{{formDataClient.doneAllocCnt}}</span>
        </div>

      </div>

      <el-table
          ref="table"
          :data="tableData"
          size="small"
          height="calc(100% - 50px - 40px)"
          row-key="code"
          reserve-selection
          v-loading="loading">
        <el-table-column type="index" width="50" label="序号" align="center" :index="indexMethods"></el-table-column>
        <el-table-column label="文件名称" prop="fileName" min-width="160" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="审核状态" min-width="80" prop="state" show-overflow-tooltip>
          <template #default="{row}">
            {{getAuditStatus(row.state)}}
          </template>
        </el-table-column>
        <el-table-column label="创建人" min-width="80" prop="makeName" show-overflow-tooltip></el-table-column>
        <el-table-column label="创建时间" min-width="150" prop="makeDate" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作（仅分配当天可以执行“撤销”操作）" width="180" fixed="right">
          <template #default="{ row }">
            <el-link  class="option" type="primary" :underline="false" @click="handleTrack(row)">列表详情</el-link>
            <el-link class="option" type="primary" :underline="false" :disabled="row.makeDate.substring(0, 10) !== currentDate || row.state === '3'"  @click="Quash(row)">撤销</el-link>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
          :current-page="formData.pageNum"
          :page-sizes="[20, 40, 60, 80]"
          :page-size="formData.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      ></el-pagination>
    </div>

    <!-- 轨迹查询 -->
    <el-dialog :visible.sync="trackDialog" fullscreen>
      <track-examine v-if="trackDialog" :trackDialog.sync="trackDialog" :fileId="fileId" :key="fileId" ></track-examine>
    </el-dialog>
  </div>
</template>

<script>
import 'vuex'
import 'utils/index'
import { exportFileGet } from 'utils/exportFile'
import trackExamine from './components/trackExamine'
import formItem from 'components/formItem'
import {
  getImportNotallocDetail,
  cancelFileList,
  getUser,
  selectAgentCnt,
  getImportTemplateAgent,
  importIntegrationRuleAgent,
  seletFileListAgent
} from 'api/pointRedistribution/index'
import { getUserInfo } from '../../../../api/auth';
import 'axios'
import 'crypto';
import 'utils/auth'

export default {
  components: { trackExamine, formItem },
  data() {
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const formattedTime = year + '-' + month + '-' + day;
    return {
      currentDate: formattedTime,
      formDataClient: {
        canUndoneAllocCnt: 0,
        canUndoneAllocValidCnt: 0,
        doneAllocCnt: 0
      },
      formData: {
        pageNum: 1,
        pageSize: 20
      },
      premiumIntegral: '', // 保费积分编码
      searchConfig: [], // 查询内容配置
      searchInfo: [], // 查询条件
      loading: false,
      total: null,
      trackDialog: false, // 轨迹查询弹窗
      ruleCode: '', // 规则编码
      type: '', // 新增或编辑弹窗类型
      fileId: '', // 轨迹查询fileId信息
      tableHeader: [],
      tableData: [],
      fileList: [],
      // 进度条
      progressVisible: false,
      progressNum: 0,
      progressStatusText: '正在导入中...',
      orgName: '',
      id: ''
    };
  },
  computed: {

  },
  watch: {
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
    this.getUserId(),
    this.getUserInfoOrganization()
    this.getUserCookie()
  },
  methods: {
    async getUserCookie() {
      const res = await getUserInfo()
      if (res.userInfo.orgs.length > 0) {
        this.id = res.userInfo.orgs[0].id
        this.orgName = res.userInfo.orgs[0].orgName
      }
    },
    async handleExport() {
      const res = await getUser()
      const index = res.getUserOrgs.lastIndexOf('/')
      const lastValue = res.getUserOrgs.substring(index + 1)
      alert(lastValue);
      // res.UtilsOrgCode
      if (lastValue) {
        getImportNotallocDetail({ orgCode: lastValue }).then(res => {
          exportFileGet(res, `${this.id}-${this.orgName}-未分配有效纯孤单客户`)
          // exportFilePost(res, '未分配有效纯孤单客户')
        }).finally(() => {
          // 清理进度条状态
          this.progressStatusText = '正在下载中...'
          this.progressNum = 0
          this.loading = false
        })
        // getImportNotAllocDetail({code: '861100002'}).then(res => {
        // })
        // const token = getToken()
        // const md5 = crypto.createHash('md5')
        // let http_header = ''
        // if (token) {
        //   http_header = {
        //     'Authorization' : token,
        //     'Content-Type' : 'application/json',
        //     timestamp : new Date().getTime(),
        //     'random' : random(10),
        //     'signKey' : 'boncsingkey!@#$%^&*(((()',
        //     'md5' : crypto.createHash('md5'),
        //       'sign': md5.digest('hex')
        //     // md5.update(timestamp + rand + signKey),
        //   }
        // }
        // let code = {code: res.UtilsOrgCode}
        // axios({
        //   method: 'post',
        //   url: '/api/bxmIntegral/bxmIntegralRedistributionAgent/getImportNotAllocDetail',
        //   params: code,
        //   headers: http_header,
        //   responseType: 'blob'
        // }).then(res => {
        //   // exportFileGet(res, '未分配有效纯孤单客户')
        //   let data = res
        //   let url = window.URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
        //   let link = document.createElement('a')
        //   link.style.display = 'none'
        //   link.href = url
        //   //  link.setAttribute('download', 'excel.xlsx')
        //   link.setAttribute('download', 'test.xlsx')
        //   document.body.appendChild(link)
        //   link.click()
        // })
      }
    },
    Quash(row) {
      this.$confirm('是否撤销?', '确认框', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        cancelFileList({ fileId: row.fileId }).then(res => {
          this.$refs.table.loading = true
          const delIndex = this.tableData.findIndex(item => item.fileId === row.fileId)
          this.tableData.splice(delIndex, 1)
          this.total = this.tableData.length
          this.$refs.table.loading = false

          this.$message.success('操作成功')
        }, err => {

        })
        // this.getList()
      })
        .catch(() => {
          // 【待人工复核】沿用原有行为，不向外抛出异常。
        })
    },
    async getUserId() {
      const res = await getUser()
      const index = res.getUserOrgs.lastIndexOf('/')
      const lastValue = res.getUserOrgs.substring(index + 1)
      if (lastValue) {
        selectAgentCnt({ OrgCode: lastValue }).then(res => {
          this.formDataClient = res ? res : {
            canUndoneAllocCnt: 0,
            canUndoneAllocValidCnt: 0,
            doneAllocCnt: 0
          }
        })
      }
    },
    upPage() {
      window.location.href = '/point/personal/redistributionAgentAdd';
    },
    // 判断是否拥有该按钮权限
    getUserInfoOrganization() {
      const param = {
        pageNum: this.formData.pageNum,
        pageSize: this.formData.pageSize
      }
      // 文件列表
      seletFileListAgent(param).then(({ page: { total, list } }) => {
        this.tableData = list
        this.total = total
        this.$nextTick(() => {
          this.$refs.table.doLayout()
        })
      })
        .finally(() => {
          this.loading = false
        });
    },
    // 序号
    indexMethods(index) {
      return (this.formData.pageNum - 1) * this.formData.pageSize + index + 1
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
        case 3:
          return '已撤销'
        default:
          return ''
      }
    },

    // 获取表格单元格的内容
    getTableValue(list, code) {
      const value = list.find(e => e.elementCode === code)
      return value ? value.elementValue || '' : ''
    },
    // 处理下拉改变
    handleChange() {
      this.formData.pageNum = 1
      this.formData.ruleName = ''
      this.formData.auditStatus = ''
      this.$nextTick(() => {
        this.getUserInfoOrganization()
      })
    },
    // 处理查询
    handleSearch() {
      this.formData.pageNum = 1
      this.$nextTick(() => {
        this.getUserInfoOrganization()
      })
    },
    // 处理编辑
    handleEdit(row) {

    },
    // 处理重置
    handleReset() {
      this.searchInfo.forEach(item => {
        item.elementValue = ''
      })
      this.formData.ruleName = ''
      this.formData.auditStatus = ''
    },
    // 上传文件
    fileChange(file, fileList) {
      if (file) {
        const formData = new FormData()
        formData.append('excel', file.raw)
        formData.append('integralCode', this.formData.integralCode)
        this.progressVisible = true;
        importIntegrationRuleAgent(
          formData,
          progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            this.progressNum = percentCompleted > 90 ? 90 : percentCompleted
          }
        ).then(res => {
          if (res.result) {
            this.progressNum = 100
            this.progressStatusText = '导入成功!'
            this.progressVisible = false
            this.$message({
              type: 'success',
              message: '导入成功'
            })
            this.getUserInfoOrganization()
          } else {
            this.progressVisible = false
            this.$message({
              type: 'warning',
              message: res.error,
              duration: 2000
            })
          }
        }).catch(() => {
          this.progressNum = 100
          this.progressStatusText = '导入失败!'
          this.progressVisible = false
        }).finally(() => {
          // 清理进度条状态
          this.progressStatusText = '正在导入中...'
          this.progressNum = 0
        })
      }
    },
    // 处理导入
    handleImport(type) {
      if (type === 'downLoad') {
        getImportTemplateAgent({ integralCode: this.formData.integralCode }).then(res => {
          exportFileGet(res, '孤单客户再分配机构')
        })
      }
    },
    // 处理新增
    handleAdd(item) {
    },
    // 处理轨迹查询
    handleTrack(row) {
      this.trackDialog = true
      this.fileId = row.fileId
    },
    // 处理当前页面大小改变
    handleSizeChange(val) {
      this.formData.pageSize = val
      this.getUserInfoOrganization()
    },

    // 处理当前页更改
    handleCurrentChange(val) {
      this.formData.pageNum = val
      this.getUserInfoOrganization()
    }
  }
};
</script>

<style>
.el-dropdown-menu {
  max-height:300px;
  overflow:scroll;
}
</style>

<style lang="scss" scoped>
$radius: 4px;

.m10 {
  margin-left: 5px;
  font-size: 14px;
}
.m11 {
  width:120px;
  padding:0px 20px;
  text-align:left;
  margin: 0;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}
.m12 {
  padding:0px;
}


.container {
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  .search {
    background-color: #fff;
    border-radius: $radius;
    margin-bottom: 10px;
    .search-header {
      padding: 0 12px;
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e3e5ed;
      .search-title {
        // height: 16px;
        display: flex;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        &::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 12px;
          border-radius: 2px;
          margin-right: 8px;
          background-color: #6383ff;
        }
      }
    }
    .search-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 10px;
    }
  }
  .header-title {
    padding: 15px;
    font-weight: 600;
  }
  .table {
    flex:1;
    background-color: #fff;
    border-radius: $radius;
    .btns {
      height: 60px;
      padding: 10px;
    }
    .option {
      font-size: 12px;
      &:not(:first-child) {
        padding-left: 10px;
      }
    }
  }
  .pagination {
    position: fixed;
    left: 10px;
    bottom: 10px;
    height: 40px;
    padding: 4px;
    background-color: #fff;
  }

  .progress-dialog {
    .progress-text{
      text-align: center;
      font-size: 13px;
      color: #6383ff;
      padding-top: 15px;
    }
    ::v-deep.el-dialog {
      min-width: 400px;
      max-width: 800px;
      margin-top: calc(50vh - 90px);
    }
    ::v-deep.el-dialog__header {
      display: none;
    }
    ::v-deep.el-dialog__body {
      height: auto;
      padding: 30px 20px 20px;
    }
  }
}
::v-deep.el-form-item--small.el-form-item {
  margin: 0;
  padding: 10px;
}
::v-deep.el-dialog {
  background-color: #f4f4f4;
}
::v-deep.el-dialog .el-dialog__body {
  padding: 0;
}
::v-deep.el-dialog .el-dialog__header {
  padding: 0 10px;
  background: #fff;
  margin: 10px 10px 0 10px;
  border-radius: $radius;
}
</style>
