<template>
<div>
    <div class="inset-container">
        <!--正文框架-->
        <article id="aboutsite" class="whitebox header">
            <h3>关于：掀桌&nbsp;(╯‵□′)╯︵┻━┻&nbsp;游戏</h3>
            <aside>
                <time>2014年6月22日&nbsp;</time>
            </aside>
            <h4>网站</h4>
            <ul>
                <li>这里是掀桌游戏小组的网站哟~</li>
                <li>本网站由站长一人独自制作，参考借鉴<span class="heimu" title="你知道的太多了">复制</span>了许多ACG网</li>
                <li>掀桌游戏小组会不定期<span class="heimu" title="你知道的太多了">无期</span>发布制作完成的游戏。</li>
                <li>小组也会在这里贴上最新的制作<span class="heimu" title="你知道的太多了">拖延</span>情报，敬请期待！</li>
            </ul>
            <h4>掀桌游戏</h4>
            <ul>
                <li>掀桌游戏是由一群<span class="heimu" title="你知道的太多了">两位</span>热爱游戏开发的程序员<span class="heimu" title="你知道的太多了">才怪</span>建立的游戏制作<span class="heimu">卖萌</span>小组。</li>
                <li>小组的名字在开会讨论时，因死鱼眼的喵星人打字时意外地打出了&nbsp;(╯‵□′)╯︵┻━┻&nbsp;，</li>
                <li>而组长有着非常大的恶趣味，所以直接决定将&nbsp;(╯‵□′)╯︵┻━┻&nbsp;作为小组的名字。</li>
                <li>团队有着行文细腻<span class="heimu" title="你知道的太多了">谈人生</span>的游戏策划，为游戏设计宏大的世界观。</li>
                <li>团队中也有经验丰富<span class="heimu" title="你知道的太多了">等于零</span>的程序员，开发出新的游戏系统。</li>
                <li>掀桌游戏，只为做自己的游戏。</li>
            </ul>
            <h4>未来规划</h4>
            <ul>
                <li>组内非常缺少会画画的妹子，只有两个大老爷们，将自己的脑洞慢慢的实现。</li>
                <li>如果你是个会画画的妹子，</li>
                <li>如果你是个会脚本的妹子，</li>
                <li>如果你是个会编程的妹子，又对游戏制作有着极大的兴趣，请加入我们！</li>
                <li>我们永远的愿望：我们的游戏能得到你们的肯定，</li>
                <li>如果有一天，我们的游戏能传播到海外，</li>
                <li>如果有一天，有人想将我们的游戏动画化，</li>
                <li>尽管，现在的我们非常的渺小，但我们相信，那一天总会到来！</li>
            </ul>
            <page-top/>
        </article>
        <article id="aboutright" class="whitebox">
            <h3>版权说明</h3>
            <aside>
                <time>2014年6月22日&nbsp;</time>
            </aside>
            <h4>网站版权</h4>
            <ul>
                <li>本网站所有素材部分来自免费网页素材网站，部分素材为网站原创。</li>
                <li>请勿擅自挪用本站的原创素材（如：视频，海报等）如有需要，请联系本站。</li>
                <li>若本网站使用的素材侵犯了您的权益，请立即与本站联系。</li>
            </ul>
            <h4>免费游戏</h4>
            <ul>
                <li>在本网站公布的所有游戏均可以免费下载，试玩。</li>
                <li>若喜欢某一款游戏，欢迎转载，但必须注明游戏发布页面以及原始下载地址。</li>
                <li>若有语言更换的需要，请事先与本站联系，禁止擅自进行语言转换。</li>
                <li>本站公布的游戏，经过原作者同意，可以进行改版，但是发布时必须注明原始作者。</li>
                <li>禁止将公布的免费游戏，以任何的形式进行商业盈利活动。</li>
                <li>本网站及游戏原作者，享有游戏作品的版权以及所有权。</li>
            </ul>
            <h4>素材</h4>
            <ul>
                <li>在本站公开的所有原创素材均可以无偿使用，使用时请注明原作者以及来源。</li>
                <li>若使用的素材作品的非原创，则会在发布页面注明来源以及版权信息。</li>
                <li>请勿擅自使用非原创素材，使用时请遵守原素材的使用要求。</li>
                <li>欢迎对本站游戏内容进行二次创作，若有二次创作作品请告知本站。</li>
                <li>素材作品的所有权及版权归其原作者所有。</li>
            </ul>
            <page-top />
        </article>
    </div>
</div>
</template>

<script>
import PageTop from '@components/pagetop.vue';

export default {
    name: 'SiteIntro',
    data(){
        return {

        }
    },
    methods:{
        top: function(){
            window.scroll(0,0);
        }
    },
    components: {
        PageTop
    }
}
</script>

<style lang="scss">
    /*关于页面*/
    .aboutMe.header {
        margin-top: 30px;
    }
    .aboutMe {
        display: inline-block;
        width: 100%;
        margin-bottom: 30px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.8);
        
        // a {
        // 	color: #69F;
        // 	text-decoration: underline;
        // }
        // a:hover { text-decoration: none; }

        h3 {
            padding: 10px 0 8px 3px;
            font-size: 18px;
            border-bottom: 2px #333 solid;
        }
        h4 {
            text-align: left;
            margin: 10px 0 10px 10px;
            padding-left: 5px;
            font-size: 16px;
            border-left: 3px #333 solid;
        }
        aside {
            padding: 5px 5px 10px 0;
            text-align: right;
            time {
                font-size: 12px;
            }
        }
        ul {
            padding: 10px 30px;
            text-align: left;
            font-size: 14px;
            li { line-height: 1.8em; } 
        }
    }

</style>
 