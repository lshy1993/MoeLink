// 导入 JSON 数据
import charajson from '../assets/wf3.json';
import equipjson from '../assets/equip.json';
import bossList from '../assets/gbf2.json';

// 定义接口类型
interface Language {
  locale: string;
  txt: string;
}

interface TopBoxItem {
  text: string;
  subtext: string;
  img: string;
  url: string;
}

interface SideJumpItem {
  url: string;
  text: string;
}

interface NaviButton {
  to: string;
  url: string;
  txt: string;
}

interface Character {
  jname: string;
  [key: string]: any; // 允许其他任意属性
}

interface Equipment {
  jname: string;
  [key: string]: any; // 允许其他任意属性
}

interface Boss {
  [key: string]: any; // 允许任意属性，根据实际JSON结构调整
}

type CharacterDictionary = Record<string, Character>;
type EquipmentDictionary = Record<string, Equipment>;

// 语言配置
const langs: Language[] = [
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
];

// 顶部导航盒子列表
const topBoxList: TopBoxItem[] = [
  {
    text: 'AlphaSoul',
    subtext: '人工智障点炮机',
    img: '',
    url: '/alphasoul',
  },
  {
    text: 'Re:dive Wiki',
    subtext: '公主连结百科',
    img: '',
    url: '/pcrwiki',
  },
  {
    text: 'World Flipper Wiki',
    subtext: '弹射世界百科',
    img: '',
    url: '/wfwiki',
  },
  {
    text: 'Evolve',
    subtext: '进化联机版',
    img: '',
    url: '/evolve2',
  },
  {
    text: 'GBF',
    subtext: '碧蓝幻想',
    img: '',
    url: '/gbf',
  },
];

// 侧边跳转链接列表
const sideJumpList: SideJumpItem[] = [
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
];

// 测试弹幕列表
const testList: string[] = [
  "11111",
  '112312321',
  'aaaaaaaa',
  'ccccc',
  'ssdsdfdsfa'
];

// World Flipper 导航按钮
const naviBtnWF: NaviButton[] = [
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
];

// GBF 导航按钮
const naviBtnGBF: NaviButton[] = [
  {
    to: "/gbf",
    url: '',
    txt: "首页"
  },
  {
    to: "/gbf/chara",
    url: '',
    txt: "角色"
  },
  // {
  //     to: "gbf/equip",
  //     url: '',
  //     txt: "装备"
  // },
  // {
  //     to: "gbf/simulator",
  //     url: '',
  //     txt: "模拟器"
  // },
  {
    to: "/gbf/about",
    url: '',
    txt: "关于"
  }
];

// PCR 导航按钮（暂时为空）
const naviBtnPCR: NaviButton[] = [];

// 处理角色数据 - 转换为字典格式
const wfData: CharacterDictionary = {};
if (Array.isArray(charajson)) {
  for (const chara of charajson) {
    if (chara && typeof chara === 'object' && 'jname' in chara) {
      const character = chara as Character;
      const name = character.jname;
      if (name) {
        wfData[name] = character;
      }
    }
  }
}

// 处理装备数据 - 转换为字典格式
const eqData: EquipmentDictionary = {};
if (Array.isArray(equipjson)) {
  for (const equip of equipjson) {
    if (equip && typeof equip === 'object' && 'jname' in equip) {
      const equipment = equip as Equipment;
      const name = equipment.jname;
      if (name) {
        eqData[name] = equipment;
      }
    }
  }
}

// 导出所有数据
export {
  langs,
  topBoxList,
  sideJumpList,
  testList,
  naviBtnWF,
  naviBtnGBF,
  naviBtnPCR,
  wfData,
  eqData,
  bossList
};

// 导出类型
export type {
  Language,
  TopBoxItem,
  SideJumpItem,
  NaviButton,
  Character,
  Equipment,
  Boss,
  CharacterDictionary,
  EquipmentDictionary
};

// 默认导出（保持向后兼容）
export default {
  langs,
  topBoxList,
  sideJumpList,
  testList,
  naviBtnWF,
  naviBtnGBF,
  naviBtnPCR,
  wfData,
  eqData,
  bossList
};