<template>
<div>
    <div class="inset-container">
        <header class="pagehead">
            <h1>最新消息</h1>
            <small></small>
        </header>
        <transition-group name="fade">
            <article :class="['section','whitebox',key==0?'header':'']" v-for="(ele,key) in newsList" :key="key">
                <h3>{{ ele.title }}</h3>
                <aside>
                    <time>{{ changeTime(ele.time) }}</time>
                </aside>
                <h4>{{ ele.sub }}</h4>
                <ul v-html="ele.innerhtml"></ul>
                <page-top v-if="key>3" />
            </article>
        </transition-group>
    </div>
</div>
</template>

<script>
import moment from 'moment';
import PageTop from '@components/pagetop.vue';

export default {
    name: 'News',
    data(){
        return {
            newsList: []
        }
    },
    created(){
        this.getNewsList();
    },
    methods:{
        getNewsList(){
            var url = this.Func.GetApi("main/news");
            this.$http.get(url).then((response)=>{
                this.newsList = response.data;
            });
        },
        changeTime: function(tt){
            return this.$moment(tt).format('YYYY年MM月DD日');
        }
    },
    components: {
        PageTop
    }
}
</script>

 <style lang="scss">

 </style>
 