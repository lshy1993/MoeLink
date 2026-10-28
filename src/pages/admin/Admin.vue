<template>
  <div class="adminLayout">
    <aside class="adminAside">
      <div class="adminTitle">MoeLink 管理</div>
      <nav class="adminMenu">
        <router-link to="/admin/users" class="adminLink" :class="{ active: $route.path.indexOf('/admin/users') === 0 }">
          <span>👤 用户一览</span>
        </router-link>
        <router-link to="/admin/blog" class="adminLink" :class="{ active: $route.path.indexOf('/admin/blog') === 0 }">
          <span>📝 博客管理</span>
        </router-link>
        <router-link to="/admin/miao" class="adminLink" :class="{ active: $route.path.indexOf('/admin/miao') === 0 }">
          <span>🏠 小屋管理</span>
        </router-link>
        <router-link to="/admin/threads" class="adminLink" :class="{ active: $route.path.indexOf('/admin/threads') === 0 }">
          <span>💬 讨论区管理</span>
        </router-link>
        <router-link to="/admin/moecoin" class="adminLink" :class="{ active: $route.path.indexOf('/admin/moecoin') === 0 }">
          <span>🪙 MoeCoin 管理</span>
        </router-link>
        <router-link to="/admin/shop" class="adminLink" :class="{ active: $route.path === '/admin/shop' }">
          <span>🛒 EC 管理</span>
        </router-link>
        <router-link to="/admin/shop/group-buys" class="adminLink" :class="{ active: $route.path.indexOf('/admin/shop/group-buys') === 0 }">
          <span>👥 拼团审核</span>
        </router-link>
        <router-link to="/admin/announcements" class="adminLink" :class="{ active: $route.path.indexOf('/admin/announcements') === 0 }">
          <span>📢 全局公告</span>
        </router-link>
      </nav>
      <div class="adminUser">
        <div>{{ User.info.nickname || User.info.email }}</div>
        <Button label="退出登录" size="small" severity="secondary" text @click="logOut" />
      </div>
    </aside>
    <main class="adminMain">
      <router-view :user="user" />
    </main>
  </div>
</template>

<script>
import axios from 'axios'
import Button from 'primevue/button'
import { userInstance as User } from '@/types/User'
import { ClearToken, GetApi, GetToken } from '@/utils'

export default {
  name: 'AdminLayout',
  props: ['user'],
  components: {
    Button,
  },
  data() {
    return {
      User,
    }
  },
  mounted() {
    // 会话失效（token 过期 / 非管理员）时回到首页
    if (!GetToken()) {
      this.$router.replace('/')
      return
    }
    this.checkAdmin()
  },
  methods: {
    async checkAdmin() {
      try {
        await axios.get(GetApi('/admin/unified-users'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
          params: { limit: 1 },
        })
      } catch (err) {
        const status = err.response?.status
        if (status === 401 || status === 403) {
          this.$router.replace('/')
        }
      }
    },
    async logOut() {
      try {
        await axios.post(GetApi('/user/logout'))
      } catch (_err) {
        /* ignore */
      }
      ClearToken()
      User.Logout()
      this.$router.replace('/')
    },
  },
}
</script>

<style lang="scss" scoped>
.adminLayout {
  display: flex;
  min-height: 100vh;
}

.adminAside {
  width: 200px;
  flex-shrink: 0;
  background: #f7f8fc;
  border-right: 1px solid #e6e9f5;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
}

.adminTitle {
  padding: 8px 12px 14px;
  font-size: 17px;
  font-weight: 700;
  color: #2c3e77;
}

.adminMenu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.adminLink {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: #45507a;
  text-decoration: none;
  font-size: 14px;
  transition: background .15s;

  &:hover {
    background: #eceffb;
  }

  &.active {
    background: #dde6ff;
    color: #2c3e99;
    font-weight: 600;
  }
}

.adminUser {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid #e6e9f5;
  font-size: 12px;
  color: #8892b8;

  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 8px;
  }
}

.adminMain {
  flex: 1;
  padding: 22px 26px;
  min-width: 0;
}

@media (max-width: 720px) {
  .adminLayout { flex-direction: column; }
  .adminAside { width: 100%; flex-direction: row; align-items: center; gap: 10px; }
  .adminMenu { flex-direction: row; flex: 1; }
  .adminUser { margin-top: 0; padding: 4px; border-top: none; }
  .adminUser button { width: auto; }
}
</style>
