<template>
<div id="wfapp">
    <header class="naviTop clearfixbox">
        <div class="naviTitle">WorldFlipper Wiki</div>
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
        <router-link class="naviButton" v-for="(ele,key) in naviBtn" :key="key" :to="ele.to">
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
            audioPlaying: false,
            appData,
            naviBtn: this.Common.naviBtn,
        }
    },
    created(){
        document.title = "WorldFlipperWiki";
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
        position: fixed;
        top: 0;
        width: 100%;
        height: 50px;
        background: rgb(65,83,195);
        z-index: 1010;
        box-shadow: 0 1px 5px rgba(0,0,0,.2), 0 2px 2px rgba(0,0,0,.14), 0 3px 1px -2px rgba(0,0,0,.12);
        user-select: none;

        .naviTitle {
            position: fixed;
            width: 240px;
            color: white;
            line-height: 50px;
            font-size: 20px;
            font-weight: 700;
            text-align: center;
        }

        .topFunction {
            position: relative;
            text-align: right;
            height: 50px;
            width: auto;
            line-height: 50px;
            //padding-left: 15px;
            //margin-left: 240px;

            .topFuncBtn {
                cursor: pointer;
                display: inline-block;
                padding-left: 10px;
                padding-right: 10px;
            }
            #optionBox {
                display: inline-block;
                //position: absolute;
                //right: 10px;
            }
        }
        .thumb {
            width: 320px;
            height: 180px;
            background-size: 320px 180px;
        }

        .thumbframe {
            cursor: default;
            position: fixed;
            text-align: center;
            background: #2e3243;
        }

    }
    .naviSide {
        position: fixed;
        top: 50px;
        width: 12.5%;
        min-width: 72px;
        height: 100%;
        overflow: hidden;
        background: white;
        z-index: 1009;
        box-shadow: 1px 0 5px rgba(0,0,0,.2), 2px 0 2px rgba(0,0,0,.14), 3px 0 1px 2px rgba(0,0,0,.12);

        .naviButton {
            position: relative;
            display: block;
            padding: 10px 20px;
            font-weight: 400;
            text-transform: none;
            transition: background-color .2s;

            &:hover {
                background: #fed;
            }

            .naviButtonContent {
                display: inline-block;
                
                .naviImg{
                    position: absolute;
                    top: 0;
                }
                .naviTxt {
                    margin: auto;
                }
            }

        }
    }

    #mainBG {
        background-image: url(../../assets/top_kv_bg.png);
        background-size: cover;
        //background-position: left top;
        background-repeat: no-repeat;
        position: fixed;
        z-index: -1;
        top: 50px;
        left: 0;
        right: 0;
        bottom: 0;
        transition: all 2s ease-in-out;
        
    }

    .naviContent {
        //margin-left: 240px;
        margin-left: 12.5%;
        padding-top: 50px;
        transition: all .3s;
        z-index: 1000;
    }

    .flexcontainer {
        display: flex;
        flex-wrap: wrap;
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

    .fade-enter-active, .fade-leave-active {
        transition: opacity .5s ease-out;
    }
    .fade-enter, .fade-leave-to{
        opacity: 0;
    }
}
</style>