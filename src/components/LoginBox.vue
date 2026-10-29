<template>
    <div class="loginBox" @click.stop @mousedown.stop>
        <form class="loginForm" autocomplete="on">
            <div class="inputLine">
                <label for="login-email">Email</label>
                <input id="login-email" type="email" v-model="email" :placeholder="loginHint.email" autocomplete="on"
                    @blur="checkUserOK()">
                <span class="errMsg">{{ loginErrMsg.email }}</span>
            </div>
            <div class="inputLine">
                <label for="login-pwd">PassWord</label>
                <input id="login-pwd" type="password" v-model="password" :placeholder="loginHint.pwd" autocomplete="on"
                    @keyup.enter="handleLogin()">
                <span class="errMsg">{{ loginErrMsg.pwd }}</span>
            </div>
            <button type="button" class="btn-primary clickable" @click="handleLogin()">
                <span>{{ email ? registerMode ? "注册" : "登录" : "注册 or 登录" }}</span>
            </button>
            <div class="tipLine">统一账号同时适用于 MoeLink 与原神问答</div>
            <div class="tipLine">首次使用？输入邮箱与密码后将自动进入注册</div>
        </form>
    </div>
</template>

<script>
/* eslint-disable */
import { GetApi } from '@/utils';
import axios from 'axios';

export default {
    name: 'LoginBox',
    data() {
        return {
            registerMode: false,
            loginHint: {
                email: '邮箱',
                pwd: '密码'
            },
            loginErrMsg: {
                email: '',
                pwd: ''
            },
            email: '',
            password: ''
        }
    },
    watch: {
        password() {
            this.checkPassword();
            //console.log('pwd changed');
        }
    },
    methods: {
        checkUserOK() {
            // 查询邮箱是否已被注册：已注册 => 登录模式，未注册 => 注册模式
            if (!this.email) return;
            let url = GetApi('/user/usercheck');
            axios.post(url, { email: this.email }).then((response) => {
                this.registerMode = !(response.data && response.data.exists);
            }, (err) => {
                console.log(err);
                this.registerMode = false;
            });
        },
        handleLogin: function () {
            if (this.checkEmail() && this.checkPassword()) {
                var loginData = {
                    email: this.email,
                    password: this.password
                }
                // 验证后将表单 emit 回上级
                if (this.registerMode) {
                    this.$emit('signup', loginData);
                } else {
                    this.$emit('login', loginData);
                }
            }
        },
        checkEmail() {
            // 检测邮箱是否合法
            this.loginErrMsg.email = '';
            if (!this.email) {
                this.loginErrMsg.email = "邮箱不能为空";
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
                this.loginErrMsg.email = "邮箱格式不正确";
                return false;
            }
            return true;
        },
        checkPassword() {
            // 登录模式不检测
            if (!this.registerMode) return true;
            // 检测密码是否合法
            this.loginErrMsg.pwd = '';
            if (!this.password) {
                this.loginErrMsg.pwd = "请输入密码";
                return false;
            }
            if (this.password.length < 6) {
                this.loginErrMsg.pwd = "密码长度过小";
                return false;
            }
            return true;
        }
    }
}
</script>

<style lang="scss">
.loginBox {
    padding: 10px 20px;
    background: white;
    text-align: center;

    .loginForm {
        width: 300px;
    }

    .inputLine {
        margin-top: 5px;
        margin-bottom: 25px;
        text-align: left;

        label {
            display: inline-block;
            margin-bottom: 5px;
        }

        input {
            display: block;
            width: 100%;
            height: 30px;
            //text-align: left;
        }
    }

    .btn-primary {
        color: #fff;
        background-color: #2d8cf0;
        border-color: #2d8cf0;
        font-size: 16px;
        font-weight: 500;
        border-radius: 4px;
        padding: 6px 12px;
        margin-bottom: 5px;

        &:hover {
            opacity: 0.90;
        }
    }

    button {
        display: inline-block;
        text-align: center;
        border: none;
        outline: 0;
        width: 100%;
        transition: all 0.2s;
    }

    .errMsg {
        position: absolute;
        color: red;
        margin: 0;
    }

    .tipLine {}
}
</style>
