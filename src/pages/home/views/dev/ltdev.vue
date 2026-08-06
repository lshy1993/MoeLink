<template>
<div class="inset-container">
    <header class="pagehead">
        <h1>恋爱与推理</h1>
    </header>
    <article class="section whitebox header]">
        <h3>剧本进度</h3>
        <h4>合计</h4>
        <ul>10/100</ul>
        <h4>详情</h4>
        <div class="ltdevcontent clearfixbox">
            <div class="routebox clearfix" v-for="(ele,key) in croutes" :key="key">
                <div class="routehead">
                    <span v-if="!Common.editor" class="routename" :style="{'color':ele.color}">{{'事件'+key}}</span>
                    <span v-if="Common.editor" class="routename" :style="{'color':ele.color}">{{ ele.routename }}</span>
                    <span class="progress">{{ getProgress(ele.chapter) }}</span>
                </div>
                <div class="event" v-for="(ch,index) in ele.chapter" :key="index">
                    <div>{{ ch.chapter_name }}</div>
                    <div>类型：普通事件</div>
                    <div v-if="ch.status==1">状态:<span class="done">已完成</span></div>                    
                    <div v-if="ch.status==-1">状态:<span class="edit">编辑中</span></div>                    
                    <div v-if="ch.status==0">状态:<span class="outline">仅大纲</span></div>
                </div>
            </div>
        </div>
        
        <page-top />
    </article>
</div>
</template>

<script>
import PageTop from '@components/pagetop.vue';

export default {
    name: 'ltdev',
    data(){
        return {
            croutes: this.Common.ltRoute,
        }
    },
    methods: {
        getProgress: function(nums){
            console.log(nums);
            var sum = 0;
            if(nums == undefined) return;
            for(var chapter in nums){
                if(chapter==2) sum += 1;
            }
            return sum+'/'+nums.length;
        }
    },
    components:{
        PageTop
    }
}
</script>

<style lang="scss">
.ltdevcontent {

    .routebox {
        width: 150px;
        margin: 2px;

        .routehead {
            display: block;
            color: black;
            background: pink;
            text-align: center;

            .routename {
                display: block;
                color: red;
            }

            .progress {
                display: block;
            }
        }

        .event {
            margin-bottom: 4px;
            background: white;

            .done {
                color: green;
            }

            .edit {
                color: blue;
            }

            .outline {
                color: grey;
            }
        }

    }

}
</style>