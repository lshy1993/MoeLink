<template>
  <div id="app">
    <aside :class="['userSide', sideOn ? 'wide' : '']">
      <div class="hideBtn" @click="sideOn = !sideOn">
        <span>{{ sideOn ? "→" : "←" }}</span>
      </div>
      <div class="naviWrap">
        <div v-if="!userLogined">
          <div>登陆后可使用更多功能</div>
          <div class="naviLine"></div>
          <div v-if="serverOn" class="loginBtn" @click="showLoginBox">登录</div>
          <div v-if="!serverOn" class="loginBtn">服务器维护中</div>
        </div>
        <div v-if="userLogined">
          <div>头像 用户信息</div>
          <div class="naviLine"></div>
          <router-link class="naviLink" to="/">
            <div style="font-size: 24px;">MoeLink</div>
          </router-link>
          <div class="naviLine"></div>
          <div class="loginBtn" @click="logOut">Logout</div>
        </div>
      </div>
    </aside>
    <div v-if="loginOn & !userLogined" class="loginDiv" @mousedown="showLoginBox">
      <login-box @login="logIn" @signup="signUp" />
    </div>
    <router-view ref="mainPage" :user="user"></router-view>
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
import { GetApi, cryptPwd } from './utils'; // 路径根据你的实际位置调整
import loginBox from './components/LoginBox.vue';
export default {
  name: 'app',
  data() {
    return {
      debug: true,
      loginOn: false,
      sideOn: false,
      serverOn: false,
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
        const url = GetApi('/check');
        const response = await axios.get(url);
        console.log(response.data);
        this.serverOn = response.data === true;
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
      const validtime = localStorage.getItem("validtime");
      if (!validtime || moment().isAfter(validtime)) {
        // 不存在或超时 需要重新登录
        this.removeUserInfo();
        return;
      }
      try {
        // 在时间内 检测session状态
        const url = GetApi('/user/session')
        const response = await axios.post(url);
        if (response.data === 'valid') {
          // 直接设置已登录
          //console.log(response.data);
          this.openUserPanel();
        } else {
          console.log(response.data);
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
        console.log(response.data);
        // 设置用户信息
        // this.user = response.data;
      } catch (err) {
        console.error('获取用户信息失败', err);
      }
    },
    async logIn(formdata) {
      const loginform = {
        username: formdata.username,
        password: cryptPwd(formdata.password)
      }
      try {
        const response = await axios.post('api/user/login', loginform);
        this.loginDone();
      } catch (err) {
        this.loginError();
      }
    },
    loginDone() {
      // 将用户信息保存localstorage
      localStorage.setItem('validtime', moment().add(7, 'd').format());
      this.getUserInfo();
      this.openUserPanel();
      this.$refs.mainPage.loginDone();
    },
    loginError() {
      // 失败部分
      alert('密码错误');
    },
    async signUp(formdata) {
      const signupform = {
        username: formdata.username,
        password: cryptPwd(formdata.password)
      }
      try {
        const url = GetApi('/user/signup');
        const response = await axios.post(url, signupform);
        if (response.status !== 200) {
          throw new Error('注册失败');
        }
        this.closeLoginBox();
      } catch (err) {
        console.error('注册失败', err);
      }
    },
    async logOut() {
      try {
        const url = GetApi('/user/logout');
        const response = await axios.post(url);
      } catch (err) {
        console.error('登出失败', err);
      }
      this.removeUserInfo();
    },
    removeUserInfo() {
      this.user.logined = false;
      localStorage.removeItem('validtime');
      // localStorage.removeItem('user');
      // localStorage.removeItem('pwd');
    }
  },
  components: {
    loginBox
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
