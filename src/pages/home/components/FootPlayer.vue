<template>
<div id="footPlayer">
    <div v-if="audioStatus.controlOn" class="musicListBox">
        <ol>
            <li>1</li>
            <li>2</li>
            <li>3</li>
        </ol>
    </div>
    <div class="player">
        <div class="leftPart">
            <div @click="clickBar" class="playButton">{{ this.audio.paused?'play':'pause' }}</div>
        </div>
        <div class="rightPart">
            <div @click="showPlayer">{{ music.title }}</div>
            <div style="display:block;">
                <div @mousedown="onMouseDown" ref="barWrap" class="progressBack">
                    <div class="progressFore" :style="'width:'+playProgress*100+'%'" />
                    <div class="bufferFore" :style="'width:'+loadProgress*100+'%'" />
                </div>
                <div class="timeText">
                    <span>{{ changeTime(audioStatus.playedTime) }}</span>/
                    <span>{{ changeTime(audioStatus.duration) }}</span>
                </div>
                <div @mousedown="onVolumeMouseDown" ref="volumeWrap" class="volumeBar">
                    <div class="volumeFore" :style="'width:'+audioStatus.volume*100+'%'" />
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import moment from 'moment';
export default {
    name: 'FootPlayer',
    props: ['music','audioStatus'],
    data(){
        return {
            audio: Object
        }
    },
    mounted(){
        this.audio = document.getElementById("myAudio");
    },
    computed:{
        playProgress: function(){
            return this.audioStatus.playedTime / this.audioStatus.duration;
        },
        loadProgress: function(){
            return this.audioStatus.loadedTime / this.audioStatus.duration;
        }
    },
    methods:{
        clickBar: function clicks() {
            //console.log(this.audio.play);
            if(this.audio.paused){
                this.audio.play();
            }else{
                this.audio.pause();
            }
        },
        showPlayer: function(){
            this.audioStatus.controlOn = !this.audioStatus.controlOn;
        },
        onMouseDown (e) {
            const barWidth = this.$refs.barWrap.clientWidth;
            let percentage = (e.clientX-this.getElementViewLeft(this.$refs.barWrap)) / barWidth;
            percentage = percentage > 0 ? percentage : 0;
            percentage = percentage < 1 ? percentage : 1;
            this.audio.pause();
            this.audio.currentTime = this.audio.duration * percentage;
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);
        },
        onMouseMove (e) {
            const barWidth = this.$refs.barWrap.clientWidth;
            let percentage = (e.clientX-this.getElementViewLeft(this.$refs.barWrap)) / barWidth;
            percentage = percentage > 0 ? percentage : 0;
            percentage = percentage < 1 ? percentage : 1;
            this.audio.currentTime = this.audio.duration * percentage;
        },
        onMouseUp (e) {
            document.removeEventListener('mouseup', this.onMouseUp);
            document.removeEventListener('mousemove', this.onMouseMove);
            // const barWidth = this.$refs.barWrap.clientWidth;
            // let percentage = (e.clientX-this.getElementViewLeft(this.$refs.barWrap)) / barWidth;
            // percentage = percentage > 0 ? percentage : 0;
            // percentage = percentage < 1 ? percentage : 1;
            // this.audio.currentTime = this.audio.duration * percentage;
            this.audio.play();
        },
        onVolumeMouseDown (e) {
            const barWidth = this.$refs.volumeWrap.clientWidth;
            let percentage = (e.clientX-this.getElementViewLeft(this.$refs.volumeWrap)) / barWidth;
            percentage = percentage > 0 ? percentage : 0;
            percentage = percentage < 1 ? percentage : 1;
            this.audio.volume = percentage;
            document.addEventListener('mousemove', this.onVolumeMouseMove);
            document.addEventListener('mouseup', this.onVolumeMouseUp);
        },
        onVolumeMouseMove (e) {
            const barWidth = this.$refs.volumeWrap.clientWidth;
            let percentage = (e.clientX-this.getElementViewLeft(this.$refs.volumeWrap)) / barWidth;
            percentage = percentage > 0 ? percentage : 0;
            percentage = percentage < 1 ? percentage : 1;
            this.audio.volume = percentage;
            console.log(percentage);
        },
        onVolumeMouseUp (e) {
            document.removeEventListener('mouseup', this.onVolumeMouseUp);
            document.removeEventListener('mousemove', this.onVolumeMouseMove);
        },
        changeTime: function(ft){
            return this.$moment(ft*1000).format('mm:ss');
        },
        getElementViewLeft (element) {
            let actualLeft = element.offsetLeft;
            let current = element.offsetParent;
            let elementScrollLeft;
            while (current !== null) {
                actualLeft += current.offsetLeft;
                current = current.offsetParent;
            }
            elementScrollLeft = document.body.scrollLeft + document.documentElement.scrollLeft;
            return actualLeft - elementScrollLeft;
        }

    }
}
</script>

<style lang="scss">
#footPlayer {
    position: fixed;
    width: 100%;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1011;
    user-select: none;
    color: white;

    .player {
        display: flex;
        height: 60px;
        width: 980px;
        margin: 0 auto;
        padding: 10px 0;
        line-height: 20px;
        box-sizing: border-box;
    }

    .leftPart {
        position: relative;
        display: inline-block;
        vertical-align: top;
        margin: 0 10px; 
        width: auto;

        .playButton {
            height: 40px;
            width: 40px;
            border: 1px solid white;
        }
    }
    
    .rightPart {
        position: relative;
        display: inline-block;
        flex-grow: 1;
        padding-left: 10px;
        padding-right: 10px;

        .progressBack {
            position: relative;
            display: inline-block;
            height: 10px;
            width: 70%;
            background: white;

            .progressFore {
                z-index: 1003;
                position: absolute;
                background: rgb(65, 184, 131);
                height: 100%;
                //transition: all .5s ease;
            }
            .bufferFore {
                z-index: 1002;
                position: absolute;
                background: #aaa;
                height: 100%;
                transition: all .5s ease;
                will-change: width;
            }
        }

        .timeText {
            display: inline-block;
            text-align: center;
            width: 120px;
            // margin-left: 10px;
            // margin-right: 10px;
        }

        .volumeBar {
            display: inline-block;
            width: calc(30% - 130px);
            position: relative;
            height: 10px;
            background: grey;

            .volumeFore {
                position: absolute;
                background: rgb(65, 184, 131);
                height: 100%;
                //transition: all .5s ease;
            }
        }
    }

    .musicListBox{
        position: absolute;
        width: 100%;
        bottom: 60px;
        text-align: center;

        ol {
            height: 200px;
            width: 980px;
            background: rgba(0, 0, 0, 0.9);
            margin: 0 auto;
        }
    }
}
</style>
