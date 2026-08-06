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
var naviTopBtn = [
    {
        to: "/about",
        txt: 'navt.about',
    },
    // {
    //     to: "/download",
    //     txt: 'navt.download'
    // },
    {
        to: "/danmu",
        txt: 'navt.danmaku'
    }
];

var sideList = [
    {
        to: "/news",
        txt: "navs.news"
    },
    {
        to: "/works",
        txt: "navs.works"
    },
    {
        to: "/dev",
        txt: "navs.dev"
    },
    {
        to: "/intro",
        txt: 'navt.site',
    },
    {
        to: "/member",
        txt: "navs.member"
    },
    {
        to: "/goods",
        txt: "navs.goods"
    },
    {
        to: "/link",
        txt: "navs.link"
    },
    {
        to: "/status",
        txt: "navs.io"
    }
];

var sideBoxList= [
    {
        ch: 'PW',
        hint: 'PcrWiki',
        link: 'https://pcrwiki.liantui.moe'
    },
    {
        ch: 'AS',
        hint: 'AlphaSoul',
        link: 'https://alphasoul.liantui.moe'
    },
    {
        ch: 'MoeL',
        hint: 'MoeLink',
        link: 'https://moelink.site'
    },
    {
        ch: 'MF',
        hint: 'MoonFall',
        link: 'https://moelink.site'
    },
    {
        ch: 'LT',
        hint: 'LianTui',
        link: 'https://moelink.site'
    },
    {
        ch: 'Blog',
        hint: 'Blog',
        link: 'https://blog.liantui.moe'
    },
]

var snsList = [
    {
        href: "https://github.com/lshy1993",
        class: "fa-github",
        where: "github",
        link: "@lshy1993"
    },
    {
        href: "",
        class: "fa-bili",
        where: "bilibili",
        link: "-"
    },
    {
        href: "https://twitter.com/lshy1993",
        class: "fa-twitter",
        where: "twitter",
        link: "@lshy1993"
    },
    {
        href: "http://weibo.com",
        class: "fa-weibo",
        where: "weibo",
        link: "@幸运的路奇"
    },
    {
        href: "https://telegram.me",
        class: "fa-telegram",
        where: "telegram",
        link: "Null"
    },
    {
        href: "https://keybase.io",
        class: "fa-key",
        where: "keybase",
        link: "Null"
    },
]

var gameIdList = [
    {
        where: "BandG",
        link: "MIAO",
        id: "999999999"
    },
    {
        where: "Pcr",
        link: "MIAO",
        id: "999999999"
    },
    {
        where: "碧蓝航线",
        link: "MIAO",
        id: "999999999"
    },
    {
        where: "FLower Knight",
        link: "MIAO",
        id: "999999999"
    },
    {
        where: "神姬Project",
        link: "MIAO",
        id: "999999999"
    },
    {
        where: "雀魂",
        link: "MIAO",
        id: "999999999"
    },
]

var stateCheckList = [
    'MainSite',
    'Server',
    'Blog',
    'MainAPI',
    'PcrWiki',
    'GalWiki'
]

var topBoxList = [
    {
        backimg: 'still_unit_100131.png',
        title: 'PcrWiki',
        summary: '公主链接Wiki，摸鱼缓慢更新中',
        author: '幸运的路奇',
        link: "https://pcrwiki.luckymiao.site"
    },
    {
        backimg: 'still_unit_102031.png',
        title: '恋爱与推理',
        summary: '校园恋爱推理AVG，绝赞咕咕咕中',
        author: '幸运的路奇',
        link: "https://liantui.moe"
    },
    {
        backimg: 'still_unit_107831.png',
        title: '时间轮回的终点',
        summary: '轮回向解密AVG，绝赞咕咕咕中',
        author: '幸运的路奇',
        link: "https://liantui.moe"
    },
]

var ltRoute = [
    {
        routename: '苏梦忆',
        color: '',
        chapter:[
            {"id":"1","chapter_num":"0","chapter_route":"1","chapter_name":"擦肩而过的学妹","chapter_type":"0","status":"1","words":"0"},
            {"id":"2","chapter_num":"1","chapter_route":"1","chapter_name":"共同的新生会","chapter_type":"0","status":"1","words":"0"},
            {"id":"3","chapter_num":"2","chapter_route":"1","chapter_name":"学生会的跑腿","chapter_type":"0","status":"1","words":null}]
    },
    {
        routename: '西门吹',
        color: '',
        nums: [1,1,1,1,0,0,-1,-1,-1,-1]
    },
    {
        routename: '推理社',
        color: '',
        nums: [1,1,1,1,0,0,-1,-1,-1,-1]
    },
    {
        routename: '欧阳晓芸',
        color: '',
        nums: [1,1,1,1,0,0,-1,-1,-1,-1]
    },
    {
        routename: '车小曼',
        color: '',
        nums: [1,1,1,1,0,0,-1,-1,-1,-1]
    },
    {
        routename: '陈海瑶',
        color: '',
        nums: [1,1,1,1,0,0,-1,-1,-1,-1]
    }
]

var uraSite = false;
var sideHide = false;
var editor = false;
var admin = false;

export default{
    langs,
    naviTopBtn,
    sideList,
    snsList,
    gameIdList,
    sideBoxList,
    topBoxList,
    stateCheckList,
    uraSite,
    sideHide,
    editor,
    admin,
    ltRoute
}