<template>

<div class="whitebox">
    <el-button type="text" @click="dialogVisible = true">点击开始舔婊</el-button>

    <el-dialog title="BOSS选择（最多6个）" :visible.sync="dialogVisible" width="50%" :before-close="setToLocal">
        <div id="indexContent">
            <el-checkbox v-for="(ele,index) in bossList" :key="index" v-model="ele.switch">{{ ele.name }}</el-checkbox>
        </div>        
        <span slot="footer" class="dialog-footer">
            <el-button @click="clearFilter">全不选</el-button>
            <!--el-button @click="dialogVisible = false">取 消</el-button-->
            <el-button type="primary" @click="dialogVisible=false">确 定</el-button>
        </span>
    </el-dialog>    
    <el-row>
        <el-col :span="4" v-if="bossFilter.length>=1"><boss-listener :bossName="bossFilter[0].name" /></el-col>
        <el-col :span="4" v-if="bossFilter.length>=2"><boss-listener :bossName="bossFilter[1].name" /></el-col>
        <el-col :span="4" v-if="bossFilter.length>=3"><boss-listener :bossName="bossFilter[2].name" /></el-col>
        <el-col :span="4" v-if="bossFilter.length>=4"><boss-listener :bossName="bossFilter[3].name" /></el-col>
        <el-col :span="4" v-if="bossFilter.length>=5"><boss-listener :bossName="bossFilter[4].name" /></el-col>
        <el-col :span="4" v-if="bossFilter.length>=6"><boss-listener :bossName="bossFilter[5].name" /></el-col>
    </el-row>
    <div>

    </div>
</div>
<!--div class="inset-container">
</div-->
</template>

<script>
/* eslint-disable */
import BossListener from '@/components/BossListener.vue';
export default {
    name: 'RaidFinder',
    data(){
        return {
            bossList: [],
            dialogVisible: false,
            bossBattleRaw: [],
            timer: {}
        }
    },
    created(){        
        var bossf = JSON.parse(localStorage.getItem("bossf"));
        for(var ele of this.Common.bossList){
            let flag = bossf.indexOf(ele.jp) != -1;
            this.bossList.push({
                name: ele.jp,
                switch: flag
            });
        }
        // setInterval(this.queryBoss, 30*1000);
    },
    computed:{
        bossFilter(){
            return this.bossList.filter((x)=>{ return x.switch; });
        },
    },
    methods:{
        clearFilter(){

        },
        setToLocal(done){
            let d = [];
            for(var ele of this.bossFilter){
                d.push(ele.name);
            }
            localStorage.setItem('bossf', JSON.stringify(d));
            done();
        },
        // queryBoss(){
        //     if(this.bossFilter.length == 0) return;
        //     let url = this.Func.GetApi('/gbf');
        //     console.log(url);
        //     this.$http.get(url).then((response)=>{
        //         console.log('get raid boss');
        //         this.bossBattleRaw = this.bossBattleRaw.concat(response.data);
        //         // this.bossBattleRaw = response.data;
        //     },(err)=>{
        //         console.log(err);
        //     });
        // },
    },
    components: {
        BossListener
    }
}
</script>

<style lang="scss">
#gbfapp {
    .naviTop{
        background: rgb(200,240,240);
    }

    #mainBG {
        background-image: url(../../assets/bg_static.jpg);
    }

    // a.router-link-active.router-link-exact-active {
    //     color: white;
    // }
    .grid-content {
        border-radius: 4px;
        min-height: 36px;
    }

    .color-red{
        color: #a32535;
    }
    .color-green{
        color: #539722;
    }
    .color-blue{
        color: #2f60b2;
    }
    .color-yellow{
        color: #b29614;
    }
    .color-light{
        color: #abb283;
    }
    .color-dark{
        color: #3f2843;
    }

    .border-red{
        border-color: #a32535;
    }
    .border-green{
        border-color: #539722;
    }
    .border-blue{
        border-color: #2f60b2;
    }
    .border-yellow{
        border-color: #b29614;
    }
    .border-light{
        border-color: #abb283;
    }
    .border-dark{
        border-color: #3f2843;
    }
    
    .back-red{
        background-color: #a32535;
    }
    .back-green{
        background-color: #539722;
    }
    .back-blue{
        background-color: #2f60b2;
    }
    .back-yellow{
        background-color: #b29614;
    }
    .back-light{
        background-color: #abb283;
    }
    .back-dark{
        background-color: #3f2843;
    }

}
</style>