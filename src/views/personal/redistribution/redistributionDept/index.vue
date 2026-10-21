//孤儿客户重分配机构
<template>
  <div class="container">
    <div class="table">
      <div class="page-header">
        <div class="header-row">
          <div class="btns">
            <el-button class="m10" @click="upPage" size="small" type="primary" icon="el-icon-plus">新建</el-button>
            <el-dropdown size="small" trigger="click" @command="handleExportCommand">
              <el-button size="small" plain type="primary">
                <i class="el-icon-download"></i>导出明细<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown" class="export-dropdown">
                <el-dropdown-item command="handleExport"><i class="el-icon-document"></i>个险有效纯孤单客户明细</el-dropdown-item>
                <el-dropdown-item command="handleExportCross"><i class="el-icon-document-copy"></i>跨渠道迁移客户明细</el-dropdown-item>
                <el-dropdown-item command="handleExportAllValid"><i class="el-icon-document-checked"></i>全量可分配有效客户明细</el-dropdown-item>
                <el-dropdown-item command="handleExportTermination"><i class="el-icon-document-delete"></i>个险终止纯孤单客户明细</el-dropdown-item>
                <el-dropdown-item command="handleExportAllAlloc"><i class="el-icon-s-data"></i>全量可分配客户明细</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-value">{{formDataClient.canAllocCnt || 0}}</div>
              <div class="stat-label">可分配客户总数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{formDataClient.canAllocValidCnt || 0}}</div>
              <div class="stat-label">可分配有效客户数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{formDataClient.undoneZhipaiValidCnt || 0}}</div>
              <div class="stat-label">未指派的有效客户数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{formDataClient.doneZhipaiCnt || 0}}</div>
              <div class="stat-label">已指派客户数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{formDataClient.canUndoneAllocCnt || 0}}</div>
              <div class="stat-label">已指派未分配客户数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{formDataClient.doneAllocCnt || 0}}</div>
              <div class="stat-label">已分配客户数</div>
            </div>
          </div>
        </div>
      </div>
      <el-table
          ref="table"
          :data="tableData"
          size="small"
          height="100%"
          row-key="code"
          reserve-selection
          v-loading="loading">
        <el-table-column type="index" width="50" label="序号" align="center" :index="indexMethods"></el-table-column>
        <el-table-column label="文件名称" prop="fileName" min-width="160" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="审核状态" min-width="80" prop="state" show-overflow-tooltip align="center"  >
          <template #default="{row}">
            {{getAuditStatus(row.state)}}
          </template>
        </el-table-column>
        <el-table-column label="创建人" min-width="80" prop="makeName" show-overflow-tooltip align="center"></el-table-column>
        <el-table-column label="客户类型" min-width="120" prop="custType" show-overflow-tooltip align="center">
          <template #default="{row}">
            {{getCustType(row.custType)}}
          </template>
        </el-table-column>
        <el-table-column label="导入客户数" min-width="80" prop="custCount" show-overflow-tooltip align="center"></el-table-column>
        <el-table-column label="创建时间" min-width="100" prop="makeDate" show-overflow-tooltip align="center"></el-table-column>
        <el-table-column label="操作（仅分配当天可以执行“撤销”操作）" width="180" fixed="right" align="center">
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
import { exportFileGet } from 'utils/exportFile'
import trackExamine from './components/trackExamine'
import formItem from 'components/formItem'
import {
  getImportTemplate,
  importIntegrationRule,
  seletFileList,
  getUser, selectDeptCnt, cancelFileList
} from 'api/pointRedistribution/index'
import { getUserInfo } from '../../../../api/auth';

// 各导出项对应的 FineReport 报表 uuid
// 跳转链接格式：/system/report?url=/FineReport/decision/v10/entry/access/{uuid}?preview=true
const REPORT_UUIDS = {
  handleExport: 'cd705ef3-4f92-4c7b-bf76-db65c390ade9', // 个险有效纯孤单客户明细
  handleExportCross: 'd1865e10-bb77-45be-a179-6ab081cc5e1e', // 跨渠道迁移客户明细
  handleExportAllValid: '498f36f3-9651-48b9-8b2f-9723a8edf7d1', // 全量可分配有效客户明细
  handleExportTermination: '30e0b6aa-af21-402d-999b-8401660c7c69', // 个险终止纯孤单客户明细
  handleExportAllAlloc: '533f9864-7348-4105-a6ba-e83f83027670' // 全量可分配客户明细
}


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
      formData: {
        pageNum: 1,
        pageSize: 20
      },
      formDataClient: {
        canAllocCnt: 0,
        canAllocValidCnt: 0,
        undoneZhipaiValidCnt: 0,
        doneZhipaiCnt: 0,
        canUndoneAllocCnt: 0,
        doneAllocCnt: 0
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
    this.getUserCode();
    this.getUserCookie()
  },
  methods: {
    async getUserCookie() {
      const res = await getUserInfo()
      console.log('res1', res.userInfo.orgs[0])
      if (res.userInfo.orgs.length > 0) {
        this.id = res.userInfo.orgs[0].id
        this.orgName = res.userInfo.orgs[0].orgName
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
          console.log('取消')
        })
    },
    handleExportCommand(command) {
      const uuid = REPORT_UUIDS[command]
      if (!uuid) {
        this.$message.warning('该报表链接尚未配置')
        return
      }
      const url = `/system/report?url=/FineReport/decision/v10/entry/access/${uuid}?preview=true`
      window.open(url, '_blank')
    },
    getUserCode() {
      getUser();
    },
    async getUserId() {
      const res = await getUser()
      const index = res.getUserOrgs.lastIndexOf('/')
      const lastValue = res.getUserOrgs.substring(index + 1)
      console.log('str', res.getUserOrgs.lastIndexOf('/'), lastValue);
      if (lastValue) {
        selectDeptCnt({ OrgCode: lastValue }).then(res => {
          this.formDataClient = res ? res : {
            canAllocCnt: 0,
            canAllocValidCnt: 0,
            undoneZhipaiValidCnt: 0,
            doneZhipaiCnt: 0,
            canUndoneAllocCnt: 0,
            doneAllocCnt: 0
          }
        })
      }
    },
    upPage() {
      window.location.href = '/point/personal/redistributionDeptAdd';
    },
    // 判断是否拥有该按钮权限
    getUserInfoOrganization() {
      const param = {
        pageNum: this.formData.pageNum,
        pageSize: this.formData.pageSize
      }
      // 文件列表
      seletFileList(param).then(({ page: { total, list } }) => {
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
    // 获取客户类型
    getCustType(state) {
      switch (state) {
        case '1':
          return '有效纯孤单客户'
        case '2':
          return '已失效纯孤单客户'
        case '3':
          return '全量纯孤单客户'
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
        importIntegrationRule(
          formData,
          progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            this.progressNum = percentCompleted > 90 ? 90 : percentCompleted
          }
        ).then(res => {
          if (res.result) {
            this.progressNum = 100
            this.progressStatusText = '导入完成，请核对信息无误后，点击“提交”'
            this.progressVisible = false
            this.$message({
              type: 'success',
              message: '导入完成，请核对信息无误后，点击“提交”'
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
        console.log('下载上传模板')
        getImportTemplate({ integralCode: this.formData.integralCode }).then(res => {
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
.export-dropdown {
  min-width: 220px !important;
  padding: 6px 0 !important;
  .el-dropdown__item {
    display: flex;
    align-items: center;
    padding: 10px 16px !important;
    font-size: 13px;
    line-height: 1.4;
    color: #374151;
    i {
      font-size: 15px;
      margin-right: 10px;
      color: #6383ff;
      width: 18px;
      text-align: center;
    }
    &:hover {
      background-color: #f5f7ff !important;
      color: #4f6af6 !important;
    }
  }
  .el-dropdown-menu__item--divided {
    border-top-color: #e5e7eb !important;
    margin: 6px 0 !important;
  }
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
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: $radius;
    .page-header {
      flex-shrink: 0;
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    .header-row {
      display: flex;
      align-items: stretch;
      gap: 16px;
      .btns {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        .el-button {
          margin-right: 10px;
          font-size: 13px;
          i {
            margin-right: 4px;
          }
        }
        .el-dropdown {
          vertical-align: middle;
        }
      }
      .stats-row {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        .stat-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          background: #fafbfc;
          border-radius: 6px;
          padding: 8px 10px;
          border: 1px solid #ebeef5;
          text-align: center;
          .stat-value {
            font-size: 13px;
            font-weight: 600;
            color: #303133;
            line-height: 1.3;
          }
          .stat-label {
            font-size: 13px;
            font-weight: 600;
            color: #303133;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
    .option {
      font-size: 12px;
      &:not(:first-child) {
        padding-left: 10px;
      }
    }
  }
  .pagination {
    flex-shrink: 0;
    height: 48px;
    padding: 8px 16px;
    background-color: #fff;
    border-top: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
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
