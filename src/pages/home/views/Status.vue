<template>
<div>
    <div class="inset-container">
        <div class="section identity-category grid-container">
            <h2 class="title">
                <i aria-hidden="true" class="fas fa-chevron-right"></i>State
            </h2>
            <li class="identity" v-for="(ele,key) in statusList" v-bind:key="key">
                <div class="clickable">
                    <i aria-hidden="true" class="fas fa-registered"></i>
                    <span class="servername">{{ ele }}</span>
                    <i class="servericon">icon</i>
                    <span class="log">{{ getState(key) }}</span>
                </div>
            </li>
        </div>
        <button type="button" @click="onTimer">aaaaa</button>
        <div class="section identity-category grid-container">
            <v-chart :options="option_mem"/>
            <v-chart :options="option_cpu"/>
        </div>
    </div>
</div>
</template>

<script>
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';

import chartOpt from '../js/charts.js'
import '../style/about.scss';

export default {
    name: 'Status',
    data(){
        return {
            timer: null,
            statusList: this.Common.stateCheckList,
            serverMem: {
                total: 0,
                used: 0,
                ratio: 0
            },
            serverCpu: {},
            date: [],
            mems: [],
            cpus: [[],[],[],[]],
            option_mem: chartOpt.option_mem,
            option_cpu: chartOpt.option_cpu
        }
    },
    mounted(){
        
    },
    watch:{

    },
    methods: {
        getState: function(key){
            return key;
        },
        onTimer: function(){
            if(this.timer == null){
                this.timer = setInterval(this.getMem, 1000);
            }else{
                clearInterval(this.getMem);
            }
            
        },
        getMem: function(){
            let now = new Date();
            if(this.date.length >= 30){
                this.date.shift();
            }
            this.date.push([now.getHours(), now.getMinutes(), now.getSeconds()].join(':'));
            var url1 = this.Func.GetApi("status/mem");
            this.$http.get(url1).then((response)=>{
                this.serverMem = response.data;
                if(this.mems.length >= 30){
                    this.mems.shift();
                }
                this.mems.push(response.data.ratio);
                this.setMemBar();
            });
            var url2 = this.Func.GetApi("status/cpus");
            this.$http.get(url2).then((response)=>{
                let cpus = response.data;
                for(var i = 0, len = cpus.length; i < len; i++) {
                    var cpu = cpus[i], total = 0;
                    for(var type in cpu.times) {
                        total += cpu.times[type];
                    }
                    // for(type in cpu.times) {
                    //     console.log("\t", type, Math.round(100 * cpu.times[type] / total));
                    // }
                    let ratio = Math.round(100 * cpu.times.idle / total);
                    if(this.cpus[i].length >= 30){
                        this.cpus[i].shift();
                    }
                    this.cpus[i].push(ratio);
                }
                this.setCpuBar();
            });
        },
        setMemBar: function(){
            this.option_mem.series[0].data = this.mems;
            this.option_mem.xAxis.data = this.date;
        },
        setCpuBar: function(){
            this.option_cpu.series[0].data = this.cpus[0];
            this.option_cpu.xAxis.data = this.date;
        }

    },
    components:{
        'v-chart': ECharts
    }
}
</script>

<style lang="scss">
    .identity {
        .servername {
            display: inline-block;
            width: 30%;
        }
        .servericon {
            display: inline-block;
            width: 5%;
        }
        .log {
            display: inline-block;
            text-align: right;
            width: 60%;
        }
    }

</style>
