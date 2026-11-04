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
  '/personal/serviceApproval': 'serviceApproval',
  '/personal/serviceGuiJi': 'serviceGuiJi',
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
      const list = response && (response.list || response.data && response.data.list)
      this.allowBtn = Array.isArray(list) ? list : []
      this.permissionsLoaded = true
    }).catch(() => { this.permissionsLoaded = true })
  },
  methods: {
    handleIsOwn() {
      // The backend response is additive: buttons absent from it remain visible by default.
      return true
    }
  }
}
