<template>
<div class="pageTopLink clickable" @click="goTop">
    <a title="Pagetop">PAGETOP</a>
</div>
</template>

<script>
export default {
    name: 'PageTop',
    data(){
        return {
            isTop: true
        }
    },
    methods: {
        goTop(){
            let self = this;
            self.timer = setInterval(function(){
                let osTop = document.documentElement.scrollTop || document.body.scrollTop;
                let ispeed = Math.floor(-osTop / 5);
                document.documentElement.scrollTop = document.body.scrollTop = osTop + ispeed;
                self.isTop = true;
                if (osTop === 0) {
                    clearInterval(self.timer);
                }
            },30)
        }
    }
}
</script>

<style>

</style>
