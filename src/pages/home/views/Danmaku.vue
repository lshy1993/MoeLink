<template>
<div>
    <div class="inset-container">
        <header class="pagehead">
            <h1>弹幕留言</h1>
            <small>前方高能</small>
        </header>
        <transition-group name="fade" tag="ol">
            <li class="section comentbox" v-for="(ele,key) in commentList" :key="key">
                <a class="usericon"><img class="icon48" src=""></a>
                    <div class="inline">
                        <span>{{ ele.user }}</span>
                        <time>{{ changeTime(ele.time) }}</time>
                    </div>
                    <div class="inline">
                        {{ ele.text }}
                        <small>{{ ele.OS }}</small>
                    </div>
            </li>
        </transition-group>
    </div>
    <div>
        发送弹幕
        <input type="textbox" />
        <button>发送</button>
    </div>
</div>
</template>

<script>
import moment from 'moment';
export default {
    name: 'Danmaku',
    data(){
        return {
            commentList: []
        }
    },
    mounted(){
        this.getComments();
    },
    created(){
        this.getComments();
        console.log(window.navigator);
    },
    methods: {
        getComments: function(){
            var url = this.Func.GetApi('main/comment');
            this.$http.get(url).then((response)=>{
                this.commentList = response.data;
            });
        },
        changeTime: function(tt){
            return this.$moment(tt).format('YYYY-MM-DD hh:mm');
        }
    }
}
</script>

<style lang="scss">
.usericon {
    margin-left: -20px;
    float: left;
    //position: relative;
    //left: 0;
}
.comentbox {
    margin-bottom: 10px;
    padding: 10px 10px;
    display: inline-block;
    width: 100%;
    background: rgba(255, 255, 255, 0.8);
    transition-duration: .5s;
}
.inline{
    display: block;
    margin-bottom: 5px;

    time {
        float: right;
    }
    small {
        float: right;
    }
}

</style>
