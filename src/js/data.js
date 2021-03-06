//import nameData from '@/assets/wf2.json';
import charajson from '@/assets/wf3.json';
import equipjson from '@/assets/equip.json';
var langs = [
    {
        locale: 'zh',
        txt: '中文'
    },
    {
        locale: 'ja',
        txt: '日本語'
    },
    {
        locale: 'en',
        txt: 'English'
    }
]

var topBoxList = [
    {
        text: 'AlphaSoul',
        subtext: '人工智障点炮机',
        img: '',
        url: '/alphasoul',
    },
    {
        text: 'Evolve',
        subtext: '进化联机版',
        img: '',
        url: '/evolve2',
    },
    {
        text: 'Re:dive Wiki',
        subtext: '公主链接百科',
        img: '',
        url: '/pcrwiki',
    },
    {
        text: 'World Flipper Wiki',
        subtext: '弹射世界百科',
        img: '',
        url: '/wfwiki',
    },

]

var sideJumpList = [
    {
        url: 'https://luckymiao.site',
        text: 'Site'
    },
    {
        url: 'https://blog.luckymiao.site',
        text: 'Blog'
    },
    {
        url: 'https://liantui.moe',
        text: 'LianTui',
    },
]

var testList = [
    "11111",
    '112312321',
    'aaaaaaaa',
    'ccccc',
    'ssdsdfdsfa'
]

var naviBtn = [
    {
        to: "/wfwiki/",
        url: '',
        txt: "首页"
    },
    {
        to: "/wfwiki/chara",
        url: '',
        txt: "角色"
    },
    // {
    //     to: "/wfwiki/story",
    //     url: '',
    //     txt: "故事"
    // },
    // {
    //     to: "/wfwiki/quest",
    //     url: '',
    //     txt: "地图"
    // },
    {
        to: "/wfwiki/equip",
        url: '',
        txt: "装备"
    },
    // {
    //     to: "/wfwiki/mission",
    //     url: '',
    //     txt: "任务"
    // },
    {
        to: "/wfwiki/simulator",
        url: '',
        txt: "模拟器"
    },
    {
        to: "/wfwiki/about",
        url: '',
        txt: "关于"
    }
]

var wfData = {};
for(var chara of charajson){
    let n = chara.jname;
    wfData[n] = chara;
}
var eqData = {};
for(var equip of equipjson){
    let n = equip.jname;
    eqData[n] = equip;
}

export default{
    langs,
    topBoxList,
    sideJumpList,
    testList,
    naviBtn,
    wfData,
    eqData,
}