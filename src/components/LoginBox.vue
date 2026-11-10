<template>
    <div class="loginBox" @click.stop @mousedown.stop>
        <form class="loginForm" autocomplete="on">
            <div class="inputLine">
                <label for="login-email">Email</label>
                <InputText
                    id="login-email"
                    v-model="email"
                    type="email"
                    fluid
                    :placeholder="loginHint.email"
                    autocomplete="email"
                    @blur="checkUserOK()"
                />
                <span class="errMsg">{{ loginErrMsg.email }}</span>
            </div>
            <div class="inputLine">
                <label for="login-pwd">PassWord</label>
                <InputText
                    id="login-pwd"
                    v-model="password"
                    type="password"
                    fluid
                    :placeholder="loginHint.pwd"
                    :autocomplete="registerMode ? 'new-password' : 'current-password'"
                    @keyup.enter="handleLogin()"
                />
                <span class="errMsg">{{ loginErrMsg.pwd }}</span>
            </div>
            <div v-if="serverError" class="serverError">{{ serverError }}</div>
            <button type="button" class="btn-primary clickable" @click="handleLogin()">
                <span>{{ email ? registerMode ? "注册" : "登录" : "注册 or 登录" }}</span>
            </button>
            <div class="oauthOptions">
                <span class="oauthDivider">或使用第三方账号</span>
                <Button
                    type="button"
                    class="oauthButton"
                    icon="pi pi-google"
                    label="使用 Google 登录"
                    severity="secondary"
                    outlined
                    @click="startOAuth('google')"
                />
                <Button
                    type="button"
                    class="oauthButton"
                    icon="pi pi-github"
                    label="使用 GitHub 登录"
                    severity="secondary"
                    outlined
                    @click="startOAuth('github')"
                />
            </div>
        </form>
    </div>
</template>

<script>
/* eslint-disable */
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { GetApi } from '@/utils';
import axios from 'axios';

export default {
    name: 'LoginBox',
    components: { Button, InputText },
    props: {
        serverError: { type: String, default: '' },
    },
    emits: ['login', 'signup', 'clear-error'],
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
        email() {
            this.$emit('clear-error');
        },
        password() {
            this.checkPassword();
            this.$emit('clear-error');
        }
    },
    methods: {
        startOAuth(provider) {
            const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
            // /auth/* 由独立 auth-service 提供，gateway 直接按前缀转发
            const base = isLocal ? 'http://localhost:8000' : 'https://api.moelink.site';
            const returnTo = window.location.origin + window.location.pathname;
            window.location.assign(
                `${base}/auth/oauth/${provider}?return_to=${encodeURIComponent(returnTo)}`
            );
        },
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
            box-sizing: border-box;
            display: block;
            width: 100%;
            height: 40px;
        }
    }

    .oauthOptions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
    }

    .oauthDivider {
        color: #777;
        font-size: 13px;
    }

    .serverError {
        margin: -10px 0 12px;
        color: #d93025;
        font-size: 13px;
        line-height: 1.4;
        text-align: left;
    }

    .btn-primary,
    .oauthButton.p-button {
        box-sizing: border-box;
        width: 100%;
        height: 40px;
        padding: 0 12px;
        font-size: 16px;
        font-weight: 500;
        border-radius: 4px;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background-color: #2d8cf0;
        border-color: #2d8cf0;
        margin-bottom: 5px;

        &:hover {
            opacity: 0.90;
        }
    }

    .oauthButton.p-button {
        justify-content: center;
        background: #f0f2f5;
        border-color: #d0d5dd;
        color: #333;
    }

    .oauthButton.p-button:hover {
        background: #e4e7ec;
        border-color: #c2c8d2;
        color: #333;
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
}
</style>
