<template>
    <div class="loginBox" @click.stop @mousedown.stop>
        <form class="loginForm" autocomplete="on">
            <div class="inputLine">
                <label for="login-user">UserName</label>
                <input id="login-user" type="text" v-model="username" :placeholder="loginHint.user" autocomplete="on"
                    @blur="checkUserOK()">
                <span class="errMsg">{{ loginErrMsg.user }}</span>
            </div>
            <div class="inputLine">
                <label for="login-pwd">PassWord</label>
                <input id="login-pwd" type="password" v-model="password" :placeholder="loginHint.pwd" autocomplete="on"
                    @keyup.enter="handleLogin()">
                <span class="errMsg">{{ loginErrMsg.pwd }}</span>
            </div>
            <button type="button" class="btn-primary clickable" @click="handleLogin()">
                <span>{{ username ? registerMode ? "注册" : "登录" : "注册 or 登录" }}</span>
            </button>
            <div class="tipLine">开发组账号为:editor 密码123456</div>
            <div class="tipLine">游客账号:guest 密码123456</div>
        </form>
    </div>
</template>

<script>
/* eslint-disable */
export default {
    name: 'LoginBox',
    data() {
        return {
            registerMode: false,
            loginHint: {
                user: '用户名',
                pwd: '密码'
            },
            loginErrMsg: {
                user: '',
                pwd: ''
            },
            username: '',
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
            // 查询是否已经被注册
            var data = { username: this.username };
            let url = this.Func.GetApi('/user/usercheck');
            this.$http.post(url, data).then((response) => {
                this.registerMode = response.data;
            }, (err) => {
                console.log(err);
                this.registerMode = false;
            });
        },
        handleLogin: function () {
            if (this.checkUsername() && this.checkPassword()) {
                var loginData = {
                    username: this.username,
                    password: this.password
                }
                //console.log(loginData);
                // 验证后将表单 emit 回上级
                if (this.registerMode) {
                    this.$emit('signup', loginData);
                } else {
                    this.$emit('login', loginData);
                }
            }
        },
        checkUsername() {
            // 检测用户名是否合法
            if (!this.username) {
                this.loginErrMsg.user = "用户名不能为空";
                return false;
            }
            if (this.username.length < 5) {
                this.loginErrMsg.pwd = "用户名长度过小";
                return false;
            }
            this.loginErrMsg.user = "";
            return true;
        },
        checkPassword() {
            // 登录模式不检测
            if (!this.registerMode) return true;
            // 检测密码是否合法
            if (!this.password) {
                this.loginErrMsg.pwd = "请输入密码";
                return false;
            }
            if (this.password.length < 6) {
                this.loginErrMsg.pwd = "密码长度过小";
                return false;
            }
            this.loginErrMsg.pwd = "";
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
