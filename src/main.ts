import Aura from '@primeuix/themes/aura'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'primeicons/primeicons.css'

import axios from 'axios'
import moment from 'moment'

import type UserClass from './types/User'
import { userInstance } from './types/User'
import * as func from './utils'

import './style/animation.scss'
import './style/common.scss'
import './style/wiki.scss'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    Func: any
    $http: any
    User: UserClass
    $moment: typeof moment
  }
}

// 从 genshinquiz 等附属站跳转过来时，token 通过 URL hash 传入；
// 必须在路由页面创建前写入 localStorage，否则页面会误判为未登录。
const hashParams = new URLSearchParams(window.location.hash.slice(1))
const incomingToken = hashParams.get('oauth_token')
if (incomingToken) {
  func.SaveToken(incomingToken)
  window.history.replaceState(null, document.title, window.location.pathname + window.location.search)
}

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: { preset: Aura },
  ripple: true,
  license: import.meta.env.VITE_PRIMEUI_LICENSE_KEY || undefined,
})
app.use(ToastService)
app.use(ConfirmationService)

// 挂载全局属性
app.config.globalProperties.Func = func
app.config.globalProperties.$http = axios
app.config.globalProperties.User = userInstance
app.config.globalProperties.$moment = moment

app.mount('#app')
