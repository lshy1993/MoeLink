<template>
  <el-container class="adminLayout">
    <el-aside width="200px">
      <div class="adminTitle">MoeLink 管理</div>
      <el-menu router :default-active="$route.path" class="adminMenu">
        <el-menu-item index="/admin/users">
          <span>👤 用户一览</span>
        </el-menu-item>
        <el-menu-item index="/admin/blog">
          <span>📝 博客管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/shop">
          <span>🛒 EC 管理（开发中）</span>
        </el-menu-item>
      </el-menu>
      <div class="adminUser">
        <div>{{ User.info.nickname || User.info.email }}</div>
        <button @click="logOut">退出登录</button>
      </div>
    </el-aside>
    <el-main><router-view :user="user" /></el-main>
  </el-container>
</template>

<script>
import { userInstance as User } from '@/types/User';
import { ClearToken, GetToken } from '@/utils';
import axios from 'axios';
import { GetApi } from '@/utils';

export default {
  name: 'AdminLayout',
  props: ['user'],
  data() {
    return {
      User
    }
  },
  mounted() {
    // 会话失效（token 过期 / 非管理员）时回到首页
    if (!GetToken()) {
      this.$router.replace('/');
      return;
    }
    this.checkAdmin();
  },
  methods: {
    async checkAdmin() {
      try {
        await axios.get(GetApi('/admin/unified-users'), {
          headers: { Authorization: `Bearer ${GetToken()}` },
          params: { limit: 1 }
        });
      } catch (err) {
        const status = err.response && err.response.status;
        if (status === 401 || status === 403) {
          this.$router.replace('/');
        }
      }
    },
    async logOut() {
      try {
        await axios.post(GetApi('/user/logout'));
      } catch (err) { /* ignore */ }
      ClearToken();
      User.Logout();
      this.$router.replace('/');
    }
  }
}
</script>

<style lang="scss" scoped>
.adminLayout {
  min-height: 100vh;
}

.adminTitle {
  padding: 18px 16px 12px;
  font-size: 18px;
  font-weight: 700;
  color: #2c3e77;
}

.adminMenu {
  border-right: none;
}

.adminUser {
  margin-top: 30px;
  padding: 16px;
  font-size: 12px;
  color: #8892b8;

  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    margin-top: 8px;
    padding: 4px 12px;
    font-size: 12px;
    border: 1px solid #dcdfe6;
    background: white;
    border-radius: 4px;
    cursor: pointer;

    &:hover { color: #409eff; border-color: #409eff; }
  }
}
</style>
