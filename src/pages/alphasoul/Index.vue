<template>
<div id="index">
    <alpha-soul-live />
    <div style="height: 600px;">
        <announce-news />
        <alpha-soul-status/>
    </div>
</div>
</template>

<script>
import AlphaSoulLive from '@/components/alphasoul/AlphaSoulLive.vue';
import AnnounceNews from '@/components/alphasoul/AnnounceNews.vue';
import AlphaSoulStatus from '@/components/alphasoul/AlphaSoulStatus.vue';

export default {
    name: 'Index',
    data() {
        return {
            ws: Object,
            msg: ''
        }
    },
    methods: {

    },
    components:{
        AlphaSoulLive,
        AnnounceNews,
        AlphaSoulStatus
    }
}
</script>

<style lang="scss">
#index{
    
}
</style>
