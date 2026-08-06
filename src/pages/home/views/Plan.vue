<template>
<div>
    <div class="inset-container">
        <header class="pagehead">
            <h1>开发计划</h1>
            <small>绝对不咕咕咕！（Flag）</small>
        </header>
        <transition-group name="fade">
            <article class="section whitebox" :key="5">
                <h2>月球坠落时
                    <span class="tags">
                        <tag ver="AVG" bgcolor="#ff69b4" />
                        <tag ver="Unity" bgcolor="#4dc71f" />
                    </span>
                </h2>
                <ul>
                    <li>即将诞生的AVG新作，拥有非常强大的美术资源</li>
                    <li>查看<router-link :to="'/'">游戏主页</router-link>，敬请期待！</li>
                </ul>
                <h4>开发进度</h4>
                <ul>
                    <div>保密</div>
                </ul>
                <page-top/>
            </article>
            <article class="section whitebox" :key="4">
                <h2>恋爱与推理
                    <span class="tags">
                        <tag ver="AVG" bgcolor="#ff69b4" />
                        <tag ver="Unity" bgcolor="#4dc71f" />
                        <tag text="Demo" ver="1.40" bgcolor="black" />
                    </span>
                </h2>
                <ul>
                    <li>本作作为组长从小开始的梦想，咕咕咕了多少年后仍旧处于咕咕咕的状态。</li>
                    <li>查看<router-link :to="'/dev/1'">开发进度</router-link>，催更！</li>
                </ul>
                <h4>开发进度</h4>
                <ul>
                    <div>事件进度</div>
                    <div>剧本量</div>
                </ul>
                <page-top/>
            </article>
            <article class="section whitebox" :key="3">
                <h2>时间轮回的终点R
                    <span class="tags">
                        <tag ver="AVG" bgcolor="#ff69b4" />
                        <tag ver="Web" bgcolor="#d8b125" />
                        <tag text="Demo" ver="1.00" bgcolor="black" />
                    </span>
                </h2>
                <ul>
                    <li>作为《恋爱与推理》的番外而<span class="heimu">事先</span>诞生的试水作品，原已发布于橙光游戏</li>
                    <li>在近期会有重置的计划，更替原本的剧本，重置推理要素。</li>
                    <li>重置后的平台暂时选择了轻文演绘。</li>
                </ul>
                <h4>开发进度</h4>
                <ul>
                    <div>剧本进度</div>
                    <div>剧本量</div>
                </ul>
                <page-top/>
            </article>
            <article class="section whitebox" :key="2">
                <h2>科学与魔法
                    <span class="tags">
                        <tag ver="RPG" bgcolor="#f27e40" />
                        <tag ver="BKE" bgcolor="#1082c2" />
                        <tag ver="Planing" bgcolor="black" />
                    </span>
                </h2>
                <ul>
                    <li>作为程序力检测的产物，最早发布于橙光游戏。</li>
                    <li>由于当时的引擎限制，坑了……<span class="heimu">直接拿去参加黑科技比赛了。</span></li>
                    <li>考虑可以重置，最近利用BKE写了一个雏形，有空了填坑。<span class="heimu">发出咕咕咕的的声音</span></li>
                </ul>
                <h4>开发进度</h4>
                <ul>
                    <div>剧本进度</div>
                    <div>剧本量</div>
                </ul>
                <page-top/>
            </article>
            <article class="section whitebox" :key="1">
                <h2>shell+爬虫统计彩票
                    <span class="tags">
                        <tag ver="Program" bgcolor="#d7624b" />
                        <tag ver="Linux" bgcolor="#97c50f" />
                        <tag ver="Planing" bgcolor="black" />
                    </span>
                </h2>
                <ul>
                    <li>作为练习前后端能力的脑洞，统计某一种彩票的号码频率。</li>
                    <li>先利用爬虫获取官方网站的数据，解析Html后，提取写入自己的数据库，挂在vps上每日自动提取</li>
                </ul>
                <h4>开发进度</h4>
                <ul>
                    <div>前端</div>
                    <div>后端</div>
                </ul>
                <page-top/>
            </article>
            <article class="section whitebox" :key="0">
                <h2>群友代购页面
                    <span class="tags">
                        <tag ver="Program" bgcolor="#d7624b" />
                        <tag ver="Web" bgcolor="#d8b125" />
                        <tag ver="Planing" bgcolor="black" />
                    </span>
                </h2>
                <ul>
                    <li>同样是练习前后端能力的脑洞，用于接收群友的11区代购。</li>
                    <li>具体的结构还在思考ing</li>
                </ul>
                <h4>开发进度</h4>
                <ul>
                    <div>前端</div>
                    <div>后端</div>
                </ul>            
                <page-top/>
            </article>
        </transition-group>
    </div>
</div>
</template>

<script>
import Tag from '@components/tag.vue';
import PageTop from '@components/pagetop.vue';

export default {
    name: 'Plan',
    data(){
        return {
            routeActive: true
        }
    },
    created(){
        
    },
    components:{
        Tag,
        PageTop
    }
}
</script>

<style lang="scss">

</style>
