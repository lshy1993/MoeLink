<template>
<div id="wfapp">
    <header class="naviTop clearfixbox">
        <div class="naviTitle">{{ title }}</div>
        <div class="topFunction">
            <!--router-link :to="'/download'" class="topFuncBtn">资源下载</router-link-->
            <div class="topFuncBtn">
                语言
                <select>
                    <option value="zh">简体中文</option>
                    <option value="jp">日本語</option>
                </select>
            </div>
        </div>
    </header>
    <aside class="naviSide">
        <router-link class="naviButton" v-for="(ele,key) in naviBtn" :key="key" append="true" :to="ele.to">
            <div class="naviButtonContent">
                <div class="naviImg small_icon">
                    <!--img :src="ele.url" /-->
                </div>
                <span class="naviTxt">{{ ele.txt }}</span>
            </div>
        </router-link>
    </aside>
    <div class="naviContent">
        <div id="mainBG" ref="mainbg"/>
        <audio ref="wfAudio" src="/static/worldflipper_title.mp3" loop="loop"/>
        <transition name="fade">
            <router-view style="height:auto;" @playAudio="playBGM" ></router-view>
        </transition>
    </div>
    
</div>
</template>

<script>
/* eslint-disable */
var appData = require('../../assets/wf.json');
export default {
    name: 'wfapp',
    data(){
        return{
            title: "WorldFlipper Wiki",
            audioPlaying: false,
            appData,
            naviBtn: this.Common.naviBtnWF,
        }
    },
    created(){
        document.title = this.title;
    },
    methods:{
        playBGM(){
            if(!this.audioPlaying){
                console.log('play');
                this.audioPlaying = true;
                this.$refs.wfAudio.play();
            }else{
                console.log('pause');
                this.audioPlaying = false;
                this.$refs.wfAudio.pause();
            }
            
        }
    }
}
</script>

<style lang="scss">
#wfapp {
    .naviTop{
        background: rgb(65,83,195);
    }

    #mainBG {
        background-image: url(../../assets/top_kv_bg.png);
    }

    // a.router-link-active.router-link-exact-active {
    //     color: white;
    // }

    .color-red{
        color: #a32535;
    }
    .color-green{
        color: #539722;
    }
    .color-blue{
        color: #2f60b2;
    }
    .color-yellow{
        color: #b29614;
    }
    .color-light{
        color: #abb283;
    }
    .color-dark{
        color: #3f2843;
    }

    .border-red{
        border-color: #a32535;
    }
    .border-green{
        border-color: #539722;
    }
    .border-blue{
        border-color: #2f60b2;
    }
    .border-yellow{
        border-color: #b29614;
    }
    .border-light{
        border-color: #abb283;
    }
    .border-dark{
        border-color: #3f2843;
    }
    
    .back-red{
        background-color: #a32535;
    }
    .back-green{
        background-color: #539722;
    }
    .back-blue{
        background-color: #2f60b2;
    }
    .back-yellow{
        background-color: #b29614;
    }
    .back-light{
        background-color: #abb283;
    }
    .back-dark{
        background-color: #3f2843;
    }

    // .fade-enter-active, .fade-leave-active {
    //     transition: opacity .5s ease-out;
    // }
    // .fade-enter, .fade-leave-to{
    //     opacity: 0;
    // }
}
</style>