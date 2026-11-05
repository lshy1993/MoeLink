<template>
  <div id="app">
    <global-topbar
      v-if="$route.path.indexOf('/admin') !== 0"
      :user="user"
      :server-on="serverOn"
      :announcement="announcement"
      :announcement-unseen="announcementUnseen"
      @show-announcement="showAnnouncement"
      @show-login="showLoginBox"
      @logout="logOut"
    />
    <div v-if="loginOn & !userLogined" class="loginDiv" @mousedown="showLoginBox">
      <login-box @login="logIn" @signup="signUp" />
    </div>
    <div id="appBody" class="appBody">
      <router-view ref="mainPage" :user="user"></router-view>
    </div>
    <announcement-popup
      :announcement="announcement"
      :visible="announcementOpen"
      @close="announcementOpen = false"
    />
    <toast position="bottom-left" />
    <confirm-dialog />
  </div>
</template>

<script>
import axios from 'axios'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import AnnouncementPopup from '@/components/AnnouncementPopup.vue'
import GlobalTopbar from '@/components/GlobalTopbar.vue'
import loginBox from '@/components/LoginBox.vue'
import { userInstance as User } from '@/types/User'
import { ClearToken, GetApi, GetToken, SaveToken } from '@/utils' // 路径根据你的实际位置调整
import { endSession, GetAuthBase, syncSession } from '@/utils/auth'
const SEEN_KEY = 'moelink_seen_announcement'

export default {
  name: 'app',
  data() {
    return {
      debug: true,
      loginOn: false,
      serverOn: false,
      announcement: null,
      announcementOpen: false,
      announcementUnseen: false,
      announcementTimer: null,
      user: {
        userinfo: {},
        logined: false,
      },
    }
  },
  computed: {
    userLogined() {
      return this.user.logined
    },
  },
  created() {
    this.debug = process.env.NODE_ENV === 'development'
    this.checkServer()
  },
  mounted() {
    window.addEventListener('moelink:profile-updated', this.initLoginStatus)
    window.addEventListener('focus', this.syncSharedLogin)
    document.addEventListener('visibilitychange', this.syncSharedLogin)
    window.addEventListener('moelink:session-expired', this.removeUserInfo)
    this.consumeOAuthCallback()
    this.initLoginStatus()
    this.loadAnnouncement()
    this.announcementTimer = setInterval(this.loadAnnouncement, 5 * 60 * 1000)
  },
  beforeUnmount() {
    window.removeEventListener('moelink:profile-updated', this.initLoginStatus)
    window.removeEventListener('focus', this.syncSharedLogin)
    document.removeEventListener('visibilitychange', this.syncSharedLogin)
    window.removeEventListener('moelink:session-expired', this.removeUserInfo)
    clearInterval(this.announcementTimer)
  },
  watch: {
    // 从 admin 进入前台后也要补弹
    '$route.path'() {
      this.autoShowAnnouncement()
    },
  },
  methods: {
    consumeOAuthCallback() {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const loginDone = params.get('oauth_login') === 'success'
      const oauthError = params.get('oauth_error')
      if (!loginDone && !oauthError) return

      window.history.replaceState(
        null,
        document.title,
        window.location.pathname + window.location.search,
      )
      // 第三方登录成功后，会话 Cookie 已由 auth-service 下发，启动时的续期已经拿到 token
      if (loginDone) return

      const messages = {
        authorization_denied: '已取消第三方登录',
        invalid_state: '登录验证已过期，请重试',
        provider_failed: '第三方账号验证失败，请重试',
        account_failed: '账号登录失败，请联系管理员',
      }
      window.alert(messages[oauthError] || '第三方登录失败，请重试')
    },
    // ── 全局公告 ──
    async loadAnnouncement() {
      try {
        const res = await axios.get(GetApi('/announcement/current'))
        this.announcement = res.data?.announcement || null
      } catch (_err) {
        return
      }
      await this.$router.isReady()
      this.autoShowAnnouncement()
    },
    seenId() {
      try {
        return localStorage.getItem(SEEN_KEY)
      } catch (_err) {
        return null
      }
    },
    markAnnouncementSeen() {
      if (!this.announcement) return
      try {
        localStorage.setItem(SEEN_KEY, String(this.announcement.id))
      } catch (_err) {
        /* ignore */
      }
      this.announcementUnseen = false
    },
    autoShowAnnouncement() {
      const a = this.announcement
      this.announcementUnseen = !!a && this.seenId() !== String(a.id)
      if (!this.announcementUnseen || this.announcementOpen) return
      if (this.$route.path.startsWith('/admin')) return
      this.showAnnouncement()
    },
    showAnnouncement() {
      if (!this.announcement) return
      this.announcementOpen = true
      this.markAnnouncementSeen()
    },
    async checkServer() {
      try {
        const url = GetApi('/health')
        const response = await axios.get(url)
        // 兼容两种健康响应：true（旧约定）或 { status: 'ok' }（node-api 现行）
        this.serverOn =
          response.data === true ||
          (response.data && response.data.status === 'ok')
      } catch (err) {
        console.error(err)
        this.serverOn = false
      }
    },
    showLoginBox() {
      this.loginOn = !this.loginOn
      document.body.classList = [this.loginOn ? 'hideScroll' : '']
    },
    openUserPanel() {
      this.loginOn = false
      this.user.logined = true
      document.body.classList = [this.loginOn ? 'hideScroll' : '']
      window.dispatchEvent(new Event('moelink:auth-changed'))
    },
    // 回到本页时检查其他站（quiz）是否登录 / 登出过，变化则刷新登录状态
    async syncSharedLogin() {
      if (document.visibilityState === 'hidden') return
      if (!(await syncSession())) return
      await this.initLoginStatus()
      if (!GetToken() && this.$route.path === '/profile') this.$router.push('/')
    },
    async initLoginStatus() {
      // 无 token 时直接回到未登录态
      if (!GetToken()) {
        this.removeUserInfo()
        return
      }
      try {
        // 通过 Authorization 头检测会话是否仍有效
        const url = GetApi('/user/session')
        const response = await axios.post(
          url,
          {},
          {
            headers: { Authorization: `Bearer ${GetToken()}` },
          },
        )
        if (response.data?.userInfo) {
          this.user.userinfo = response.data.userInfo
          this.openUserPanel()
          // 同步全局 User（router 管理员守卫使用）
          User.Init(response.data.userInfo)
        } else {
          console.log(response.data)
          this.removeUserInfo()
        }
      } catch (_err) {
        // 需要重新登录
        this.removeUserInfo()
      }
    },
    async getUserInfo() {
      try {
        const url = GetApi('/user/info')
        const response = await axios.post(
          url,
          {},
          {
            headers: { Authorization: `Bearer ${GetToken()}` },
          },
        )
        if (response.data?.userInfo) {
          this.user.userinfo = response.data.userInfo
        }
      } catch (err) {
        console.error('获取用户信息失败', err)
      }
    },
    // 登录 / 注册直接请求 auth-service：它会下发 HttpOnly 会话 Cookie，并返回短期 access token
    async authenticate(path, formdata) {
      const response = await axios.post(
        `${GetAuthBase()}${path}`,
        { email: formdata.email, password: formdata.password, language: 'zh' },
        { withCredentials: true },
      )
      const token = response.data?.token
      if (!token) throw new Error('响应缺少 token')
      SaveToken(token)
      await this.initLoginStatus()
    },
    async logIn(formdata) {
      try {
        await this.authenticate('/auth/login', formdata)
        const page = this.$refs.mainPage
        if (page?.loginDone) page.loginDone()
      } catch (err) {
        console.error('登录失败', err)
        alert('登录失败：邮箱或密码错误')
      }
    },
    async signUp(formdata) {
      try {
        // 注册成功即自动登录，同一账号在 MoeLink 与原神问答通用
        await this.authenticate('/auth/register', formdata)
      } catch (err) {
        console.error('注册失败', err)
        alert('注册失败：该邮箱可能已被占用')
      }
    },
    async logOut() {
      await endSession()
      this.removeUserInfo()
      if (this.$route.path !== '/') this.$router.push('/')
    },
    removeUserInfo() {
      this.user.logined = false
      this.user.userinfo = {}
      ClearToken()
      User.Logout()
      window.dispatchEvent(new Event('moelink:auth-changed'))
    },
  },
  components: {
    AnnouncementPopup,
    loginBox,
    GlobalTopbar,
    Toast,
    ConfirmDialog,
  },
}
</script>

<style lang="scss">
#app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

// 顶栏固定，滚动条只出现在下方内容区
.appBody {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.loginDiv {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, .4);
  z-index: 1020;
}
</style>
