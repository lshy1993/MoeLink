var option_mem = {
    title: {
        text: '内存'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            animation: false
        }
    },
    xAxis: {
        type: 'category',
        splitLine: {
            show: false
        },
        data: [1,2,3,4]
    },
    yAxis: {
        type: 'value',
        boundaryGap: [0, '50%'],
        splitLine: {
            show: false
        }
    },
    series: [{
        name: '使用率',
        type: 'line',
        smooth: true,
        symbol: 'none',
        stack: 'a',
        areaStyle: {
            normal: {}
        },
        showSymbol: false,
        hoverAnimation: false,
        data: [2,2,2,2]
    }]
};

var option_cpu = {
    title: {
        text: 'CPU'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            animation: false
        }
    },
    xAxis: {
        type: 'category',
        splitLine: {
            show: false
        },
        data: [1,2,3,4]
    },
    yAxis: {
        type: 'value',
        boundaryGap: [0, '50%'],
        splitLine: {
            show: false
        }
    },
    series: [{
        name: '使用率',
        type: 'line',
        smooth: true,
        symbol: 'none',
        stack: 'a',
        areaStyle: {
            normal: {}
        },
        showSymbol: false,
        hoverAnimation: false,
        data: [2,2,2,2]
    }]
};

export default {
    option_mem,
    option_cpu
}