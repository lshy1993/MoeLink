<template>
<div class="fullScreen">
    <div v-if="false">
        <span>设置服务器地址：</span>
        <input v-model="debugip" type="textbox"/>
        <span>UID</span>
        <input v-model="userid" type="textbox"/>
        <button @click="UploadSaveDev">上传存档</button>
        <button @click="DownloadSaveDev">读取存档</button>
    </div>
    <iframe ref="iframe" frameborder="no" border="0" marginwidth="0"
    marginheight="0" scrolling="no" width="100%" height="100%" :src="evolvegit"></iframe>
</div>
</template>

<script>
/* eslint-disable */
export default {
    name: 'Evolve',
    props: ['user'],
    data(){
        return {
            debug: false,
            debugip: 'http://126.62.77.31:3000',
            userid: 1,
            evolvegit: '/Evolve/',
            evolveWin: Object
        }
    },
    computed:{
        userLogined(){
            return this.User.logined;
        },
    },
    mounted(){
        this.debug = process.env.NODE_ENV == 'development';
        // 从服务器获取覆盖
        // this.evolveWin = this.$refs.iframe.contentWindow;
        // this.GetRemoteSave();
        this.$refs.iframe.contentWindow.onload = (event) => {
            console.log('iframe loaded');
            this.GetRemoteSave();
        };
    },
    destroyed() {
        this.UploadGame();
    },
    methods:{
        loginDone(){
            this.GetRemoteSave();
        },
        GetRemoteSave(){
            //var post = this.Func.GetPostObject('/evolve/',{});
            if(!this.userLogined){
                console.log('not login');
                return;
            }
            // 获取存档
            var _this = this;
            let url = this.Func.GetApi('/user/evolve')
            this.$http.get(url).then((response)=>{
                var save = response.data;
                if(save === false){

                }else{
                    //console.log(save);
                    _this.LoadGame(save.result);
                }
            },(err)=>{
                // 未授权 需要登录
                console.log(err);
            });
        },
        LoadGame(savestr){
            console.log('set savefile to game');
            localStorage.setItem('evolved',savestr);
            this.$refs.iframe.contentWindow.location.reload();
        },
        UploadGame(){
            // 读取存档后上传
            var save = localStorage.getItem('evolved');
            if(this.userLogined){
                console.log('uploading');
                let url = this.Func.GetApi('/user/evolve/upload');
                this.$http.post(url, { savedata: save } ).then((response)=>{
                    console.log(response.data);
                },(err)=>{
                    // 未授权 需要登录
                    console.log(err);
                });
            }
        },
        UploadSaveDev(){
            console.log('uploading');
            var save = localStorage.getItem('evolved');
            var post = this.Func.GetPostObject(this.debugip+"/evolve/upload", { user: this.userid, savedata: save });
            this.$http(post).then((response)=>{
                console.log(response.data);
                console.log('upload done');
            },(err)=>{
                // 未授权 需要登录
                console.log(err);
            });
        },
        DownloadSaveDev(){
            var _this = this;
            var get = this.Func.GetGetObject(this.debugip+"/evolve", this.userid);
            this.$http(get).then((response)=>{
                var save = response.data;
                if(save === false){

                }else{
                    //console.log(save);
                    _this.LoadGame(save.result);
                }
            },(err)=>{
                // 未授权 需要登录
                console.log(err);
            });
        }
    },
    components:{
    }
}
</script>

<style lang="scss">

</style>