import Loading from './index.vue'

const FullScreenLoad = {
  install(Vue, options) {
    const loadingSubclass = Vue.extend(Loading);
    const Profile = new loadingSubclass({
      el: document.createElement('div')
    })
    document.body.appendChild(Profile.$el);
    if (options) {
      if (options.tips) {
        Profile.tips = options.tips;
      }
    }
    Vue.prototype.$fullScreenLoading = {
      show(tips) {
        Profile.show = true;
        if (tips) {
          Profile.tips = tips;
        }
      },
      hide() {
        Profile.show = false;
      }
    }
  }
}
export default FullScreenLoad
