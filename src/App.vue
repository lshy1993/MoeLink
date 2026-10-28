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
    <router-view ref="mainPage" :user="user"></router-view>
    <announcement-popup
      :announcement="announcement"
      :visible="announcementOpen"
      @close="announcementOpen = false"
    />
    <toast />
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
    this.initLoginStatus()
    this.loadAnnouncement()
    this.announcementTimer = setInterval(this.loadAnnouncement, 5 * 60 * 1000)
  },
  beforeUnmount() {
    clearInterval(this.announcementTimer)
  },
  watch: {
    // 从 admin 进入前台后也要补弹
    '$route.path'() {
      this.autoShowAnnouncement()
    },
  },
  methods: {
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
    async logIn(formdata) {
      try {
        const response = await axios.post(GetApi('/user/login'), {
          email: formdata.email,
          password: formdata.password,
        })
        const { token, userInfo } = response.data
        if (!token) throw new Error('登录响应缺少 token')
        this.user.userinfo = userInfo || {}
        User.Init(userInfo || {})
        this.openUserPanel()
        // 令牌与用户信息落本地（session 有效期由 JWT exp 决定）
        SaveToken(token)
        this.getUserInfo()
        const page = this.$refs.mainPage
        if (page?.loginDone) page.loginDone()
      } catch (err) {
        console.error('登录失败', err)
        alert('登录失败：邮箱或密码错误')
      }
    },
    async signUp(formdata) {
      try {
        const url = GetApi('/user/signup')
        const response = await axios.post(url, {
          email: formdata.email,
          password: formdata.password,
        })
        const { token, userInfo } = response.data
        if (!token) throw new Error('注册响应缺少 token')
        // 注册成功即自动登录，同一账号在 MoeLink 与测试站通用
        SaveToken(token)
        this.user.userinfo = userInfo || {}
        User.Init(userInfo || {})
        this.openUserPanel()
        this.getUserInfo()
      } catch (err) {
        console.error('注册失败', err)
        alert('注册失败：该邮箱可能已被占用')
      }
    },
    async logOut() {
      try {
        const url = GetApi('/user/logout')
        await axios.post(url)
      } catch (err) {
        console.error('登出失败', err)
      }
      this.removeUserInfo()
    },
    removeUserInfo() {
      this.user.logined = false
      this.user.userinfo = {}
      ClearToken()
      User.Logout()
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
