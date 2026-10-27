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
            <v-chart :option="option_mem"/>
            <v-chart :option="option_cpu"/>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import VChart from 'vue-echarts';

import axios from 'axios';
import CommonData from '../js/data';
import func from '../js/func';
import chartOpt from '../js/charts.js'
import '../style/about.scss';

// 更新图表数据
use([CanvasRenderer, LineChart, TooltipComponent, TitleComponent]);

export default {
    name: 'Status',
    data(){
        return {
            timer: null as ReturnType<typeof setInterval> | null,
            statusList: CommonData.stateCheckList,
            serverMem: {
                total: 0,
                used: 0,
                ratio: 0
            },
            serverCpu: {},
            date: [] as string[],
            mems: [] as number[],
            cpus: [[],[],[],[]] as any,
            option_mem: chartOpt.option_mem as any,
            option_cpu: chartOpt.option_cpu as any
        }
    },
    mounted(){
        
    },
    watch:{

    },
    components:{
        'v-chart': VChart
    },
    beforeUnmount(){
        if(this.timer != null){
            clearInterval(this.timer);
        }
    },
    methods: {
        getState: function(key: number){
            return key;
        },
        onTimer: function(){
            if(this.timer == null){
                this.timer = setInterval(this.getMem, 1000);
            }else{
                clearInterval(this.timer);
                this.timer = null;
            }
            
        },
        getMem: function(){
            let now = new Date();
            if(this.date.length >= 30){
                this.date.shift();
            }
            this.date.push([now.getHours(), now.getMinutes(), now.getSeconds()].join(':'));
            var url1 = func.GetApi("status/mem");
            axios.get(url1).then((response)=>{
                this.serverMem = response.data;
                if(this.mems.length >= 30){
                    this.mems.shift();
                }
                this.mems.push(response.data.ratio);
                this.setMemBar();
            });
            var url2 = func.GetApi("status/cpus");
            axios.get(url2).then((response)=>{
                let cpus = response.data;
                for(var i = 0, len = cpus.length; i < len; i++) {
                    var cpu = cpus[i], total = 0;
                    for(var type in cpu.times) {
                        total += cpu.times[type];
                    }
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
