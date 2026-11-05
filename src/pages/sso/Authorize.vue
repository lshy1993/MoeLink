<template>
  <div class="ssoPage">
    <div class="ssoCard">
      <i :class="icon"></i>
      <h1>{{ title }}</h1>
      <p v-if="message">{{ message }}</p>
      <router-link v-if="state === 'error'" to="/">回到首页</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { GetToken } from '@/utils'
import { GetAuthBase } from '@/utils/auth'

// 站外应用的单点登录授权页：确认当前 MoeLink 登录身份后，带着一次性授权码回到应用。
export default {
  name: 'SsoAuthorize',
  data() {
    return { state: 'working', clientName: '', message: '' }
  },
  computed: {
    icon() {
      return {
        working: 'pi pi-spin pi-spinner',
        login: 'pi pi-user',
        error: 'pi pi-exclamation-triangle',
      }[this.state]
    },
    title() {
      if (this.state === 'login') return '请先登录 MoeLink'
      if (this.state === 'error') return '无法继续'
      return this.clientName ? `正在登录到 ${this.clientName}…` : '正在验证…'
    },
  },
  mounted() {
    window.addEventListener('moelink:auth-changed', this.onAuthChanged)
    this.start()
  },
  beforeUnmount() {
    window.removeEventListener('moelink:auth-changed', this.onAuthChanged)
  },
  methods: {
    params() {
      const q = this.$route.query
      return {
        client_id: String(q.client_id || ''),
        redirect_uri: String(q.redirect_uri || ''),
        state: String(q.state || ''),
        code_challenge: String(q.code_challenge || ''),
        code_challenge_method: String(q.code_challenge_method || ''),
      }
    },
    fail(message) {
      this.state = 'error'
      this.message = message
    },
    async start() {
      const params = this.params()
      if (!params.client_id || !params.redirect_uri) {
        this.fail('缺少应用信息，请从应用内重新发起登录。')
        return
      }
      try {
        const res = await axios.get(`${GetAuthBase()}/auth/sso/client`, { params: { client_id: params.client_id } })
        this.clientName = res.data.name
      } catch {
        this.fail('未知的应用，无法继续登录。')
        return
      }
      if (!GetToken()) {
        this.state = 'login'
        this.message = `登录后将自动返回 ${this.clientName}。请点击右上角的「登录 / 注册」。`
        return
      }
      await this.authorize(params)
    },
    // 在本页登录成功后继续授权
    onAuthChanged() {
      if (this.state === 'login' && GetToken()) {
        this.state = 'working'
        this.message = ''
        this.authorize(this.params())
      }
    },
    async authorize(params) {
      try {
        const res = await axios.post(`${GetAuthBase()}/auth/sso/authorize`, params, { withCredentials: true })
        window.location.replace(res.data.redirect_to)
      } catch (err) {
        this.fail(err.response?.data?.error || '授权失败，请稍后重试。')
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.ssoPage {
  display: flex;
  justify-content: center;
  padding: 80px 16px;
}

.ssoCard {
  width: 100%;
  max-width: 420px;
  padding: 36px 28px;
  text-align: center;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(40, 60, 130, 0.08);

  i {
    font-size: 36px;
    color: #5b6fd6;
  }

  h1 {
    margin: 16px 0 8px;
    font-size: 20px;
    color: #2c3e77;
  }

  p {
    margin: 0 0 12px;
    color: #667;
    line-height: 1.6;
  }
}
</style>
