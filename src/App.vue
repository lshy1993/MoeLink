<template>
  <div id="app">
    <aside :class="['userSide', sideOn ? 'wide' : '']">
      <div class="hideBtn" @click="sideOn = !sideOn">
        <span>{{ sideOn ? "→" : "←" }}</span>
      </div>
      <div class="naviWrap">
        <div class="naviSection">
          <router-link class="naviLink" to="/">
            <div style="font-size: 24px;">MoeLink</div>
          </router-link>
          <div class="naviLine"></div>
          <router-link class="naviLink" to="/threads"><div>讨论区</div></router-link>
          <div class="naviLine"></div>
          <router-link class="naviLink" to="/blog"><div>博客</div></router-link>
          <div class="naviLine"></div>
          <router-link class="naviLink" to="/shop"><div>EC 商城</div></router-link>
        </div>
        <div class="naviSection">
          <a class="naviLink clickable" :href="quizUrl" target="_blank" rel="noopener"><div>测试站 ↗</div></a>
          <div class="naviLine"></div>
          <router-link class="naviLink" to="/alphasoul"><div>AlphaSoul</div></router-link>
          <div class="naviLine"></div>
          <router-link class="naviLink" to="/miao"><div>小屋</div></router-link>
        </div>
        <div class="naviSection" v-if="adminVisible">
          <router-link class="naviLink" to="/admin"><div>管理后台</div></router-link>
        </div>
        <div class="naviSection" style="margin-top: 30px">
          <div v-if="!userLogined">
            <div class="loginBtn" v-if="serverOn" @click="showLoginBox">登录 / 注册</div>
            <div class="loginBtn" v-else>服务器维护中</div>
          </div>
          <div v-if="userLogined">
            <div class="naviUser">
              <div class="naviUserNick">{{ user.userinfo.nickname || user.userinfo.email }}</div>
              <div class="naviUserMail">{{ user.userinfo.email }}</div>
            </div>
            <div class="naviLine"></div>
            <div class="loginBtn" @click="logOut">登出</div>
          </div>
        </div>
      </div>
    </aside>
    <div v-if="loginOn & !userLogined" class="loginDiv" @mousedown="showLoginBox">
      <login-box @login="logIn" @signup="signUp" />
    </div>
    <router-view ref="mainPage" :user="user"></router-view>
    <toast />
    <confirm-dialog />
  </div>
</template>

<script>
import axios from 'axios';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { GetApi, SaveToken, ClearToken, GetToken } from '@/utils'; // 路径根据你的实际位置调整
import { userInstance as User } from '@/types/User';
import loginBox from '@/components/LoginBox.vue';
export default {
  name: 'app',
  data() {
    return {
      debug: true,
      loginOn: false,
      sideOn: false,
      serverOn: false,
      quizUrl: import.meta.env.DEV ? 'http://localhost:3000'
        : (import.meta.env.VITE_QUIZ_URL || 'https://quiz.moelink.site'),
      user: {
        userinfo: {},
        logined: false
      }
    }
  },
  computed: {
    userLogined() {
      return this.user.logined;
    },
    adminVisible() {
      return this.user.userinfo && this.user.userinfo.group >= 100;
    },
  },
  created() {
    this.debug = process.env.NODE_ENV == 'development';
    this.checkServer();
  },
  mounted() {
    this.initLoginStatus();
  },
  methods: {
    async checkServer() {
      try {
        const url = GetApi('/health');
        const response = await axios.get(url);
        // 兼容两种健康响应：true（旧约定）或 { status: 'ok' }（node-api 现行）
        this.serverOn = response.data === true
          || (response.data && response.data.status === 'ok');
      } catch (err) {
        console.error(err);
        this.serverOn = false;
      }
    },
    showLoginBox() {
      this.loginOn = !this.loginOn;
      document.body.classList = [this.loginOn ? "hideScroll" : ""];
    },
    openUserPanel() {
      this.loginOn = false;
      this.user.logined = true;
      document.body.classList = [this.loginOn ? "hideScroll" : ""];
    },
    async initLoginStatus() {
      // 无 token 时直接回到未登录态
      if (!GetToken()) {
        this.removeUserInfo();
        return;
      }
      try {
        // 通过 Authorization 头检测会话是否仍有效
        const url = GetApi('/user/session')
        const response = await axios.post(url);
        if (response.data && response.data.userInfo) {
          this.user.userinfo = response.data.userInfo;
          this.openUserPanel();
          // 同步全局 User（router 管理员守卫使用）
          User.Init(response.data.userInfo);
        } else {
          console.log(response.data);
          this.removeUserInfo();
        }
      } catch (err) {
        // 需要重新登录
        this.removeUserInfo();
      }
    },
    async getUserInfo() {
      try {
        const url = GetApi('/user/info');
        const response = await axios.post(url);
        if (response.data && response.data.userInfo) {
          this.user.userinfo = response.data.userInfo;
        }
      } catch (err) {
        console.error('获取用户信息失败', err);
      }
    },
    async logIn(formdata) {
      try {
        const response = await axios.post(GetApi('/user/login'), {
          email: formdata.email,
          password: formdata.password
        });
        const { token, userInfo } = response.data;
        if (!token) throw new Error('登录响应缺少 token');
        this.user.userinfo = userInfo || {};
        User.Init(userInfo || {});
        this.openUserPanel();
        // 令牌与用户信息落本地（session 有效期由 JWT exp 决定）
        SaveToken(token);
        this.getUserInfo();
        const page = this.$refs.mainPage;
        if (page && page.loginDone) page.loginDone();
      } catch (err) {
        console.error('登录失败', err);
        alert('登录失败：邮箱或密码错误');
      }
    },
    async signUp(formdata) {
      try {
        const url = GetApi('/user/signup');
        const response = await axios.post(url, {
          email: formdata.email,
          password: formdata.password
        });
        const { token, userInfo } = response.data;
        if (!token) throw new Error('注册响应缺少 token');
        // 注册成功即自动登录，同一账号在 MoeLink 与测试站通用
        SaveToken(token);
        this.user.userinfo = userInfo || {};
        User.Init(userInfo || {});
        this.openUserPanel();
        this.getUserInfo();
      } catch (err) {
        console.error('注册失败', err);
        alert('注册失败：该邮箱可能已被占用');
      }
    },
    async logOut() {
      try {
        const url = GetApi('/user/logout');
        await axios.post(url);
      } catch (err) {
        console.error('登出失败', err);
      }
      this.removeUserInfo();
    },
    removeUserInfo() {
      this.user.logined = false;
      this.user.userinfo = {};
      ClearToken();
      User.Logout();
    }
  },
  components: {
    loginBox,
    Toast,
    ConfirmDialog
  }
}
</script>

<style lang="scss">
// .mainContent {
//     position: relative;
//     margin-right: 0px;
//     transition: all .3s;
//     z-index: 1000;
//     // min-height: 100%;

//     &.wide {
//         margin-right: 170px;
//     }
// }

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
