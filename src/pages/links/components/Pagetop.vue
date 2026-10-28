<template>
<div class="pageTopLink clickable" @click="goTop">
    <a title="Pagetop">PAGETOP</a>
</div>
</template>

<script lang="ts">
export default {
    name: 'PageTop',
    data(){
        return {
            isTop: true,
            timer: null as ReturnType<typeof setInterval> | null
        }
    },
    beforeUnmount(){
        if(this.timer != null){
            clearInterval(this.timer);
        }
    },
    methods: {
        goTop(){
            if(this.timer != null){
                clearInterval(this.timer);
            }
            this.timer = setInterval(() => {
                let osTop = document.documentElement.scrollTop || document.body.scrollTop;
                let ispeed = Math.floor(-osTop / 5);
                document.documentElement.scrollTop = document.body.scrollTop = osTop + ispeed;
                this.isTop = true;
                if (osTop === 0) {
                    if (this.timer != null) {
                        clearInterval(this.timer);
                    }
                    this.timer = null;
                }
            },30)
        }
    }
}
</script>

<style>

</style>
