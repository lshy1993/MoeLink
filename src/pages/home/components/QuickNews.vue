<template>
<div class="topUpdateInfoList clearfixbox">
    <time :class="isNew?'new':''">{{ dateTime }}</time>
    <ul v-html="QNews.innerhtml"></ul>
</div>
</template>

<script>
import moment from 'moment';
export default {
    name: 'QuickNews',
    props: ['isNew','QNews'],
    data(){
        return {

        }
    },
    computed:{
        dateTime: function(){
            return this.$moment(this.QNews.time).format('YYYY/MM/DD');
        }
    },
    methods:{

    }
}
</script>

<style lang="scss">
.topUpdateInfoList {
    font-size: 14px;
    text-align: left;
    margin-top: 15px;
    padding-left: 10px;
    
    time {
        float: left;
        //width: 10%;
        max-width: 130px;
        padding-left: 25px;
        
        &.new {
            background: url(/static/images/new.png) no-repeat 0 2px;
        }
    }

    ul {
        //display: inline-block
        //width: 80%;
            
        li {
            list-style: none;
            margin-left: 130px;
            padding-right: 35px;
            padding-bottom: 8px;
            /*line-height: 1.8em;*/
            a { color: #69F; }
            a:hover { text-decoration: underline; }
        }
    }



    
}
</style>
