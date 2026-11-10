import { getPlatformPageButtonMenuInfo } from 'api/btnPermissions'

const PAGE_TYPES = {
  '/personal/manage': 'pointManage',
  '/personal/apply': 'pointApply',
  '/personal/sh': 'pointSh',
  '/personal/guiji': 'pointGuiJi',
  '/personal/rule': 'pointRule',
  '/personal/plm': 'pointLevelManage',
  '/personal/lc': 'levelChange',
  '/personal/srm': 'serviceRuleManage',
  '/personal/serviceApply': 'serviceApply',
  '/personal/service-apply': 'serviceApply',
  '/personal/serviceApproval': 'serviceApproval',
  '/personal/service-approval': 'serviceApproval',
  '/personal/serviceGuiJi': 'serviceGuiJi',
  '/personal/service-guiji': 'serviceGuiJi',
  '/personal/otn': 'oldToNew',
  '/personal/guiJiTab': 'guiJiTab',
  '/personal/pointCalculated': 'pointCalculate'
}

export default {
  data() {
    return { allowBtn: [], permissionsLoaded: false }
  },
  created() {
    const pageType = PAGE_TYPES[this.$route && this.$route.path]
    if (!pageType) return
    getPlatformPageButtonMenuInfo({ pageType }).then(response => {
      const list = response && (response.data && response.data.list || response.list)
      this.allowBtn = Array.isArray(list) ? list : []
      this.permissionsLoaded = true
    }).catch(() => { this.allowBtn = []; this.permissionsLoaded = true })
  },
  methods: {
    handleIsOwn(action) {
      return this.allowBtn.some(button => {
        const name = typeof button === 'string' ? button : button && (button.name || button.buttonName)
        return name === action
      })
    }
  }
}
