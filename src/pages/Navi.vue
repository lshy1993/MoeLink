<template>
<div id="naviContent">
    <div id="bg">
        <img src="../assets/wallhaven-wy31gr.png" />
    </div>
    <div v-if="false" id="countDownBox">
        <div id="barFore" :style="barvalue"></div>
        <span>倒计时{{  parseInt(30-ttime/1000) }}后自动进入moelink</span>
    </div>
    <div id="mainContent">
        <div id="logoBox">
            <div id="logo">
                <router-link to="/home" >MoeLink</router-link>
            </div>
            <div id="underline" class="lineBox floatBox"></div>
        </div>
        <div id="metroBox">
            <router-link v-for="(link,index) in navis" :key="index" :to="link.url">
                <div class="itemBox noselect rect200">
                    <div class="boxBackground">{{link.img}}</div>
                    <div class="title">{{link.text}}</div>
                    <div class="hidden">{{link.subtext}}</div>
                </div>
            </router-link>
        </div>
        <div id="footerBox">
            <a v-for="(link, index) in sflink" :key="index" :href="link.url">
                <div class="circleBox noselect" :to="link.url">
                    <div class="title">{{link.text}}</div>
                </div>
            </a>
        </div>
    </div>
    <div v-show="!hideComment" id="danmakuBox">
        <div v-for="(danmaku,index) in danmakuList" :key="index" :id="'dan'+index" class="danmaku">
            {{ danmaku }}
        </div>
    </div>
    <div id="danmakuBtn">
        <button @click="hideComment = !hideComment">{{ hideComment?'显示':'隐藏'}}</button>
        <div>发送弹幕</div>
        <input :disabled="!userLogined" v-model="textcomment" type="textbox" :placeholder="commentMsg" />
        <button :disabled="!userLogined" @click="sendComment">发送</button>
    </div>
    <audio id="myAudio" :src="music.src" loop="loop" autoplay="none"/>
    <foot-player :music="music" :audioStatus="aStatus"/>    
</div>
</template>

<script>
/* eslint-disable */
import footPlayer from '../components/FootPlayer';
export default {
    name: 'NaviPage',
    props: ['user'],
    data(){
        return {
            ttime: 0,
            jumpsec: 30,
            danmakutimer: Object,
            textcomment: '',
            navis: this.Common.topBoxList,
            sflink: this.Common.sideJumpList,
            danmakuList: this.Common.testList,
            danmakuObj:[],
            hideComment: false,
            aStatus: {
                playedTime: 0,
                loadedTime: 0,
                duration: 0,
                volume: 0,
                controlOn: false,
                isMuted: false
            },
            music: {
                title: 'Rain Drop',
                src: 'http://pic.moelink.site/ed.mp3'
            }
        }
    },
    computed:{
        barvalue:function(){
            return 'width:'+this.ttime/10/this.jumpsec+'%';
        },
        userLogined(){
            return this.User.logined;
        },
        commentMsg(){
            return this.User.logined?"请输入弹幕":"登陆后即可发送弹幕";
        },
    },
    created(){
        clearInterval(this.danmakutimer);
    },
    mounted(){
        this.setMusic();
        this.resetDanmakuPos();
        return;
        //var _this = this;
        // setInterval(()=>{
        //     _this.ttime += 100;
        //     //console.log(_this.ttime);
        //     if(_this.ttime>=1000*_this.jumpsec){
        //         clearInterval(0);
        //         // jump
        //         this.$router.push({path:'/home'});
        //     }
        // },100)
    },
    methods:{
        loginDone(){
            console.log('done');
        },
        setMusic(){
            this.audio = document.getElementById("myAudio");
            this.audio.volume = 0.2;
            this.audio.addEventListener('timeupdate', this.onAudioTimeUpdate);
            this.audio.addEventListener('progress', this.onAudioProgress);  
            this.audio.addEventListener('durationchange', this.onAudioDurationChange);        
            this.audio.addEventListener('volumechange', this.onAudioVolumeChange)
            //this.nextPath = this.Func.ranBG();
        },
        resetDanmakuPos(){
            console.log('reset danmakubox');
            for(var i=0;i<this.danmakuList.length;i++){
                this.initDanmaku(i);
            }
            var _this = this;
            this.danmakutimer = setInterval(()=>{
                _this.moveDanmaku();
            },10)
        },
        initDanmaku(i){
            var div = document.getElementById('dan'+i);
            if(!div) return;
            //console.log('init!');
            div.style.right = '-100px';
            div.style.top = Math.random()*(window.innerHeight-100)+'px';
            div.style.color = 'white';
            div.style.fontSize = 40+Math.random()*30 + 'px';
            var spd = 5 + Math.random()*10;
            if(i in this.danmakuList){
                this.danmakuObj[i] = spd;
            }else{
                this.danmakuObj.push(spd);
            }
        },
        moveDanmaku(){
            //console.log(this.danmakuList.length);
            if(this.hideComment) return;
            for(var i=0;i<this.danmakuList.length;i++){
                var div = document.getElementById('dan'+i);
                if(!div){
                    //console.log('not found:'+i);
                    continue;
                }
                if(!div.style.right){
                    this.initDanmaku(i);
                }
                var x = parseInt(div.style.right);
                if( x > window.innerWidth + 200) continue;
                div.style.right = x + this.danmakuObj[i]/5 + 'px';
            }
        },
        sendComment(){
            if(this.textcomment == '') return;
            this.danmakuList.push(this.textcomment);
            var i = this.danmakuList.length-1;
            var spd = 5 + Math.random()*10;
            this.danmakuObj[i] = spd;
            this.initDanmaku(i);
            this.textcomment = '';
            //console.log(this.textcomment);
        },
        onAudioTimeUpdate(){
            this.aStatus.playedTime = this.audio.currentTime;
        },
        onAudioDurationChange(){
            if (this.audio.duration !== 1) {
                this.aStatus.duration = this.audio.duration;
            }
        },
        onAudioProgress () {
            var len = this.audio.buffered.length;
            if (len) {
                this.aStatus.loadedTime = this.audio.buffered.end(len - 1);
            } else {
                this.aStatus.loadedTime = 0;
            }
        },
        onAudioVolumeChange () {
            this.aStatus.volume = this.audio.volume;
            this.aStatus.isMuted = this.audio.muted;
        }
    },
    components:{
        footPlayer
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
#naviContent{
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.678);
    color: white;
    display: flex;
    align-items: center; /*定义body的元素垂直居中*/
    justify-content: center; /*定义body的里的元素水平居中*/
    flex-direction: column;
}
#bg{
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    //background-image: url(../assets/wallhaven-wy31gr.png);
    filter: blur(4px);
    z-index: 999;
}
#danmakuBox{
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1001;

    .danmaku{
        position: absolute;
        right: -100px;
    }
}
#danmakuBtn{
    position: fixed;
    top: 0;
    display: flex;
    z-index: 1005;
}
#countDownBox{
    display: none;
    position: absolute;
    top: 0;
    width: 100%;
    height: 20px;
    background: skyblue;
    text-align: center;

    span{
        width: 100%;
        height: 20px;
        position: absolute;
        top: 0;
        left: 0;
    }

    #barFore{
        background: yellowgreen;
        width: 100%;
        height: 20px;
    }
}
#mainContent{
    position: relative;
    height: 100%;
    width: 100%;
    background: rgba(0, 0, 0, 0.378);
    //padding-bottom: 40px;
    text-align: center;
    z-index: 1002;
    //margin-bottom: 20px;

    #metroBox{
        align-content: center;
        //width: 400px;
        height: auto;
        margin: auto;
        display: flex;
        align-items: center; /*定义body的元素垂直居中*/
        justify-content: center; /*定义body的里的元素水平居中*/
        flex-direction: column;

        .itemBox{
            position: relative;
            display: inline-block;
            border: 1px solid white;
            box-shadow: 1px 1px gray;
            align-content: center;
            vertical-align: middle;
            border-radius: 5px;
            margin: 10px;
            overflow: hidden;

            &:hover{
                .title{
                    line-height: 50px;
                }
                .hidden{
                    opacity: 1;
                }
            }
            
            .title{
                line-height: 100px;
                font-size: 20px;
                transition: 0.5s ease-in-out;
                //border: 1px solid white;
            }
            .hidden{
                line-height: 50px;
                opacity: 0;
                transition: 0.5s ease-in-out;
            }
        }
        .rect200{
            width: 200px;
            height: 100px;
            //line-height: 100px;
        }
        .rect100{
            width: 100px;
            height: 100px;
            line-height: 100px;
        }
    }
    #footerBox{
        position: absolute;
        bottom: 60px;
        text-align: center;
        vertical-align: middle;
        text-align: center;

        .circleBox{
            display: inline-block;
            border: solid 1px white;
            width: 100px;
            height: 100px;
            border-radius: 50px;
            margin: 10px;
            transition: 0.5s ease-in-out;
            overflow: hidden;

            &:hover{
                transform: rotate(30deg);

                .title{
                    opacity: 0.8;
                }
            }

            .title{
                transition: 0.5s ease-in-out;
                font-size: 24px;
                opacity: 1;
                line-height: 100px;
            }
        }
    }

    #logoBox{
        width: 100%;
        margin-top: 40px;

        &:hover{
            #logo{
                text-shadow: 2px 2px black;
            }
        }

        #logo{
            font-size: 120px;
            vertical-align: baseline;
            transition: 0.5s ease-in-out;
        }
        #underline{
            background: white;
            height: 2px;
            width: 100%;
            margin-bottom: 20px;
            transition: 0.5s ease-in-out;
        }
    }

}


.floatBox{
    display: inline-block;
}
.lineBox{
    height: 10px;
    background: white;
}
.noselect{
    user-select: none;
}
a{
    text-decoration: none;
    color: white;
}
.circleBoxL{
    display: inline-block;
    border: solid 1px white;
    width: 200px;
    height: 200px;
    border-radius: 100px;
    vertical-align: middle;
}
</style>
