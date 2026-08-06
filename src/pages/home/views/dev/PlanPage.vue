<template>
<div>
    <keep-alive>
        <component v-bind:is="currentTabComponent"></component>
    </keep-alive>
</div>
</template>

<script>
import ltdev from './ltdev.vue';

export default {
    name: 'PlanPage',
    data(){
        return {
            tabid: 1,
            tabs: ['ltdev','ltdev']
        }
    },
    computed: {
        currentTabComponent: function () {
            return this.tabs[this.tabid-1];
        }
    },
    beforeRouteUpdate (to, from, next) {
        this.tabid = to.params.id;
        next();
    },
    created(){
        this.tabid = this.$route.params.id;
    },
    components: {
        ltdev,
    }
}
</script>

<style>

</style>
