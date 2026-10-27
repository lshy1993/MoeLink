<template>
<div class="inset-container">
    <div id="sloganBox">
        <div id="indexPostBig">
            <p id="topSlogan-01"><span>掀桌游戏(╯‵□′)╯︵┻━┻</span></p>
            <p id="topSlogan-02"><span>——用心做自己的游戏</span></p>
        </div>
        <div id="indexPostSmall">
            <p id="topPost-01"><span>游戏是我们的过去，</span></p>
            <p id="topPost-02"><span>亦是我们的生活，</span></p>
            <p id="topPost-03"><span>是未来的梦想。</span></p>
        </div>
    </div>
    <div id="quickNavi" class="clearfixbox">
        <!--div id="infoControlPrev"><a class="prev browse"></a></div>
        <div id="infoControlNext"><a class="next browse"></a></div-->
        <div v-for="(value,index) in topBoxList" :key="index" class="naviBlock clearfixbox">
            <div class="blockBg clearfix">
                <div class="movingBg" :style="getImageStyle(value.backimg)" />
            </div>
            <div class="blockWrap clearfix">
                <h2>{{ value.title }}</h2>
                <p class="blockSummary">{{ value.summary }}</p>
                <div class="line"/>
                <div class="blockFoot">{{ value.author }}</div>
                <a :href="value.link" />
            </div>
        </div>
    </div>
    <div id="indexUpdateInfo">
        <div id="indexNews">
            <div class="updateTitle">最新消息</div>
            <transition-group name="fade" tag="div" id="indexNewsWrap">
                <quick-news v-for="(ele,key) in newsList" :key="key" :isNew="key==0?true:false" :QNews="ele"/>
            </transition-group>
        </div>
        <div id="indexSns">
            <div class="updateTitle">twitter</div>
            <div id="indexSnsWrap"></div>
        </div>
    </div>
    <div class="floatSu">
        <img src="https://luckymiao.site/static/images/fsu.jpg" />
    </div>
</div>
</template>

<script>
import '../style/index.scss';
import axios from 'axios';
import CommonData from '../js/data';
import func from '../js/func';
import QuickNews from '../components/QuickNews.vue';
export default {
    name: 'Index',
    data(){
        return {
            newsList: [],
            topBoxList: CommonData.topBoxList
        }
    },
    created(){
        this.getNewsList();
    },
    methods:{
        getImageStyle(filename){
            return "background-image:url(https://luckymiao.site/static/images/"+filename+")"; 
        },
        getNewsList(){
            var url = func.GetApi("main/news");
            axios.get(url).then((response)=>{
                this.newsList = response.data;
            });
        }
    },
    components:{
        QuickNews
    }
}
</script>

<style lang="scss">
    .floatsu {
        position: fixed;
        right: 40px;
        bottom: 40px;
        width: 200px;
        z-index: 1010;
    }
</style>
