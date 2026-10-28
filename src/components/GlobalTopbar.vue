<template>
  <header class="globalTopbar">
    <div class="topbarInner">
      <router-link class="brand" to="/">
        <span class="brandDot"></span>MoeLink
      </router-link>

      <!-- 桌面端主导航 -->
      <nav class="navDesktop">
        <router-link v-for="item in mainNav" :key="item.to" class="navLink" :to="item.to">
          {{ item.label }}
        </router-link>
        <a class="navLink" :href="quizUrl" target="_blank" rel="noopener">测试站 ↗</a>
      </nav>

      <div class="topbarRight">
        <!-- 未登录 -->
        <template v-if="!logined">
          <button v-if="serverOn" class="loginBtn" @click="$emit('show-login')">登录 / 注册</button>
          <span v-else class="serverDown"><i class="pi pi-wrench"></i>维护中</span>
        </template>

        <!-- 已登录：余额徽章 + 头像下拉菜单 -->
        <template v-else>
          <router-link to="/wallet" class="coinChip" title="MoeCoin 钱包">
            <i class="pi pi-wallet"></i>{{ formatCoin(wallet.balance) }}
          </router-link>
          <button ref="userMenuBtn" class="userTrigger" @click="toggleUserMenu">
            <Avatar :image="avatarUrl" shape="circle" class="userAvatar" />
            <span class="userNick">{{ displayName }}</span>
            <i class="pi pi-angle-down caret"></i>
          </button>
          <Menu ref="userMenu" :model="userMenuItems" popup class="userMenu">
            <template #start>
              <div class="menuHead">
                <div class="menuNick">{{ displayName }}</div>
                <div class="menuMail">{{ email }}</div>
                <div class="menuCoin">
                  <i class="pi pi-wallet"></i>{{ formatCoin(wallet.balance) }} MoeCoin
                </div>
              </div>
            </template>
          </Menu>
        </template>

        <!-- 移动端汉堡按钮 -->
        <button class="burger" aria-label="菜单" @click="mobileOpen = !mobileOpen">
          <i :class="mobileOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
        </button>
      </div>
    </div>

    <!-- 移动端下拉导航 -->
    <transition name="dropDown">
      <nav v-if="mobileOpen" class="navMobile" @click="mobileOpen = false">
        <router-link v-for="item in mainNav" :key="item.to" class="mLink" :to="item.to">
          {{ item.label }}
        </router-link>
        <a class="mLink" :href="quizUrl" target="_blank" rel="noopener">测试站 ↗</a>
        <router-link v-if="logined" class="mLink" to="/wallet">💰 我的钱包（{{ formatCoin(wallet.balance) }}）</router-link>
        <router-link v-if="adminVisible" class="mLink admin" to="/admin">管理后台</router-link>
        <button v-if="!logined" class="mLogin" :disabled="!serverOn" @click.stop="$emit('show-login')">
          {{ serverOn ? '登录 / 注册' : '服务器维护中' }}
        </button>
        <button v-else class="mLogin logout" @click.stop="$emit('logout')">登出</button>
      </nav>
    </transition>
  </header>
</template>

<script>
import axios from 'axios'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import { useToast } from 'primevue/usetoast'
import { formatCoin } from '@/pages/wallet/shared'
import { GetApi, GetToken, md5 } from '@/utils'

export default {
  name: 'GlobalTopbar',
  components: { Avatar, Menu },
  setup() {
    return { toast: useToast() }
  },
  props: {
    user: { type: Object, required: true },
    serverOn: { type: Boolean, default: false },
  },
  emits: ['show-login', 'logout'],
  data() {
    return {
      mobileOpen: false,
      checkingIn: false,
      wallet: {
        balance: 0,
        checked_today: false,
        last_streak: 0,
      },
      quizUrl: import.meta.env.DEV
        ? 'http://localhost:3000'
        : import.meta.env.VITE_QUIZ_URL || 'https://quiz.moelink.site',
      mainNav: [
        { to: '/threads', label: '讨论区' },
        { to: '/blog', label: '博客' },
        { to: '/shop', label: 'EC 商城' },
        { to: '/alphasoul', label: 'AlphaSoul' },
        { to: '/miao', label: '小屋' },
      ],
    }
  },
  computed: {
    logined() {
      return !!this.user.logined
    },
    userinfo() {
      return this.user.userinfo || {}
    },
    displayName() {
      return this.userinfo.nickname || this.userinfo.email || '用户'
    },
    email() {
      return this.userinfo.email || ''
    },
    adminVisible() {
      return Number(this.userinfo.group) >= 100
    },
    avatarUrl() {
      if (!this.email) {
        return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
      }
      return `https://www.gravatar.com/avatar/${md5(this.email)}`
    },
    userMenuItems() {
      const items = []
      items.push({
        label: this.wallet.checked_today ? '今日已签到' : '每日签到',
        icon: 'pi pi-calendar-plus',
        disabled: this.wallet.checked_today || this.checkingIn,
        command: () => this.doCheckin(),
      })
      items.push({
        label: '我的钱包',
        icon: 'pi pi-wallet',
        command: () => this.$router.push('/wallet'),
      })
      if (this.adminVisible) {
        items.push({ separator: true })
        items.push({
          label: '管理后台',
          icon: 'pi pi-cog',
          command: () => this.$router.push('/admin'),
        })
      }
      items.push({ separator: true })
      items.push({
        label: '登出',
        icon: 'pi pi-sign-out',
        command: () => this.$emit('logout'),
      })
      return items
    },
  },
  mounted() {
    if (this.logined) this.fetchWallet()
  },
  methods: {
    formatCoin,
    toggleUserMenu(event) {
      this.$refs.userMenu.toggle(event)
    },
    headers() {
      return { Authorization: `Bearer ${GetToken()}` }
    },
    async fetchWallet() {
      try {
        const res = await axios.get(GetApi('/mocoin/wallet'), {
          headers: this.headers(),
        })
        this.wallet = {
          balance: res.data.balance || 0,
          checked_today: !!res.data.checked_today,
          last_streak: res.data.last_streak || 0,
        }
      } catch (_err) {
        /* 静默：topbar 不为钱包加载失败打扰用户 */
      }
    },
    async doCheckin() {
      if (this.checkingIn || this.wallet.checked_today) return
      this.checkingIn = true
      try {
        const res = await axios.post(
          GetApi('/mocoin/checkin'),
          {},
          { headers: this.headers() },
        )
        const { reward, streak, balance } = res.data
        this.toast.add({
          severity: 'success',
          summary: `签到成功 +${reward} MoeCoin`,
          detail: `已连续签到 ${streak} 天`,
          life: 3000,
        })
        this.wallet.balance = balance
        this.wallet.checked_today = true
        this.wallet.last_streak = streak
      } catch (err) {
        if (err.response && err.response.status === 409) {
          this.wallet.checked_today = true
          this.toast.add({
            severity: 'info',
            summary: '今天已经签到过了',
            life: 3000,
          })
        } else {
          const msg = err.response?.data?.error || '签到失败'
          this.toast.add({
            severity: 'error',
            summary: '签到失败',
            detail: msg,
            life: 3000,
          })
        }
      }
      this.checkingIn = false
    },
  },
  watch: {
    // 路由变化时收起移动端菜单
    $route() {
      this.mobileOpen = false
    },
    logined(val) {
      if (val) this.fetchWallet()
      else this.wallet = { balance: 0, checked_today: false, last_streak: 0 }
    },
  },
}
</script>

<style lang="scss" scoped>
.globalTopbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(14px) saturate(1.4);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  box-shadow: 0 2px 12px rgba(30, 40, 90, 0.08);
}

.topbarInner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 58px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #2c3e77;
  text-decoration: none;
  flex-shrink: 0;

  .brandDot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: linear-gradient(135deg, #4a6fe3, #7c5fe3);
    display: inline-block;
  }
}

.navDesktop {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.navLink {
  padding: 7px 13px;
  border-radius: 8px;
  font-size: 14px;
  color: #56608a;
  text-decoration: none;
  white-space: nowrap;
  transition: background .15s, color .15s;

  &:hover {
    background: #eef2ff;
    color: #2c3e77;
  }

  &.router-link-active {
    background: #e3ebff;
    color: #2c53c9;
    font-weight: 600;
  }
}

.topbarRight {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.coinChip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef3ff, #f3edff);
  border: 1px solid #dfe6f8;
  color: #2c53c9;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: transform .15s, box-shadow .15s;

  i {
    font-size: 13px;
    color: #7c5fe3;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(30, 40, 90, 0.12);
  }
}

.loginBtn {
  padding: 7px 16px;
  border: none;
  border-radius: 8px;
  background: #4a6fe3;
  color: #fff;
  font-size: 13.5px;
  cursor: pointer;
  transition: background .15s;

  &:hover {
    background: #2c53c9;
  }
}

.serverDown {
  font-size: 12.5px;
  color: #b0885a;
  background: #fdf3e5;
  border-radius: 8px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  i { font-size: 12px; }
}

.userTrigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  border: 1px solid #e3e9f8;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;

  &:hover {
    border-color: #b9c8f2;
    box-shadow: 0 2px 8px rgba(30, 40, 90, 0.1);
  }

  .userNick {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13.5px;
    color: #2c3e77;
    font-weight: 600;
  }

  .caret {
    font-size: 11px;
    color: #9aa2c5;
  }
}

.burger {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #2c3e77;
  font-size: 17px;
  cursor: pointer;

  &:hover { background: #eef2ff; }
}

// 移动端下拉导航
.navMobile {
  display: none;
  flex-direction: column;
  padding: 8px 14px 14px;
  border-top: 1px solid #edf0fa;
  background: rgba(255, 255, 255, 0.98);
}

.mLink {
  padding: 11px 12px;
  border-radius: 8px;
  font-size: 14.5px;
  color: #45507a;
  text-decoration: none;

  &:hover { background: #eef2ff; }

  &.router-link-active {
    color: #2c53c9;
    font-weight: 600;
    background: #e3ebff;
  }

  &.admin { color: #7c5fe3; }
}

.mLogin {
  margin-top: 8px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #4a6fe3;
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    background: #b9c2dd;
    cursor: not-allowed;
  }

  &.logout { background: #eef2ff; color: #d64c4c; }
}

.dropDown-enter-active,
.dropDown-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}

.dropDown-enter-from,
.dropDown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 860px) {
  .navDesktop { display: none; }
  .burger { display: inline-flex; align-items: center; justify-content: center; }
  .navMobile { display: flex; }
}

@media (max-width: 480px) {
  .userTrigger .userNick { display: none; }
  .coinChip { padding: 6px 9px; font-size: 12px; }
}
</style>

<style lang="scss">
// 头像下拉菜单头部（Menu 渲染在 body 下，需全局样式）
.userMenu .menuHead {
  padding: 10px 14px 8px;
  border-bottom: 1px solid #edf0fa;
  margin-bottom: 4px;

  .menuNick {
    font-size: 14px;
    font-weight: 600;
    color: #2c3e77;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menuMail {
    font-size: 12px;
    color: #9aa2c5;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menuCoin {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 4px 10px;
    border-radius: 14px;
    background: linear-gradient(135deg, #eef3ff, #f3edff);
    color: #2c53c9;
    font-size: 12.5px;
    font-weight: 700;

    i {
      font-size: 12px;
      color: #7c5fe3;
    }
  }
}
</style>
