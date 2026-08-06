<template>
<div class="loginBox" @click.stop>
    <form class="loginForm" autocomplete="on" :model="loginData">
        <div class="inputLine">
            <label for="login-user">UserName</label>
            <input id="login-user" type="text" v-model="loginData.name" :placeholder="loginHint.user" autocomplete="on">
            <span class="errMsg">{{ loginErrMsg.user }}</span>
        </div>
        <div class="inputLine">
            <label for="login-pwd">PassWord</label>
            <input id="login-pwd" type="password" v-model="loginData.password" :placeholder="loginHint.pwd" autocomplete="on" @keyup.enter="handleLogin(loginData)">
            <span class="errMsg">{{ loginErrMsg.pwd }}</span>
        </div>
        <button type="button" class="btn-primary clickable" @click="handleLogin(loginData)">
            <span>登录</span>
        </button>
        <div class="tipLine">开发组账号为:editor 密码123456</div>
        <div class="tipLine">游客账号:guest 密码123456</div>
    </form>
</div>
</template>

<script>
export default {
    name: 'Login',
    data(){
        return {
            loginHint:{
                user: '用户名',
                pwd: '密码'
            },
            loginErrMsg: {
                user: '',
                pwd: ''
            },
            loginData:{
                name: '',
                password: ''
            }
        }
    },
    methods:{
        handleLogin: function(loginData){
            
            if(!loginData.name){
                this.loginErrMsg.user = "用户名不能为空";
            }
            if(!loginData.password){
                this.loginErrMsg.pwd = "请输入密码";
            }
            console.log(loginData);
            // 验证后emit回上级
            this.$emit('login',this.loginData);
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
    .tipLine {

    }
}
</style>
