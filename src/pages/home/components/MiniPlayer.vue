<template>
<div id="miniPlayer">
    <div @click="clickBar" class="pauseDiv">{{ audio.paused?'play':'pause' }}</div>
    <div @mousedown="onMiniMouseDown" ref="miniBar" class="progressBack">
        <div class="progressFore" :style="'width:'+playProgress*100+'%'"></div>
        <div class="bufferFore" :style="'width:'+loadProgress*100+'%'"></div>
    </div>
    <span class="titleText">{{ musictitle }}</span>
</div>
</template>

<script>
export default {
    name: 'MiniPlayer',
    props: ['musictitle','audioStatus'],
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
            if(!this.audio) return;
            if(this.audio.paused){
                this.audio.play();
            }else{
                this.audio.pause();
            }
        },
        onMiniMouseDown (e) {
            const barWidth = this.$refs.miniBar.clientWidth;
            let percentage = (e.clientX-this.getElementViewLeft(this.$refs.miniBar)) / barWidth;
            percentage = percentage > 0 ? percentage : 0;
            percentage = percentage < 1 ? percentage : 1;
            this.audio.pause();
            this.audio.currentTime = this.audio.duration * percentage;
            document.addEventListener('mousemove', this.onMiniMouseMove);
            document.addEventListener('mouseup', this.onMiniMouseUp);
        },
        onMiniMouseMove (e) {
            const barWidth = this.$refs.miniBar.clientWidth;
            let percentage = (e.clientX-this.getElementViewLeft(this.$refs.miniBar)) / barWidth;
            percentage = percentage > 0 ? percentage : 0;
            percentage = percentage < 1 ? percentage : 1;
            this.audio.currentTime = this.audio.duration * percentage;
        },
        onMiniMouseUp (e) {
            document.removeEventListener('mouseup', this.onMiniMouseUp);
            document.removeEventListener('mousemove', this.onMiniMouseMove);
            // const barWidth = this.$refs.miniBar.clientWidth;
            // let percentage = (e.clientX-this.getElementViewLeft(this.$refs.miniBar)) / barWidth;
            // percentage = percentage > 0 ? percentage : 0;
            // percentage = percentage < 1 ? percentage : 1;
            // this.audio.currentTime = this.audio.duration * percentage;
            this.audio.play();
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
#miniPlayer{
    margin-left: 5px;
    width: 190px;
    .pauseDiv{
        margin: auto;
    }
    .progressBack{
        position: relative;
        height: 20px;
        background: white;
    }
    .progressFore{
        z-index: 1003;
        position: absolute;
        background: rgb(65, 184, 131);
        height: 100%;
    }
    .bufferFore{
        z-index: 1002;
        position: absolute;
        background: #aaa;
        height: 100%;
    }
    .titleText{
        font-size: 12px;
        overflow: hidden;
        text-align: left;
    }
}
</style>
