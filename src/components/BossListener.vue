<template>
<div>
    <h3>{{ bossName }}</h3>
    <div v-for="(ele,index) in bossList" :key="index">
        <el-divider></el-divider>
            <el-row>
                <el-col :span="12">
                    <el-button size="medium">{{ ele.id }}</el-button>
                </el-col>
                <el-col :span="12">
                    <div style="font-size: 14px;">{{ ele.user }}</div>
                    <!--div>{{ ele.txt }}</div-->
                    <div style="color:gray;font-size: 14px;">{{ deltaTime(ele.time) }}</div>
                </el-col>
            </el-row>
    </div>
</div>
</template>

<script>
export default {
    name: "BossListener",
    props: ['bossName'],
    data(){
        return {
            bossList: []
        }
    },
    created(){
        this.queryBoss();
        setInterval(this.queryBoss, 120*1000);
    },
    computed:{
        // bossFilter(){
        //     let dic = this.bossList.filter((x)=>{ return x.boss == this.bossName; });
        //     return dic;
        // },
    },
    methods:{
        deltaTime(time){
            let stillUtc = this.$moment(time,"ddd MMM DD hh:mm:ss Z YYYY");
            let local = stillUtc.toNow(true);
            return local;
        },
        queryBoss(){
            if(!this.bossName) return;
            let url = this.Func.GetApi('/gbf');
            this.$http.post(url,{bossname: this.bossName}).then((response)=>{
                // console.log('get raid boss');
                this.bossList = response.data;
            },(err)=>{
                console.log(err);
            });
        },
    }
}
</script>

<style lang="scss">
.el-divider--horizontal{
    margin: 2px 0;
}
</style>