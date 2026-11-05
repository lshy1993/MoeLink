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
import { initAuth, refreshAccessToken } from './utils/auth'

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

// 登录态由 HttpOnly 会话 Cookie 承载；启动时先换取 access token，页面才能正确判断登录状态。
// 401 时先用会话续期并重试一次，仍失败才视为登录已失效。
axios.interceptors.response.use(undefined, async (error) => {
  const config = error.config
  const requested = String(config?.url || '')
  if (
    error.response?.status === 401 &&
    config &&
    !config.__retried &&
    func.GetToken() &&
    !requested.includes('/auth/session/refresh')
  ) {
    config.__retried = true
    const result = await refreshAccessToken()
    if (result === 'ok') {
      config.headers = { ...config.headers, Authorization: `Bearer ${func.GetToken()}` }
      return axios(config)
    }
    if (result === 'none') window.dispatchEvent(new Event('moelink:session-expired'))
  }
  throw error
})

async function bootstrap() {
  await initAuth()

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
}

void bootstrap()
